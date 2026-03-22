/**
 * Demo 09: AI 反馈设计
 *
 * 演示 AI 幻觉的反馈收集机制：
 * - 点赞/点踩
 * - 详细反馈表单
 * - 重新生成
 * - 置信度显示
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { streamChat } from '../../client'
import styles from './index.module.css'

interface Feedback {
  type: 'positive' | 'negative'
  reason?: string
  comment?: string
  timestamp: number
}

const NEGATIVE_REASONS = [
  { id: 'incorrect', label: '❌ 事实错误' },
  { id: 'outdated', label: '📅 信息过时' },
  { id: 'irrelevant', label: '🎯 答非所问' },
  { id: 'incomplete', label: '📝 不够完整' },
  { id: 'unclear', label: '😕 表述不清' },
]

export function FeedbackDesignDemo() {
  const [question, setQuestion] = useState('Node.js 的最新 LTS 版本是多少？')
  const [answer, setAnswer] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [selectedReason, setSelectedReason] = useState<string>('')
  const [comment, setComment] = useState('')
  const [feedbackHistory, setFeedbackHistory] = useState<Feedback[]>([])

  // 获取回答
  const handleAsk = async () => {
    setAnswer('')
    setFeedback(null)
    setShowFeedbackForm(false)
    setIsStreaming(true)

    await streamChat(
      {
        messages: [
          {
            role: 'system',
            content:
              '你是一个技术助手。回答时在末尾添加【置信度: X%】标注你对答案的确定程度。',
          },
          { role: 'user', content: question },
        ],
      },
      {
        onToken: (token) => setAnswer((prev) => prev + token),
        onComplete: () => setIsStreaming(false),
        onError: (error) => {
          setAnswer(`❌ 错误: ${error.message}`)
          setIsStreaming(false)
        },
      },
    )
  }

  // 点赞
  const handlePositive = () => {
    const fb: Feedback = {
      type: 'positive',
      timestamp: Date.now(),
    }
    setFeedback(fb)
    setFeedbackHistory((prev) => [...prev, fb])
    setShowFeedbackForm(false)
  }

  // 点踩 - 显示详细表单
  const handleNegative = () => {
    setShowFeedbackForm(true)
  }

  // 提交详细反馈
  const handleSubmitFeedback = () => {
    const fb: Feedback = {
      type: 'negative',
      reason: selectedReason,
      comment: comment,
      timestamp: Date.now(),
    }
    setFeedback(fb)
    setFeedbackHistory((prev) => [...prev, fb])
    setShowFeedbackForm(false)
    setSelectedReason('')
    setComment('')
  }

  // 重新生成
  const handleRegenerate = () => {
    handleAsk()
  }

  return (
    <div className="demo-page">
      <div className="demo-header">
        <Link to="/" className="back-btn">
          ← 返回
        </Link>
        <h1>09 - AI 反馈设计</h1>
      </div>

      <div className="demo-description">
        <h3>💡 核心知识点</h3>
        <p>
          设计用户反馈机制来标注 AI
          幻觉：点赞/点踩快速反馈、详细原因收集、重新生成功能、置信度显示，用于模型改进。
        </p>
      </div>

      {/* 提问区 */}
      <div className={styles.questionSection}>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="输入可能产生幻觉的问题..."
          className={styles.questionInput}
        />
        <button
          onClick={handleAsk}
          disabled={isStreaming || !question.trim()}
          className={styles.askButton}
        >
          {isStreaming ? '生成中...' : '提问'}
        </button>
      </div>

      {/* 回答区 */}
      {(answer || isStreaming) && (
        <div className={styles.answerCard}>
          <div className={styles.answerContent}>
            <ReactMarkdown>{answer}</ReactMarkdown>
            {isStreaming && <span className="cursor" />}
          </div>

          {/* 反馈按钮 */}
          {!isStreaming && (
            <div className={styles.feedbackBar}>
              {feedback ? (
                <div className={`${styles.feedbackMessage} ${styles[feedback.type]}`}>
                  {feedback.type === 'positive' ? '👍' : '👎'}
                  <span>感谢你的反馈！</span>
                  {feedback.reason && (
                    <span className={styles.feedbackReason}>
                      ({NEGATIVE_REASONS.find((r) => r.id === feedback.reason)?.label})
                    </span>
                  )}
                </div>
              ) : (
                <>
                  <button
                    onClick={handlePositive}
                    className={`${styles.feedbackButton} ${styles.primary}`}
                  >
                    👍 有帮助
                  </button>
                  <button
                    onClick={handleNegative}
                    className={`${styles.feedbackButton} ${styles.negative} ${showFeedbackForm ? styles.active : ''}`}
                  >
                    👎 有问题
                  </button>
                  <button
                    onClick={handleRegenerate}
                    className={styles.regenerateButton}
                  >
                    🔄 重新生成
                  </button>
                </>
              )}
            </div>
          )}

          {/* 详细反馈表单 */}
          {showFeedbackForm && (
            <div className={styles.feedbackForm}>
              <h4>请选择问题类型：</h4>
              <div className={styles.reasonButtons}>
                {NEGATIVE_REASONS.map((reason) => (
                  <button
                    key={reason.id}
                    onClick={() => setSelectedReason(reason.id)}
                    className={`${styles.reasonButton} ${selectedReason === reason.id ? styles.active : ''}`}
                  >
                    {reason.label}
                  </button>
                ))}
              </div>

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="补充说明（可选）"
                className={styles.feedbackTextarea}
              />

              <div className={styles.formButtons}>
                <button
                  onClick={handleSubmitFeedback}
                  disabled={!selectedReason}
                  className={`${styles.submitButton} ${selectedReason ? styles.active : ''}`}
                >
                  提交反馈
                </button>
                <button
                  onClick={() => setShowFeedbackForm(false)}
                  className={styles.cancelButton}
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 反馈历史 */}
      {feedbackHistory.length > 0 && (
        <div className={styles.historyCard}>
          <h4>📊 反馈统计</h4>
          <div className={styles.historyStats}>
            <div>
              👍 正面：
              <span className={styles.positive}>
                {feedbackHistory.filter((f) => f.type === 'positive').length}
              </span>
            </div>
            <div>
              👎 负面：
              <span className={styles.negative}>
                {feedbackHistory.filter((f) => f.type === 'negative').length}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 代码示例 */}
      <div className={styles.codeSection}>
        <h4>🔧 反馈数据结构</h4>
        <pre>
          {`interface Feedback {
  type: 'positive' | 'negative';
  messageId: string;
  conversationId: string;
  reason?: 'incorrect' | 'outdated' | 'irrelevant' | 'incomplete';
  comment?: string;
  correctedAnswer?: string;  // 用户提供的正确答案
  timestamp: number;
  userId?: string;
}

// 收集后用于：
// 1. RLHF 训练数据
// 2. 识别高幻觉场景
// 3. 改进 Prompt 设计
// 4. 建立知识库补充`}
        </pre>
      </div>
    </div>
  )
}
