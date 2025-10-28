import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-success'
  if (score >= 50) return 'text-warning'
  return 'text-error'
}

export function getScoreGrade(score: number): string {
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'F'
}

export function getSeverityBadgeClass(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'critical':
      return 'badge-error'
    case 'warning':
      return 'badge-warning'
    case 'info':
      return 'badge-info'
    default:
      return 'badge-info'
  }
}

