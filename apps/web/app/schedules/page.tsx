'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schedulesApi, projectsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { formatDateTime } from '@/lib/utils';
import { 
  Calendar, 
  Plus, 
  Trash2, 
  Edit2, 
  Power, 
  PowerOff, 
  Clock, 
  ArrowLeft,
  RefreshCw 
} from 'lucide-react';

interface Schedule {
  id: string;
  userId: string;
  projectId: string;
  url: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  lastRunAt: string | null;
  nextRunAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  project: {
    id: string;
    name: string;
    domain: string;
  };
}

interface Project {
  id: string;
  name: string;
  domain: string;
}

export default function SchedulesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
    }
  }, [router]);

  const { data: schedules, isLoading } = useQuery({
    queryKey: ['schedules'],
    queryFn: async () => {
      const response = await schedulesApi.getAll();
      return response.data as Schedule[];
    },
  });

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await projectsApi.getAll();
      return response.data as Project[];
    },
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: (id: string) => schedulesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success('Schedule deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete schedule');
    },
  });

  const toggleScheduleMutation = useMutation({
    mutationFn: (id: string) => schedulesApi.toggle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success('Schedule updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update schedule');
    },
  });

  const getFrequencyBadgeColor = (frequency: string) => {
    switch (frequency) {
      case 'DAILY':
        return 'bg-primary/20 text-primary';
      case 'WEEKLY':
        return 'bg-accent/20 text-accent';
      case 'MONTHLY':
        return 'bg-warning/20 text-warning';
      default:
        return 'bg-text-secondary/20 text-text-secondary';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-background-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">Scheduled Audits</h1>
              <p className="text-text-secondary">
                Automate your SEO audits with recurring schedules
              </p>
            </div>
            <button
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-all hover:scale-105 active:scale-95 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              <span>New Schedule</span>
            </button>
          </div>
        </div>
      </div>

      {/* Schedules List */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : schedules && schedules.length > 0 ? (
          <div className="grid gap-6">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="bg-background-card border border-border rounded-xl p-6 hover:border-primary transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-text-primary">
                        {schedule.project.name}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getFrequencyBadgeColor(schedule.frequency)}`}>
                        {schedule.frequency}
                      </span>
                      <div className="flex items-center gap-1">
                        {schedule.isActive ? (
                          <span className="flex items-center gap-1 text-success text-sm">
                            <Power className="w-4 h-4" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-text-secondary text-sm">
                            <PowerOff className="w-4 h-4" />
                            <span>Paused</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-text-secondary mb-4 flex items-center gap-2">
                      <span className="text-primary font-mono">{schedule.url}</span>
                    </p>

                    <div className="flex items-center gap-6 text-sm text-text-secondary">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>Next run: {formatDateTime(schedule.nextRunAt)}</span>
                      </div>
                      {schedule.lastRunAt && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>Last run: {formatDateTime(schedule.lastRunAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleScheduleMutation.mutate(schedule.id)}
                      className="p-2 text-text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                      title={schedule.isActive ? 'Pause schedule' : 'Activate schedule'}
                    >
                      {schedule.isActive ? (
                        <PowerOff className="w-5 h-5" />
                      ) : (
                        <Power className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={() => setEditingSchedule(schedule)}
                      className="p-2 text-text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                      title="Edit schedule"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this schedule?')) {
                          deleteScheduleMutation.mutate(schedule.id);
                        }
                      }}
                      className="p-2 text-text-secondary hover:text-danger hover:bg-danger/10 rounded-lg transition-all"
                      title="Delete schedule"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-background-card border border-border rounded-xl">
            <Calendar className="w-16 h-16 text-text-secondary mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              No scheduled audits yet
            </h3>
            <p className="text-text-secondary mb-6">
              Create your first scheduled audit to automate your SEO monitoring
            </p>
            <button
              onClick={() => setShowNewModal(true)}
              className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-all inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>Create Schedule</span>
            </button>
          </div>
        )}
      </div>

      {/* New/Edit Schedule Modal */}
      {(showNewModal || editingSchedule) && (
        <ScheduleModal
          schedule={editingSchedule}
          projects={projects || []}
          onClose={() => {
            setShowNewModal(false);
            setEditingSchedule(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['schedules'] });
            setShowNewModal(false);
            setEditingSchedule(null);
          }}
        />
      )}
    </div>
  );
}

// Schedule Modal Component
function ScheduleModal({
  schedule,
  projects,
  onClose,
  onSuccess,
}: {
  schedule: Schedule | null;
  projects: Project[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    projectId: schedule?.projectId || '',
    url: schedule?.url || '',
    frequency: schedule?.frequency || 'WEEKLY' as 'DAILY' | 'WEEKLY' | 'MONTHLY',
    isActive: schedule?.isActive ?? true,
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => schedulesApi.create(data),
    onSuccess: () => {
      toast.success('Schedule created successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create schedule');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<typeof formData>) => 
      schedulesApi.update(schedule!.id, data),
    onSuccess: () => {
      toast.success('Schedule updated successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update schedule');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectId || !formData.url) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (schedule) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background-card border border-border rounded-xl p-6 max-w-md w-full shadow-2xl">
        <h2 className="text-2xl font-bold text-text-primary mb-6">
          {schedule ? 'Edit Schedule' : 'New Schedule'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Project *
            </label>
            <select
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              required
              disabled={!!schedule}
            >
              <option value="">Select a project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name} ({project.domain})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              URL *
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://example.com"
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Frequency *
            </label>
            <select
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-text-primary">
              Active (start immediately)
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-text-primary hover:bg-background-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : schedule
                ? 'Update'
                : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
