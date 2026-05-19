# Convenções Globais

## Locale e formatação

- Moeda: **BRL**, `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`
- Datas na UI: preferir `pt-BR`; no banco/API para `MonthEntry.date`: string **`YYYY-MM-DD`**
- `firstPaymentDate` em parcelas: string parseável por `new Date()` (ISO ou compatível)
- Ícones: emojis Unicode na navegação e UI

## API

- Prefixo: `/api`
- **Auth:** header `Authorization: Bearer <supabase_access_token>` em todas as rotas exceto `GET /health`
- JSON request/response; `Content-Type: application/json`
- DELETE bem-sucedido: **204** sem body
- Erros: `{ error: string }`; **401** → frontend faz logout
- 500 pode incluir `message` em `NODE_ENV=development`

## Frontend

- **Sem React Router** — navegação por `useState('currentPage')` em `App.tsx`
- **Sem biblioteca de estado global** — cada página gerencia loading/error/data
- API via hook `useApi()` em `hooks/useApi.ts` — não chamar `fetch` direto nas páginas
- Tipos em `frontend/src/types.ts` — manter sincronizado com respostas reais da API
- Confirmação: `useConfirm()` de `components/ConfirmDialog.tsx` (inclui `choose()` para múltiplas opções)
- Feedback: `useToast()` de `components/ToastProvider.tsx` — não usar `alert()` / `window.confirm`
- Erros de carregamento: mensagem inline `.error-message`

## CSS

- Um arquivo global: `frontend/src/App.css`
- Usar variáveis `:root` (`--bg-primary`, `--accent-primary`, etc.)
- Classes comuns: `.card`, `.btn`, `.btn-primary`, `.form-input`, `.page-header`, `.loading`, `.modal-overlay`

## Código

- Comentários mínimos; nomes em inglês no código, labels UI em português
- Backend: um router por domínio em `backend/routes/`
- Não commitar `.env`; exemplos em `.env.example`

## Payday (planejamento)

Lógica em `App.tsx` ao iniciar e ao salvar settings:

- Se `diaAtual > payday` → planejar **próximo** mês civil
- Se `diaAtual <= payday` → planejar **mês civil atual**

Isso define `selectedYear` / `selectedMonth` passados ao Dashboard e Months.
