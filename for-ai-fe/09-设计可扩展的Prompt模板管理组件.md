## 问题

如何设计一个可扩展的 Prompt 模板管理组件？

## 回答

### 一、需求分析

Prompt 模板管理组件需要解决以下问题：

1. **模板定义**：支持变量插槽、条件逻辑
2. **表单生成**：根据变量自动生成输入表单
3. **实时预览**：填充变量后预览最终 Prompt
4. **版本管理**：模板的版本控制与回溯
5. **安全防护**：防止 Prompt 注入攻击

### 二、核心类型定义

```typescript
// types/prompt-template.ts

/** 变量类型 */
type VariableType =
  | 'text' // 单行文本
  | 'textarea' // 多行文本
  | 'select' // 下拉选择
  | 'multiselect' // 多选
  | 'number' // 数字
  | 'boolean' // 开关
  | 'date' // 日期
  | 'file' // 文件（用于 RAG）

/** 变量定义 */
interface VariableDefinition {
  /** 变量名，如 "userName" */
  name: string
  /** 显示标签 */
  label: string
  /** 变量类型 */
  type: VariableType
  /** 默认值 */
  defaultValue?: any
  /** 是否必填 */
  required?: boolean
  /** 占位符文本 */
  placeholder?: string
  /** 描述信息 */
  description?: string
  /** 验证规则 */
  validation?: {
    minLength?: number
    maxLength?: number
    pattern?: string
    min?: number
    max?: number
  }
  /** 下拉选项（type 为 select/multiselect 时） */
  options?: Array<{
    label: string
    value: string
  }>
}

/** Prompt 模板 */
interface PromptTemplate {
  id: string
  name: string
  description?: string
  /** 模板内容，使用 {{variable}} 语法 */
  content: string
  /** 变量定义（可自动提取或手动定义） */
  variables: VariableDefinition[]
  /** 模板类型 */
  type: 'system' | 'user' | 'assistant'
  /** 版本号 */
  version: string
  /** 标签 */
  tags?: string[]
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
}

/** 填充后的 Prompt */
interface FilledPrompt {
  templateId: string
  content: string
  variables: Record<string, any>
  filledAt: string
}
```

### 三、模板解析器

