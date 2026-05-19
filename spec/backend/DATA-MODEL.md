# Modelo de Dados (Prisma)

Arquivo: `backend/prisma/schema.prisma` — SQLite `file:./fintrack.db`

## Entidades

### FixedIncome

| Campo | Tipo | Notas |
|-------|------|-------|
| id | Int PK | autoincrement |
| name, category | String | |
| amount | Float | |
| dayOfMonth | Int | 1–31 |
| active | Boolean | default true |

### FixedExpense

Igual + **paymentMethod** (String, ex: "Débito", "PIX").

### MonthEntry

Lançamento mensal (fixo replicado ou avulso).

| Campo | Tipo | Notas |
|-------|------|-------|
| year, month | Int | month 1–12 |
| type | String | `income` \| `expense` |
| description, category | String | |
| amount | Float | |
| date | String | `YYYY-MM-DD` |
| paymentMethod, note | String? | |
| isFixed | Boolean | default false |
| fixedRefId | Int? | ID do FixedIncome ou FixedExpense origem |

Índice lógico de sync: `(year, month, type, fixedRefId)`.

### Card

| Campo | Tipo | Notas |
|-------|------|-------|
| name, color | String | color hex default `#1a1a24` |
| lastFourDigits | String? | |
| closingDay, dueDay | Int | dias do mês |
| limit | Float | |
| installments | Installment[] | onDelete Cascade |

### Installment

| Campo | Tipo | Notas |
|-------|------|-------|
| description | String | |
| totalAmount | Float | |
| totalInstallments | Int | |
| currentInstallment | Int | default 1 — parcela já paga/consumida |
| firstPaymentDate | String | início da série |
| cardId | Int FK | |
| status | String | `active` \| `paid` |

### Saving

| Campo | Tipo | Notas |
|-------|------|-------|
| name, institution, type | String | |
| amount | Float | |
| history | SavingHistory[] | cascade delete |

### SavingHistory

| Campo | Tipo |
|-------|------|
| savingId | Int FK |
| amount | Float |
| date | DateTime default now |

### Settings

| Campo | Tipo | Notas |
|-------|------|-------|
| id | Int | fixo **1** |
| payday | Int | default 1 |

## Relacionamentos

```
Card 1──* Installment
Saving 1──* SavingHistory
```

Fixos **não** têm FK formal para MonthEntry — vínculo via `fixedRefId` + convenção de `type`.

## Seed

`backend/prisma/seed.js` — dados de exemplo (salário, aluguel, Nubank, MacBook 12x, reservas). Rodar após migrate.

## Migrações

Pasta `backend/prisma/migrations/`. Comando: `npx prisma migrate dev`.
