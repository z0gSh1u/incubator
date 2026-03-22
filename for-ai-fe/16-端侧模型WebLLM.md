## 问题

谈谈你对端侧模型（如 WebLLM）的看法，它在前端有哪些应用前景？

## 回答

### 一、什么是端侧模型

端侧模型（On-Device Model）指直接在用户设备（浏览器、移动端）上运行的 AI 模型，无需将数据发送到云端处理。

#### 主要技术栈

| 技术                 | 描述                  | 支持的模型          |
| -------------------- | --------------------- | ------------------- |
| **WebLLM**           | 基于 WebGPU 运行 LLM  | Llama, Mistral, Phi |
| **Transformers.js**  | Hugging Face 的 JS 版 | BERT, Whisper, ViT  |
| **ONNX Runtime Web** | 通用模型推理          | ONNX 格式模型       |
| **MediaPipe**        | Google 的多媒体 AI    | 人脸检测、手势识别  |
| **TensorFlow.js**    | TensorFlow 的 JS 版   | 自定义模型          |

### 二、端侧模型的优势

```typescript
// 对比：云端调用 vs 端侧推理

// 云端调用
async function cloudInference(prompt: string) {
  const startTime = performance.now()

  const response = await fetch('https://api.openai.com/v1/chat', {
    method: 'POST',
    headers: { Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
  })

  // 延迟 = 网络传输 + 排队等待 + 推理时间
  console.log(`云端耗时: ${performance.now() - startTime}ms`)
  // 典型值: 500ms - 2000ms

  return response.json()
}

// 端侧推理
async function localInference(prompt: string) {
  const startTime = performance.now()

  // 直接本地推理，无网络延迟
  const result = await webllm.generate(prompt)

  console.log(`本地耗时: ${performance.now() - startTime}ms`)
  // 典型值: 100ms - 500ms（首次加载后）

  return result
}
```

#### 优势对比

| 维度       | 云端模型        | 端侧模型        |
| ---------- | --------------- | --------------- |
| **延迟**   | 500-2000ms      | 100-500ms       |
| **隐私**   | 数据上传云端    | 数据不出本地    |
| **成本**   | 按 Token 计费   | 一次性下载      |
| **可用性** | 依赖网络        | 支持离线        |
| **能力**   | GPT-4 级别      | 7B-13B 参数级别 |
| **稳定性** | 受限于 API 配额 | 无限制          |

### 三、WebLLM 实践

#### 1. 基础使用

```typescript
// services/webllm.ts
import * as webllm from '@mlc-ai/web-llm'

class WebLLMService {
  private engine: webllm.MLCEngineInterface | null = null
  private isLoading: boolean = false
  private loadProgress: number = 0

  /** 初始化模型 */
  async initialize(
    modelId: string = 'Llama-3-8B-Instruct-q4f16_1-MLC',
    onProgress?: (progress: number, text: string) => void,
  ): Promise<void> {
    if (this.engine || this.isLoading) return

    this.isLoading = true

    try {
      // 检查 WebGPU 支持
      if (!navigator.gpu) {
        throw new Error('当前浏览器不支持 WebGPU')
      }

      // 创建引擎并加载模型
      this.engine = await webllm.CreateMLCEngine(modelId, {
        initProgressCallback: (report) => {
          this.loadProgress = report.progress
          onProgress?.(report.progress, report.text)
          console.log(`加载进度: ${(report.progress * 100).toFixed(1)}%`)
        },
      })

      console.log('模型加载完成')
    } finally {
      this.isLoading = false
    }
  }

  /** 生成回复 */
  async chat(
    messages: Array<{ role: string; content: string }>,
    options?: {
      temperature?: number
      maxTokens?: number
      onToken?: (token: string) => void
    },
  ): Promise<string> {
    if (!this.engine) {
      throw new Error('模型未初始化')
    }

    // 流式生成
    const chunks: string[] = []
    const asyncChunkGenerator = await this.engine.chat.completions.create({
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 512,
      stream: true,
    })

    for await (const chunk of asyncChunkGenerator) {
      const token = chunk.choices[0]?.delta?.content || ''
      if (token) {
        chunks.push(token)
        options?.onToken?.(token)
      }
    }

    return chunks.join('')
  }

  /** 获取 Embedding */
  async embed(text: string): Promise<number[]> {
    if (!this.engine) {
      throw new Error('模型未初始化')
    }

    const response = await this.engine.embeddings.create({
      input: text,
      model: 'text-embedding',
    })

    return response.data[0].embedding
  }

  /** 释放资源 */
  async dispose(): Promise<void> {
    if (this.engine) {
      await this.engine.unload()
      this.engine = null
    }
  }

  /** 获取加载状态 */
  getStatus(): { loaded: boolean; loading: boolean; progress: number } {
    return {
      loaded: !!this.engine,
      loading: this.isLoading,
      progress: this.loadProgress,
    }
  }
}

export const webllmService = new WebLLMService()
```

