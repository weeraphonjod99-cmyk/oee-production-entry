import type { ProductionLog } from '../types';

export type RepairKind = 'mold' | 'equipment';
export type ReliabilityRow = { machine: string; records: number; run: number; repair: number; count: number; missing: number; invalid: number; estimated: number; mttr: number | null; mtbf: number | null };
const numeric = (v: unknown): number | null => {
  if (v === null || v === undefined || String(v).trim() === '') return null;
  const n = Number(v); return Number.isFinite(n) && n >= 0 ? n : null;
};
const empty = (machine: string): ReliabilityRow => ({machine,records:0,run:0,repair:0,count:0,missing:0,invalid:0,estimated:0,mttr:null,mtbf:null});
// Counts must be supplied explicitly; a production record is not a failure event.
// Aggregate numerators and denominators, never average per-record MTTR/MTBF.
export function buildReliability(logs: ProductionLog[], kind: RepairKind, estimate = false) {
  const groups = new Map<string,ReliabilityRow>(), total = empty('รวม / Total');
  for (const log of logs) {
    const key = log.machineId || log.machineName || 'unknown';
    if (!groups.has(key)) groups.set(key,empty(log.machineName || log.machineId || 'ไม่ระบุ / Unspecified'));
    const run = numeric(log.normalMinutes), repair = numeric(kind === 'mold' ? log.moldRepairMinutes : log.equipmentRepairMinutes);
    const rawCount = kind === 'mold' ? log.moldRepairCount : log.equipmentRepairCount;
    let count = numeric(rawCount), approximated = false;
    let invalid = run === null || repair === null || run > 1440 || repair > 1440 || run + repair > 1440;
    if (rawCount !== undefined && rawCount !== null && String(rawCount).trim() !== '') {
      if (count === null || !Number.isInteger(count) || (repair !== null && ((repair > 0 && count === 0) || (repair === 0 && count > 0)))) invalid = true;
    } else if (repair === 0) count = 0;
    else if (estimate && repair !== null && repair > 0) { count = 1; approximated = true; }
    for (const row of [groups.get(key)!,total]) {
      row.records++;
      if (invalid) { row.invalid++; continue; }
      row.run += run!; row.repair += repair!;
      if (count === null) row.missing++; else row.count += count;
      if (approximated) row.estimated++;
    }
  }
  const rows = [...groups.values()].sort((a,b)=>a.machine.localeCompare(b.machine,'th',{numeric:true}));
  for (const row of [total,...rows]) {
    if (row.records && !row.invalid && !row.missing && row.count > 0) { row.mttr=row.repair/row.count; row.mtbf=row.run/row.count; }
  }
  return {total,rows};
}