```typescript
// utils/template-parser.ts

/**
 * Prompt 模板解析器
 */
export class PromptTemplateParser {
  // 变量匹配正则：{{variableName}} 或 {{variableName:type}}
  private static VARIABLE_REGEX = /\{\{(\w+)(?::(\w+))?\}\}/g

  // 条件块正则：{{#if condition}}...{{/if}}
  private static CONDITION_REGEX = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g

  // 循环块正则：{{#each items}}...{{/each}}
  private static LOOP_REGEX = /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g

  /**
   * 从模板内容中提取变量
   */
  static extractVariables(template: string): VariableDefinition[] {
    const variables: Map<string, VariableDefinition> = new Map()

    let match
    while ((match = this.VARIABLE_REGEX.exec(template)) !== null) {
      const [, name, type = 'text'] = match

      if (!variables.has(name)) {
        variables.set(name, {
          name,
          label: this.formatLabel(name),
          type: this.parseType(type),
          required: true,
        })
      }
    }

    // 提取条件变量
    while ((match = this.CONDITION_REGEX.exec(template)) !== null) {
      const [, name] = match
      if (!variables.has(name)) {
        variables.set(name, {
          name,
          label: this.formatLabel(name),
          type: 'boolean',
          required: false,
          defaultValue: false,
        })
      }
    }

    return Array.from(variables.values())
  }

  /**
   * 填充模板变量
   */
  static fill(
    template: string,
    values: Record<string, any>,
    options: { sanitize?: boolean } = {},
  ): string {
    const { sanitize = true } = options

    let result = template

    // 处理条件块
    result = result.replace(this.CONDITION_REGEX, (_, condition, content) => {
      return values[condition] ? content : ''
    })

    // 处理循环块
    result = result.replace(this.LOOP_REGEX, (_, arrayName, content) => {
      const items = values[arrayName]
      if (!Array.isArray(items)) return ''

      return items
        .map((item, index) => {
          return content
            .replace(/\{\{item\}\}/g, sanitize ? this.sanitize(item) : item)
            .replace(/\{\{index\}\}/g, String(index))
        })
        .join('\n')
    })

    // 替换普通变量
    result = result.replace(this.VARIABLE_REGEX, (_, name) => {
      const value = values[name]
      if (value === undefined || value === null) return ''

      const stringValue = String(value)
      return sanitize ? this.sanitize(stringValue) : stringValue
    })

    return result.trim()
  }

  /**
   * 转义特殊字符，防止 Prompt 注入
   */
  static sanitize(value: string): string {
    // 移除可能的系统指令注入
    let sanitized = value
      // 移除潜在的角色切换指令
      .replace(/^(system|user|assistant):/gim, '')
      // 移除常见的注入模式
      .replace(/ignore\s+(previous|above)\s+instructions?/gi, '')
      .replace(/disregard\s+(previous|above)\s+instructions?/gi, '')
      // 转义花括号，防止嵌套注入
      .replace(/\{\{/g, '{ {')
      .replace(/\}\}/g, '} }')

    return sanitized
  }

  /**
   * 验证模板语法
   */
  static validate(template: string): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // 检查未闭合的条件块
    const ifCount = (template.match(/\{\{#if/g) || []).length
    const endIfCount = (template.match(/\{\{\/if\}\}/g) || []).length
    if (ifCount !== endIfCount) {
      errors.push(`条件块未正确闭合：${ifCount} 个开始标签，${endIfCount} 个结束标签`)
    }

    // 检查未闭合的循环块
    const eachCount = (template.match(/\{\{#each/g) || []).length
    const endEachCount = (template.match(/\{\{\/each\}\}/g) || []).length
    if (eachCount !== endEachCount) {
      errors.push(
        `循环块未正确闭合：${eachCount} 个开始标签，${endEachCount} 个结束标签`,
      )
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  private static formatLabel(name: string): string {
    // camelCase -> 空格分隔的标题
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim()
  }

  private static parseType(type: string): VariableType {
    const typeMap: Record<string, VariableType> = {
      text: 'text',
      textarea: 'textarea',
      select: 'select',
      number: 'number',
      bool: 'boolean',
      boolean: 'boolean',
      date: 'date',
      file: 'file',
    }
    return typeMap[type.toLowerCase()] || 'text'
  }
}
```

### 四、React 组件实现

#### 1. 模板编辑器组件

