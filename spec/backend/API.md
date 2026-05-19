# API REST — Referência

Base: `{VITE_API_BASE_URL}` = `http://localhost:3333/api`

## Health

| Método | Rota | Resposta |
|--------|------|----------|
| GET | `/health` | `{ status, message }` |

## Fixed Incomes `/fixed-incomes`

| Método | Rota | Body / Notas |
|--------|------|----------------|
| GET | `/` | Lista ordenada por name |
| POST | `/` | `{ name, amount, dayOfMonth, category, active? }` |
| PUT | `/:id` | campos parciais |
| DELETE | `/:id` | 204 |

## Fixed Expenses `/fixed-expenses`

Igual a incomes + **`paymentMethod`** obrigatório no POST.

## Months `/months`

| Método | Rota | Body / Notas |
|--------|------|----------------|
| GET | `/:year/:month` | `MonthEntry[]` ordenado por date |
| POST | `/:year/:month/sync-fixed` | `{ message, created }` |
| POST | `/entry` | `{ year, month, type, description, amount, date, category, paymentMethod?, note?, isFixed? }` |
| PUT | `/entry/:id` | campos parciais; coerção year/month/amount |
| DELETE | `/entry/:id` | 204 |

`type`: `"income"` | `"expense"`

## Cards `/cards`

| Método | Rota | Body / Notas |
|--------|------|----------------|
| GET | `/` | inclui `installments` ativos |
| POST | `/` | `{ name, closingDay, dueDay, limit, lastFourDigits?, color? }` |
| PUT | `/:id` | parcial |
| DELETE | `/:id` | 204; cascade installments |

## Installments `/installments`

| Método | Rota | Body / Notas |
|--------|------|----------------|
| GET | `/` | com `card` |
| GET | `/month/:year/:month` | filtradas + `currentMonthInstallment`, `installmentAmount` |
| POST | `/` | `{ description, totalAmount, totalInstallments, firstPaymentDate, cardId, currentInstallment? }` |
| PUT | `/:id` | `{ description?, totalAmount?, totalInstallments?, currentInstallment?, status? }` |
| DELETE | `/:id` | 204 |

`status`: `"active"` | `"paid"`

## Savings `/savings`

| Método | Rota | Body / Notas |
|--------|------|----------------|
| GET | `/` | inclui últimos 5 `history` |
| POST | `/` | `{ name, type, amount, institution? }` — cria histórico inicial |
| PUT | `/:id` | `{ name?, institution?, type? }` — não altera amount |
| PATCH | `/:id/amount` | `{ amount }` — atualiza + novo `SavingHistory` |
| GET | `/:id/history` | últimos 10 |
| DELETE | `/:id` | 204 |

`type` sugeridos: `poupanca`, `cdb`, `tesouro`, `acoes`, `fiis`, `cripto`, `outros`

## Dashboard `/dashboard`

| Método | Rota | Resposta |
|--------|------|----------|
| GET | `/summary/:year/:month` | ver abaixo |

```typescript
{
  summary: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    totalInstallments: number;
    netBalance: number;  // balance - totalInstallments
  };
  nextDueCard: { name, dueDate, daysUntilDue } | null;
  lastEntries: MonthEntry[];  // 5 mais recentes por date
  sixMonthsData: { month, year, label, income, expense }[];
  monthInstallments: Installment[];  // enriquecidas
}
```

## Settings `/settings`

| Método | Rota | Body |
|--------|------|------|
| GET | `/` | `{ id, payday, updatedAt }` |
| PUT | `/` | `{ payday: 1-31 }` |

## Agent `/agent`

| Método | Rota | Body |
|--------|------|------|
| POST | `/chat` | `{ message, pendingAction? }` |

```typescript
// Resposta AgentChatResponse
{
  message: string;
  intention: 'add_entry' | 'delete_entry' | 'update_entry' | 'summary' | 'unknown';
  dataCaptured: Record<string, unknown>;
  pendencias: string[];
  action: string;
  result: string;
  needsConfirmation?: boolean;
  pendingAction?: { action: 'delete_entry'; entryId: number; preview: string } | null;
  options?: { id: number; label: string }[];
}
```

Exemplos de mensagem: `"gastei 45 no mercado hoje"`, `"resumo do mês"`, confirmação `"sim"` após pedido de exclusão.
