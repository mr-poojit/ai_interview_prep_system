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
    origin: '*',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));

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
