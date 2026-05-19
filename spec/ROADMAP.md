# FinTrack — Plano de Evolução por Fases

Documento de referência para uso pessoal e evolução futura para app mobile.  
Atualizado com base na análise do estado atual do projeto (web + API + Prisma).

---

## Diagnóstico do estado atual

O FinTrack já cobre bem o **ciclo mensal de planejamento**: fixos → lançamentos do mês → cartões/parcelas → reservas → dashboard com `payday` e um **agente rápido** para lançar gastos por texto. Para uso pessoal no desktop, a base é sólida.

### Pontos fortes

- API REST organizada por domínio (`fixed-incomes`, `months`, `cards`, `savings`, `dashboard`, `agent`)
- Conceito de **payday** para mês de planejamento
- Parcelas calculadas por `firstPaymentDate`
- Agente rule-based (sem custo de LLM, funciona offline no backend local)
- Spec-driven design em `spec/` para evolução com menos tokens

### Limitações que impactam uso diário e mobile

| Área | Situação atual | Impacto |
|------|----------------|---------|
| Sync de fixos | Só **cria** `MonthEntry` ausentes; não atualiza valor se o fixo mudou | Saldo do mês pode ficar inconsistente |
| Dinheiro | `Float` no Prisma | Centavos podem divergir em totais |
| Parcelas vs fatura | `closingDay`/`dueDay` existem, mas limite usado e mês não seguem ciclo de fatura BR | Cartão pouco confiável para decisão |
| Dashboard | API expõe `netBalance` e parcelas; tipos/UI podem não refletir tudo | Visão incompleta do “quanto sobra de verdade” |
| Agente | Rule-based, sem LLM | Bom offline/barato; frágil em frases complexas |
| UX | `alert`/`confirm` em várias páginas | Ruim em mobile e pouco polido |
| Dados | SQLite local, sem auth, sem sync | Celular ≠ mesmo dado do PC |
| Código | Lógica de sync duplicada (`months` + `dashboard`) | Risco de bugs ao evoluir |

### Lacunas do modelo de dados

- Parcela **não gera** `MonthEntry` automaticamente — totais do mês e do cartão podem divergir
- Sem status **pago / pendente** em lançamentos
- Reservas têm histórico, mas falta **meta** (ex.: “R$ 30k emergência”) e progresso %
- `Settings` só tem `payday` — faltam preferências (moeda, tema, etc.)
- Pouca ou nenhuma cobertura de testes nas regras de parcela/sync

---

## Fase 1 — Uso pessoal imediato

**Objetivo:** confiar nos números sem reescrever o app.  
**Horizonte sugerido:** 1–3 semanas.

| # | Item | Descrição |
|---|------|-----------|
| 1.1 | Sync inteligente de fixos | Ao alterar `FixedIncome`/`FixedExpense`, permitir atualizar lançamentos futuros ou a partir de um mês |
| 1.2 | Saldo “real” no dashboard | Destacar `netBalance` (ganhos − gastos − parcelas do mês); listar parcelas no resumo |
| 1.3 | Categorias consistentes | Modelo `Category` (income/expense) + selects na UI; base para relatórios |
| 1.4 | Contas / carteiras (opcional) | `Account` (corrente, carteira, PIX); `MonthEntry.accountId` |
| 1.5 | Metas mensais (budget) | Limite por categoria/mês; alertas visuais em 80%/100% |
| 1.6 | Alinhar tipos TypeScript | `DashboardSummary` e respostas enriquecidas de parcelas em `frontend/src/types.ts` |
| 1.7 | Toast / modal de confirmação | Substituir `alert`/`confirm` por componente reutilizável |

**Entregável:** app web confiável para controle financeiro pessoal diário.

---

## Fase 2 — Fundação para app mobile

**Objetivo:** mesma API servir web + app, com dados sincronizados entre dispositivos.  
**Horizonte sugerido:** 1–2 meses (pode iniciar em paralelo à Fase 1).

### Arquitetura alvo

```
┌─────────────┐     ┌─────────────┐
│  React Web  │     │ Expo / RN   │
└──────┬──────┘     └──────┬──────┘
       │                   │
       └─────────┬─────────┘
                 ▼
         ┌───────────────┐
         │  Express API  │
         └───────┬───────┘
                 ▼
         ┌───────────────┐
         │ Postgres      │  (ex.: Supabase)
         │ + Auth        │
         └───────────────┘
```

### Decisão de stack mobile