```tsx
// components/PromptTemplateEditor/index.tsx
import React, { useState, useMemo, useCallback } from 'react'
import { PromptTemplateParser } from '../../utils/template-parser'
import { VariableForm } from './VariableForm'
import { TemplatePreview } from './TemplatePreview'
import styles from './PromptTemplateEditor.module.css'

interface PromptTemplateEditorProps {
  initialTemplate?: PromptTemplate
  onSave?: (template: PromptTemplate) => void
  mode?: 'edit' | 'use' // 编辑模式 vs 使用模式
}

export function PromptTemplateEditor({
  initialTemplate,
  onSave,
  mode = 'edit',
}: PromptTemplateEditorProps) {
  // 模板内容
  const [content, setContent] = useState(initialTemplate?.content || '')

  // 变量值（使用模式）
  const [variableValues, setVariableValues] = useState<Record<string, any>>({})

  // 自定义变量定义
  const [customVariables, setCustomVariables] = useState<VariableDefinition[]>(
    initialTemplate?.variables || [],
  )

  // 从模板中提取变量
  const extractedVariables = useMemo(() => {
    return PromptTemplateParser.extractVariables(content)
  }, [content])

  // 合并提取的和自定义的变量定义
  const mergedVariables = useMemo(() => {
    const variableMap = new Map<string, VariableDefinition>()

    // 先添加提取的
    extractedVariables.forEach((v) => variableMap.set(v.name, v))

    // 用自定义的覆盖（保留额外配置）
    customVariables.forEach((v) => {
      if (variableMap.has(v.name)) {
        variableMap.set(v.name, { ...variableMap.get(v.name), ...v })
      }
    })

    return Array.from(variableMap.values())
  }, [extractedVariables, customVariables])

  // 模板语法验证
  const validation = useMemo(() => {
    return PromptTemplateParser.validate(content)
  }, [content])

  // 预览填充后的内容
  const previewContent = useMemo(() => {
    if (!validation.valid) return ''
    return PromptTemplateParser.fill(content, variableValues)
  }, [content, variableValues, validation.valid])

  // 更新变量值
  const handleVariableChange = useCallback((name: string, value: any) => {
    setVariableValues((prev) => ({ ...prev, [name]: value }))
  }, [])

  // 更新变量定义
  const handleVariableDefChange = useCallback(
    (name: string, updates: Partial<VariableDefinition>) => {
      setCustomVariables((prev) => {
        const existing = prev.find((v) => v.name === name)
        if (existing) {
          return prev.map((v) => (v.name === name ? { ...v, ...updates } : v))
        }
        return [...prev, { name, ...updates } as VariableDefinition]
      })
    },
    [],
  )

  return (
    <div className={styles.container}>
      {/* 模板编辑区 */}
      {mode === 'edit' && (
        <div className={styles.editorSection}>
          <h3>模板内容</h3>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={styles.templateInput}
            placeholder="输入 Prompt 模板，使用 {{variableName}} 定义变量..."
          />

          {/* 语法错误提示 */}
          {!validation.valid && (
            <div className={styles.errors}>
              {validation.errors.map((error, idx) => (
                <div key={idx} className={styles.errorItem}>
                  ⚠️ {error}
                </div>
              ))}
            </div>
          )}

          {/* 变量配置 */}
          <div className={styles.variableConfig}>
            <h4>变量配置</h4>
            {mergedVariables.map((variable) => (
              <VariableConfigItem
                key={variable.name}
                variable={variable}
                onChange={(updates) => handleVariableDefChange(variable.name, updates)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 变量输入表单 */}
      <div className={styles.formSection}>
        <h3>填写变量</h3>
        <VariableForm
          variables={mergedVariables}
          values={variableValues}
          onChange={handleVariableChange}
        />
      </div>

      {/* 预览区 */}
      <div className={styles.previewSection}>
        <h3>预览</h3>
        <TemplatePreview
          content={previewContent}
          tokenCount={previewContent.length / 4} // 粗略估算
        />
      </div>
    </div>
  )
}
```

#### 2. 变量表单组件

```tsx
// components/PromptTemplateEditor/VariableForm.tsx
import React from 'react'

interface VariableFormProps {
  variables: VariableDefinition[]
  values: Record<string, any>
  onChange: (name: string, value: any) => void
}

export function VariableForm({ variables, values, onChange }: VariableFormProps) {
  return (
    <div className="variable-form">
      {variables.map((variable) => (
        <VariableInput
          key={variable.name}
          variable={variable}
          value={values[variable.name] ?? variable.defaultValue ?? ''}
          onChange={(value) => onChange(variable.name, value)}
        />
      ))}
    </div>
  )
}

interface VariableInputProps {
  variable: VariableDefinition
  value: any
  onChange: (value: any) => void
}

function VariableInput({ variable, value, onChange }: VariableInputProps) {
  const { type, label, placeholder, description, options, validation } = variable

  // 根据类型渲染不同的输入控件
  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            maxLength={validation?.maxLength}
            rows={4}
          />
        )

      case 'select':
        return (
          <select value={value} onChange={(e) => onChange(e.target.value)}>
            <option value="">请选择...</option>
            {options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )

      case 'multiselect':
        return (
          <div className="multiselect">
            {options?.map((opt) => (
              <label key={opt.value}>
                <input
                  type="checkbox"
                  checked={((value as string[]) || []).includes(opt.value)}
                  onChange={(e) => {
                    const current = (value as string[]) || []
                    const newValue = e.target.checked
                      ? [...current, opt.value]
                      : current.filter((v) => v !== opt.value)
                    onChange(newValue)
                  }}
                />
                {opt.label}
              </label>
            ))}
          </div>
        )

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            min={validation?.min}
            max={validation?.max}
            placeholder={placeholder}
          />
        )

      case 'boolean':
        return (
          <label className="switch">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => onChange(e.target.checked)}
            />
            <span className="slider"></span>
          </label>
        )

      case 'date':
        return (
          <input type="date" value={value} onChange={(e) => onChange(e.target.value)} />
        )

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            maxLength={validation?.maxLength}
          />
        )
    }
  }

  return (
    <div className="variable-input">
      <label>
        {label}
        {variable.required && <span className="required">*</span>}
      </label>
      {renderInput()}
      {description && <p className="description">{description}</p>}
    </div>
  )
}
```

