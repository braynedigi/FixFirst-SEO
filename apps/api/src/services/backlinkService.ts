/**
 * Backlink Monitoring Service
 * 
 * Tracks backlinks, monitors changes, and analyzes link quality
 */

import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import * as cheerio from 'cheerio';

const prisma = new PrismaClient();

export class BacklinkService {
  /**
   * Check backlinks for a URL
   * Note: In production, you'd integrate with APIs like:
   * - Moz Link Explorer
   * - Ahrefs API
   * - SEMrush Backlink Analytics
   * - Majestic SEO
   * 
   * This is a simplified version that checks for basic backlink presence
   */
  static async checkBacklinks(projectId: string, targetUrl: string) {
    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new Error('Project not found');
      }

      // In a real implementation, you would call a backlink API here
      // For now, we'll create a mock implementation
      const backlinks = await this.mockBacklinkCheck(targetUrl);

      // Update or create backlinks
      for (const backlink of backlinks) {
        const existing = await prisma.backlink.findFirst({
          where: {
            projectId,
            sourceUrl: backlink.sourceUrl,
          },
        });

        if (existing) {
          await prisma.backlink.update({
            where: { id: existing.id },
            data: {
              status: 'ACTIVE',
              lastSeen: new Date(),
              lastChecked: new Date(),
              anchorText: backlink.anchorText,
              rel: backlink.rel,
              domainAuthority: backlink.domainAuthority,
              pageAuthority: backlink.pageAuthority,
            },
          });
        } else {
          await prisma.backlink.create({
            data: {
              projectId,
              sourceUrl: backlink.sourceUrl,
              sourceDomain: backlink.sourceDomain,
              targetUrl,
              anchorText: backlink.anchorText,
              rel: backlink.rel,
              type: backlink.type,
              domainAuthority: backlink.domainAuthority,
              pageAuthority: backlink.pageAuthority,
              spamScore: backlink.spamScore,
            },
          });
        }
      }

