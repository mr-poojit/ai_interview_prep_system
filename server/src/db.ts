import mongoose from 'mongoose';
import { config } from './config.js';

let isConnected = false;
let isInMemoryFallback = false;

export async function connectDatabase(): Promise<boolean> {
  if (isConnected) return true;

  if (!config.mongodbUri) {
    console.log('[Database] No MONGODB_URI provided in environment. Utilizing in-memory storage mode.');
    isInMemoryFallback = true;
    isConnected = true;
    return true;
  }

  try {
    await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 4000,
    });
    isConnected = true;
    console.log('[Database] Connected successfully to MongoDB.');
    return true;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[Database] MongoDB connection failed (${message}). Falling back to resilient in-memory storage.`);
    isInMemoryFallback = true;
    isConnected = true;
    return true;
  }
}

export function isUsingInMemoryStore(): boolean {
  return isInMemoryFallback;
}
