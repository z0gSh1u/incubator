/**
 * Demo 01: SSE 流式输出
 *
 * 演示 Server-Sent Events 流式传输：
 * - 使用 fetch + ReadableStream 处理流式响应
 * - 逐 token 解析 SSE 数据
 * - 实时更新 UI 显示
 */

import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { streamChat, Message } from '../../client'

interface DisplayMessage extends Message {
  id: string
}

export function SSEStreamingDemo() {
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [stats, setStats] = useState({ tokens: 0, startTime: 0, ttft: 0 })
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 自动滚动到底部
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

    const startTime = performance.now()
    let tokenCount = 0
    let firstTokenTime = 0

    await streamChat(
      {
        messages: [
          {
            role: 'system',
            content: '你是一个友好的 AI 助手，回答简洁明了。',
          },
          ...messages.map(({ role, content }) => ({ role, content })),
          { role: 'user', content: input.trim() },
        ],
      },
      {
        onToken: (token) => {
          // 记录首字时间
          if (tokenCount === 0) {
            firstTokenTime = performance.now() - startTime
          }
          tokenCount++

          // 更新消息内容
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessage.id
                ? { ...msg, content: msg.content + token }
                : msg,
            ),
          )

          // 更新统计
          setStats({
            tokens: tokenCount,
            startTime,
            ttft: firstTokenTime,
          })
        },
        onComplete: () => {
          setIsStreaming(false)
        },
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
        <h1>01 - SSE 流式输出</h1>
      </div>

      <div className="demo-description">
        <h3>💡 核心知识点</h3>
        <p>
          使用 <code>fetch</code> + <code>ReadableStream</code> 处理 SSE
          流式响应。响应格式为 <code>data: {JSON.stringify({ content: '...' })}</code>
          ，需要逐行解析。
        </p>
      </div>

      <div className="chat-container">
        <div className="messages">
          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="icon">💬</div>
              <p>发送消息开始对话</p>
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
          <div ref={messagesEndRef} />
        </div>

        {stats.tokens > 0 && (
          <div className="stats">
            <div className="stat-item">
              <span className="stat-label">TTFT:</span>
              <span className="stat-value">{stats.ttft.toFixed(0)}ms</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Tokens:</span>
              <span className="stat-value">{stats.tokens}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">速度:</span>
              <span className="stat-value">
                {(
                  stats.tokens /
                  ((performance.now() - stats.startTime) / 1000)
                ).toFixed(1)}{' '}
                t/s
              </span>
            </div>
          </div>
        )}

        <div className="input-area">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息..."
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
    </div>
  )
}
