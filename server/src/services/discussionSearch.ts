import * as cheerio from 'cheerio';

export interface DiscussionSearchResult {
  snippets: string[];
  sourceUrl?: string;
  found: boolean;
}

/**
 * Searches public web sources for community discussions regarding the company's interview process.
 * Gracefully reports empty findings if nothing is turned up or if network is constrained.
 */
export async function searchPublicInterviewDiscussions(companyName: string): Promise<DiscussionSearchResult> {
  if (!companyName || companyName.trim().length === 0) {
    return { snippets: [], found: false };
  }

  const cleanName = companyName.replace(/[^a-zA-Z0-9\s.-]/g, '').trim();
  const query = `${cleanName} interview process questions`;

  try {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) {
      return { snippets: [], found: false };
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    const snippets: string[] = [];

    $('.result__snippet').each((_, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      if (text.length > 30 && snippets.length < 3) {
        snippets.push(text);
      }
    });

    return {
      snippets,
      sourceUrl: searchUrl,
      found: snippets.length > 0,
    };
  } catch {
    // If public search fails or times out, report honestly without failing the pipeline
    return { snippets: [], found: false };
  }
}
