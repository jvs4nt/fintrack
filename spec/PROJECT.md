# FinTrack — Visão do Projeto

## Propósito

Organizador financeiro pessoal (pt-BR): ganhos/gastos fixos, lançamentos mensais, cartões com parcelas, reservas/investimentos, dashboard e assistente por linguagem natural.

## Stack

| Camada | Tecnologias |
|--------|-------------|
| Backend | Node.js, Express 4, Prisma 6, SQLite, TypeScript, tsx |
| Frontend | React 18, Vite 6, TypeScript, CSS puro (sem UI lib) |
| Auth | Nenhuma (app local/single-user) |

## Portas e env

- API: `http://localhost:3333` — `PORT`, `CORS_ORIGIN`, `DATABASE_URL`, `NODE_ENV`
- UI: `http://localhost:5173` — `VITE_API_BASE_URL` (default `http://localhost:3333/api`)

## Módulos funcionais

1. **Fixos** — `FixedIncome` / `FixedExpense` replicados em `MonthEntry` via sync.
2. **Meses** — CRUD de `MonthEntry` por ano/mês; sync explícito ou implícito no dashboard.
3. **Cartões** — `Card` + `Installment`; parcela mensal calculada por `firstPaymentDate`.
4. **Reservas** — `Saving` + `SavingHistory` ao atualizar valor.
5. **Dashboard** — agrega mês, sync fixos, gráfico 6 meses, próximo vencimento de cartão.
6. **Settings** — `payday` (dia 1–31) define mês de planejamento no frontend.
7. **Agente** — parser rule-based em `routes/agent.ts` (sem LLM externo).

## Fluxo de dados principal

```
FixedIncome/FixedExpense (ativos)
        │ sync-fixed ou GET dashboard/summary
        ▼
   MonthEntry (year, month, type, fixedRefId)
        │
        ├── Dashboard (totais, últimos 5, 6 meses)
        ├── Months (UI por mês)
        └── Agent (add/delete/update/summary via chat)
```

## Estado da migração

- Backend e frontend estão em **TypeScript** (`.ts`/`.tsx`).
- `README.md` raiz ainda cita `.js`/`.jsx` — ignorar; usar `spec/`.

## Comandos úteis

```bash
# Backend (pasta backend/)
npm install && npx prisma generate
npx prisma migrate dev
npm run dev          # tsx watch server.ts

# Frontend (pasta frontend/)
npm install && npm run dev
```
