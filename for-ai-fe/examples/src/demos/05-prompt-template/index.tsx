/**
 * Demo 05: Prompt 模板管理
 *
 * 演示可扩展的 Prompt 模板系统：
 * - 模板解析与变量提取
 * - 动态表单生成
 * - 变量填充与预览
 */

import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { streamChat } from '../../client'
import styles from './index.module.css'

// 预设模板
const PRESET_TEMPLATES: Array<{
  id: string
  name: string
  template: string
  variables: Record<string, string>
}> = [
  {
    id: 'translator',
    name: '翻译助手',
    template: '请将以下{{source_lang}}文本翻译成{{target_lang}}：\n\n{{content}}',
    variables: {
      source_lang: '中文',
      target_lang: '英文',
      content: '你好，世界！',
    },
  },
  {
    id: 'code-review',
    name: '代码审查',
    template:
      '请审查以下{{language}}代码，重点关注{{focus_area}}：\n\n```{{language}}\n{{code}}\n```',
    variables: {
      language: 'JavaScript',
      focus_area: '性能和可读性',
      code: 'function add(a, b) { return a + b; }',
    },
  },
  {
    id: 'summary',
    name: '文章摘要',
    template: '请用{{style}}风格，将以下文章总结为{{length}}字以内：\n\n{{article}}',
    variables: {
      style: '简洁专业',
      length: '100',
      article: '这里粘贴文章内容...',
    },
  },
]

// 解析模板中的变量
function parseTemplateVariables(template: string): string[] {
  const regex = /\{\{(\w+)\}\}/g
  const variables: string[] = []
  let match

  while ((match = regex.exec(template)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1])
    }
  }

  return variables
}

// 填充模板
function fillTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return variables[key] || `{{${key}}}`
  })
}

export function PromptTemplateDemo() {
  const [selectedTemplate, setSelectedTemplate] = useState(PRESET_TEMPLATES[0])
  const [customTemplate, setCustomTemplate] = useState('')
  const [isCustomMode, setIsCustomMode] = useState(false)
  const [variables, setVariables] = useState<Record<string, string>>(
    PRESET_TEMPLATES[0].variables,
  )
  const [result, setResult] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // 当前使用的模板
  const currentTemplate = isCustomMode ? customTemplate : selectedTemplate.template

  // 解析出的变量列表
  const templateVariables = useMemo(
    () => parseTemplateVariables(currentTemplate),
    [currentTemplate],
  )

  // 填充后的预览
  const filledPrompt = useMemo(
    () => fillTemplate(currentTemplate, variables),
    [currentTemplate, variables],
  )

  // 切换预设模板
  const handleTemplateChange = (templateId: string) => {
    const template = PRESET_TEMPLATES.find((t) => t.id === templateId)
    if (template) {
      setSelectedTemplate(template)
      setVariables(template.variables)
      setIsCustomMode(false)
    }
  }

  // 更新变量值
  const handleVariableChange = (key: string, value: string) => {
    setVariables((prev) => ({ ...prev, [key]: value }))
  }

  // 执行 Prompt
  const handleExecute = async () => {
    setIsLoading(true)
    setResult('')

    await streamChat(
      {
        messages: [{ role: 'user', content: filledPrompt }],
      },
      {
        onToken: (token) => setResult((prev) => prev + token),
        onComplete: () => setIsLoading(false),
        onError: (error) => {
          setResult(`❌ 错误: ${error.message}`)
          setIsLoading(false)
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
        <h1>05 - Prompt 模板管理</h1>
      </div>

      <div className="demo-description">
        <h3>💡 核心知识点</h3>
        <p>
          使用 <code>{`{{variable}}`}</code> 语法定义模板变量，通过正则解析提取变量，
          动态生成表单，最终填充生成完整 Prompt。
        </p>
      </div>

      <div className={styles.gridLayout}>
        {/* 左侧：模板配置 */}
        <div>
          {/* 模板选择 */}
          <div className={styles.section}>
            <h4>📝 选择模板</h4>
            <div className={styles.buttonGroup}>
              {PRESET_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleTemplateChange(t.id)}
                  className={`${styles.templateButton} ${!isCustomMode && selectedTemplate.id === t.id ? styles.active : ''}`}
                >
                  {t.name}
                </button>
              ))}
              <button
                onClick={() => setIsCustomMode(true)}
                className={`${styles.templateButton} ${isCustomMode ? styles.active : ''}`}
              >
                自定义
              </button>
            </div>
          </div>

          {/* 模板编辑（自定义模式） */}
          {isCustomMode && (
            <div className={styles.section}>
              <h4>✏️ 自定义模板</h4>
              <textarea
                value={customTemplate}
                onChange={(e) => setCustomTemplate(e.target.value)}
                placeholder="使用 {{变量名}} 定义变量，例如：请将 {{content}} 翻译成 {{language}}"
                className={styles.templateTextarea}
              />
            </div>
          )}

          {/* 变量表单 */}
          <div className={styles.section}>
            <h4>🔧 变量配置</h4>
            {templateVariables.length === 0 ? (
              <p className={styles.emptyText}>模板中没有变量</p>
            ) : (
              templateVariables.map((varName) => (
                <div key={varName} className={styles.variableForm}>
                  <label className={styles.variableLabel}>{varName}</label>
                  {varName === 'content' ||
                  varName === 'code' ||
                  varName === 'article' ? (
                    <textarea
                      value={variables[varName] || ''}
                      onChange={(e) => handleVariableChange(varName, e.target.value)}
                      className={styles.variableTextarea}
                    />
                  ) : (
                    <input
                      type="text"
                      value={variables[varName] || ''}
                      onChange={(e) => handleVariableChange(varName, e.target.value)}
                      className={styles.variableInput}
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* 右侧：预览与执行 */}
        <div>
          {/* Prompt 预览 */}
          <div className={styles.section}>
            <h4>👁️ Prompt 预览</h4>
            <pre className={styles.previewBox}>{filledPrompt}</pre>
            <button
              onClick={handleExecute}
              disabled={isLoading}
              className={styles.executeButton}
            >
              {isLoading ? '生成中...' : '▶ 执行 Prompt'}
            </button>
          </div>

          {/* 执行结果 */}
          <div className={styles.section}>
            <h4>📤 执行结果</h4>
            <div className={styles.resultBox}>
              {result ? (
                <ReactMarkdown>{result}</ReactMarkdown>
              ) : (
                <span className={styles.resultPlaceholder}>执行后显示结果...</span>
              )}
              {isLoading && <span className="cursor" />}
            </div>
          </div>
        </div>
      </div>

      {/* 代码示例 */}
      <div className={styles.codeSection}>
        <h4>🔧 模板解析核心代码</h4>
        <pre>
          {`// 解析模板变量
function parseTemplateVariables(template: string): string[] {
  const regex = /\\{\\{(\\w+)\\}\\}/g;
  const variables: string[] = [];
  let match;
  while ((match = regex.exec(template)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }
  return variables;
}

// 填充模板
function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\\{\\{(\\w+)\\}\\}/g, (_, key) => vars[key] || '');
}`}
        </pre>
      </div>
    </div>
  )
}
