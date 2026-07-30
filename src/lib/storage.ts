import type { ProductionLog, ProductMaster } from "../types";

const STORAGE_KEY = "oee-production-local-logs-v1";

export function loadLocalLogs(): ProductionLog[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalLogs(logs: ProductionLog[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

export function appendLocalLog(log: ProductionLog) {
  const next = [log, ...loadLocalLogs()];
  saveLocalLogs(next);
  return next;
}

export function upsertLocalLog(log: ProductionLog) {
  const existing = loadLocalLogs();
  const index = existing.findIndex((item) => item.id === log.id);
  const next = index >= 0 ? existing.map((item) => (item.id === log.id ? log : item)) : [log, ...existing];
  saveLocalLogs(next);
  return next;
}

function csvValue(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function downloadCsv(filename: string, headers: string[], rows: unknown[][]) {
  const csvRows = rows.map((row) => row.map(csvValue).join(","));
  const blob = new Blob([["\ufeff" + headers.map(csvValue).join(","), ...csvRows].join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function exportLogsCsv(logs: ProductionLog[]) {
  const headers = [
    "recordDate",
    "recordTime",
    "date",
    "shift",
    "shiftStartAt",
    "shiftEndAt",
    "machineName",
    "productName",
    "partNo",
    "step",
    "workMinutes",
    "timeSlots",
    "minutesPerSlot",
    "machineSpeed",
    "cavityQty",
    "normalMinutes",
    "changeoverMinutes",
    "inspectionMinutes",
    "equipmentRepairMinutes",
    "moldRepairMinutes",
    "materialChangeMinutes",
    "emergencyStopMinutes",
    "meetingMinutes",
    "plannedStopMinutes",
    "newModelMinutes",
    "goodQty",
    "ngQty",
    "testQty",
    "note",
    "updatedAt",
  ];
  const rows = logs.map((log) => headers.map((header) => log[header as keyof ProductionLog] ?? ""));
  downloadCsv(`production-logs-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
}

export function exportMasterCsv(products: ProductMaster[]) {
  const headers = ["Machine", "Product", "Part No.", "Step", "Sample Good"];
  const rows = products.map((product) => [
    product.machineName,
    product.productName,
    product.partNo,
    product.step || "-",
    product.sampleGoodQty,
  ]);
  downloadCsv(`master-data-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
}
