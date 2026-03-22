## 问题

请简述 SSE (Server-Sent Events) 与 WebSocket 的区别，为什么 AI 对话场景多采用 SSE？

## 回答

### 一、SSE 与 WebSocket 核心对比

| 特性            | SSE                         | WebSocket                          |
| --------------- | --------------------------- | ---------------------------------- |
| **协议基础**    | 基于标准 HTTP/HTTPS 协议    | 独立的 TCP 协议（ws:// 或 wss://） |
| **数据流向**    | 单向（服务器 → 客户端）     | 全双工双向通信                     |
| **连接建立**    | 普通 HTTP 请求，无需握手    | 需要 Upgrade 握手过程              |
| **断线重连**    | 浏览器原生支持自动重连      | 需要手动实现重连逻辑               |
| **数据格式**    | 纯文本（text/event-stream） | 文本和二进制均支持                 |
| **浏览器支持**  | 原生支持（除 IE）           | 广泛支持                           |
| **代理/防火墙** | 友好（标准 HTTP 流量）      | 可能被拦截                         |

### 二、协议层面的差异

**SSE 基于 HTTP 协议**：客户端通过普通的 HTTP 请求建立连接，服务器返回 `Content-Type: text/event-stream` 的响应，然后持续推送数据。

```javascript
// SSE 客户端实现
const eventSource = new EventSource('/api/chat/stream')

// 监听消息事件
eventSource.onmessage = (event) => {
  console.log('收到数据:', event.data)
}

// 监听自定义事件
eventSource.addEventListener('token', (event) => {
  // 处理 AI 输出的每个 token
  appendToChat(event.data)
})

// 错误处理 - SSE 会自动尝试重连
eventSource.onerror = (error) => {
  console.error('连接错误:', error)
}
```

**WebSocket 是独立协议**：需要通过 HTTP Upgrade 机制升级连接，建立后使用独立的帧协议通信。

```javascript
// WebSocket 客户端实现
const ws = new WebSocket('wss://example.com/chat')

ws.onopen = () => {
  // 可以双向发送消息
  ws.send(JSON.stringify({ type: 'message', content: 'Hello' }))
}

ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  console.log('收到:', data)
}

// 需要手动实现重连逻辑
ws.onclose = () => {
  setTimeout(() => reconnect(), 3000)
}
```

### 三、为什么 AI 对话场景更适合 SSE？

#### 1. 天然匹配单向流式输出

AI 大模型（如 GPT、Claude）的响应是**逐 token 生成**的，本质上是服务器向客户端的单向数据流。用户发送问题后，只需等待 AI 持续输出，不需要在输出过程中向服务器发送数据。

```javascript
// 典型的 AI 流式响应处理
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: userInput }),
})

// 使用 ReadableStream 处理流式响应
const reader = response.body.getReader()
const decoder = new TextDecoder()

while (true) {
  const { done, value } = await reader.read()
  if (done) break

  // 解析 SSE 格式的数据
  const chunk = decoder.decode(value)
  const lines = chunk.split('\n')

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6)
      if (data === '[DONE]') return

      // 逐步渲染 AI 输出
      const parsed = JSON.parse(data)
      appendToken(parsed.choices[0].delta.content)
    }
  }
}
```

#### 2. 实现简单，运维成本低

- **无需额外基础设施**：SSE 使用标准 HTTP，可以直接通过 Nginx、CDN 等代理
- **无状态友好**：每次对话可以是独立的 HTTP 请求，便于负载均衡
- **调试方便**：可以直接用浏览器开发者工具查看请求响应

#### 3. 原生支持断线重连

SSE 的 `EventSource` API 内置了自动重连机制，通过 `Last-Event-ID` 头可以实现断点续传：

```javascript
// 服务器端可以为每个事件设置 ID
// data: {"token": "Hello"}
// id: 12345
//
// 断线重连时，浏览器会自动带上 Last-Event-ID: 12345
```

#### 4. 对企业网络环境更友好

很多企业防火墙会拦截 WebSocket 的 Upgrade 请求，但 SSE 作为普通 HTTP 流量通常不受限制。

### 四、SSE 服务端实现示例

```javascript
// Node.js + Express 实现 SSE
app.get('/api/chat/stream', async (req, res) => {
  // 设置 SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  // 模拟 AI 流式输出
  const tokens = ['你好', '，', '我是', 'AI', '助手', '。']

  for (const token of tokens) {
    // SSE 格式：data: xxx\n\n
    res.write(`data: ${JSON.stringify({ token })}\n\n`)
    await sleep(100) // 模拟生成延迟
  }

  // 发送结束信号
  res.write('data: [DONE]\n\n')
  res.end()
})
```

### 五、需要注意的问题

#### 1. HTTP/1.1 并发连接限制

在 HTTP/1.1 下，浏览器对同一域名的并发连接数限制为 **6 个**。如果用户打开多个标签页，可能耗尽连接配额。

**解决方案**：

- 使用 HTTP/2（多路复用，无此限制）
- 使用不同子域名分散连接
- 对话结束后及时关闭连接

#### 2. 二进制数据传输

SSE 原生只支持文本传输，但可以通过 Base64 编码传输二进制数据：

```javascript
// 服务端发送图片数据
const imageBase64 = Buffer.from(imageData).toString('base64')
res.write(`data: {"type": "image", "data": "${imageBase64}"}\n\n`)

// 客户端解码
eventSource.onmessage = (event) => {
  const { type, data } = JSON.parse(event.data)
  if (type === 'image') {
    const blob = base64ToBlob(data, 'image/png')
    displayImage(URL.createObjectURL(blob))
  }
}
```

#### 3. 跨域配置

SSE 请求受同源策略限制，跨域需要配置 CORS：

```javascript
// 服务端需要设置
res.setHeader('Access-Control-Allow-Origin', 'https://your-domain.com')
res.setHeader('Access-Control-Allow-Credentials', 'true')

// 客户端需要指定 withCredentials
const eventSource = new EventSource('/api/stream', {
  withCredentials: true,
})
```

### 六、什么时候该用 WebSocket？

虽然 AI 对话场景 SSE 更合适，但以下场景 WebSocket 更优：

- **实时协作编辑**：需要多用户双向同步
- **在线游戏**：需要低延迟双向通信
- **实时语音/视频信令**：需要频繁双向交互
- **复杂的多人聊天室**：需要广播和点对点消息

### 七、总结

SSE 在 AI 对话场景的优势可以概括为：**简单够用**。它完美匹配了 LLM 流式输出的单向数据流特性，同时具备实现简单、兼容性好、自动重连等优点。除非有明确的双向通信需求，否则 SSE 应该是 AI 应用流式输出的首选方案。
