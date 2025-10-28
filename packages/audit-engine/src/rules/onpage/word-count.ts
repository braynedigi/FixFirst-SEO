import { IAuditRule, AuditRuleContext, RuleCheckResult } from '@seo-audit/shared';
import { parseHtml } from '../../crawler';

export class WordCountRule implements IAuditRule {
  id = 'onpage-word-count';
  category = 'onpage' as const;
  name = 'Content Length';
  description = 'Check that page has at least 300 words of content';
  weight = 3;

  async check(context: AuditRuleContext): Promise<RuleCheckResult> {
    const { page } = context;
    const $ = parseHtml(page.html);
    
    // Remove script and style tags
    $('script, style, nav, footer, header').remove();
    
    // Get main content text
    const text = $('body').text();
    const words = text
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .filter(word => word.length > 0);
    
    const wordCount = words.length;

    if (wordCount < 300) {
      return {
        passed: false,
        score: 0,
        issues: [
          {
            pageId: null,
            ruleId: this.id,
            severity: 'warning',
            message: `Page has insufficient content (${wordCount} words)`,
            recommendation: 'Add more content to your page. Aim for at least 300 words. Quality content helps with SEO and provides value to visitors.',
            metadata: { wordCount },
          },
        ],
      };
    }

    if (wordCount < 500) {
      return {
        passed: true,
        score: this.weight * 0.7,
        issues: [
          {
            pageId: null,
            ruleId: this.id,
            severity: 'info',
            message: `Page has minimal content (${wordCount} words)`,
            recommendation: 'Consider adding more content. Pages with 500+ words typically perform better in search rankings.',
            metadata: { wordCount },
          },
        ],
      };
    }

    return {
      passed: true,
      score: this.weight,
      issues: [],
    };
  }
}

