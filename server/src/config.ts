import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root or server directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

export interface AppConfig {
  port: number;
  nodeEnv: string;
  mongodbUri: string;
  jwtSecret: string;
  geminiApiKey: string;
  geminiModel: string;
  groqApiKey: string;
  groqModel: string;
  llmProvider: 'gemini' | 'groq' | 'mock';
  clientUrl: string;
}

const getLlmProvider = (): 'gemini' | 'groq' | 'mock' => {
  const explicit = process.env.LLM_PROVIDER?.toLowerCase();
  if (explicit === 'gemini' || explicit === 'groq' || explicit === 'mock') {
    return explicit;
  }
  if (process.env.GEMINI_API_KEY) {
    return 'gemini';
  }
  if (process.env.GROQ_API_KEY) {
    return 'groq';
  }
  return 'mock';
};

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-interview-prep-token-min32chars',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  groqApiKey: process.env.GROQ_API_KEY || '',
  groqModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  llmProvider: getLlmProvider(),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
};