| Opção | Prós | Contras |
|-------|------|---------|
| **Expo (React Native)** — recomendado | Reaproveita React, `useApi`, tipos; UX nativa | Reescrever telas (CSS atual não portável) |
| **Capacitor** | Empacota Vite rápido | Sensação “web no celular”; offline/sync mais fracos |
| **PWA** | Sem loja | Push/SQLite limitados |

### Itens técnicos

| # | Item | Descrição |
|---|------|-----------|
| 2.1 | Postgres em produção | Migrar de SQLite; manter SQLite opcional em dev |
| 2.2 | Auth mínima | E-mail mágico ou passkey — sync PC ↔ celular (mesmo usuário) |
| 2.3 | Pacote `packages/shared` | Tipos, Zod, constantes compartilhados web + mobile |
| 2.4 | Contrato API documentado | OpenAPI ou tRPC (opcional) |
| 2.5 | Valores em centavos | `Int` ou `Decimal` no schema — evitar `Float` |
| 2.6 | Camada `services/` no backend | Extrair sync, parcelas, dashboard das rotas — testável |

**Entregável:** API hospedada, autenticada, pronta para primeiro build Expo.

---

## Fase 3 — Features que brilham no celular

**Objetivo:** MVP mobile com valor no bolso.  
**Horizonte sugerido:** após Fase 2.

| # | Item | Descrição |
|---|------|-----------|
| 3.1 | Lançamento rápido | Tela default: valor + categoria + “hoje” em poucos toques |
| 3.2 | Widget / deep link | Atalho “Gastei R$ X” sem abrir fluxo completo |
| 3.3 | Notificações | Vencimento cartão, fixos no `dayOfMonth`, meta estourada |
| 3.4 | Modo offline | Fila local + sync quando online |
| 3.5 | Fatura do cartão | Agrupar por ciclo (`closingDay`); UX “fatura de março” |
| 3.6 | Agente evoluído | Parser local para comandos simples; LLM opcional para desambiguação |
| 3.7 | Telas MVP Expo | Dashboard, Meses, lançamento rápido, agente básico |

**Entregável:** app instalável (TestFlight / Play Internal) usando a mesma API.

---

## Fase 4 — Produto completo (opcional)

**Objetivo:** ir além da ferramenta pessoal — só se houver intenção de produto público.

| # | Item | Descrição |
|---|------|-----------|
| 4.1 | Relatórios anuais e export PDF | Comparativos e arquivo |
| 4.2 | Planejamento anual | 13º, IPVA, IPTU, despesas sazonais |
| 4.3 | Multi-moeda | Viagens e ativos externos |
| 4.4 | Household / parceiro(a) | `User` + espaço compartilhado |
| 4.5 | Open Finance (BR) | Integração bancária regulada |
| 4.6 | Importação extrato | CSV/OFX — alto valor, alto esforço |

---

## Roadmap visual (resumo)

```
Agora        → Fase 1: sync fixos + netBalance na UI + categorias + toasts
1–2 meses    → Fase 2: Postgres + auth + shared types + services
MVP mobile   → Fase 3: Expo (Meses + rápido + Dashboard + agente)
Depois       → Fase 3.3–3.6: notificações, offline, fatura
Opcional     → Fase 4: import, Open Finance, multi-usuário
```

---

## Insight estratégico

O projeto já tem o **esqueleto certo para mobile**: API REST + domínio claro (mês, fixos, cartão, reservas). Priorizar:

1. **Dados confiáveis** — sync, centavos, parcelas integradas ao mês  
2. **Contrato estável** — tipos compartilhados, serviços testados  
3. **Backend hospedado + auth** — celular como extensão do desktop, não segundo caderno  

Evitar começar pelo app nativo antes de Postgres + auth + regras de negócio centralizadas em `services/`.

---

## Próximos passos sugeridos (épico inicial)

Se for implementar uma coisa primeiro:

**Épico:** Sync de fixos + `netBalance` na UI  
- Backend: serviço único de sync; opção de atualizar valores em lançamentos vinculados  
- Frontend: card de saldo líquido com parcelas; alinhar `types.ts`  
- Spec: atualizar `spec/backend/DATA-MODEL.md` e `spec/backend/API.md`  

---

## Referências no repositório

| Documento | Conteúdo |
|-----------|----------|
| `spec/PROJECT.md` | Visão e stack atual |
| `spec/backend/API.md` | Contrato REST |
| `spec/backend/DATA-MODEL.md` | Schema Prisma |
| `spec/frontend/PAGES.md` | Telas e UX |
| `spec/CONVENTIONS.md` | Locale, padrões globais |

Ao concluir itens de fase, atualizar este arquivo (marcar status) e os specs de contrato afetados.
