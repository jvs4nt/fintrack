import {
  FixedIncome,
  FixedExpense,
  MonthEntry,
  Card,
  Installment,
  InstallmentMonthView,
  Saving,
  DashboardSummary,
  Settings,
  AgentChatResponse,
  AgentPendingAction,
  Category,
  MonthBudgetResponse,
  SyncFixedResponse,
  PropagateFixedResponse,
} from '@/src/types';
import { NativeModules, Platform } from 'react-native';
import * as Device from 'expo-device';
import { supabase } from '@/src/lib/supabase';

const DEFAULT_API_BASE = 'http://localhost:3333/api';

/** Host da máquina que serve o JS (Metro), útil quando `.env` usa `localhost` no Expo Go no celular. */
function getDevPackagerHost(): string | null {
  if (!__DEV__) return null;
  const scriptURL = NativeModules.SourceCode?.scriptURL as string | undefined;
  if (!scriptURL) return null;
  try {
    const u = new URL(scriptURL.replace(/^\/\//, 'http://'));
    const h = u.hostname;
    if (h && h !== 'localhost' && h !== '127.0.0.1') return h;
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * - Emulador Android: `localhost` → `10.0.2.2` (host do Mac).
 * - Expo Go / device físico com `localhost` no `.env`: usa o mesmo host do Metro (LAN), senão o telefone fala com ele mesmo.
 * - Simulador iOS: mantém `localhost` se o bundle vier de localhost (backend no Mac em 127.0.0.1).
 */
function resolveApiBaseUrl(): string {
  const raw = (process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_API_BASE).replace(/\/$/, '');
  try {
    const url = new URL(raw);
    const loopback = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    if (!loopback) return raw;

    if (Platform.OS === 'android' && !Device.isDevice) {
      url.hostname = '10.0.2.2';
      return url.toString().replace(/\/$/, '');
    }

    const packagerHost = getDevPackagerHost();
    if (packagerHost) {
      url.hostname = packagerHost;
      return url.toString().replace(/\/$/, '');
    }

    return raw;
  } catch {
    return raw;
  }
}

const API_BASE = resolveApiBaseUrl();

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE}${path}`;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  const response = await fetch(url, config);

  if (response.status === 401) {
    await supabase.auth.signOut();
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const err = (errorData as { error?: string }).error || `Erro ${response.status}`;
    const details = (errorData as { details?: string }).details;
    throw new Error(details ? `${err} — ${details}` : err);
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}

export const api = {
  fixedIncomes: {
    getAll: () => fetchApi<FixedIncome[]>('/fixed-incomes'),
    create: (data: Partial<FixedIncome>) =>
      fetchApi<FixedIncome>('/fixed-incomes', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<FixedIncome>) =>
      fetchApi<FixedIncome>(`/fixed-incomes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => fetchApi<void>(`/fixed-incomes/${id}`, { method: 'DELETE' }),
    propagate: (
      id: number,
      data: { fromYear: number; fromMonth: number; scope: 'from-month' | 'future-only' }
    ) =>
      fetchApi<PropagateFixedResponse>(`/fixed-incomes/${id}/propagate`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  fixedExpenses: {
    getAll: () => fetchApi<FixedExpense[]>('/fixed-expenses'),
    create: (data: Partial<FixedExpense>) =>
      fetchApi<FixedExpense>('/fixed-expenses', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<FixedExpense>) =>
      fetchApi<FixedExpense>(`/fixed-expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => fetchApi<void>(`/fixed-expenses/${id}`, { method: 'DELETE' }),
    propagate: (
      id: number,
      data: { fromYear: number; fromMonth: number; scope: 'from-month' | 'future-only' }
    ) =>
      fetchApi<PropagateFixedResponse>(`/fixed-expenses/${id}/propagate`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  months: {
    getEntries: (year: number, month: number) => fetchApi<MonthEntry[]>(`/months/${year}/${month}`),
    syncFixed: (year: number, month: number, mode: 'create-only' | 'upsert' = 'create-only') =>
      fetchApi<SyncFixedResponse>(`/months/${year}/${month}/sync-fixed`, {
        method: 'POST',
        body: JSON.stringify({ mode }),
      }),
    createEntry: (data: Partial<MonthEntry>) =>
      fetchApi<MonthEntry>('/months/entry', { method: 'POST', body: JSON.stringify(data) }),
    updateEntry: (id: number, data: Partial<MonthEntry>) =>
      fetchApi<MonthEntry>(`/months/entry/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteEntry: (id: number) => fetchApi<void>(`/months/entry/${id}`, { method: 'DELETE' }),
  },

  cards: {
    getAll: () => fetchApi<Card[]>('/cards'),
    create: (data: Partial<Card>) =>
      fetchApi<Card>('/cards', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Card>) =>
      fetchApi<Card>(`/cards/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => fetchApi<void>(`/cards/${id}`, { method: 'DELETE' }),
  },

  installments: {
    getAll: () => fetchApi<Installment[]>('/installments'),
    getByMonth: (year: number, month: number) =>
      fetchApi<InstallmentMonthView[]>(`/installments/month/${year}/${month}`),
    create: (data: Partial<Installment>) =>
      fetchApi<Installment>('/installments', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Installment>) =>
      fetchApi<Installment>(`/installments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => fetchApi<void>(`/installments/${id}`, { method: 'DELETE' }),
  },

  savings: {
    getAll: () => fetchApi<Saving[]>('/savings'),
    create: (data: Partial<Saving>) =>
      fetchApi<Saving>('/savings', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Saving>) =>
      fetchApi<Saving>(`/savings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    updateAmount: (id: number, amount: number) =>
      fetchApi<Saving>(`/savings/${id}/amount`, {
        method: 'PATCH',
        body: JSON.stringify({ amount }),
      }),
    getHistory: (id: number) =>
      fetchApi<{ amount: number; date: string }[]>(`/savings/${id}/history`),
    delete: (id: number) => fetchApi<void>(`/savings/${id}`, { method: 'DELETE' }),
  },

  dashboard: {
    getSummary: (year: number, month: number) =>
      fetchApi<DashboardSummary>(`/dashboard/summary/${year}/${month}`),
  },

  settings: {
    get: () => fetchApi<Settings>('/settings'),
    update: (payday: number) =>
      fetchApi<Settings>('/settings', { method: 'PUT', body: JSON.stringify({ payday }) }),
  },

  categories: {
    getAll: (type?: 'income' | 'expense') =>
      fetchApi<Category[]>(type ? `/categories?type=${type}` : '/categories'),
    create: (data: { name: string; type: 'income' | 'expense' }) =>
      fetchApi<Category>('/categories', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: { name: string }) =>
      fetchApi<Category>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => fetchApi<void>(`/categories/${id}`, { method: 'DELETE' }),
  },

  budgets: {
    getByMonth: (year: number, month: number) =>
      fetchApi<MonthBudgetResponse>(`/budgets/${year}/${month}`),
    save: (year: number, month: number, budgets: { category: string; limitAmount: number }[]) =>
      fetchApi<{ message: string }>(`/budgets/${year}/${month}`, {
        method: 'PUT',
        body: JSON.stringify({ budgets }),
      }),
  },

  agent: {
    chat: (message: string, pendingAction?: AgentPendingAction | null) =>
      fetchApi<AgentChatResponse>('/agent/chat', {
        method: 'POST',
        body: JSON.stringify({ message, pendingAction: pendingAction ?? null }),
      }),
  },
} as const;
