import { PrismaClient } from '@prisma/client';
import { emailService } from './email-service';
import { slackService } from './slack-service';

const prisma = new PrismaClient();

export type NotificationType = 
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

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'SLACK' | 'WEBHOOK';

interface CreateNotificationOptions {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  priority?: NotificationPriority;
  metadata?: any;
  channels?: NotificationChannel[];
}

interface NotificationRuleCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains';
  value: any;
}

export class NotificationService {
  /**
   * Create a new notification
   */
  async createNotification(options: CreateNotificationOptions): Promise<any> {
    const {
      userId,
      type,
      title,
      message,
      actionUrl,
      priority = 'NORMAL',
      metadata = {},
      channels = ['IN_APP'],
    } = options;

    // Create in-app notification if IN_APP channel is specified
    let notification = null;
    if (channels.includes('IN_APP')) {
      notification = await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          actionUrl,
          priority,
          metadata,
        },
      });
    }

    // Get user data for email/slack
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        slackWebhookUrl: true,
        notificationPreferences: true,
      },
    });

    if (!user) {
      console.error(`[NotificationService] User ${userId} not found`);
      return notification;
    }

    // Check user preferences
    const preferences = user.notificationPreferences as any || {};

    // Send email notification
    if (channels.includes('EMAIL') && preferences.emailNotifications !== false) {
      try {
        await this.sendEmailNotification(user.email, {
          title,
          message,
          actionUrl,
          priority,
        });
      } catch (error) {
        console.error('[NotificationService] Failed to send email:', error);
      }
    }

    // Send Slack notification
    if (channels.includes('SLACK') && user.slackWebhookUrl) {
      try {
        await slackService.sendNotification(user.slackWebhookUrl, {
          title,
          message,
          actionUrl,
          priority,
        });
      } catch (error) {
        console.error('[NotificationService] Failed to send Slack notification:', error);
      }
    }

    return notification;
  }

  /**
   * Create notifications for multiple users
   */
  async createBulkNotifications(
    userIds: string[],
    options: Omit<CreateNotificationOptions, 'userId'>
  ): Promise<void> {
    await Promise.all(
      userIds.map((userId) =>
        this.createNotification({ ...options, userId })
      )
    );
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<any> {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { status: 'READ', readAt: new Date() },
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<any> {
    return prisma.notification.updateMany({
      where: { userId, status: 'UNREAD' },
      data: { status: 'READ', readAt: new Date() },
    });
  }

  /**
   * Archive notification
   */
  async archiveNotification(notificationId: string, userId: string): Promise<any> {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { status: 'ARCHIVED' },
    });
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { userId, status: 'UNREAD' },
    });
  }

  /**
   * Get notifications for a user
   */
  async getNotifications(
    userId: string,
    options: {
      status?: 'UNREAD' | 'READ' | 'ARCHIVED';
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<any[]> {
    const { status, limit = 50, offset = 0 } = options;

    return prisma.notification.findMany({
      where: {
        userId,
        ...(status && { status }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Delete old notifications (cleanup)
   */
  async deleteOldNotifications(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.notification.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        status: { in: ['READ', 'ARCHIVED'] },
      },
    });

    console.log(`[NotificationService] Deleted ${result.count} old notifications`);
    return result.count;
  }

  /**
   * Check notification rules and trigger notifications
   */
  async checkAndTriggerRules(event: string, data: any): Promise<void> {
    // Get all enabled rules for this event
    const rules = await prisma.notificationRule.findMany({
      where: {
        event,
        enabled: true,
      },
      include: {
        user: {
          select: {
            email: true,
            slackWebhookUrl: true,
          },
        },
      },
    });

    for (const rule of rules) {
      try {
        const conditions = rule.conditions as NotificationRuleCondition[];
        
        // Check if all conditions are met
        const conditionsMet = conditions.every((condition) =>
          this.evaluateCondition(condition, data)
        );

        if (conditionsMet) {
          // Generate notification based on rule
          await this.createNotification({
            userId: rule.userId,
            type: this.mapEventToNotificationType(event),
            title: rule.name,
            message: this.generateMessageFromRule(rule, data),
            actionUrl: data.actionUrl,
            priority: this.determinePriority(data),
            metadata: data,
            channels: rule.channels as NotificationChannel[],
          });
        }
      } catch (error) {
        console.error(`[NotificationService] Failed to process rule ${rule.id}:`, error);
      }
    }
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(condition: NotificationRuleCondition, data: any): boolean {
    const { field, operator, value } = condition;
    const fieldValue = this.getNestedValue(data, field);

    switch (operator) {
      case 'eq':
        return fieldValue === value;
      case 'ne':
        return fieldValue !== value;
      case 'gt':
        return fieldValue > value;
      case 'lt':
        return fieldValue < value;
      case 'gte':
        return fieldValue >= value;
      case 'lte':
        return fieldValue <= value;
      case 'contains':
        return String(fieldValue).includes(String(value));
      default:
        return false;
    }
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  }

  /**
   * Map event name to notification type
   */
  private mapEventToNotificationType(event: string): NotificationType {
    const mapping: Record<string, NotificationType> = {
      'audit.completed': 'AUDIT_COMPLETED',
      'audit.failed': 'AUDIT_FAILED',
      'score.improved': 'SCORE_IMPROVED',
      'score.declined': 'SCORE_DECLINED',
      'invitation.received': 'INVITATION_RECEIVED',
      'member.joined': 'MEMBER_JOINED',
      'comment.added': 'COMMENT_ADDED',
      'issue.detected': 'ISSUE_DETECTED',
    };
    return mapping[event] || 'SYSTEM_ALERT';
  }

  /**
   * Generate message from rule and data
   */
  private generateMessageFromRule(rule: any, data: any): string {
    let message = `Alert triggered: ${rule.name}`;
    
    if (data.projectName) {
      message += ` for project "${data.projectName}"`;
    }
    if (data.totalScore !== undefined) {
      message += ` (Score: ${data.totalScore})`;
    }
    
    return message;
  }

  /**
   * Determine priority based on data
   */
  private determinePriority(data: any): NotificationPriority {
    if (data.priority) return data.priority;
    if (data.totalScore !== undefined && data.totalScore < 50) return 'HIGH';
    if (data.criticalIssues > 5) return 'URGENT';
    return 'NORMAL';
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    email: string,
    options: {
      title: string;
      message: string;
      actionUrl?: string;
      priority: NotificationPriority;
    }
  ): Promise<void> {
    const { title, message, actionUrl, priority } = options;
    
    const priorityEmoji = {
      LOW: 'ℹ️',
      NORMAL: '📬',
      HIGH: '⚠️',
      URGENT: '🚨',
    };

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .priority { display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 14px; font-weight: bold; margin-bottom: 20px; }
            .priority-HIGH, .priority-URGENT { background: #ff6b6b; color: white; }
            .priority-NORMAL { background: #4ecdc4; color: white; }
            .priority-LOW { background: #95e1d3; color: #333; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>${priorityEmoji[priority]} ${title}</h2>
            </div>
            <div class="content">
              <span class="priority priority-${priority}">${priority} PRIORITY</span>
              <p>${message}</p>
              ${actionUrl ? `<a href="${actionUrl}" class="button">View Details</a>` : ''}
            </div>
            <div class="footer">
              <p>FixFirst SEO - Notification Service</p>
              <p>You're receiving this because you have notifications enabled</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await emailService.sendEmail({
      to: email,
      subject: `${priorityEmoji[priority]} ${title}`,
      html,
    });
  }
}

export const notificationService = new NotificationService();

