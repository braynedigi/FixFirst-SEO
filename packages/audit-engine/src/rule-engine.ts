import {
  IAuditRule,
  CrawlResult,
  RuleCheckResult,
  AuditRuleContext,
  RuleCategory,
} from '@seo-audit/shared';
import { allRules } from './rules';

export class RuleEngine {
  private rules: Map<string, IAuditRule> = new Map();

  constructor(rules: IAuditRule[] = allRules) {
    rules.forEach((rule) => this.rules.set(rule.id, rule));
  }

  /**
   * Run all active rules against crawled pages
   */
  async runAudit(
    pages: CrawlResult[],
    projectDomain: string
  ): Promise<Map<string, RuleCheckResult>> {
    const results = new Map<string, RuleCheckResult>();
    
    const mainPage = pages[0]; // Primary page
    const context: AuditRuleContext = {
      page: mainPage,
      allPages: pages,
      projectDomain,
    };

    // Run all rules
    for (const [ruleId, rule] of this.rules) {
      try {
        console.log(`Running rule: ${rule.name}`);
        const result = await rule.check(context);
        results.set(ruleId, result);
      } catch (error: any) {
        console.error(`Error running rule ${ruleId}:`, error.message);
        // Return failed result
        results.set(ruleId, {
          passed: false,
          score: 0,
          issues: [
            {
              pageId: null,
              ruleId,
              severity: 'critical',
              message: `Rule execution failed: ${error.message}`,
              recommendation: 'Please contact support if this issue persists.',
              metadata: {},
            },
          ],
        });
      }
    }

    return results;
  }

  /**
   * Get rule by ID
   */
  getRule(ruleId: string): IAuditRule | undefined {
    return this.rules.get(ruleId);
  }

  /**
   * Get all rules
   */
  getAllRules(): IAuditRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get rules by category
   */
  getRulesByCategory(category: RuleCategory): IAuditRule[] {
    return this.getAllRules().filter((rule) => rule.category === category);
  }
}

