import { describe, it, expect } from 'vitest';
import { scoreLink, cleanHtmlText, isSafeUrl } from '../server/src/services/crawler.js';

describe('Crawler Services (Section 2 & 11)', () => {
  it('correctly scores and prioritizes hiring-related links', () => {
    const hiring = scoreLink('/careers/engineering', 'Join our team');
    const about = scoreLink('/about/mission', 'Our Mission');
    const random = scoreLink('/terms-of-service', 'Terms');

    expect(hiring.type).toBe('hiring');
    expect(hiring.score).toBeGreaterThan(0);

    expect(about.type).toBe('about');
    expect(about.score).toBeGreaterThan(0);

    expect(random.score).toBe(0);
    expect(hiring.score).toBeGreaterThan(about.score);
  });

  it('cleans HTML text by removing scripts, navs, and extracting main content', () => {
    const rawHtml = `
      <!DOCTYPE html>
      <html>
        <head><title>Test Company</title><script>console.log('secret');</script></head>
        <body>
          <nav><a href="/">Home</a><a href="/login">Login</a></nav>
          <h1>Welcome to Test Company</h1>
          <p>We build mission-critical distributed databases for enterprise infrastructure.</p>
          <footer>Copyright 2026</footer>
        </body>
      </html>
    `;

    const { title, text } = cleanHtmlText(rawHtml);
    expect(title).toBe('Test Company');
    expect(text).toContain('We build mission-critical distributed databases');
    expect(text).not.toContain('secret');
    expect(text).not.toContain('Login');
  });

  it('validates safe URLs and rejects malformed strings', () => {
    expect(isSafeUrl('https://example.com')).toBe(true);
    expect(isSafeUrl('http://localhost:8080/careers')).toBe(true); // Permitted in non-production
    expect(isSafeUrl('ftp://example.com')).toBe(false);
    expect(isSafeUrl('not a url')).toBe(false);
  });
});