#### 2. React 集成 Hook

```tsx
// hooks/useWebLLM.ts
import { useState, useEffect, useCallback, useRef } from 'react'
import { webllmService } from '../services/webllm'

interface UseWebLLMOptions {
  modelId?: string
  autoLoad?: boolean
}

interface WebLLMState {
  isLoading: boolean
  isReady: boolean
  loadProgress: number
  loadingText: string
  error: Error | null
}

export function useWebLLM(options: UseWebLLMOptions = {}) {
  const { modelId = 'Llama-3-8B-Instruct-q4f16_1-MLC', autoLoad = false } = options

  const [state, setState] = useState<WebLLMState>({
    isLoading: false,
    isReady: false,
    loadProgress: 0,
    loadingText: '',
    error: null,
  })

  const abortRef = useRef(false)

  // 加载模型
  const load = useCallback(async () => {
    if (state.isReady || state.isLoading) return

    setState((prev) => ({ ...prev, isLoading: true, error: null }))
    abortRef.current = false

    try {
      await webllmService.initialize(modelId, (progress, text) => {
        if (abortRef.current) return
        setState((prev) => ({
          ...prev,
          loadProgress: progress,
          loadingText: text,
        }))
      })

      if (!abortRef.current) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isReady: true,
          loadProgress: 1,
        }))
      }
    } catch (error) {
      if (!abortRef.current) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error as Error,
        }))
      }
    }
  }, [modelId, state.isReady, state.isLoading])

  // 生成回复
  const generate = useCallback(
    async (
      prompt: string,
      options?: {
        systemPrompt?: string
        temperature?: number
        onToken?: (token: string) => void
      },
    ): Promise<string> => {
      if (!state.isReady) {
        throw new Error('模型未就绪')
      }

      const messages = [
        ...(options?.systemPrompt
          ? [{ role: 'system', content: options.systemPrompt }]
          : []),
        { role: 'user', content: prompt },
      ]

      return webllmService.chat(messages, {
        temperature: options?.temperature,
        onToken: options?.onToken,
      })
    },
    [state.isReady],
  )

  // 自动加载
  useEffect(() => {
    if (autoLoad) {
      load()
    }

    return () => {
      abortRef.current = true
    }
  }, [autoLoad, load])

  // 清理
  useEffect(() => {
    return () => {
      webllmService.dispose()
    }
  }, [])

  return {
    ...state,
    load,
    generate,
  }
}
```

### 四、应用场景

#### 1. 本地文档问答

