/**
 * Demo 03: 自动滚动聊天容器
 *
 * 演示智能自动滚动：
 * - 新消息时自动滚动到底部
 * - 用户手动滚动时暂停自动滚动
 * - 提供"滚动到底部"按钮
 */

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { streamChat, Message } from '../../client'
import styles from './index.module.css'

interface DisplayMessage extends Message {
  id: string
}

// 自动滚动 Hook
function useAutoScroll(deps: unknown[]) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [showScrollButton, setShowScrollButton] = useState(false)

  // 检测是否在底部
  const checkIfAtBottom = useCallback(() => {
    const container = containerRef.current
    if (!container) return true

    const threshold = 100
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight
    return distanceFromBottom < threshold
  }, [])

  // 滚动事件处理
  const handleScroll = useCallback(() => {
    const atBottom = checkIfAtBottom()
    setIsAtBottom(atBottom)
    setShowScrollButton(!atBottom)
  }, [checkIfAtBottom])

  // 滚动到底部
  const scrollToBottom = useCallback((smooth = true) => {
    const container = containerRef.current
    if (!container) return

    container.scrollTo({
      top: container.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto',
    })
    setShowScrollButton(false)
  }, [])

  // 依赖变化时，如果在底部则自动滚动
  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return {
    containerRef,
    isAtBottom,
    showScrollButton,
    handleScroll,
    scrollToBottom,
  }
}

export function AutoScrollDemo() {
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)

  // 使用自动滚动 Hook
  const { containerRef, showScrollButton, handleScroll, scrollToBottom } =
    useAutoScroll([messages])

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

    await streamChat(
      {
        messages: [
          {
            role: 'system',
            content:
              '你是一个 AI 助手。请用较长的篇幅回答问题，以便用户可以测试滚动功能。包含多个段落和要点。',
          },
          ...messages.map(({ role, content }) => ({ role, content })),
          { role: 'user', content: input.trim() },
        ],
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
        onComplete: () => setIsStreaming(false),
        onError: (error) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessage.id
                ? { ...msg, content: `❌ 错误: ${error.message}` }
                : msg,
            ),
          )
          setIsStreaming(false)
        },
      },
    )
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
        <h1>03 - 自动滚动聊天容器</h1>
      </div>

      <div className="demo-description">
        <h3>💡 核心知识点</h3>
        <p>
          使用 <code>useAutoScroll</code> Hook
          封装滚动逻辑：监听滚动事件检测是否在底部，新消息时自动滚动，用户手动滚动时暂停自动滚动。
        </p>
      </div>

      <div className="chat-container">
        <div
          className={`messages ${styles.messagesWrapper}`}
          ref={containerRef}
          onScroll={handleScroll}
        >
          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📜</div>
              <p>发送消息后，尝试向上滚动查看效果</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.role}`}>
                <div className="message-role">{msg.role === 'user' ? '你' : 'AI'}</div>
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

          {/* 滚动到底部按钮 */}
          {showScrollButton && (
            <button
              className={styles.scrollToBottomBtn}
              onClick={() => scrollToBottom()}
            >
              ↓ 滚动到底部
            </button>
          )}
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
          <button
            className="send-btn"
            onClick={handleSend}
            disabled={isStreaming || !input.trim()}
          >
            {isStreaming ? '生成中...' : '发送'}
          </button>
        </div>
      </div>

      <div className={styles.codeBlock}>
        <h4>🔧 useAutoScroll Hook 核心代码</h4>
        <pre>
          {`function useAutoScroll(deps) {
  const containerRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // 检测是否在底部（留 100px 阈值）
  const checkIfAtBottom = () => {
    const container = containerRef.current;
    const distance = container.scrollHeight 
                   - container.scrollTop 
                   - container.clientHeight;
    return distance < 100;
  };

  // 依赖变化时，如果在底部则自动滚动
  useEffect(() => {
    if (isAtBottom) scrollToBottom();
  }, deps);

  return { containerRef, scrollToBottom, ... };
}`}
        </pre>
      </div>
    </div>
  )
}
