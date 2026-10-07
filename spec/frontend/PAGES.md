# Frontend — Páginas e UI

## Mapa de páginas

| ID (`currentPage`) | Arquivo | API principal |
|--------------------|---------|---------------|
| dashboard | `Dashboard.tsx` | `dashboard.getSummary(year, month)` |
| months | `Months.tsx` | `months.*`, `installments.getByMonth` (só com `FEATURE_PAYMENTS`) |
| fixed | `Fixed.tsx` | `fixedIncomes.*`, `fixedExpenses.*` |
| cards | `Cards.tsx` | `cards.*`, `installments.*` — **oculto** na UI (`FEATURE_PAYMENTS = false`) |
| savings | `Savings.tsx` | `savings.*` — **oculto** na UI (`FEATURE_SAVINGS = false`) |
| settings | inline em `App.tsx` | `settings.get`, `settings.update` |
| agent | modal + `Agent.tsx` | `agent.chat` |

## API Docs (rota oculta, somente web)

| Rota URL | Arquivo | Notas |
|----------|---------|--------|
| `/api-docs` | `ApiDocs.tsx` | Referência REST de todos os endpoints; dados em `data/apiReference.ts` (espelho de `spec/backend/API.md`). **Sem** link na sidebar nem no mobile. Acesso direto pela URL; em `main.tsx` renderiza fora do shell/login. Deploy estático: fallback `index.html` para `/api-docs`. Dev: proxy Vite usa prefixo `/api/` (não `/api`) para não encaminhar `/api-docs` ao backend. |

## Dashboard

- Props: `selectedYear`, `selectedMonth`, setters e `planningMonth` (do App)
- Navegação ‹ mês › no cabeçalho ([`MonthNavigator`](../frontend/src/components/MonthNavigator.tsx)): altera o mês compartilhado com Meses; botão **Mês atual** aparece fora do mês de planejamento; setas desabilitam fora de `YEARS`
- Ao trocar de mês, os dados anteriores ficam visíveis esmaecidos (`.dashboard-body.is-refreshing`) até a resposta chegar; respostas antigas são descartadas; os números animam do valor anterior ao novo
- Card destaque: `summary.balance` (ganhos − gastos); com `FEATURE_PAYMENTS`, `summary.netBalance` (− parcelas)
- Tabela **Parcelas do mês** (`monthInstallments`) e card `nextDueCard` — só com `FEATURE_PAYMENTS`
- Cards ganhos/gastos/saldo, gráficos Recharts (6 meses ganhos/gastos + top 5 `topExpenses` do mês), últimos 5 `lastEntries`
- Saldo em destaque e cards de ganhos/gastos/saldo contam de 0 até o valor ao abrir ([`AnimatedNumber`](../frontend/src/components/AnimatedNumber.tsx) + [`useCountUp`](../frontend/src/hooks/useCountUp.ts): easing out-quart, cards escalonados em 100ms, valor final direto com `prefers-reduced-motion`; leitor de tela recebe só o valor final)

## Months

- Seletor de mês (tabs Jan–Dez) e ano (`YEARS` de `lib/yearMonth.ts`: atual ±5)
- Ao mudar mês: `syncFixed` + `getEntries` + … (sync respeita `FixedMonthSkip`)
- **Excluir lançamento (Fixo):** some e não volta após reload — backend grava skip no DELETE
- Botão **Sincronizar fixos** → `syncFixed(..., 'upsert')`
- Seções: Ganhos | Gastos | Parcelas (só com `FEATURE_PAYMENTS`) | **Metas do mês** | Resumo
- Campo **Forma de Pagamento** no modal de gasto (aqui e em Fixed) só com `FEATURE_PAYMENTS`
- Categorias: [`CategoryPicker.tsx`](../frontend/src/components/CategoryPicker.tsx) — combobox customizado (sem `<select>` nativo); **+** adiciona nome à lista local; `POST /categories` só no **Salvar** do lançamento (`ensureCategory`)
- Metas: limites por categoria de despesa, barras 80%/100%

## Fixed

- Props: `selectedYear`, `selectedMonth` (mês de planejamento para propagate)
- Categorias: combobox no modal; após editar fixo, diálogo `choose()` para propagar lançamentos

## Cards (UI oculta)

- Módulo em `Cards.tsx`; fora da sidebar enquanto `FEATURE_PAYMENTS === false`
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
| `.dashboard-charts-row`, `.chart-container` | gráficos Recharts no Dashboard |
| `.line-chart-legend`, `.chart-pie` | legenda dashboard / pizza Savings (CSS) |
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
