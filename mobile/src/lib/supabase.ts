import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Evita crash em tempo de import quando `.env` ainda não existe (createClient exige URL não vazia).
 * Configure `EXPO_PUBLIC_SUPABASE_*` em `mobile/.env` para auth real.
 */
const PLACEHOLDER_URL = 'https://placeholder.supabase.co';
/** JWT sintaticamente válido (anon demo Supabase) — apenas para satisfazer createClient sem env */
const PLACEHOLDER_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDI4OTY5OTAsImV4cCI6MTk1ODQ3Mjk5MH0.ClFKkzg2EpyslcVtgEgvF_rdGGXSfHCgVvarhrfh170';

const supabaseUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL || PLACEHOLDER_URL).trim();
const supabaseKey = (process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || PLACEHOLDER_KEY).trim();

export const isSupabaseConfigured = Boolean(
  process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() &&
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()
);

/** AsyncStorage: sessão Supabase costuma passar de 2KB (limite do Expo SecureStore). */
const asyncStorageAdapter = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
  removeItem: (key: string) => AsyncStorage.removeItem(key),
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: asyncStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
