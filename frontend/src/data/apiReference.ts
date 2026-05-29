// Fonte: spec/backend/API.md — manter em sync ao alterar o contrato da API.

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type ApiEndpoint = {
  method: HttpMethod;
  path: string;
  auth: boolean;
  summary: string;
  query?: string;
  requestBody?: string;
  response?: string;
  notes?: string;
};

export type ApiSection = {
  id: string;
  title: string;
  prefix: string;
  endpoints: ApiEndpoint[];
};

const FIXED_INCOME = `FixedIncome {
  id: number;
  name: string;
  amount: number;
  dayOfMonth: number;
  category: string;
  active: boolean;
  createdAt: string;
}`;

const FIXED_EXPENSE = `FixedExpense {
  id: number;
  name: string;
  amount: number;
  dayOfMonth: number;
  category: string;
  paymentMethod: string;
  active: boolean;
  createdAt: string;
}`;

const MONTH_ENTRY = `MonthEntry {
  id: number;
  year: number;
  month: number;
  type: "income" | "expense";
  description: string;
  amount: number;
  date: string;
  category: string;
  paymentMethod?: string;
  note?: string;
  isFixed: boolean;
  fixedRefId?: number;
  createdAt: string;
}`;

const CARD = `Card {
  id: number;
  name: string;
  lastFourDigits?: string;
  color: string;
  closingDay: number;
  dueDay: number;
  limit: number;
  createdAt: string;
  installments?: Installment[]; // ativos no GET /
}`;

const INSTALLMENT = `Installment {
  id: number;
  description: string;
  totalAmount: number;
  totalInstallments: number;
  currentInstallment: number;
  firstPaymentDate: string;
  cardId: number;
  card?: Card;
  status: "active" | "paid";
  createdAt: string;
}`;

