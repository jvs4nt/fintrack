# API REST — Referência

Base: `{VITE_API_BASE_URL}` = `http://localhost:3333/api`

## Autenticação

Todas as rotas `/api/*` **exceto** `GET /health` exigem:

```
Authorization: Bearer <access_token>
```

Token: sessão Supabase (`session.access_token`) enviada pelo `useApi`.

| Status | Significado |
|--------|-------------|
| 401 | Token ausente, inválido ou expirado |

Dados filtrados por `userId` do JWT — cada usuário vê apenas seus registros.

## Health

| Método | Rota | Auth | Resposta |
|--------|------|------|----------|
| GET | `/health` | Não | `{ status, message }` |

## Fixed Incomes `/fixed-incomes`

| Método | Rota | Body / Notas |
|--------|------|----------------|
| GET | `/` | Lista ordenada por name |
| POST | `/` | `{ name, amount, dayOfMonth, category, active? }` — `amount` pode ser número ou string pt-BR (ex. `"1.234,56"`); 400 com mensagem específica se nome/categoria vazios, valor ≤ 0 ou dia fora de 1–31 |
| PUT | `/:id` | campos parciais |
| POST | `/:id/propagate` | `{ fromYear, fromMonth, scope }` → `{ updated }` — `scope`: `from-month` \| `future-only` |
| DELETE | `/:id` | 204 |

## Fixed Expenses `/fixed-expenses`

Igual a incomes + **`paymentMethod`** obrigatório no POST + `POST /:id/propagate`.

## Categories `/categories`

| Método | Rota | Body / Notas |
|--------|------|----------------|
| GET | `/?type=income\|expense` | Lista ordenada por name |
| POST | `/` | `{ name, type }` |
| PUT | `/:id` | `{ name }` — renomeia em `MonthEntry`, fixos e budgets |
| DELETE | `/:id` | 204 ou 409 se em uso |

## Budgets `/budgets`

| Método | Rota | Body / Notas |
|--------|------|----------------|
| GET | `/:year/:month` | `{ budgets: [{ category, limit, spent, percent, status }], alerts }` — `status`: `ok` \| `warning` (≥80%) \| `exceeded` (≥100%) |
| PUT | `/:year/:month` | `{ budgets: [{ category, limitAmount }] }` — upsert; `limitAmount <= 0` remove meta |

## Months `/months`

| Método | Rota | Body / Notas |
|--------|------|----------------|
| GET | `/:year/:month` | `MonthEntry[]` ordenado por date — por padrão roda `syncFixedForMonth` (`create-only`) antes da listagem; `?sync=0` ou `?sync=false` pula o sync; 400 se ano/mês inválidos |
| POST | `/:year/:month/sync-fixed` | `{ mode?: 'create-only' \| 'upsert' }` → `{ message, created, updated }` — normaliza duplicatas de fixo no mês (mesmo `type` + `fixedRefId`, mantém o menor `id`); 400 se ano/mês inválidos; 500 `{ error }` e, fora de `production`, `{ details }` (mensagem interna para depuração) |
| POST | `/entry` | `{ year, month, type, description, amount, date, category, paymentMethod?, note?, isFixed? }` |
| PUT | `/entry/:id` | campos parciais; coerção year/month/amount |
| DELETE | `/entry/:id` | 204 — se `isFixed`, grava `FixedMonthSkip` para o sync não recriar |

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
| GET | `/summary/:year/:month` | ver abaixo — por padrão sync de fixos no mês; `?sync=0` ou `?sync=false` pula; leituras de parcelas/cartões/gráfico 6 meses em paralelo no servidor |

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
