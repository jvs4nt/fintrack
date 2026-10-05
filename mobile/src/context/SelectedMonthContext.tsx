import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '@/src/lib/api';
import { YearMonth, clampToNavigable, computePlanningMonth } from '@/src/lib/yearMonth';

interface SelectedMonthValue {
  /** Mês exibido no Dashboard e em Meses (compartilhado entre as abas). */
  selected: YearMonth;
  setSelected: (next: YearMonth) => void;
  /** Mês de planejamento (payday); `null` até carregar as configurações. */
  planning: YearMonth | null;
  /** `true` depois de tentar carregar o payday — evita buscar dados do mês errado. */
  ready: boolean;
  /** Recalcula o mês de planejamento após alterar o payday e navega até ele. */
  applyPayday: (payday: number) => void;
}

const SelectedMonthContext = createContext<SelectedMonthValue | null>(null);

export function SelectedMonthProvider({ children }: { children: ReactNode }) {
  const [selected, setSelectedState] = useState<YearMonth>(() => {
    const today = new Date();
    return clampToNavigable({ year: today.getFullYear(), month: today.getMonth() + 1 });
  });
  const [planning, setPlanning] = useState<YearMonth | null>(null);
  const [ready, setReady] = useState(false);

  const applyPayday = useCallback((payday: number) => {
    const next = clampToNavigable(computePlanningMonth(payday));
    setPlanning(next);
    setSelectedState(next);
  }, []);

  const setSelected = useCallback((next: YearMonth) => {
    setSelectedState(clampToNavigable(next));
  }, []);

  useEffect(() => {
    let active = true;
    api.settings
      .get()
      .then((settings) => {
        if (active) applyPayday(settings.payday);
      })
      .catch(() => {
        /* mantém o mês corrente */
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, [applyPayday]);

  const value = useMemo(
    () => ({ selected, setSelected, planning, ready, applyPayday }),
    [selected, setSelected, planning, ready, applyPayday]
  );

  return <SelectedMonthContext.Provider value={value}>{children}</SelectedMonthContext.Provider>;
}

export function useSelectedMonth(): SelectedMonthValue {
  const ctx = useContext(SelectedMonthContext);
  if (!ctx) {
    throw new Error('useSelectedMonth must be used within SelectedMonthProvider');
  }
  return ctx;
}
