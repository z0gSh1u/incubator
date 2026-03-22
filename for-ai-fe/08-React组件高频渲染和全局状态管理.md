## 问题

接续问题 07，如果使用了 Redux、Zustand 等全局状态管理器，你会如何处理这种高频更新的数据？

## 回答

### 一、核心问题

全局状态管理器处理高频更新面临的挑战：

1. **订阅触发**：状态变化会通知所有订阅者
2. **引用变化**：每次更新都产生新的对象引用
3. **中间件开销**：Redux 的 action/reducer 流程有额外成本
4. **持久化干扰**：可能触发不必要的持久化操作

### 二、Zustand 方案（推荐）

Zustand 因其轻量和灵活性，非常适合处理高频更新场景。

#### 1. 基础设置：分离流式状态

```typescript
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface ChatStore {
  // 稳定数据：历史消息
  messages: Message[]
  addMessage: (message: Message) => void

  // 高频数据：流式内容（单独管理）
  streamingContent: string
  streamingMessageId: string | null
  setStreamingContent: (content: string) => void
  startStreaming: (messageId: string) => void
  finishStreaming: () => void
}

export const useChatStore = create<ChatStore>()(
  subscribeWithSelector((set, get) => ({
    messages: [],
    streamingContent: '',
    streamingMessageId: null,

    addMessage: (message) =>
      set((state) => ({
        messages: [...state.messages, message],
      })),

    setStreamingContent: (content) =>
      set({
        streamingContent: content,
      }),

    startStreaming: (messageId) =>
      set({
        streamingMessageId: messageId,
        streamingContent: '',
      }),

    finishStreaming: () => {
      const { streamingContent, streamingMessageId } = get()
      if (streamingMessageId && streamingContent) {
        set((state) => ({
          messages: [
            ...state.messages,
            {
              id: streamingMessageId,
              role: 'assistant',
              content: streamingContent,
            },
          ],
          streamingContent: '',
          streamingMessageId: null,
        }))
      }
    },
  })),
)
```

#### 2. 精确订阅：只订阅需要的数据

```tsx
// ✅ 只订阅 messages，不受 streamingContent 影响
function MessageList() {
  // 使用 selector 精确订阅
  const messages = useChatStore((state) => state.messages);

  return (
    <>
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
    </>
  );
}

// ✅ 只订阅流式内容
function StreamingDisplay() {
  const streamingContent = useChatStore((state) => state.streamingContent);
  const isStreaming = useChatStore((state) => state.streamingMessageId !== null);

  if (!isStreaming) return null;

  return <MarkdownRenderer content={streamingContent} />;
}

// ✅ 订阅稳定的 actions（引用不变）
function ChatInput() {
  const addMessage = useChatStore((state) => state.addMessage);
  // addMessage 引用稳定，组件不会因其他状态变化而重渲染

  return <input onSubmit={(text) => addMessage({ ... })} />;
}
```

#### 3. 使用 shallow 比较优化

```tsx
import { shallow } from 'zustand/shallow'

// 订阅多个状态时使用 shallow 比较
function ChatStatus() {
  const { isStreaming, messageCount } = useChatStore(
    (state) => ({
      isStreaming: state.streamingMessageId !== null,
      messageCount: state.messages.length,
    }),
    shallow, // 浅比较，避免引用变化导致的重渲染
  )

  return (
    <div>
      消息数: {messageCount}
      {isStreaming && <span>正在生成...</span>}
    </div>
  )
}
```

#### 4. 节流更新中间件

```typescript
import { create, StateCreator } from 'zustand'

// 节流中间件
const throttleMiddleware =
  <T extends object>(
    config: StateCreator<T>,
    throttleKeys: (keyof T)[],
    delay: number = 50,
  ): StateCreator<T> =>
  (set, get, api) => {
    let pendingUpdates: Partial<T> = {}
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const throttledSet = (partial: Partial<T> | ((state: T) => Partial<T>)) => {
      const updates = typeof partial === 'function' ? partial(get()) : partial

      // 检查是否包含需要节流的 key
      const hasThrottleKey = Object.keys(updates).some((key) =>
        throttleKeys.includes(key as keyof T),
      )

      if (hasThrottleKey) {
        // 合并待处理的更新
        pendingUpdates = { ...pendingUpdates, ...updates }

        if (!timeoutId) {
          timeoutId = setTimeout(() => {
            set(pendingUpdates as Partial<T>)
            pendingUpdates = {}
            timeoutId = null
          }, delay)
        }
      } else {
        // 非节流字段立即更新
        set(updates)
      }
    }

    return config(throttledSet as typeof set, get, api)
  }

// 使用节流中间件
export const useChatStore = create<ChatStore>()(
  throttleMiddleware(
    (set, get) => ({
      // ... store 定义
    }),
    ['streamingContent'], // 只对 streamingContent 节流
    50, // 50ms
  ),
)
```

