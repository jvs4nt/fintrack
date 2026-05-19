// Tipos Globais para a API do FinTrack

export interface FixedIncome {
  id: number;
  name: string;
  amount: number;
  dayOfMonth: number;
  category: string;
  active: boolean;
  createdAt: string;
}

export interface FixedExpense {
  id: number;
  name: string;
  amount: number;
  dayOfMonth: number;
  category: string;
  paymentMethod: string;
  active: boolean;
  createdAt: string;
}

export interface MonthEntry {
  id: number;
  year: number;
  month: number;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  date: string;
  category: string;
  paymentMethod?: string;
  note?: string;
  isFixed: boolean;
  fixedRefId?: number;
  createdAt: string;
}

export interface Card {
  id: number;
  name: string;
  lastFourDigits?: string;
  color: string;
  closingDay: number;
  dueDay: number;
  limit: number;
  createdAt: string;
}

export interface Installment {
  id: number;
  description: string;
  totalAmount: number;
  totalInstallments: number;
  currentInstallment: number;
  firstPaymentDate: string;
  cardId: number;
  card?: Card;
  status: 'active' | 'paid';
  createdAt: string;
}

export interface Saving {
  id: number;
  name: string;
  institution: string;
  type: string;
  amount: number;
  updatedAt: string;
  createdAt: string;
}

export interface DashboardSummary {
  summary: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
  };
  nextDueCard: {
    name: string;
    daysUntilDue: number;
  } | null;
  lastEntries: MonthEntry[];
  sixMonthsData: {
    label: string;
    income: number;
    expense: number;
  }[];
}

export interface Settings {
  id: number;
  payday: number;
  updatedAt: string;
}

export interface AgentPendingAction {
  action: 'delete_entry';
  entryId: number;
  preview: string;
}

export interface AgentOption {
  id: number;
  label: string;
}

export interface AgentChatResponse {
  message: string;
  intention: 'add_entry' | 'delete_entry' | 'update_entry' | 'summary' | 'unknown';
  dataCaptured: Record<string, unknown>;
  pendencias: string[];
  action: string;
  result: string;
  needsConfirmation?: boolean;
  pendingAction?: AgentPendingAction | null;
  options?: AgentOption[];
}
