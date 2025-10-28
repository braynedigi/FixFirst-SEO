'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Save, Trash2, AlertTriangle } from 'lucide-react';

interface ProjectSettingsProps {
  project: any;
  isOwner: boolean;
}

export default function ProjectSettings({ project, isOwner }: ProjectSettingsProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState(project.name);
  const [domain, setDomain] = useState(project.domain);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const updateProjectMutation = useMutation({
    mutationFn: (data: { name: string; domain: string }) =>
      projectsApi.update(project.id, data),
    onSuccess: () => {
      toast.success('Project updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['project', project.id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update project');
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: () => projectsApi.delete(project.id),
    onSuccess: () => {
      toast.success('Project deleted successfully!');
      router.push('/dashboard');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete project');
    },
  });

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Project name is required');
      return;
    }
    if (!domain.trim()) {
      toast.error('Project domain is required');
      return;
    }
    updateProjectMutation.mutate({ name: name.trim(), domain: domain.trim() });
  };

  const handleDelete = () => {
    deleteProjectMutation.mutate();
  };

  return (
    <div className="max-w-2xl">
      {/* General Settings */}
      <div className="bg-background-card border border-border rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">General Settings</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Project Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Website"
              className="input"
              disabled={!isOwner || updateProjectMutation.isPending}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Website Domain
            </label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="example.com"
              className="input"
              disabled={!isOwner || updateProjectMutation.isPending}
            />
            <p className="text-xs text-text-secondary mt-1">
              Enter your website domain without https:// or www.
            </p>
          </div>

          {isOwner && (
            <button
              onClick={handleSave}
              disabled={updateProjectMutation.isPending}
              className="btn-primary flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {updateProjectMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>

      {/* Project Information */}
      <div className="bg-background-card border border-border rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Project Information</h3>
        
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-text-secondary">Project ID:</span>
            <span className="text-text-primary font-mono">{project.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Created:</span>
            <span className="text-text-primary">{new Date(project.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Last Updated:</span>
            <span className="text-text-primary">{new Date(project.updatedAt).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Total Audits:</span>
            <span className="text-text-primary">{project._count?.audits || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Team Members:</span>
            <span className="text-text-primary">{project._count?.members || 0}</span>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      {isOwner && (
        <div className="bg-background-card border border-error rounded-lg p-6">
          <h3 className="text-lg font-semibold text-error mb-2 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </h3>
          <p className="text-text-secondary text-sm mb-4">
            Once you delete a project, there is no going back. Please be certain.
          </p>
          
          <button
            onClick={() => setShowDeleteModal(true)}
            className="btn-danger flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete Project
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-background-card border border-error rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-error/10 rounded-full">
                <AlertTriangle className="w-6 h-6 text-error" />
              </div>
              <h3 className="text-xl font-bold text-text-primary">Delete Project</h3>
            </div>

            <p className="text-text-secondary mb-4">
              Are you sure you want to delete <strong className="text-text-primary">{project.name}</strong>?
              This action cannot be undone and will permanently delete:
            </p>

            <ul className="list-disc list-inside text-text-secondary text-sm mb-6 space-y-1">
              <li>All audit history and reports</li>
              <li>All team member access</li>
              <li>All activity logs</li>
              <li>All project settings</li>
            </ul>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn-secondary flex-1"
                disabled={deleteProjectMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="btn-danger flex-1"
                disabled={deleteProjectMutation.isPending}
              >
                {deleteProjectMutation.isPending ? 'Deleting...' : 'Delete Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

