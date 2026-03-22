## 问题

Promise.all 和 Promise.allSettled 的区别是什么？在调用多个模型接口时你会选哪个？

## 回答

### 一、核心区别

| 特性         | Promise.all            | Promise.allSettled          |
| ------------ | ---------------------- | --------------------------- |
| **失败行为** | 任一失败立即 reject    | 等待所有完成，不会 reject   |
| **返回值**   | 成功值数组或第一个错误 | 包含状态和值/原因的对象数组 |
| **短路特性** | 有（遇到失败立即返回） | 无（总是等待所有完成）      |
| **适用场景** | 全部成功才有意义       | 需要所有结果，不论成功失败  |
| **ES 版本**  | ES2015 (ES6)           | ES2020                      |

### 二、基本用法对比

#### Promise.all

```javascript
// Promise.all - 全部成功才返回结果
const promises = [
  fetch('/api/model/gpt4'),
  fetch('/api/model/claude'),
  fetch('/api/model/gemini'),
]

try {
  // 所有请求都成功时，results 是响应数组
  const results = await Promise.all(promises)
  console.log('所有模型响应:', results)
} catch (error) {
  // 任何一个失败，立即进入 catch
  // 其他请求的结果会被丢弃！
  console.error('有模型请求失败:', error)
}
```

#### Promise.allSettled

```javascript
// Promise.allSettled - 收集所有结果
const promises = [
  fetch('/api/model/gpt4'),
  fetch('/api/model/claude'),
  fetch('/api/model/gemini'),
]

// 永远不会 reject，总是返回结果数组
const results = await Promise.allSettled(promises)

// results 格式：
// [
//   { status: 'fulfilled', value: Response },
//   { status: 'rejected', reason: Error },
//   { status: 'fulfilled', value: Response }
// ]

// 分别处理成功和失败
const successful = results.filter((r) => r.status === 'fulfilled')
const failed = results.filter((r) => r.status === 'rejected')

console.log(`成功: ${successful.length}, 失败: ${failed.length}`)
```

### 三、AI 多模型调用场景

在调用多个 AI 模型时，**Promise.allSettled 通常是更好的选择**，原因如下：

#### 1. 提升用户体验

```javascript
/**
 * 同时调用多个模型，展示所有可用的响应
 */
async function queryMultipleModels(prompt) {
  const models = [
    { name: 'GPT-4', endpoint: '/api/gpt4' },
    { name: 'Claude', endpoint: '/api/claude' },
    { name: 'Gemini', endpoint: '/api/gemini' },
  ]

  const promises = models.map((model) =>
    fetch(model.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    })
      .then((res) => res.json())
      .then((data) => ({ model: model.name, response: data })),
  )

  // 使用 allSettled 确保获取所有结果
  const results = await Promise.allSettled(promises)

  // 处理结果
  const responses = []
  const errors = []

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      responses.push(result.value)
    } else {
      errors.push({
        model: models[index].name,
        error: result.reason.message,
      })
    }
  })

  return { responses, errors }
}

// 使用
const { responses, errors } = await queryMultipleModels('解释量子计算')

// 即使某个模型失败，仍能展示其他模型的回答
responses.forEach((r) => {
  console.log(`${r.model}: ${r.response.text}`)
})

// 可选：提示用户哪些模型失败了
if (errors.length > 0) {
  console.warn('部分模型不可用:', errors)
}
```

#### 2. 模型竞速 + 结果聚合

```javascript
/**
 * 竞速策略：使用最快响应，同时收集所有结果用于对比
 */
async function raceWithFullResults(prompt) {
  const modelCalls = [callGPT4(prompt), callClaude(prompt), callGemini(prompt)]

  // 使用 Promise.race 获取最快响应
  const fastestPromise = Promise.race(
    modelCalls.map((p, i) => p.then((result) => ({ result, index: i }))),
  )

  // 同时使用 allSettled 收集所有结果
  const allResultsPromise = Promise.allSettled(modelCalls)

  // 先展示最快的结果
  const fastest = await fastestPromise
  displayPrimaryResponse(fastest.result)

  // 后续展示其他模型的对比结果
  const allResults = await allResultsPromise
  displayComparison(allResults)
}
```

#### 3. 带超时的多模型调用

```javascript
/**
 * 为每个模型调用添加超时控制
 */
function withTimeout(promise, ms, modelName) {
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`${modelName} 超时`)), ms)
  })
  return Promise.race([promise, timeout])
}

async function queryModelsWithTimeout(prompt, timeoutMs = 10000) {
  const models = ['gpt4', 'claude', 'gemini']

  const promises = models.map((model) =>
    withTimeout(callModel(model, prompt), timeoutMs, model),
  )

  const results = await Promise.allSettled(promises)

  // 区分成功、超时、其他错误
  return results.map((result, index) => ({
    model: models[index],
    status: result.status,
    data: result.status === 'fulfilled' ? result.value : null,
    error: result.status === 'rejected' ? result.reason.message : null,
    timedOut: result.reason?.message?.includes('超时'),
  }))
}
```

