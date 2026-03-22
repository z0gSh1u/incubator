/**
 * Demo 04: 多模型并发调用
 *
 * 演示 Promise.all 与 Promise.allSettled 的区别：
 * - Promise.all: 一个失败则全部失败
 * - Promise.allSettled: 收集所有结果，无论成功失败
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { streamChat } from '../../client'
import styles from './index.module.css'

interface ModelResult {
  model: string
  status: 'pending' | 'success' | 'error'
  content: string
  time?: number
}

// 模拟不同模型的配置（实际使用同一个 API，但模拟不同行为）
const MOCK_MODELS = [
  { id: 'model-a', name: '模型 A', delay: 0, shouldFail: false },
  { id: 'model-b', name: '模型 B', delay: 500, shouldFail: false },
  { id: 'model-c', name: '模型 C（模拟失败）', delay: 200, shouldFail: true },
]

export function MultiModelDemo() {
  const [prompt, setPrompt] = useState('用一句话介绍自己')
  const [results, setResults] = useState<ModelResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [method, setMethod] = useState<'all' | 'allSettled'>('allSettled')

  // 模拟单个模型调用
  const callModel = async (
    model: (typeof MOCK_MODELS)[0],
    prompt: string,
  ): Promise<string> => {
    // 模拟延迟
    await new Promise((resolve) => setTimeout(resolve, model.delay))

    // 模拟失败
    if (model.shouldFail) {
      throw new Error(`${model.name} 调用失败：API 超时`)
    }

    // 真实调用
    return new Promise((resolve, reject) => {
      let content = ''
      streamChat(
        {
          messages: [
            { role: 'system', content: `你是 ${model.name}，用一句话回答。` },
            { role: 'user', content: prompt },
          ],
        },
        {
          onToken: (token) => {
            content += token
          },
          onComplete: () => resolve(content),
          onError: reject,
        },
      )
    })
  }

  // Promise.all 方式
  const handlePromiseAll = async () => {
    setIsLoading(true)
    setResults(
      MOCK_MODELS.map((m) => ({
        model: m.name,
        status: 'pending',
        content: '',
      })),
    )

    const startTime = performance.now()

    try {
      const promises = MOCK_MODELS.map((model) => callModel(model, prompt))
      const responses = await Promise.all(promises)

      setResults(
        MOCK_MODELS.map((m, i) => ({
          model: m.name,
          status: 'success',
          content: responses[i],
          time: performance.now() - startTime,
        })),
      )
    } catch (error) {
      // 一个失败，全部标记为失败
      setResults(
        MOCK_MODELS.map((m) => ({
          model: m.name,
          status: 'error',
          content: `❌ Promise.all 失败: ${(error as Error).message}`,
          time: performance.now() - startTime,
        })),
      )
    }

    setIsLoading(false)
  }

  // Promise.allSettled 方式
  const handlePromiseAllSettled = async () => {
    setIsLoading(true)
    setResults(
      MOCK_MODELS.map((m) => ({
        model: m.name,
        status: 'pending',
        content: '',
      })),
    )

    const startTime = performance.now()

    const promises = MOCK_MODELS.map((model) => callModel(model, prompt))
    const settledResults = await Promise.allSettled(promises)

    setResults(
      MOCK_MODELS.map((m, i) => {
        const result = settledResults[i]
        if (result.status === 'fulfilled') {
          return {
            model: m.name,
            status: 'success' as const,
            content: result.value,
            time: performance.now() - startTime,
          }
        } else {
          return {
            model: m.name,
            status: 'error' as const,
            content: `❌ ${result.reason.message}`,
            time: performance.now() - startTime,
          }
        }
      }),
    )

    setIsLoading(false)
  }

  const handleRun = () => {
    if (method === 'all') {
      handlePromiseAll()
    } else {
      handlePromiseAllSettled()
    }
  }

  return (
    <div className="demo-page">
      <div className="demo-header">
        <Link to="/" className="back-btn">
          ← 返回
        </Link>
        <h1>04 - 多模型并发调用</h1>
      </div>

      <div className="demo-description">
        <h3>💡 核心知识点</h3>
        <p>
          <code>Promise.all</code>：任一失败则整体失败，适合全部成功才有意义的场景。
          <br />
          <code>Promise.allSettled</code>
          ：收集所有结果（成功或失败），适合多模型对比、容错降级场景。
        </p>
      </div>

      {/* 配置区 */}
      <div className={styles.configSection}>
        <div className={styles.inputGroup}>
          <label>提示词：</label>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        <div className={styles.radioGroup}>
          <label>调用方式：</label>
          <div className={styles.radioOptions}>
            <label>
              <input
                type="radio"
                name="method"
                checked={method === 'allSettled'}
                onChange={() => setMethod('allSettled')}
              />
              <span>Promise.allSettled（推荐）</span>
            </label>
            <label>
              <input
                type="radio"
                name="method"
                checked={method === 'all'}
                onChange={() => setMethod('all')}
              />
              <span>Promise.all</span>
            </label>
          </div>
        </div>

        <button onClick={handleRun} disabled={isLoading} className={styles.runButton}>
          {isLoading ? '调用中...' : '并发调用 3 个模型'}
        </button>

        <p className={styles.helpText}>
          💡 提示：模型 C 会模拟失败，观察两种方式的不同表现
        </p>
      </div>

      {/* 结果展示 */}
      <div className={styles.resultsGrid}>
        {results.map((result, index) => (
          <div key={index} className={`${styles.resultCard} ${styles[result.status]}`}>
            <div className={styles.resultHeader}>
              <span>{result.model}</span>
              <span className={`${styles.resultStatus} ${styles[result.status]}`}>
                {result.status === 'pending' && '⏳ 请求中...'}
                {result.status === 'success' && `✅ ${result.time?.toFixed(0)}ms`}
                {result.status === 'error' && '❌ 失败'}
              </span>
            </div>
            <div
              className={`${styles.resultContent} ${result.status === 'error' ? styles.error : ''}`}
            >
              {result.content || (result.status === 'pending' ? '...' : '')}
            </div>
          </div>
        ))}
      </div>

      {/* 代码示例 */}
      <div className={styles.codeSection}>
        <h4>🔧 核心代码对比</h4>
        <div className={styles.codeGrid}>
          <div>
            <h5 className={styles.error}>Promise.all</h5>
            <pre>
              {`try {
  const results = await Promise.all([
    callModelA(),
    callModelB(),
    callModelC(), // 失败
  ]);
  // 不会执行到这里
} catch (error) {
  // 一个失败，全部失败
  console.error(error);
}`}
            </pre>
          </div>
          <div>
            <h5 className={styles.success}>Promise.allSettled</h5>
            <pre>
              {`const results = await Promise.allSettled([
  callModelA(),
  callModelB(), 
  callModelC(), // 失败
]);

results.forEach(r => {
  if (r.status === 'fulfilled') {
    console.log(r.value);
  } else {
    console.error(r.reason);
  }
});`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
