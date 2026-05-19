import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

type LoginMode = 'signin' | 'signup' | 'magic';

function Login() {
  const [mode, setMode] = useState<LoginMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'magic') {
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: window.location.origin },
        });
        if (otpError) throw otpError;
        setMessage('Enviamos um link de acesso para seu e-mail.');
        return;
      }

      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        setMessage('Conta criada. Confirme o e-mail se solicitado, ou faça login.');
        setMode('signin');
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao autenticar';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card card">
        <div className="logo" style={{ marginBottom: 'var(--spacing-lg)' }}>
          Fin<span>Track</span>
        </div>
        <h1 className="page-title" style={{ fontSize: '1.5rem' }}>
          Entrar
        </h1>
        <p className="page-subtitle" style={{ marginBottom: 'var(--spacing-lg)' }}>
          Sincronize seus dados entre dispositivos com sua conta.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">E-mail</label>
            <input
              className="form-input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          {mode !== 'magic' && (
            <div className="form-group">
              <label className="form-label">Senha</label>
              <input
                className="form-input"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              />
            </div>
          )}

          {error && <p className="login-feedback login-feedback-error">{error}</p>}
          {message && <p className="login-feedback login-feedback-success">{message}</p>}

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading
              ? 'Aguarde...'
              : mode === 'magic'
                ? 'Enviar link mágico'
                : mode === 'signup'
                  ? 'Criar conta'
                  : 'Entrar'}
          </button>
        </form>

        <div className="login-mode-switch">
          {mode !== 'signin' && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setMode('signin')}>
              Já tenho conta
            </button>
          )}
          {mode !== 'signup' && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setMode('signup')}>
              Criar conta
            </button>
          )}
          {mode !== 'magic' && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setMode('magic')}>
              Link por e-mail
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