### 四、何时使用 Promise.all？

虽然在多模型场景中 `allSettled` 更常用，但 `Promise.all` 在以下情况更合适：

#### 1. 强依赖关系

```javascript
/**
 * 所有步骤必须成功才能继续
 */
async function processWithDependencies(input) {
  try {
    // 这三个步骤必须全部成功
    const [tokenized, embedded, indexed] = await Promise.all([
      tokenize(input), // 分词
      getEmbedding(input), // 获取向量
      searchIndex(input), // 搜索索引
    ])

    // 只有全部成功才进行下一步
    return combineResults(tokenized, embedded, indexed)
  } catch (error) {
    // 任一失败，整体失败
    throw new Error('处理流程失败: ' + error.message)
  }
}
```

#### 2. 事务性操作

```javascript
/**
 * 多个写操作需要原子性
 */
async function saveToMultipleStores(data) {
  try {
    await Promise.all([
      saveToDatabase(data),
      saveToCache(data),
      updateSearchIndex(data),
    ])
    console.log('所有存储成功')
  } catch (error) {
    // 需要回滚
    await rollback()
    throw error
  }
}
```

### 五、高级模式：封装统一处理函数

```typescript
interface ModelResult<T> {
  model: string
  status: 'success' | 'error' | 'timeout'
  data?: T
  error?: string
  duration: number
}

/**
 * 统一的多模型调用封装
 */
async function callMultipleModels<T>(
  calls: Array<{
    name: string
    call: () => Promise<T>
    timeout?: number
  }>,
  options: {
    defaultTimeout?: number
    minSuccessCount?: number // 最少需要成功的数量
  } = {},
): Promise<{
  results: ModelResult<T>[]
  hasMinSuccess: boolean
}> {
  const { defaultTimeout = 30000, minSuccessCount = 1 } = options

  const promises = calls.map(async ({ name, call, timeout }) => {
    const startTime = Date.now()

    try {
      const result = await withTimeout(call(), timeout ?? defaultTimeout, name)

      return {
        model: name,
        status: 'success' as const,
        data: result,
        duration: Date.now() - startTime,
      }
    } catch (error) {
      const isTimeout = error.message?.includes('超时')
      return {
        model: name,
        status: isTimeout ? ('timeout' as const) : ('error' as const),
        error: error.message,
        duration: Date.now() - startTime,
      }
    }
  })

  const results = await Promise.allSettled(promises)
  const finalResults = results.map((r) =>
    r.status === 'fulfilled' ? r.value : r.reason,
  )

  const successCount = finalResults.filter((r) => r.status === 'success').length

  return {
    results: finalResults,
    hasMinSuccess: successCount >= minSuccessCount,
  }
}

// 使用示例
const { results, hasMinSuccess } = await callMultipleModels(
  [
    { name: 'GPT-4', call: () => callGPT4(prompt), timeout: 15000 },
    { name: 'Claude', call: () => callClaude(prompt), timeout: 20000 },
    { name: 'Gemini', call: () => callGemini(prompt) }, // 使用默认超时
  ],
  {
    minSuccessCount: 2, // 至少需要 2 个模型成功
  },
)

if (!hasMinSuccess) {
  showWarning('多数模型响应失败，结果可能不完整')
}
```

### 六、性能考虑

```javascript
/**
 * 带并发控制的批量调用
 * 避免同时发起过多请求
 */
async function callModelsWithConcurrency(prompts, maxConcurrent = 3) {
  const results = []

  // 分批处理
  for (let i = 0; i < prompts.length; i += maxConcurrent) {
    const batch = prompts.slice(i, i + maxConcurrent)
    const batchPromises = batch.map((prompt) => callModel(prompt))

    // 每批使用 allSettled
    const batchResults = await Promise.allSettled(batchPromises)
    results.push(...batchResults)
  }

  return results
}
```

### 七、总结

| 场景           | 推荐方法   | 原因               |
| -------------- | ---------- | ------------------ |
| **多模型比较** | allSettled | 展示所有可用响应   |
| **容错查询**   | allSettled | 部分失败不影响整体 |
| **批量处理**   | allSettled | 收集所有结果统计   |
| **强依赖流程** | all        | 全部成功才有意义   |
| **事务操作**   | all        | 需要原子性保证     |
| **资源加载**   | all        | 缺一不可的资源     |

**核心原则**：

- 需要"尽力而为"的结果 → `Promise.allSettled`
- 需要"全有或全无"的保证 → `Promise.all`

在 AI 应用中，由于模型调用的不确定性（网络延迟、服务可用性、限流等），`Promise.allSettled` 能提供更好的用户体验和系统健壮性。
