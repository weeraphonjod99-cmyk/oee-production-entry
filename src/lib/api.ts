import type { ProductionLog } from "../types";

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL?.trim() ?? "";

export const remoteEnabled = APPS_SCRIPT_URL.length > 0;

export type ProductDefaults = {
  machineSpeed?: number;
  cavityQty?: number;
  minutesPerSlot?: number;
};

export type PdWorksheet = {
  name: string;
  headers: string[];
  rows: string[][];
  rowCount: number;
  columnCount: number;
  truncated: boolean;
};

export type PdWorkbook = {
  ok: boolean;
  id: string;
  label: string;
  name: string;
  url: string;
  fetchedAt: string;
  error?: string;
  shareEmail?: string;
  technicalError?: string;
  sheets: PdWorksheet[];
};

export type EmployeeMachineStatus = {
  machineId: string;
  machineName: string;
  date: string;
  shift: string;
  productName: string;
  partNo: string;
  step: string;
  status: "active" | "cleared";
  entryUpdatedAt: string;
  updatedAt: string;
  expiresAt: string;
};

async function parseJsonResponse(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(text || `HTTP ${response.status}`);
  }
}

export async function fetchRemoteLogs(limit = 3000): Promise<ProductionLog[]> {
  if (!remoteEnabled) return [];
  const url = new URL(APPS_SCRIPT_URL);
  url.searchParams.set("action", "logs");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("_", String(Date.now()));
  const response = await fetch(url.toString(), { cache: "no-store" });
  const data = await parseJsonResponse(response);
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || "โหลดข้อมูลจาก Google Sheet ไม่สำเร็จ");
  }
  return Array.isArray(data.logs) ? data.logs : [];
}

export async function fetchEmployeeMachineStatuses(): Promise<EmployeeMachineStatus[]> {
  if (!remoteEnabled) return [];
  const url = new URL(APPS_SCRIPT_URL);
  url.searchParams.set("action", "employeeMachineStatuses");
  url.searchParams.set("_", String(Date.now()));
  const response = await fetch(url.toString(), { cache: "no-store" });
  const data = await parseJsonResponse(response);
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || "โหลดสถานะเครื่องจาก Google Sheet ไม่สำเร็จ");
  }
  return Array.isArray(data.statuses) ? data.statuses : [];
}

export async function upsertEmployeeMachineStatus(status: EmployeeMachineStatus): Promise<EmployeeMachineStatus> {
  if (!remoteEnabled) return status;
  const response = await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "upsertEmployeeMachineStatus", payload: status }),
  });
  const data = await parseJsonResponse(response);
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || "บันทึกสถานะเครื่องลง Google Sheet ไม่สำเร็จ");
  }
  return data.status ?? status;
}

export async function clearEmployeeMachineStatus(machineId: string): Promise<void> {
  if (!remoteEnabled || !machineId) return;
  const response = await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "clearEmployeeMachineStatus", payload: { machineId } }),
  });
  const data = await parseJsonResponse(response);
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || "ล้างสถานะเครื่องใน Google Sheet ไม่สำเร็จ");
  }
}

export async function fetchPdSheets(): Promise<PdWorkbook[]> {
  if (!remoteEnabled) return [];
  const url = new URL(APPS_SCRIPT_URL);
  url.searchParams.set("action", "pdSheets");
  url.searchParams.set("_", String(Date.now()));
  const response = await fetch(url.toString(), { cache: "no-store" });
  const data = await parseJsonResponse(response);
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || "โหลดข้อมูล PD จาก Google Sheet ไม่สำเร็จ");
  }
  return Array.isArray(data.sources) ? data.sources : [];
}

export async function appendRemoteLog(log: ProductionLog): Promise<ProductionLog> {
  if (!remoteEnabled) return log;
  const response = await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "appendLog", payload: log }),
  });
  const data = await parseJsonResponse(response);
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || "บันทึกข้อมูลลง Google Sheet ไม่สำเร็จ");
  }
  return data.log ?? log;
}

export async function updateRemoteLog(log: ProductionLog): Promise<ProductionLog> {
  if (!remoteEnabled) return log;
  const response = await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "upsertLog", payload: log }),
  });
  const data = await parseJsonResponse(response);
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || "บันทึกแก้ไขข้อมูลลง Google Sheet ไม่สำเร็จ");
  }
  return data.log ?? log;
}

export async function fetchProductDefaults(input: {
  machineName: string;
  productName: string;
  partNo: string;
  step: string;
}): Promise<ProductDefaults> {
  if (!remoteEnabled) return {};
  const response = await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "getProductDefaults", payload: input }),
  });
  const data = await parseJsonResponse(response);
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || "โหลดค่ามาตรฐานจาก Google Sheet ไม่สำเร็จ");
  }
  return data.defaults ?? {};
}
