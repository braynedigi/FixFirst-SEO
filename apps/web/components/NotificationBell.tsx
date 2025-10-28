'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api';
import { Bell, Check, CheckCheck, Archive, X, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function NotificationBell() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showPanel, setShowPanel] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Get unread count
  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const res = await notificationsApi.getUnreadCount();
      return res.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Get all notifications
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await notificationsApi.getAll({ limit: 20 });
      return res.data;
    },
    enabled: showPanel,
  });

  const unreadCount = unreadData?.count || 0;

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
      toast.success('All notifications marked as read');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });

  // Archive mutation
  const archiveMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setShowPanel(false);
      }
    };

    if (showPanel) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPanel]);

  const handleNotificationClick = (notification: any) => {
    // Mark as read
    if (notification.status === 'UNREAD') {
      markAsReadMutation.mutate(notification.id);
    }

    // Navigate if action URL exists
    if (notification.actionUrl) {
      setShowPanel(false);
      // Handle relative URLs
      if (notification.actionUrl.startsWith('/')) {
        router.push(notification.actionUrl);
      } else {
        window.open(notification.actionUrl, '_blank');
      }
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-error/10 border-error/30';
      case 'HIGH':
        return 'bg-warning/10 border-warning/30';
      case 'LOW':
        return 'bg-success/10 border-success/30';
      default:
        return 'bg-background-secondary border-border';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <AlertCircle className="w-4 h-4 text-error" />;
      case 'HIGH':
        return <AlertCircle className="w-4 h-4 text-warning" />;
      default:
        return <Bell className="w-4 h-4 text-primary" />;
    }
  };

  const getTypeIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      AUDIT_COMPLETED: '✅',
      AUDIT_FAILED: '❌',
      SCORE_IMPROVED: '📈',
      SCORE_DECLINED: '📉',
      INVITATION_RECEIVED: '📧',
      MEMBER_JOINED: '👥',
      COMMENT_ADDED: '💬',
      ISSUE_DETECTED: '🚨',
      RECOMMENDATION_AVAILABLE: '💡',
    };
    return iconMap[type] || '🔔';
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 rounded-lg hover:bg-background-secondary transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6 text-text-secondary hover:text-text-primary transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-error text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {showPanel && (
        <div className="absolute right-0 top-full mt-2 w-96 max-h-[600px] bg-background-card border border-border rounded-lg shadow-2xl z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-text-primary">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs font-medium rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsReadMutation.mutate()}
                  disabled={markAllAsReadMutation.isPending}
                  className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setShowPanel(false)}
                className="text-text-secondary hover:text-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifications && notifications.length > 0 ? (
              <div className="divide-y divide-border">
                {notifications.map((notification: any) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 hover:bg-background-secondary transition-colors cursor-pointer ${
                      notification.status === 'UNREAD' ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 text-2xl mt-0.5">
                        {getTypeIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className={`font-medium text-sm ${
                            notification.status === 'UNREAD' ? 'text-text-primary' : 'text-text-secondary'
                          }`}>
                            {notification.title}
                          </h4>
                          {getPriorityIcon(notification.priority)}
                        </div>
                        <p className="text-xs text-text-muted line-clamp-2 mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-text-muted flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(notification.createdAt).toLocaleString()}
                          </span>
                          <div className="flex items-center gap-1">
                            {notification.status === 'UNREAD' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsReadMutation.mutate(notification.id);
                                }}
                                className="p-1 hover:bg-background-card rounded"
                                title="Mark as read"
                              >
                                <Check className="w-3 h-3 text-success" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                archiveMutation.mutate(notification.id);
                              }}
                              className="p-1 hover:bg-background-card rounded"
                              title="Archive"
                            >
                              <Archive className="w-3 h-3 text-text-secondary" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <Bell className="w-16 h-16 text-text-secondary mb-4 opacity-50" />
                <p className="text-text-secondary font-medium mb-2">No notifications</p>
                <p className="text-xs text-text-muted">
                  You're all caught up! We'll notify you when something important happens.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications && notifications.length > 0 && (
            <div className="p-3 border-t border-border">
              <button
                onClick={() => {
                  setShowPanel(false);
                  router.push('/notifications');
                }}
                className="w-full text-center text-sm text-primary hover:text-primary/80 font-medium"
              >
                View All Notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

