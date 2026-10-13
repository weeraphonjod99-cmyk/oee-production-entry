import type { ProductionCapacityData, ProductionCapacityRecord } from './api';
import { totalDowntime } from './metrics';
import type { Machine, ProductionLog } from '../types';

export type ReportMode = 'machine' | 'person' | 'part' | 'detail';
export const reportText = (v: unknown) => String(v ?? '').trim().replace(/\s+/g, ' ').replace(/[‐‑‒–—]/g, '-').toLowerCase();
const stepKey = (v: unknown) => ['-', ''].includes(reportText(v)) ? '' : reportText(v);
const finite = (v: unknown) => v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v));
const positive = (v: unknown) => finite(v) && Number(v) > 0;
const capacityMachineAliases:Record<string,string> = {
  'sw#1 spot':'sw1# spot',
  'sw4 nms/cu box':'sw4 nms',
  'sw4 nmscu box':'sw4 nms',
  'sw5 cu cover':'sw5 cu',
  'sw6 nlc door':'sw6 nlc',
  'sw7 lc /nlc box':'sw7 lc 600',
  'sw7 lc nlc box':'sw7 lc 600',
  'sw8 lc door':'sw8 door lc',
  'tapping lc/nlc box':'tapping',
  'tapping lcnlc box':'tapping',
  '13#-110t':'13# 110t',
  'riveting pdb':'riveting',
};
export const capacityMachineKey=(value:string)=>capacityMachineAliases[reportText(value)]||reportText(value);
export const reportPerson = (log: ProductionLog) => log.entryUser?.trim() || 'ไม่ระบุผู้บันทึก';
export const reportPart = (log: Pick<ProductionLog, 'partNo' | 'productName' | 'step'>) => JSON.stringify([reportText(log.partNo), reportText(log.productName), stepKey(log.step)]);

export function reportRate(record: ProductionCapacityRecord, percent: number) {
  const p = Math.min(100, Math.max(85, Number.isFinite(percent) ? percent : 85)) / 100;
  // The source's KPI 85% is the report baseline. Scale it explicitly instead of
  // mixing it with the separate 100% columns, which can disagree in older exports.
  if (positive(record.kpi85PerMinute)) return Number(record.kpi85PerMinute) / .85 * p;
  if (positive(record.target8h)) return Number(record.target8h) / 480 / .85 * p;
  if (positive(record.kpi100PerMinute)) return Number(record.kpi100PerMinute) * p;
  if (positive(record.target8h100)) return Number(record.target8h100) / 480 * p;
  return null;
}

export function capacityMatcher(data: ProductionCapacityData | null, machines: Machine[], percent: number) {
  const aliases = new Map<string, string>();
  machines.forEach(m => { aliases.set(capacityMachineKey(m.id), capacityMachineKey(m.name)); aliases.set(capacityMachineKey(m.name), capacityMachineKey(m.name)); });
  const machineKey = (s: string) => aliases.get(capacityMachineKey(s)) || capacityMachineKey(s);
  const index = new Map<string, ProductionCapacityRecord[]>();
  data?.machines.forEach(m => m.records.forEach(r => {
    // Exports sometimes put the group (e.g. CNC or 80T) in machineName.
    // Prefer the worksheet's exact registered machine, never join an entire group.
    const candidates = [r.sheetName,m.sheetName,r.machineName,m.machineName];
    const machine = machineKey(candidates.find(n => aliases.has(capacityMachineKey(n))) || r.sheetName || m.sheetName || r.machineName);
    const part = r.partNo ? 'part:' + reportText(r.partNo) : 'name:' + reportText(r.productName);
    const key = JSON.stringify([machine, part]);
    index.set(key, [...(index.get(key) || []), r]);
  }));
  return (log: ProductionLog): {rate: number | null; reason: string} => {
    if (!data) return {rate: null, reason: 'ยังไม่มีข้อมูลกำลังผลิต'};
    const machine = machineKey(log.machineName || log.machineId);
    const part = log.partNo ? 'part:' + reportText(log.partNo) : 'name:' + reportText(log.productName);
    let rows = index.get(JSON.stringify([machine, part])) || [];
    if (!rows.length) return {rate: null, reason: 'ไม่พบเป้าของชิ้นงานนี้ในเครื่องที่เลือก'};
    if (stepKey(log.step)) rows = rows.filter(r => stepKey(r.step) === stepKey(log.step));
    if (!rows.length) return {rate: null, reason: `ไม่พบเป้าสำหรับ Step ${log.step} ของชิ้นงานนี้`};
    if (!stepKey(log.step) && new Set(rows.map(r => stepKey(r.step))).size > 1) return {rate: null, reason: 'ไม่ระบุ Step และพบหลาย Step'};
    const named = rows.filter(r => reportText(r.productName) === reportText(log.productName));
    if (named.length) rows = named;
    const rates = rows.map(r => reportRate(r, percent));
    if (rates.some(r => r === null)) return {rate: null, reason: 'เป้าหมายต่อนาทียังไม่ครบ'};
    const rate = rates[0]!;
    if (rates.some(r => Math.abs(r! - rate) > 1e-8)) return {rate: null, reason: 'พบเป้าหมายหลายค่าที่ขัดกัน'};
    return {rate, reason: ''};
  };
}

