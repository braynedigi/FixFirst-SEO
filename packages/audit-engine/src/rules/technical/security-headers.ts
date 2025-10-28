import { IAuditRule, AuditRuleContext, RuleCheckResult } from '@seo-audit/shared';

export class SecurityHeadersRule implements IAuditRule {
  id = 'tech-security-headers';
  category = 'technical' as const;
  name = 'Security Headers';
  description = 'Verify presence of security headers (HSTS, CSP, X-Frame-Options)';
  weight = 5;

  async check(context: AuditRuleContext): Promise<RuleCheckResult> {
    const { page } = context;
    const headers = page.headers;
    
    const securityHeaders = {
      'strict-transport-security': 'HSTS',
      'content-security-policy': 'CSP',
      'x-frame-options': 'X-Frame-Options',
      'x-content-type-options': 'X-Content-Type-Options',
      'referrer-policy': 'Referrer-Policy',
    };

    const missing: string[] = [];
    const present: string[] = [];

    for (const [header, name] of Object.entries(securityHeaders)) {
      if (headers[header]) {
        present.push(name);
      } else {
        missing.push(name);
      }
    }

    const score = Math.round((present.length / Object.keys(securityHeaders).length) * this.weight);

    if (missing.length === 0) {
      return {
        passed: true,
        score: this.weight,
        issues: [],
      };
    }

    const recommendations: Record<string, string> = {
      'HSTS': 'Add Strict-Transport-Security header: "Strict-Transport-Security: max-age=31536000; includeSubDomains"',
      'CSP': 'Add Content-Security-Policy header to prevent XSS attacks. Start with: "Content-Security-Policy: default-src \'self\'"',
      'X-Frame-Options': 'Add X-Frame-Options header to prevent clickjacking: "X-Frame-Options: SAMEORIGIN"',
      'X-Content-Type-Options': 'Add X-Content-Type-Options header: "X-Content-Type-Options: nosniff"',
      'Referrer-Policy': 'Add Referrer-Policy header: "Referrer-Policy: strict-origin-when-cross-origin"',
    };

    return {
      passed: present.length > 0,
      score,
      issues: [
        {
          pageId: null,
          ruleId: this.id,
          severity: missing.length > 3 ? 'critical' : 'warning',
          message: `Missing security headers: ${missing.join(', ')}`,
          recommendation: missing.map(h => recommendations[h]).join(' | '),
          metadata: { present, missing },
        },
      ],
    };
  }
}

