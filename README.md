# PrepKit AI 🎯

> **Autonomous AI Interview Preparation Platform & Research Pipeline**  
> Turn any job description and company URL into a personalized, verified, and reshapeable interview preparation kit with daily schedules, flashcards, and a live AI mock interview simulator.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16_App_Router-black.svg)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-23.x-green.svg)](https://nodejs.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 1. Project Overview & Architecture Philosophy

Landing an engineering or product role requires more than reciting standard trivia—it requires deep alignment with a specific company's tech stack, architecture challenges, culture, and exact role competencies.

**PrepKit AI** replaces single-prompt generative guesswork with an observable sequence of deliberate research and verification steps:

1. **Extracts Atomic Competencies**: Parses raw job descriptions into prioritized requirements (`must-have` vs `nice-to-have`) across technical, behavioural, and domain verticals.
2. **Heuristic Company Crawling**: Explores the target company's web domain, ranking candidate links to discover engineering handbooks, tech blogs, and culture values while strictly respecting `robots.txt` and SSRF safety boundaries.
3. **Public Discussion Mining**: Searches community discussion archives for real-world candidate interview experiences and question patterns.
4. **Targeted Question Generation**: Synthesizes questions category-by-category (`technical`, `behavioural`, `system-design`, `company-fit`) mapped directly to requirement IDs.
5. **Deterministic Second Pass Loop**: Set-math verification audits questions against required competencies. Any uncovered requirement automatically triggers a targeted Second Pass to ensure 100% must-have coverage.
6. **Arithmetic Schedule Allocation**: Distributes prep material mathematically across your exact days, front-loading high-difficulty and core architectural topics.
7. **State-Preserving Customization**: Edit prompts, add custom questions, reorder, or pin items—individual categories can be regenerated at any time while handcrafted work remains strictly untouched.
8. **Interactive Rehearsal Room**: Timed speech/voice simulation with AI scoring against official rubrics, plus a one-click printable cheat-sheet dossier.

---

## 2. Tech Stack

- **Frontend**: **Next.js 16 (App Router) + React 19 + Tailwind CSS**
  - Server-side rendering, instant page transitions, dark-mode first UI, mobile-responsive navigation drawer, and Lucide icons.
- **Backend**: **Node.js + Express + TypeScript**
  - Modular REST API with JWT authentication, rate limiting, and strict schema validation.
- **Database**: **MongoDB (Mongoose) with Resilient In-Memory Fallback**
  - Connects to MongoDB Atlas or local MongoDB via `MONGODB_URI`. If no database string is provided, an embedded in-memory repository activates automatically so the entire platform works out-of-the-box.
- **LLM Engine**: **Multi-Provider Client (Google Gemini & Groq)**
  - Supports Google Gemini (`gemini-2.5-flash`, `gemini-1.5-flash`) and Groq (`llama-3.3-70b-versatile`). Features exponential backoff with random jitter to gracefully absorb rate limits, plus offline deterministic fallback for headless testing.
- **Scraping & Research**: **Native `fetch` + `cheerio` + `robots-parser`**
  - Sub-second multi-page crawling with SSRF IP filters, payload caps, and full robots protocol compliance without heavy browser overhead.

---

## 3. High-Level Architecture

```
+---------------------------------------------------------------------------------------+
|                                  Client (Next.js 16)                                  |
|  - Kit Builder (Inline editing, reordering, pin/edit state tracking, category regen)  |
|  - Practice Room (Spaced-repetition flashcards, confidence-weighted sorting)          |
|  - Interactive Rehearsal (Live AI Mock Interview Simulator & Printable Cheat Sheet)   |
|  - Multi-Role Batch Upload Modal & Live Generation Stepper Progress Indicator        |
+---------------------------------------------------------------------------------------+
                                           |  REST API / JWT Auth
                                           v
+---------------------------------------------------------------------------------------+
|                               Backend (Node.js + Express)                             |
|  - Auth & Kit Routes (Per-user data isolation, session validation)                    |
|  - Mongoose Models & Resilient In-Memory Repository Fallback                         |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
|                            Core Pipeline Engine (Shared)                              |
|                                                                                       |
|  1. Requirement Extractor  --> Must/Nice classification, stable IDs (r1, r2, ...)     |
|  2. Web Crawler & Ranker   --> SSRF filter, robots.txt, path ranker (/careers, etc.)  |
|  3. Discussion Search      --> Public interview format & discussions                  |
|  4. Company Brief Gen      --> Honest summary of what they do & hiring format         |
|  5. Category Question Gen  --> Split by technical, behavioural, system-design, fit   |
|  6. Coverage Gap Checker   --> Deterministic set math (questions vs requirements)     |
|  7. The Second Pass        --> Targeted loop closing coverage gaps for must-haves     |
|  8. Flashcard Generator    --> Key concepts tied to requirement IDs                   |
|  9. Schedule Allocator     --> Deterministic arithmetic distributing topics across N  |
| 10. Zod Schema Validator   --> Validates strict schema conformance before persisting  |
+---------------------------------------------------------------------------------------+
        |                                                              |
        v                                                              v
+-----------------------+                                   +-----------------------+
|   Database (MongoDB)  |                                   |  Batch CLI Processor  |
|   User & Kit Storage  |                                   |  npm run evaluate     |
+-----------------------+                                   +-----------------------+
```

---

## 4. Getting Started

### Prerequisites
- Node.js >= 18.0.0 (Tested on Node v20 & v23)
- npm >= 9.0.0

### Installation & Local Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/mr-poojit/ai_interview_prep_system.git
   cd ai_interview_prep_system
   ```

2. **Install dependencies**:
   ```bash
   # Install root dependencies
   npm install

   # Install server and client dependencies
   npm --prefix server install
   npm --prefix client install
   ```

3. **Configure Environment Variables**:
   Copy the sample environment file:
   ```bash
   cp .env.example .env
   ```
   Add your free-tier API key in `.env` (either [Google AI Studio](https://aistudio.google.com/app/apikey) or [Groq Console](https://console.groq.com/keys)):
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/ai_interview_prep
   JWT_SECRET=your-secure-jwt-secret-string-at-least-32-chars

   # Free Tier LLM Provider (Google Gemini or Groq)
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-2.5-flash

   LLM_PROVIDER=gemini
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```
   *(Note: If no API key is provided, the system operates with offline deterministic mock models).*

4. **Launch Development Servers**:
   ```bash
   npm run dev
   ```
   - **Frontend Application**: [http://localhost:3000](http://localhost:3000)
   - **Backend API**: [http://localhost:5000](http://localhost:5000)
   - **Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 5. Batch Pipeline CLI Engine

For processing multiple job applications simultaneously, PrepKit AI includes a high-throughput batch evaluation CLI:

```bash
npm run evaluate -- --input <cases.json> --output <kits.json>
```

### Example
```bash
npm run evaluate -- --input test_cases.json --output test_kits.json
```

### Batch Engine Features
- **Array Ingestion**: Accepts a batch JSON file containing roles: `[{ "id": "case-01", "jd": "...", "company_url": "...", "days": 5 }]`
- **Identical Pipeline**: Executes the full multi-pass crawler, synthesizer, second-pass gap closer, and scheduler.
- **Fault-Tolerant Execution**: Continues gracefully if an individual external URL fails, recording clean error diagnostics.
- **Strict Validation**: Validates all generated kits against runtime Zod schemas.

---

## 6. Research & Retrieval Engine

External web content is treated as untrusted data throughout:

1. **SSRF Defense**: In production (`NODE_ENV === 'production'`), requests to loopback (`127.0.0.1`, `localhost`), link-local (`169.254.x.x`), and private RFC 1918 subnets (`10.x.x.x`, `192.168.x.x`, `172.16-31.x.x`) are blocked.
2. **`robots.txt` Compliance**: Prior to fetching subpages, the company's `/robots.txt` is fetched and parsed with `robots-parser`. If a path is disallowed, the crawler gracefully respects the rule.
3. **Dynamic Link Ranking Heuristic**: Parses homepage anchor tags and computes a weighted signal score:
   - *Hiring Signals* (`/careers`, `/jobs`, `/hiring`, `/join`, `/handbook`, `/engineering`, `/culture`, `/interview`): +25 points
   - *Company Signals* (`/about`, `/about-us`, `/mission`, `/values`, `/team`, `/product`, `/technology`): +20 points
   - Filters out binary/media extensions (`.pdf`, `.png`, `.jpg`, `.zip`, `.mp4`).
   - Fetches the top-ranked pages with strict 5-second timeouts and 2MB payload limits.
4. **Community Discussion Scraping**: Queries public discussion archives for candidate feedback. If no discussions are verified, it truthfully notes: *"No verified public interview discussions found for this company."*

---

## 7. Observable Research & Generation Pipeline

Every kit is assembled through an observable multi-stage pipeline:

| Step | Stage Name | Responsibility | Engine Type |
| :--- | :--- | :--- | :--- |
| **1** | `extracting_requirements` | Extracts title, seniority, responsibilities, and atomic requirements from raw JD text. Classifies kind (`technical`, `behavioural`, `domain`) and priority (`must` vs `nice`). Assigns stable IDs (`r1`, `r2`, ...). | LLM + Schema Validation |
| **2** | `crawling_company` | Crawls homepage, discovers and ranks hiring & about links, sanitizes HTML into clean paragraphs, and verifies `robots.txt`. | Deterministic Crawler |
| **3** | `searching_discussions` | Searches public discussion archives for interview rounds, take-homes, and screening experiences. | Web Retrieval |
| **4** | `generating_brief` | Synthesizes crawled pages and hiring signals into `{ summary, what_they_do, sources }`. Reports limitations honestly if unreachable. | LLM Synthesis |
| **5** | `generating_questions` | Generates targeted questions category by category (`technical`, `behavioural`, `system-design`, `company-fit`). Each category call uses specialized system prompts mapped to relevant requirements. | LLM by Category |
| **6** | `checking_coverage` | Deterministic set comparison checking whether all extracted requirement IDs are covered by generated questions. | **Deterministic Code** |
| **7** | `generating_second_pass` | If any must-haves are uncovered, triggers Pass 2 targeting the gap requirements specifically. Appends new questions and increments passes count. | Hybrid (Deterministic + LLM) |
| **8** | `generating_flashcards` | Generates rapid-fire flashcards with front prompt and back key mechanics mapped to requirement IDs. | LLM Synthesis |
| **9** | `allocating_schedule` | Distributes questions across exactly $N$ requested days. Front-loads difficulty 3 and must-have topics earlier in the timeline. | **Deterministic Arithmetic** |
| **10** | `validating_kit` | Validates entire object against runtime Zod schemas before persisting to storage. | **Deterministic Validation** |

---

## 8. State Preservation: Generated, Edited & Pinned

A core capability of PrepKit AI is enabling users to regenerate individual sections without losing manual work:

```typescript
interface Question {
  id: string;               // Stable ID (e.g. "q1")
  requirement_ids: string[];
  category: 'technical' | 'behavioural' | 'system-design' | 'company-fit';
  prompt: string;
  answer_outline: string;
  difficulty: number;       // 1, 2, 3
  is_custom?: boolean;      // True if handcrafted by the user
  is_edited?: boolean;      // True if user modified prompt, answer, or difficulty
  is_pinned?: boolean;      // True if user locked question against regeneration
}
```

### Preservation Algorithm on Category Regeneration
When the user clicks "Regenerate Technical Questions":
1. **Partition Existing Questions**:
   - `preserved = questions.filter(q => q.category === target && (q.is_custom || q.is_edited || q.is_pinned))`
   - `replaceable = questions.filter(q => q.category === target && !q.is_custom && !q.is_edited && !q.is_pinned)`
2. **Target Remaining Requirements**:
   - Finds requirements for this category not already covered by `preserved`.
   - Generates fresh questions only for the missing requirements.
3. **Merge & Renumber**:
   - All `preserved` questions retain their exact user-edited text, prompts, and IDs.
   - Newly generated questions receive unique incremental IDs (`qN+1`, `qN+2`, ...).
4. **Reconcile Schedule**:
   - Automatically recalibrates the daily schedule to reference active question IDs without breaking day mappings.

---

## 9. Deterministic Schedule Allocation

The schedule is allocated via pure arithmetic in `server/src/services/pipeline/scheduler.ts`:
- **Strict Invariant**: The number of days in `schedule.days` always equals `schedule.days_available`.
- **Must-Have Coverage**: The algorithm verifies that every requirement where `priority === 'must'` is covered by at least one question appearing in the schedule.
- **Priority & Difficulty Front-Loading**: Questions are ranked by priority score:
  $$\text{Score} = (\text{coversMust} \times 10) + (\text{difficulty} \times 3) + (\text{categoryBonus})$$
  Higher-scored questions (System Design, Difficulty 3, Must-haves) are assigned to earlier days ($1 \dots \lceil N/2 \rceil$). Later days transition toward behavioral alignment, rapid flashcards, and final review.
- **Integer Minutes**: Each day calculates an integer duration rounded to 15-minute increments (e.g. 45, 60, 75, 90 mins).

---

## 10. Live AI Mock Interviewer & Printable Dossier

### Live AI Mock Interview Simulator
1. **Timed Verbal Simulation**: Select any question from your question bank, trigger the 2:00 live countdown clock, and speak through your microphone (using the Web Speech API with live animated transcription) or type your answer.
2. **AI Rubric Critique**: The answer is evaluated directly against the question's rubric outline:
   - **Technical Accuracy Score** (1–10)
   - **Structure & STAR Flow Score** (1–10)
   - **Delivery & Tone Score** (1–10)
   - **Specific Strengths** (concepts articulated cleanly)
   - **Points Missed** (edge cases, latency trade-offs, or omissions)
   - **60-Second Exemplar Answer** (polished model response)

### Printable Dossier / Cheat Sheet
A dedicated print stylesheet (`PrintableSheet.tsx`) that formats the complete kit into a clean, professional document ready for printing (`Ctrl+P` / `Cmd+P` or Save to PDF) for offline review right before entering an interview.

---

## 11. Automated Testing

The test suite validates core deterministic invariants:

```bash
npm test
```

### Test Coverage (`tests/`)
- `tests/scheduler.test.ts`: Tests 1-day, 5-day, 14-day, and 60-day schedules. Asserts exact day count match, coverage of all must-haves, front-loading of harder questions, and integer minute durations.
- `tests/coverage.test.ts`: Verifies gap detection and asserts that Second Pass generates missing questions and marks `passes: 2`.
- `tests/validator.test.ts`: Verifies strict schema conformance. Rejects floating-point minutes, invalid difficulties, and schedule references to non-existent question IDs.
- `tests/crawler.test.ts`: Tests link ranking heuristics, HTML sanitization, and SSRF private address filtering.

---

## 12. Edge Cases & Resilience

| Edge Case | System Behavior |
| :--- | :--- |
| **Invalid URL, 404, or Timeout** | Does not fail the pipeline. Reports `pages_used: []` and an honest brief: *"Research was constrained: Failed to connect to company homepage. Candidate should clarify company scale during recruiter screen."* |
| **No Hiring or About Page Found** | Company brief synthesizes whatever public homepage text exists and marks sources honestly. Does not fabricate hiring procedures. |
| **Two-Line Stub Job Description** | Extracts only explicit requirements without hallucinating. Produces a concise, honest kit reflecting the sparse input. |
| **Public Discussion Empty** | Reports: *"No verified public interview discussions found for this company."* Questions are built strictly from JD requirements and domain. |
| **LLM Rate Limits (HTTP 429)** | Exponential backoff with random jitter ($2000\text{ms} \times 2^k + \text{jitter}$) retries up to 5 times. |
| **1-Day or 60-Day Schedules** | Scaled deterministically: 1-day consolidates all must-haves; 60-day generates structured multi-week spaced repetition phases. |

---

## License

This project is licensed under the [MIT License](LICENSE).
