// Pomocnik tygodnia: zwraca 7 dat (pon–nd) zawierających podaną datę.

function iso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function currentWeekIso(today = new Date()): string[] {
  const d = new Date(today);
  // Sunday = 0, Monday = 1 …
  const dow = (d.getDay() + 6) % 7; // ile dni od poniedziałku
  const monday = new Date(d);
  monday.setDate(d.getDate() - dow);
  const out: string[] = [];
  for (let i = 0; i < 7; i++) {
    const di = new Date(monday);
    di.setDate(monday.getDate() + i);
    out.push(iso(di));
  }
  return out;
}

export const WEEKDAYS_PL = ['pn', 'wt', 'śr', 'cz', 'pt', 'sb', 'nd'];
