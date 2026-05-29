# Frontend — Contexto

## Stack

React 18 + Vite 6 + TypeScript. **Sem** React Router, Redux, TanStack Query ou UI kit.

## Estrutura

```
frontend/src/
├── main.tsx              # AuthProvider + Toast + Confirm
├── App.tsx               # Gate de login, shell, agent modal
├── lib/supabase.ts       # Cliente Supabase Auth
├── context/AuthContext.tsx
├── App.css
├── types.ts
├── hooks/useApi.ts       # HTTP + Bearer JWT
├── components/           # Toast, Confirm
└── pages/
    ├── Login.tsx
    ├── Dashboard.tsx
    ├── Months.tsx
    ├── ApiDocs.tsx      # só web; rota /api-docs (oculta)
    └── …
```

## Autenticação

- `AuthProvider` envolve o app em `main.tsx`
- Sem sessão → `Login.tsx` (e-mail/senha, criar conta, magic link)
- `useApi` envia `Authorization: Bearer` em cada request; 401 → logout
- Ajustes: botão **Sair** (`signOut`)

## App shell (`App.tsx`)

Estado global mínimo:

| Estado | Uso |
|--------|-----|
| `currentPage` | `dashboard` \| `months` \| `fixed` \| `cards` \| `savings` \| `settings` — **Reservas** oculta na nav (`FEATURE_SAVINGS` em `frontend/src/config/features.ts`) |
| `selectedYear`, `selectedMonth` | Compartilhado Dashboard + Months |
| `payday` | Settings + cálculo do mês inicial |
| `isAgentModalOpen` | Modal do assistente |

Navegação sidebar em array `navigation`. Agente abre via **FAB** 🤖 e modal (não é página `currentPage`). Documentação da API: **`/api-docs`** (pathname em `main.tsx`, sem React Router; não aparece na nav).


Props repassadas às páginas com mês:

```typescript
{ selectedYear, selectedMonth, setSelectedYear, setSelectedMonth }
```

`Fixed`, `Cards`, `Savings` não recebem mês.

## useApi (`hooks/useApi.ts`)

- Base: em **dev** o `useApi` usa sempre `/api` (mesma origem — sem preflight CORS). O proxy Vite (`'/api/'` em `vite.config.ts`) encaminha para a **origin** de `VITE_API_BASE_URL` (ex. Render) ou `http://localhost:3333` se a variável estiver vazia/for local. Em **produção** (build), usa `VITE_API_BASE_URL` absoluta ou fallback `http://localhost:3333/api`
- Função interna `fetchApi<T>(endpoint, options)` — injeta `Authorization: Bearer` da sessão Supabase
- Retorna objeto com namespaces: `fixedIncomes`, `fixedExpenses`, `months`, `cards`, `installments`, `savings`, `dashboard`, `settings`, `agent`
- `months.getEntries(y, m, { sync?: boolean })` — sync no servidor por padrão; `{ sync: false }` → `?sync=0`
- `dashboard.getSummary(y, m, { sync?: boolean })` — idem
- Erro: `throw new Error(errorData.error || status)`

**Performance:** Meses chama só `getEntries` no load (sem `POST sync-fixed` antes); botão “Sincronizar fixos” usa `syncFixed(..., 'upsert')`. Após login, `App.tsx` não bloqueia o shell em `settings.get()` (payday/mês ajustam quando a resposta chega).

**Categorias:** [`components/CategoryPicker.tsx`](../frontend/src/components/CategoryPicker.tsx) + [`lib/ensureCategory.ts`](../frontend/src/lib/ensureCategory.ts) — combobox (input + dropdown + botão `+`); persistência no banco ao salvar fixo/lançamento.

**Regra:** novos endpoints → adicionar método aqui + tipo em `types.ts`.

## Tipos (`types.ts`)

Interfaces principais: `FixedIncome`, `FixedExpense`, `MonthEntry`, `Card`, `Installment`, `Saving`, `DashboardSummary`, `Settings`, `AgentChatResponse`, `AgentPendingAction`, `AgentOption`.

### Divergências conhecidas (API real vs tipo)

`DashboardSummary` no código está **incompleto**. A API retorna também:

```typescript
summary: {
  totalInstallments: number;
  netBalance: number;
}
monthInstallments: Installment[];  // com campos extras do backend
sixMonthsData: { month, year, label, income, expense }[];
nextDueCard.dueDate: string;
```

Ao trabalhar no Dashboard, alinhar `types.ts` ou usar tipo estendido local.

`Installment` do mês via API inclui `currentMonthInstallment`, `installmentAmount` — páginas usam `any[]` em Months.

## Padrão de página

```typescript
const api = useApi();
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
// useEffect → load → api.<namespace>.<method>
// formatCurrency com Intl pt-BR
// loading → .loading | error → .error-message
```

Modais: estado `showModal`, `formData`, `editingEntry`; classes `.modal-overlay`, `.modal`.

## Agente (`Agent.tsx`)

- Prop `embedded` para uso no modal (sem page-header)
- Chat local: `messages[]`, `pendingAction` entre turns
- `api.agent.chat(message, pendingAction)` — repassar `pendingAction` até confirmação/cancelamento

## Build

```bash
npm run dev      # :5173
npm run build    # dist/
```

Env: copie `frontend/.env.example` → `frontend/.env`. **Backend local:** omita `VITE_API_BASE_URL` ou use só path relativo — `useApi` usa `/api` + proxy. **API remota (Render):** `VITE_API_BASE_URL=https://sua-api.onrender.com/api` e reinicie o Vite. CORS no backend libera automaticamente `localhost`/`127.0.0.1`/`192.168.*` e domínios `*.pages.dev` / `*.vercel.app` / `*.netlify.app`; `CORS_ORIGIN` só é necessário para domínio próprio. **Build produção:** mesma URL absoluta. Mobile Expo: `spec/mobile/CONTEXT.md`.

**Mobile (≤768px):** `App.css` — `main-content` sem overflow horizontal indesejado; valores e textos com quebra; gráfico de linhas do Dashboard (`.line-chart`) mais compacto; cabeçalhos `.flex-between` empilhados; listas de Meses com `.entry-amount-row`; modais `form-row` em uma coluna; tabelas largas só rolam dentro de `.table-container`.

## Extensão

1. Tipo em `types.ts`
2. Método em `useApi.ts`
3. Página ou trecho em `App.tsx` (nav se nova seção)
4. Estilos em `App.css` reutilizando tokens
5. Atualizar `spec/frontend/PAGES.md` e `spec/backend/API.md` se contrato mudar
