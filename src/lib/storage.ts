import type { ProductionLog } from "../types";

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
    "goodQty",
    "ngQty",
    "testQty",
    "note",
    "updatedAt",
  ];
  const rows = logs.map((log) =>
    headers
      .map((header) => {
        const value = String(log[header as keyof ProductionLog] ?? "");
        return `"${value.replace(/"/g, '""')}"`;
      })
      .join(","),
  );
  const blob = new Blob([[headers.join(","), ...rows].join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `production-logs-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}
