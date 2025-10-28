import { chromium, Browser, Page } from 'playwright';
import { CrawlResult, ResourceInfo } from '@seo-audit/shared';
import { normalizeUrl, extractDomain } from '@seo-audit/shared';
import * as cheerio from 'cheerio';

export class WebCrawler {
  private browser: Browser | null = null;

  async initialize(): Promise<void> {
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Crawl a single page and extract all relevant data
   */
  async crawlPage(url: string, takeScreenshot: boolean = false): Promise<CrawlResult> {
    if (!this.browser) {
      await this.initialize();
    }

    const page = await this.browser!.newPage();
    const startTime = Date.now();
    const resources: ResourceInfo[] = [];
    const consoleErrors: string[] = [];

    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Track resources
    page.on('response', async (response) => {
      const url = response.url();
      const resourceType = response.request().resourceType();
      
      try {
        const headers = response.headers();
        const contentLength = headers['content-length'];
        const size = contentLength ? parseInt(contentLength, 10) : 0;

        let type: ResourceInfo['type'] = 'other';
        if (resourceType === 'image') type = 'image';
        else if (resourceType === 'script') type = 'script';
        else if (resourceType === 'stylesheet') type = 'stylesheet';
        else if (resourceType === 'font') type = 'font';

        resources.push({ type, url, size });
      } catch (error) {
        // Ignore errors in response tracking
      }
    });

    try {
      // Navigate to the URL
      const response = await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      const loadTime = Date.now() - startTime;
      const statusCode = response?.status() || 0;
      const headers: Record<string, string> = {};
      
      if (response) {
        const responseHeaders = response.headers();
        Object.keys(responseHeaders).forEach((key) => {
          headers[key] = responseHeaders[key];
        });
      }

      // Get HTML content
      const html = await page.content();
      const pageSize = Buffer.byteLength(html, 'utf8');

      // Take screenshot if requested
      let screenshot: Buffer | undefined;
      if (takeScreenshot) {
        screenshot = await page.screenshot({ fullPage: false });
      }

      // Extract links and JSON-LD
      const { internalLinks, externalLinks, jsonLdData } = await this.extractPageData(
        page,
        url
      );

      await page.close();

      return {
        url,
        finalUrl: page.url(),
        statusCode,
        headers,
        html,
        loadTime,
        pageSize,
        screenshot,
        resources,
        internalLinks,
        externalLinks,
        jsonLdData,
        consoleErrors,
      };
    } catch (error: any) {
      await page.close();
      throw new Error(`Failed to crawl ${url}: ${error.message}`);
    }
  }

  /**
   * Crawl multiple pages (breadth-first)
   */
  async crawlWebsite(
    startUrl: string,
    maxPages: number = 25
  ): Promise<CrawlResult[]> {
    const normalizedStartUrl = normalizeUrl(startUrl);
    const visited = new Set<string>();
    const queue: string[] = [normalizedStartUrl];
    const results: CrawlResult[] = [];

    while (queue.length > 0 && results.length < maxPages) {
      const currentUrl = queue.shift()!;
      
      if (visited.has(currentUrl)) continue;
      visited.add(currentUrl);

      try {
        console.log(`Crawling: ${currentUrl} (${results.length + 1}/${maxPages})`);
        const result = await this.crawlPage(currentUrl, results.length === 0);
        results.push(result);

        // Add internal links to queue
        for (const link of result.internalLinks) {
          if (!visited.has(link) && !queue.includes(link) && results.length + queue.length < maxPages) {
            queue.push(link);
          }
        }
      } catch (error: any) {
        console.error(`Error crawling ${currentUrl}:`, error.message);
      }
    }

    return results;
  }

  /**
   * Extract links and structured data from page
   */
  private async extractPageData(
    page: Page,
    baseUrl: string
  ): Promise<{
    internalLinks: string[];
    externalLinks: string[];
    jsonLdData: any[];
  }> {
    const domain = extractDomain(baseUrl);

    const data = await page.evaluate((currentDomain: string) => {
      const internal: string[] = [];
      const external: string[] = [];
      const jsonLd: any[] = [];

      // Extract links
      const links = document.querySelectorAll('a[href]');
      links.forEach((link: Element) => {
        const href = (link as HTMLAnchorElement).href;
        if (href && href.startsWith('http')) {
          try {
            const url = new URL(href);
            if (url.hostname === currentDomain) {
              internal.push(href);
            } else {
              external.push(href);
            }
          } catch (e) {
            // Invalid URL
          }
        }
      });

      // Extract JSON-LD
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      scripts.forEach((script: Element) => {
        try {
          const data = JSON.parse(script.textContent || '{}');
          jsonLd.push(data);
        } catch (e) {
          // Invalid JSON
        }
      });

      return { internal, external, jsonLd };
    }, domain);

    return {
      internalLinks: [...new Set(data.internal)].slice(0, 50),
      externalLinks: [...new Set(data.external)].slice(0, 50),
      jsonLdData: data.jsonLd,
    };
  }
}

/**
 * Helper function to parse HTML with Cheerio
 */
export function parseHtml(html: string) {
  return cheerio.load(html);
}

