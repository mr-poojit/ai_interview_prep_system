import fs from 'fs';
import path from 'path';
import {
  BatchInputCase,
  BatchInputSchema,
  BatchOutput,
  BatchCaseOutput,
  BatchOutputSchema,
} from '../shared/types.js';
import { generatePrepKit } from '../server/src/services/pipeline/generator.js';

function parseCliArgs() {
  const argv = process.argv.slice(2);
  let input = '';
  let output = '';

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--input' || arg === '-i') {
      input = argv[++i];
    } else if (arg.startsWith('--input=')) {
      input = arg.slice(8);
    } else if (arg === '--output' || arg === '-o') {
      output = argv[++i];
    } else if (arg.startsWith('--output=')) {
      output = arg.slice(9);
    } else if (!arg.startsWith('-')) {
      if (!input) input = arg;
      else if (!output) output = arg;
    }
  }

  return { input, output };
}

async function main() {
  const { input, output } = parseCliArgs();

  if (!input || !output) {
    console.error('Usage: npm run evaluate -- --input <cases.json> --output <kits.json>');
    console.error('Received arguments:', process.argv.slice(2));
    process.exit(1);
  }

  const inputPath = path.resolve(process.cwd(), input);
  const outputPath = path.resolve(process.cwd(), output);

  console.log(`[Evaluate] Reading cases from: ${inputPath}`);

  if (!fs.existsSync(inputPath)) {
    console.error(`[Evaluate] Error: Input file not found at ${inputPath}`);
    process.exit(1);
  }

  let rawData: unknown;
  try {
    const fileContent = fs.readFileSync(inputPath, 'utf-8');
    rawData = JSON.parse(fileContent);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[Evaluate] Error: Failed to parse input JSON: ${message}`);
    process.exit(1);
  }

  const parsedInput = BatchInputSchema.safeParse(rawData);
  if (!parsedInput.success) {
    console.error('[Evaluate] Error: Input file does not match expected schema:', parsedInput.error.format());
    process.exit(1);
  }

  const cases: BatchInputCase[] = parsedInput.data;
  console.log(`[Evaluate] Successfully loaded ${cases.length} cases.`);

  const kitsOutput: BatchCaseOutput[] = [];

  for (let idx = 0; idx < cases.length; idx++) {
    const testCase = cases[idx];
    console.log(`\n---------------------------------------------------------`);
    console.log(`[Case ${idx + 1}/${cases.length}] Processing ID: ${testCase.id} (${testCase.company_url}, ${testCase.days} days)`);

    try {
      const kit = await generatePrepKit({
        jd: testCase.jd,
        company_url: testCase.company_url,
        days: testCase.days,
        onProgress: (progress) => {
          console.log(`  -> [${progress.stage}] ${progress.message}`);
        },
      });

      kitsOutput.push({
        id: testCase.id,
        status: 'ok',
        kit,
        error: null,
      });

      console.log(`✓ [Case ${testCase.id}] Completed successfully.`);
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      const errorCode = error.code || 'GENERATION_FAILED';
      const errorMessage = error.message || String(err);

      console.error(`✗ [Case ${testCase.id}] Failed: [${errorCode}] ${errorMessage}`);

      kitsOutput.push({
        id: testCase.id,
        status: 'failed',
        kit: null,
        error: {
          code: errorCode,
          message: errorMessage,
        },
      });
    }
  }

  const batchResult: BatchOutput = {
    version: '1.0',
    generated_at: new Date().toISOString(),
    kits: kitsOutput,
  };

  // Validate output against Appendix B schema
  BatchOutputSchema.parse(batchResult);

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(batchResult, null, 2), 'utf-8');
  console.log(`\n=========================================================`);
  console.log(`[Evaluate] All cases processed. Results written to: ${outputPath}`);
}

main().catch((err) => {
  console.error('[Evaluate] Fatal error:', err);
  process.exit(1);
});
