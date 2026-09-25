import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { connectDatabase, isUsingInMemoryStore } from './db.js';
import authRoutes from './routes/auth.js';
import kitRoutes from './routes/kits.js';
import practiceRoutes from './routes/practice.js';

const app = express();

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow curl, health monitors, or non-browser agents
      if (!origin) return callback(null, true);
      // Allow configured client URL, localhost, or any Vercel preview domain
      if (
        config.nodeEnv !== 'production' ||
        !config.clientUrl ||
        config.clientUrl === '*' ||
        origin === config.clientUrl ||
        origin.endsWith('.vercel.app') ||
        origin.includes('localhost')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));

// Root info route
app.get('/', (_req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>PrepKit AI Backend API</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #020617;
            color: #f8fafc;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
          }
          .card {
            text-align: center;
            padding: 2.5rem;
            background: #0f172a;
            border: 1px solid #1e293b;
            border-radius: 1.25rem;
            max-width: 480px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.6);
          }
          h1 { color: #818cf8; margin-top: 0; font-size: 1.5rem; }
          p { color: #94a3b8; font-size: 0.95rem; line-height: 1.5; }
          .btn {
            display: inline-block;
            background: #4f46e5;
            color: #ffffff;
            padding: 0.75rem 1.5rem;
            border-radius: 0.75rem;
            text-decoration: none;
            font-weight: 600;
            margin-top: 1rem;
            transition: background 0.2s;
          }
          .btn:hover { background: #4338ca; }
          .meta { margin-top: 1.5rem; font-size: 0.8rem; color: #64748b; }
          a.link { color: #38bdf8; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>PrepKit AI Backend Active 🚀</h1>
          <p>The Express API server is running on <strong>port 5000</strong>.</p>
          <p>The interactive website interface runs on <strong>port 3000</strong>.</p>
          <a class="btn" href="http://localhost:3000">Open Website (localhost:3000) &rarr;</a>
          <div class="meta">
            API Health Endpoint: <a class="link" href="/api/health">/api/health</a>
          </div>
        </div>
      </body>
    </html>
  `);
});

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: isUsingInMemoryStore() ? 'in-memory-fallback' : 'mongodb',
    llmProvider: config.llmProvider,
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/kits', kitRoutes);
app.use('/api/practice', practiceRoutes);

// Global Error Handler
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Server Error]', err);
  const message = err instanceof Error ? err.message : 'Internal Server Error';
  res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message });
});

// Start Server
async function start() {
  await connectDatabase();
  app.listen(config.port, () => {
    console.log(`====================================================`);
    console.log(`🚀 AI Interview Prep Server running on port ${config.port}`);
    console.log(`📡 Storage Mode: ${isUsingInMemoryStore() ? 'In-Memory Resilient Store' : 'MongoDB'}`);
    console.log(`🤖 Active LLM Provider: ${config.llmProvider}`);
    console.log(`====================================================`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
