/**
 * Custom Rule Engine
 * 
 * Evaluates custom user-defined rules against audit data
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface RuleCondition {
  field: string; // Field to check (e.g., "meta.title.length", "performance.score", "images.count")
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains' | 'exists' | 'not_exists';
  value: any; // Value to compare against
}

interface RuleConditionGroup {
  logic: 'AND' | 'OR';
  conditions: (RuleCondition | RuleConditionGroup)[];
}

export class RuleEngine {
  /**
   * Evaluate all active rules for a project against audit data
   */
  static async evaluateProjectRules(projectId: string, auditId: string, auditData: any) {
    // Get all active rules for this project (including global rules)
    const projectRules = await prisma.projectRule.findMany({
      where: {
        projectId,
        enabled: true,
        rule: { enabled: true },
      },
      include: {
        rule: true,
      },
    });

    const globalRules = await prisma.customRule.findMany({
      where: {
        global: true,
        enabled: true,
      },
    });

    // Combine rules
    const allRules = [
      ...projectRules.map(pr => pr.rule),
      ...globalRules,
    ];

    // Evaluate each rule
    const violations = [];
    for (const rule of allRules) {
      const result = await this.evaluateRule(rule, auditData);
      if (!result.passed) {
        violations.push({
          auditId,
          ruleId: rule.id,
          message: rule.message,
          severity: rule.severity,
          details: result.details,
        });
      }
    }

    // Save violations to database
    if (violations.length > 0) {
      await prisma.ruleViolation.createMany({
        data: violations,
      });
    }

    return violations;
  }

  /**
   * Evaluate a single rule against audit data
   */
  static async evaluateRule(rule: any, auditData: any): Promise<{ passed: boolean; details?: any }> {
    try {
      const condition = rule.condition as RuleConditionGroup;
      const passed = this.evaluateConditionGroup(condition, auditData);
      
      return {
        passed,
        details: {
          ruleName: rule.name,
          condition: condition,
          evaluatedAt: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      console.error(`Error evaluating rule ${rule.id}:`, error);
      return {
        passed: true, // Pass on error to avoid false positives
        details: {
          error: error.message,
        },
      };
    }
  }

  /**
   * Evaluate a condition group (AND/OR logic)
   */
  private static evaluateConditionGroup(group: RuleConditionGroup, data: any): boolean {
    if (!group.conditions || group.conditions.length === 0) {
      return true;
    }

    const results = group.conditions.map(condition => {
      if ('logic' in condition) {
        // Nested condition group
        return this.evaluateConditionGroup(condition as RuleConditionGroup, data);
      } else {
        // Single condition
        return this.evaluateCondition(condition as RuleCondition, data);
      }
    });

    if (group.logic === 'AND') {
      return results.every(r => r);
    } else {
      return results.some(r => r);
    }
  }

  /**
   * Evaluate a single condition
   */
  private static evaluateCondition(condition: RuleCondition, data: any): boolean {
    const fieldValue = this.getNestedValue(data, condition.field);

    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      
      case 'not_equals':
        return fieldValue !== condition.value;
      
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value);
      
      case 'less_than':
        return Number(fieldValue) < Number(condition.value);
      
      case 'contains':
        if (typeof fieldValue === 'string') {
          return fieldValue.includes(condition.value);
        }
        if (Array.isArray(fieldValue)) {
          return fieldValue.includes(condition.value);
        }
        return false;
      
      case 'not_contains':
        if (typeof fieldValue === 'string') {
          return !fieldValue.includes(condition.value);
        }
        if (Array.isArray(fieldValue)) {
          return !fieldValue.includes(condition.value);
        }
        return true;
      
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null;
      
      case 'not_exists':
        return fieldValue === undefined || fieldValue === null;
      
      default:
        console.warn(`Unknown operator: ${condition.operator}`);
        return true;
    }
  }

  /**
   * Get nested object value by dot notation path
   */
  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current?.[key];
    }, obj);
  }

  /**
   * Test a rule against sample data (for rule builder)
   */
  static async testRule(condition: RuleConditionGroup, sampleData: any) {
    try {
      const passed = this.evaluateConditionGroup(condition, sampleData);
      return {
        success: true,
        passed,
        message: passed ? 'Rule condition passed' : 'Rule condition failed',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get available fields for rule building based on audit structure
   */
  static getAvailableFields() {
    return {
      'meta.title': { type: 'string', description: 'Page title' },
      'meta.title.length': { type: 'number', description: 'Page title length' },
      'meta.description': { type: 'string', description: 'Meta description' },
      'meta.description.length': { type: 'number', description: 'Meta description length' },
      'meta.keywords': { type: 'array', description: 'Meta keywords' },
      'performance.score': { type: 'number', description: 'Performance score (0-100)' },
      'performance.fcp': { type: 'number', description: 'First Contentful Paint (ms)' },
      'performance.lcp': { type: 'number', description: 'Largest Contentful Paint (ms)' },
      'performance.cls': { type: 'number', description: 'Cumulative Layout Shift' },
      'performance.tti': { type: 'number', description: 'Time to Interactive (ms)' },
      'accessibility.score': { type: 'number', description: 'Accessibility score (0-100)' },
      'seo.score': { type: 'number', description: 'SEO score (0-100)' },
      'images.count': { type: 'number', description: 'Number of images' },
      'images.missingAlt': { type: 'number', description: 'Images without alt text' },
      'links.internal': { type: 'number', description: 'Internal links count' },
      'links.external': { type: 'number', description: 'External links count' },
      'links.broken': { type: 'number', description: 'Broken links count' },
      'content.headings.h1': { type: 'number', description: 'H1 heading count' },
      'content.wordCount': { type: 'number', description: 'Total word count' },
      'mobile.friendly': { type: 'boolean', description: 'Mobile friendly' },
      'https.enabled': { type: 'boolean', description: 'HTTPS enabled' },
      'structuredData.present': { type: 'boolean', description: 'Structured data present' },
    };
  }
}

export default RuleEngine;

