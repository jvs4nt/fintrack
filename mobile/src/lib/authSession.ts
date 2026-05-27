import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import { AuthApiError } from '@supabase/supabase-js';
import { supabase } from '@/src/lib/supabase';

const supabaseUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL || '').trim();

const STALE_REFRESH_PATTERNS = [
  'invalid refresh token',
  'refresh token not found',
  'refresh_token_not_found',
];

export function isNetworkError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message: unknown }).message)
        : String(error);
  const normalized = message.toLowerCase();
  return (
    normalized.includes('network request failed') ||
    normalized.includes('failed to fetch') ||
    normalized.includes('network error')
  );
}

function supabaseAuthStorageKey(): string {
  try {
    const ref = new URL(supabaseUrl).hostname.split('.')[0];
    if (ref) return `sb-${ref}-auth-token`;
  } catch {
    /* ignore */
  }
  return 'sb-auth-token';
}

/** Sessão em disco sem tentar refresh (útil offline ou quando a rede falha). */
async function readPersistedSession(): Promise<Session | null> {
  const raw = await AsyncStorage.getItem(supabaseAuthStorageKey());
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Session | { currentSession?: Session | null; session?: Session | null };
    if (parsed && typeof parsed === 'object' && 'access_token' in parsed) {
      return parsed as Session;
    }
    return parsed.currentSession ?? parsed.session ?? null;
  } catch {
    return null;
  }
}

export function isStaleRefreshError(error: unknown): boolean {
  if (!error) return false;
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message: unknown }).message)
        : String(error);
  const normalized = message.toLowerCase();
  if (STALE_REFRESH_PATTERNS.some((p) => normalized.includes(p))) return true;
  if (error instanceof AuthApiError) {
    const code = (error as AuthApiError & { code?: string }).code?.toLowerCase() ?? '';
    return code.includes('refresh') && (code.includes('not_found') || code.includes('invalid'));
  }
  return false;
}

/** Limpa sessão local sem revogar tokens em outros dispositivos. */
export async function recoverStaleAuthSession(): Promise<void> {
  await supabase.auth.signOut({ scope: 'local' });
}

export async function getSessionSafe(): Promise<Session | null> {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      if (isStaleRefreshError(error)) {
        await recoverStaleAuthSession();
        return null;
      }
      if (isNetworkError(error)) {
        return readPersistedSession();
      }
      throw error;
    }
    return data.session ?? null;
  } catch (error) {
    if (isStaleRefreshError(error)) {
      await recoverStaleAuthSession();
      return null;
    }
    if (isNetworkError(error)) {
      return readPersistedSession();
    }
    throw error;
  }
}