export type ReportRow = {
  key: string; machine: string; person: string; product: string; partNo: string; step: string;
  count: number; good: number; ng: number; test: number; output: number;
  minutes: number; run: number; downtime: number; target: number; eligible: number;
  missingTime: number; invalidQty: number; reasons: Record<string, number>;
};
export const emptyReportRow = (key = 'total'): ReportRow => ({key, machine:'', person:'', product:'', partNo:'',step:'',count:0,good:0,ng:0,test:0,output:0,minutes:0,run:0,downtime:0,target:0,eligible:0,missingTime:0,invalidQty:0,reasons:{}});
export function reportValues(row: ReportRow) {
  const complete = row.count > 0 && row.eligible === row.count && row.target > 0;
  return {
    target: complete ? row.target : null,
    rate: complete && row.minutes > 0 ? row.target / row.minutes : null,
    actualRate: !row.missingTime && !row.invalidQty && row.minutes > 0 ? row.output / row.minutes : null,
    kpi: complete ? row.output / row.target * 100 : null,
    gap: complete ? row.output - row.target : null,
  };
}
export function buildProductionReport(logs: ProductionLog[], mode: ReportMode, match: ReturnType<typeof capacityMatcher>) {
  const rows = new Map<string, ReportRow>(); const total = emptyReportRow();
  for (const log of logs) {
    const person = reportPerson(log); const machine = log.machineName || log.machineId;
    const part = reportPart(log);
    const key = JSON.stringify(mode === 'machine' ? [log.machineId || machine] : mode === 'person' ? [reportText(person)] : mode === 'part' ? [part] : [log.machineId || machine, reportText(person),part]);
    if (!rows.has(key)) rows.set(key, {...emptyReportRow(key),machine,person,product:log.productName,partNo:log.partNo,step:log.step});
    const downtime = totalDowntime(log);
    const minutes = log.workMinutes != null ? Number(log.workMinutes) : Number(log.normalMinutes) + downtime;
    const timeOk = Number.isFinite(minutes) && minutes > 0 && minutes <= 1440 && Number.isFinite(downtime) && downtime >= 0 && downtime <= 1440 && finite(log.normalMinutes) && log.normalMinutes >= 0 && log.normalMinutes <= 1440;
    const quantities = [log.goodQty, log.ngQty, log.testQty];
    const qtyOk = quantities.every(q => finite(q) && Number(q) >= 0);
    const [good,ng,test] = quantities.map(q => finite(q) && Number(q) >= 0 ? Number(q) : 0);
    const found = match(log); const eligible = found.rate !== null && timeOk && qtyOk;
    for (const row of [rows.get(key)!, total]) {
      row.count++; row.good+=good; row.ng+=ng; row.test+=test; row.output+=good+ng+test;
      row.minutes+=timeOk ? minutes : 0; row.run+=timeOk ? log.normalMinutes : 0;
      row.downtime+=timeOk ? downtime : 0;
      if (!timeOk) row.missingTime++; if (!qtyOk) row.invalidQty++;
      if (eligible) { row.target+=found.rate! * minutes; row.eligible++; }
      const reason = !timeOk ? minutes > 1440 || downtime > 1440 || log.normalMinutes > 1440 ? 'เวลาเกิน 24 ชั่วโมงต่อรายการรายวัน' : 'เวลาไม่ครบหรือไม่ถูกต้อง' : !qtyOk ? 'ยอดผลิตไม่ครบหรือไม่ถูกต้อง' : found.reason;
      if (reason) row.reasons[reason]=(row.reasons[reason] || 0)+1;
    }
  }
  return {rows:[...rows.values()],total};
}
