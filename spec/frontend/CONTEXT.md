# Frontend — Contexto

## Stack

React 18 + Vite 6 + TypeScript. **Sem** React Router, Redux, TanStack Query ou UI kit.

## Estrutura

```
frontend/src/
├── main.tsx           # ReactDOM.createRoot
├── App.tsx            # Shell: sidebar, páginas, agent modal, payday init
├── App.css            # Todos os estilos (design system inline)
├── types.ts           # Interfaces espelhando API
├── hooks/
│   └── useApi.ts      # Único cliente HTTP
└── pages/
    ├── Dashboard.tsx
    ├── Months.tsx
    ├── Fixed.tsx
    ├── Cards.tsx
    ├── Savings.tsx
    └── Agent.tsx
```

Não existe pasta `components/` — UI composta inline nas páginas.

## App shell (`App.tsx`)

Estado global mínimo:

| Estado | Uso |
|--------|-----|
| `currentPage` | `dashboard` \| `months` \| `fixed` \| `cards` \| `savings` \| `settings` |
| `selectedYear`, `selectedMonth` | Compartilhado Dashboard + Months |
| `payday` | Settings + cálculo do mês inicial |
| `isAgentModalOpen` | Modal do assistente |

Navegação sidebar em array `navigation`. Agente abre via **FAB** 🤖 e modal (não é página `currentPage`).

Props repassadas às páginas com mês:

```typescript
{ selectedYear, selectedMonth, setSelectedYear, setSelectedMonth }
```

`Fixed`, `Cards`, `Savings` não recebem mês.

## useApi (`hooks/useApi.ts`)

- Base: `import.meta.env.VITE_API_BASE_URL || 'http://localhost:3333/api'`
- Função interna `fetchApi<T>(endpoint, options)`
- Retorna objeto com namespaces: `fixedIncomes`, `fixedExpenses`, `months`, `cards`, `installments`, `savings`, `dashboard`, `settings`, `agent`
- Erro: `throw new Error(errorData.error || status)`

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

Env: `frontend/.env.example` → `VITE_API_BASE_URL`.

## Extensão

1. Tipo em `types.ts`
2. Método em `useApi.ts`
3. Página ou trecho em `App.tsx` (nav se nova seção)
4. Estilos em `App.css` reutilizando tokens
5. Atualizar `spec/frontend/PAGES.md` e `spec/backend/API.md` se contrato mudar
