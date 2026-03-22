/**
 * Demo 08: Markdown 渲染与代码高亮
 *
 * 演示 AI 回复的 Markdown 渲染：
 * - 代码块语法高亮
 * - 表格、列表支持
 * - 数学公式（可选）
 * - 流式渲染的闪烁处理
 */

import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { streamChat } from '../../client'
import styles from './index.module.css'

// 简单的代码高亮（实际项目可用 react-syntax-highlighter）
function CodeBlock({
  className,
  children,
}: {
  className?: string
  children?: React.ReactNode
}) {
  const language = className?.replace('language-', '') || 'text'
  const code = String(children).replace(/\n$/, '')

  return (
    <div className={styles.codeBlockWrapper}>
      <div className={styles.languageLabel}>{language}</div>
      <pre className={styles.codeBlockPre}>
        <code>{code}</code>
      </pre>
    </div>
  )
}

// Markdown 组件配置
const markdownComponents = {
  code: ({
    inline,
    className,
    children,
  }: {
    inline?: boolean
    className?: string
    children?: React.ReactNode
  }) => {
    if (inline) {
      return <code className={styles.inlineCode}>{children}</code>
    }
    return <CodeBlock className={className}>{children}</CodeBlock>
  },
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className={styles.tableWrapper}>
      <table>{children}</table>
    </div>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className={styles.tableHeader}>{children}</th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className={styles.tableCell}>{children}</td>
  ),
}

// 预设测试 prompt
const TEST_PROMPTS = [
  {
    id: 'code',
    name: '代码示例',
    prompt: '请用 JavaScript 写一个防抖函数，并解释原理。',
  },
  {
    id: 'table',
    name: '表格',
    prompt: '用表格对比 React、Vue、Angular 的特点（至少 5 个维度）。',
  },
  {
    id: 'list',
    name: '列表',
    prompt: '列出前端性能优化的 10 个方法，包含要点和示例。',
  },
  {
    id: 'mixed',
    name: '混合内容',
    prompt:
      '解释 Promise 的用法，包含：概念说明、代码示例、常见方法对比表格、使用建议列表。',
  },
]

export function MarkdownRenderDemo() {
  const [content, setContent] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [activePrompt, setActivePrompt] = useState<string>('')

  const handleTest = async (prompt: string, id: string) => {
    setContent('')
    setActivePrompt(id)
    setIsStreaming(true)

    await streamChat(
      {
        messages: [
          {
            role: 'system',
            content:
              '你是一个技术专家。请使用丰富的 Markdown 格式回答，包括标题、代码块、列表、表格等。',
          },
          { role: 'user', content: prompt },
        ],
      },
      {
        onToken: (token) => setContent((prev) => prev + token),
        onComplete: () => setIsStreaming(false),
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
        <h1>08 - Markdown 渲染</h1>
      </div>

      <div className="demo-description">
        <h3>💡 核心知识点</h3>
        <p>
          使用 <code>react-markdown</code> + <code>remark-gfm</code> 渲染 AI
          回复，自定义组件处理代码高亮、表格样式等，支持流式渲染。
        </p>
      </div>

      {/* 测试按钮 */}
      <div className={styles.testButtons}>
        {TEST_PROMPTS.map((item) => (
          <button
            key={item.id}
            onClick={() => handleTest(item.prompt, item.id)}
            disabled={isStreaming}
            className={`${styles.testButton} ${activePrompt === item.id ? styles.active : ''}`}
          >
            {item.name}
          </button>
        ))}
      </div>

      {/* 内容展示 */}
      <div className={styles.contentDisplay}>
        {content ? (
          <div className="markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {content}
            </ReactMarkdown>
            {isStreaming && <span className="cursor" />}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div>
              <div className={styles.emptyIcon}>📝</div>
              <p>选择上方的测试用例</p>
            </div>
          </div>
        )}
      </div>

      {/* 自定义组件说明 */}
      <div className={styles.componentSection}>
        <h4>🔧 自定义渲染组件</h4>
        <pre>
          {`const markdownComponents = {
  // 代码块：添加语言标签和高亮
  code: ({ inline, className, children }) => {
    if (inline) return <code className="inline-code">{children}</code>;
    const language = className?.replace('language-', '');
    return <CodeBlock language={language}>{children}</CodeBlock>;
  },
  
  // 表格：自定义样式
  table: ({ children }) => (
    <div className="table-wrapper">
      <table>{children}</table>
    </div>
  ),
  
  // 链接：新窗口打开
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener">
      {children}
    </a>
  ),
};

<ReactMarkdown 
  remarkPlugins={[remarkGfm]} 
  components={markdownComponents}
>
  {content}
</ReactMarkdown>`}
        </pre>
      </div>
    </div>
  )
}
