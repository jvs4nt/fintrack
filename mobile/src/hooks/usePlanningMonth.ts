/**
 * Mês de planejamento (payday) — mesma regra que frontend/src/App.tsx + spec/CONVENTIONS.md
 */
export function computePlanningMonth(payday: number): { year: number; month: number } {
  const today = new Date();
  const currentDay = today.getDate();
  const planningDate = new Date();
  if (currentDay > payday) {
    planningDate.setMonth(today.getMonth() + 1);
  } else {
    planningDate.setMonth(today.getMonth());
  }
  return { year: planningDate.getFullYear(), month: planningDate.getMonth() + 1 };
}
