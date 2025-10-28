'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goalsApi, projectsApi } from '@/lib/api';
import { Plus, Target, TrendingUp, Calendar, CheckCircle, Circle, Edit2, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Goal {
  id: string;
  projectId: string;
  name: string;
  targetScore: number;
  category: string;
  deadline: string | null;
  achieved: boolean;
  achievedAt: string | null;
  achievedScore: number | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ProjectGoalsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const projectId = params.id as string;

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // Fetch project
  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const response = await projectsApi.getOne(projectId);
      return response.data;
    },
  });

  // Fetch goals
  const { data: goals, isLoading } = useQuery({
    queryKey: ['goals', projectId],
    queryFn: async () => {
      const response = await goalsApi.getByProject(projectId);
      return response.data;
    },
  });

  // Delete goal mutation
  const deleteMutation = useMutation({
    mutationFn: (goalId: string) => goalsApi.delete(goalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', projectId] });
      toast.success('Goal deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete goal');
    },
  });

  // Check goal achievement
  const checkMutation = useMutation({
    mutationFn: (goalId: string) => goalsApi.check(goalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', projectId] });
      toast.success('Goal status updated');
    },
  });

  const handleDelete = (goalId: string) => {
    if (confirm('Are you sure you want to delete this goal?')) {
      deleteMutation.mutate(goalId);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      OVERALL: 'text-primary',
      PERFORMANCE: 'text-blue-500',
      TECHNICAL: 'text-green-500',
      ON_PAGE: 'text-yellow-500',
      STRUCTURED_DATA: 'text-pink-500',
      LOCAL_SEO: 'text-indigo-500',
    };
    return colors[category] || 'text-text-secondary';
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      OVERALL: 'Overall Score',
      PERFORMANCE: 'Performance',
      TECHNICAL: 'Technical SEO',
      ON_PAGE: 'On-Page SEO',
      STRUCTURED_DATA: 'Structured Data',
      LOCAL_SEO: 'Local SEO',
    };
    return labels[category] || category;
  };

  const activeGoals = goals?.filter((g: Goal) => !g.achieved) || [];
  const completedGoals = goals?.filter((g: Goal) => g.achieved) || [];

  return (
    <div className="min-h-screen bg-background-primary">
      {/* Header */}
      <div className="bg-background-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-background-secondary rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-text-secondary" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">Goals & Targets</h1>
                <p className="text-sm text-text-secondary mt-1">
                  {project?.name} • Set and track your SEO improvement goals
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setEditingGoal(null);
                setShowCreateModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Goal
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Active Goals */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-text-primary">Active Goals ({activeGoals.length})</h2>
              </div>

              {activeGoals.length === 0 ? (
                <div className="bg-background-card border border-border rounded-lg p-12 text-center">
                  <Target className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-text-primary mb-2">No Active Goals</h3>
                  <p className="text-text-secondary mb-6">
                    Create your first goal to start tracking your SEO progress
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Create Your First Goal
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activeGoals.map((goal: Goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      projectId={projectId}
                      onEdit={() => {
                        setEditingGoal(goal);
                        setShowCreateModal(true);
                      }}
                      onDelete={() => handleDelete(goal.id)}
                      onCheck={() => checkMutation.mutate(goal.id)}
                      getCategoryColor={getCategoryColor}
                      getCategoryLabel={getCategoryLabel}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Completed Goals */}
            {completedGoals.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <h2 className="text-lg font-bold text-text-primary">Completed Goals ({completedGoals.length})</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {completedGoals.map((goal: Goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      projectId={projectId}
                      onEdit={() => {
                        setEditingGoal(goal);
                        setShowCreateModal(true);
                      }}
                      onDelete={() => handleDelete(goal.id)}
                      onCheck={() => checkMutation.mutate(goal.id)}
                      getCategoryColor={getCategoryColor}
                      getCategoryLabel={getCategoryLabel}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <GoalModal
          projectId={projectId}
          goal={editingGoal}
          onClose={() => {
            setShowCreateModal(false);
            setEditingGoal(null);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setEditingGoal(null);
            queryClient.invalidateQueries({ queryKey: ['goals', projectId] });
          }}
        />
      )}
    </div>
  );
}

// Goal Card Component
function GoalCard({
  goal,
  projectId,
  onEdit,
  onDelete,
  onCheck,
  getCategoryColor,
  getCategoryLabel,
}: {
  goal: Goal;
  projectId: string;
  onEdit: () => void;
  onDelete: () => void;
  onCheck: () => void;
  getCategoryColor: (category: string) => string;
  getCategoryLabel: (category: string) => string;
}) {
  const { data: progress } = useQuery({
    queryKey: ['goal-progress', goal.id],
    queryFn: async () => {
      const response = await goalsApi.getProgress(goal.id);
      return response.data;
    },
  });

  const daysUntilDeadline = goal.deadline
    ? Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const isOverdue = daysUntilDeadline !== null && daysUntilDeadline < 0;

  return (
    <div className={`bg-background-card border ${goal.achieved ? 'border-success' : 'border-border'} rounded-lg p-6 hover:shadow-lg transition-shadow`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {goal.achieved ? (
              <CheckCircle className="w-5 h-5 text-success" />
            ) : (
              <Circle className="w-5 h-5 text-text-tertiary" />
            )}
            <h3 className="text-lg font-bold text-text-primary">{goal.name}</h3>
          </div>
          <p className={`text-sm font-medium ${getCategoryColor(goal.category)}`}>
            {getCategoryLabel(goal.category)}
          </p>
        </div>

        {!goal.achieved && (
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="p-2 hover:bg-background-secondary rounded-lg transition-colors"
              title="Edit"
            >
              <Edit2 className="w-4 h-4 text-text-secondary" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 hover:bg-error/10 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4 text-error" />
            </button>
          </div>
        )}
      </div>

      {goal.description && (
        <p className="text-sm text-text-secondary mb-4">{goal.description}</p>
      )}

      {/* Progress Bar */}
      {progress && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-secondary">Progress</span>
            <span className="text-sm font-bold text-text-primary">
              {progress.currentScore} / {progress.targetScore}
            </span>
          </div>
          <div className="w-full bg-background-secondary rounded-full h-2 overflow-hidden">
            <div
              className={`h-full ${goal.achieved ? 'bg-success' : 'bg-primary'} transition-all`}
              style={{ width: `${Math.min(progress.percentage, 100)}%` }}
            />
          </div>
          <p className="text-xs text-text-tertiary mt-1">{progress.percentage.toFixed(1)}% complete</p>
        </div>
      )}

      {/* Deadline */}
      {goal.deadline && (
        <div className={`flex items-center gap-2 text-sm ${isOverdue && !goal.achieved ? 'text-error' : 'text-text-secondary'} mb-4`}>
          <Calendar className="w-4 h-4" />
          {goal.achieved ? (
            <span>Achieved {daysUntilDeadline && daysUntilDeadline < 0 ? `${Math.abs(daysUntilDeadline)} days early` : 'on time'}!</span>
          ) : isOverdue ? (
            <span>Overdue by {Math.abs(daysUntilDeadline!)} days</span>
          ) : (
            <span>{daysUntilDeadline} days remaining</span>
          )}
        </div>
      )}

      {/* Achievement Info */}
      {goal.achieved && goal.achievedAt && (
        <div className="bg-success/10 rounded-lg p-3">
          <p className="text-sm font-medium text-success">
            ✅ Achieved on {new Date(goal.achievedAt).toLocaleDateString()}
          </p>
          {goal.achievedScore && (
            <p className="text-xs text-success/80 mt-1">
              Final score: {goal.achievedScore}
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      {!goal.achieved && progress && progress.currentScore >= progress.targetScore && (
        <button
          onClick={onCheck}
          className="w-full mt-4 px-4 py-2 bg-success text-white rounded-lg hover:bg-success/90 transition-colors flex items-center justify-center gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          Mark as Achieved
        </button>
      )}
    </div>
  );
}

// Goal Modal Component
function GoalModal({
  projectId,
  goal,
  onClose,
  onSuccess,
}: {
  projectId: string;
  goal: Goal | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: goal?.name || '',
    targetScore: goal?.targetScore || 80,
    category: goal?.category || 'OVERALL',
    deadline: goal?.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : '',
    description: goal?.description || '',
  });

  const mutation = useMutation({
    mutationFn: (data: any) => {
      if (goal) {
        return goalsApi.update(goal.id, data);
      }
      return goalsApi.create({ ...data, projectId });
    },
    onSuccess: () => {
      toast.success(goal ? 'Goal updated successfully' : 'Goal created successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to save goal');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      ...formData,
      targetScore: parseInt(formData.targetScore.toString()),
      deadline: formData.deadline || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background-card border border-border rounded-lg max-w-lg w-full p-6">
        <h2 className="text-xl font-bold text-text-primary mb-4">
          {goal ? 'Edit Goal' : 'Create New Goal'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Goal Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-background-secondary border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
              placeholder="e.g., Reach 90 Performance Score"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Category *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 bg-background-secondary border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
            >
              <option value="OVERALL">Overall Score</option>
              <option value="PERFORMANCE">Performance</option>
              <option value="TECHNICAL">Technical SEO</option>
              <option value="ON_PAGE">On-Page SEO</option>
              <option value="STRUCTURED_DATA">Structured Data</option>
              <option value="LOCAL_SEO">Local SEO</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Target Score * (0-100)</label>
            <input
              type="number"
              value={formData.targetScore}
              onChange={(e) => setFormData({ ...formData, targetScore: parseInt(e.target.value) })}
              min="0"
              max="100"
              className="w-full px-4 py-2 bg-background-secondary border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Deadline (Optional)</label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              className="w-full px-4 py-2 bg-background-secondary border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Description (Optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 bg-background-secondary border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary resize-none"
              placeholder="Add notes or context for this goal..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-background-secondary text-text-primary rounded-lg hover:bg-background-secondary/80 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {mutation.isPending ? 'Saving...' : goal ? 'Update Goal' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

