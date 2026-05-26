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
import Constants from 'expo-constants';
import { NativeModules, Platform } from 'react-native';
import * as Device from 'expo-device';
import { getSessionSafe, recoverStaleAuthSession } from '@/src/lib/authSession';

const DEFAULT_API_BASE = 'http://localhost:3333/api';

function hostFromHostUri(hostUri: string | undefined): string | null {
  if (!hostUri) return null;
  const hostname = hostUri.split(':')[0]?.trim();
  if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') return hostname;
  return null;
}

/** Host da máquina que serve o JS (Metro) — mesmo IP que o Expo Go usa para o bundle. */
function getDevPackagerHost(): string | null {
  if (!__DEV__) return null;

  const fromConstants =
    hostFromHostUri(Constants.expoConfig?.hostUri) ??
    hostFromHostUri(Constants.expoGoConfig?.debuggerHost);
  if (fromConstants) return fromConstants;

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
 * - Emulador Android: host do Mac via `10.0.2.2`.
 * - Dev (Expo Go / simulador): host do Metro (scriptURL) — o telefone já alcança esse IP para o bundle.
 * - Produção ou sem Metro: `EXPO_PUBLIC_API_BASE_URL` do `.env`.
 */
function resolveApiBaseUrl(): string {
  const raw = (process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_API_BASE).replace(/\/$/, '');
  try {
    const url = new URL(raw);

    if (Platform.OS === 'android' && !Device.isDevice) {
      url.hostname = '10.0.2.2';
      return url.toString().replace(/\/$/, '');
    }

    if (__DEV__) {
      const packagerHost = getDevPackagerHost();
      if (packagerHost) {
        url.hostname = packagerHost;
        return url.toString().replace(/\/$/, '');
      }
    }

    const loopback = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    if (!loopback) return raw;

    return raw;
  } catch {
    return raw;
  }
}

const API_BASE = resolveApiBaseUrl();

function syncQuery(sync?: boolean): string {
  if (sync === false) return '?sync=0';
  return '';
}

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE}${path}`;

  const session = await getSessionSafe();
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

  let response: Response;
  try {
    response = await fetch(url, config);
  } catch (e) {
    const packager = getDevPackagerHost();
    const hint = __DEV__
      ? Platform.OS === 'android' && !Device.isDevice
        ? ' No emulador, inicie o backend no Mac (porta 3333).'
        : packager
          ? ` URL usada: ${API_BASE} (host do Metro: ${packager}). Backend rodando nessa máquina?`
          : ` URL usada: ${API_BASE}. Atualize EXPO_PUBLIC_API_BASE_URL ou abra via Expo Go na mesma rede.`
      : '';
    const msg = e instanceof Error ? e.message : 'Falha de rede';
    throw new Error(
      msg.toLowerCase().includes('network request failed') || msg.toLowerCase().includes('failed to fetch')
        ? `Não foi possível conectar ao servidor.${hint}`
        : msg
    );
  }

  if (response.status === 401) {
    await recoverStaleAuthSession();
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
    getSummary: (year: number, month: number, options?: { sync?: boolean }) =>
      fetchApi<DashboardSummary>(
        `/dashboard/summary/${year}/${month}${syncQuery(options?.sync)}`
      ),
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
