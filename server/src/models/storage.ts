import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { KitStructure } from '../../../shared/types.js';
import { config } from '../config.js';
import { isUsingInMemoryStore } from '../db.js';

// ==========================================
// User Entity & Schema
// ==========================================

export interface IUser {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

const UserMongooseSchema = new Schema<IUser & Document>({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: String, default: () => new Date().toISOString() },
});

export const UserMongooseModel =
  mongoose.models.User || mongoose.model<IUser & Document>('User', UserMongooseSchema);

// ==========================================
// Kit Entity & Schema
// ==========================================

export interface IKitRecord {
  id: string;
  userId: string;
  kit: KitStructure;
  practiceProgress?: Record<string, { confidence: number; reviewedAt: string }>;
  createdAt: string;
  updatedAt: string;
}

const KitMongooseSchema = new Schema<IKitRecord & Document>({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  kit: { type: Schema.Types.Mixed, required: true },
  practiceProgress: { type: Schema.Types.Mixed, default: {} },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
});

export const KitMongooseModel =
  mongoose.models.Kit || mongoose.model<IKitRecord & Document>('Kit', KitMongooseSchema);

// ==========================================
// In-Memory Repository Fallback Store
// ==========================================

const inMemoryUsers: Map<string, IUser> = new Map();
const inMemoryKits: Map<string, IKitRecord> = new Map();

// Helper ID generator
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

// ==========================================
// User Repository
// ==========================================

export const UserRepository = {
  async findByEmail(email: string): Promise<IUser | null> {
    const normalized = email.toLowerCase().trim();
    if (!isUsingInMemoryStore()) {
      try {
        const doc = await UserMongooseModel.findOne({ email: normalized });
        if (doc) {
          return { id: doc._id.toString(), email: doc.email, passwordHash: doc.passwordHash, createdAt: doc.createdAt };
        }
      } catch {
        // Fall back to memory
      }
    }
    for (const user of inMemoryUsers.values()) {
      if (user.email === normalized) return user;
    }
    return null;
  },

  async findById(id: string): Promise<IUser | null> {
    if (!isUsingInMemoryStore()) {
      try {
        const doc = await UserMongooseModel.findById(id);
        if (doc) {
          return { id: doc._id.toString(), email: doc.email, passwordHash: doc.passwordHash, createdAt: doc.createdAt };
        }
      } catch {
        // Fall back to memory
      }
    }
    return inMemoryUsers.get(id) || null;
  },

  async create(email: string, plainPassword: string): Promise<IUser> {
    const normalized = email.toLowerCase().trim();
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(plainPassword, salt);

    if (!isUsingInMemoryStore()) {
      try {
        const doc = await UserMongooseModel.create({ email: normalized, passwordHash });
        return { id: doc._id.toString(), email: doc.email, passwordHash: doc.passwordHash, createdAt: doc.createdAt };
      } catch {
        // Fall back to memory
      }
    }

    const id = generateId('usr');
    const user: IUser = {
      id,
      email: normalized,
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    inMemoryUsers.set(id, user);
    return user;
  },

  async verifyPassword(plainPassword: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, passwordHash);
  },

  createToken(user: IUser): string {
    return jwt.sign({ userId: user.id, email: user.email }, config.jwtSecret, {
      expiresIn: '7d',
    });
  },

  verifyToken(token: string): { userId: string; email: string } | null {
    try {
      return jwt.verify(token, config.jwtSecret) as { userId: string; email: string };
    } catch {
      return null;
    }
  },
};

// ==========================================
// Kit Repository
// ==========================================

export const KitRepository = {
  async create(userId: string, kit: KitStructure): Promise<IKitRecord> {
    const id = generateId('kit');
    const now = new Date().toISOString();
    const record: IKitRecord = {
      id,
      userId,
      kit,
      practiceProgress: {},
      createdAt: now,
      updatedAt: now,
    };

    if (!isUsingInMemoryStore()) {
      try {
        await KitMongooseModel.create(record);
        return record;
      } catch {
        // Fall back to memory
      }
    }

    inMemoryKits.set(id, record);
    return record;
  },

  async findById(id: string): Promise<IKitRecord | null> {
    if (!isUsingInMemoryStore()) {
      try {
        const doc = await KitMongooseModel.findOne({ id });
        if (doc) {
          return {
            id: doc.id,
            userId: doc.userId,
            kit: doc.kit,
            practiceProgress: doc.practiceProgress,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
          };
        }
      } catch {
        // Fall back to memory
      }
    }
    return inMemoryKits.get(id) || null;
  },

  async findByUser(userId: string): Promise<IKitRecord[]> {
    if (!isUsingInMemoryStore()) {
      try {
        const docs = await KitMongooseModel.find({ userId }).sort({ createdAt: -1 });
        return docs.map((doc) => ({
          id: doc.id,
          userId: doc.userId,
          kit: doc.kit,
          practiceProgress: doc.practiceProgress,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
        }));
      } catch {
        // Fall back to memory
      }
    }

    const userKits: IKitRecord[] = [];
    for (const record of inMemoryKits.values()) {
      if (record.userId === userId) {
        userKits.push(record);
      }
    }
    return userKits.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async update(id: string, updates: Partial<IKitRecord>): Promise<IKitRecord | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated: IKitRecord = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (!isUsingInMemoryStore()) {
      try {
        await KitMongooseModel.updateOne({ id }, updated);
        return updated;
      } catch {
        // Fall back to memory
      }
    }

    inMemoryKits.set(id, updated);
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    if (!isUsingInMemoryStore()) {
      try {
        const res = await KitMongooseModel.deleteOne({ id });
        return (res.deletedCount || 0) > 0;
      } catch {
        // Fall back to memory
      }
    }
    return inMemoryKits.delete(id);
  },
};
