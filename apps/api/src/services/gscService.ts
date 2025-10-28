/**
 * Google Search Console API Service
 * 
 * This service provides methods to interact with Google Search Console API
 * to fetch keyword rankings, search analytics, and performance data.
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to https://console.cloud.google.com/
 * 2. Create a new project or select existing one
 * 3. Enable "Google Search Console API"
 * 4. Create OAuth 2.0 credentials (Web application)
 * 5. Add authorized redirect URI: http://localhost:3001/api/gsc/callback
 * 6. Download credentials JSON and set environment variables:
 *    - GSC_CLIENT_ID
 *    - GSC_CLIENT_SECRET
 *    - GSC_REDIRECT_URI
 */

import { google } from 'googleapis';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const oauth2Client = new google.auth.OAuth2(
  process.env.GSC_CLIENT_ID,
  process.env.GSC_CLIENT_SECRET,
  process.env.GSC_REDIRECT_URI || 'http://localhost:3001/api/gsc/callback'
);

// Check if GSC is configured
const isConfigured = !!(
  process.env.GSC_CLIENT_ID &&
  process.env.GSC_CLIENT_SECRET
);

if (!isConfigured) {
  console.warn('⚠️  Google Search Console API not configured.');
  console.warn('   Keyword tracking will be limited. Set GSC_CLIENT_ID and GSC_CLIENT_SECRET to enable.');
}

