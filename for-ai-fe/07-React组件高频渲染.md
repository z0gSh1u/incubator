## 问题

在 React 项目中，AI 逐字输出会导致组件频繁重渲染，你有哪些优化手段？

## 回答

### 一、问题根源分析

AI 流式输出时，每接收一个 token 都可能触发 `setState`，导致：

1. **组件频繁重渲染**：每秒可能渲染 10-50 次
2. **DOM Diff 开销大**：整个消息列表都参与比较
3. **Markdown 重复解析**：每次更新都重新解析整段内容
4. **连锁反应**：父组件状态变化导致无关子组件也重渲染

### 二、局部状态下沉

将流式文本状态放在最小作用域的组件中，避免影响整个消息列表。

#### 问题代码

```jsx
// ❌ 问题：流式内容状态在顶层，导致整个列表重渲染
function ChatPage() {
  const [messages, setMessages] = useState([])
  const [streamingContent, setStreamingContent] = useState('')

  // 每次 streamingContent 变化，整个 ChatPage 重渲染
  // 包括所有历史消息！
  return (
    <div>
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      {streamingContent && <StreamingMessage content={streamingContent} />}
    </div>
  )
}
```

#### 优化方案

```jsx
// ✅ 优化：流式内容状态下沉到专用组件
function ChatPage() {
  const [messages, setMessages] = useState([])
  const [isStreaming, setIsStreaming] = useState(false)

  return (
    <div>
      {/* 历史消息使用 memo 避免重渲染 */}
      <MessageList messages={messages} />

      {/* 流式内容独立管理状态 */}
      {isStreaming && (
        <StreamingMessageContainer
          onComplete={(content) => {
            setMessages((prev) => [...prev, { id: Date.now(), content }])
            setIsStreaming(false)
          }}
        />
      )}
    </div>
  )
}

// 历史消息列表 - memo 化
const MessageList = memo(function MessageList({ messages }) {
  return (
    <>
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
    </>
  )
})

// 流式消息容器 - 内部管理流式状态
function StreamingMessageContainer({ onComplete }) {
  // 状态只在这个组件内部，不会影响外部
  const [content, setContent] = useState('')

  useEffect(() => {
    const eventSource = new EventSource('/api/chat/stream')

    eventSource.onmessage = (event) => {
      if (event.data === '[DONE]') {
        onComplete(content)
        eventSource.close()
        return
      }
      // 状态更新只触发这个组件重渲染
      setContent((prev) => prev + JSON.parse(event.data).token)
    }

    return () => eventSource.close()
  }, [])

  return <StreamingMessage content={content} />
}
```

### 三、节流更新（Throttling）

不要每收到一个字符就立即更新状态，而是批量积累后更新。

```jsx
function useThrottledState(initialValue, delay = 50) {
  const [state, setState] = useState(initialValue)
  const pendingRef = useRef(initialValue)
  const timeoutRef = useRef(null)

  const setThrottledState = useCallback(
    (updater) => {
      // 更新待处理的值
      if (typeof updater === 'function') {
        pendingRef.current = updater(pendingRef.current)
      } else {
        pendingRef.current = updater
      }

      // 如果没有待执行的更新，设置定时器
      if (!timeoutRef.current) {
        timeoutRef.current = setTimeout(() => {
          setState(pendingRef.current)
          timeoutRef.current = null
        }, delay)
      }
    },
    [delay],
  )

  // 强制立即更新（用于流结束时）
  const flushState = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setState(pendingRef.current)
  }, [])

  // 清理
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return [state, setThrottledState, flushState]
}

// 使用
function StreamingMessage() {
  const [content, setContent, flushContent] = useThrottledState('', 50)

  useEffect(() => {
    const eventSource = new EventSource('/api/chat/stream')

    eventSource.onmessage = (event) => {
      if (event.data === '[DONE]') {
        flushContent() // 确保最后的内容显示
        eventSource.close()
        return
      }
      // 节流更新，每 50ms 最多更新一次
      setContent((prev) => prev + JSON.parse(event.data).token)
    }

    return () => eventSource.close()
  }, [])

  return <MarkdownRenderer content={content} />
}
```

### 四、使用 RAF 批量更新

