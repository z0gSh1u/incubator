/**
 * OpenAI 兼容 API 客户端
 * 支持 OpenAI、DeepSeek、Moonshot、智谱、Ollama 等
 */

export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface StreamCallbacks {
  onToken: (token: string) => void
  onComplete: () => void
  onError: (error: Error) => void
}

export interface ChatOptions {
  messages: Message[]
  signal?: AbortSignal
  temperature?: number
  maxTokens?: number
}

// 从环境变量读取配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
const API_KEY = import.meta.env.VITE_API_KEY || ''
const MODEL = import.meta.env.VITE_MODEL || 'gpt-3.5-turbo'

/**
 * 流式聊天请求
 */
export async function streamChat(
  options: ChatOptions,
  callbacks: StreamCallbacks,
): Promise<void> {
  const { messages, signal, temperature = 0.7, maxTokens = 2048 } = options

  if (!API_BASE_URL || !API_KEY) {
    callbacks.onError(new Error('请先配置 API：复制 .env.example 为 .env.local'))
    return
  }

  const url = `${API_BASE_URL}/v1/chat/completions`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        stream: true,
        temperature,
        max_tokens: maxTokens,
      }),
      signal,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`API 错误 (${response.status}): ${error}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('无法获取响应流')
    }

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        callbacks.onComplete()
        break
      }

      buffer += decoder.decode(value, { stream: true })

      // 解析 SSE 数据
      const lines = buffer.split('\n')
      buffer = lines.pop() || '' // 保留不完整的行

      for (const line of lines) {
        const trimmed = line.trim()

        if (!trimmed || trimmed === 'data: [DONE]') {
          continue
        }

        if (trimmed.startsWith('data: ')) {
          try {
            const json = JSON.parse(trimmed.slice(6))
            const content = json.choices?.[0]?.delta?.content

            if (content) {
              callbacks.onToken(content)
            }
          } catch {
            // 忽略解析错误，可能是不完整的 JSON
          }
        }
      }
    }
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      callbacks.onComplete()
    } else {
      callbacks.onError(error as Error)
    }
  }
}

/**
 * 获取配置状态
 */
export function getConfigStatus() {
  return {
    isConfigured: Boolean(API_BASE_URL && API_KEY),
    baseUrl: API_BASE_URL,
    model: MODEL,
  }
}