```tsx
// components/LocalDocQA.tsx
import { useWebLLM } from '../hooks/useWebLLM'
import { useLocalEmbedding } from '../hooks/useLocalEmbedding'

export function LocalDocQA() {
  const { isReady, load, generate } = useWebLLM()
  const { embed, index, search } = useLocalEmbedding()
  const [documents, setDocuments] = useState<string[]>([])
  const [answer, setAnswer] = useState('')

  // 上传文档
  const handleUpload = async (files: FileList) => {
    const texts: string[] = []

    for (const file of files) {
      const text = await file.text()
      texts.push(text)

      // 本地向量化
      const chunks = splitIntoChunks(text, 500)
      for (const chunk of chunks) {
        const embedding = await embed(chunk)
        await index(chunk, embedding)
      }
    }

    setDocuments((prev) => [...prev, ...texts])
  }

  // 提问
  const handleAsk = async (question: string) => {
    // 1. 本地检索
    const questionEmbedding = await embed(question)
    const relevantChunks = await search(questionEmbedding, 3)

    // 2. 构建上下文
    const context = relevantChunks.map((c) => c.text).join('\n\n')

    // 3. 本地生成回答
    setAnswer('')
    await generate(`基于以下文档内容回答问题：\n\n${context}\n\n问题：${question}`, {
      onToken: (token) => setAnswer((prev) => prev + token),
    })
  }

  return (
    <div className="local-doc-qa">
      <div className="upload-section">
        <input
          type="file"
          multiple
          accept=".txt,.md,.pdf"
          onChange={(e) => handleUpload(e.target.files!)}
        />
        <p>已上传 {documents.length} 个文档</p>
      </div>

      <div className="chat-section">
        <input
          type="text"
          placeholder="提问..."
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleAsk(e.currentTarget.value)
            }
          }}
        />
        <div className="answer">{answer}</div>
      </div>
    </div>
  )
}
```

#### 2. 敏感信息脱敏

```typescript
// services/localRedaction.ts

class LocalRedactionService {
  private webllm: WebLLMService

  constructor() {
    this.webllm = new WebLLMService()
  }

  async initialize(): Promise<void> {
    await this.webllm.initialize('Phi-3-mini-4k-instruct-q4f16_1-MLC')
  }

  /** 脱敏处理 - 数据完全不出本地 */
  async redact(text: string): Promise<{
    redacted: string
    entities: Array<{ type: string; original: string; masked: string }>
  }> {
    const prompt = `
请识别以下文本中的敏感信息并进行脱敏处理：
- 姓名 -> [姓名]
- 手机号 -> [手机号]
- 身份证号 -> [身份证号]
- 银行卡号 -> [银行卡号]
- 地址 -> [地址]

原文：${text}

请输出脱敏后的文本，格式为 JSON：
{
  "redacted": "脱敏后文本",
  "entities": [{"type": "类型", "original": "原文", "masked": "脱敏后"}]
}
`

    const response = await this.webllm.chat([{ role: 'user', content: prompt }])

    return JSON.parse(response)
  }
}

// 使用示例
async function handleSensitiveData(userInput: string) {
  const redaction = new LocalRedactionService()
  await redaction.initialize()

  // 所有处理在本地完成，敏感信息不上传
  const { redacted, entities } = await redaction.redact(userInput)

  console.log('检测到敏感信息:', entities)
  console.log('脱敏后文本:', redacted)

  // 只将脱敏后的数据发送到服务器
  await sendToServer(redacted)
}
```

#### 3. 离线代码补全

```typescript
// services/localCodeComplete.ts

class LocalCodeCompleteService {
  private engine: webllm.MLCEngineInterface | null = null

  async initialize(): Promise<void> {
    this.engine = await webllm.CreateMLCEngine('CodeLlama-7b-Instruct-q4f16_1-MLC')
  }

  /** 代码补全 */
  async complete(
    code: string,
    cursorPosition: number,
    language: string,
  ): Promise<string[]> {
    const prefix = code.slice(0, cursorPosition)
    const suffix = code.slice(cursorPosition)

    const prompt = `
