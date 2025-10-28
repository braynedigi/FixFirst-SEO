import { RuleCheckResult, RuleCategory } from '../types';

/**
 * Calculate total score from all rule results
 */
export function calculateTotalScore(results: Map<string, RuleCheckResult>): number {
  let totalScore = 0;
  for (const result of results.values()) {
    totalScore += result.score;
  }
  return Math.round(Math.min(100, totalScore));
}

/**
 * Calculate category scores
 */
export function calculateCategoryScores(
  results: Map<string, RuleCheckResult>,
  ruleCategories: Map<string, RuleCategory>,
  categoryWeights: Record<RuleCategory, number>
): Record<RuleCategory, number> {
  const categoryScores: Record<RuleCategory, number> = {
    technical: 0,
    onpage: 0,
    'structured-data': 0,
    performance: 0,
    'local-seo': 0,
  };

  const categoryTotals: Record<RuleCategory, number> = { ...categoryWeights };

  for (const [ruleId, result] of results.entries()) {
    const category = ruleCategories.get(ruleId);
    if (category) {
      categoryScores[category] += result.score;
    }
  }

  // Normalize to percentage based on max possible scores
  for (const category of Object.keys(categoryScores) as RuleCategory[]) {
    const maxScore = categoryTotals[category];
    if (maxScore > 0) {
      categoryScores[category] = Math.round((categoryScores[category] / maxScore) * 100);
    }
  }

  return categoryScores;
}

/**
 * Get severity color class for UI
 */
export function getSeverityColor(severity: 'critical' | 'warning' | 'info'): string {
  switch (severity) {
    case 'critical':
      return 'text-red-500';
    case 'warning':
      return 'text-yellow-500';
    case 'info':
      return 'text-blue-500';
    default:
      return 'text-gray-500';
  }
}

/**
 * Get score color based on value
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-500';
  if (score >= 50) return 'text-yellow-500';
  return 'text-red-500';
}

/**
 * Get score grade (A-F)
 */
export function getScoreGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

