'use client';

import { useQuery } from '@tanstack/react-query';
import { activitiesApi } from '@/lib/api';
import { 
  Activity, 
  UserPlus, 
  UserMinus, 
  MessageSquare, 
  CheckCircle, 
  PlayCircle,
  FileText,
  Edit,
  Trash2,
  Mail
} from 'lucide-react';

interface ActivityFeedProps {
  projectId?: string;
  limit?: number;
  showHeader?: boolean;
}

interface ActivityItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: any;
  createdAt: string;
  user: {
    id: string;
    email: string;
  };
  project?: {
    id: string;
    name: string;
    domain: string;
  };
}

export default function ActivityFeed({ projectId, limit = 20, showHeader = true }: ActivityFeedProps) {
  // Fetch activities
  const { data: activities = [], isLoading } = useQuery({
    queryKey: projectId ? ['activities', projectId] : ['activities', 'recent'],
    queryFn: async () => {
      const response = projectId
        ? await activitiesApi.getForProject(projectId, limit)
        : await activitiesApi.getRecent(limit);
      return (projectId ? response.data.activities : response.data) as ActivityItem[];
    },
  });

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'CREATED':
        return <FileText className="w-4 h-4" />;
      case 'UPDATED':
        return <Edit className="w-4 h-4" />;
      case 'DELETED':
        return <Trash2 className="w-4 h-4" />;
      case 'INVITED':
        return <Mail className="w-4 h-4" />;
      case 'JOINED':
        return <UserPlus className="w-4 h-4" />;
      case 'LEFT':
        return <UserMinus className="w-4 h-4" />;
      case 'COMMENTED':
        return <MessageSquare className="w-4 h-4" />;
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4" />;
      case 'STARTED':
        return <PlayCircle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityColor = (action: string) => {
    switch (action) {
      case 'CREATED':
      case 'JOINED':
        return 'bg-accent/10 text-accent';
      case 'DELETED':
      case 'LEFT':
        return 'bg-error/10 text-error';
      case 'COMMENTED':
        return 'bg-primary/10 text-primary';
      case 'COMPLETED':
        return 'bg-success/10 text-success';
      case 'STARTED':
        return 'bg-warning/10 text-warning';
      default:
        return 'bg-text-muted/10 text-text-muted';
    }
  };

  const formatActivityMessage = (activity: ActivityItem) => {
    const { action, entityType, metadata } = activity;
    const userEmail = activity.user.email.split('@')[0];

    switch (action) {
      case 'CREATED':
        return (
          <>
            <span className="font-semibold">{userEmail}</span> created a new {entityType}
          </>
        );
      case 'UPDATED':
        return (
          <>
            <span className="font-semibold">{userEmail}</span> updated {entityType}
            {metadata?.newRole && <span className="text-text-muted"> to {metadata.newRole}</span>}
          </>
        );
      case 'DELETED':
        return (
          <>
            <span className="font-semibold">{userEmail}</span> deleted {entityType}
          </>
        );
      case 'INVITED':
        return (
          <>
            <span className="font-semibold">{userEmail}</span> invited{' '}
            <span className="font-medium">{metadata?.role || 'someone'}</span> to the project
          </>
        );
      case 'JOINED':
        return (
          <>
            <span className="font-semibold">{userEmail}</span> joined the project as{' '}
            <span className="font-medium">{metadata?.role || 'member'}</span>
          </>
        );
      case 'LEFT':
        return (
          <>
            <span className="font-semibold">{userEmail}</span> left the project
          </>
        );
      case 'COMMENTED':
        return (
          <>
            <span className="font-semibold">{userEmail}</span> commented on an issue
          </>
        );
      case 'COMPLETED':
        return (
          <>
            <span className="font-semibold">{userEmail}</span> completed an audit
          </>
        );
      case 'STARTED':
        return (
          <>
            <span className="font-semibold">{userEmail}</span> started an audit
          </>
        );
      default:
        return (
          <>
            <span className="font-semibold">{userEmail}</span> performed {action.toLowerCase()} on {entityType}
          </>
        );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          <h4 className="font-semibold text-text-primary">Recent Activity</h4>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-text-muted">Loading activities...</div>
      ) : activities.length === 0 ? (
        <div className="text-center py-8 text-text-muted bg-background-card border border-border rounded-lg">
          <Activity className="w-12 h-12 mx-auto mb-2 text-text-muted/50" />
          <p>No activity yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="bg-background-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`p-2 rounded-lg ${getActivityColor(activity.action)}`}>
                  {getActivityIcon(activity.action)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary">
                    {formatActivityMessage(activity)}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-text-muted">{formatDate(activity.createdAt)}</p>
                    {!projectId && activity.project && (
                      <>
                        <span className="text-xs text-text-muted">•</span>
                        <p className="text-xs text-text-muted">{activity.project.name}</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-primary">
                    {activity.user.email.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

