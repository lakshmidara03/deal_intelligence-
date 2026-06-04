'use client'
import { useState } from 'react'
import type { Warning } from '../../../services/dealBoardsService'
import { AlertTriangle, CheckCircle, Zap, Check, Plus, X } from 'lucide-react'

interface Props {
  warnings: Warning[]
  loading: boolean
  onResolve: (warningId: string) => void
  onAction: (warningId: string) => void
  aiEvaluation?: any // DealEvaluationResult from AI evaluation engine
  isManager?: boolean // Flag to show manager-specific features
  onAddTask?: (task: { name: string; description: string }) => void
}

const severityConfig = {
  HIGH: { color: '#ef4444', bg: '#fee2e2', label: 'HIGH' },
  MEDIUM: { color: '#f59e0b', bg: '#fef3c7', label: 'MED' },
  LOW: { color: '#3b82f6', bg: '#dbeafe', label: 'LOW' },
}

export default function WarningsTab({ warnings, loading, onResolve, onAction, aiEvaluation, isManager, onAddTask }: Props) {
  const [localResolved, setLocalResolved] = useState<Set<string>>(new Set())
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [taskName, setTaskName] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [managerTasks, setManagerTasks] = useState<Array<{ id: string; name: string; description: string; createdAt: Date }>>([])

  const handleAddTask = () => {
    if (taskName.trim() && onAddTask) {
      const newTask = {
        id: Date.now().toString(),
        name: taskName,
        description: taskDescription,
        createdAt: new Date()
      }
      setManagerTasks(prev => [...prev, newTask])
      onAddTask({ name: taskName, description: taskDescription })
      setTaskName('')
      setTaskDescription('')
      setShowTaskModal(false)
    }
  }

  if (loading) return <div style={{ padding: 24, color: '#9ca3af', fontSize: 13 }}>Loading warnings...</div>

  const active = warnings.filter(w => w.status === 'active' && !localResolved.has(w.warningId))
  const resolved = warnings.filter(w => w.status === 'resolved' || localResolved.has(w.warningId))

  const handleResolve = (wid: string) => {
    setLocalResolved(prev => {
      const next = new Set(prev)
      next.add(wid)
      return next
    })
    onResolve(wid)
  }

  return (
    <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Manager Add Task Button */}
      {isManager && (
        <button
          onClick={() => setShowTaskModal(true)}
          style={{
            padding: '10px 16px',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            background: '#1d4ed8',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            alignSelf: 'flex-start',
            transition: 'background 0.2s'
          }}
        >
          <Plus size={16} />
          Add Task
        </button>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 8,
            padding: 24,
            width: '100%',
            maxWidth: 500,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
                Add Manager Task
              </h3>
              <button
                onClick={() => setShowTaskModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
              >
                <X size={20} color="#64748b" />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  Task Name *
                </label>
                <input
                  type="text"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  placeholder="Enter task name"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    fontSize: 13,
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  Description
                </label>
                <textarea
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Enter task description"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    fontSize: 13,
                    outline: 'none',
                    resize: 'vertical',
                    transition: 'border-color 0.2s'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                <button
                  onClick={() => setShowTaskModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 500,
                    background: '#fff',
                    color: '#64748b',
                    border: '1px solid #cbd5e1',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTask}
                  disabled={!taskName.trim()}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    background: taskName.trim() ? '#1d4ed8' : '#94a3b8',
                    color: '#fff',
                    border: 'none',
                    cursor: taskName.trim() ? 'pointer' : 'not-allowed'
                  }}
                >
                  Add Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manager Tasks Section */}
      {isManager && managerTasks.length > 0 && (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Check size={20} color="#10b981" />
            <span style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>Manager Tasks</span>
          </div>
          {managerTasks.map(task => (
            <div key={task.id} style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 6,
              padding: '12px',
              marginBottom: 8
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <CheckCircle size={16} color="#10b981" style={{ marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 13, color: '#334155', fontWeight: 500, display: 'block' }}>
                    {task.name}
                  </span>
                  {task.description && (
                    <span style={{ fontSize: 12, color: '#64748b', display: 'block', marginTop: 4 }}>
                      {task.description}
                    </span>
                  )}
                  <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginTop: 6 }}>
                    Added: {task.createdAt.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Evaluation Section */}
      {aiEvaluation && (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={20} color="#3b82f6" />
              <span style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>AI Evaluation</span>
            </div>
            <div style={{ 
              padding: '6px 12px', borderRadius: 6, fontSize: 14, fontWeight: 700,
              background: aiEvaluation.ai_score >= 80 ? '#dcfce7' : aiEvaluation.ai_score >= 60 ? '#fef3c7' : '#fee2e2',
              color: aiEvaluation.ai_score >= 80 ? '#166534' : aiEvaluation.ai_score >= 60 ? '#92400e' : '#991b1b',
            }}>
              {aiEvaluation.ai_score}/100
            </div>
          </div>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16, lineHeight: 1.5, marginTop: 0 }}>
            {aiEvaluation.ai_score_rationale}
          </p>

          {/* AI Warnings for Rep */}
          {aiEvaluation.ai_warnings_rep.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                AI Warnings for Rep
              </p>
              {aiEvaluation.ai_warnings_rep.map((warning: any, idx: number) => (
                <div key={idx} style={{
                  background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6,
                  padding: '12px', marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 8,
                }}>
                  <span style={{
                    padding: '2px 6px', borderRadius: 3, fontSize: 10, fontWeight: 700,
                    background: warning.severity === 'high' ? '#fee2e2' : warning.severity === 'medium' ? '#fef3c7' : '#dbeafe',
                    color: warning.severity === 'high' ? '#ef4444' : warning.severity === 'medium' ? '#f59e0b' : '#3b82f6',
                    textTransform: 'uppercase',
                  }}>
                    {warning.severity}
                  </span>
                  <span style={{ fontSize: 13, color: '#334155', lineHeight: 1.4 }}>
                    {warning.warning}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* AI Warnings for Manager — Only shown in manager view */}
          {isManager && aiEvaluation.ai_warnings_manager.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                AI Warnings for Manager
              </p>
              {aiEvaluation.ai_warnings_manager.map((warning: any, idx: number) => (
                <div key={idx} style={{
                  background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6,
                  padding: '12px', marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 8,
                }}>
                  <span style={{
                    padding: '2px 6px', borderRadius: 3, fontSize: 10, fontWeight: 700,
                    background: warning.severity === 'high' ? '#fee2e2' : warning.severity === 'medium' ? '#fef3c7' : '#dbeafe',
                    color: warning.severity === 'high' ? '#ef4444' : warning.severity === 'medium' ? '#f59e0b' : '#3b82f6',
                    textTransform: 'uppercase',
                  }}>
                    {warning.severity}
                  </span>
                  <span style={{ fontSize: 13, color: '#334155', lineHeight: 1.4 }}>
                    {warning.warning}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Rule-based Warnings — Only shown in manager view */}
          {isManager && aiEvaluation.rule_based_warnings.length > 0 && (
            <div>
              <p style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                Rule-based Warnings
              </p>
              {aiEvaluation.rule_based_warnings.map((warning: any, idx: number) => (
                <div key={idx} style={{
                  background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6,
                  padding: '12px', marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 8,
                }}>
                  <AlertTriangle size={16} color="#f59e0b" />
                  <div>
                    <span style={{ fontSize: 13, color: '#334155', fontWeight: 500, display: 'block' }}>
                      {warning.warning}
                    </span>
                    <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginTop: 2 }}>
                      Triggered by: {warning.triggered_by}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Divider */}
      {aiEvaluation && active.length > 0 && (
        <div style={{ height: 1, background: '#e2e8f0', margin: '8px 0' }} />
      )}

      {active.length === 0 && !aiEvaluation && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: 32, color: '#10b981',
        }}>
          <CheckCircle size={36} />
          <p style={{ marginTop: 8, fontWeight: 600, fontSize: 14 }}>No active warnings</p>
          <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>This deal looks healthy</p>
        </div>
      )}

      {active.map(w => {
        const cfg = severityConfig[w.severity]
        return (
          <div key={w.warningId} style={{
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8,
            padding: '20px', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: '#1e293b' }}>
                {w.title}
              </span>
              <span style={{
                padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                background: cfg.bg, color: cfg.color,
              }}>
                {cfg.label}
              </span>
            </div>
            
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20, lineHeight: 1.5, marginTop: 0 }}>
              {w.description}
            </p>
            
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => onAction(w.warningId)}
                style={{
                  padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600,
                  background: '#1d4ed8', color: '#fff', border: 'none', cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                Take action
              </button>
              <button
                onClick={() => handleResolve(w.warningId)}
                style={{
                  padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 500,
                  background: '#fff', color: '#64748b', border: '1px solid #cbd5e1', cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                Mark as resolved
              </button>
            </div>
          </div>
        )
      })}

      {/* Persistent Note Banner */}
      {active.length > 0 && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde047', borderRadius: 8, padding: '16px', marginTop: 8 }}>
          <p style={{ fontSize: 13, color: '#92400e', lineHeight: 1.5, margin: 0 }}>
            <span style={{ fontWeight: 700 }}>💡 For Sales Rep:</span> It should only display the next steps (read only) and actionable — he shouldn't be able to add any steps.
          </p>
        </div>
      )}

      {resolved.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <p style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
            Resolved ({resolved.length})
          </p>
          {resolved.map(w => (
            <div key={w.warningId} style={{
              padding: '12px 16px', borderRadius: 8,
              border: '1px solid #f1f5f9', marginBottom: 8, background: '#fafbfc',
              display: 'flex', alignItems: 'center', gap: 8, opacity: 0.6,
            }}>
              <CheckCircle size={14} color="#10b981" />
              <span style={{ fontSize: 13, color: '#64748b', textDecoration: 'line-through' }}>{w.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}




