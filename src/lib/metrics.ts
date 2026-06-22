import type { ProductionLog } from "../types";

export type DowntimeKey =
  | "changeoverMinutes"
  | "inspectionMinutes"
  | "equipmentRepairMinutes"
  | "moldRepairMinutes"
  | "materialChangeMinutes"
  | "emergencyStopMinutes"
  | "meetingMinutes"
  | "plannedStopMinutes";

export const downtimeFields: Array<{ key: DowntimeKey; label: string; shortLabel: string }> = [
  { key: "changeoverMinutes", label: "เปลี่ยนรุ่น", shortLabel: "Change" },
  { key: "inspectionMinutes", label: "ตรวจสอบ", shortLabel: "Inspect" },
  { key: "equipmentRepairMinutes", label: "ซ่อมเครื่อง", shortLabel: "Equip" },
  { key: "moldRepairMinutes", label: "ซ่อมแม่พิมพ์", shortLabel: "Mold" },
  { key: "materialChangeMinutes", label: "เปลี่ยนวัตถุดิบ", shortLabel: "Material" },
  { key: "emergencyStopMinutes", label: "หยุดไม่ทราบสาเหตุ", shortLabel: "Stop" },
  { key: "meetingMinutes", label: "ประชุม/5S/เปลี่ยนกะ", shortLabel: "Meeting" },
  { key: "plannedStopMinutes", label: "หยุดตามแผน", shortLabel: "Plan" },
];

export function totalDowntime(log: Pick<ProductionLog, DowntimeKey>) {
  return downtimeFields.reduce((sum, field) => sum + Number(log[field.key] || 0), 0);
}

export function totalOutput(log: Pick<ProductionLog, "goodQty" | "ngQty" | "testQty">) {
  return Number(log.goodQty || 0) + Number(log.ngQty || 0) + Number(log.testQty || 0);
}

export function quality(logs: ProductionLog[]) {
  const good = logs.reduce((sum, log) => sum + log.goodQty, 0);
  const ng = logs.reduce((sum, log) => sum + log.ngQty, 0);
  return good + ng === 0 ? 0 : good / (good + ng);
}

export function availability(logs: ProductionLog[]) {
  const run = logs.reduce((sum, log) => sum + log.normalMinutes, 0);
  const all = logs.reduce((sum, log) => sum + log.normalMinutes + totalDowntime(log), 0);
  return all === 0 ? 0 : run / all;
}

export function summarize(logs: ProductionLog[]) {
  const good = logs.reduce((sum, log) => sum + log.goodQty, 0);
  const ng = logs.reduce((sum, log) => sum + log.ngQty, 0);
  const test = logs.reduce((sum, log) => sum + log.testQty, 0);
  const downtime = logs.reduce((sum, log) => sum + totalDowntime(log), 0);
  const run = logs.reduce((sum, log) => sum + log.normalMinutes, 0);
  return {
    good,
    ng,
    test,
    total: good + ng + test,
    downtime,
    run,
    quality: quality(logs),
    availability: availability(logs),
  };
}

export function groupDowntime(logs: ProductionLog[]) {
  return downtimeFields
    .map((field) => ({
      ...field,
      minutes: logs.reduce((sum, log) => sum + Number(log[field.key] || 0), 0),
    }))
    .sort((a, b) => b.minutes - a.minutes);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 }).format(value);
}

export function formatPercent(value: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);
}
