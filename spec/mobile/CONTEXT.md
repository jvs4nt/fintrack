# Mobile (Expo)

App React Native na pasta [`mobile/`](../mobile/) — **Expo SDK 54**, **Expo Router** (file-based), TypeScript.

## Contrato com o backend

- Mesma API que o web: ver [backend/API.md](backend/API.md).
- Base URL: prefixo `/api`; header `Authorization: Bearer` com JWT do Supabase Auth — ver [CONVENTIONS.md](CONVENTIONS.md).
- Cliente HTTP: [`mobile/src/lib/api.ts`](../mobile/src/lib/api.ts) (espelho do `frontend` `useApi`) — `getEntries` / `getSummary` com `?sync=0` opcional; Meses usa um `GET` com sync embutido no load.
- Tipos DTO: [`mobile/src/types.ts`](../mobile/src/types.ts) alinhados a [`frontend/src/types.ts`](../frontend/src/types.ts).

## Variáveis de ambiente

Arquivo [`mobile/.env.example`](../mobile/.env.example). Copiar para `mobile/.env` (não commitar).

- `EXPO_PUBLIC_API_BASE_URL` — em dispositivo físico na mesma rede Wi‑Fi, use `http://<IP_LAN_DO_MAC>:3333/api` (não `localhost`). Se deixar `localhost` no `.env` enquanto usa **Expo Go no celular**, o `mobile/src/lib/api.ts` tenta trocar pelo host do Metro (mesmo IP do QR) em desenvolvimento.
- **Emulador Android:** `localhost` no emulador não é o seu Mac. No **emulador** (não em aparelho físico), o app reescreve `localhost` / `127.0.0.1` para `10.0.2.2` em `mobile/src/lib/api.ts`. O backend precisa estar escutando na porta configurada (ex.: `3333`). Em aparelho físico, prefira `http://<IP_LAN>:3333/api` na mesma rede Wi‑Fi.
- `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — mesmo projeto que o frontend Vite (`VITE_*`). Sem essas variáveis o app ainda sobe (placeholders internos), mas o login real exige `.env` preenchido; a tela de login mostra aviso quando faltam.

## Paridade de produto (módulos)

Espelha [frontend/PAGES.md](frontend/PAGES.md):

| Rota (Expo) | Módulo |
|-------------|--------|
| `(auth)/login` | Login Supabase |
| `(app)/index` | Dashboard — mês de planejamento (payday); **recarrega ao focar a aba** (tabs mantêm a tela montada) |
| `(app)/months` | Meses / MonthEntry |
| `(app)/fixed` | Fixos |
| `(app)/cards` | Cartões + parcelas |
| `(app)/savings` | Reservas |
| `(app)/agent` | Agente (`POST /agent/chat`) — **aba oculta** na barra inferior até release dedicada; tela e API permanecem no projeto |
| `(app)/settings` | Payday + sair |

## Tema

Tokens em [`mobile/constants/Colors.ts`](../mobile/constants/Colors.ts) — paridade com `frontend/src/App.css` (dark único).

## UX (app)

- **Navegação e transições:** o Stack raiz em [`app/_layout.tsx`](../mobile/app/_layout.tsx) define animações por grupo (`index`, `(auth)`, `(app)`). Entre abas, **não** usar `screenOptions.animation` em `Tabs` (Expo SDK 54 / React Navigation 7 tem bugs com `shift`/`fade` nas tabs). A sensação de troca de tela nas abas vem do [`TabScreenTransition`](../mobile/components/TabScreenTransition.tsx) (Reanimated + `useFocusEffect`): fade leve + deslocamento ao focar; respeita “Reduzir movimento” do sistema. Integrado em [`PageShell`](../mobile/components/PageShell.tsx) e na raiz das telas em `(app)/`.
- **Tab bar:** ícones Ionicons, rótulos com Sora, `expo-haptics` no toque; no **iOS**, fundo com `expo-blur` + translucidez em [`app/(app)/_layout.tsx`](../mobile/app/(app)/_layout.tsx); Android mantém barra sólida.
- Confirmações destrutivas (excluir fixo, lançamento, cartão, reserva): modal temático via [`ConfirmProvider`](../mobile/src/context/ConfirmContext.tsx) em [`app/_layout.tsx`](../mobile/app/_layout.tsx); [`confirmDestructive`](../mobile/src/utils/alerts.ts) usa esse fluxo (fallback `Alert` se o provider não estiver montado).
- Categorias em **Fixos** e **Meses**: combobox [`CategoryPicker`](../mobile/components/CategoryPicker.tsx) (sem picker nativo); **+** só atualiza lista local; [`ensureCategory.ts`](../mobile/src/lib/ensureCategory.ts) no Salvar.

## Comandos

```bash
cd mobile && npm run start
```

Expo Go no telefone (mesma rede que o Mac para a API LAN).
