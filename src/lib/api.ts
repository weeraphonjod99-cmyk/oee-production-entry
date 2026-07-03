import type { Machine, ProductionLog, ProductionOrder } from "../types";

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
  materialOfProduction?: string;
  userName?: string;
  goodQty?: number;
  ngQty?: number;
  testQty?: number;
  workMinutes?: number;
  timeSlots?: number;
  minutesPerSlot?: number;
  machineSpeed?: number;
  cavityQty?: number;
  downtimeMinutes?: number;
  normalMinutes?: number;
  changeoverMinutes?: number;
  inspectionMinutes?: number;
  equipmentRepairMinutes?: number;
  moldRepairMinutes?: number;
  materialChangeMinutes?: number;
  emergencyStopMinutes?: number;
  meetingMinutes?: number;
  plannedStopMinutes?: number;
  note?: string;
  activeTimerKey?: string;
  activeTimerLabel?: string;
  activeTimerStartedAt?: string;
  activeTimerBaseAt?: string;
  activeTimerBaseMinutes?: number;
  buttonDetails?: string;
  buttonDetailsUpdatedAt?: string;
  workStartedAt?: string;
  entryStartedAt?: string;
  status: "active" | "cleared";
  entryUpdatedAt: string;
  updatedAt: string;
  expiresAt: string;
};

export type ProductionOrderMachineSummary = {
  machineId: string;
  machineName: string;
  pendingCount: number;
  pendingOrders: ProductionOrder[];
};

async function parseJsonResponse(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(text || `HTTP ${response.status}`);
  }
}

const requestTimeoutMs = 12000;

const sleep = (ms: number) => new Promise((resolve) => globalThis.setTimeout(resolve, ms));

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}) {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), requestTimeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

async function fetchWithRetry(input: RequestInfo | URL, init: RequestInit = {}, attempts = 2) {
  let lastError: unknown;
  for (let attempt = 0; attempt <= attempts; attempt++) {
    try {
      return await fetchWithTimeout(input, init);
    } catch (error) {
      lastError = error;
      if (attempt >= attempts) break;
      await sleep(500 * (attempt + 1));
    }
  }
  throw lastError;
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
  const response = await fetchWithRetry(url.toString(), { cache: "no-store" });
  const data = await parseJsonResponse(response);
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || "โหลดสถานะเครื่องจาก Google Sheet ไม่สำเร็จ");
  }
  return Array.isArray(data.statuses) ? data.statuses : [];
}

export async function fetchProductionOrders(input: { machineId: string; machineName: string }): Promise<ProductionOrder[]> {
  if (!remoteEnabled) return [];
  const url = new URL(APPS_SCRIPT_URL);
  url.searchParams.set("action", "productionOrders");
  url.searchParams.set("machineId", input.machineId);
  url.searchParams.set("machineName", input.machineName);
  url.searchParams.set("_", String(Date.now()));
  const response = await fetch(url.toString(), { cache: "no-store" });
  const data = await parseJsonResponse(response);
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || "โหลดออเดอร์การผลิตจาก Google Sheet ไม่สำเร็จ");
  }
  return Array.isArray(data.orders) ? data.orders : [];
}

export async function fetchProductionOrderSummaries(): Promise<ProductionOrderMachineSummary[]> {
  if (!remoteEnabled) return [];
  const url = new URL(APPS_SCRIPT_URL);
  url.searchParams.set("action", "productionOrderSummaries");
  url.searchParams.set("_", String(Date.now()));
  const response = await fetch(url.toString(), { cache: "no-store" });
  const data = await parseJsonResponse(response);
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || "โหลดสรุปออเดอร์การผลิตจาก Google Sheet ไม่สำเร็จ");
  }
  return Array.isArray(data.summaries) ? data.summaries : [];
}

export async function upsertProductionOrder(order: ProductionOrder): Promise<ProductionOrder> {
  if (!remoteEnabled) return order;
  const response = await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "upsertProductionOrder", payload: order }),
  });
  const data = await parseJsonResponse(response);
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || "บันทึกออเดอร์ลง Google Sheet ไม่สำเร็จ");
  }
  return data.order ?? order;
}

export async function reorderProductionOrder(order: ProductionOrder): Promise<ProductionOrder> {
  if (!remoteEnabled) return order;
  const response = await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "reorderProductionOrder", payload: order }),
  });
  const data = await parseJsonResponse(response);
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || "จัดลำดับออเดอร์ใน Google Sheet ไม่สำเร็จ");
  }
  return data.order ?? order;
}

export async function fetchMachines(): Promise<Machine[]> {
  if (!remoteEnabled) return [];
  const url = new URL(APPS_SCRIPT_URL);
  url.searchParams.set("action", "machines");
  url.searchParams.set("_", String(Date.now()));
  const response = await fetch(url.toString(), { cache: "no-store" });
  const data = await parseJsonResponse(response);
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || "โหลดรายชื่อเครื่องจักรจาก Google Sheet ไม่สำเร็จ");
  }
  return Array.isArray(data.machines) ? data.machines : [];
}

export async function upsertEmployeeMachineStatus(status: EmployeeMachineStatus): Promise<EmployeeMachineStatus> {
  if (!remoteEnabled) return status;
  const response = await fetchWithRetry(APPS_SCRIPT_URL, {
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

export async function clearEmployeeMachineStatus(machineId: string, clearedAt?: string): Promise<void> {
  if (!remoteEnabled || !machineId) return;
  const response = await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "clearEmployeeMachineStatus", payload: { clearedAt, machineId } }),
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
