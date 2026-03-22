/**
 * Demo 07: 高频渲染优化
 *
 * 演示流式输出场景下的渲染优化：
 * - 未优化版本：每个 token 触发全量渲染
 * - 优化版本：节流 + 局部状态 + memo
 */

import { useState, useRef, useCallback, memo, useTransition } from 'react'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { streamChat } from '../../client'
import styles from './index.module.css'

// 渲染计数器
let renderCount = { optimized: 0, unoptimized: 0 }

// 未优化的消息组件
function UnoptimizedMessage({ content }: { content: string }) {
  renderCount.unoptimized++
  return (
    <div className="message assistant">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  )
}

// 优化的消息组件
const OptimizedMessage = memo(function OptimizedMessage({
  content,
}: {
  content: string
}) {
  renderCount.optimized++
  return (
    <div className="message assistant">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  )
})

export function RenderOptimizationDemo() {
  const [mode, setMode] = useState<'optimized' | 'unoptimized'>('optimized')
  const [content, setContent] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [stats, setStats] = useState({ renderCount: 0, tokenCount: 0 })
  const [, startTransition] = useTransition()

  // 节流相关
  const tokenBufferRef = useRef('')
  const lastFlushTimeRef = useRef(0)
  const rafIdRef = useRef<number | null>(null)

  // 重置计数
  const resetStats = () => {
    renderCount = { optimized: 0, unoptimized: 0 }
    setStats({ renderCount: 0, tokenCount: 0 })
    setContent('')
  }

  // 节流刷新
  const throttledFlush = useCallback(() => {
    if (rafIdRef.current) return

    rafIdRef.current = requestAnimationFrame(() => {
      const now = performance.now()
      // 最小间隔 50ms
      if (now - lastFlushTimeRef.current >= 50) {
        if (mode === 'optimized') {
          startTransition(() => {
            setContent((prev) => prev + tokenBufferRef.current)
          })
        } else {
          setContent((prev) => prev + tokenBufferRef.current)
        }
        tokenBufferRef.current = ''
        lastFlushTimeRef.current = now
      }
      rafIdRef.current = null
    })
  }, [mode])

  // 开始测试
  const handleStart = async () => {
    resetStats()
    setIsStreaming(true)

    let tokenCount = 0

    await streamChat(
      {
        messages: [
          {
            role: 'user',
            content:
              '请详细解释 React 的虚拟 DOM 和 Fiber 架构，包含代码示例和原理图解，至少 500 字。',
          },
        ],
      },
      {
        onToken: (token) => {
          tokenCount++

          if (mode === 'optimized') {
            // 优化模式：累积 token，节流更新
            tokenBufferRef.current += token
            throttledFlush()
          } else {
            // 未优化模式：每个 token 立即更新
            setContent((prev) => prev + token)
          }

          // 更新统计
          setStats({
            renderCount:
              mode === 'optimized' ? renderCount.optimized : renderCount.unoptimized,
            tokenCount,
          })
        },
        onComplete: () => {
          // 刷新剩余 buffer
          if (tokenBufferRef.current) {
            setContent((prev) => prev + tokenBufferRef.current)
            tokenBufferRef.current = ''
          }
          setIsStreaming(false)
          setStats({
            renderCount:
              mode === 'optimized' ? renderCount.optimized : renderCount.unoptimized,
            tokenCount,
          })
        },
        onError: (error) => {
          setContent(`❌ 错误: ${error.message}`)
          setIsStreaming(false)
        },
      },
    )
  }

  return (
    <div className="demo-page">
      <div className="demo-header">
        <Link to="/" className="back-btn">
          ← 返回
        </Link>
        <h1>07 - 高频渲染优化</h1>
      </div>

      <div className="demo-description">
        <h3>💡 核心知识点</h3>
        <p>
          流式输出每秒可能产生 50+ 次状态更新，优化策略：
          <code>RAF 节流</code> + <code>token 累积</code> + <code>useTransition</code> +{' '}
          <code>React.memo</code>
        </p>
      </div>

      {/* 控制面板 */}
      <div className={styles.controlPanel}>
        <div className={styles.modeButtons}>
          <button
            onClick={() => {
              setMode('optimized')
              resetStats()
            }}
            className={`${styles.modeButton} ${mode === 'optimized' ? styles.optimized : ''}`}
          >
            ✅ 优化版本
          </button>
          <button
            onClick={() => {
              setMode('unoptimized')
              resetStats()
            }}
            className={`${styles.modeButton} ${mode === 'unoptimized' ? styles.unoptimized : ''}`}
          >
            ❌ 未优化版本
          </button>
        </div>

        <button
          onClick={handleStart}
          disabled={isStreaming}
          className={styles.startButton}
        >
          {isStreaming ? '生成中...' : '▶ 开始测试'}
        </button>

        {/* 实时统计 */}
        <div className={styles.stats}>
          <div>
            <span>Token 数：</span>
            <span className={`${styles.value} ${styles.success}`}>
              {stats.tokenCount}
            </span>
          </div>
          <div>
            <span>渲染次数：</span>
            <span
              className={`${styles.value} ${mode === 'optimized' ? styles.success : styles.error}`}
            >
              {stats.renderCount}
            </span>
          </div>
          <div>
            <span>优化率：</span>
            <span className={`${styles.value} ${styles.success}`}>
              {stats.tokenCount > 0
                ? `${(((stats.tokenCount - stats.renderCount) / stats.tokenCount) * 100).toFixed(0)}%`
                : '-'}
            </span>
          </div>
        </div>
      </div>

      {/* 内容展示 */}
      <div className="chat-container">
        <div className={`messages ${styles.contentContainer}`}>
          {content ? (
            mode === 'optimized' ? (
              <OptimizedMessage content={content} />
            ) : (
              <UnoptimizedMessage content={content} />
            )
          ) : (
            <div className="empty-state">
              <div className="icon">⚡</div>
              <p>点击开始测试，观察渲染次数差异</p>
            </div>
          )}
          {isStreaming && <span className="cursor" />}
        </div>
      </div>

      {/* 优化策略说明 */}
      <div className={styles.strategyGrid}>
        <div className={`${styles.strategyCard} ${styles.problem}`}>
          <h4>❌ 未优化问题</h4>
          <ul>
            <li>每个 token 触发 setState</li>
            <li>每次 setState 触发完整 re-render</li>
            <li>Markdown 解析重复执行</li>
            <li>可能导致页面卡顿</li>
          </ul>
        </div>

        <div className={`${styles.strategyCard} ${styles.solution}`}>
          <h4>✅ 优化策略</h4>
          <ul>
            <li>RAF 节流：合并多个 token</li>
            <li>最小更新间隔：50ms</li>
            <li>useTransition：低优先级更新</li>
            <li>React.memo：避免不必要渲染</li>
          </ul>
        </div>
      </div>

      {/* 代码示例 */}
      <div className={styles.codeSection}>
        <h4>🔧 核心优化代码</h4>
        <pre>
          {`// Token 累积 + RAF 节流
const tokenBuffer = useRef('');
const rafId = useRef(null);

const onToken = (token) => {
  tokenBuffer.current += token;
  
  if (!rafId.current) {
    rafId.current = requestAnimationFrame(() => {
      startTransition(() => {
        setContent(prev => prev + tokenBuffer.current);
      });
      tokenBuffer.current = '';
      rafId.current = null;
    });
  }
};`}
        </pre>
      </div>
    </div>
  )
}
