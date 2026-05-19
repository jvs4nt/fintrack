# Backend — Contexto

## Entry point

`backend/server.ts` — Express, CORS, `express.json()`, logging, **`GET /api/health` público**, middleware `requireAuth` em `/api/*`, rotas, 404, error handler.

## Estrutura

```
backend/
├── server.ts
├── middleware/auth.ts     # JWT Supabase → req.userId
├── lib/supabase.ts
├── types/auth.ts
├── prisma/
│   ├── schema.prisma      # PostgreSQL (Supabase)
│   ├── client.ts
│   ├── seed.js            # requer SEED_USER_ID
│   └── migrations/
├── services/
│   └── syncFixed.ts       # sync, propagate, FixedMonthSkip
└── routes/
    └── … (todas filtram por userId)
```

## Prisma

- Import: `import prisma from '../prisma/client'`
- Provider: **postgresql** (`DATABASE_URL` + `DIRECT_URL`)
- Multi-tenant por `userId` em todas as queries de negócio

## Auth

- `middleware/auth.ts` — `Authorization: Bearer <token>`, valida com `supabase.auth.getUser`
- Rotas usam `getUserId(req)` de `types/auth.ts`

## Padrão de rota

```typescript
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    /* prisma where: { userId } */
    res.json(data);
  } catch { res.status(500).json({ error: '...' }); }
});
```

## Regras de domínio importantes

### Sync de fixos → MonthEntry

Centralizado em `services/syncFixed.ts`:

- `syncFixedForMonth(userId, year, month, { mode })` — `create-only` ou `upsert`
- **Não cria** entry se existir `FixedMonthSkip` para aquele fixo/mês
- `recordFixedMonthSkip` — chamado ao excluir lançamento fixo em Meses/agente
- `clearFixedMonthSkips` — ao excluir fixo pai
- `propagateFixedToEntries({ userId, fixedType, fixedId, ... })`

Usado por sync em Meses, dashboard e propagate.

### Settings

- PK = `userId` (um registro por usuário)
- `GET` cria `{ payday: 1 }` se ausente

### Agente (`/api/agent/chat`)

- Rule-based, escopo `userId`
- Delete com confirmação + `FixedMonthSkip` para fixos

## Scripts

| Script | Comando |
|--------|---------|
| start | `tsx server.ts` |
| dev | `tsx watch server.ts` |
| seed | `SEED_USER_ID=... node prisma/seed.js` |

## Env

Ver `backend/.env.example`.

## Extensão

Nova entidade: model com `userId` → migrate → rota com `getUserId` → `useApi` + `types.ts` → specs.
