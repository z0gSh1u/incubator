/**
 * Demo 06: 对话状态机
 *
 * 演示支持中断和重新生成的对话状态机：
 * - 状态：idle → generating → paused → idle
 * - 支持中断当前生成
 * - 支持重新生成上一条回复
 */

import React, { useState, useRef, useEffect, useReducer } from 'react'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { streamChat, Message } from '../../client'
import styles from './index.module.css'

// 状态类型
type ChatState = 'idle' | 'generating' | 'paused'

// 消息类型
interface ChatMessage extends Message {
  id: string
  status: 'pending' | 'streaming' | 'completed' | 'aborted' | 'error'
  regenerateCount?: number
}

// Action 类型
type ChatAction =
  | { type: 'SEND_MESSAGE'; payload: { content: string } }
  | { type: 'START_GENERATING'; payload: { messageId: string } }
  | { type: 'APPEND_TOKEN'; payload: { messageId: string; token: string } }
  | { type: 'COMPLETE_MESSAGE'; payload: { messageId: string } }
  | { type: 'ABORT_MESSAGE'; payload: { messageId: string } }
  | { type: 'ERROR_MESSAGE'; payload: { messageId: string; error: string } }
  | { type: 'REGENERATE'; payload: { messageId: string } }

// Reducer
interface ChatStore {
  state: ChatState
  messages: ChatMessage[]
  currentMessageId: string | null
}

function chatReducer(store: ChatStore, action: ChatAction): ChatStore {
  switch (action.type) {
    case 'SEND_MESSAGE': {
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: action.payload.content,
        status: 'completed',
      }
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        status: 'pending',
      }
      return {
        ...store,
        state: 'generating',
        messages: [...store.messages, userMessage, assistantMessage],
        currentMessageId: assistantMessage.id,
      }
    }

    case 'START_GENERATING':
      return {
        ...store,
        state: 'generating',
        messages: store.messages.map((m) =>
          m.id === action.payload.messageId ? { ...m, status: 'streaming' } : m,
        ),
      }

    case 'APPEND_TOKEN':
      return {
        ...store,
        messages: store.messages.map((m) =>
          m.id === action.payload.messageId
            ? { ...m, content: m.content + action.payload.token }
            : m,
        ),
      }

    case 'COMPLETE_MESSAGE':
      return {
        ...store,
        state: 'idle',
        messages: store.messages.map((m) =>
          m.id === action.payload.messageId ? { ...m, status: 'completed' } : m,
        ),
        currentMessageId: null,
      }

    case 'ABORT_MESSAGE':
      return {
        ...store,
        state: 'idle',
        messages: store.messages.map((m) =>
          m.id === action.payload.messageId ? { ...m, status: 'aborted' } : m,
        ),
        currentMessageId: null,
      }

    case 'ERROR_MESSAGE':
      return {
        ...store,
        state: 'idle',
        messages: store.messages.map((m) =>
          m.id === action.payload.messageId
            ? { ...m, status: 'error', content: action.payload.error }
            : m,
        ),
        currentMessageId: null,
      }

    case 'REGENERATE': {
      // 找到要重新生成的消息
      const targetIndex = store.messages.findIndex(
        (m) => m.id === action.payload.messageId,
      )
      if (targetIndex === -1) return store

      const targetMessage = store.messages[targetIndex]
      const newMessage: ChatMessage = {
        ...targetMessage,
        id: Date.now().toString(),
        content: '',
        status: 'pending',
        regenerateCount: (targetMessage.regenerateCount || 0) + 1,
      }

      // 替换原消息
      const newMessages = [...store.messages]
      newMessages[targetIndex] = newMessage

      return {
        ...store,
        state: 'generating',
        messages: newMessages,
        currentMessageId: newMessage.id,
      }
    }

    default:
      return store
  }
}