#### 3. 预览组件

```tsx
// components/PromptTemplateEditor/TemplatePreview.tsx
import React, { useState } from 'react'

interface TemplatePreviewProps {
  content: string
  tokenCount?: number
}

export function TemplatePreview({ content, tokenCount }: TemplatePreviewProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="template-preview">
      <div className="preview-header">
        <span className="token-count">约 {tokenCount?.toFixed(0)} tokens</span>
        <button onClick={handleCopy} className="copy-btn">
          {copied ? '✓ 已复制' : '复制'}
        </button>
      </div>

      <pre className="preview-content">
        <code>{content || '请填写变量以预览...'}</code>
      </pre>
    </div>
  )
}
```

### 五、模板组合系统

支持 System Prompt 和 User Prompt 的组合：

```typescript
// utils/prompt-composer.ts

interface PromptComposition {
  systemPrompt?: PromptTemplate
  userPrompt: PromptTemplate
  systemVariables?: Record<string, any>
  userVariables: Record<string, any>
}

export class PromptComposer {
  /**
   * 组合多个模板生成最终的消息数组
   */
  static compose(composition: PromptComposition): ChatMessage[] {
    const messages: ChatMessage[] = []

    // System Prompt
    if (composition.systemPrompt) {
      const systemContent = PromptTemplateParser.fill(
        composition.systemPrompt.content,
        composition.systemVariables || {},
      )

      if (systemContent) {
        messages.push({
          role: 'system',
          content: systemContent,
        })
      }
    }

    // User Prompt
    const userContent = PromptTemplateParser.fill(
      composition.userPrompt.content,
      composition.userVariables,
    )

    messages.push({
      role: 'user',
      content: userContent,
    })

    return messages
  }

  /**
   * 创建模板链（用于复杂工作流）
   */
  static chain(
    templates: Array<{
      template: PromptTemplate
      variables: Record<string, any>
      role: 'system' | 'user' | 'assistant'
    }>,
  ): ChatMessage[] {
    return templates.map(({ template, variables, role }) => ({
      role,
      content: PromptTemplateParser.fill(template.content, variables),
    }))
  }
}
```

### 六、版本管理

