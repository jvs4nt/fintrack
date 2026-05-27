# Modelo de Dados (Prisma)

Arquivo: `backend/prisma/schema.prisma` — **PostgreSQL** (Supabase).  
`DATABASE_URL` (pooler) + `DIRECT_URL` (migrations).

Todas as entidades de negócio têm **`userId`** (UUID Supabase Auth), exceto `SavingHistory` e `Installment` (escopo via relação).

## Entidades

### FixedIncome / FixedExpense

| Campo | Tipo | Notas |
|-------|------|-------|
| userId | String | dono dos dados |
| id | Int PK | autoincrement |
| name, category | String | |
| amount | Float | |
| dayOfMonth | Int | 1–31 |
| active | Boolean | default true |

`FixedExpense` inclui **paymentMethod**.

### MonthEntry

| Campo | Tipo | Notas |
|-------|------|-------|
| userId | String | |
| year, month | Int | month 1–12 |
| type | String | `income` \| `expense` |
| isFixed | Boolean | default false |
| fixedRefId | Int? | ID do fixo origem |

Índice lógico de sync: `(userId, year, month, type, fixedRefId)` — no máximo um lançamento por fixo/mês; o sync apaga duplicatas retornando o registro de **menor `id`**.

### FixedMonthSkip

Registra exclusão intencional de um fixo **em um mês** — o sync não recria o `MonthEntry`.

| Campo | Tipo |
|-------|------|
| userId, year, month, type, fixedRefId | |

`@@unique([userId, year, month, type, fixedRefId])`

Criado em `DELETE /months/entry/:id` quando `isFixed && fixedRefId`. Removido ao excluir o fixo pai.

### Card / Installment / Saving / SavingHistory

Igual à versão anterior; `Card` e `Saving` com `userId`. `Installment` via `cardId`; `SavingHistory` via `savingId`.

### Category

`@@unique([userId, name, type])`

### MonthlyBudget

`@@unique([userId, year, month, category])`

### Settings

| Campo | Tipo | Notas |
|-------|------|-------|
| userId | String | **PK** |
| payday | Int | default 1 |

## Relacionamentos

```
Card 1──* Installment
Saving 1──* SavingHistory
```

Fixos **não** têm FK formal para MonthEntry — vínculo via `fixedRefId` + `type`.

## Seed

`backend/prisma/seed.js` — requer `SEED_USER_ID` no `.env` (UUID do usuário após login).  
`npm run seed` na pasta `backend/`.

## Migrações

- Ativas: `backend/prisma/migrations/` (PostgreSQL).
- Legado SQLite: `backend/prisma/migrations_sqlite_legacy/` (referência apenas).

Comando: `npx prisma migrate dev` (usa `DIRECT_URL`).