使用 `requestAnimationFrame` 将多次更新合并到一帧内。

```jsx
function useRAFState(initialValue) {
  const [state, setState] = useState(initialValue)
  const pendingRef = useRef(initialValue)
  const rafRef = useRef(null)

  const setRAFState = useCallback((updater) => {
    if (typeof updater === 'function') {
      pendingRef.current = updater(pendingRef.current)
    } else {
      pendingRef.current = updater
    }

    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(() => {
        setState(pendingRef.current)
        rafRef.current = null
      })
    }
  }, [])

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  return [state, setRAFState]
}
```

### 五、增量 Markdown 渲染

只渲染新增的内容，而不是每次都重新解析整个文本。

```jsx
import { useMemo, useRef, memo } from 'react'
import { marked } from 'marked'

const StreamingMarkdown = memo(function StreamingMarkdown({ content }) {
  // 缓存已解析的段落
  const parsedCacheRef = useRef({
    paragraphs: [],
    lastParsedLength: 0,
  })

  const renderedContent = useMemo(() => {
    const cache = parsedCacheRef.current

    // 如果内容没有变化，直接返回缓存
    if (content.length === cache.lastParsedLength) {
      return cache.paragraphs
    }

    // 找到已完成的段落（以双换行分隔）
    const paragraphs = content.split(/\n\n+/)
    const completeParagraphs = paragraphs.slice(0, -1)
    const incompleteParagraph = paragraphs[paragraphs.length - 1]

    // 只解析新增的完整段落
    const newParagraphs = completeParagraphs.slice(cache.paragraphs.length)

    const result = [
      ...cache.paragraphs,
      ...newParagraphs.map((p) => ({
        html: marked.parse(p),
        isComplete: true,
      })),
      // 最后一个不完整的段落
      {
        html: marked.parse(incompleteParagraph),
        isComplete: false,
      },
    ]

    // 更新缓存（只缓存完整段落）
    cache.paragraphs = result.filter((p) => p.isComplete)
    cache.lastParsedLength = content.length

    return result
  }, [content])

  return (
    <div className="markdown-body">
      {renderedContent.map((para, idx) => (
        <div key={idx} dangerouslySetInnerHTML={{ __html: para.html }} />
      ))}
    </div>
  )
})
```

### 六、使用 useRef 避免不必要的渲染

对于不需要触发渲染的中间状态，使用 `useRef`。

```jsx
function StreamingMessage({ onComplete }) {
  // 用 ref 存储累积的内容，不触发重渲染
  const contentRef = useRef('')
  // 只用于触发最终渲染的状态
  const [displayContent, setDisplayContent] = useState('')
  const rafRef = useRef(null)

  useEffect(() => {
    const eventSource = new EventSource('/api/chat/stream')

    eventSource.onmessage = (event) => {
      if (event.data === '[DONE]') {
        // 流结束，更新最终内容
        setDisplayContent(contentRef.current)
        onComplete(contentRef.current)
        eventSource.close()
        return
      }

      // 累积内容但不立即渲染
      contentRef.current += JSON.parse(event.data).token

      // 使用 RAF 节流渲染
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          setDisplayContent(contentRef.current)
          rafRef.current = null
        })
      }
    }

    return () => {
      eventSource.close()
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [onComplete])

  return <MarkdownRenderer content={displayContent} />
}
```

### 七、Context 优化

避免在 Context 中存储高频变化的数据。

#### 问题代码

```jsx
// ❌ 问题：流式内容放在 Context 中，所有消费者都会重渲染
const ChatContext = createContext()

function ChatProvider({ children }) {
  const [messages, setMessages] = useState([])
  const [streamingContent, setStreamingContent] = useState('')

  // 每次 streamingContent 变化，value 引用变化
  // 所有 useContext(ChatContext) 的组件都重渲染！
  return (
    <ChatContext.Provider value={{ messages, streamingContent, setMessages }}>
      {children}
    </ChatContext.Provider>
  )
}
```

#### 优化方案 1：拆分 Context

