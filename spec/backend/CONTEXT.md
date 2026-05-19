# Backend — Contexto

## Entry point

`backend/server.ts` — Express, CORS, `express.json()`, logging, montagem de rotas, health, 404, error handler.

## Estrutura

```
backend/
├── server.ts
├── prisma/
│   ├── schema.prisma      # SQLite file:./fintrack.db
│   ├── client.ts          # Singleton PrismaClient
│   ├── seed.js
│   └── migrations/
└── routes/
    ├── fixedIncomes.ts
    ├── fixedExpenses.ts   # espelha fixedIncomes (campo paymentMethod)
    ├── months.ts
    ├── cards.ts
    ├── installments.ts
    ├── savings.ts
    ├── dashboard.ts
    ├── settings.ts
    └── agent.ts           # chat rule-based
```

## Prisma

- Import: `import prisma from '../prisma/client'`
- Provider: SQLite
- Sem transações explícitas; loops sequenciais no sync de fixos

## Padrão de rota

```typescript
router.get('/', async (req, res) => {
  try { /* prisma */ res.json(data); }
  catch { res.status(500).json({ error: '...' }); }
});
```

Validação mínima no POST (campos obrigatórios → 400). `parseInt`/`parseFloat` nos bodies.

## Regras de domínio importantes

### Sync de fixos → MonthEntry

Duplicada em:

- `POST /api/months/:year/:month/sync-fixed`
- `GET /api/dashboard/summary/:year/:month` (sync automático antes de agregar)

Para cada `FixedIncome`/`FixedExpense` **ativo**, cria `MonthEntry` se não existir registro com mesmo `year`, `month`, `type`, `fixedRefId`. Data: `YYYY-MM-DD` com `dayOfMonth` do fixo. `isFixed: true`.

**Não atualiza** valores se o fixo mudou depois do sync — só cria ausentes.

### Parcelas no mês

Fórmula (repetida em `installments.ts` e `dashboard.ts`):

```typescript
const monthsDiff = (targetYear - firstYear) * 12 + (targetMonth - 1 - firstMonth);
const installmentNumber = monthsDiff + 1;
// ativa se: installmentNumber >= currentInstallment
//          && installmentNumber <= totalInstallments && monthsDiff >= 0
const installmentAmount = totalAmount / totalInstallments;
```

Resposta enriquecida: `currentMonthInstallment`, `installmentAmount`.

### Settings

- Registro único `id: 1`
- `GET` cria default `{ payday: 1 }` se ausente
- `PUT` body: `{ payday: 1-31 }`

### Agente (`/api/agent/chat`)

- **Sem OpenAI/LLM** — regex + heurísticas em português
- Intents: `add_entry`, `delete_entry`, `update_entry`, `summary`, `unknown`
- Exclusão: fluxo de confirmação via `pendingAction` no body + resposta "sim"
- `POST` body: `{ message: string, pendingAction?: { action, entryId, preview } }`
- Ver `API.md` para shape de resposta

## Scripts

| Script | Comando |
|--------|---------|
| start | `tsx server.ts` |
| dev | `tsx watch server.ts` |
| seed | `node prisma/seed.js` |

## Env

Ver `backend/.env.example`: `PORT`, `DATABASE_URL`, `CORS_ORIGIN`, `NODE_ENV`.

## Extensão

Nova entidade: model em `schema.prisma` → migrate → `routes/<nome>.ts` → registrar em `server.ts` → métodos em `frontend/hooks/useApi.ts` + `types.ts` → atualizar `spec/backend/API.md` e `DATA-MODEL.md`.
