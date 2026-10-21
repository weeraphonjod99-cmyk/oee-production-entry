import type { ProductionLog } from '../types';
import { summarize, groupDowntime } from './metrics';

export function monthlyToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  return ['year','month','day'].map(key => parts.find(p => p.type === key)!.value).join('-');
}
export function monthlySummary(logs: ProductionLog[], month: string, machine = '', today = monthlyToday()) {
  const rows = logs.filter(row => row.date?.slice(0,7) === month && row.date <= today && (!machine || row.machineName === machine));
  const totals = summarize(rows);
  return { ...totals, rows, losses: groupDowntime(rows), oee: rows.length && totals.run + totals.downtime > 0 && totals.good + totals.ng > 0 ? totals.availability * totals.quality : null };
}
export function monthlyTrend(logs: ProductionLog[], month: string, machine = '', today = monthlyToday()) {
  const [year, m] = month.split('-').map(Number);
  return Array.from({length:6}, (_, i) => {
    const date = new Date(Date.UTC(year, m - 6 + i, 1));
    const key = date.toISOString().slice(0,7);
    return { month: key, ...monthlySummary(logs, key, machine, today) };
  });
}