export class GSCService {
  /**
   * Generate authorization URL for OAuth flow
   */
  static getAuthUrl(userId: string): string {
    if (!isConfigured) {
      throw new Error('GSC not configured. Please set GSC_CLIENT_ID and GSC_CLIENT_SECRET.');
    }

    const scopes = [
      'https://www.googleapis.com/auth/webmasters.readonly',
    ];

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: userId, // Pass userId to link tokens later
      prompt: 'consent', // Force consent screen to get refresh token
    });
  }

  /**
   * Exchange authorization code for tokens and store them
   */
  static async handleCallback(code: string, userId: string) {
    if (!isConfigured) {
      throw new Error('GSC not configured');
    }

    try {
      const { tokens } = await oauth2Client.getToken(code);
      
      // Store tokens in database (in SystemSettings or User model)
      await prisma.systemSettings.upsert({
        where: { key: `gsc_tokens_${userId}` },
        update: {
          value: JSON.stringify({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expiry_date: tokens.expiry_date,
          }),
        },
        create: {
          key: `gsc_tokens_${userId}`,
          value: JSON.stringify({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expiry_date: tokens.expiry_date,
          }),
        },
      });

      return tokens;
    } catch (error) {
      console.error('Error exchanging GSC code for tokens:', error);
      throw error;
    }
  }

  /**
   * Get authenticated GSC client for a user
   */
  private static async getAuthenticatedClient(userId: string) {
    if (!isConfigured) {
      return null;
    }

    try {
      // Retrieve tokens from database
      const setting = await prisma.systemSettings.findUnique({
        where: { key: `gsc_tokens_${userId}` },
      });

      if (!setting || !setting.value) {
        return null;
      }

      const tokens = JSON.parse(setting.value as string);
      oauth2Client.setCredentials(tokens);

      // Check if token needs refresh
      if (tokens.expiry_date && Date.now() >= tokens.expiry_date) {
        const { credentials } = await oauth2Client.refreshAccessToken();
        oauth2Client.setCredentials(credentials);

        // Update tokens in database
        await prisma.systemSettings.update({
          where: { key: `gsc_tokens_${userId}` },
          data: {
            value: JSON.stringify(credentials),
          },
        });
      }

      return google.webmasters({ version: 'v3', auth: oauth2Client });
    } catch (error) {
      console.error('Error getting authenticated GSC client:', error);
      return null;
    }
  }

  /**
   * List all sites/properties available in GSC for a user
   */
  static async listSites(userId: string) {
    const client = await this.getAuthenticatedClient(userId);
    if (!client) {
      throw new Error('GSC not authenticated. Please connect your Google Search Console account.');
    }

    try {
      const response = await client.sites.list({});
      return response.data.siteEntry || [];
    } catch (error: any) {
      console.error('Error listing GSC sites:', error);
      throw new Error(`Failed to list sites: ${error.message}`);
    }
  }

  /**
   * Fetch search analytics data for keywords
   * @param siteUrl - The property URL (e.g., https://example.com/)
   * @param startDate - Start date in YYYY-MM-DD format
   * @param endDate - End date in YYYY-MM-DD format
   * @param keywords - Optional array of specific keywords to fetch
   */
  static async getSearchAnalytics(
    userId: string,
    siteUrl: string,
    startDate: string,
    endDate: string,
    keywords?: string[]
  ) {
    const client = await this.getAuthenticatedClient(userId);
    if (!client) {
      throw new Error('GSC not authenticated');
    }

    try {
      const requestBody: any = {
        startDate,
        endDate,
        dimensions: ['query', 'page', 'device'],
        rowLimit: keywords ? 1000 : 25000, // Max rows
      };

      // If specific keywords provided, filter by them
      if (keywords && keywords.length > 0) {
        requestBody.dimensionFilterGroups = [
          {
            filters: keywords.map(keyword => ({
              dimension: 'query',
              operator: 'equals',
              expression: keyword,
            })),
          },
        ];
      }

      const response = await client.searchanalytics.query({
        siteUrl,
        requestBody,
      });

      return response.data.rows || [];
    } catch (error: any) {
      console.error('Error fetching GSC analytics:', error);
      throw new Error(`Failed to fetch analytics: ${error.message}`);
    }
  }

  /**
   * Get top keywords for a site from GSC
   */
  static async getTopKeywords(
    userId: string,
    siteUrl: string,
    limit: number = 100
  ) {
    const client = await this.getAuthenticatedClient(userId);
    if (!client) {
      throw new Error('GSC not authenticated');
    }

    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 28); // Last 28 days

      const response = await client.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          dimensions: ['query'],
          rowLimit: limit,
        },
      });

      return (response.data.rows || []).map((row: any) => ({
        keyword: row.keys[0],
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: Math.round(row.position),
      }));
    } catch (error: any) {
      console.error('Error fetching top keywords:', error);
      throw new Error(`Failed to fetch top keywords: ${error.message}`);
    }
  }

  /**
   * Get ranking data for specific keywords
   */
  static async getKeywordRankings(
    userId: string,
    siteUrl: string,
    keywords: string[]
  ) {
    if (!keywords || keywords.length === 0) {
      return [];
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7); // Last 7 days

    const analyticsData = await this.getSearchAnalytics(
      userId,
      siteUrl,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0],
      keywords
    );

    // Process and aggregate data by keyword
    const keywordMap = new Map<string, any>();

    analyticsData.forEach((row: any) => {
      const [query, page, device] = row.keys;
      const existing = keywordMap.get(query) || {
        keyword: query,
        positions: [],
        clicks: 0,
        impressions: 0,
        urls: new Set(),
      };

      existing.positions.push(row.position);
      existing.clicks += row.clicks || 0;
      existing.impressions += row.impressions || 0;
      existing.urls.add(page);

      keywordMap.set(query, existing);
    });

    // Calculate average position for each keyword
    return Array.from(keywordMap.values()).map(data => ({
      keyword: data.keyword,
      position: data.positions.length > 0
        ? Math.round(data.positions.reduce((a: number, b: number) => a + b, 0) / data.positions.length)
        : null,
      clicks: data.clicks,
      impressions: data.impressions,
      ctr: data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0,
      url: Array.from(data.urls)[0], // Primary ranking URL
    }));
  }

  /**
   * Check if user has GSC connected
   */
  static async isConnected(userId: string): Promise<boolean> {
    if (!isConfigured) {
      return false;
    }

    try {
      const setting = await prisma.systemSettings.findUnique({
        where: { key: `gsc_tokens_${userId}` },
      });

      return !!setting && !!setting.value;
    } catch (error) {
      return false;
    }
  }

  /**
   * Disconnect GSC (remove tokens)
   */
  static async disconnect(userId: string) {
    try {
      await prisma.systemSettings.deleteMany({
        where: { key: `gsc_tokens_${userId}` },
      });
      return true;
    } catch (error) {
      console.error('Error disconnecting GSC:', error);
      return false;
    }
  }
}

export default GSCService;

