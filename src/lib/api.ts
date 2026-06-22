import type { ProductionLog } from "../types";

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL?.trim() ?? "";

export const remoteEnabled = APPS_SCRIPT_URL.length > 0;

async function parseJsonResponse(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(text || `HTTP ${response.status}`);
  }
}

export async function fetchRemoteLogs(limit = 500): Promise<ProductionLog[]> {
  if (!remoteEnabled) return [];
  const url = new URL(APPS_SCRIPT_URL);
  url.searchParams.set("action", "logs");
  url.searchParams.set("limit", String(limit));
  const response = await fetch(url.toString());
  const data = await parseJsonResponse(response);
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || "โหลดข้อมูลจาก Google Sheet ไม่สำเร็จ");
  }
  return Array.isArray(data.logs) ? data.logs : [];
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
