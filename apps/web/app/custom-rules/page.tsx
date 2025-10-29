'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { customRulesApi } from '@/lib/api'
import toast from 'react-hot-toast'
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Shield, 
  AlertTriangle, 
  Info, 
  XCircle,
  ChevronLeft,
  Save,
  X,
  TestTube
} from 'lucide-react'

export default function CustomRulesPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingRule, setEditingRule] = useState<any>(null)

  const { data: rules, isLoading } = useQuery({
    queryKey: ['custom-rules'],
    queryFn: async () => {
      const response = await customRulesApi.getAll()
      return response.data
    },
  })

  const deleteRuleMutation = useMutation({
    mutationFn: async (id: string) => {
      await customRulesApi.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-rules'] })
      toast.success('Rule deleted successfully')
    },
    onError: () => {
      toast.error('Failed to delete rule')
    },
  })

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this rule?')) {
      deleteRuleMutation.mutate(id)
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <XCircle className="w-4 h-4 text-danger" />
      case 'ERROR':
        return <AlertTriangle className="w-4 h-4 text-warning" />
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-accent" />
      case 'INFO':
        return <Info className="w-4 h-4 text-primary" />
      default:
        return null
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-danger/10 text-danger border-danger/30'
      case 'ERROR':
        return 'bg-warning/10 text-warning border-warning/30'
      case 'WARNING':
        return 'bg-accent/10 text-accent border-accent/30'
      case 'INFO':
        return 'bg-primary/10 text-primary border-primary/30'
      default:
        return 'bg-background-secondary'
    }
  }

  return (
    <div className="min-h-screen bg-background-page">
      {/* Header */}
      <header className="border-b border-border-light bg-background-card sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 hover:bg-background-hover rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Custom Audit Rules</h1>
                <p className="text-sm text-text-secondary">Create and manage custom SEO rules</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Rule
          </button>
        </div>
      </header>

      <div className="p-6">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-text-secondary">Loading rules...</p>
          </div>
        ) : rules?.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="w-16 h-16 text-text-muted mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Custom Rules Yet</h3>
            <p className="text-text-secondary mb-6">
              Create custom rules to enforce specific SEO standards across your audits
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              Create Your First Rule
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {rules?.map((rule: any) => (
              <div
                key={rule.id}
                className="card hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getSeverityIcon(rule.severity)}
                      <h3 className="text-lg font-semibold">{rule.name}</h3>
                      {rule.global && (
                        <span className="px-2 py-1 bg-primary/20 text-primary text-xs font-medium rounded border border-primary/30">
                          Global
                        </span>
                      )}
                      {!rule.enabled && (
                        <span className="px-2 py-1 bg-background-secondary text-text-muted text-xs font-medium rounded">
                          Disabled
                        </span>
                      )}
                    </div>
                    {rule.description && (
                      <p className="text-text-secondary text-sm mb-3">{rule.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm">
                      <span className={`px-2 py-1 rounded border text-xs font-medium ${getSeverityColor(rule.severity)}`}>
                        {rule.severity}
                      </span>
                      <span className="px-2 py-1 bg-background-secondary text-text-secondary text-xs rounded">
                        {rule.category.replace('_', ' ')}
                      </span>
                      <span className="text-text-muted text-xs">
                        {rule._count.violations} violations • {rule._count.projectRules} projects
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingRule(rule)}
                      className="p-2 hover:bg-background-hover rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(rule.id)}
                      className="p-2 hover:bg-danger/20 rounded-lg transition-colors text-danger"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-background-secondary rounded-lg">
                  <p className="text-sm text-text-primary">
                    <span className="font-medium">Message:</span> {rule.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingRule) && (
        <RuleFormModal
          rule={editingRule}
          onClose={() => {
            setShowCreateModal(false)
            setEditingRule(null)
          }}
        />
      )}
    </div>
  )
}

function RuleFormModal({ rule, onClose }: { rule?: any; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    name: rule?.name || '',
    description: rule?.description || '',
    category: rule?.category || 'TECHNICAL',
    severity: rule?.severity || 'WARNING',
    message: rule?.message || '',
    enabled: rule?.enabled ?? true,
    global: rule?.global ?? false,
    condition: rule?.condition || {
      logic: 'AND',
      conditions: [
        {
          field: 'meta.title.length',
          operator: 'less_than',
          value: 60,
        },
      ],
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      if (rule) {
        await customRulesApi.update(rule.id, data)
      } else {
        await customRulesApi.create(data)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-rules'] })
      toast.success(rule ? 'Rule updated successfully' : 'Rule created successfully')
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to save rule')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(formData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background-card rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-border-light">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">{rule ? 'Edit Rule' : 'Create New Rule'}</h2>
              <button
                type="button"
                onClick={onClose}
                className="p-2 hover:bg-background-hover rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Rule Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input w-full"
                required
                placeholder="e.g., Title Length Must Be Optimal"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input w-full resize-none"
                rows={2}
                placeholder="Optional description of what this rule checks"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input w-full"
                  required
                >
                  <option value="TECHNICAL">Technical</option>
                  <option value="ONPAGE">On-Page</option>
                  <option value="STRUCTURED_DATA">Structured Data</option>
                  <option value="PERFORMANCE">Performance</option>
                  <option value="LOCAL_SEO">Local SEO</option>
                  <option value="CONTENT">Content</option>
                  <option value="LINKS">Links</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Severity *</label>
                <select
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                  className="input w-full"
                  required
                >
                  <option value="INFO">Info</option>
                  <option value="WARNING">Warning</option>
                  <option value="ERROR">Error</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Failure Message *</label>
              <input
                type="text"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="input w-full"
                required
                placeholder="Message to show when rule fails"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  className="checkbox"
                />
                <span className="text-sm">Enabled</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.global}
                  onChange={(e) => setFormData({ ...formData, global: e.target.checked })}
                  className="checkbox"
                />
                <span className="text-sm">Global (applies to all projects)</span>
              </label>
            </div>

            <div className="p-4 bg-accent/10 border border-accent/30 rounded-lg">
              <p className="text-sm text-text-secondary">
                <strong>Note:</strong> Custom rule conditions are defined in JSON format. 
                Advanced users can edit the condition logic directly in the database or via API.
              </p>
            </div>
          </div>

          <div className="p-6 border-t border-border-light flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="btn-primary flex items-center gap-2"
            >
              {createMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {rule ? 'Update Rule' : 'Create Rule'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

