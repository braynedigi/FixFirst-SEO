import { IAuditRule, AuditRuleContext, RuleCheckResult } from '@seo-audit/shared';

export class HttpsRule implements IAuditRule {
  id = 'tech-https';
  category = 'technical' as const;
  name = 'HTTPS Enforcement';
  description = 'Ensure the website uses HTTPS for secure connections';
  weight = 5;

  async check(context: AuditRuleContext): Promise<RuleCheckResult> {
    const { page } = context;
    const url = new URL(page.finalUrl);

    if (url.protocol === 'https:') {
      // Check for HSTS header
      const hasHsts = page.headers['strict-transport-security'] !== undefined;
      
      return {
        passed: true,
        score: this.weight,
        issues: hasHsts ? [] : [
          {
            pageId: null,
            ruleId: this.id,
            severity: 'info',
            message: 'HTTPS is enabled but HSTS header is missing',
            recommendation: 'Add the Strict-Transport-Security header to enforce HTTPS: "Strict-Transport-Security: max-age=31536000; includeSubDomains"',
            metadata: {},
          },
        ],
      };
    }

    return {
      passed: false,
      score: 0,
      issues: [
        {
          pageId: null,
          ruleId: this.id,
          severity: 'critical',
          message: 'Website does not use HTTPS',
          recommendation: 'Enable HTTPS by obtaining an SSL/TLS certificate. You can get a free certificate from Let\'s Encrypt. Configure your server to redirect all HTTP traffic to HTTPS.',
          metadata: { protocol: url.protocol },
        },
      ],
    };
  }
}

