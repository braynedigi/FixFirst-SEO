/**
 * Normalize a URL by ensuring it has a protocol and cleaning up trailing slashes
 */
export function normalizeUrl(url: string): string {
  let normalized = url.trim();
  
  // Add protocol if missing
  if (!normalized.match(/^https?:\/\//i)) {
    normalized = 'https://' + normalized;
  }
  
  try {
    const urlObj = new URL(normalized);
    // Remove trailing slash from pathname unless it's the root
    if (urlObj.pathname !== '/' && urlObj.pathname.endsWith('/')) {
      urlObj.pathname = urlObj.pathname.slice(0, -1);
    }
    return urlObj.toString();
  } catch (error) {
    throw new Error(`Invalid URL: ${url}`);
  }
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(normalizeUrl(url));
    return urlObj.hostname;
  } catch (error) {
    throw new Error(`Cannot extract domain from: ${url}`);
  }
}

/**
 * Check if a URL belongs to the same domain
 */
export function isSameDomain(url1: string, url2: string): boolean {
  try {
    return extractDomain(url1) === extractDomain(url2);
  } catch {
    return false;
  }
}

/**
 * Check if URL is valid
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(normalizeUrl(url));
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract pathname from URL
 */
export function extractPathname(url: string): string {
  try {
    const urlObj = new URL(normalizeUrl(url));
    return urlObj.pathname;
  } catch {
    return '';
  }
}