<|prefix|>${prefix}<|suffix|>${suffix}<|middle|>
`

    const completions: string[] = []

    // 生成多个候选
    for (let i = 0; i < 3; i++) {
      const result = await this.engine!.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2 + i * 0.1, // 不同温度获得多样性
        max_tokens: 50,
        stop: ['\n\n', '<|endoftext|>'],
      })

      const completion = result.choices[0]?.message?.content || ''
      if (completion && !completions.includes(completion)) {
        completions.push(completion)
      }
    }

    return completions
  }

  /** 代码解释 */
  async explain(code: string, language: string): Promise<string> {
    const result = await this.engine!.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: '你是一个代码解释助手，用中文简洁地解释代码功能。',
        },
        {
          role: 'user',
          content: `请解释这段 ${language} 代码：\n\`\`\`${language}\n${code}\n\`\`\``,
        },
      ],
      temperature: 0.3,
      max_tokens: 200,
    })

    return result.choices[0]?.message?.content || ''
  }
}
```

### 五、混合架构设计

```typescript
// services/hybridAI.ts

/** 模型能力评估 */
interface ModelCapability {
  type: 'local' | 'cloud'
  model: string
  maxTokens: number
  supportedTasks: string[]
  estimatedLatency: number // ms
  cost: number // 每 1K tokens
}

class HybridAIService {
  private localModel: WebLLMService
  private cloudModel: CloudModelService
  private capabilities: ModelCapability[] = []

  constructor() {
    this.localModel = new WebLLMService()
    this.cloudModel = new CloudModelService()

    this.capabilities = [
      {
        type: 'local',
        model: 'Phi-3-mini',
        maxTokens: 4096,
        supportedTasks: ['summarize', 'translate', 'simple_qa'],
        estimatedLatency: 200,
        cost: 0,
      },
      {
        type: 'cloud',
        model: 'gpt-4',
        maxTokens: 128000,
        supportedTasks: ['complex_reasoning', 'code_generation', 'analysis'],
        estimatedLatency: 1000,
        cost: 0.03,
      },
    ]
  }

  /** 智能路由 */
  async route(task: {
    type: string
    input: string
    requirements?: {
      maxLatency?: number
      preferLocal?: boolean
      requirePrivacy?: boolean
    }
  }): Promise<{ model: ModelCapability; reason: string }> {
    const { type, input, requirements } = task

    // 1. 隐私要求 -> 强制本地
    if (requirements?.requirePrivacy) {
      const localModel = this.capabilities.find(
        (c) => c.type === 'local' && c.supportedTasks.includes(type),
      )
      if (localModel) {
        return { model: localModel, reason: '隐私要求，使用本地模型' }
      }
    }

    // 2. 任务复杂度判断
    const complexity = this.estimateComplexity(type, input)

    // 3. 简单任务优先本地
    if (complexity < 0.5 && requirements?.preferLocal !== false) {
      const localModel = this.capabilities.find(
        (c) => c.type === 'local' && c.supportedTasks.includes(type),
      )
      if (localModel) {
        return { model: localModel, reason: '简单任务，使用本地模型节省成本' }
      }
    }

    // 4. 复杂任务使用云端
    const cloudModel = this.capabilities.find(
      (c) => c.type === 'cloud' && c.supportedTasks.includes(type),
    )
    if (cloudModel) {
      return { model: cloudModel, reason: '复杂任务，使用云端模型' }
    }

    // 5. 降级到任意可用模型
    return {
      model: this.capabilities[0],
      reason: '无精确匹配，使用默认模型',
    }
  }

  /** 执行任务 */
  async execute(task: {
    type: string
    input: string
    systemPrompt?: string
    onToken?: (token: string) => void
  }): Promise<{ result: string; model: string; latency: number }> {
    const startTime = performance.now()

    // 路由决策
    const { model, reason } = await this.route(task)
    console.log(`路由决策: ${model.model} - ${reason}`)

    let result: string

    if (model.type === 'local') {
      result = await this.localModel.chat([{ role: 'user', content: task.input }], {
        onToken: task.onToken,
      })
    } else {
      result = await this.cloudModel.chat(task.input, {
        model: model.model,
        systemPrompt: task.systemPrompt,
        onToken: task.onToken,
      })
    }

    return {
      result,
      model: model.model,
      latency: performance.now() - startTime,
    }
  }