export function StateMachineDemo() {
  const [store, dispatch] = useReducer(chatReducer, {
    state: 'idle',
    messages: [],
    currentMessageId: null,
  })

  const [input, setInput] = useState('')
  const abortControllerRef = useRef<AbortController | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [store.messages])

  // 发送消息
  const handleSend = async () => {
    if (!input.trim() || store.state !== 'idle') return

    dispatch({ type: 'SEND_MESSAGE', payload: { content: input.trim() } })
    const userContent = input.trim()
    setInput('')

    // 等待状态更新后开始生成
    setTimeout(() => {
      generateResponse(userContent)
    }, 0)
  }

  // 生成回复
  const generateResponse = async (userContent: string, regenerateId?: string) => {
    abortControllerRef.current = new AbortController()

    const messageId = regenerateId || (Date.now() + 1).toString()

    dispatch({ type: 'START_GENERATING', payload: { messageId } })

    // 构建消息历史
    const history: Message[] = store.messages
      .filter((m) => m.status === 'completed' || m.id === messageId)
      .slice(0, -1) // 排除当前正在生成的消息
      .map(({ role, content }) => ({ role, content }))

    await streamChat(
      {
        messages: [
          { role: 'system', content: '你是一个友好的 AI 助手。' },
          ...history,
          { role: 'user', content: userContent },
        ],
        signal: abortControllerRef.current.signal,
      },
      {
        onToken: (token) => {
          dispatch({ type: 'APPEND_TOKEN', payload: { messageId, token } })
        },
        onComplete: () => {
          dispatch({ type: 'COMPLETE_MESSAGE', payload: { messageId } })
          abortControllerRef.current = null
        },
        onError: (error) => {
          if (error.name === 'AbortError') {
            dispatch({ type: 'ABORT_MESSAGE', payload: { messageId } })
          } else {
            dispatch({
              type: 'ERROR_MESSAGE',
              payload: { messageId, error: error.message },
            })
          }
          abortControllerRef.current = null
        },
      },
    )
  }

  // 中断生成
  const handleAbort = () => {
    abortControllerRef.current?.abort()
  }

  // 重新生成
  const handleRegenerate = (messageId: string) => {
    // 找到这条消息之前的用户消息
    const messageIndex = store.messages.findIndex((m) => m.id === messageId)
    if (messageIndex <= 0) return

    const userMessage = store.messages[messageIndex - 1]
    if (userMessage.role !== 'user') return

    dispatch({ type: 'REGENERATE', payload: { messageId } })

    setTimeout(() => {
      generateResponse(userMessage.content, messageId)
    }, 0)
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
        <h1>06 - 对话状态机</h1>
      </div>

      <div className="demo-description">
        <h3>💡 核心知识点</h3>
        <p>
          使用 <code>useReducer</code> 实现对话状态机，管理状态转换（idle → generating →
          idle）、 支持中断当前生成和重新生成上一条回复。
        </p>
      </div>

      {/* 状态指示器 */}
      <div className={styles.statusBar}>
        <div>
          当前状态：
          <span className={`${styles.statusBadge} ${styles[store.state]}`}>
            {store.state}
          </span>
        </div>
        <div>消息数：{store.messages.length}</div>
      </div>

      <div className="chat-container">
        <div className="messages">
          {store.messages.length === 0 ? (
            <div className="empty-state">
              <div className="icon">🔄</div>
              <p>发送消息后，可以中断或重新生成</p>
            </div>
          ) : (
            store.messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.role}`}>
                <div className={styles.messageRole}>
                  <span>
                    {msg.role === 'user' ? '你' : 'AI'}
                    {msg.regenerateCount && (
                      <span className={styles.regenerateCount}>
                        (第 {msg.regenerateCount + 1} 次生成)
                      </span>
                    )}
                  </span>
                  <span className={`${styles.messageStatus} ${styles[msg.status]}`}>
                    {msg.status}
                  </span>
                </div>
                <div className="message-content">
                  {msg.role === 'assistant' ? (
                    <>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                      {msg.status === 'streaming' && <span className="cursor" />}
                    </>
                  ) : (
                    msg.content
                  )}
                </div>

                {/* 重新生成按钮 */}
                {msg.role === 'assistant' &&
                  (msg.status === 'completed' || msg.status === 'aborted') && (
                    <button
                      onClick={() => handleRegenerate(msg.id)}
                      disabled={store.state !== 'idle'}
                      className={styles.regenerateButton}
                    >
                      🔄 重新生成
                    </button>
                  )}
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
            placeholder="输入消息..."
            disabled={store.state !== 'idle'}
          />
          {store.state === 'generating' ? (
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

      {/* 状态机图 */}
      <div className={styles.stateMachineDiagram}>
        <h4>🔧 状态机转换图</h4>
        <pre>
          {`
    ┌─────────────────────────────────────┐
    │                                     │
    ▼                                     │
 ┌──────┐  sendMessage   ┌────────────┐  │
 │ idle │ ─────────────► │ generating │ ─┤ complete/error
 └──────┘                └────────────┘  │
    ▲                         │          │
    │         abort           │          │
    └─────────────────────────┘          │
    │                                    │
    └────────────────────────────────────┘
              regenerate
`}
        </pre>
      </div>
    </div>
  )
}
