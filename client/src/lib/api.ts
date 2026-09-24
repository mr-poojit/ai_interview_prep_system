import { KitRecord, KitStructure, User } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

class ApiClient {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('prepkit_token');
  }

  public setToken(token: string | null): void {
    if (typeof window === 'undefined') return;
    if (token) {
      localStorage.setItem('prepkit_token', token);
    } else {
      localStorage.removeItem('prepkit_token');
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (res.status === 401 && typeof window !== 'undefined') {
        // If expired or invalid session, clear token
        if (!endpoint.includes('/login') && !endpoint.includes('/register')) {
          this.setToken(null);
        }
      }
      throw new Error(data.message || data.error || `HTTP ${res.status}`);
    }

    return data as T;
  }

  // Auth Endpoints
  async register(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await this.request<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.token);
    return res;
  }

  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await this.request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.token);
    return res;
  }

  async getMe(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/api/auth/me');
  }

  logout(): void {
    this.setToken(null);
  }

  // Kit Endpoints
  async getKits(): Promise<{ kits: KitRecord[] }> {
    return this.request<{ kits: KitRecord[] }>('/api/kits');
  }

  async getKit(id: string): Promise<{ kitRecord: KitRecord }> {
    return this.request<{ kitRecord: KitRecord }>(`/api/kits/${id}`);
  }

  async generateKit(jd: string, company_url: string, days: number): Promise<{ kitRecord: KitRecord }> {
    return this.request<{ kitRecord: KitRecord }>('/api/kits/generate', {
      method: 'POST',
      body: JSON.stringify({ jd, company_url, days }),
    });
  }

  async batchUpload(cases: Array<{ jd: string; company_url: string; days: number }>): Promise<{ createdCount: number; kits: KitRecord[] }> {
    return this.request<{ createdCount: number; kits: KitRecord[] }>('/api/kits/batch', {
      method: 'POST',
      body: JSON.stringify(cases),
    });
  }

  async updateKit(id: string, kit: KitStructure): Promise<{ kitRecord: KitRecord }> {
    return this.request<{ kitRecord: KitRecord }>(`/api/kits/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ kit }),
    });
  }

  async regenerateSection(
    id: string,
    targetType: 'category' | 'brief' | 'schedule',
    category?: string
  ): Promise<{ kitRecord: KitRecord }> {
    return this.request<{ kitRecord: KitRecord }>(`/api/kits/${id}/regenerate`, {
      method: 'POST',
      body: JSON.stringify({ targetType, category }),
    });
  }

  async deleteKit(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/kits/${id}`, {
      method: 'DELETE',
    });
  }

  // Practice & Creative Mode
  async recordConfidence(
    id: string,
    cardId: string,
    confidence: number
  ): Promise<{ practiceProgress: Record<string, { confidence: number; reviewedAt: string }> }> {
    return this.request<{ practiceProgress: Record<string, { confidence: number; reviewedAt: string }> }>(
      `/api/practice/${id}/confidence`,
      {
        method: 'POST',
        body: JSON.stringify({ cardId, confidence }),
      }
    );
  }

  async mockEvaluate(
    id: string,
    questionId: string,
    candidateAnswer: string
  ): Promise<{
    evaluation: {
      accuracy_score: number;
      structure_score: number;
      delivery_score: number;
      strengths: string[];
      missing_points: string[];
      improved_answer_sample: string;
    };
  }> {
    return this.request<{
      evaluation: {
        accuracy_score: number;
        structure_score: number;
        delivery_score: number;
        strengths: string[];
        missing_points: string[];
        improved_answer_sample: string;
      };
    }>(`/api/practice/${id}/mock-evaluate`, {
      method: 'POST',
      body: JSON.stringify({ questionId, candidateAnswer }),
    });
  }
}

export const api = new ApiClient();
