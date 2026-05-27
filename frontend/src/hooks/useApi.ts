// Hook personalizado para chamadas à API em TypeScript
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
} from '../types';
import { supabase } from '../lib/supabase';

/** Dev: `/api` → proxy Vite → backend local. Se `VITE_API_BASE_URL` for http(s) absoluto, usa direto (ex.: Render). */
function resolveApiBase(): string {
  const fromEnv = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
  if (fromEnv && /^https?:\/\//.test(fromEnv)) {
    return fromEnv;
  }
  if (import.meta.env.DEV) {
    return '/api';
  }
  return fromEnv || 'http://localhost:3333/api';
}

const API_BASE = resolveApiBase();

function syncQuery(sync?: boolean): string {
  if (sync === false) return '?sync=0';
  return '';
}

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const { data: { session } } = await supabase.auth.getSession();
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

  try {
    const response = await fetch(url, config);

    if (response.status === 401) {
      await supabase.auth.signOut();
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const err = errorData.error || `Erro ${response.status}`;
      const details = errorData.details;
      throw new Error(details ? `${err} — ${details}` : err);
    }

    if (response.status === 204) {
      return null as T;
    }

    return await response.json();
  } catch (error) {
    console.error(`Erro na API (${endpoint}):`, error);
    throw error;
  }
}

export function useApi() {
  const fixedIncomes = {
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
  };

  const fixedExpenses = {
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
  };

  const months = {
    getEntries: (year: number, month: number, options?: { sync?: boolean }) =>
      fetchApi<MonthEntry[]>(`/months/${year}/${month}${syncQuery(options?.sync)}`),
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
  };

  const cards = {
    getAll: () => fetchApi<Card[]>('/cards'),
    create: (data: Partial<Card>) =>
      fetchApi<Card>('/cards', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Card>) =>
      fetchApi<Card>(`/cards/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => fetchApi<void>(`/cards/${id}`, { method: 'DELETE' }),
  };

  const installments = {
    getAll: () => fetchApi<Installment[]>('/installments'),
    getByMonth: (year: number, month: number) =>
      fetchApi<InstallmentMonthView[]>(`/installments/month/${year}/${month}`),
    create: (data: Partial<Installment>) =>
      fetchApi<Installment>('/installments', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Installment>) =>
      fetchApi<Installment>(`/installments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => fetchApi<void>(`/installments/${id}`, { method: 'DELETE' }),
  };

  const savings = {
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
    getHistory: (id: number) => fetchApi<{ amount: number; date: string }[]>(`/savings/${id}/history`),
    delete: (id: number) => fetchApi<void>(`/savings/${id}`, { method: 'DELETE' }),
  };

  const dashboard = {
    getSummary: (year: number, month: number, options?: { sync?: boolean }) =>
      fetchApi<DashboardSummary>(
        `/dashboard/summary/${year}/${month}${syncQuery(options?.sync)}`
      ),
  };

  const settings = {
    get: () => fetchApi<Settings>('/settings'),
    update: (payday: number) =>
      fetchApi<Settings>('/settings', { method: 'PUT', body: JSON.stringify({ payday }) }),
  };

  const categories = {
    getAll: (type?: 'income' | 'expense') =>
      fetchApi<Category[]>(type ? `/categories?type=${type}` : '/categories'),
    create: (data: { name: string; type: 'income' | 'expense' }) =>
      fetchApi<Category>('/categories', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: { name: string }) =>
      fetchApi<Category>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => fetchApi<void>(`/categories/${id}`, { method: 'DELETE' }),
  };

  const budgets = {
    getByMonth: (year: number, month: number) =>
      fetchApi<MonthBudgetResponse>(`/budgets/${year}/${month}`),
    save: (year: number, month: number, budgets: { category: string; limitAmount: number }[]) =>
      fetchApi<{ message: string }>(`/budgets/${year}/${month}`, {
        method: 'PUT',
        body: JSON.stringify({ budgets }),
      }),
  };

  const agent = {
    chat: (message: string, pendingAction?: AgentPendingAction | null) =>
      fetchApi<AgentChatResponse>('/agent/chat', {
        method: 'POST',
        body: JSON.stringify({ message, pendingAction: pendingAction ?? null }),
      }),
  };

  return {
    fixedIncomes,
    fixedExpenses,
    months,
    cards,
    installments,
    savings,
    dashboard,
    settings,
    categories,
    budgets,
    agent,
  };
}

export default useApi;
