# FinTrack — Spec Driven Design

Documentação de contexto para agentes e desenvolvedores. **Leia apenas os arquivos relevantes à tarefa** para economizar tokens.

## Quando ler o quê

| Tarefa | Arquivos |
|--------|----------|
| Visão geral / onboarding | `PROJECT.md` |
| Roadmap e fases (mobile, prioridades) | `ROADMAP.md` |
| Nova rota, Prisma, agente, sync fixos | `backend/CONTEXT.md` + `backend/API.md` + `backend/DATA-MODEL.md` |
| Ajuste de endpoint existente | `backend/API.md` (+ `DATA-MODEL.md` se afetar domínio) |
| Nova página, UI, hook API | `frontend/CONTEXT.md` + `frontend/PAGES.md` |
| App mobile Expo | `mobile/CONTEXT.md` + `frontend/PAGES.md` (paridade) + `backend/API.md` |
| Tipos compartilhados API ↔ UI | `frontend/CONTEXT.md` (seção tipos) + `backend/DATA-MODEL.md` |
| Regras globais (moeda, datas, erros) | `CONVENTIONS.md` |

## Workflow recomendado

1. Identificar camada: `backend/`, `frontend/` ou ambos.
2. Carregar specs mínimas da tabela acima.
3. Implementar alinhado às convenções em `CONVENTIONS.md`.
4. Atualizar spec se o contrato (API, schema, tipos) mudar.

## Estrutura do repositório (atual)

```
fintrack/
├── backend/          # Express + Prisma + SQLite (TypeScript)
├── frontend/         # React 18 + Vite (TypeScript)
├── mobile/           # Expo SDK 54 + Expo Router (TypeScript)
├── spec/             # Esta pasta
└── README.md         # Setup humano (pode estar desatualizado vs spec)
```

**Fonte de verdade:** código em `backend/` e `frontend/`. Em conflito com `README.md` raiz, preferir `spec/`.
