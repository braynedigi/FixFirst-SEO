import { IAuditRule, AuditRuleContext, RuleCheckResult } from '@seo-audit/shared';

export class LinksRule implements IAuditRule {
  id = 'onpage-links';
  category = 'onpage' as const;
  name = 'Internal/External Links';
  description = 'Analyze link structure and check for broken links';
  weight = 3;

  async check(context: AuditRuleContext): Promise<RuleCheckResult> {
    const { page } = context;
    
    const internalLinks = page.internalLinks.length;
    const externalLinks = page.externalLinks.length;
    const totalLinks = internalLinks + externalLinks;

    const issues = [];

    if (totalLinks === 0) {
      return {
        passed: false,
        score: 0,
        issues: [
          {
            pageId: null,
            ruleId: this.id,
            severity: 'warning',
            message: 'No links found on the page',
            recommendation: 'Add internal and external links. Internal links help with site navigation and SEO. External links to authoritative sources add value.',
            metadata: {},
          },
        ],
      };
    }

    if (internalLinks < 3) {
      issues.push({
        pageId: null,
        ruleId: this.id,
        severity: 'info' as const,
        message: `Low number of internal links (${internalLinks})`,
        recommendation: 'Add more internal links to related pages on your site. This improves site navigation and helps distribute page authority.',
        metadata: { internalLinks },
      });
    }

    if (externalLinks === 0) {
      issues.push({
        pageId: null,
        ruleId: this.id,
        severity: 'info' as const,
        message: 'No external links found',
        recommendation: 'Consider adding external links to authoritative sources. This can add credibility and value to your content.',
        metadata: {},
      });
    }

    // Calculate score based on link presence
    let score = this.weight;
    if (internalLinks === 0) score *= 0.3;
    else if (internalLinks < 3) score *= 0.7;

    return {
      passed: internalLinks >= 3,
      score: Math.round(score),
      issues,
    };
  }
}

