'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api';
import { Bell, Check, CheckCheck, Trash2, AlertCircle, Calendar, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type NotificationType =
  | 'AUDIT_COMPLETED'
  | 'AUDIT_FAILED'
  | 'ISSUE_DETECTED'
  | 'SCORE_IMPROVED'
  | 'SCORE_DECLINED'
  | 'INVITATION_RECEIVED'
  | 'MEMBER_JOINED'
  | 'COMMENT_ADDED'
  | 'SYSTEM_ALERT'
  | 'RECOMMENDATION_AVAILABLE';

type NotificationStatus = 'UNREAD' | 'READ' | 'ARCHIVED';
type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  status: NotificationStatus;
  priority: NotificationPriority;
  createdAt: string;
  readAt?: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', filter],
    queryFn: async () => {
      const statusParam = filter === 'all' ? undefined : filter.toUpperCase();
      const response = await notificationsApi.getAll({ status: statusParam, limit: 100 });
      return response.data;
    },
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });

  // Archive notification mutation
  const archiveMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    if (notification.status === 'UNREAD') {
      markAsReadMutation.mutate(notification.id);
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  const getNotificationIcon = (type: NotificationType): string => {
    const iconMap: Record<NotificationType, string> = {
      AUDIT_COMPLETED: '✅',
      AUDIT_FAILED: '❌',
      ISSUE_DETECTED: '⚠️',
      SCORE_IMPROVED: '📈',
      SCORE_DECLINED: '📉',
      INVITATION_RECEIVED: '📬',
      MEMBER_JOINED: '👥',
      COMMENT_ADDED: '💬',
      SYSTEM_ALERT: '🔔',
      RECOMMENDATION_AVAILABLE: '💡',
    };
    return iconMap[type] || '🔔';
  };

  const getPriorityColor = (priority: NotificationPriority): string => {
    const colorMap: Record<NotificationPriority, string> = {
      LOW: 'text-text-tertiary',
      NORMAL: 'text-text-secondary',
      HIGH: 'text-warning',
      URGENT: 'text-error',
    };
    return colorMap[priority];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter((n: Notification) => n.status === 'UNREAD').length;

  return (
    <div className="min-h-screen bg-background-primary">
      {/* Header */}
      <div className="bg-background-card border-b border-border sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="p-2 hover:bg-background-secondary rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-text-secondary" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
                  <Bell className="w-7 h-7 text-primary" />
                  Notifications
                </h1>
                <p className="text-sm text-text-tertiary mt-1">
                  {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                <CheckCheck className="w-4 h-4" />
                Mark All Read
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mt-6">
            {['all', 'unread', 'read'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === f
                    ? 'bg-primary text-white'
                    : 'bg-background-secondary text-text-secondary hover:bg-background-tertiary'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-text-tertiary mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">No notifications</h3>
            <p className="text-text-tertiary">
              {filter === 'unread' ? "You're all caught up!" : 'No notifications to display'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification: Notification) => (
              <div
                key={notification.id}
                className={`bg-background-card border rounded-lg p-4 transition-all hover:shadow-md ${
                  notification.status === 'UNREAD'
                    ? 'border-primary bg-primary bg-opacity-5'
                    : 'border-border'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="text-3xl flex-shrink-0">{getNotificationIcon(notification.type)}</div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3
                          className={`font-semibold mb-1 ${
                            notification.status === 'UNREAD' ? 'text-text-primary' : 'text-text-secondary'
                          } ${getPriorityColor(notification.priority)}`}
                        >
                          {notification.title}
                        </h3>
                        <p className="text-sm text-text-secondary mb-2">{notification.message}</p>
                        <div className="flex items-center gap-4 text-xs text-text-tertiary">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(notification.createdAt)}
                          </span>
                          {notification.status === 'UNREAD' && (
                            <span className="px-2 py-0.5 bg-primary text-white rounded-full text-xs font-medium">
                              New
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3">
                      {notification.actionUrl && (
                        <button
                          onClick={() => handleNotificationClick(notification)}
                          className="text-sm px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                        >
                          View Details
                        </button>
                      )}
                      {notification.status === 'UNREAD' && (
                        <button
                          onClick={() => markAsReadMutation.mutate(notification.id)}
                          disabled={markAsReadMutation.isPending}
                          className="text-sm px-3 py-1.5 bg-background-secondary text-text-secondary rounded-lg hover:bg-background-tertiary transition-colors disabled:opacity-50 flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          Mark as Read
                        </button>
                      )}
                      <button
                        onClick={() => archiveMutation.mutate(notification.id)}
                        disabled={archiveMutation.isPending}
                        className="text-sm px-3 py-1.5 bg-background-secondary text-error rounded-lg hover:bg-error hover:bg-opacity-10 transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

