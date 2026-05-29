# Mobile (Expo)

App React Native na pasta [`mobile/`](../mobile/) — **Expo SDK 54**, **Expo Router** (file-based), TypeScript.

## Contrato com o backend

- Mesma API que o web: ver [backend/API.md](backend/API.md).
- Base URL: prefixo `/api`; header `Authorization: Bearer` com JWT do Supabase Auth — ver [CONVENTIONS.md](CONVENTIONS.md).
- Cliente HTTP: [`mobile/src/lib/api.ts`](../mobile/src/lib/api.ts) (espelho do `frontend` `useApi`) — `getEntries` / `getSummary` com `?sync=0` opcional; Meses usa um `GET` com sync embutido no load.
- Tipos DTO: [`mobile/src/types.ts`](../mobile/src/types.ts) alinhados a [`frontend/src/types.ts`](../frontend/src/types.ts).

## Variáveis de ambiente

Arquivo [`mobile/.env.example`](../mobile/.env.example). Copiar para `mobile/.env` (não commitar).

- `EXPO_PUBLIC_API_BASE_URL` — em **release** (APK), URL completa do `.env` (ex.: Render HTTPS). Em **dev** (Expo Go), base `http://<IP Metro>:3333/api` (não herda HTTPS de produção). Opcional: `EXPO_PUBLIC_DEV_API_BASE_URL` força a URL de dev (útil se o IP do Metro não bater com o da LAN). Backend deve estar rodando (`cd backend && npm run dev`); teste `http://<IP>:3333/api/health` no browser do celular. Mac e celular na mesma Wi‑Fi; backend em `0.0.0.0` (ver `backend/server.ts`).
- **Emulador Android:** no emulador (não em aparelho físico), `mobile/src/lib/api.ts` reescreve **qualquer** host do `.env` para `10.0.2.2` (alias do Mac no AVD). O backend precisa estar rodando na porta do `.env` (ex.: `3333`). Em aparelho físico (Expo Go), use `http://<IP_LAN>:3333/api` na mesma rede Wi‑Fi. HTTP em dev exige `usesCleartextTraffic` em `app.json` (já configurado).
- `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — mesmo projeto que o frontend Vite (`VITE_*`). Sem essas variáveis o app ainda sobe (placeholders internos), mas o login real exige `.env` preenchido; a tela de login mostra aviso quando faltam.
- **Sessão Supabase:** persistida em AsyncStorage (`mobile/src/lib/supabase.ts`). Se o refresh token estiver inválido (logout em outro cliente, revogação no dashboard, troca de projeto), `getSessionSafe` em `mobile/src/lib/authSession.ts` limpa o storage local (`signOut` com `scope: 'local'`) e o app redireciona para login sem erro no console.

## Paridade de produto (módulos)

Espelha [frontend/PAGES.md](frontend/PAGES.md):

| Rota (Expo) | Módulo |
|-------------|--------|
| `(auth)/login` | Login Supabase |
| `(app)/index` | Dashboard — mês de planejamento (payday); **recarrega ao focar a aba** (tabs mantêm a tela montada) |
| `(app)/months` | Meses / MonthEntry — seções Ganhos, Gastos, Parcelas, Resumo (sem Metas do mês; web mantém metas em [PAGES.md](frontend/PAGES.md)) |
| `(app)/fixed` | Fixos |
| `(app)/cards` | Cartões + parcelas |
| `(app)/savings` | Reservas — **aba oculta** (`FEATURE_SAVINGS` em `mobile/src/config/features.ts`); rota e API mantidas |
| `(app)/agent` | Agente (`POST /agent/chat`) — **aba oculta** na barra inferior até release dedicada; tela e API permanecem no projeto |
| `(app)/settings` | Payday + sair |

## Tema

Tokens em [`mobile/constants/Colors.ts`](../mobile/constants/Colors.ts) — paridade com `frontend/src/App.css` (dark único).

## UX (app)

- **Navegação e transições:** o Stack raiz em [`app/_layout.tsx`](../mobile/app/_layout.tsx) define animações por grupo (`index`, `(auth)`, `(app)`). Entre abas, **não** usar `screenOptions.animation` em `Tabs` (Expo SDK 54 / React Navigation 7 tem bugs com `shift`/`fade` nas tabs). A sensação de troca de tela nas abas vem do [`TabScreenTransition`](../mobile/components/TabScreenTransition.tsx) (Reanimated + `useFocusEffect`): fade leve + deslocamento ao focar; respeita “Reduzir movimento” do sistema. Integrado em [`PageShell`](../mobile/components/PageShell.tsx) e na raiz das telas em `(app)/`.
- **Tab bar:** [`FinTrackTabBar`](../mobile/components/FinTrackTabBar.tsx) (wrapper + `BottomTabBar`) em [`app/(app)/_layout.tsx`](../mobile/app/(app)/_layout.tsx) — ícones Ionicons, rótulos Sora, `expo-haptics` no toque. Conteúdo em faixa fixa de **56px**; abaixo, `View` de preenchimento com `getNavigationBarInset` (safe area ou fallback 24px no Android) estende `Theme.bgSecondary` na área do gesto sem sobrepor ícones. **Sem** `position: 'absolute'` na tab bar (evita ficar atrás da nav bar transparente). **Sem** `elevation` no wrapper no Android (sombra Material vinhetava os cantos superiores sobre `bgPrimary`). Separação visual: `borderTop` hairline. [`PageShell`](../mobile/components/PageShell.tsx) usa `useTabBarTotalHeight()` no `paddingBottom` do scroll.
- **Barra de navegação Android (edge-to-edge):** com `edgeToEdgeEnabled: true`, a barra do sistema é **transparente** — a cor visível vem do fundo do app (tab bar estendida). [`app.json`](../mobile/app.json): `androidNavigationBar.enforceContrast: false` + plugin `expo-navigation-bar` (`enforceContrast: false`, `barStyle: light`) remove o scrim preto do Android 15+. Runtime: [`useAndroidNavigationBar`](../mobile/src/hooks/useAndroidNavigationBar.ts) com `NavigationBar.setStyle('dark')` + `setButtonStyleAsync('light')` (não usar `setBackgroundColorAsync` — no-op com edge-to-edge). **APK:** após mudar `app.json`/plugins, rodar novo `npm run build:apk`; build antigo não reflete o contraste nativo.
- Confirmações destrutivas (excluir fixo, lançamento, cartão, reserva): modal temático via [`ConfirmProvider`](../mobile/src/context/ConfirmContext.tsx) em [`app/_layout.tsx`](../mobile/app/_layout.tsx); [`confirmDestructive`](../mobile/src/utils/alerts.ts) usa esse fluxo (fallback `Alert` se o provider não estiver montado).
- Categorias em **Fixos** e **Meses**: combobox [`CategoryPicker`](../mobile/components/CategoryPicker.tsx) (sem picker nativo); **+** só atualiza lista local; [`ensureCategory.ts`](../mobile/src/lib/ensureCategory.ts) no Salvar.

## Comandos

```bash
cd mobile && npm run start
```

Expo Go no telefone (mesma rede que o Mac para a API LAN).

## Build instalável (EAS)

[`eas.json`](../mobile/eas.json) profile `preview` → APK Android. EAS CLI global (`npm i -g eas-cli`) ou `npx eas`. [`babel.config.js`](../mobile/babel.config.js) com plugin Reanimated (obrigatório para build nativo).

**`@supabase/supabase-js` fixado em `2.74.0`** no mobile: versões ≥2.95 usam `import()` dinâmico para OpenTelemetry que o Hermes não compila (`createBundleReleaseJsAndAssets` falha). Backend e frontend web podem usar a versão mais nova (Node/browser suportam). Ao atualizar, conferir build EAS antes.

```bash
cd mobile
npx eas login --browser   # conta Expo via GitHub: abrir browser, "Continue with GitHub"
npx eas env:push --environment preview --path .env
npm run build:apk
```

Ícone/nome: `app.json` (`name`, `icon`, `adaptiveIcon`). `EXPO_PUBLIC_*` em produção vêm do `.env` enviado ao EAS (`env:push`), não do IP do Metro.
