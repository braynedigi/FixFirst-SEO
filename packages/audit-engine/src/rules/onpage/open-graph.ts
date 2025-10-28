import { IAuditRule, AuditRuleContext, RuleCheckResult } from '@seo-audit/shared';
import { parseHtml } from '../../crawler';

export class OpenGraphRule implements IAuditRule {
  id = 'onpage-open-graph';
  category = 'onpage' as const;
  name = 'Open Graph Tags';
  description = 'Check for Open Graph and Twitter Card meta tags';
  weight = 3;

  async check(context: AuditRuleContext): Promise<RuleCheckResult> {
    const { page } = context;
    const $ = parseHtml(page.html);

    const requiredOgTags = ['og:title', 'og:description', 'og:image', 'og:url'];
    const requiredTwitterTags = ['twitter:card', 'twitter:title', 'twitter:description'];

    const presentOgTags: string[] = [];
    const missingOgTags: string[] = [];
    const presentTwitterTags: string[] = [];
    const missingTwitterTags: string[] = [];

    // Check Open Graph tags
    requiredOgTags.forEach((tag) => {
      const exists = $(`meta[property="${tag}"]`).length > 0;
      if (exists) {
        presentOgTags.push(tag);
      } else {
        missingOgTags.push(tag);
      }
    });

    // Check Twitter Card tags
    requiredTwitterTags.forEach((tag) => {
      const exists = $(`meta[name="${tag}"]`).length > 0;
      if (exists) {
        presentTwitterTags.push(tag);
      } else {
        missingTwitterTags.push(tag);
      }
    });

    const ogCoverage = (presentOgTags.length / requiredOgTags.length) * 100;
    const twitterCoverage = (presentTwitterTags.length / requiredTwitterTags.length) * 100;
    const totalCoverage = (ogCoverage + twitterCoverage) / 2;

    const score = Math.round((totalCoverage / 100) * this.weight);

    if (missingOgTags.length === 0 && missingTwitterTags.length === 0) {
      return {
        passed: true,
        score: this.weight,
        issues: [],
      };
    }

    const issues = [];
    
    if (missingOgTags.length > 0) {
      issues.push({
        pageId: null,
        ruleId: this.id,
        severity: 'info' as const,
        message: `Missing Open Graph tags: ${missingOgTags.join(', ')}`,
        recommendation: 'Add Open Graph meta tags to improve social media sharing. Example: <meta property="og:title" content="Your Title">',
        metadata: { missingOgTags },
      });
    }

    if (missingTwitterTags.length > 0) {
      issues.push({
        pageId: null,
        ruleId: this.id,
        severity: 'info' as const,
        message: `Missing Twitter Card tags: ${missingTwitterTags.join(', ')}`,
        recommendation: 'Add Twitter Card meta tags. Example: <meta name="twitter:card" content="summary_large_image">',
        metadata: { missingTwitterTags },
      });
    }

    return {
      passed: totalCoverage >= 70,
      score,
      issues,
    };
  }
}