### 三、Redux Toolkit 方案

如果项目使用 Redux，需要更谨慎地处理高频更新。

#### 1. 分离 Slice

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

// 稳定数据 Slice
const messagesSlice = createSlice({
  name: 'messages',
  initialState: {
    list: [] as Message[],
  },
  reducers: {
    addMessage: (state, action: PayloadAction<Message>) => {
      state.list.push(action.payload)
    },
  },
})

// 高频数据 Slice（独立管理）
const streamingSlice = createSlice({
  name: 'streaming',
  initialState: {
    content: '',
    messageId: null as string | null,
  },
  reducers: {
    setContent: (state, action: PayloadAction<string>) => {
      state.content = action.payload
    },
    startStreaming: (state, action: PayloadAction<string>) => {
      state.messageId = action.payload
      state.content = ''
    },
    finishStreaming: (state) => {
      state.messageId = null
      state.content = ''
    },
  },
})
```

#### 2. 批量更新 Action

```typescript
import { createAction } from '@reduxjs/toolkit'

// 批量更新 action
export const batchAppendTokens = createAction<string[]>('streaming/batchAppend')

// 自定义 reducer 处理批量更新
const streamingSlice = createSlice({
  name: 'streaming',
  initialState: { content: '', messageId: null },
  reducers: {
    // ...
  },
  extraReducers: (builder) => {
    builder.addCase(batchAppendTokens, (state, action) => {
      // 一次处理多个 token
      state.content += action.payload.join('')
    })
  },
})

// 使用：累积 token 后批量 dispatch
class TokenBatcher {
  private tokens: string[] = []
  private timeoutId: ReturnType<typeof setTimeout> | null = null

  constructor(
    private dispatch: AppDispatch,
    private delay = 50,
  ) {}

  add(token: string) {
    this.tokens.push(token)

    if (!this.timeoutId) {
      this.timeoutId = setTimeout(() => {
        this.dispatch(batchAppendTokens(this.tokens))
        this.tokens = []
        this.timeoutId = null
      }, this.delay)
    }
  }

  flush() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
    if (this.tokens.length > 0) {
      this.dispatch(batchAppendTokens(this.tokens))
      this.tokens = []
    }
  }
}
```

#### 3. 使用 Reselect 优化选择器

```typescript
import { createSelector } from '@reduxjs/toolkit'

// 记忆化选择器
const selectMessages = (state: RootState) => state.messages.list
const selectStreamingContent = (state: RootState) => state.streaming.content

// 派生数据选择器
export const selectAllContent = createSelector(
  [selectMessages, selectStreamingContent],
  (messages, streaming) => ({
    messages,
    hasStreaming: streaming.length > 0,
  }),
)

// 组件中使用
function ChatView() {
  // 只有 messages 或 streaming 实际变化时才重新计算
  const { messages, hasStreaming } = useSelector(selectAllContent)
}
```

#### 4. 绕过 Redux 处理超高频更新

对于极高频的更新，可以考虑绕过 Redux：

```typescript
import { useRef, useSyncExternalStore } from 'react'

// 外部 store，不走 Redux
class StreamingStore {
  private content = ''
  private listeners = new Set<() => void>()

  append(token: string) {
    this.content += token
    this.notify()
  }

  reset() {
    this.content = ''
    this.notify()
  }

