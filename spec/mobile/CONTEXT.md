# Mobile (Expo)

App React Native na pasta [`mobile/`](../mobile/) — **Expo SDK 54**, **Expo Router** (file-based), TypeScript.

## Contrato com o backend

- Mesma API que o web: ver [backend/API.md](backend/API.md).
- Base URL: prefixo `/api`; header `Authorization: Bearer` com JWT do Supabase Auth — ver [CONVENTIONS.md](CONVENTIONS.md).
- Cliente HTTP: [`mobile/src/lib/api.ts`](../mobile/src/lib/api.ts) (espelho do `frontend` `useApi`) — `getEntries` / `getSummary` com `?sync=0` opcional; Meses usa um `GET` com sync embutido no load.
- Tipos DTO: [`mobile/src/types.ts`](../mobile/src/types.ts) alinhados a [`frontend/src/types.ts`](../frontend/src/types.ts).

## Variáveis de ambiente

Arquivo [`mobile/.env.example`](../mobile/.env.example). Copiar para `mobile/.env` (não commitar).

- `EXPO_PUBLIC_API_BASE_URL` — porta e path `/api` (ex.: `http://192.168.1.x:3333/api`). Em **dev**, o host é sobrescrito pelo IP do Metro (scriptURL do Expo Go), para não depender de IP fixo no `.env`. Em dispositivo físico, Mac e celular na mesma Wi‑Fi; backend deve escutar em `0.0.0.0` (ver `backend/server.ts`).
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
- **Tab bar:** ícones Ionicons, rótulos com Sora, `expo-haptics` no toque; no **iOS**, fundo com `expo-blur` + translucidez em [`app/(app)/_layout.tsx`](../mobile/app/(app)/_layout.tsx); Android mantém barra sólida (`Theme.bgSecondary`). Altura aumentada: `64 + insets.bottom` com `paddingTop: 8` e `paddingBottom: max(insets.bottom, 8)` via `useSafeAreaInsets` (react-native-safe-area-context), para não colar no gesto/nav bar do sistema.
- **Barra de navegação Android:** pintada com `Theme.bgSecondary` (mesma cor da tab bar) via `expo-navigation-bar` — plugin declarado em [`app.json`](../mobile/app.json) (`backgroundColor: #111118`, `barStyle: light`) e reforçado em runtime no [`app/_layout.tsx`](../mobile/app/_layout.tsx) (`NavigationBar.setBackgroundColorAsync` + `setButtonStyleAsync`, gated em `Platform.OS === 'android'`). Necessário porque `edgeToEdgeEnabled: true` ignora a config legada de `navigationBar` no Android manifest.
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
