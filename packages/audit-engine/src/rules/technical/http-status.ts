import { IAuditRule, AuditRuleContext, RuleCheckResult } from '@seo-audit/shared';

export class HttpStatusRule implements IAuditRule {
  id = 'tech-http-status';
  category = 'technical' as const;
  name = 'HTTP Status Check';
  description = 'Verify that the page returns a successful HTTP status code (200)';
  weight = 5;

  async check(context: AuditRuleContext): Promise<RuleCheckResult> {
    const { page } = context;
    const statusCode = page.statusCode;

    if (statusCode === 200) {
      return {
        passed: true,
        score: this.weight,
        issues: [],
      };
    }

    const severity = statusCode >= 400 ? 'critical' : 'warning';
    const message = `Page returned HTTP status ${statusCode}`;
    let recommendation = '';

    if (statusCode >= 500) {
      recommendation = 'Server error detected. Check your server logs and fix any configuration issues.';
    } else if (statusCode === 404) {
      recommendation = 'Page not found. Ensure the URL is correct or implement a 301 redirect to the correct page.';
    } else if (statusCode >= 400) {
      recommendation = 'Client error detected. Verify the URL and ensure the page is accessible.';
    } else if (statusCode >= 300) {
      recommendation = 'Redirect detected. Ensure redirects are properly configured and use 301 for permanent moves.';
    }

    return {
      passed: false,
      score: 0,
      issues: [
        {
          pageId: null,
          ruleId: this.id,
          severity,
          message,
          recommendation,
          metadata: { statusCode },
        },
      ],
    };
  }
}

