import { useCallback, useEffect, useState } from 'react';
import {
  ThemePreference,
  applyTheme,
  readPreference,
  resolveTheme,
  savePreference,
  subscribeToSystemTheme,
} from '../lib/theme';

export function useTheme() {
  const [preference, setPreferenceState] = useState<ThemePreference>(readPreference);

  useEffect(() => {
    applyTheme(resolveTheme(preference), { animate: true });
    if (preference !== 'system') return;
    return subscribeToSystemTheme(() => applyTheme(resolveTheme('system'), { animate: true }));
  }, [preference]);

  const setPreference = useCallback((next: ThemePreference) => {
    savePreference(next);
    setPreferenceState(next);
  }, []);

  return { preference, setPreference };
}

export default useTheme;
