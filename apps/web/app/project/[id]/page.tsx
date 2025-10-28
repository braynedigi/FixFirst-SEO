'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { projectsApi, authApi } from '@/lib/api';
import TeamManagement from '@/components/TeamManagement';
import ActivityFeed from '@/components/ActivityFeed';
import ProjectSettings from '@/components/ProjectSettings';
import { ArrowLeft, Users, Activity, Settings as SettingsIcon, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';

type TabType = 'team' | 'activity' | 'settings' | 'analytics';

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [activeTab, setActiveTab] = useState<TabType>('team');
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await authApi.me();
        setCurrentUser(response.data);
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };
    fetchUser();
  }, []);

  // Fetch project details
  const { data: project, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const response = await projectsApi.getOne(projectId);
      return response.data;
    },
  });

  const isOwner = currentUser?.id === project?.userId;
  const isAdmin = false; // TODO: Check if user has ADMIN role in project members

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-text-muted">Loading project...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-text-muted">Project not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 hover:bg-background-light rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-text-muted" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">{project.name}</h1>
                <p className="text-sm text-text-muted">{project.domain}</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-6 border-b border-border">
            <button
              onClick={() => setActiveTab('team')}
              className={`pb-3 px-2 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === 'team'
                  ? 'text-primary border-primary'
                  : 'text-text-muted border-transparent hover:text-text-primary'
              }`}
            >
              <Users className="w-4 h-4" />
              Team
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`pb-3 px-2 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === 'activity'
                  ? 'text-primary border-primary'
                  : 'text-text-muted border-transparent hover:text-text-primary'
              }`}
            >
              <Activity className="w-4 h-4" />
              Activity
            </button>
            <button
              onClick={() => router.push(`/project/${projectId}/analytics`)}
              className="pb-3 px-2 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 text-text-muted border-transparent hover:text-text-primary"
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`pb-3 px-2 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === 'settings'
                  ? 'text-primary border-primary'
                  : 'text-text-muted border-transparent hover:text-text-primary'
              }`}
            >
              <SettingsIcon className="w-4 h-4" />
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {activeTab === 'team' && currentUser && (
          <TeamManagement
            projectId={projectId}
            isOwner={isOwner}
            isAdmin={isAdmin}
            currentUserId={currentUser.id}
          />
        )}

        {activeTab === 'activity' && (
          <ActivityFeed projectId={projectId} limit={50} />
        )}

        {activeTab === 'settings' && project && (
          <ProjectSettings project={project} isOwner={isOwner} />
        )}
      </div>
    </div>
  );
}

