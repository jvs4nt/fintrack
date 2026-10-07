# Supabase Auth — E-mails e URLs

Configuração no **Dashboard Supabase** do projeto FinTrack. O código envia `emailRedirectTo` no signup e magic link; os **templates** e a **Site URL** são só no painel.

## 1. URL Configuration

**Authentication → URL Configuration**

| Campo | Valor recomendado |
|-------|-------------------|
| **Site URL** | **`https://fintrack-production-dd54.up.railway.app`** (app web em produção no Railway) — **não** deixar `http://localhost:3000` (padrão Supabase) |
| **Redirect URLs** | Uma linha por URL (wildcards permitidos): |

```
https://fintrack-production-dd54.up.railway.app/**
http://localhost:5173/**
http://127.0.0.1:5173/**
mobile://**
exp://**
```

- Dev web: Vite na porta **5173**, não 3000.
- Mobile: scheme `mobile` em `mobile/app.json` → links `mobile://…` após confirmação no celular.

**Como o redirect é escolhido no código:** `getAuthRedirectUrl()` usa, nesta ordem, `VITE_APP_URL` (se definida no build) ou `window.location.origin` (onde o usuário está criando a conta). Cadastro em produção Railway → link do e-mail aponta para produção; cadastro em `localhost:5173` → link aponta para o dev.

No **build do frontend** (Railway), defina variável de ambiente:

`VITE_APP_URL=https://fintrack-production-dd54.up.railway.app`

## 2. Templates de e-mail (pt-BR + FinTrack)

**Authentication → Email Templates**

Copie assunto e corpo de [`email-templates/`](email-templates/) para cada tipo:

| Template no Dashboard | Arquivo | Assunto sugerido |
|----------------------|---------|------------------|
| Confirm signup | `confirm-signup.html` | Confirme seu e-mail — FinTrack |
| Magic Link | `magic-link.html` | Seu link de acesso — FinTrack |
| Reset Password | `reset-password.html` | Redefinir senha — FinTrack |
| Change Email Address | `change-email.html` | Confirme o novo e-mail — FinTrack |

Variáveis Supabase no HTML: `{{ .ConfirmationURL }}`, `{{ .SiteURL }}`, `{{ .Email }}`, etc.

Após colar o HTML, use **Preview** no painel e envie um e-mail de teste.

## 3. Código (já no repo)

- Web: `frontend/src/pages/Login.tsx` — `signUp` e `signInWithOtp` com `emailRedirectTo: getAuthRedirectUrl()`.
- Mobile: `mobile/src/context/AuthContext.tsx` — idem com deep link `Linking.createURL('/')`.
- `detectSessionInUrl: true` em `frontend/src/lib/supabase.ts` para processar o retorno do link no browser.

## 4. Checklist rápido

1. [ ] Site URL = `https://fintrack-production-dd54.up.railway.app`
2. [ ] Redirect URLs incluem `https://fintrack-production-dd54.up.railway.app/**` e `http://localhost:5173/**` (dev)
3. [ ] Templates em português colados no Dashboard
4. [ ] Novo cadastro de teste — link do e-mail abre `localhost:5173` (ou produção), não `:3000`

## 5. SMTP customizado (opcional)

**Project Settings → Auth → SMTP** — para remetente `noreply@seudominio.com` e menos chance de spam. Os templates do Dashboard continuam valendo.
