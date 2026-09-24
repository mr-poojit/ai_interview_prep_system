# AI Interview Prep Kit (PrepHound / PrepKit AI)

> **Engineering Assessment: FS-AI-INTERVIEW-01**  
> A production-grade web application and batch evaluation pipeline that turns a job description and company URL into a personalized, verified, and reshapeable interview preparation kit.

---

## 1. Project Overview & Chosen Tech Stack

PrepKit AI transforms unstructured job postings into structured, verifiable interview preparation kits. Rather than issuing a single monolithic prompt, the system executes an observable sequence of deliberate research and generation steps: it extracts role requirements, crawls the target company website (ranking candidate links to uncover hiring handbooks and engineering blogs), searches public discussion archives, separates question generation across distinct competency categories, deterministically validates coverage with an automatic Second Pass loop, and arithmetically allocates material across your exact timeline.

### Stack Selection & Justifications
- **Frontend**: **Next.js 16 (App Router) + Tailwind CSS**
  - *Justification*: Provides server-side rendering, instant page transitions, and modern component boundaries. Built with Tailwind CSS and Lucide icons for responsive, accessible, dark-mode first design.
- **Backend**: **Node.js (v23) + Express + TypeScript**
  - *Justification*: Express provides clean separation of concerns across authentication, scraping, pipeline orchestration, and persistence. Built in strict TypeScript to guarantee schema conformity with Appendix A and B at compile and runtime.
- **Database**: **MongoDB (Mongoose) with Resilient Dual-Mode In-Memory Fallback**
  - *Justification*: Supports standard MongoDB Atlas / local MongoDB instances via `MONGODB_URI`. If no database connection string is provided (e.g. running from a clean clone or CI/test environment), an embedded in-memory repository activates automatically so the app and batch CLI run out-of-the-box without external database dependencies.
- **LLM Engine**: **Multi-Provider Client Abstraction (Google Gemini & Groq)**
  - *Justification*: Both Google Gemini (`gemini-2.5-flash` / `gemini-1.5-flash`) and Groq (`llama-3.3-70b-versatile` / `llama-3.1-8b-instant`) offer genuine, high-throughput free tiers. The client features an exponential backoff engine with random jitter (2–16s) to gracefully absorb rate limits (HTTP 429 / `RESOURCE_EXHAUSTED`). An automated deterministic fallback is active for offline test suites.
- **Scraping & Research**: **Native `fetch` + `cheerio` + `robots-parser`**
  - *Justification*: Avoids heavy headless browser overhead (Puppeteer/Playwright) to complete multi-page crawling in sub-second intervals while strictly respecting `robots.txt` and enforcing SSRF defenses.

---

## 2. Setup & Installation Instructions

### Prerequisites
- Node.js >= 18.0.0 (Tested on Node v23.8.0)
- npm >= 9.0.0

### Local Development Setup
1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd ai_interview_prep_system
   ```

2. **Install all dependencies**:
   ```bash
   # Install root dependencies
   npm install

   # Install server and client dependencies
   npm --prefix server install
   npm --prefix client install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Add your free-tier API key (either `GEMINI_API_KEY` or `GROQ_API_KEY`).
   *(Note: The system will run cleanly with offline deterministic mocks if no keys are provided).*

