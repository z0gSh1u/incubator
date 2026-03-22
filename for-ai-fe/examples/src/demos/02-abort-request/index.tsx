/**
 * Demo 02: 中断请求
 *
 * 演示使用 AbortController 中断流式请求：
 * - 创建 AbortController 并传入 signal
 * - 用户点击停止时调用 abort()
 * - 处理 AbortError 异常
 */

import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { streamChat, Message } from '../../client'
import styles from './index.module.css'

interface DisplayMessage extends Message {
  id: string
  aborted?: boolean
}

export function AbortRequestDemo() {
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 保存当前的 AbortController
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return

    const userMessage: DisplayMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    }

    const assistantMessage: DisplayMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
    }

    setMessages((prev) => [...prev, userMessage, assistantMessage])
    setInput('')
    setIsStreaming(true)

    // 创建新的 AbortController
    abortControllerRef.current = new AbortController()

    await streamChat(
      {
        messages: [
          {
            role: 'system',
            content:
              '你是一个 AI 助手。请用较长的篇幅回答问题，以便用户可以测试中断功能。',
          },
          ...messages.map(({ role, content }) => ({ role, content })),
          { role: 'user', content: input.trim() },
        ],
        signal: abortControllerRef.current.signal,
      },
      {
        onToken: (token) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessage.id
                ? { ...msg, content: msg.content + token }
                : msg,
            ),
          )
        },
        onComplete: () => {
          setIsStreaming(false)
          abortControllerRef.current = null
        },
        onError: (error) => {
          // 检查是否是用户主动中断
          const isAborted = error.name === 'AbortError'

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessage.id
                ? {
                    ...msg,
                    content: isAborted
                      ? msg.content + '\n\n⏹️ *[已停止生成]*'
                      : `❌ 错误: ${error.message}`,
                    aborted: isAborted,
                  }
                : msg,
            ),
          )
          setIsStreaming(false)
          abortControllerRef.current = null
        },
      },
    )
  }

  // 停止生成
  const handleAbort = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="demo-page">
      <div className="demo-header">
        <Link to="/" className="back-btn">
          ← 返回
        </Link>
        <h1>02 - 中断请求</h1>
      </div>

      <div className="demo-description">
        <h3>💡 核心知识点</h3>
        <p>
          使用 <code>AbortController</code> 中断进行中的 fetch 请求。创建 controller
          后，将 <code>signal</code> 传入 fetch，需要中断时调用{' '}
          <code>controller.abort()</code>。
        </p>
      </div>

      <div className="chat-container">
        <div className="messages">
          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="icon">⏹️</div>
              <p>发送消息后，可以随时点击"停止"中断生成</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`message ${msg.role} ${msg.aborted ? 'aborted' : ''}`}
              >
                <div className="message-role">
                  {msg.role === 'user' ? '你' : 'AI'}
                  {msg.aborted && <span className={styles.abortedLabel}>(已中断)</span>}
                </div>
                <div className="message-content">
                  {msg.role === 'assistant' ? (
                    <>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                      {isStreaming && msg.id === messages[messages.length - 1]?.id && (
                        <span className="cursor" />
                      )}
                    </>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="试试问一个需要长回答的问题..."
            disabled={isStreaming}
          />
          {isStreaming ? (
            <button className="send-btn abort-btn" onClick={handleAbort}>
              ⏹️ 停止
            </button>
          ) : (
            <button className="send-btn" onClick={handleSend} disabled={!input.trim()}>
              发送
            </button>
          )}
        </div>
      </div>

      <div className={styles.codeBlock}>
        <h4>🔧 AbortController 核心代码</h4>
        <pre>
          {`// 1. 创建 AbortController
const controller = new AbortController();

// 2. 将 signal 传入 fetch
fetch(url, { signal: controller.signal });

// 3. 需要中断时调用
controller.abort();

// 4. fetch 会抛出 AbortError
catch (error) {
  if (error.name === 'AbortError') {
    console.log('请求已被中断');
  }
}`}
        </pre>
      </div>
    </div>
  )
}
