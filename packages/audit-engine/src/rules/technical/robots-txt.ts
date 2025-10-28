import { IAuditRule, AuditRuleContext, RuleCheckResult } from '@seo-audit/shared';
import axios from 'axios';

export class RobotsTxtRule implements IAuditRule {
  id = 'tech-robots-txt';
  category = 'technical' as const;
  name = 'Robots.txt';
  description = 'Verify robots.txt file exists and is properly configured';
  weight = 3;

  async check(context: AuditRuleContext): Promise<RuleCheckResult> {
    const { page } = context;
    const url = new URL(page.finalUrl);
    const robotsUrl = `${url.protocol}//${url.host}/robots.txt`;

    try {
      const response = await axios.get(robotsUrl, {
        timeout: 10000,
        validateStatus: (status) => status < 500,
      });

      if (response.status === 404) {
        return {
          passed: false,
          score: 0,
          issues: [
            {
              pageId: null,
              ruleId: this.id,
              severity: 'warning',
              message: 'robots.txt file not found',
              recommendation: 'Create a robots.txt file in your website root to control search engine crawling. At minimum, include your sitemap: "Sitemap: https://example.com/sitemap.xml"',
              metadata: { robotsUrl },
            },
          ],
        };
      }

      const content = response.data;
      
      // Check if it disallows everything
      if (content.includes('Disallow: /') && !content.includes('Allow:')) {
        return {
          passed: false,
          score: 0,
          issues: [
            {
              pageId: null,
              ruleId: this.id,
              severity: 'critical',
              message: 'robots.txt blocks all crawlers',
              recommendation: 'Your robots.txt file blocks all search engines from crawling your site. Remove or modify "Disallow: /" to allow crawling.',
              metadata: { robotsUrl },
            },
          ],
        };
      }

      // Check for sitemap reference
      const hasSitemap = content.toLowerCase().includes('sitemap:');
      
      return {
        passed: true,
        score: this.weight,
        issues: hasSitemap ? [] : [
          {
            pageId: null,
            ruleId: this.id,
            severity: 'info',
            message: 'robots.txt found but no sitemap reference',
            recommendation: 'Add a sitemap reference to your robots.txt file: "Sitemap: https://example.com/sitemap.xml"',
            metadata: { robotsUrl },
          },
        ],
      };
    } catch (error) {
      return {
        passed: false,
        score: 0,
        issues: [
          {
            pageId: null,
            ruleId: this.id,
            severity: 'warning',
            message: 'Could not access robots.txt',
            recommendation: 'Ensure your robots.txt file is accessible. Check server configuration and permissions.',
            metadata: { robotsUrl, error: (error as Error).message },
          },
        ],
      };
    }
  }
}