export const API_SECTIONS: ApiSection[] = [
  {
    id: 'health',
    title: 'Health',
    prefix: '/api',
    endpoints: [
      {
        method: 'GET',
        path: '/api/health',
        auth: false,
        summary: 'Verificação de disponibilidade do backend.',
        response: `{ "status": string, "message": string }`,
      },
    ],
  },
  {
    id: 'fixed-incomes',
    title: 'Fixed Incomes',
    prefix: '/api/fixed-incomes',
    endpoints: [
      {
        method: 'GET',
        path: '/api/fixed-incomes',
        auth: true,
        summary: 'Lista ganhos fixos ordenados por name.',
        response: `FixedIncome[]\n\n${FIXED_INCOME}`,
      },
      {
        method: 'POST',
        path: '/api/fixed-incomes',
        auth: true,
        summary: 'Cria ganho fixo.',
        requestBody: `{
  "name": string,
  "amount": number | string,  // string pt-BR ex.: "1.234,56"
  "dayOfMonth": number,       // 1–31
  "category": string,
  "active"?: boolean
}`,
        response: FIXED_INCOME,
        notes: '400 se nome/categoria vazios, valor ≤ 0 ou dia fora de 1–31.',
      },
      {
        method: 'PUT',
        path: '/api/fixed-incomes/:id',
        auth: true,
        summary: 'Atualiza ganho fixo (campos parciais).',
        requestBody: 'Partial<FixedIncome>',
        response: FIXED_INCOME,
      },
      {
        method: 'POST',
        path: '/api/fixed-incomes/:id/propagate',
        auth: true,
        summary: 'Propaga alterações para lançamentos do mês.',
        requestBody: `{
  "fromYear": number,
  "fromMonth": number,
  "scope": "from-month" | "future-only"
}`,
        response: `{ "updated": number }`,
      },
      {
        method: 'DELETE',
        path: '/api/fixed-incomes/:id',
        auth: true,
        summary: 'Remove ganho fixo.',
        response: '204 No Content',
      },
    ],
  },
  {
    id: 'fixed-expenses',
    title: 'Fixed Expenses',
    prefix: '/api/fixed-expenses',
    endpoints: [
      {
        method: 'GET',
        path: '/api/fixed-expenses',
        auth: true,
        summary: 'Lista gastos fixos ordenados por name.',
        response: `FixedExpense[]\n\n${FIXED_EXPENSE}`,
      },
      {
        method: 'POST',
        path: '/api/fixed-expenses',
        auth: true,
        summary: 'Cria gasto fixo.',
        requestBody: `{
  "name": string,
  "amount": number | string,
  "dayOfMonth": number,
  "category": string,
  "paymentMethod": string,  // obrigatório
  "active"?: boolean
}`,
        response: FIXED_EXPENSE,
        notes: 'Mesmas validações 400 dos ganhos fixos.',
      },
      {
        method: 'PUT',
        path: '/api/fixed-expenses/:id',
        auth: true,
        summary: 'Atualiza gasto fixo (campos parciais).',
        requestBody: 'Partial<FixedExpense>',
        response: FIXED_EXPENSE,
      },
      {
        method: 'POST',
        path: '/api/fixed-expenses/:id/propagate',
        auth: true,
        summary: 'Propaga alterações para lançamentos do mês.',
        requestBody: `{
  "fromYear": number,
  "fromMonth": number,
  "scope": "from-month" | "future-only"
}`,
        response: `{ "updated": number }`,
      },
      {
        method: 'DELETE',
        path: '/api/fixed-expenses/:id',
        auth: true,
        summary: 'Remove gasto fixo.',
        response: '204 No Content',
      },
    ],
  },
  {
    id: 'categories',
    title: 'Categories',
    prefix: '/api/categories',
    endpoints: [
      {
        method: 'GET',
        path: '/api/categories',
        auth: true,
        summary: 'Lista categorias.',
        query: '?type=income | expense (opcional)',
        response: `Category[] { id, name, type: "income" | "expense" }`,
      },
      {
        method: 'POST',
        path: '/api/categories',
        auth: true,
        summary: 'Cria categoria.',
        requestBody: `{ "name": string, "type": "income" | "expense" }`,
        response: 'Category',
        notes: 'name trimado no servidor; 400 se vazio; 409 se duplicata (userId+name+type).',
      },
      {
        method: 'PUT',
        path: '/api/categories/:id',
        auth: true,
        summary: 'Renomeia categoria.',
        requestBody: `{ "name": string }`,
        response: 'Category',
        notes: 'Renomeia também em MonthEntry, fixos e budgets.',
      },
      {
        method: 'DELETE',
        path: '/api/categories/:id',
        auth: true,
        summary: 'Remove categoria.',
        response: '204 No Content',
        notes: '409 se categoria em uso.',
      },
    ],
  },
  {
    id: 'budgets',
    title: 'Budgets',
    prefix: '/api/budgets',
    endpoints: [
      {
        method: 'GET',
        path: '/api/budgets/:year/:month',
        auth: true,
        summary: 'Metas do mês com gasto e percentual.',
        response: `{
  "budgets": [{
    "category": string,
    "limit": number,
    "spent": number,
    "percent": number,
    "status": "ok" | "warning" | "exceeded"
  }],
  "alerts": [{ "category", "status": "warning" | "exceeded", "percent" }]
}`,
        notes: 'warning ≥ 80%; exceeded ≥ 100%.',
      },
      {
        method: 'PUT',
        path: '/api/budgets/:year/:month',
        auth: true,
        summary: 'Salva metas (upsert).',
        requestBody: `{
  "budgets": [{ "category": string, "limitAmount": number }]
}`,
        response: `{ "message": string }`,
        notes: 'limitAmount <= 0 remove a meta da categoria.',
      },
    ],
  },
  {
    id: 'months',
    title: 'Months',
    prefix: '/api/months',
    endpoints: [
      {
        method: 'GET',
        path: '/api/months/:year/:month',
        auth: true,
        summary: 'Lançamentos do mês ordenados por date.',
        query: '?sync=0 | ?sync=false — pula sync de fixos (padrão: create-only antes da listagem)',
        response: `MonthEntry[]\n\n${MONTH_ENTRY}`,
        notes: '400 se ano/mês inválidos.',
      },
      {
        method: 'POST',
        path: '/api/months/:year/:month/sync-fixed',
        auth: true,
        summary: 'Sincroniza fixos no mês.',
        requestBody: `{ "mode"?: "create-only" | "upsert" }`,
        response: `{ "message": string, "created": number, "updated": number }`,
        notes:
          'Normaliza duplicatas (mesmo type + fixedRefId, mantém menor id). 500 { error }; fora de production pode incluir { details }.',
      },
      {
        method: 'POST',
        path: '/api/months/entry',
        auth: true,
        summary: 'Cria lançamento no mês.',
        requestBody: `{
  "year": number,
  "month": number,
  "type": "income" | "expense",
  "description": string,
  "amount": number,
  "date": string,
  "category": string,
  "paymentMethod"?: string,
  "note"?: string,
  "isFixed"?: boolean
}`,
        response: MONTH_ENTRY,
      },
      {
        method: 'PUT',
        path: '/api/months/entry/:id',
        auth: true,
        summary: 'Atualiza lançamento (parcial; coerção year/month/amount).',
        requestBody: 'Partial<MonthEntry>',
        response: MONTH_ENTRY,
      },
      {
        method: 'DELETE',
        path: '/api/months/entry/:id',
        auth: true,
        summary: 'Remove lançamento.',
        response: '204 No Content',
        notes: 'Se isFixed, grava FixedMonthSkip para o sync não recriar.',
      },
    ],
  },
  {
    id: 'cards',
    title: 'Cards',
    prefix: '/api/cards',
    endpoints: [
      {
        method: 'GET',
        path: '/api/cards',
        auth: true,
        summary: 'Lista cartões com parcelamentos ativos.',
        response: `Card[] (com installments ativos)\n\n${CARD}`,
      },
      {
        method: 'POST',
        path: '/api/cards',
        auth: true,
        summary: 'Cria cartão.',
        requestBody: `{
  "name": string,
  "closingDay": number,
  "dueDay": number,
  "limit": number,
  "lastFourDigits"?: string,
  "color"?: string
}`,
        response: CARD,
      },
      {
        method: 'PUT',
        path: '/api/cards/:id',
        auth: true,
        summary: 'Atualiza cartão (parcial).',
        requestBody: 'Partial<Card>',
        response: CARD,
      },
      {
        method: 'DELETE',
        path: '/api/cards/:id',
        auth: true,
        summary: 'Remove cartão e parcelas (cascade).',
        response: '204 No Content',
      },
    ],
  },
  {
    id: 'installments',
    title: 'Installments',
    prefix: '/api/installments',
    endpoints: [
      {
        method: 'GET',
        path: '/api/installments',
        auth: true,
        summary: 'Lista parcelamentos com card.',
        response: `Installment[]\n\n${INSTALLMENT}`,
      },
      {
        method: 'GET',
        path: '/api/installments/month/:year/:month',
        auth: true,
        summary: 'Parcelas do mês com valor da parcela atual.',
        response: `Installment + {
  currentMonthInstallment: number;
  installmentAmount: number;
}[]`,
      },
      {
        method: 'POST',
        path: '/api/installments',
        auth: true,
        summary: 'Cria parcelamento.',
        requestBody: `{
  "description": string,
  "totalAmount": number,
  "totalInstallments": number,
  "firstPaymentDate": string,
  "cardId": number,
  "currentInstallment"?: number
}`,
        response: INSTALLMENT,
      },
      {
        method: 'PUT',
        path: '/api/installments/:id',
        auth: true,
        summary: 'Atualiza parcelamento.',
        requestBody: `{
  "description"?: string,
  "totalAmount"?: number,
  "totalInstallments"?: number,
  "currentInstallment"?: number,
  "status"?: "active" | "paid"
}`,
        response: INSTALLMENT,
      },
      {
        method: 'DELETE',
        path: '/api/installments/:id',
        auth: true,
        summary: 'Remove parcelamento.',
        response: '204 No Content',
      },
    ],
  },
  {
    id: 'savings',
    title: 'Savings',
    prefix: '/api/savings',
    endpoints: [
      {
        method: 'GET',
        path: '/api/savings',
        auth: true,
        summary: 'Lista reservas com últimos 5 history.',
        response: `Saving[] + history (últimos 5)`,
        notes: 'type sugeridos: poupanca, cdb, tesouro, acoes, fiis, cripto, outros',
      },
      {
        method: 'POST',
        path: '/api/savings',
        auth: true,
        summary: 'Cria reserva e histórico inicial.',
        requestBody: `{
  "name": string,
  "type": string,
  "amount": number,
  "institution"?: string
}`,
        response: 'Saving',
      },
      {
        method: 'PUT',
        path: '/api/savings/:id',
        auth: true,
        summary: 'Atualiza metadados (não altera amount).',
        requestBody: `{ "name"?: string, "institution"?: string, "type"?: string }`,
        response: 'Saving',
      },
      {
        method: 'PATCH',
        path: '/api/savings/:id/amount',
        auth: true,
        summary: 'Atualiza valor e registra SavingHistory.',
        requestBody: `{ "amount": number }`,
        response: 'Saving',
      },
      {
        method: 'GET',
        path: '/api/savings/:id/history',
        auth: true,
        summary: 'Histórico de valores da reserva.',
        response: `{ "amount": number, "date": string }[]  // últimos 10`,
      },
      {
        method: 'DELETE',
        path: '/api/savings/:id',
        auth: true,
        summary: 'Remove reserva.',
        response: '204 No Content',
      },
    ],
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    prefix: '/api/dashboard',
    endpoints: [
      {
        method: 'GET',
        path: '/api/dashboard/summary/:year/:month',
        auth: true,
        summary: 'Resumo do mês para o dashboard.',
        query: '?sync=0 | ?sync=false — pula sync de fixos',
        response: `{
  "summary": {
    "totalIncome": number,
    "totalExpense": number,
    "balance": number,
    "totalInstallments": number,
    "netBalance": number  // balance - totalInstallments
  },
  "nextDueCard": { "name", "dueDate", "daysUntilDue" } | null,
  "lastEntries": MonthEntry[],       // 5 mais recentes
  "sixMonthsData": { "month", "year", "label", "income", "expense" }[],
  "monthInstallments": Installment[] // enriquecidas
}`,
      },
    ],
  },
  {
    id: 'settings',
    title: 'Settings',
    prefix: '/api/settings',
    endpoints: [
      {
        method: 'GET',
        path: '/api/settings',
        auth: true,
        summary: 'Configurações do usuário.',
        response: `{ "id" | "userId": string, "payday": number, "updatedAt": string }`,
      },
      {
        method: 'PUT',
        path: '/api/settings',
        auth: true,
        summary: 'Atualiza dia do recebimento.',
        requestBody: `{ "payday": number }  // 1–31`,
        response: 'Settings',
      },
    ],
  },
  {
    id: 'agent',
    title: 'Agent',
    prefix: '/api/agent',
    endpoints: [
      {
        method: 'POST',
        path: '/api/agent/chat',
        auth: true,
        summary: 'Chat com o agente financeiro.',
        requestBody: `{
  "message": string,
  "pendingAction"?: {
    "action": "delete_entry",
    "entryId": number,
    "preview": string
  } | null
}`,
        response: `{
  "message": string,
  "intention": "add_entry" | "delete_entry" | "update_entry" | "summary" | "unknown",
  "dataCaptured": Record<string, unknown>,
  "pendencias": string[],
  "action": string,
  "result": string,
  "needsConfirmation"?: boolean,
  "pendingAction"?: { "action": "delete_entry", "entryId", "preview" } | null,
  "options"?: { "id": number, "label": string }[]
}`,
        notes:
          'Ex.: "gastei 45 no mercado hoje", "resumo do mês"; confirmação "sim" após pedido de exclusão.',
      },
    ],
  },
];
