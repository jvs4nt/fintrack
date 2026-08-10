# Frontend — Páginas e UI

## Mapa de páginas

| ID (`currentPage`) | Arquivo | API principal |
|--------------------|---------|---------------|
| dashboard | `Dashboard.tsx` | `dashboard.getSummary(year, month)` |
| months | `Months.tsx` | `months.*`, `installments.getByMonth` |
| fixed | `Fixed.tsx` | `fixedIncomes.*`, `fixedExpenses.*` |
| cards | `Cards.tsx` | `cards.*`, `installments.*` |
| savings | `Savings.tsx` | `savings.*` — **oculto** na UI (`FEATURE_SAVINGS = false`) |
| settings | inline em `App.tsx` | `settings.get`, `settings.update` |
| agent | modal + `Agent.tsx` | `agent.chat` |

## API Docs (rota oculta, somente web)

| Rota URL | Arquivo | Notas |
|----------|---------|--------|
| `/api-docs` | `ApiDocs.tsx` | Referência REST de todos os endpoints; dados em `data/apiReference.ts` (espelho de `spec/backend/API.md`). **Sem** link na sidebar nem no mobile. Acesso direto pela URL; em `main.tsx` renderiza fora do shell/login. Deploy estático: fallback `index.html` para `/api-docs`. Dev: proxy Vite usa prefixo `/api/` (não `/api`) para não encaminhar `/api-docs` ao backend. |

## Dashboard

- Props: `selectedYear`, `selectedMonth` (do App — **não** tem seletor próprio de mês)
- Card destaque: `summary.netBalance` (ganhos − gastos − parcelas)
- Tabela **Parcelas do mês** (`monthInstallments`)
- Cards ganhos/gastos/saldo, `nextDueCard`, gráfico de linhas 6 meses (ganhos verde / gastos vermelho), últimos 5 `lastEntries`

## Months

- Seletor de mês (tabs Jan–Dez) e ano (`years`: atual ±5)
- Ao mudar mês: `syncFixed` + `getEntries` + … (sync respeita `FixedMonthSkip`)
- **Excluir lançamento (Fixo):** some e não volta após reload — backend grava skip no DELETE
- Botão **Sincronizar fixos** → `syncFixed(..., 'upsert')`
- Seções: Ganhos | Gastos | Parcelas | **Metas do mês** | Resumo
- Categorias: [`CategoryPicker.tsx`](../frontend/src/components/CategoryPicker.tsx) — combobox customizado (sem `<select>` nativo); **+** adiciona nome à lista local; `POST /categories` só no **Salvar** do lançamento (`ensureCategory`)
- Metas: limites por categoria de despesa, barras 80%/100%

## Fixed

- Props: `selectedYear`, `selectedMonth` (mês de planejamento para propagate)
- Categorias: combobox no modal; após editar fixo, diálogo `choose()` para propagar lançamentos

## Cards

- Grid de cards visuais (cor `card.color`, últimos 4 dígitos)
- Badge vencimento se `daysUntilDue <= 5` (cálculo pode ser no front ao listar)
- Barra de limite usado (soma parcelas ativas / limit)
- CRUD parcelamentos vinculados a `cardId`

## Savings (UI oculta)

- Módulo em `Savings.tsx`; fora da sidebar enquanto `FEATURE_SAVINGS === false`
- Cards por reserva; tipos com labels pt-BR
- `updateAmount` abre fluxo de novo valor + histórico
- Gráfico pizza CSS por tipo
- Total consolidado no topo

## Agent (modal)

- FAB fixo `.agent-fab`
- Overlay `.agent-modal-overlay`, balloon `.agent-modal-balloon`
- Animação close ~220ms (`isAgentModalClosing`)
- ESC fecha; `body overflow hidden` quando aberto
- Sugestões: "gastei X no Y hoje", "resumo do mês", confirmação "sim" para delete

## Settings (App.tsx)

- Input número 1–31 para `payday`
- Seção **Conta** com e-mail logado e botão **Sair**

## Login

- Tela full-page antes do app (`Login.tsx`)
- Modos: entrar, criar conta, link mágico por e-mail
- Criar conta: e-mail, senha e confirmação de senha (validação client-side; erro se não coincidirem)
- Salvar recalcula `selectedYear/Month` e `alert` de sucesso

## Classes CSS frequentes

| Classe | Uso |
|--------|-----|
| `.app-container` | layout sidebar + main |
| `.sidebar`, `.nav-link.active` | navegação |
| `.main-content` | área da página |
| `.page-header`, `.page-title`, `.page-subtitle` | cabeçalho |
| `.card`, `.card-header`, `.card-body` | containers |
| `.btn`, `.btn-primary`, `.btn-danger`, `.btn-sm` | ações |
| `.form-group`, `.form-label`, `.form-input`, `.form-select` | formulários |
| `.stat-card`, `.stat-value`, `.stat-label` | métricas dashboard |
| `.line-chart`, `.chart-pie` | gráficos SVG/CSS puros |
| `.credit-card-visual` | cartão estilizado |
| `.agent-chat-container`, `.agent-bubble` | chat |
| `.loading`, `.error-message` | estados |

## Design tokens (`App.css` :root)

- Fundo: `--bg-primary` `#0a0a0f`
- Superfícies: `--bg-secondary`, `--bg-tertiary`
- Acento: `--accent-primary` `#00e5a0`
- Perigo: `--accent-danger` `#ff4d6d`
- Fontes: `--font-display` (DM Mono), `--font-ui` (Sora) — carregadas no `index.html`

## Acessibilidade / UX existente

- `confirm()` antes de deletes
- `alert()` em erros de settings
- Loading textual "Carregando..." / "Iniciando FinTrack..."
