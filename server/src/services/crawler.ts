import * as cheerio from 'cheerio';
import robotsParser from 'robots-parser';

export interface CrawledPage {
  url: string;
  title: string;
  content: string;
  type: 'homepage' | 'hiring' | 'about' | 'other';
}

export interface CrawlResult {
  pages: CrawledPage[];
  pagesUsed: string[];
  error?: string;
}

const USER_AGENT = 'AIInterviewPrepKit/1.0 (+https://github.com/trao-candidate/interview-prep)';

/**
 * Validates external URLs.
 * In production, blocks private & loopback IP addresses (SSRF mitigation).
 * In development / test / evaluate, permits local hosts as required by Section 9.
 */
export function isSafeUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    if (process.env.NODE_ENV === 'production') {
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '::1' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('169.254.') ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
      ) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Cleans HTML content, stripping noise, navigation, and boilerplate
 */
export function cleanHtmlText(html: string): { title: string; text: string } {
  const $ = cheerio.load(html);

  // Remove irrelevant elements
  $('script, style, noscript, svg, iframe, nav, footer, header, aside, form, link, meta').remove();

  const title = $('title').text().trim() || $('h1').first().text().trim() || '';

  // Extract meaningful body text
  const paragraphs: string[] = [];
  $('h1, h2, h3, h4, p, li').each((_, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    if (text.length > 20) {
      paragraphs.push(text);
    }
  });

  const fullText = paragraphs.join('\n\n');
  // Truncate to token-friendly budget (~3500 chars)
  return {
    title,
    text: fullText.slice(0, 3500),
  };
}

/**
 * Scores links based on URL path and anchor text keywords
 */
export function scoreLink(urlPath: string, text: string): { score: number; type: 'hiring' | 'about' | 'other' } {
  const normalized = (urlPath + ' ' + text).toLowerCase();

  const hiringKeywords = [
    'careers',
    'jobs',
    'hiring',
    'join',
    'open-roles',
    'openings',
    'positions',
    'handbook',
    'engineering',
    'culture',
    'interview',
    'work-with-us',
    'life-at',
    'people',
  ];

  const aboutKeywords = [
    'about',
    'about-us',
    'company',
    'mission',
    'values',
    'our-story',
    'team',
    'overview',
    'technology',
    'what-we-do',
  ];

  let hiringScore = 0;
  for (const kw of hiringKeywords) {
    if (normalized.includes(kw)) {
      hiringScore += 10;
      if (urlPath.toLowerCase().includes(kw)) hiringScore += 15; // Path match weight
    }
  }

  let aboutScore = 0;
  for (const kw of aboutKeywords) {
    if (normalized.includes(kw)) {
      aboutScore += 8;
      if (urlPath.toLowerCase().includes(kw)) aboutScore += 12;
    }
  }

  if (hiringScore > 0 && hiringScore >= aboutScore) {
    return { score: hiringScore, type: 'hiring' };
  }
  if (aboutScore > 0) {
    return { score: aboutScore, type: 'about' };
  }
  return { score: 0, type: 'other' };
}

/**
 * Crawls a company site starting from company_url, ranks candidate links,
 * and fetches up to top hiring and about pages.
 */
export async function crawlCompanySite(rawUrl: string): Promise<CrawlResult> {
  const pages: CrawledPage[] = [];
  const pagesUsed: string[] = [];

  if (!rawUrl || !isSafeUrl(rawUrl)) {
    return {
      pages,
      pagesUsed,
      error: `Invalid or unsafe company URL: "${rawUrl}"`,
    };
  }

  let baseUrl: URL;
  try {
    baseUrl = new URL(rawUrl);
  } catch {
    return { pages, pagesUsed, error: `Malformed URL: "${rawUrl}"` };
  }

  // 1. Fetch robots.txt with safe fallback
  let robots: ReturnType<typeof robotsParser> | null = null;
  try {
    const robotsUrl = new URL('/robots.txt', baseUrl).toString();
    const res = await fetch(robotsUrl, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(3500),
    });
    if (res.ok) {
      const robotsTxt = await res.text();
      robots = robotsParser(robotsUrl, robotsTxt);
    }
  } catch {
    // If robots.txt times out or doesn't exist, proceed politely
  }

  const isAllowed = (url: string) => {
    if (!robots) return true;
    return robots.isAllowed(url, USER_AGENT) ?? true;
  };

  // 2. Fetch Homepage
  let homepageHtml = '';
  try {
    const targetUrl = baseUrl.toString();
    if (!isAllowed(targetUrl)) {
      return { pages, pagesUsed, error: 'Disallowed by robots.txt' };
    }

    const res = await fetch(targetUrl, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) {
      return {
        pages,
        pagesUsed,
        error: `Company homepage returned HTTP ${res.status}`,
      };
    }

    homepageHtml = await res.text();
    pagesUsed.push(targetUrl);
    const { title, text } = cleanHtmlText(homepageHtml);
    pages.push({
      url: targetUrl,
      title,
      content: text,
      type: 'homepage',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      pages,
      pagesUsed,
      error: `Failed to connect to company homepage: ${message}`,
    };
  }

  // 3. Extract and rank internal links from homepage
  const candidateLinks: Array<{ url: string; score: number; type: 'hiring' | 'about' | 'other' }> = [];
  const seenUrls = new Set<string>([baseUrl.toString()]);

  try {
    const $ = cheerio.load(homepageHtml);
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      const text = $(el).text();
      if (!href) return;

      try {
        const resolved = new URL(href, baseUrl);
        // Only internal links (same origin or subpath)
        if (resolved.origin !== baseUrl.origin) return;

        // Skip static file extensions
        if (/\.(pdf|zip|png|jpg|jpeg|gif|svg|css|js|woff|mp4)$/i.test(resolved.pathname)) return;

        const normalizedUrl = resolved.origin + resolved.pathname;
        if (seenUrls.has(normalizedUrl)) return;
        seenUrls.add(normalizedUrl);

        const { score, type } = scoreLink(resolved.pathname, text);
        if (score > 0) {
          candidateLinks.push({ url: normalizedUrl, score, type });
        }
      } catch {
        // Skip invalid link
      }
    });
  } catch {
    // If parsing links fails, continue with homepage content
  }

  // Sort candidate links by score descending
  candidateLinks.sort((a, b) => b.score - a.score);

  // Pick top hiring link and top about link
  const topHiring = candidateLinks.find((l) => l.type === 'hiring');
  const topAbout = candidateLinks.find((l) => l.type === 'about' && l.url !== topHiring?.url);

  const targetsToFetch = [topHiring, topAbout].filter(Boolean) as typeof candidateLinks;

  // 4. Fetch candidate pages (with individual timeouts & polite rate-limit delay)
  for (const target of targetsToFetch) {
    if (!isAllowed(target.url)) continue;

    try {
      // polite delay
      await new Promise((r) => setTimeout(r, 200));

      const res = await fetch(target.url, {
        headers: { 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(5000),
      });

      if (res.ok) {
        const html = await res.text();
        pagesUsed.push(target.url);
        const { title, text } = cleanHtmlText(html);
        if (text.length > 50) {
          pages.push({
            url: target.url,
            title,
            content: text,
            type: target.type,
          });
        }
      }
    } catch {
      // Skip unreachable subpage honestly without failing whole crawl
    }
  }

  return {
    pages,
    pagesUsed,
  };
}
