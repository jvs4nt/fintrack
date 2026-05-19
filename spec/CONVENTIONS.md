# Convenções Globais

## Locale e formatação

- Moeda: **BRL**, `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`
- Datas na UI: preferir `pt-BR`; no banco/API para `MonthEntry.date`: string **`YYYY-MM-DD`**
- `firstPaymentDate` em parcelas: string parseável por `new Date()` (ISO ou compatível)
- Ícones: emojis Unicode na navegação e UI

## API

- Prefixo: `/api`
- JSON request/response; `Content-Type: application/json`
- DELETE bem-sucedido: **204** sem body
- Erros: `{ error: string }`; 500 pode incluir `message` em `NODE_ENV=development`
- Prisma `P2025` → 404 com `{ error: '...não encontrado' }` nas rotas CRUD

## Frontend

- **Sem React Router** — navegação por `useState('currentPage')` em `App.tsx`
- **Sem biblioteca de estado global** — cada página gerencia loading/error/data
- API via hook `useApi()` em `hooks/useApi.ts` — não chamar `fetch` direto nas páginas
- Tipos em `frontend/src/types.ts` — manter sincronizado com respostas reais da API
- Confirmação antes de deletar: `window.confirm`
- Feedback de erro: `alert()` ou mensagem inline `.error-message`

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