```jsx
// ✅ 优化：拆分为独立的 Context
const MessagesContext = createContext()
const StreamingContext = createContext()
const ActionsContext = createContext()

function ChatProvider({ children }) {
  const [messages, setMessages] = useState([])
  const [streamingContent, setStreamingContent] = useState('')

  // actions 引用稳定
  const actions = useMemo(
    () => ({
      addMessage: (msg) => setMessages((prev) => [...prev, msg]),
      setStreaming: setStreamingContent,
    }),
    [],
  )

  return (
    <ActionsContext.Provider value={actions}>
      <MessagesContext.Provider value={messages}>
        <StreamingContext.Provider value={streamingContent}>
          {children}
        </StreamingContext.Provider>
      </MessagesContext.Provider>
    </ActionsContext.Provider>
  )
}

// 组件只订阅需要的 Context
function MessageList() {
  const messages = useContext(MessagesContext)
  // 不订阅 StreamingContext，不受流式更新影响
  return messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
}
```

#### 优化方案 2：使用 useSyncExternalStore

```jsx
// 使用外部 store 管理流式状态
const streamingStore = {
  content: '',
  listeners: new Set(),

  setContent(content) {
    this.content = content
    this.listeners.forEach((listener) => listener())
  },

  subscribe(listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  },

  getSnapshot() {
    return this.content
  },
}

// 只订阅流式内容的组件
function StreamingDisplay() {
  const content = useSyncExternalStore(
    streamingStore.subscribe.bind(streamingStore),
    streamingStore.getSnapshot.bind(streamingStore),
  )

  return <MarkdownRenderer content={content} />
}
```

### 八、React.memo 配合比较函数

```jsx
const MessageBubble = memo(
  function MessageBubble({ message, isStreaming }) {
    return (
      <div className={`message ${message.role}`}>
        <Avatar role={message.role} />
        <MarkdownRenderer content={message.content} />
      </div>
    )
  },
  (prevProps, nextProps) => {
    // 自定义比较：只有内容实际变化才重渲染
    return (
      prevProps.message.id === nextProps.message.id &&
      prevProps.message.content === nextProps.message.content &&
      prevProps.isStreaming === nextProps.isStreaming
    )
  },
)
```

### 九、使用 CSS 动画而非 JS

对于打字机效果，优先使用 CSS 实现。

```css
/* 使用 CSS 动画实现光标闪烁，而不是 JS 定时器 */
.streaming-cursor::after {
  content: '|';
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

/* 渐显动画 */
.token-enter {
  animation: fadeIn 0.1s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
```

### 十、性能监控

```jsx
// 开发环境监控渲染次数
function useRenderCount(componentName) {
  const renderCount = useRef(0)

  useEffect(() => {
    renderCount.current += 1
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} 渲染次数:`, renderCount.current)
    }
  })
}

// 使用 React DevTools Profiler
function ChatPage() {
  return (
    <Profiler
      id="ChatPage"
      onRender={(id, phase, actualDuration) => {
        if (actualDuration > 16) {
          // 超过一帧时间
          console.warn(`${id} 渲染耗时: ${actualDuration.toFixed(2)}ms`)
        }
      }}
    >
      {/* 组件内容 */}
    </Profiler>
  )
}
```

### 十一、优化效果对比

| 优化策略     | 优化前            | 优化后         | 效果             |
| ------------ | ----------------- | -------------- | ---------------- |
| 状态下沉     | 整个列表重渲染    | 只渲染流式组件 | 渲染范围减少 90% |
| 节流更新     | 每 token 更新     | 每 50ms 更新   | 更新频率降低 80% |
| 增量渲染     | 全量解析 Markdown | 增量解析       | 解析时间减少 70% |
| Context 拆分 | 全量订阅          | 按需订阅       | 无关组件不渲染   |

### 十二、总结

```
优化层次:
┌─────────────────────────────────────────┐
│ 架构层：状态下沉、Context 拆分          │  ← 最重要
├─────────────────────────────────────────┤
│ 更新层：节流、RAF 批量更新              │  ← 减少更新频率
├─────────────────────────────────────────┤
│ 渲染层：memo、增量渲染                  │  ← 减少渲染开销
├─────────────────────────────────────────┤
│ 样式层：CSS 动画、避免复杂选择器        │  ← 细节优化
└─────────────────────────────────────────┘
```

核心原则：**减少更新范围、降低更新频率、复用计算结果**。
