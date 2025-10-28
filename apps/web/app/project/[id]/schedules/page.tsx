'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schedulesApi, projectsApi } from '@/lib/api';
import { 
  Clock, Calendar, Plus, Play, Pause, Edit2, Trash2, 
  ArrowLeft, Loader2, AlertCircle, CheckCircle 
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Schedule {
  id: string;
  projectId: string;
  url: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  nextRunAt: string;
  lastRunAt: string | null;
  isActive: boolean;
  createdAt: string;
  project: {
    id: string;
    name: string;
    domain: string;
  };
}

export default function ProjectSchedulesPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const projectId = params.id as string;

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  // Fetch project
  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const response = await projectsApi.getOne(projectId);
      return response.data;
    },
  });

  // Fetch all schedules
  const { data: allSchedules, isLoading } = useQuery({
    queryKey: ['schedules'],
    queryFn: async () => {
      const response = await schedulesApi.getAll();
      return response.data;
    },
  });

  // Filter schedules for this project
  const schedules = allSchedules?.filter((s: Schedule) => s.projectId === projectId) || [];

  // Toggle schedule mutation
  const toggleMutation = useMutation({
    mutationFn: (id: string) => schedulesApi.toggle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success('Schedule status updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to toggle schedule');
    },
  });

  // Delete schedule mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => schedulesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success('Schedule deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete schedule');
    },
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this schedule?')) {
      deleteMutation.mutate(id);
    }
  };

  const activeSchedules = schedules.filter((s: Schedule) => s.isActive);
  const pausedSchedules = schedules.filter((s: Schedule) => !s.isActive);

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      DAILY: 'Daily',
      WEEKLY: 'Weekly',
      MONTHLY: 'Monthly',
    };
    return labels[frequency] || frequency;
  };

  const getFrequencyColor = (frequency: string) => {
    const colors: Record<string, string> = {
      DAILY: 'text-blue-500',
      WEEKLY: 'text-green-500',
      MONTHLY: 'text-purple-500',
    };
    return colors[frequency] || 'text-text-secondary';
  };

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
                <h1 className="text-2xl font-bold text-text-primary">Scheduled Audits</h1>
                <p className="text-sm text-text-secondary mt-1">
                  {project?.name} • Automate your SEO monitoring
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setEditingSchedule(null);
                setShowCreateModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Schedule
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
        ) : schedules.length === 0 ? (
          <div className="bg-background-card border border-border rounded-lg p-12 text-center">
            <Clock className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
            <h3 className="text-xl font-bold text-text-primary mb-2">No Schedules Yet</h3>
            <p className="text-text-secondary mb-6">
              Set up automated audits to monitor your SEO performance regularly
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Create Your First Schedule
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Active Schedules */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Play className="w-5 h-5 text-success" />
                <h2 className="text-lg font-bold text-text-primary">Active Schedules ({activeSchedules.length})</h2>
              </div>

              {activeSchedules.length === 0 ? (
                <div className="bg-background-card border border-border rounded-lg p-8 text-center">
                  <p className="text-text-secondary">No active schedules</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {activeSchedules.map((schedule: Schedule) => (
                    <ScheduleCard
                      key={schedule.id}
                      schedule={schedule}
                      onToggle={() => toggleMutation.mutate(schedule.id)}
                      onEdit={() => {
                        setEditingSchedule(schedule);
                        setShowCreateModal(true);
                      }}
                      onDelete={() => handleDelete(schedule.id)}
                      getFrequencyLabel={getFrequencyLabel}
                      getFrequencyColor={getFrequencyColor}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Paused Schedules */}
            {pausedSchedules.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Pause className="w-5 h-5 text-text-tertiary" />
                  <h2 className="text-lg font-bold text-text-primary">Paused Schedules ({pausedSchedules.length})</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {pausedSchedules.map((schedule: Schedule) => (
                    <ScheduleCard
                      key={schedule.id}
                      schedule={schedule}
                      onToggle={() => toggleMutation.mutate(schedule.id)}
                      onEdit={() => {
                        setEditingSchedule(schedule);
                        setShowCreateModal(true);
                      }}
                      onDelete={() => handleDelete(schedule.id)}
                      getFrequencyLabel={getFrequencyLabel}
                      getFrequencyColor={getFrequencyColor}
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
        <ScheduleModal
          projectId={projectId}
          projectUrl={project?.domain || ''}
          schedule={editingSchedule}
          onClose={() => {
            setShowCreateModal(false);
            setEditingSchedule(null);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setEditingSchedule(null);
            queryClient.invalidateQueries({ queryKey: ['schedules'] });
          }}
        />
      )}
    </div>
  );
}

// Schedule Card Component
function ScheduleCard({
  schedule,
  onToggle,
  onEdit,
  onDelete,
  getFrequencyLabel,
  getFrequencyColor,
}: {
  schedule: Schedule;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  getFrequencyLabel: (frequency: string) => string;
  getFrequencyColor: (frequency: string) => string;
}) {
  const nextRun = new Date(schedule.nextRunAt);
  const lastRun = schedule.lastRunAt ? new Date(schedule.lastRunAt) : null;
  const now = new Date();
  const timeUntilNext = Math.max(0, nextRun.getTime() - now.getTime());
  const hoursUntilNext = Math.floor(timeUntilNext / (1000 * 60 * 60));
  const minutesUntilNext = Math.floor((timeUntilNext % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div className={`bg-background-card border ${schedule.isActive ? 'border-success' : 'border-border'} rounded-lg p-6 hover:shadow-lg transition-shadow`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {schedule.isActive ? (
              <CheckCircle className="w-5 h-5 text-success" />
            ) : (
              <Pause className="w-5 h-5 text-text-tertiary" />
            )}
            <span className={`text-sm font-medium ${getFrequencyColor(schedule.frequency)}`}>
              {getFrequencyLabel(schedule.frequency)}
            </span>
          </div>
          <p className="text-sm text-text-primary font-mono">{schedule.url}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggle}
            className={`p-2 rounded-lg transition-colors ${
              schedule.isActive
                ? 'hover:bg-warning/10 text-warning'
                : 'hover:bg-success/10 text-success'
            }`}
            title={schedule.isActive ? 'Pause' : 'Resume'}
          >
            {schedule.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
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
      </div>

      {/* Next Run */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-text-tertiary" />
          <span className="text-text-secondary">Next run:</span>
          <span className="font-medium text-text-primary">
            {nextRun.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        {schedule.isActive && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-text-tertiary" />
            <span className="text-text-secondary">
              {hoursUntilNext > 0 ? `In ${hoursUntilNext}h ${minutesUntilNext}m` : `In ${minutesUntilNext}m`}
            </span>
          </div>
        )}

        {/* Last Run */}
        {lastRun && (
          <div className="pt-3 border-t border-border">
            <p className="text-xs text-text-tertiary">
              Last run: {lastRun.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        )}
      </div>

      {/* Status Badge */}
      {!schedule.isActive && (
        <div className="mt-4 px-3 py-2 bg-text-tertiary/10 rounded-lg">
          <p className="text-xs font-medium text-text-tertiary text-center">Paused</p>
        </div>
      )}
    </div>
  );
}

// Schedule Modal Component
function ScheduleModal({
  projectId,
  projectUrl,
  schedule,
  onClose,
  onSuccess,
}: {
  projectId: string;
  projectUrl: string;
  schedule: Schedule | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    url: schedule?.url || `https://${projectUrl}`,
    frequency: schedule?.frequency || 'WEEKLY' as 'DAILY' | 'WEEKLY' | 'MONTHLY',
    nextRunAt: schedule?.nextRunAt 
      ? new Date(schedule.nextRunAt).toISOString().slice(0, 16) 
      : '',
    isActive: schedule?.isActive !== undefined ? schedule.isActive : true,
  });

  const mutation = useMutation({
    mutationFn: (data: any) => {
      if (schedule) {
        return schedulesApi.update(schedule.id, data);
      }
      return schedulesApi.create({ ...data, projectId });
    },
    onSuccess: () => {
      toast.success(schedule ? 'Schedule updated successfully' : 'Schedule created successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to save schedule');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      url: formData.url,
      frequency: formData.frequency,
      nextRunAt: formData.nextRunAt || undefined,
      isActive: formData.isActive,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background-card border border-border rounded-lg max-w-lg w-full p-6">
        <h2 className="text-xl font-bold text-text-primary mb-4">
          {schedule ? 'Edit Schedule' : 'Create New Schedule'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">URL to Audit *</label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="w-full px-4 py-2 bg-background-secondary border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary font-mono text-sm"
              placeholder="https://example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Frequency *</label>
            <select
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value as 'DAILY' | 'WEEKLY' | 'MONTHLY' })}
              className="w-full px-4 py-2 bg-background-secondary border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
            >
              <option value="DAILY">Daily - Every day at the scheduled time</option>
              <option value="WEEKLY">Weekly - Once per week</option>
              <option value="MONTHLY">Monthly - Once per month</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Next Run (Optional)
            </label>
            <input
              type="datetime-local"
              value={formData.nextRunAt}
              onChange={(e) => setFormData({ ...formData, nextRunAt: e.target.value })}
              className="w-full px-4 py-2 bg-background-secondary border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
            />
            <p className="text-xs text-text-tertiary mt-1">
              If not specified, will default to tomorrow at midnight
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="isActive" className="text-sm text-text-primary cursor-pointer">
              Start schedule immediately (active)
            </label>
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
              {mutation.isPending ? 'Saving...' : schedule ? 'Update Schedule' : 'Create Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

