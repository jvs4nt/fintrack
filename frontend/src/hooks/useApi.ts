// Hook personalizado para chamadas à API em TypeScript
import { 
  FixedIncome, 
  FixedExpense, 
  MonthEntry, 
  Card, 
  Installment, 
  Saving, 
  DashboardSummary,
  Settings,
  AgentChatResponse,
  AgentPendingAction
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3333/api';

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ${response.status}`);
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
    create: (data: Partial<FixedIncome>) => fetchApi<FixedIncome>('/fixed-incomes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: number, data: Partial<FixedIncome>) => fetchApi<FixedIncome>(`/fixed-incomes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: number) => fetchApi<void>(`/fixed-incomes/${id}`, {
      method: 'DELETE',
    }),
  };

  const fixedExpenses = {
    getAll: () => fetchApi<FixedExpense[]>('/fixed-expenses'),
    create: (data: Partial<FixedExpense>) => fetchApi<FixedExpense>('/fixed-expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: number, data: Partial<FixedExpense>) => fetchApi<FixedExpense>(`/fixed-expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: number) => fetchApi<void>(`/fixed-expenses/${id}`, {
      method: 'DELETE',
    }),
  };

  const months = {
    getEntries: (year: number, month: number) => fetchApi<MonthEntry[]>(`/months/${year}/${month}`),
    syncFixed: (year: number, month: number) => fetchApi<{ message: string; created: number }>(`/months/${year}/${month}/sync-fixed`, {
      method: 'POST',
    }),
    createEntry: (data: Partial<MonthEntry>) => fetchApi<MonthEntry>('/months/entry', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    updateEntry: (id: number, data: Partial<MonthEntry>) => fetchApi<MonthEntry>(`/months/entry/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    deleteEntry: (id: number) => fetchApi<void>(`/months/entry/${id}`, {
      method: 'DELETE',
    }),
  };

  const cards = {
    getAll: () => fetchApi<Card[]>('/cards'),
    create: (data: Partial<Card>) => fetchApi<Card>('/cards', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: number, data: Partial<Card>) => fetchApi<Card>(`/cards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: number) => fetchApi<void>(`/cards/${id}`, {
      method: 'DELETE',
    }),
  };

  const installments = {
    getAll: () => fetchApi<Installment[]>('/installments'),
    getByMonth: (year: number, month: number) => fetchApi<Installment[]>(`/installments/month/${year}/${month}`),
    create: (data: Partial<Installment>) => fetchApi<Installment>('/installments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: number, data: Partial<Installment>) => fetchApi<Installment>(`/installments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: number) => fetchApi<void>(`/installments/${id}`, {
      method: 'DELETE',
    }),
  };

  const savings = {
    getAll: () => fetchApi<Saving[]>('/savings'),
    create: (data: Partial<Saving>) => fetchApi<Saving>('/savings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: number, data: Partial<Saving>) => fetchApi<Saving>(`/savings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    updateAmount: (id: number, amount: number) => fetchApi<Saving>(`/savings/${id}/amount`, {
      method: 'PATCH',
      body: JSON.stringify({ amount }),
    }),
    getHistory: (id: number) => fetchApi<any[]>(`/savings/${id}/history`),
    delete: (id: number) => fetchApi<void>(`/savings/${id}`, {
      method: 'DELETE',
    }),
  };

  const dashboard = {
    getSummary: (year: number, month: number) => fetchApi<DashboardSummary>(`/dashboard/summary/${year}/${month}`),
  };

  const settings = {
    get: () => fetchApi<Settings>('/settings'),
    update: (payday: number) => fetchApi<Settings>('/settings', {
      method: 'PUT',
      body: JSON.stringify({ payday }),
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
    agent,
  };
}

export default useApi;
