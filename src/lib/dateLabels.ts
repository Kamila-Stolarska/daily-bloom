// Wspólne polskie etykiety dat — używane przez sekcje Insights (wykres trendu,
// porównanie okresów, widok listy), żeby nie duplikować tablicy miesięcy.

const MONTHS_PL_SHORT = [
  'sty', 'lut', 'mar', 'kwi', 'maj', 'cze',
  'lip', 'sie', 'wrz', 'paź', 'lis', 'gru',
];

const MONTHS_PL_FULL = [
  'stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
  'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia',
];

export function formatShortDatePl(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return `${d.getDate()} ${MONTHS_PL_SHORT[d.getMonth()]}`;
}

export function formatFullDatePl(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return `${d.getDate()} ${MONTHS_PL_FULL[d.getMonth()]}`;
}