  private notify() {
    this.listeners.forEach((l) => l())
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getSnapshot = () => this.content
}

export const streamingStore = new StreamingStore()

// React Hook
export function useStreamingContent() {
  return useSyncExternalStore(streamingStore.subscribe, streamingStore.getSnapshot)
}

// 流结束时同步到 Redux
function finalizeStreaming(dispatch: AppDispatch) {
  const content = streamingStore.getSnapshot()
  dispatch(
    messagesSlice.actions.addMessage({
      id: Date.now().toString(),
      role: 'assistant',
      content,
    }),
  )
  streamingStore.reset()
}
```

### 四、Jotai 方案

Jotai 的原子化设计非常适合隔离高频更新。

```typescript
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';

// 历史消息 atom
const messagesAtom = atom<Message[]>([]);

// 流式内容 atom（独立原子）
const streamingContentAtom = atom('');
const streamingIdAtom = atom<string | null>(null);

// 派生 atom：是否在流式输出
const isStreamingAtom = atom((get) => get(streamingIdAtom) !== null);

// 添加消息的 action atom
const addMessageAtom = atom(
  null,
  (get, set, message: Message) => {
    set(messagesAtom, [...get(messagesAtom), message]);
  }
);

// 完成流式输出的 action atom
const finishStreamingAtom = atom(
  null,
  (get, set) => {
    const content = get(streamingContentAtom);
    const id = get(streamingIdAtom);

    if (id && content) {
      set(messagesAtom, [...get(messagesAtom), {
        id,
        role: 'assistant',
        content
      }]);
    }

    set(streamingContentAtom, '');
    set(streamingIdAtom, null);
  }
);

// 组件使用
function MessageList() {
  // 只订阅 messages，不受 streaming 影响
  const messages = useAtomValue(messagesAtom);
  return <>{messages.map(m => <Message key={m.id} message={m} />)}</>;
}

function StreamingMessage() {
  // 只订阅流式内容
  const content = useAtomValue(streamingContentAtom);
  const isStreaming = useAtomValue(isStreamingAtom);

  if (!isStreaming) return null;
  return <MarkdownRenderer content={content} />;
}
```

### 五、通用优化策略

#### 1. 不要在 store 中存储解析后的内容

```typescript
// ❌ 不好：存储解析后的 HTML
interface BadStore {
  streamingHtml: string;  // 每次都要重新序列化
}

// ✅ 好：只存储原始内容，组件内解析
interface GoodStore {
  streamingContent: string;  // 原始 Markdown
}

// 组件内使用 useMemo 解析
function StreamingDisplay() {
  const content = useStore(s => s.streamingContent);
  const html = useMemo(() => marked.parse(content), [content]);
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
```

#### 2. 使用 transient updates

对于不需要触发渲染的更新：

```typescript
// Zustand 支持 transient updates
const useChatStore = create((set, get) => ({
  // 不触发订阅的内部状态
  _internalBuffer: '',

  // 累积 token（不触发渲染）
  appendToBuffer: (token: string) => {
    // 直接修改，不调用 set
    get()._internalBuffer += token
  },

  // 刷新到正式状态（触发渲染）
  flushBuffer: () => {
    const buffer = get()._internalBuffer
    set({
      streamingContent: buffer,
      _internalBuffer: '',
    })
  },
}))
```

#### 3. 排除高频状态的持久化

```typescript
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

const useChatStore = create(
  persist(
    (set, get) => ({
      messages: [],
      streamingContent: '', // 这个不应该持久化
      // ...
    }),
    {
      name: 'chat-storage',
      storage: createJSONStorage(() => localStorage),
      // 排除高频更新字段
      partialize: (state) => ({
        messages: state.messages,
        // 不包含 streamingContent
      }),
    },
  ),
)
```

### 六、性能对比

| 状态库            | 订阅机制        | 高频优化难度 | 推荐场景             |
| ----------------- | --------------- | ------------ | -------------------- |
| **Zustand**       | 选择器订阅      | 简单         | 中小型项目，高频更新 |
| **Jotai**         | 原子订阅        | 简单         | 需要细粒度控制       |
| **Redux Toolkit** | 选择器 + 中间件 | 中等         | 大型项目，复杂状态   |
| **Valtio**        | Proxy 自动追踪  | 简单         | 需要可变风格 API     |

### 七、最佳实践总结

```
高频更新数据处理策略:

1. 状态隔离
   ├── 将高频数据放在独立的 store/atom/slice
   └── 使用精确订阅，避免不相关组件重渲染

2. 更新优化
   ├── 节流/批量更新，减少 dispatch 次数
   ├── 使用 RAF 对齐浏览器渲染
   └── 考虑绕过状态库，使用 useSyncExternalStore

3. 选择器优化
   ├── 使用 shallow 比较
   ├── 使用 createSelector 记忆化
   └── 避免在选择器中创建新对象

4. 持久化隔离
   └── 排除高频字段，避免频繁写入存储
```

核心原则：**隔离 + 节流 + 精确订阅**。
