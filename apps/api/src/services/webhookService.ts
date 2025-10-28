import axios from 'axios';
import crypto from 'crypto';

interface WebhookPayload {
  event: string;
  timestamp: string;
  data: any;
}

export class WebhookService {
  /**
   * Send webhook to a URL with retry logic
   */
  async sendWebhook(
    url: string,
    payload: WebhookPayload,
    secret?: string,
    maxRetries: number = 3
  ): Promise<boolean> {
    let attempt = 0;
    
    while (attempt < maxRetries) {
      try {
        const headers: any = {
          'Content-Type': 'application/json',
          'User-Agent': 'FixFirst-SEO-Webhook/1.0',
        };

        // Add signature if secret is provided
        if (secret) {
          const signature = this.generateSignature(payload, secret);
          headers['X-Webhook-Signature'] = signature;
        }

        const response = await axios.post(url, payload, {
          headers,
          timeout: 10000, // 10 second timeout
          validateStatus: (status) => status >= 200 && status < 300,
        });

        console.log(`✅ Webhook sent successfully to ${url} (attempt ${attempt + 1})`);
        return true;
      } catch (error: any) {
        attempt++;
        console.error(`❌ Webhook failed to ${url} (attempt ${attempt}/${maxRetries}):`, error.message);
        
        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000;
          await this.sleep(delay);
        }
      }
    }

    console.error(`💥 Webhook permanently failed to ${url} after ${maxRetries} attempts`);
    return false;
  }

  /**
   * Generate HMAC signature for webhook verification
   */
  private generateSignature(payload: WebhookPayload, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return `sha256=${hmac.digest('hex')}`;
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Trigger webhooks for a specific event
   */
  async triggerWebhooks(
    webhooks: Array<{
      id: string;
      url: string;
      events: string[];
      secret?: string | null;
      enabled: boolean;
    }>,
    event: string,
    data: any
  ): Promise<void> {
    // Filter webhooks that are enabled and subscribed to this event
    const relevantWebhooks = webhooks.filter(
      (webhook) => webhook.enabled && webhook.events.includes(event)
    );

    if (relevantWebhooks.length === 0) {
      console.log(`📭 No webhooks configured for event: ${event}`);
      return;
    }

    console.log(`📤 Triggering ${relevantWebhooks.length} webhook(s) for event: ${event}`);

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    // Send webhooks in parallel
    const promises = relevantWebhooks.map((webhook) =>
      this.sendWebhook(webhook.url, payload, webhook.secret || undefined)
    );

    await Promise.allSettled(promises);
  }
}

export const webhookService = new WebhookService();

