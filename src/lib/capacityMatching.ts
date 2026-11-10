import type { ProductionCapacityData, ProductionCapacityRecord } from './api';
import type { Machine, ProductionLog } from '../types';

/** Keep every rate scoped to a machine, part number and an unambiguous step. */
export function createCapacityMatcher(data: ProductionCapacityData | null, machines: Machine[], percent: number) {
  const text = (v: unknown) => String(v ?? '').trim().replace(/[‐‑‒–—]/g, '-').replace(/\s+/g, ' ').toLowerCase();
  const partKey = (v: unknown) => text(v).replace(/^nms\s*\/\s*(?=bru\d)/, '').replace(/[^a-z0-9]/g, '');
  const stepKey = (v: unknown) => ['-', '—', ''].includes(text(v)) ? '' : text(v).replace(/\s+/g, '');
  const names: Record<string, string> = {
    'sw#1 spot':'sw1# spot', 'sw4 nms/cu box':'sw4 nms', 'sw4 nmscu box':'sw4 nms',
    'sw5 cu cover':'sw5 cu', 'sw6 nlc door':'sw6 nlc', 'sw7 lc /nlc box':'sw7 lc 600',
    'sw7 lc/nlc box':'sw7 lc 600', 'sw7 lc nlc box':'sw7 lc 600', 'sw8 lc door':'sw8 door lc',
    'tapping lc/nlc box':'tapping', 'tapping lcnlc box':'tapping', '13#-110t':'13# 110t', 'riveting pdb':'riveting',
  };
  const machineText = (v: unknown) => names[text(v)] || text(v);
  const aliases = new Map<string, string>();
  machines.forEach(m => { aliases.set(machineText(m.id), machineText(m.name)); aliases.set(machineText(m.name), machineText(m.name)); });
  const machineKey = (v: unknown) => aliases.get(machineText(v)) || machineText(v);
  const machineNumber = (v: unknown) => {
    const s = text(v); if (/^\d+$/.test(s)) return String(Number(s));
    const m = s.match(/(?:^|\s)(\d+)\s*#|#\s*(\d+)(?:\s|$)/); return m?.[1] || m?.[2] || '';
  };
  const machineSize = (v: unknown) => {
    const s = text(v), m = s.match(/(\d+(?:\.\d+)?)\s*(?:t|tons?)\b/);
    return m ? `${Number(m[1])}t` : /^\d+(?:\.\d+)?$/.test(s) ? `${Number(s)}t` : '';
  };
  const rate = (r: ProductionCapacityRecord) => {
    const positive = (v: unknown) => Number.isFinite(Number(v)) && Number(v) > 0;
    const p = Math.min(100, Math.max(85, Number.isFinite(percent) ? percent : 85)) / 100;
    if (positive(r.kpi85PerMinute)) return Number(r.kpi85PerMinute) / .85 * p;
    if (positive(r.target8h)) return Number(r.target8h) / 480 / .85 * p;
    if (positive(r.kpi100PerMinute)) return Number(r.kpi100PerMinute) * p;
    if (positive(r.target8h100)) return Number(r.target8h100) / 480 * p;
    return null;
  };
  const index = new Map<string, ProductionCapacityRecord[]>();
  data?.machines.forEach(m => m.records.forEach(r => {
    const candidates = [r.sheetName, m.sheetName, r.machineName, m.machineName];
    const machine = machineKey(candidates.find(n => aliases.has(machineText(n))) || r.sheetName || m.sheetName || r.machineName);
    if (!partKey(r.partNo)) return;
    const key = JSON.stringify([machine, partKey(r.partNo)]);
    index.set(key, [...(index.get(key) || []), r]);
  }));
  return (log: ProductionLog): {rate: number | null; reason: string; step?: string} => {
    const missing = (reason: string) => ({rate: null, reason});
    if (!data) return missing('กำลังรอข้อมูลเป้าหมายจากชีต');
    if (!partKey(log.partNo)) return missing('ไม่มี Part No. สำหรับเทียบเป้าหมาย');
    const machine = machineKey(log.machineName || log.machineId);
    let rows = index.get(JSON.stringify([machine, partKey(log.partNo)])) || [];
    // Previously verified UPPER LINK alias; do not generalize to digit-only matches.
    if (!rows.length && machine === machineKey('3# OCP-110T') && ['48187060', '48187060aa'].includes(partKey(log.partNo)) && text(log.productName) === 'upper link') {
      rows = [{sheetName:'3# OCP-110T', machineName:'3# OCP-110T', partNo:'48187060', productName:'UPPER LINK', step:'', kpi85PerMinute:68, kpi100PerMinute:80} as ProductionCapacityRecord];
    }
    if (!rows.length) return missing(`ไม่พบ Part No. ${log.partNo} ในชีตของ ${log.machineName || log.machineId}`);
    const number = machineNumber(log.machineName || log.machineId), size = machineSize(log.machineName || log.machineId);
    rows = rows.filter(r => {
      const n = machineNumber(r.machineNo) || machineNumber(r.sheetName) || machineNumber(r.machineName);
      const s = machineSize(r.machineType) || machineSize(r.sheetName) || machineSize(r.machineName);
      return (!number || !n || number === n) && (!size || !s || size === s);
    });
    if (!rows.length) return missing('หมายเลขหรือขนาดเครื่องไม่ตรงกับ Capacity');
    const step = stepKey(log.step);
    if (step) {
      const exact = rows.filter(r => stepKey(r.step) === step);
      if (exact.length) rows = exact;
      else if (!rows.every(r => !stepKey(r.step))) {
        // A bare ordinal may match a fraction only if it identifies ONE step.
        // Never equate 2/3 with 2/4 or collapse substeps such as 2-1/3.
        const ordinal = step.match(/^(\d+)(?:\/\d+)?$/)?.[1];
        const compatible = ordinal ? rows.filter(r => {
          const s = stepKey(r.step), m = s.match(/^(\d+)(?:\/\d+)?$/);
          return m && m[1] === ordinal && (!step.includes('/') || !s.includes('/'));
        }) : [];
        rows = new Set(compatible.map(r => stepKey(r.step))).size === 1 ? compatible : [];
      }
      // All source rows unstepped: use the part-level rate only if they agree below.
    } else if (new Set(rows.map(r => stepKey(r.step))).size > 1) {
      return missing('ไม่ระบุ Step และชีตมีหลายขั้นตอน กรุณาระบุ Step');
    }
    if (!rows.length) return missing(`ไม่พบเป้าสำหรับ Step ${log.step} ของ ${log.partNo}`);
    const rates = rows.map(rate);
    if (rates.some(r => r === null)) return missing('ชีตยังไม่มีอัตราเป้าหมายต่อนาทีครบ');
    if (rates.some(r => Math.abs(r! - rates[0]!) > 1e-8)) return missing('ชีตมีเป้าหมายซ้ำต่างค่า กรุณาตรวจ Part No. และ Step');
    return {rate: rates[0]!, reason: ''};
  };
}
