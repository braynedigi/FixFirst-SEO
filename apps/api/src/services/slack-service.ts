import axios from 'axios';

/**
 * Send audit completion notification to Slack
 */
export async function sendAuditCompleteNotification(
  webhookUrl: string,
  data: {
    url: string;
    score: number;
    issuesCount: number;
    auditUrl: string;
  }
) {
  try {
    const scoreEmoji = data.score >= 90 ? '🎉' : data.score >= 70 ? '✅' : data.score >= 50 ? '⚠️' : '❌';
    const scoreColor = data.score >= 90 ? '#10b981' : data.score >= 70 ? '#06b6d4' : data.score >= 50 ? '#fbbf24' : '#ef4444';

    await axios.post(webhookUrl, {
      text: `${scoreEmoji} SEO Audit Complete: ${data.url} (Score: ${data.score}/100)`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${scoreEmoji} SEO Audit Complete`,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*URL:*\n${data.url}`,
            },
            {
              type: 'mrkdwn',
              text: `*Score:*\n${data.score}/100`,
            },
            {
              type: 'mrkdwn',
              text: `*Issues Found:*\n${data.issuesCount}`,
            },
            {
              type: 'mrkdwn',
              text: `*Status:*\n${data.score >= 70 ? 'Good' : data.score >= 50 ? 'Needs Improvement' : 'Critical'}`,
            },
          ],
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View Full Report',
              },
              url: data.auditUrl,
              style: 'primary',
            },
          ],
        },
      ],
      attachments: [
        {
          color: scoreColor,
          blocks: [],
        },
      ],
    });
  } catch (error: any) {
    console.error('[Slack] Failed to send notification:', error.message);
    throw error;
  }
}

/**
 * Send audit failure notification to Slack
 */
export async function sendAuditFailureNotification(
  webhookUrl: string,
  data: {
    url: string;
    error: string;
  }
) {
  try {
    await axios.post(webhookUrl, {
      text: `❌ SEO Audit Failed: ${data.url}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '❌ SEO Audit Failed',
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*URL:*\n${data.url}`,
            },
            {
              type: 'mrkdwn',
              text: `*Error:*\n${data.error}`,
            },
          ],
        },
      ],
      attachments: [
        {
          color: '#ef4444',
          blocks: [],
        },
      ],
    });
  } catch (error: any) {
    console.error('[Slack] Failed to send failure notification:', error.message);
    throw error;
  }
}

export const slackService = {
  sendAuditCompleteNotification,
  sendAuditFailureNotification,
};

