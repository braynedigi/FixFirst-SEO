import { IAuditRule, AuditRuleContext, RuleCheckResult } from '@seo-audit/shared';
import { parseHtml } from '../../crawler';

export class ImageAltTextRule implements IAuditRule {
  id = 'onpage-images-alt';
  category = 'onpage' as const;
  name = 'Image Alt Text';
  description = 'Verify all images have alt text attributes';
  weight = 3;

  async check(context: AuditRuleContext): Promise<RuleCheckResult> {
    const { page } = context;
    const $ = parseHtml(page.html);
    const images = $('img');
    const totalImages = images.length;

    if (totalImages === 0) {
      return {
        passed: true,
        score: this.weight,
        issues: [],
      };
    }

    const imagesWithoutAlt: string[] = [];
    images.each((_, el) => {
      const alt = $(el).attr('alt');
      const src = $(el).attr('src');
      if (alt === undefined) {
        imagesWithoutAlt.push(src || 'unknown');
      }
    });

    const coverage = ((totalImages - imagesWithoutAlt.length) / totalImages) * 100;

    if (imagesWithoutAlt.length === 0) {
      return {
        passed: true,
        score: this.weight,
        issues: [],
      };
    }

    const score = Math.round((coverage / 100) * this.weight);
    const severity = coverage < 50 ? 'warning' : 'info';

    return {
      passed: coverage >= 80,
      score,
      issues: [
        {
          pageId: null,
          ruleId: this.id,
          severity,
          message: `${imagesWithoutAlt.length} of ${totalImages} images missing alt text (${Math.round(coverage)}% coverage)`,
          recommendation: 'Add descriptive alt text to all images. Alt text improves accessibility and helps search engines understand image content. Format: <img src="..." alt="Descriptive text here">',
          metadata: { totalImages, missingAlt: imagesWithoutAlt.length, coverage },
        },
      ],
    };
  }
}

