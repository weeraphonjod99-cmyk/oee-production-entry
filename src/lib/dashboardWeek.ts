// Calendar weeks follow the factory's Bangkok timezone, Monday through Sunday.
export function currentDashboardWeek(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const part = (name: string) => parts.find(p => p.type === name)!.value;
  const start = new Date(`${part('year')}-${part('month')}-${part('day')}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() - (start.getUTCDay() + 6) % 7);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  return { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) };
}

export function advanceDashboardWeek<T extends { from: string; to: string }>(
  filters: T, previous: { from: string; to: string }, next: { from: string; to: string },
): T {
  return filters.from === previous.from && filters.to === previous.to
    ? { ...filters, ...next } : filters;
}
