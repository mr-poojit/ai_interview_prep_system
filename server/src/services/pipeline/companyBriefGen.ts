import { llmClient } from '../llm/client.js';
import { CompanyBrief, CompanyBriefSchema } from '../../shared/types.js';
import { CrawledPage } from '../crawler.js';

const COMPANY_BRIEF_SYSTEM_PROMPT = `You are a corporate intelligence analyst preparing an executive company brief for a job candidate.

CRITICAL INSTRUCTIONS:
1. Base your brief strictly on the crawled text provided. DO NOT INVENT facts, products, or hiring processes that are not present.
2. If the crawled pages are empty, unreachable, or return very little information, report this HONESTLY and clearly (e.g., "The company website did not provide public details regarding their mission or hiring process.").
3. Detail:
   - "summary": A concise overview of the company, their market positioning, and their engineering culture or hiring process if discovered.
   - "what_they_do": A clear, objective explanation of their core product, service, or customer base.
4. Output MUST be valid JSON matching:
{
  "summary": string,
  "what_they_do": string
}`;

export async function generateCompanyBrief(
  companyUrl: string,
  pages: CrawledPage[],
  pagesUsed: string[],
  crawlError?: string
): Promise<CompanyBrief> {
  // If no pages were crawled or connection failed, return honest brief immediately
  if (pages.length === 0) {
    const reason = crawlError || 'No accessible pages found on site';
    return {
      summary: `Research into ${companyUrl} was constrained: ${reason}. Candidate should clarify company scale and focus during initial recruiter screen.`,
      what_they_do: `Unable to verify core business operations from the provided URL (${companyUrl}).`,
      sources: pagesUsed,
    };
  }

  const pagesSummary = pages
    .map((p) => `--- PAGE: ${p.url} (${p.type}) ---\nTitle: ${p.title}\n${p.content.slice(0, 1500)}`)
    .join('\n\n');

  try {
    const prompt = `CRAWLED COMPANY CONTENT:
<crawled_content>
${pagesSummary}
</crawled_content>

Generate the company brief JSON:`;

    const raw = await llmClient.complete(prompt, COMPANY_BRIEF_SYSTEM_PROMPT, {
      temperature: 0.2,
      jsonMode: true,
    });

    const parsed = JSON.parse(llmClient.cleanJsonResponse(raw));
    const brief: CompanyBrief = {
      summary: parsed.summary || 'Summary unavailable.',
      what_they_do: parsed.what_they_do || 'Business details unavailable.',
      sources: pagesUsed,
    };

    return CompanyBriefSchema.parse(brief);
  } catch {
    // Deterministic fallback using page titles & first paragraphs
    const firstPage = pages[0];
    return {
      summary: firstPage?.title
        ? `Operating under "${firstPage.title}". Explores technology solutions as presented on their web presence.`
        : `Company operating at ${companyUrl}.`,
      what_they_do: firstPage?.content?.slice(0, 250) || 'Technology and business operations.',
      sources: pagesUsed,
    };
  }
}