      return backlinks;
    } catch (error) {
      console.error('Error checking backlinks:', error);
      throw error;
    }
  }

  /**
   * Mock backlink checker (replace with real API in production)
   */
  private static async mockBacklinkCheck(targetUrl: string) {
    // Simulate API response
    return [
      {
        sourceUrl: 'https://example.com/blog/seo-tips',
        sourceDomain: 'example.com',
        anchorText: 'SEO best practices',
        rel: 'dofollow',
        type: 'EXTERNAL' as const,
        domainAuthority: 65,
        pageAuthority: 58,
        spamScore: 12,
      },
      {
        sourceUrl: 'https://marketing-blog.net/resources',
        sourceDomain: 'marketing-blog.net',
        anchorText: 'click here',
        rel: 'nofollow',
        type: 'EXTERNAL' as const,
        domainAuthority: 42,
        pageAuthority: 38,
        spamScore: 25,
      },
    ];
  }

  /**
   * Get all backlinks for a project
   */
  static async getBacklinks(projectId: string, filters?: {
    status?: string;
    type?: string;
    minDA?: number;
    maxSpamScore?: number;
  }) {
    const where: any = { projectId };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.minDA) {
      where.domainAuthority = { gte: filters.minDA };
    }

    if (filters?.maxSpamScore) {
      where.spamScore = { lte: filters.maxSpamScore };
    }

    return await prisma.backlink.findMany({
      where,
      orderBy: [
        { domainAuthority: 'desc' },
        { lastSeen: 'desc' },
      ],
    });
  }

  /**
   * Get backlink statistics for a project
   */
  static async getBacklinkStats(projectId: string) {
    const [
      total,
      active,
      lost,
      broken,
      nofollow,
      avgDA,
      avgPA,
      avgSpamScore,
      topDomains,
    ] = await Promise.all([
      prisma.backlink.count({ where: { projectId } }),
      prisma.backlink.count({ where: { projectId, status: 'ACTIVE' } }),
      prisma.backlink.count({ where: { projectId, status: 'LOST' } }),
      prisma.backlink.count({ where: { projectId, status: 'BROKEN' } }),
      prisma.backlink.count({ where: { projectId, rel: 'nofollow' } }),
      
      prisma.backlink.aggregate({
        where: { projectId, domainAuthority: { not: null } },
        _avg: { domainAuthority: true },
      }),
      
      prisma.backlink.aggregate({
        where: { projectId, pageAuthority: { not: null } },
        _avg: { pageAuthority: true },
      }),
      
      prisma.backlink.aggregate({
        where: { projectId, spamScore: { not: null } },
        _avg: { spamScore: true },
      }),
      
      prisma.backlink.groupBy({
        by: ['sourceDomain'],
        where: { projectId },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      total,
      active,
      lost,
      broken,
      nofollow,
      dofollow: total - nofollow,
      avgDomainAuthority: Math.round(avgDA._avg.domainAuthority || 0),
      avgPageAuthority: Math.round(avgPA._avg.pageAuthority || 0),
      avgSpamScore: Math.round(avgSpamScore._avg.spamScore || 0),
      topDomains: topDomains.map(d => ({
        domain: d.sourceDomain,
        count: d._count.id,
      })),
    };
  }

  /**
   * Create a backlink monitor
   */
  static async createMonitor(projectId: string, data: {
    name: string;
    targetUrl: string;
    checkFrequency?: string;
  }) {
    return await prisma.backlinkMonitor.create({
      data: {
        projectId,
        name: data.name,
        targetUrl: data.targetUrl,
        checkFrequency: data.checkFrequency || 'daily',
      },
    });
  }

  /**
   * Get monitors for a project
   */
  static async getMonitors(projectId: string) {
    return await prisma.backlinkMonitor.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update monitor
   */
  static async updateMonitor(id: string, data: {
    name?: string;
    enabled?: boolean;
    checkFrequency?: string;
  }) {
    return await prisma.backlinkMonitor.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete monitor
   */
  static async deleteMonitor(id: string) {
    return await prisma.backlinkMonitor.delete({
      where: { id },
    });
  }

  /**
   * Run monitor check
   */
  static async runMonitorCheck(monitorId: string) {
    const monitor = await prisma.backlinkMonitor.findUnique({
      where: { id: monitorId },
    });

    if (!monitor) {
      throw new Error('Monitor not found');
    }

    // Get current backlinks
    const currentBacklinks = await prisma.backlink.findMany({
      where: {
        projectId: monitor.projectId,
        targetUrl: monitor.targetUrl,
        status: 'ACTIVE',
      },
    });

    const currentCount = currentBacklinks.length;

    // Check for new backlinks
    const newBacklinks = await this.checkBacklinks(monitor.projectId, monitor.targetUrl);

    // Calculate changes
    const newCount = newBacklinks.length;
    const gained = Math.max(0, newCount - currentCount);
    const lost = Math.max(0, currentCount - newCount);

    // Update monitor
    await prisma.backlinkMonitor.update({
      where: { id: monitorId },
      data: {
        lastChecked: new Date(),
        totalBacklinks: newCount,
        newBacklinks: gained,
        lostBacklinks: lost,
      },
    });

    return {
      monitor,
      totalBacklinks: newCount,
      newBacklinks: gained,
      lostBacklinks: lost,
    };
  }

  /**
   * Get backlink trends over time
   */
  static async getBacklinkTrends(projectId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const backlinks = await prisma.backlink.findMany({
      where: {
        projectId,
        firstSeen: { gte: startDate },
      },
      orderBy: { firstSeen: 'asc' },
    });

    // Group by day
    const trends: Record<string, number> = {};
    backlinks.forEach(backlink => {
      const day = backlink.firstSeen.toISOString().split('T')[0];
      trends[day] = (trends[day] || 0) + 1;
    });

    return Object.keys(trends).map(date => ({
      date,
      count: trends[date],
    }));
  }

  /**
   * Analyze backlink quality
   */
  static async analyzeBacklinkQuality(projectId: string) {
    const backlinks = await prisma.backlink.findMany({
      where: { projectId, status: 'ACTIVE' },
    });

    const highQuality = backlinks.filter(b => 
      (b.domainAuthority || 0) >= 50 && (b.spamScore || 0) <= 20
    );

    const mediumQuality = backlinks.filter(b => 
      ((b.domainAuthority || 0) >= 30 && (b.domainAuthority || 0) < 50) ||
      ((b.spamScore || 0) > 20 && (b.spamScore || 0) <= 40)
    );

    const lowQuality = backlinks.filter(b => 
      (b.domainAuthority || 0) < 30 || (b.spamScore || 0) > 40
    );

    return {
      high: highQuality.length,
      medium: mediumQuality.length,
      low: lowQuality.length,
      total: backlinks.length,
      percentageHigh: Math.round((highQuality.length / backlinks.length) * 100) || 0,
      percentageMedium: Math.round((mediumQuality.length / backlinks.length) * 100) || 0,
      percentageLow: Math.round((lowQuality.length / backlinks.length) * 100) || 0,
    };
  }
}

export default BacklinkService;