```typescript
// utils/template-version.ts

interface TemplateVersion {
  id: string
  templateId: string
  version: string
  content: string
  variables: VariableDefinition[]
  changelog?: string
  createdAt: string
  createdBy?: string
}

export class TemplateVersionManager {
  private versions: Map<string, TemplateVersion[]> = new Map()

  /**
   * 保存新版本
   */
  saveVersion(template: PromptTemplate, changelog?: string): TemplateVersion {
    const version: TemplateVersion = {
      id: crypto.randomUUID(),
      templateId: template.id,
      version: this.incrementVersion(template.version),
      content: template.content,
      variables: template.variables,
      changelog,
      createdAt: new Date().toISOString(),
    }

    const existing = this.versions.get(template.id) || []
    this.versions.set(template.id, [...existing, version])

    return version
  }

  /**
   * 获取版本历史
   */
  getHistory(templateId: string): TemplateVersion[] {
    return this.versions.get(templateId) || []
  }

  /**
   * 回滚到指定版本
   */
  rollback(templateId: string, versionId: string): PromptTemplate | null {
    const versions = this.versions.get(templateId)
    const target = versions?.find((v) => v.id === versionId)

    if (!target) return null

    return {
      id: templateId,
      name: '', // 需要从主记录获取
      content: target.content,
      variables: target.variables,
      version: target.version,
      type: 'user',
      createdAt: target.createdAt,
      updatedAt: new Date().toISOString(),
    }
  }

  /**
   * 对比两个版本
   */
  diff(
    versionA: TemplateVersion,
    versionB: TemplateVersion,
  ): {
    contentDiff: string
    variablesDiff: string
  } {
    // 使用 diff 库比较内容
    // 这里简化处理
    return {
      contentDiff: `版本 ${versionA.version} -> ${versionB.version}`,
      variablesDiff: JSON.stringify({
        added: versionB.variables.filter(
          (v) => !versionA.variables.find((av) => av.name === v.name),
        ),
        removed: versionA.variables.filter(
          (v) => !versionB.variables.find((bv) => bv.name === v.name),
        ),
      }),
    }
  }

  private incrementVersion(current: string): string {
    const parts = current.split('.').map(Number)
    parts[parts.length - 1]++
    return parts.join('.')
  }
}
```

### 七、模板库组件

```tsx
// components/TemplateLibrary/index.tsx
import React, { useState, useMemo } from 'react'

interface TemplateLibraryProps {
  templates: PromptTemplate[]
  onSelect: (template: PromptTemplate) => void
  onEdit?: (template: PromptTemplate) => void
  onDelete?: (templateId: string) => void
}

export function TemplateLibrary({
  templates,
  onSelect,
  onEdit,
  onDelete,
}: TemplateLibraryProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterTags, setFilterTags] = useState<string[]>([])

  // 提取所有标签
  const allTags = useMemo(() => {
    const tags = new Set<string>()
    templates.forEach((t) => t.tags?.forEach((tag) => tags.add(tag)))
    return Array.from(tags)
  }, [templates])

  // 过滤模板
  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      // 搜索匹配
      const matchesSearch =
        !searchTerm ||
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchTerm.toLowerCase())

      // 类型匹配
      const matchesType = filterType === 'all' || template.type === filterType

      // 标签匹配
      const matchesTags =
        filterTags.length === 0 ||
        filterTags.some((tag) => template.tags?.includes(tag))

      return matchesSearch && matchesType && matchesTags
    })
  }, [templates, searchTerm, filterType, filterTags])

  return (
    <div className="template-library">
      {/* 搜索和过滤 */}
      <div className="filters">
        <input
          type="search"
          placeholder="搜索模板..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="all">全部类型</option>
          <option value="system">System</option>
          <option value="user">User</option>
          <option value="assistant">Assistant</option>
        </select>

        <div className="tag-filter">
          {allTags.map((tag) => (
            <label key={tag}>
              <input
                type="checkbox"
                checked={filterTags.includes(tag)}
                onChange={(e) => {
                  setFilterTags((prev) =>
                    e.target.checked ? [...prev, tag] : prev.filter((t) => t !== tag),
                  )
                }}
              />
              {tag}
            </label>
          ))}
        </div>
      </div>

      {/* 模板列表 */}
      <div className="template-grid">
        {filteredTemplates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onSelect={() => onSelect(template)}
            onEdit={onEdit ? () => onEdit(template) : undefined}
            onDelete={onDelete ? () => onDelete(template.id) : undefined}
          />
        ))}
      </div>
    </div>
  )
}

function TemplateCard({
  template,
  onSelect,
  onEdit,
  onDelete,
}: {
  template: PromptTemplate
  onSelect: () => void
  onEdit?: () => void
  onDelete?: () => void
}) {
  const variableCount = template.variables.length

  return (
    <div className="template-card">
      <div className="card-header">
        <h4>{template.name}</h4>
        <span className={`type-badge ${template.type}`}>{template.type}</span>
      </div>

      <p className="description">{template.description || '暂无描述'}</p>

      <div className="meta">
        <span>{variableCount} 个变量</span>
        <span>v{template.version}</span>
      </div>

      <div className="tags">
        {template.tags?.map((tag) => (
          <span key={tag} className="tag">
            {tag}
          </span>
        ))}
      </div>

      <div className="actions">
        <button onClick={onSelect} className="primary">
          使用
        </button>
        {onEdit && <button onClick={onEdit}>编辑</button>}
        {onDelete && (
          <button onClick={onDelete} className="danger">
            删除
          </button>
        )}
      </div>
    </div>
  )
}
```

