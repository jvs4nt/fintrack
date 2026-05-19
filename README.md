# FinTrack

**Organizador Financeiro Pessoal** — Um aplicativo fullstack robusto e visualmente sofisticado para controle financeiro pessoal.

![FinTrack](https://img.shields.io/badge/Status-Em%20Desenvolvimento-yellow)
![React](https://img.shields.io/badge/React-18.3-blue)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![Prisma](https://img.shields.io/badge/Prisma-ORM-blue)
![SQLite](https://img.shields.io/badge/SQLite-Banco%20Local-orange)

---

## 🏗️ Arquitetura do Projeto

```
fintrack/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Schema do banco de dados
│   │   └── seed.js            # Script de popularização
│   ├── routes/
│   │   ├── fixedIncomes.js    # Ganhos fixos
│   │   ├── fixedExpenses.js   # Gastos fixos
│   │   ├── months.js          # Lançamentos mensais
│   │   ├── cards.js           # Cartões de crédito
│   │   ├── installments.js    # Parcelamentos
│   │   ├── savings.js         # Reservas/investimentos
│   │   └── dashboard.js       # Dashboard e resumo
│   ├── server.js              # Servidor Express
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/        # Componentes reutilizáveis
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Months.jsx
│   │   │   ├── Fixed.jsx
│   │   │   ├── Cards.jsx
│   │   │   └── Savings.jsx
│   │   ├── hooks/
│   │   │   └── useApi.js      # Hook para chamadas API
│   │   ├── App.jsx            # Componente principal
│   │   ├── App.css            # Estilos globais
│   │   └── main.jsx           # Entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## 🚀 Setup e Instalação

### Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn

### Backend

```bash
# Navegar para a pasta do backend
cd backend

# Instalar dependências
npm install

# Gerar o cliente Prisma
npx prisma generate

# Criar o banco de dados SQLite e aplicar migrations
npx prisma migrate dev --name init

# Popular o banco com dados de exemplo
npm run seed
# ou
node prisma/seed.js

# Iniciar o servidor
npm start
# ou para desenvolvimento com hot-reload
npm run dev
```

O servidor backend irá rodar em **http://localhost:3333**

### Frontend

```bash
# Em outro terminal, navegar para a pasta do frontend
cd frontend

# Instalar dependências
npm install

# Iniciar o servidor de desenvolvimento Vite
npm run dev
```

O frontend irá rodar em **http://localhost:5173**

---

## 📊 Funcionalidades

### Dashboard
- Saldo líquido do mês em destaque
- Cards de resumo: Total Ganhos | Total Gastos | Saldo | Próximo vencimento
- Gráfico de barras (CSS puro) — ganhos vs gastos últimos 6 meses
- Lista dos últimos 5 lançamentos

### Visão por Mês
- Navegação entre meses (Jan–Dez) com seletor de ano
- Sincronização automática de lançamentos fixos
- Seções: Ganhos | Gastos | Parcelas do Mês | Resumo
- Adição de lançamentos avulsos via modal
- Edição e exclusão de lançamentos

### Fixos
- Ganhos Fixos: Salário, Freelance, Aluguéis, etc.
- Gastos Fixos: Contas recorrentes, assinaturas
- Toggle ativo/inativo para cada item
- Aviso sobre impacto em meses futuros

### Cartões
- Grid de cartões visuais (estilo cartão bancário)
- Cores customizáveis
- Badge de alerta para vencimentos próximos (≤5 dias)
- Barra de limite usado/disponível
- Gestão de parcelamentos com progresso visual

### Reservas
- Cards por reserva com tipo e instituição
- Atualização de valor com histórico
- Histórico das últimas 5 atualizações
- Total consolidado em destaque
- Gráfico de pizza (CSS) por tipo de investimento

---

## 🗄️ Banco de Dados

O projeto utiliza **SQLite** com **Prisma ORM**. As tabelas são:

| Tabela | Descrição |
|--------|-----------|
| `FixedIncome` | Ganhos fixos recorrentes |
| `FixedExpense` | Gastos fixos recorrentes |
| `MonthEntry` | Lançamentos mensais (ganhos e gastos) |
| `Card` | Cartões de crédito |
| `Installment` | Parcelamentos de cartão |
| `Saving` | Reservas e investimentos |
| `SavingHistory` | Histórico de atualizações de reservas |

### Dados de Exemplo (Seed)

O script `seed.js` cria:

- **2 Ganhos Fixos:**
  - Salário: R$ 8.500,00 (dia 5)
  - Freelance: R$ 2.000,00 (dia 15)

- **3 Gastos Fixos:**
  - Aluguel: R$ 2.500,00 (dia 10)
  - Netflix: R$ 55,90 (dia 20)
  - Academia: R$ 149,90 (dia 1)

- **1 Cartão:**
  - Nubank Ultravioleta (Roxo, limite R$ 15.000)

- **1 Parcelamento:**
  - MacBook Pro M3: 12x de R$ 1.000,00

- **2 Reservas:**
  - Reserva de Emergência (Poupança): R$ 25.000,00
  - Tesouro IPCA+: R$ 15.000,00

---

## 🔌 API REST

| Método | Rota | Descrição |
|--------|------|-----------|
| GET/POST | `/api/fixed-incomes` | Listar e criar ganhos fixos |
| PUT/DELETE | `/api/fixed-incomes/:id` | Editar e remover |
| GET/POST | `/api/fixed-expenses` | Listar e criar gastos fixos |
| PUT/DELETE | `/api/fixed-expenses/:id` | Editar e remover |
| GET | `/api/months/:year/:month` | Buscar lançamentos do mês |
| POST | `/api/months/entry` | Criar lançamento avulso |
| PUT/DELETE | `/api/months/entry/:id` | Editar e remover |
| POST | `/api/months/:year/:month/sync-fixed` | Replicar fixos no mês |
| GET/POST | `/api/cards` | Listar e criar cartões |
| PUT/DELETE | `/api/cards/:id` | Editar e remover cartão |
| GET/POST | `/api/installments` | Listar e criar parcelamentos |
| PUT/DELETE | `/api/installments/:id` | Editar e remover |
| GET | `/api/installments/month/:year/:month` | Parcelas do mês |
| GET/POST | `/api/savings` | Listar e criar reservas |
| PUT/DELETE | `/api/savings/:id` | Editar e remover |
| PATCH | `/api/savings/:id/amount` | Atualizar valor (com histórico) |
| GET | `/api/savings/:id/history` | Histórico de atualizações |
| GET | `/api/dashboard/summary/:year/:month` | Resumo completo do mês |

---

## 🎨 Identidade Visual

Estética **dark finance** — inspirada em terminais Bloomberg e dashboards institucionais.

| Elemento | Valor |
|----------|-------|
| Fundo primário | `#0a0a0f` |
| Superfícies | `#111118`, `#1a1a24` |
| Bordas | `#2a2a38` |
| Acento primário (verde) | `#00e5a0` |
| Acento perigo (vermelho) | `#ff4d6d` |
| Acento alerta (âmbar) | `#ffc107` |
| Texto primário | `#e8e8f0` |
| Texto secundário | `#7a7a9a` |

**Fontes:**
- Display (números): `DM Mono` (Google Fonts)
- UI (textos): `Sora` (Google Fonts)

---

## 🛠️ Tecnologias

### Backend
- Node.js
- Express
- Prisma ORM
- SQLite

### Frontend
- React 18
- Vite
- CSS puro com variáveis
- Hook personalizado `useApi`

---

## 📝 Considerações

- Todos os valores são formatados em **R$ (pt-BR)**
- Datas no formato **DD/MM/YYYY**
- Ícones via emojis Unicode
- Confirmação antes de deletar qualquer item
- Tratamento de loading e erro em cada chamada API

---

## 👨‍💻 Desenvolvido por

FinTrack — Organizador Financeiro Pessoal

**Licença:** MIT