4. **Run the Application Locally**:
   ```bash
   npm run dev
   ```
   - **Frontend UI**: [http://localhost:3000](http://localhost:3000)
   - **Backend API**: [http://localhost:5000](http://localhost:5000)
   - **Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 3. Mandatory Batch Entry Point (Section 9)

The repository exposes the exact required CLI command that runs the full research, generation, and validation pipeline over a batch file of cases:

```bash
npm run evaluate -- --input <cases.json> --output <kits.json>
```

### Example Run
```bash
npm run evaluate -- --input test_cases.json --output test_kits.json
```

### Evaluation Command Features
- Reads an array of cases: `[{ "id": "case-01", "jd": "...", "company_url": "...", "days": 5 }]`
- Executes the identical production pipeline used by the web app (`server/src/services/pipeline/generator.ts`).
- Supports relative links and local test servers (e.g. `http://localhost:8099/acme/`).
- Outputs a single JSON file strictly matching the **Appendix B** specification.
- Fault-tolerant: Continues after individual case failures, recording `{ "status": "failed", "kit": null, "error": { "code": "...", "message": "..." } }`.
- Completes 5 cases well within the 15-minute budget.

---

## 4. High-Level Architecture

```
+---------------------------------------------------------------------------------------+
|                                  Client (Next.js 16)                                  |
|  - Kit Builder (Inline editing, reordering, pin/edit state tracking, regen by section)|
|  - Practice Mode (Flashcards, Confidence-weighted sorting, Spaced repetition)         |
|  - Creative Feature: Live AI Mock Interview Simulator & Printable Sheet Export        |
|  - Multi-Role Batch Upload Modal & Live Generation Stepper Progress Indicator        |
+---------------------------------------------------------------------------------------+
                                           |  REST API / JWT Auth
                                           v
+---------------------------------------------------------------------------------------+
|                               Backend (Node.js + Express)                             |
|  - Auth & Kit Routes (Isolation by user, session expiry handling)                     |
|  - Mongoose Models & Resilient Dual-Mode In-Memory Repository Fallback                |
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
| 10. Zod Schema Validator   --> Validates strict conformance to Appendix A schema      |
+---------------------------------------------------------------------------------------+
        |                                                              |
        v                                                              v
+-----------------------+                                   +-----------------------+
|   Database (MongoDB)  |                                   | Batch CLI (Section 9) |
|   User & Kit Storage  |                                   | npm run evaluate      |
+-----------------------+                                   +-----------------------+
```

---

## 5. Retrieval Approach & Sources Used

External web content is treated as untrusted data throughout:
1. **URL Validation & SSRF Defense**: In production (`NODE_ENV === 'production'`), requests to loopback (`127.0.0.1`, `localhost`), link-local (`169.254.x.x`), and private RFC 1918 networks (`10.x.x.x`, `192.168.x.x`, `172.16-31.x.x`) are rejected. Local addresses are permitted in non-production environments to support local mock evaluation servers as required by Section 9.
2. **`robots.txt` Compliance**: Prior to fetching subpages, `${origin}/robots.txt` is retrieved and parsed with `robots-parser`. If a path is disallowed for web bots, retrieval skips that page gracefully.
3. **Dynamic Link Ranking Heuristic**: Hardcoded paths fail when companies bury hiring details in unconventional locations (e.g. GitLab handbooks, PostHog culture pages). Our crawler parses homepage anchor tags and computes a weighted heuristic score:
   - *Hiring Signals* (`/careers`, `/jobs`, `/hiring`, `/join`, `/handbook`, `/engineering`, `/culture`, `/interview`, `/life-at`): +25 points
   - *Company Signals* (`/about`, `/about-us`, `/mission`, `/values`, `/team`, `/product`, `/technology`): +20 points
   - Filters out binary/media extensions (`.pdf`, `.png`, `.jpg`, `.zip`, `.mp4`).
   - Fetches the top-ranked candidates with timeouts (5s) and payload caps (2MB).
4. **Public Interview Discussions**: Queries public search endpoints for verified community feedback (`"<company> interview process questions glassdoor reddit"`). If no verified public discussions exist, it truthfully records: *"No verified public interview discussions found for this company."*

---

## 6. Research & Generation Sequencing

The kit is assembled through an observable multi-stage pipeline where each step responds to findings from preceding steps:

| Step | Stage Name | Responsibility | Deterministic vs LLM |
| :--- | :--- | :--- | :--- |
| **1** | `extracting_requirements` | Extracts title, seniority, responsibilities, and atomic requirements from pasted JD text. Classifies kind (`technical`, `behavioural`, `domain`) and priority (`must` vs `nice`). Assigns stable IDs (`r1`, `r2`, ...). Stub postings are extracted faithfully without hallucination. | LLM with strict JSON schema |
| **2** | `crawling_company` | Crawls homepage, discovers and ranks hiring & about links, sanitizes HTML into clean paragraphs, respects `robots.txt`. | Deterministic |
| **3** | `searching_discussions` | Searches public discussion archives for interview rounds, take-homes, and screening experiences. | Deterministic Scraping |
| **4** | `generating_brief` | Synthesizes crawled pages and hiring signals into `{ summary, what_they_do, sources }`. Reports limitations honestly if unreachable. | LLM synthesis |
| **5** | `generating_questions` | Generates targeted questions category by category (`technical`, `behavioural`, `system-design`, `company-fit`). Each category call uses specialized system prompts and maps to relevant requirement IDs. | LLM by Category |
| **6** | `checking_coverage` | Deterministic set comparison checking whether all extracted requirement IDs are covered by generated questions. | **Deterministic Code** |
| **7** | `generating_second_pass` | If any must-haves (or nice-to-haves) are uncovered, triggers Pass 2 targeting the gap requirements specifically. Appends new questions with sequential IDs and records passes count (`passes: 2`). | Hybrid (Code loops LLM) |
| **8** | `generating_flashcards` | Generates rapid-fire flashcards with front prompt and back key mechanics mapped to requirement IDs. | LLM |
| **9** | `allocating_schedule` | Distributes questions across exactly $N$ requested days. Front-loads difficulty 3 and must-have topics earlier in the timeline. Computes integer durations in minutes. | **Deterministic Arithmetic** |
| **10** | `validating_kit` | Validates entire object against Appendix A Zod schema before saving or writing to disk. | **Deterministic Code** |

---

## 7. State Representation: Generated, Edited & Pinned (Section 6)

One of the most critical design challenges is ensuring that regenerating a section does not discard edits made elsewhere, and that questions written or edited by hand survive regeneration of their category.

### State Model
Each question maintains provenance metadata:
```typescript
interface Question {
  id: string; // Stable ID (e.g. "q1")
  requirement_ids: string[];
  category: 'technical' | 'behavioural' | 'system-design' | 'company-fit';
  prompt: string;
  answer_outline: string;
  difficulty: number; // 1, 2, 3
  is_custom?: boolean; // True if created by user by hand
  is_edited?: boolean; // True if user modified prompt, answer, or difficulty
  is_pinned?: boolean; // True if user explicitly locked the question
}
```

### Preservation Algorithm on Category Regeneration
When the user clicks "Regenerate Technical Questions":
1. **Partition Existing Questions**:
   - `preserved = questions.filter(q => q.category === target && (q.is_custom || q.is_edited || q.is_pinned))`
   - `replaceable = questions.filter(q => q.category === target && !q.is_custom && !q.is_edited && !q.is_pinned)`
2. **Target Remaining Requirements**:
   - Gathers requirements relevant to this category that are not already covered by `preserved`.
   - Invokes the category generator to synthesize fresh questions for missing requirements.
3. **Merge & Renumber**:
   - All `preserved` questions retain their exact user-edited text, prompts, and IDs.
   - Newly generated questions receive unique incremental IDs (`qN+1`, `qN+2`, ...).
4. **Reconcile Schedule**:
   - Re-runs deterministic schedule allocation to ensure schedule `question_ids` incorporate newly added questions and purge removed ones without breaking day mappings.

---

## 8. Deterministic Schedule Allocation (Section 8)

The schedule is allocated via pure arithmetic in `server/src/services/pipeline/scheduler.ts`:
- **Strict Invariant**: The number of days in `schedule.days` always equals `schedule.days_available`.
- **Must-Have Coverage**: The algorithm verifies that every requirement where `priority === 'must'` is covered by at least one question appearing in the schedule.
- **Priority & Difficulty Front-Loading**: Questions are ranked by priority score:
  $$\text{Score} = (\text{coversMust} \times 10) + (\text{difficulty} \times 3) + (\text{categoryBonus})$$
  Higher-scored questions (System Design, Difficulty 3, Must-haves) are assigned to earlier days ($1 \dots \lceil N/2 \rceil$). Later days transition toward behavioral alignment, rapid flashcards, and final tune-up.
- **Integer Minutes**: Each day calculates an integer duration rounded to 15-minute increments (e.g. 45, 60, 75, 90 mins).
- **Extreme Range Handling**:
  - *1-Day Schedule*: Consolidated high-intensity review covering all must-haves in a 60–120 minute session.
  - *60-Day Schedule*: Distributed spaced-repetition program cycling foundational technical concepts, architecture deep dives, behavioral STAR polishing, and mock simulations.

---

## 9. Creative Feature: Live AI Mock Interviewer & Printable Dossier

### Problem Solved
Candidates frequently know technical answers in theory, but stumble when articulating them under verbal time constraints. Flashcards only test passive recall, while mock interviews with humans are expensive and stressful.

### Implementation
1. **Timed Verbal Simulation**: Select any question from the question bank, trigger the 2:00 live countdown clock, and speak through your microphone (using the Web Speech API with animated visual transcription) or type your answer.
2. **AI Rubric Critique**: The answer is evaluated directly against the question's `answer_outline`:
   - *Technical Accuracy Score* (1–10)
   - *Structure & STAR Flow Score* (1–10)
   - *Delivery & Conciseness Score* (1–10)
   - *Specific Strengths* (what concepts were hit cleanly)
   - *Points Missed* (gotchas, edge cases, or telemetry omitted)
   - *60-Second Exemplar Answer* (polished model answer)
3. **Printable Dossier / Cheat Sheet**: A dedicated print stylesheet (`PrintableSheet.tsx`) that renders the complete prep kit into a clean, formatted document ready for printing (`Ctrl+P` / `Cmd+P` or Save to PDF) for offline review before entering the interview room.

---

## 10. Automated Tests

The test suite protects the core deterministic invariants:
```bash
npm test
```

### Test Coverage (`tests/`)
- `tests/scheduler.test.ts`: Tests 1-day, 5-day, 14-day, and 60-day schedules. Asserts exact day count match, coverage of all must-haves, front-loading of harder questions, and integer minute durations.
- `tests/coverage.test.ts`: Verifies gap detection and asserts that Second Pass generates missing questions and marks `passes: 2`.
- `tests/validator.test.ts`: Verifies strict conformance to Appendix A schema. Rejects float minutes, invalid difficulties, and schedule references to non-existent question IDs.
- `tests/crawler.test.ts`: Tests link ranking heuristics, HTML sanitization, and SSRF private address filtering.

---

## 11. Edge Cases & Resilience

| Edge Case | Behavior |
| :--- | :--- |
| **Invalid URL, 404, or Timeout** | Does not fail the pipeline. Reports `pages_used: []` and an honest brief: *"Research was constrained: Failed to connect to company homepage. Candidate should clarify company scale during recruiter screen."* |
| **No Hiring or About Page Found** | Company brief synthesizes whatever public homepage text exists and marks sources honestly. Does not fabricate hiring procedures. |
| **Two-Line Stub Job Description** | Extracts only explicit requirements without hallucinating. Produces a concise, honest kit reflecting the sparse input. |
| **Public Discussion Empty** | Reports: *"No verified public interview discussions found for this company."* Questions are built strictly from JD requirements and domain. |
| **LLM Rate Limits (HTTP 429)** | Exponential backoff with random jitter (2000ms $\times 2^k$ + jitter) retries up to 5 times. Concurrency queue throttles outbound requests. |
| **Duplicate Submission** | Idempotently generates or reopens existing kit records without clobbering user edits. |
| **1-Day or 60-Day Schedules** | Scaled deterministically: 1-day consolidates all must-haves; 60-day generates structured multi-week spaced repetition phases. |

---

## 12. Evaluation Verification

To verify the submission against Section 9:
```bash
npm run evaluate -- --input test_cases.json --output test_kits.json
```
This runs the full retrieval, generation, and validation path over test cases and writes Appendix B output.

---

## License
MIT License. Built for the Trao Engineering Assessment.
