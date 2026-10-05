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

### Conexão Neon

O banco é Postgres no **Neon**. O cliente Prisma usa **somente** `DATABASE_URL` em runtime.

- **`DATABASE_URL`**: connection string **com pooling** do Dashboard Neon (host `ep-<id>-pooler.<region>.aws.neon.tech`).
- **`DIRECT_URL`**: mesma string **sem** o `-pooler` no host — use só para `prisma migrate` / `db push`.

Ver também `backend/.env.example`.

## Auth

- `middleware/auth.ts` — `Authorization: Bearer <token>`
- Com **`SUPABASE_JWT_SECRET`** (JWT Secret do projeto no Dashboard Supabase): validação **local** do JWT (HS256, `sub` = `userId`) — evita uma chamada HTTP à Auth do Supabase **por request** (importante quando o cliente faz várias chamadas em paralelo, ex. tela Meses).
- Sem esse env: fallback `supabase.auth.getUser(token)` (mais lento sob carga paralela).
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

- `syncFixedForMonth(userId, year, month, { mode })` — `create-only` ou `upsert`; remove `MonthEntry` duplicados (mesmo `type` + `fixedRefId` no mês) antes de criar/atualizar
- **Não cria** entry se existir `FixedMonthSkip` para aquele fixo/mês
- `recordFixedMonthSkip` — chamado ao excluir lançamento fixo em Meses/agente
- `clearFixedMonthSkips` — ao excluir fixo pai
- `propagateFixedToEntries({ userId, fixedType, fixedId, ... })`

Usado por `GET /months/:y/:m` (sync embutido, `?sync=0` para pular), `POST .../sync-fixed`, dashboard summary e propagate.

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