### 八、安全防护

```typescript
// utils/prompt-security.ts

export class PromptSecurity {
  // 危险模式列表
  private static DANGEROUS_PATTERNS = [
    /ignore\s+(all\s+)?(previous|prior|above)\s+instructions?/gi,
    /disregard\s+(all\s+)?(previous|prior|above)\s+instructions?/gi,
    /forget\s+(all\s+)?(previous|prior|above)\s+instructions?/gi,
    /you\s+are\s+now\s+/gi,
    /pretend\s+(you\s+are|to\s+be)\s+/gi,
    /act\s+as\s+(if\s+you\s+are|a)\s+/gi,
    /\[system\]/gi,
    /\[INST\]/gi,
    /<\|im_start\|>/gi,
  ]

  /**
   * 检测潜在的注入攻击
   */
  static detectInjection(input: string): {
    safe: boolean
    warnings: string[]
  } {
    const warnings: string[] = []

    for (const pattern of this.DANGEROUS_PATTERNS) {
      if (pattern.test(input)) {
        warnings.push(`检测到可疑模式: ${pattern.source}`)
      }
    }

    return {
      safe: warnings.length === 0,
      warnings,
    }
  }

  /**
   * 清理用户输入
   */
  static sanitizeInput(input: string): string {
    let cleaned = input

    // 移除危险模式
    for (const pattern of this.DANGEROUS_PATTERNS) {
      cleaned = cleaned.replace(pattern, '[已过滤]')
    }

    // 移除特殊控制字符
    cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

    return cleaned
  }

  /**
   * 验证模板内容
   */
  static validateTemplate(template: string): {
    valid: boolean
    issues: string[]
  } {
    const issues: string[] = []

    // 检查是否有未封闭的变量
    const openBraces = (template.match(/\{\{/g) || []).length
    const closeBraces = (template.match(/\}\}/g) || []).length
    if (openBraces !== closeBraces) {
      issues.push('变量标记未正确闭合')
    }

    // 检查危险模式
    const injection = this.detectInjection(template)
    if (!injection.safe) {
      issues.push(...injection.warnings)
    }

    return {
      valid: issues.length === 0,
      issues,
    }
  }
}
```

### 九、总结

| 功能模块     | 关键实现                         |
| ------------ | -------------------------------- |
| **模板解析** | 正则提取变量、条件块、循环块支持 |
| **表单生成** | 根据变量类型动态渲染输入控件     |
| **实时预览** | useMemo 缓存填充结果             |
| **版本管理** | 版本历史、回滚、对比             |
| **模板组合** | System + User Prompt 组合        |
| **安全防护** | 注入检测、输入清理               |

设计原则：

1. **配置化**：模板和变量通过 JSON 配置描述
2. **可扩展**：支持自定义变量类型和验证规则
3. **安全优先**：防止 Prompt 注入攻击
4. **良好体验**：实时预览、语法提示、错误反馈
