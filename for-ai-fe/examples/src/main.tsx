import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { SSEStreamingDemo } from './demos/01-sse-streaming'
import { AbortRequestDemo } from './demos/02-abort-request'
import { AutoScrollDemo } from './demos/03-auto-scroll'
import { MultiModelDemo } from './demos/04-multi-model'
import { PromptTemplateDemo } from './demos/05-prompt-template'
import { StateMachineDemo } from './demos/06-state-machine'
import { RenderOptimizationDemo } from './demos/07-render-optimization'
import { MarkdownRenderDemo } from './demos/08-markdown-render'
import { FeedbackDesignDemo } from './demos/09-feedback-design'
import './styles.css'

const DEMOS = [
  {
    path: '/01-sse-streaming',
    number: '01',
    title: 'SSE 流式输出',
    desc: '体验 Server-Sent Events 流式传输，逐字显示 AI 回复',
    component: SSEStreamingDemo,
  },
  {
    path: '/02-abort-request',
    number: '02',
    title: '中断请求',
    desc: '使用 AbortController 中断正在进行的流式请求',
    component: AbortRequestDemo,
  },
  {
    path: '/03-auto-scroll',
    number: '03',
    title: '自动滚动聊天容器',
    desc: '智能滚动：新消息自动滚动，用户滚动时暂停',
    component: AutoScrollDemo,
  },
  {
    path: '/04-multi-model',
    number: '04',
    title: '多模型并发调用',
    desc: 'Promise.all vs allSettled 在多模型场景的对比',
    component: MultiModelDemo,
  },
  {
    path: '/05-prompt-template',
    number: '05',
    title: 'Prompt 模板管理',
    desc: '模板变量解析、动态表单生成、Prompt 填充',
    component: PromptTemplateDemo,
  },
  {
    path: '/06-state-machine',
    number: '06',
    title: '对话状态机',
    desc: '支持中断和重新生成的多轮对话状态管理',
    component: StateMachineDemo,
  },
  {
    path: '/07-render-optimization',
    number: '07',
    title: '高频渲染优化',
    desc: 'RAF 节流 + useTransition 优化流式渲染性能',
    component: RenderOptimizationDemo,
  },
  {
    path: '/08-markdown-render',
    number: '08',
    title: 'Markdown 渲染',
    desc: '代码高亮、表格、列表等 Markdown 元素渲染',
    component: MarkdownRenderDemo,
  },
  {
    path: '/09-feedback-design',
    number: '09',
    title: 'AI 反馈设计',
    desc: '点赞/点踩、幻觉反馈收集、重新生成机制',
    component: FeedbackDesignDemo,
  },
]

function Home() {
  return (
    <div className="home">
      <h1>for-ai-fe Demo</h1>
      <p className="subtitle">
        配合题集的可运行示例（共 {DEMOS.length} 个） /
        <a
          href="https://github.com/z0gSh1u/for-ai-fe"
          target="_blank"
          rel="noopener noreferrer"
          style={{ marginLeft: '1em', textDecoration: 'none' }}
        >
          GitHub
        </a>
      </p>

      <div className="config-check">
        <ConfigStatus />
      </div>

      <div className="demo-list">
        {DEMOS.map((demo) => (
          <Link key={demo.path} to={demo.path} className="demo-card">
            <span className="demo-number">{demo.number}</span>
            <div className="demo-info">
              <h3>{demo.title}</h3>
              <p>{demo.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function ConfigStatus() {
  const baseUrl = import.meta.env.VITE_API_BASE_URL
  const apiKey = import.meta.env.VITE_API_KEY
  const model = import.meta.env.VITE_MODEL

  const isConfigured = baseUrl && apiKey && model

  if (!isConfigured) {
    return (
      <div className="config-warning">
        ⚠️ 请先配置 API：复制 <code>.env.example</code> 为 <code>.env.local</code>{' '}
        并填入你的 API 配置
      </div>
    )
  }

  return (
    <div className="config-ok">
      ✅ 已配置：{baseUrl} / {model}
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        {DEMOS.map((demo) => (
          <Route key={demo.path} path={demo.path} element={<demo.component />} />
        ))}
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
