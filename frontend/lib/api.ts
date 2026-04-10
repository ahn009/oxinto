/**
 * Centralized API client for the Smart Product Advisor backend.
 * Throws on non-ok responses with the server's error message.
 * No auto-redirect — callers handle 401 themselves.
 */

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('smart_token');
}

export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Generic fetch wrapper. Throws Error with server message on non-ok status. */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...(options.headers as Record<string, string> || {}),
  };

  const res = await fetch(path, { ...options, headers });
  let json: unknown;
  try { json = await res.json(); } catch { json = {}; }

  if (!res.ok) {
    const message = (json as Record<string, string>).error || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return json as T;
}

// ── Auth ───────────────────────────────────────────────────────────────────

export async function login(email: string, password: string) {
  return request<{ token: string; user: User }>('/api/auth/login', {
    method: 'POST', body: JSON.stringify({ email, password }),
  });
}

export async function signup(name: string, email: string, password: string) {
  return request<{ token: string; user: User }>('/api/auth/signup', {
    method: 'POST', body: JSON.stringify({ name, email, password }),
  });
}

export async function sendOtp(name: string, email: string, password: string) {
  return request<{ tempUserId: string }>('/api/auth/send-otp', {
    method: 'POST', body: JSON.stringify({ name, email, password }),
  });
}

export async function verifyOtp(tempUserId: string, otp: string) {
  return request<{ token: string; user: User }>('/api/auth/verify-otp', {
    method: 'POST', body: JSON.stringify({ tempUserId, otp }),
  });
}

export async function resendOtp(tempUserId: string) {
  return request<{ success: boolean }>('/api/auth/resend-otp', {
    method: 'POST', body: JSON.stringify({ tempUserId }),
  });
}

export async function logout() {
  return request<{ message: string }>('/api/auth/logout', { method: 'POST' });
}

/**
 * Verify the stored JWT is still valid.
 * Backend returns { user: {...}, recentActivity: [...] }
 */
export async function getMe(): Promise<User> {
  const data = await request<{ user: User }>('/api/auth/me');
  return data.user;
}

export async function forgotPassword(email: string) {
  return request<{ success: boolean; resetId?: string; message?: string }>('/api/auth/forgot-password', {
    method: 'POST', body: JSON.stringify({ email }),
  });
}

export async function resetPassword(resetId: string, otp: string, newPassword: string) {
  return request<{ success: boolean; message: string }>('/api/auth/reset-password', {
    method: 'POST', body: JSON.stringify({ resetId, otp, newPassword }),
  });
}

// ── Chat / Webhook ─────────────────────────────────────────────────────────

export async function sendWebMessage(
  userId: string,
  message: string,
  language: string,
  sessionId?: string | null,
): Promise<BotResponse> {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const body: Record<string, unknown> = { userId, message, language };
  if (sessionId) body.sessionId = sessionId;

  const res = await fetch('/api/webhook/web', { method: 'POST', headers, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

// ── Products ───────────────────────────────────────────────────────────────

export async function getProducts(category?: string) {
  const url = category ? `/api/products?category=${encodeURIComponent(category)}` : '/api/products';
  return request<{ products: unknown[] }>(url);
}

// ── Health ─────────────────────────────────────────────────────────────────

export async function healthCheck() {
  return request<{ status: string }>('/api/health');
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
  lastSeen?: string;
}

export interface BotResponse {
  sessionId: string;
  isComplete: boolean;
  questionNumber: number;
  totalQuestions: number;
  response?: string;
  question?: { options?: { en?: string[]; pt?: string[] } };
  offers?: Offers;
}

export interface Product {
  name: string;
  price: number;
  description?: string;
  score?: number;
  reason?: string;
  tags?: string[];
}

export interface Bundle {
  items: string[];
  discountPercent: number;
  totalPrice: number;
  savings: number;
}

export interface Offers {
  basic?: Product[];
  intermediate?: Product[];
  premium?: { product: Product; bundle?: Bundle };
}