  private estimateComplexity(type: string, input: string): number {
    // 基于任务类型和输入长度估算复杂度
    const typeComplexity: Record<string, number> = {
      summarize: 0.3,
      translate: 0.4,
      simple_qa: 0.3,
      complex_reasoning: 0.8,
      code_generation: 0.7,
      analysis: 0.8,
    }

    const baseComplexity = typeComplexity[type] || 0.5
    const lengthFactor = Math.min(input.length / 10000, 1)

    return baseComplexity * 0.7 + lengthFactor * 0.3
  }
}
```

### 六、设备兼容性处理

```typescript
// utils/deviceCapability.ts

interface DeviceCapability {
  webgpu: boolean;
  webgl: boolean;
  memory: number;  // GB
  gpu: string | null;
  recommendedModel: string | null;
  warning: string | null;
}

async function checkDeviceCapability(): Promise<DeviceCapability> {
  const result: DeviceCapability = {
    webgpu: false,
    webgl: false,
    memory: 0,
    gpu: null,
    recommendedModel: null,
    warning: null
  };

  // 检查 WebGPU
  if (navigator.gpu) {
    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (adapter) {
        result.webgpu = true;
        const info = await adapter.requestAdapterInfo();
        result.gpu = info.device || info.description || 'Unknown GPU';

        // 检查显存限制
        const limits = adapter.limits;
        const maxBufferSize = limits.maxBufferSize;
        result.memory = maxBufferSize / (1024 * 1024 * 1024);  // 转 GB
      }
    } catch (e) {
      console.warn('WebGPU 检查失败:', e);
    }
  }

  // 检查 WebGL
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  if (gl) {
    result.webgl = true;
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      result.gpu = result.gpu || gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    }
  }

  // 推荐模型
  if (result.webgpu) {
    if (result.memory >= 8) {
      result.recommendedModel = 'Llama-3-8B-Instruct-q4f16_1-MLC';
    } else if (result.memory >= 4) {
      result.recommendedModel = 'Phi-3-mini-4k-instruct-q4f16_1-MLC';
    } else {
      result.recommendedModel = 'TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC';
      result.warning = '显存有限，建议使用小型模型';
    }
  } else if (result.webgl) {
    result.recommendedModel = null;
    result.warning = '不支持 WebGPU，建议使用 Transformers.js (WebGL)';
  } else {
    result.warning = '设备不支持 GPU 加速，端侧模型性能可能较差';
  }

  return result;
}

// React 组件
function DeviceCapabilityCheck() {
  const [capability, setCapability] = useState<DeviceCapability | null>(null);

  useEffect(() => {
    checkDeviceCapability().then(setCapability);
  }, []);

  if (!capability) return <div>检测设备能力中...</div>;

  return (
    <div className="device-capability">
      <h3>设备兼容性</h3>
      <ul>
        <li>WebGPU: {capability.webgpu ? '✅' : '❌'}</li>
        <li>WebGL: {capability.webgl ? '✅' : '❌'}</li>
        <li>GPU: {capability.gpu || '未检测到'}</li>
        <li>显存: {capability.memory.toFixed(1)} GB</li>
      </ul>

      {capability.recommendedModel && (
        <p>推荐模型: {capability.recommendedModel}</p>
      )}

      {capability.warning && (
        <p className="warning">⚠️ {capability.warning}</p>
      )}
    </div>
  );
}
```

### 七、总结

| 维度       | 端侧模型        | 云端模型      |
| ---------- | --------------- | ------------- |
| **延迟**   | 100-500ms       | 500-2000ms    |
| **隐私**   | ✅ 数据不出本地 | ❌ 需上传数据 |
| **成本**   | ✅ 免费         | ❌ 按量计费   |
| **能力**   | 7B-13B 参数     | 100B+ 参数    |
| **离线**   | ✅ 支持         | ❌ 需要网络   |
| **兼容性** | ❌ 需 WebGPU    | ✅ 通用       |

最佳实践：

1. **能力检测**：检查设备是否支持 WebGPU
2. **渐进增强**：云端为基础，端侧为增强
3. **智能路由**：根据任务复杂度选择模型
4. **缓存模型**：利用 Cache API 缓存模型权重
