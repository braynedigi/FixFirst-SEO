import { IAuditRule, AuditRuleContext, RuleCheckResult } from '@seo-audit/shared';
import axios from 'axios';

export class SitemapRule implements IAuditRule {
  id = 'tech-sitemap';
  category = 'technical' as const;
  name = 'XML Sitemap';
  description = 'Check for XML sitemap presence and accessibility';
  weight = 3;

  async check(context: AuditRuleContext): Promise<RuleCheckResult> {
    const { page } = context;
    const url = new URL(page.finalUrl);
    
    // Common sitemap locations
    const sitemapUrls = [
      `${url.protocol}//${url.host}/sitemap.xml`,
      `${url.protocol}//${url.host}/sitemap_index.xml`,
      `${url.protocol}//${url.host}/sitemap`,
    ];

    for (const sitemapUrl of sitemapUrls) {
      try {
        const response = await axios.get(sitemapUrl, {
          timeout: 10000,
          validateStatus: (status) => status < 500,
        });

        if (response.status === 200) {
          const content = response.data;
          
          // Validate it's XML
          if (typeof content === 'string' && content.includes('<?xml')) {
            return {
              passed: true,
              score: this.weight,
              issues: [],
            };
          }
        }
      } catch (error) {
        // Try next URL
      }
    }

    return {
      passed: false,
      score: 0,
      issues: [
        {
          pageId: null,
          ruleId: this.id,
          severity: 'warning',
          message: 'XML sitemap not found',
          recommendation: 'Create an XML sitemap to help search engines discover and index your pages. Place it at /sitemap.xml and reference it in robots.txt. Use tools like Yoast SEO (WordPress) or online generators.',
          metadata: { checkedUrls: sitemapUrls },
        },
      ],
    };
  }
}

