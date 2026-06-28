import {
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Database,
  Download,
  FileText,
  Gauge,
  History,
  KeyRound,
  LockKeyhole,
  LogOut,
  Pencil,
  Save,
  Search,
  Share2,
  TableProperties,
  Trash2,
  Upload,
  UserPlus,
  UserRound,
  Wifi,
  WifiOff,
} from "lucide-react";
import { FormEvent, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { machines, products, seedLogs } from "./data/oeeMasterData.generated";
import {
  appendRemoteLog,
  fetchPdSheets,
  fetchProductDefaults,
  fetchRemoteLogs,
  remoteEnabled,
  updateRemoteLog,
  type PdWorkbook,
  type ProductDefaults,
} from "./lib/api";
import {
  canAccessTab,
  changePassword,
  clearSession,
  createUser,
  deleteUser,
  listUsers,
  loadSession,
  signIn,
  type AppRole,
  type AppSession,
  type AppUserSummary,
} from "./lib/auth";
import {
  type DowntimeKey,
  downtimeFields,
  formatNumber,
  formatPercent,
  formatRate,
  groupDowntime,
  summarize,
  totalDowntime,
  totalOutput,
} from "./lib/metrics";
import { appendLocalLog, exportLogsCsv, loadLocalLogs, saveLocalLogs, upsertLocalLog } from "./lib/storage";
import type { EntryDraft, Machine, ProductionLog, ProductMaster } from "./types";

type TabId = "employeeEntry" | "entry" | "dashboard" | "reports" | "pd" | "history" | "master" | "users";

type Filters = {
  machineId: string;
  shift: string;
  from: string;
  to: string;
};

type ProductFieldKey = "productName" | "partNo" | "step";

const getTodayInputValue = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getCurrentTimeInputValue = () => {
  const now = new Date();
  return [
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0"),
  ].join(":");
};

const getRecordDate = (log?: Pick<ProductionLog, "recordDate"> | null) => log?.recordDate || "";
const getDraftRecordDate = (log?: Pick<ProductionLog, "recordDate"> | null) => getRecordDate(log) || getTodayInputValue();
const getRecordTime = (log?: Pick<ProductionLog, "recordTime"> | null) => log?.recordTime || "";
const getDraftRecordTime = (log?: Pick<ProductionLog, "recordTime"> | null) => getRecordTime(log) || getCurrentTimeInputValue();

const downtimeExcelCodes = {
  changeoverMinutes: "B",
  inspectionMinutes: "C",
  equipmentRepairMinutes: "D",
  moldRepairMinutes: "E",
  materialChangeMinutes: "F",
  emergencyStopMinutes: "G",
  meetingMinutes: "H",
  plannedStopMinutes: "X",
} as const;

const defaultMachine = machines[0];
const defaultProduct = products.find((product) => product.machineId === defaultMachine.id) ?? products[0];
const SHIFT_DAY = "day";
const SHIFT_NIGHT = "night";
const orderedShiftOptions = [SHIFT_DAY, SHIFT_NIGHT];
const brandLogoSrc = `${import.meta.env.BASE_URL}jr-logo.png`;
const productionShareUrl = "https://weeraphonjod99-cmyk.github.io/oee-production-entry/";
const defaultMinutesPerSlot = 5;

const toPositiveNumber = (value: string) => Math.max(Number(value) || 0, 0);
const numberInputValue = (value: number | undefined) => (Number(value || 0) > 0 ? String(value) : "");
const roundNumber = (value: number) => Number(value.toFixed(2));

const slotsFromMinutes = (workMinutes: number, minutesPerSlot: number) =>
  minutesPerSlot > 0 ? roundNumber(workMinutes / minutesPerSlot) : 0;

const minutesToSlots = (minutes: number, minutesPerSlot: number) =>
  minutesPerSlot > 0 ? roundNumber(minutes / minutesPerSlot) : 0;

const slotsToMinutes = (slots: number, minutesPerSlot: number) => roundNumber(slots * minutesPerSlot);

function createEmptyDraft(machine: Machine, product: ProductMaster): EntryDraft {
  const minutesPerSlot = defaultMinutesPerSlot;
  return {
    date: getTodayInputValue(),
    recordDate: getTodayInputValue(),
    recordTime: getCurrentTimeInputValue(),
    shift: SHIFT_DAY,
    shiftStartAt: shiftStartAt(getTodayInputValue(), SHIFT_DAY),
    shiftEndAt: shiftEndAt(getTodayInputValue(), SHIFT_DAY),
    machineId: machine.id,
    productName: product.productName,
    partNo: product.partNo,
    step: product.step,
    machineSpeed: 0,
    cavityQty: 0,
    workMinutes: machine.capacityMinutes,
    timeSlots: slotsFromMinutes(machine.capacityMinutes, minutesPerSlot),
    minutesPerSlot,
    changeoverMinutes: 0,
    inspectionMinutes: 0,
    equipmentRepairMinutes: 0,
    moldRepairMinutes: 0,
    materialChangeMinutes: 0,
    emergencyStopMinutes: 0,
    meetingMinutes: 0,
    plannedStopMinutes: 0,
    goodQty: 0,
    ngQty: 0,
    testQty: 0,
    note: "",
  };
}

const shiftLabel = (shift: string) => {
  const normalized = normalizeShiftCode(shift);
  if (normalized === SHIFT_DAY) return "กะเช้า / Day";
  if (normalized === SHIFT_NIGHT) return "กะดึก / Night";
  return shift;
};

const makeLogId = () => `log-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const normalizeText = (value: unknown) => String(value ?? "").trim().toLowerCase();
const normalizeShiftCode = (value: unknown) => {
  const text = normalizeText(value);
  if (["白", "day", "a", "d", "็ฝ", "เนยเธ"].includes(text)) return SHIFT_DAY;
  if (["夜", "night", "b", "n", "ๅค", "เน…เธ\u009c"].includes(text)) return SHIFT_NIGHT;
  return text;
};

const addDaysToInputDate = (date: string, days: number) => {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return date;
  const value = new Date(year, month - 1, day);
  value.setDate(value.getDate() + days);
  return [
    value.getFullYear(),
    String(value.getMonth() + 1).padStart(2, "0"),
    String(value.getDate()).padStart(2, "0"),
  ].join("-");
};

const getShiftSchedule = (productionDate: string, shift: string) => {
  const date = productionDate || getTodayInputValue();
  const normalized = normalizeShiftCode(shift);
  if (normalized === SHIFT_NIGHT) {
    const endDate = addDaysToInputDate(date, 1);
    return {
      endDate,
      endTime: "08:00",
      label: "กะดึก",
      rangeLabel: `${date} 20:00 - ${endDate} 08:00`,
      startDate: date,
      startTime: "20:00",
    };
  }
  return {
    endDate: date,
    endTime: "20:00",
    label: "กะเช้า",
    rangeLabel: `${date} 08:00 - ${date} 20:00`,
    startDate: date,
    startTime: "08:00",
  };
};

const shiftWindowLabel = (productionDate: string, shift: string) => getShiftSchedule(productionDate, shift).rangeLabel;

const shiftStartAt = (productionDate: string, shift: string) => {
  const schedule = getShiftSchedule(productionDate, shift);
  return `${schedule.startDate}T${schedule.startTime}:00`;
};

const shiftEndAt = (productionDate: string, shift: string) => {
  const schedule = getShiftSchedule(productionDate, shift);
  return `${schedule.endDate}T${schedule.endTime}:00`;
};

type ReportRow = {
  good: number;
  ng: number;
  test: number;
  downtime: number;
  normalMinutes: number;
  total: number;
  count: number;
  label: string;
  detail: string;
};

type DowntimeStatRow = {
  count: number;
  key: string;
  label: string;
  minutes: number;
  percent: number;
  shortLabel: string;
};

type XlsxModule = {
  read: (data: ArrayBuffer, options: { type: "array" }) => { SheetNames: string[]; Sheets: Record<string, unknown> };
  utils: {
    sheet_to_json: (sheet: unknown, options: { defval: string; header: 1; raw: false }) => unknown[][];
  };
};

const XLSX_MODULE_URL = "https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs";

const emptyReportRow = (label: string, detail = ""): ReportRow => ({
  good: 0,
  ng: 0,
  test: 0,
  downtime: 0,
  normalMinutes: 0,
  total: 0,
  count: 0,
  label,
  detail,
});

function aggregateReportRows(logs: ProductionLog[], keyFor: (log: ProductionLog) => string, detailFor: (log: ProductionLog) => string) {
  const map = new Map<string, ReportRow>();
  logs.forEach((log) => {
    const key = keyFor(log);
    const current = map.get(key) ?? emptyReportRow(key, detailFor(log));
    current.good += Number(log.goodQty || 0);
    current.ng += Number(log.ngQty || 0);
    current.test += Number(log.testQty || 0);
    current.downtime += totalDowntime(log);
    current.normalMinutes += Number(log.normalMinutes || 0);
    current.total += Number(log.goodQty || 0) + Number(log.ngQty || 0) + Number(log.testQty || 0);
    current.count += 1;
    map.set(key, current);
  });
  return [...map.values()].sort((a, b) => b.total - a.total || b.downtime - a.downtime || a.label.localeCompare(b.label));
}

function getDowntimeStats(logs: ProductionLog[]): DowntimeStatRow[] {
  const totalMinutes = logs.reduce((sum, log) => sum + totalDowntime(log), 0);
  return downtimeFields
    .map((field) => {
      const minutes = logs.reduce((sum, log) => sum + Number(log[field.key] || 0), 0);
      const count = logs.reduce((sum, log) => sum + (Number(log[field.key] || 0) > 0 ? 1 : 0), 0);
      return {
        ...field,
        count,
        minutes,
        percent: totalMinutes > 0 ? minutes / totalMinutes : 0,
      };
    })
    .sort((a, b) => b.minutes - a.minutes || b.count - a.count || a.label.localeCompare(b.label));
}

const normalizeCell = (value: unknown) => String(value ?? "").trim();

const trimMatrix = (matrix: unknown[][]) =>
  matrix
    .map((row) => row.map(normalizeCell))
    .filter((row) => row.some(Boolean));

const detectHeaderRow = (rows: string[][]) => {
  const keywords = ["part", "part no", "part name", "product", "step", "target", "m/c", "machine", "pcs"];
  let bestIndex = 0;
  let bestScore = -1;
  rows.slice(0, 12).forEach((row, index) => {
    const joined = row.join(" ").toLowerCase();
    const score = keywords.reduce((sum, keyword) => sum + (joined.includes(keyword) ? 1 : 0), 0) + row.filter(Boolean).length / 20;
    if (score > bestScore) {
      bestIndex = index;
      bestScore = score;
    }
  });
  return bestIndex;
};

const matrixToPdWorksheet = (name: string, matrix: unknown[][]): PdWorkbook["sheets"][number] => {
  const rows = trimMatrix(matrix);
  if (!rows.length) {
    return { columnCount: 0, headers: [], name, rowCount: 0, rows: [], truncated: false };
  }
  const headerIndex = detectHeaderRow(rows);
  const headerRow = rows[headerIndex] ?? [];
  const columnCount = Math.max(...rows.map((row) => row.length), headerRow.length);
  const headers = Array.from({ length: columnCount }, (_, index) => headerRow[index] || `Column ${index + 1}`);
  const dataRows = rows
    .slice(headerIndex + 1)
    .map((row) => Array.from({ length: columnCount }, (_, index) => row[index] || ""))
    .filter((row) => row.some(Boolean));

  return {
    columnCount,
    headers,
    name,
    rowCount: dataRows.length,
    rows: dataRows.slice(0, 500),
    truncated: dataRows.length > 500,
  };
};

const parseCsvText = (text: string) => {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  row.push(field);
  rows.push(row);
  return rows;
};

async function readPdUploadFile(file: File): Promise<PdWorkbook> {
  const lowerName = file.name.toLowerCase();
  let sheets: PdWorkbook["sheets"];
  if (lowerName.endsWith(".csv") || lowerName.endsWith(".txt")) {
    const text = await file.text();
    sheets = [matrixToPdWorksheet("Sheet 1", parseCsvText(text))];
  } else {
    const XLSX = (await import(/* @vite-ignore */ XLSX_MODULE_URL)) as XlsxModule;
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
    sheets = workbook.SheetNames.map((sheetName) =>
      matrixToPdWorksheet(
        sheetName,
        XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "", header: 1, raw: false }),
      ),
    );
  }
  return {
    fetchedAt: new Date().toISOString(),
    id: `upload-${file.name}-${file.lastModified}-${Date.now()}`,
    label: "นำเข้า",
    name: file.name,
    ok: true,
    sheets,
    url: "",
  };
}

const parseNumericCell = (value: unknown) => {
  const cleaned = String(value ?? "").replace(/,/g, "").trim();
  if (!cleaned) return 0;
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : 0;
};

const headerIndex = (headers: string[], patterns: RegExp[]) =>
  headers.findIndex((header) => patterns.some((pattern) => pattern.test(header.toLowerCase())));

function summarizePdCapacity(sources: PdWorkbook[]) {
  const partSet = new Set<string>();
  const machineSet = new Set<string>();
  const topTargets: Array<{ label: string; target: number }> = [];
  let targetTotal = 0;
  let targetCount = 0;

  sources.forEach((source) => {
    source.sheets.forEach((sheet) => {
      const partIndex = headerIndex(sheet.headers, [/part\s*no/, /part no/, /พาร์ท/, /ชิ้นงาน/]);
      const partNameIndex = headerIndex(sheet.headers, [/part\s*name/, /product/, /รุ่น/, /ชื่อ/]);
      const machineIndex = headerIndex(sheet.headers, [/m\/c/, /machine/, /เครื่อง/]);
      const targetIndex = headerIndex(sheet.headers, [/target/, /เป้า/]);

      sheet.rows.forEach((row) => {
        const partNo = partIndex >= 0 ? row[partIndex] : "";
        const partName = partNameIndex >= 0 ? row[partNameIndex] : "";
        const machine = machineIndex >= 0 ? row[machineIndex] : "";
        const target = targetIndex >= 0 ? parseNumericCell(row[targetIndex]) : 0;

        if (partNo) partSet.add(partNo);
        if (machine) machineSet.add(machine);
        if (target > 0) {
          targetTotal += target;
          targetCount += 1;
          topTargets.push({ label: `${partName || partNo || source.name}${machine ? ` / ${machine}` : ""}`, target });
        }
      });
    });
  });

  return {
    machineCount: machineSet.size,
    partCount: partSet.size,
    targetAverage: targetCount > 0 ? Math.round(targetTotal / targetCount) : 0,
    targetCount,
    targetTotal,
    topTargets: topTargets.sort((a, b) => b.target - a.target).slice(0, 5),
  };
}

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const reportRangeLabel = (filters: Filters) => {
  if (filters.from && filters.to) return `${filters.from} ถึง ${filters.to}`;
  if (filters.from) return `ตั้งแต่ ${filters.from}`;
  if (filters.to) return `ถึง ${filters.to}`;
  return "ทั้งหมด";
};

const reportMachineLabel = (filters: Filters) =>
  filters.machineId ? machines.find((machine) => machine.id === filters.machineId)?.name ?? filters.machineId : "ทุกเครื่อง";

const reportShiftLabel = (filters: Filters) => (filters.shift ? shiftLabel(filters.shift) : "ทุกกะ");

const shiftRuleLabel = (shift: string) =>
  normalizeShiftCode(shift) === SHIFT_NIGHT ? "20:00 - 08:00 ของวันถัดไป" : "08:00 - 20:00 ของวันที่ผลิต";

const filterLogsByFilters = (logs: ProductionLog[], filters: Filters, includeDateRange = true) => {
  const wantedShift = filters.shift ? normalizeShiftCode(filters.shift) : "";
  return logs.filter((log) => {
    if (filters.machineId && log.machineId !== filters.machineId) return false;
    if (wantedShift && normalizeShiftCode(log.shift) !== wantedShift) return false;
    if (includeDateRange && filters.from && log.date < filters.from) return false;
    if (includeDateRange && filters.to && log.date > filters.to) return false;
    return true;
  });
};

const getFilterAvailableDateRange = (logs: ProductionLog[]) => {
  if (logs.length === 0) return null;
  const dates = Array.from(new Set(logs.map((log) => log.date).filter(Boolean))).sort();
  return {
    count: logs.length,
    firstDate: dates[0],
    lastDate: dates[dates.length - 1],
  };
};

const getFilterEmptyMessage = (visibleLogs: ProductionLog[], filters: Filters, scopeLogs: ProductionLog[]) => {
  if (visibleLogs.length > 0 || (!filters.from && !filters.to)) return "";
  const range = getFilterAvailableDateRange(scopeLogs);
  if (!range) return "ไม่พบข้อมูลของเครื่องหรือกะที่เลือกในระบบ";
  return `ไม่พบข้อมูลในช่วงวันที่ที่เลือก มีข้อมูลของเครื่อง/กะนี้ตั้งแต่ ${range.firstDate} ถึง ${range.lastDate} รวม ${formatNumber(range.count)} รายการ`;
};

const tableRowsHtml = (rows: ReportRow[]) =>
  rows.length
    ? rows
        .map(
          (row, index) => `
            <tr>
              <td>${index + 1}</td>
              <td><strong>${escapeHtml(row.label)}</strong><small>${escapeHtml(row.detail)}</small></td>
              <td class="number">${formatNumber(row.good)}</td>
              <td class="number">${formatNumber(row.ng)}</td>
              <td class="number">${formatNumber(row.test)}</td>
              <td class="number">${formatNumber(row.total)}</td>
              <td class="number">${formatNumber(row.downtime)}</td>
              <td class="number">${formatNumber(row.normalMinutes)}</td>
              <td class="number">${formatNumber(row.count)}</td>
            </tr>`,
        )
        .join("")
    : `<tr><td colspan="9" class="empty">ไม่มีข้อมูลตามตัวกรองนี้</td></tr>`;

const downtimeStatsRowsHtml = (rows: DowntimeStatRow[]) =>
  rows.filter((row) => row.minutes > 0 || row.count > 0).length
    ? rows
        .filter((row) => row.minutes > 0 || row.count > 0)
        .map(
          (row, index) => `
            <tr>
              <td>${index + 1}</td>
              <td><strong>${escapeHtml(row.label)}</strong><small>${escapeHtml(row.shortLabel)}</small></td>
              <td class="number">${formatNumber(row.minutes)} นาที</td>
              <td class="number">${formatNumber(row.count)} ครั้ง</td>
              <td class="number">${formatPercent(row.percent)}</td>
            </tr>`,
        )
        .join("")
    : `<tr><td colspan="5" class="empty">ไม่มีข้อมูลตามตัวกรองนี้</td></tr>`;

const detailRowsHtml = (logs: ProductionLog[]) =>
  logs.length
    ? logs
        .slice(0, 80)
        .map(
          (log, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${escapeHtml(getRecordDate(log))}</td>
              <td>${escapeHtml(getRecordTime(log))}</td>
              <td>${escapeHtml(log.date)}</td>
              <td><strong>${escapeHtml(shiftLabel(log.shift))}</strong><small>${escapeHtml(shiftWindowLabel(log.date, log.shift))}</small></td>
              <td>${escapeHtml(log.machineName)}</td>
              <td><strong>${escapeHtml(log.productName)}</strong><small>${escapeHtml(log.partNo)} | Step ${escapeHtml(log.step || "-")}</small></td>
              <td class="number">${formatNumber(Number(log.goodQty || 0))}</td>
              <td class="number">${formatNumber(Number(log.ngQty || 0))}</td>
              <td class="number">${formatNumber(Number(log.testQty || 0))}</td>
              <td class="number">${formatNumber(totalDowntime(log))}</td>
            </tr>`,
        )
        .join("")
    : `<tr><td colspan="11" class="empty">ไม่มีข้อมูลตามตัวกรองนี้</td></tr>`;

function openProductionPdfReport(logs: ProductionLog[], filters: Filters) {
  const reportWindow = window.open("", "_blank", "width=1100,height=820");
  if (!reportWindow) return false;

  const summary = summarize(logs);
  const oee = summary.availability * summary.quality;
  const downtimeRows = groupDowntime(logs);
  const downtimeStats = getDowntimeStats(logs);
  const shiftRows = aggregateReportRows(
    logs,
    (log) => shiftLabel(log.shift),
    (log) => shiftRuleLabel(log.shift),
  );
  const machineRows = aggregateReportRows(logs, (log) => log.machineName, () => "");
  const partRows = aggregateReportRows(
    logs,
    (log) => `${log.productName} / ${log.partNo}`,
    (log) => `Step ${log.step || "-"} | ${log.machineName} | ${shiftWindowLabel(log.date, log.shift)}`,
  );
  const generatedAt = new Date().toLocaleString("th-TH");
  const html = `<!doctype html>
    <html lang="th">
      <head>
        <meta charset="utf-8" />
        <title>OEE Production Summary</title>
        <style>
          @page { margin: 12mm; size: A4 landscape; }
          * { box-sizing: border-box; }
          body { color: #172033; font-family: "Segoe UI", "Noto Sans Thai", Arial, sans-serif; margin: 0; }
          header { border-bottom: 3px solid #177245; display: flex; justify-content: space-between; gap: 24px; padding-bottom: 12px; }
          h1 { font-size: 24px; margin: 0 0 6px; }
          h2 { font-size: 16px; margin: 20px 0 8px; }
          p { margin: 0; }
          .muted { color: #667085; font-size: 12px; font-weight: 700; }
          .meta { display: grid; gap: 4px; min-width: 270px; text-align: right; }
          .kpis { display: grid; gap: 8px; grid-template-columns: repeat(4, 1fr); margin: 16px 0; }
          .kpi { border: 1px solid #d7dfd8; border-top: 4px solid #177245; padding: 10px; }
          .kpi.red { border-top-color: #dc2626; }
          .kpi.amber { border-top-color: #d97706; }
          .kpi.blue { border-top-color: #2563eb; }
          .kpi span { color: #53627b; display: block; font-size: 11px; font-weight: 800; text-transform: uppercase; }
          .kpi strong { display: block; font-size: 20px; margin-top: 4px; }
          table { border-collapse: collapse; font-size: 11px; margin-bottom: 14px; table-layout: fixed; width: 100%; }
          th, td { border: 1px solid #cfd8cf; padding: 6px 7px; vertical-align: top; }
          th { background: #17372f; color: #ffffff; text-align: left; }
          td small { color: #667085; display: block; font-size: 10px; margin-top: 2px; }
          .number { text-align: right; white-space: nowrap; }
          .empty { color: #667085; font-weight: 700; text-align: center; }
          .downtime-grid { display: grid; gap: 8px; grid-template-columns: repeat(4, 1fr); }
          .downtime-item { border: 1px solid #d7dfd8; padding: 8px; }
          .downtime-item b { display: block; font-size: 15px; }
          footer { border-top: 1px solid #d7dfd8; color: #667085; font-size: 10px; margin-top: 16px; padding-top: 8px; }
        </style>
      </head>
      <body>
        <header>
          <div>
            <p class="muted">OEE PRODUCTION ENTRY</p>
            <h1>รายงานสรุปการกรอกยอดผลิต</h1>
            <p>ช่วงวันที่ผลิต: ${escapeHtml(reportRangeLabel(filters))} | เครื่อง: ${escapeHtml(reportMachineLabel(filters))} | กะ: ${escapeHtml(reportShiftLabel(filters))}</p>
            <p>กะเช้า 08:00-20:00 ของวันที่ผลิต | กะดึก 20:00-08:00 ของวันถัดไป</p>
          </div>
          <div class="meta">
            <strong>JR Production</strong>
            <span>สร้างรายงาน: ${escapeHtml(generatedAt)}</span>
            <span>จำนวนรายการ: ${formatNumber(logs.length)}</span>
          </div>
        </header>

        <section class="kpis">
          <div class="kpi"><span>Good quantity</span><strong>${formatNumber(summary.good)}</strong></div>
          <div class="kpi red"><span>NG quantity</span><strong>${formatNumber(summary.ng)}</strong></div>
          <div class="kpi amber"><span>Test quantity</span><strong>${formatNumber(summary.test)}</strong></div>
          <div class="kpi blue"><span>Total quantity</span><strong>${formatNumber(summary.total)}</strong></div>
          <div class="kpi red"><span>Downtime</span><strong>${formatNumber(summary.downtime)} นาที</strong></div>
          <div class="kpi"><span>Quality</span><strong>${formatPercent(summary.quality)}</strong></div>
          <div class="kpi"><span>OEE</span><strong>${formatPercent(oee)}</strong></div>
          <div class="kpi amber"><span>Availability</span><strong>${formatPercent(summary.availability)}</strong></div>
        </section>

        <h2>สรุปตามกะและช่วงเวลาทำงาน</h2>
        <table>
          <thead><tr><th>No.</th><th>Shift / Time window</th><th>Good</th><th>NG</th><th>Test</th><th>Total</th><th>Downtime (min)</th><th>Normal (min)</th><th>Records</th></tr></thead>
          <tbody>${tableRowsHtml(shiftRows)}</tbody>
        </table>

        <h2>สรุปตามเครื่องจักร</h2>
        <table>
          <thead><tr><th>No.</th><th>Machine</th><th>Good</th><th>NG</th><th>Test</th><th>Total</th><th>Downtime (min)</th><th>Normal (min)</th><th>Records</th></tr></thead>
          <tbody>${tableRowsHtml(machineRows)}</tbody>
        </table>

        <h2>สรุปตามรุ่น / Part No.</h2>
        <table>
          <thead><tr><th>No.</th><th>Product / Part No.</th><th>Good</th><th>NG</th><th>Test</th><th>Total</th><th>Downtime (min)</th><th>Normal (min)</th><th>Records</th></tr></thead>
          <tbody>${tableRowsHtml(partRows.slice(0, 40))}</tbody>
        </table>

        <h2>Downtime แยกตามหัวข้อ</h2>
        <div class="downtime-grid">
          ${downtimeRows
            .map((item) => `<div class="downtime-item"><span>${escapeHtml(item.shortLabel)}</span><b>${formatNumber(item.minutes)} นาที</b></div>`)
            .join("")}
        </div>

        <h2>สถิติการหยุดเครื่อง</h2>
        <table>
          <thead><tr><th>No.</th><th>Downtime issue</th><th>Total stop time</th><th>Count</th><th>Share</th></tr></thead>
          <tbody>${downtimeStatsRowsHtml(downtimeStats)}</tbody>
        </table>
        <h2>รายละเอียดรายการผลิต</h2>
        <table>
          <thead><tr><th>No.</th><th>Entry date</th><th>Entry time</th><th>Production date</th><th>Shift time</th><th>Machine</th><th>Product / Part No.</th><th>Good</th><th>NG</th><th>Test</th><th>Downtime</th></tr></thead>
          <tbody>${detailRowsHtml(logs)}</tbody>
        </table>
        <footer>เอกสารนี้สร้างจากข้อมูลที่ถูกกรองในระบบ OEE Production Entry</footer>
        <script>
          window.addEventListener("load", () => {
            window.focus();
            setTimeout(() => window.print(), 300);
          });
        </script>
      </body>
    </html>`;

  reportWindow.document.open();
  reportWindow.document.write(html);
  reportWindow.document.close();
  return true;
}

function uniqueProductValues(items: ProductMaster[], key: ProductFieldKey) {
  return Array.from(new Set(items.map((item) => item[key]).filter(Boolean)))
    .sort((a, b) => a.localeCompare(b))
    .slice(0, 200);
}

function uniqueLogs(logs: ProductionLog[]) {
  const map = new Map<string, ProductionLog>();
  for (const log of logs) {
    if (!map.has(log.id)) map.set(log.id, log);
  }
  return [...map.values()].sort((a, b) => `${b.date}-${b.createdAt}`.localeCompare(`${a.date}-${a.createdAt}`));
}

const sameProductKey = (left: Pick<ProductionLog | ProductMaster, "machineId" | "productName" | "partNo" | "step">) =>
  [left.machineId, left.productName, left.partNo, left.step || "-"].map(normalizeText).join("::");

const findMatchingProduct = (
  items: ProductMaster[],
  key: ProductFieldKey,
  value: string,
  current: EntryDraft,
) => {
  const normalized = normalizeText(value);
  if (!normalized) return null;

  const matches = items.filter((product) => normalizeText(product[key]) === normalized);
  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0];

  return (
    matches.find((product) => normalizeText(product.partNo) === normalizeText(current.partNo) && normalizeText(product.step) === normalizeText(current.step)) ??
    matches.find((product) => normalizeText(product.productName) === normalizeText(current.productName)) ??
    matches[0]
  );
};

const inferMachineSpeed = (
  product: Pick<ProductMaster, "machineId" | "productName" | "partNo" | "step" | "sampleGoodQty">,
  logs: ProductionLog[],
  machine: Machine,
) => {
  const productKey = sameProductKey(product);
  const matchedLogs = logs
    .filter((log) => sameProductKey(log) === productKey)
    .sort((a, b) => `${b.date}-${b.createdAt}`.localeCompare(`${a.date}-${a.createdAt}`));
  const loggedSpeed = matchedLogs.find((log) => Number(log.machineSpeed || 0) > 0)?.machineSpeed;
  if (loggedSpeed) return roundNumber(loggedSpeed);

  const calculatedSpeed = matchedLogs
    .map((log) => {
      const runMinutes = Number(log.normalMinutes || 0);
      const output = Number(log.goodQty || 0) + Number(log.ngQty || 0) + Number(log.testQty || 0);
      return runMinutes > 0 && output > 0 ? output / runMinutes : 0;
    })
    .find((value) => value > 0);
  if (calculatedSpeed) return roundNumber(calculatedSpeed);

  return machine.capacityMinutes > 0 ? roundNumber(Number(product.sampleGoodQty || 0) / machine.capacityMinutes) : 0;
};

const getLogWorkMinutes = (log: ProductionLog) =>
  Number(log.workMinutes || 0) || Number(log.normalMinutes || 0) + totalDowntime(log);

const getSpeedPcsPerMinute = (log: ProductionLog) => {
  const machineSpeed = Number(log.machineSpeed || 0);
  const cavityQty = Number(log.cavityQty || 1) || 1;
  if (machineSpeed <= 0) return 0;
  return machineSpeed >= 1000 ? machineSpeed / 480 : machineSpeed * cavityQty;
};

const getLogTargetQty = (log: ProductionLog) => roundNumber(getLogWorkMinutes(log) * getSpeedPcsPerMinute(log));

const draftFromLog = (log: ProductionLog): EntryDraft => ({
  recordDate: getDraftRecordDate(log),
  recordTime: getDraftRecordTime(log),
  date: log.date || getTodayInputValue(),
  shift: log.shift,
  shiftStartAt: log.shiftStartAt || shiftStartAt(log.date || getTodayInputValue(), log.shift),
  shiftEndAt: log.shiftEndAt || shiftEndAt(log.date || getTodayInputValue(), log.shift),
  machineId: log.machineId,
  productName: log.productName,
  partNo: log.partNo,
  step: log.step,
  workMinutes: Number(log.workMinutes || 0) || Number(log.normalMinutes || 0) + totalDowntime(log),
  timeSlots: Number(log.timeSlots || 0),
  minutesPerSlot: Number(log.minutesPerSlot || 0) || defaultMinutesPerSlot,
  machineSpeed: Number(log.machineSpeed || 0),
  cavityQty: Number(log.cavityQty || 0),
  changeoverMinutes: Number(log.changeoverMinutes || 0),
  inspectionMinutes: Number(log.inspectionMinutes || 0),
  equipmentRepairMinutes: Number(log.equipmentRepairMinutes || 0),
  moldRepairMinutes: Number(log.moldRepairMinutes || 0),
  materialChangeMinutes: Number(log.materialChangeMinutes || 0),
  emergencyStopMinutes: Number(log.emergencyStopMinutes || 0),
  meetingMinutes: Number(log.meetingMinutes || 0),
  plannedStopMinutes: Number(log.plannedStopMinutes || 0),
  goodQty: Number(log.goodQty || 0),
  ngQty: Number(log.ngQty || 0),
  testQty: Number(log.testQty || 0),
  note: log.note || "",
});

function RequiredMark() {
  return <span className="required-mark" aria-label="required">*</span>;
}

function App() {
  const [tab, setTab] = useState<TabId>("employeeEntry");
  const [session, setSession] = useState<AppSession | null>(() => loadSession());
  const [localLogs, setLocalLogs] = useState<ProductionLog[]>([]);
  const [remoteLogs, setRemoteLogs] = useState<ProductionLog[]>([]);
  const [status, setStatus] = useState(remoteEnabled ? "พร้อมเชื่อมต่อ Google Sheet" : "โหมดทดลองในเครื่อง");
  const [saving, setSaving] = useState(false);
  const [pdSheets, setPdSheets] = useState<PdWorkbook[]>([]);
  const [pdLoading, setPdLoading] = useState(false);
  const [pdError, setPdError] = useState("");
  const [pdUpdatedAt, setPdUpdatedAt] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const deferredProductSearch = useDeferredValue(productSearch);
  const deferredHistorySearch = useDeferredValue(historySearch);
  const [dashboardFilters, setDashboardFilters] = useState<Filters>({ machineId: "", shift: "", from: "", to: "" });
  const [reportFilters, setReportFilters] = useState<Filters>({ machineId: "", shift: "", from: "", to: "" });
  const [historyFilters, setHistoryFilters] = useState<Filters>({ machineId: "", shift: "", from: "", to: "" });
  const [draft, setDraft] = useState<EntryDraft>(() => createEmptyDraft(defaultMachine, defaultProduct));
  const [editingLog, setEditingLog] = useState<ProductionLog | null>(null);
  const [dateManuallyEdited, setDateManuallyEdited] = useState(false);
  const [successDialog, setSuccessDialog] = useState<{ title: string; message: string } | null>(null);
  const [problemDialog, setProblemDialog] = useState<{ title: string; message: string } | null>(null);
  const [confirmSaveDialog, setConfirmSaveDialog] = useState<{ title: string; message: string } | null>(null);
  const [warnedDuplicateKey, setWarnedDuplicateKey] = useState("");
  const [downtimePressTimes, setDowntimePressTimes] = useState<Partial<Record<DowntimeKey, string>>>({});
  const productDefaultsCache = useRef(new Map<string, ProductDefaults>());

  useEffect(() => {
    setLocalLogs(loadLocalLogs());
    if (!remoteEnabled) return;
    fetchRemoteLogs()
      .then((logs) => {
        setRemoteLogs(logs);
        setStatus(`เชื่อมต่อ Google Sheet แล้ว (${logs.length} records)`);
      })
      .catch((error) => setStatus(error instanceof Error ? error.message : "เชื่อมต่อ Google Sheet ไม่สำเร็จ"));
  }, []);

  useEffect(() => {
    if (session && !canAccessTab(session, tab)) setTab("employeeEntry");
  }, [session, tab]);

  const loadPdSheets = async (silent = false) => {
    if (!remoteEnabled) {
      setPdError("ยังไม่ได้ตั้งค่า Google Sheet API");
      return;
    }
    if (!silent) setPdLoading(true);
    try {
      const sources = await fetchPdSheets();
      setPdSheets(sources);
      setPdUpdatedAt(new Date().toLocaleString("th-TH"));
      setPdError("");
      setStatus(`อัปเดตข้อมูล PD แล้ว (${sources.length} ไฟล์)`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "โหลดข้อมูล PD ไม่สำเร็จ";
      setPdError(message);
      setStatus(message);
    } finally {
      if (!silent) setPdLoading(false);
    }
  };

  useEffect(() => {
    if (tab !== "pd") return;
    void loadPdSheets();
    const timer = window.setInterval(() => {
      void loadPdSheets(true);
    }, 60000);
    return () => window.clearInterval(timer);
  }, [tab]);

  const currentMachine = machines.find((machine) => machine.id === draft.machineId) ?? defaultMachine;
  const machineProducts = useMemo(
    () => products.filter((product) => product.machineId === draft.machineId),
    [draft.machineId],
  );
  const filteredProducts = useMemo(() => {
    const query = deferredProductSearch.trim().toLowerCase();
    if (!query) return machineProducts;
    return machineProducts.filter((product) =>
      `${product.productName} ${product.partNo} ${product.step}`.toLowerCase().includes(query),
    );
  }, [machineProducts, deferredProductSearch]);
  const productNameOptions = useMemo(
    () => uniqueProductValues(filteredProducts, "productName"),
    [filteredProducts],
  );
  const partNoOptions = useMemo(() => uniqueProductValues(filteredProducts, "partNo"), [filteredProducts]);
  const stepOptions = useMemo(() => uniqueProductValues(filteredProducts, "step"), [filteredProducts]);

  const allLogs = useMemo(
    () => uniqueLogs([...localLogs, ...remoteLogs, ...seedLogs]),
    [localLogs, remoteLogs],
  );
  const dashboardLogs = useMemo(() => filterLogsByFilters(allLogs, dashboardFilters), [allLogs, dashboardFilters]);
  const reportLogs = useMemo(() => filterLogsByFilters(allLogs, reportFilters), [allLogs, reportFilters]);
  const historyLogs = useMemo(() => filterLogsByFilters(allLogs, historyFilters), [allLogs, historyFilters]);
  const dashboardScopeLogs = useMemo(() => filterLogsByFilters(allLogs, dashboardFilters, false), [allLogs, dashboardFilters]);
  const reportScopeLogs = useMemo(() => filterLogsByFilters(allLogs, reportFilters, false), [allLogs, reportFilters]);
  const historyScopeLogs = useMemo(() => filterLogsByFilters(allLogs, historyFilters, false), [allLogs, historyFilters]);
  const dashboardAvailableDateRange = useMemo(() => getFilterAvailableDateRange(dashboardScopeLogs), [dashboardScopeLogs]);
  const reportAvailableDateRange = useMemo(() => getFilterAvailableDateRange(reportScopeLogs), [reportScopeLogs]);
  const historyAvailableDateRange = useMemo(() => getFilterAvailableDateRange(historyScopeLogs), [historyScopeLogs]);
  const dashboardEmptyMessage = useMemo(
    () => getFilterEmptyMessage(dashboardLogs, dashboardFilters, dashboardScopeLogs),
    [dashboardFilters, dashboardLogs, dashboardScopeLogs],
  );
  const reportEmptyMessage = useMemo(
    () => getFilterEmptyMessage(reportLogs, reportFilters, reportScopeLogs),
    [reportFilters, reportLogs, reportScopeLogs],
  );
  const historyEmptyMessage = useMemo(
    () => getFilterEmptyMessage(historyLogs, historyFilters, historyScopeLogs),
    [historyFilters, historyLogs, historyScopeLogs],
  );
  const activeFilters = tab === "reports" ? reportFilters : tab === "history" ? historyFilters : dashboardFilters;
  const activeLogs = tab === "reports" ? reportLogs : tab === "history" ? historyLogs : dashboardLogs;

  const entryDateLogs = useMemo(
    () => allLogs.filter((log) => log.date === draft.date).slice(0, 8),
    [allLogs, draft.date],
  );

  const searchedHistory = useMemo(() => {
    const query = deferredHistorySearch.trim().toLowerCase();
    if (!query) return historyLogs.slice(0, 120);
    return historyLogs
      .filter((log) => `${log.machineName} ${log.productName} ${log.partNo} ${log.step}`.toLowerCase().includes(query))
      .slice(0, 120);
  }, [historyLogs, deferredHistorySearch]);

  const summary = useMemo(() => (tab === "dashboard" ? summarize(dashboardLogs) : summarize([])), [dashboardLogs, tab]);
  const downtime = useMemo(() => (tab === "dashboard" ? groupDowntime(dashboardLogs) : groupDowntime([])), [dashboardLogs, tab]);
  const isEmployeeEntry = tab === "employeeEntry";
  const totalDraftDowntime = totalDowntime(draft);
  const computedNormalMinutes = Math.max(draft.workMinutes - totalDraftDowntime, 0);
  const duplicateEntry = useMemo(() => {
    if (!draft.date || !draft.shift || !draft.machineId || !normalizeText(draft.partNo)) return null;
    return (
      allLogs.find(
        (log) =>
          log.id !== editingLog?.id &&
          log.date === draft.date &&
          normalizeShiftCode(log.shift) === normalizeShiftCode(draft.shift) &&
          log.machineId === draft.machineId &&
          normalizeText(log.partNo) === normalizeText(draft.partNo) &&
          normalizeText(log.step || "-") === normalizeText(draft.step || "-"),
      ) ?? null
    );
  }, [allLogs, draft.date, draft.machineId, draft.partNo, draft.shift, draft.step, editingLog?.id]);
  const duplicateEntryKey = duplicateEntry
    ? `${draft.date}::${normalizeShiftCode(draft.shift)}::${draft.machineId}::${normalizeText(draft.partNo)}::${normalizeText(draft.step || "-")}`
    : "";
  const duplicateEntryMessage = duplicateEntry
    ? `วันที่ผลิต ${draft.date} กะ ${shiftLabel(draft.shift)} (${shiftWindowLabel(draft.date, draft.shift)}) เครื่อง ${duplicateEntry.machineName} Part No. ${duplicateEntry.partNo} Step ${duplicateEntry.step || "-"} มีการบันทึกแล้ว ห้ามบันทึกซ้ำ`
    : "";

  useEffect(() => {
    if (!duplicateEntryMessage) {
      setWarnedDuplicateKey("");
      return;
    }
    setStatus(duplicateEntryMessage);
    if (warnedDuplicateKey === duplicateEntryKey) return;
    setWarnedDuplicateKey(duplicateEntryKey);
    setProblemDialog({ title: "พบรายการซ้ำ", message: duplicateEntryMessage });
  }, [duplicateEntryKey, duplicateEntryMessage, warnedDuplicateKey]);

  const applyProductToDraft = (product: ProductMaster, logs = allLogs, machine = currentMachine) => ({
    productName: product.productName,
    partNo: product.partNo,
    step: product.step,
    machineSpeed: inferMachineSpeed(product, logs, machine),
  });

  const loadProductDefaults = async (product: ProductMaster, machine: Machine) => {
    if (!remoteEnabled) return;
    const cacheKey = [machine.name, product.productName, product.partNo, product.step || "-"].map(normalizeText).join("::");
    const applyDefaults = (defaults: ProductDefaults) => {
      setDraft((prev) => {
        const sameProduct =
          prev.machineId === machine.id &&
          normalizeText(prev.productName) === normalizeText(product.productName) &&
          normalizeText(prev.partNo) === normalizeText(product.partNo) &&
          normalizeText(prev.step || "-") === normalizeText(product.step || "-");
        if (!sameProduct) return prev;
        const minutesPerSlot = Number(defaults.minutesPerSlot || prev.minutesPerSlot || defaultMinutesPerSlot);
        return {
          ...prev,
          machineSpeed: Number(defaults.machineSpeed || 0) > 0 ? roundNumber(Number(defaults.machineSpeed)) : prev.machineSpeed,
          cavityQty: Number(defaults.cavityQty || 0) > 0 ? roundNumber(Number(defaults.cavityQty)) : prev.cavityQty,
          minutesPerSlot,
          workMinutes: roundNumber(prev.timeSlots * minutesPerSlot),
        };
      });
    };
    const cachedDefaults = productDefaultsCache.current.get(cacheKey);
    if (cachedDefaults) {
      applyDefaults(cachedDefaults);
      return;
    }
    try {
      const defaults = await fetchProductDefaults({
        machineName: machine.name,
        productName: product.productName,
        partNo: product.partNo,
        step: product.step || "-",
      });
      productDefaultsCache.current.set(cacheKey, defaults);
      applyDefaults(defaults);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "โหลดความเร็วจาก Google Sheet ไม่สำเร็จ");
    }
  };

  const selectMachine = (machineId: string) => {
    const machine = machines.find((item) => item.id === machineId) ?? defaultMachine;
    const nextProduct = products.find((product) => product.machineId === machine.id) ?? defaultProduct;
    setProductSearch("");
    setDraft((prev) => ({
      ...prev,
      machineId: machine.id,
      ...applyProductToDraft(nextProduct, allLogs, machine),
      workMinutes: machine.capacityMinutes,
      timeSlots: slotsFromMinutes(machine.capacityMinutes, prev.minutesPerSlot),
    }));
    void loadProductDefaults(nextProduct, machine);
  };

  const updateProductField = (key: ProductFieldKey, value: string) => {
    const matchedProduct = findMatchingProduct(machineProducts, key, value, draft);

    setDraft((prev) =>
      matchedProduct
        ? {
            ...prev,
            ...applyProductToDraft(matchedProduct),
          }
        : {
            ...prev,
            [key]: value,
          },
    );
    if (matchedProduct) void loadProductDefaults(matchedProduct, currentMachine);
  };

  const handleNumber = (key: keyof EntryDraft, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: Math.max(Number(value) || 0, 0) }));
  };

  const updateWorkMinutes = (value: string) => {
    const workMinutes = toPositiveNumber(value);
    setDraft((prev) => ({
      ...prev,
      workMinutes,
      timeSlots: prev.minutesPerSlot > 0 ? slotsFromMinutes(workMinutes, prev.minutesPerSlot) : prev.timeSlots,
    }));
  };

  const updateTimeSlots = (value: string) => {
    const timeSlots = toPositiveNumber(value);
    setDraft((prev) => ({
      ...prev,
      timeSlots,
      workMinutes: roundNumber(timeSlots * prev.minutesPerSlot),
    }));
  };

  const updateMinutesPerSlot = (value: string) => {
    const minutesPerSlot = toPositiveNumber(value);
    setDraft((prev) => ({
      ...prev,
      minutesPerSlot,
      workMinutes: roundNumber(prev.timeSlots * minutesPerSlot),
      ...Object.fromEntries(
        downtimeFields.map((field) => [
          field.key,
          slotsToMinutes(minutesToSlots(Number(prev[field.key] || 0), prev.minutesPerSlot), minutesPerSlot),
        ]),
      ),
    }));
  };

  const updateDowntimeSlots = (key: keyof typeof downtimeExcelCodes, value: string) => {
    const slots = toPositiveNumber(value);
    setDraft((prev) => ({
      ...prev,
      [key]: slotsToMinutes(slots, prev.minutesPerSlot),
    }));
  };

  const pressEmployeeDowntime = (key: DowntimeKey) => {
    const pressedDate = getTodayInputValue();
    const pressedTime = getCurrentTimeInputValue();
    const field = downtimeFields.find((item) => item.key === key);
    setDowntimePressTimes((prev) => ({ ...prev, [key]: pressedTime }));
    setDraft((prev) => {
      const minutesPerSlot = prev.minutesPerSlot || defaultMinutesPerSlot;
      const nextMinutes = roundNumber(Number(prev[key] || 0) + minutesPerSlot);
      const noteLine = `[${pressedDate} ${pressedTime}] ${field?.label ?? key} +${formatRate(minutesPerSlot)} นาที`;
      return {
        ...prev,
        [key]: nextMinutes,
        note: prev.note.trim() ? `${prev.note.trim()}\n${noteLine}` : noteLine,
      };
    });
    setStatus(`บันทึกเวลาหยุด ${field?.label ?? key} เวลา ${pressedTime}`);
  };

  const resetDraft = () => {
    const product = products.find((item) => item.machineId === draft.machineId) ?? defaultProduct;
    const nextDraft = createEmptyDraft(currentMachine, product);
    setDraft({
      ...nextDraft,
      ...applyProductToDraft(product),
    });
    setEditingLog(null);
    setDateManuallyEdited(false);
    setProductSearch("");
    setDowntimePressTimes({});
    void loadProductDefaults(product, currentMachine);
  };

  const editLog = (log: ProductionLog) => {
    const nextDraft = draftFromLog(log);
    const minutesPerSlot = nextDraft.minutesPerSlot || defaultMinutesPerSlot;
    setDraft({
      ...nextDraft,
      timeSlots: nextDraft.timeSlots || slotsFromMinutes(nextDraft.workMinutes, minutesPerSlot),
      minutesPerSlot,
    });
    setEditingLog(log);
    setDateManuallyEdited(true);
    setProductSearch("");
    setDowntimePressTimes({});
    setTab("entry");
    setStatus(`กำลังแก้ไขรายการ ${log.machineName} วันที่ ${log.date}`);
  };

  const getMissingSaveFields = () =>
    [
      { label: "Good quantity / จำนวนงานดี", value: draft.goodQty },
      { label: "ความเร็วเครื่องจักร", value: draft.machineSpeed },
      { label: "จำนวนคาวิตี้", value: draft.cavityQty },
    ]
      .filter((field) => Number(field.value || 0) <= 0)
      .map((field) => field.label);

  const showMissingSaveFields = (missingFields: string[]) => {
    const message = `กรุณากรอก ${missingFields.join(", ")} ให้มากกว่า 0 ก่อนบันทึก`;
    setStatus(message);
    setProblemDialog({ title: "กรอกข้อมูลไม่ครบ", message });
  };

  const saveDraft = async () => {
    setConfirmSaveDialog(null);
    const missingFields = getMissingSaveFields();
    if (missingFields.length > 0) {
      showMissingSaveFields(missingFields);
      return;
    }
    const machine = machines.find((item) => item.id === draft.machineId) ?? currentMachine;
    const shouldUpdate = Boolean(editingLog);
    if (duplicateEntryMessage) {
      setStatus(duplicateEntryMessage);
      setProblemDialog({ title: "พบรายการซ้ำ", message: duplicateEntryMessage });
      return;
    }
    const savedDate = draft.date || getTodayInputValue();
    const savedRecordDate = shouldUpdate ? getDraftRecordDate(editingLog) : getTodayInputValue();
    const savedRecordTime = shouldUpdate ? getDraftRecordTime(editingLog) : getCurrentTimeInputValue();
    const log: ProductionLog = {
      ...draft,
      recordDate: savedRecordDate,
      recordTime: savedRecordTime,
      date: savedDate,
      shiftStartAt: shiftStartAt(savedDate, draft.shift),
      shiftEndAt: shiftEndAt(savedDate, draft.shift),
      id: editingLog?.id ?? makeLogId(),
      machineName: machine.name,
      normalMinutes: computedNormalMinutes,
      createdAt: editingLog?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: remoteEnabled ? "google-sheet" : "local",
    };

    setSaving(true);
    try {
      const saved = remoteEnabled ? (shouldUpdate ? await updateRemoteLog(log) : await appendRemoteLog(log)) : log;
      const next = shouldUpdate ? upsertLocalLog(saved) : appendLocalLog(saved);
      const successMessage = shouldUpdate
        ? `บันทึกการแก้ไขแล้ว: ${saved.machineName} วันที่ ${saved.date}`
        : `บันทึกยอดแล้ว: ${saved.machineName} วันที่ ${saved.date} (ลง Google Sheet และชีตเครื่องแล้ว)`;
      setLocalLogs(next);
      setStatus(successMessage);
      setSuccessDialog({ title: "บันทึกเสร็จแล้ว", message: successMessage });
      resetDraft();
    } catch (error) {
      const localLog = { ...log, source: "local" as const };
      const next = shouldUpdate ? upsertLocalLog(localLog) : appendLocalLog(localLog);
      setLocalLogs(next);
      setStatus(error instanceof Error ? `${error.message} - เก็บสำรองในเครื่องแล้ว` : "เก็บสำรองในเครื่องแล้ว");
    } finally {
      setSaving(false);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const missingFields = getMissingSaveFields();
    if (missingFields.length > 0) {
      showMissingSaveFields(missingFields);
      return;
    }
    if (duplicateEntryMessage) {
      setStatus(duplicateEntryMessage);
      setProblemDialog({ title: "พบรายการซ้ำ", message: duplicateEntryMessage });
      return;
    }
    const machine = machines.find((item) => item.id === draft.machineId) ?? currentMachine;
    setConfirmSaveDialog({
      title: "ยืนยันก่อนบันทึก",
      message: `ต้องการบันทึกยอด ${machine.name} วันที่ผลิต ${draft.date || getTodayInputValue()} กะ ${shiftLabel(draft.shift)} Part No. ${draft.partNo || "-"} Good ${formatNumber(draft.goodQty)} ใช่หรือไม่`,
    });
  };

  const clearLocal = () => {
    saveLocalLogs([]);
    setLocalLogs([]);
    setStatus("ล้างรายการทดลองในเครื่องแล้ว");
  };

  const signOut = () => {
    clearSession();
    setSession(null);
    setTab("entry");
  };

  const shareApp = async () => {
    const shareData = {
      title: "OEE Production Entry",
      text: "เปิดระบบกรอกยอดผลิต OEE",
      url: productionShareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(productionShareUrl);
      setStatus("คัดลอกลิงก์สำหรับแชร์แล้ว");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setStatus(`ลิงก์สำหรับแชร์: ${productionShareUrl}`);
    }
  };

  const downloadPdfReport = () => {
    const opened = openProductionPdfReport(activeLogs, activeFilters);
    if (!opened) {
      setProblemDialog({
        title: "เปิดรายงานไม่ได้",
        message: "เบราว์เซอร์บล็อกหน้าต่างรายงาน กรุณาอนุญาต pop-up แล้วกดดาวน์โหลด PDF อีกครั้ง",
      });
      return;
    }
    setStatus("เปิดรายงานแล้ว เลือก Save as PDF ในหน้าต่างพิมพ์");
  };
  const useLatestDashboardDate = () => {
    if (!dashboardAvailableDateRange?.lastDate) return;
    setDashboardFilters((prev) => ({ ...prev, from: dashboardAvailableDateRange.lastDate, to: dashboardAvailableDateRange.lastDate }));
  };
  const useLatestReportDate = () => {
    if (!reportAvailableDateRange?.lastDate) return;
    setReportFilters((prev) => ({ ...prev, from: reportAvailableDateRange.lastDate, to: reportAvailableDateRange.lastDate }));
  };
  const useLatestHistoryDate = () => {
    if (!historyAvailableDateRange?.lastDate) return;
    setHistoryFilters((prev) => ({ ...prev, from: historyAvailableDateRange.lastDate, to: historyAvailableDateRange.lastDate }));
  };
  const clearDashboardDates = () => {
    setDashboardFilters((prev) => ({ ...prev, from: "", to: "" }));
  };
  const clearReportDates = () => {
    setReportFilters((prev) => ({ ...prev, from: "", to: "" }));
  };
  const clearHistoryDates = () => {
    setHistoryFilters((prev) => ({ ...prev, from: "", to: "" }));
  };

  if (!session) return <LoginScreen onSignedIn={setSession} />;

  return (
    <div className="app-shell">
      <aside className="side-nav">
        <div className="brand-mark">
          <img alt="JR logo" className="brand-logo" src={brandLogoSrc} />
          <div>
            <strong>OEE Entry</strong>
            <span>Production</span>
          </div>
        </div>
        <nav>
          <button className={`employee-entry ${tab === "employeeEntry" ? "active" : ""}`} onClick={() => setTab("employeeEntry")} type="button">
            <span className="nav-icon-badge">
              <ClipboardCheck size={18} />
            </span>
            กรอกยอดสำหรับพนักงาน
          </button>
          <button className={tab === "entry" ? "active" : ""} onClick={() => setTab("entry")} type="button">
            <ClipboardList size={18} /> กรอกยอด
          </button>
          {canAccessTab(session, "dashboard") && (
            <button className={tab === "dashboard" ? "active" : ""} onClick={() => setTab("dashboard")} type="button">
              <BarChart3 size={18} /> Dashboard
            </button>
          )}
          <button className={tab === "reports" ? "active" : ""} onClick={() => setTab("reports")} type="button">
            <FileText size={18} /> Reports
          </button>
          <button className={tab === "pd" ? "active" : ""} onClick={() => setTab("pd")} type="button">
            <TableProperties size={18} /> PD Sheets
          </button>
          <button className={tab === "history" ? "active" : ""} onClick={() => setTab("history")} type="button">
            <History size={18} /> ประวัติ
          </button>
          {canAccessTab(session, "master") && (
            <button className={tab === "master" ? "active" : ""} onClick={() => setTab("master")} type="button">
              <Database size={18} /> Master
            </button>
          )}
          {canAccessTab(session, "users") && (
            <button className={tab === "users" ? "active" : ""} onClick={() => setTab("users")} type="button">
              <UserPlus size={18} /> Users
            </button>
          )}
        </nav>
        <div className="user-panel">
          <UserRound size={17} />
          <div>
            <strong>{session.displayName}</strong>
            <span>{session.role}</span>
          </div>
        </div>
        <div className={`connection ${remoteEnabled ? "online" : "offline"}`}>
          {remoteEnabled ? <Wifi size={16} /> : <WifiOff size={16} />}
          <span>{status}</span>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Production quantity entry</p>
            <h1>ระบบกรอกยอดผลิตตามรุ่นใน Excel</h1>
          </div>
          <div className="topbar-actions">
            <button className="ghost-button" onClick={shareApp} type="button">
              <Share2 size={17} /> Share
            </button>
            <button className="ghost-button" onClick={() => exportLogsCsv(activeLogs)} type="button">
              <Download size={17} /> CSV
            </button>
            <button className="ghost-button" onClick={downloadPdfReport} type="button">
              <FileText size={17} /> PDF
            </button>
            <button className="ghost-button" onClick={signOut} type="button">
              <LogOut size={17} /> Logout
            </button>
          </div>
        </header>

        {(tab === "employeeEntry" || tab === "entry") && (
          <section className="entry-layout">
            <form className="entry-form" onSubmit={submit}>
              <div className="section-title">
                <Gauge size={20} />
                <h2>{editingLog ? "แก้ไขยอดผลิต" : "กรอกยอดผลิต"}</h2>
              </div>

              <div className="form-grid">
                <label>
                  <span className="label-text">วันที่กรอกยอด</span>
                  <input readOnly value={draft.recordDate || getTodayInputValue()} type="date" />
                </label>
                <label>
                  <span className="label-text">เวลากรอก</span>
                  <input readOnly step="1" value={draft.recordTime || getCurrentTimeInputValue()} type="time" />
                </label>
                <label>
                  <span className="label-text">วันที่ผลิตงาน <RequiredMark /></span>
                  <input
                    required
                    value={draft.date}
                    onChange={(event) => {
                      setDateManuallyEdited(true);
                      setDraft({ ...draft, date: event.target.value });
                    }}
                    type="date"
                  />
                </label>
                <label>
                  <span className="label-text">กะ <RequiredMark /></span>
                  <select required value={draft.shift} onChange={(event) => setDraft({ ...draft, shift: event.target.value })}>
                    {orderedShiftOptions.map((shift) => (
                      <option key={shift} value={shift}>
                        {shiftLabel(shift)}
                      </option>
                    ))}
                  </select>
                  <small className="field-help">เวลาทำงาน: {shiftWindowLabel(draft.date, draft.shift)}</small>
                </label>
                <label>
                  <span className="label-text">เครื่อง / ไลน์ <RequiredMark /></span>
                  <select required value={draft.machineId} onChange={(event) => selectMachine(event.target.value)}>
                    {machines.map((machine) => (
                      <option key={machine.id} value={machine.id}>
                        {machine.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  ค้นหารุ่น
                  <div className="input-with-icon">
                    <Search size={16} />
                    <input
                      value={productSearch}
                      onChange={(event) => setProductSearch(event.target.value)}
                      placeholder="Product / Part No."
                      type="search"
                    />
                  </div>
                </label>
                <label>
                  <span className="label-text">รุ่น <RequiredMark /></span>
                  <input
                    list="product-name-options"
                    onChange={(event) => updateProductField("productName", event.target.value)}
                    required
                    type="text"
                    value={draft.productName}
                  />
                </label>
                <label>
                  <span className="label-text">Part No. <RequiredMark /></span>
                  <input
                    list="part-no-options"
                    onChange={(event) => updateProductField("partNo", event.target.value)}
                    required
                    type="text"
                    value={draft.partNo}
                  />
                </label>
                <label>
                  <span className="label-text">Step <RequiredMark /></span>
                  <input
                    list="step-options"
                    onChange={(event) => updateProductField("step", event.target.value)}
                    placeholder="-"
                    required
                    type="text"
                    value={draft.step}
                  />
                </label>
                <datalist id="product-name-options">
                  {productNameOptions.map((value) => (
                    <option key={value} value={value} />
                  ))}
                </datalist>
                <datalist id="part-no-options">
                  {partNoOptions.map((value) => (
                    <option key={value} value={value} />
                  ))}
                </datalist>
                <datalist id="step-options">
                  {stepOptions.map((value) => (
                    <option key={value} value={value} />
                  ))}
                </datalist>
              </div>
              {duplicateEntryMessage && (
                <div className="duplicate-warning" role="alert">
                  <AlertTriangle size={18} />
                  <span>{duplicateEntryMessage}</span>
                </div>
              )}

              <div className="runtime-panel">
                <label className="runtime-input-block">
                  <span>จำนวนช่องเวลา <RequiredMark /></span>
                  <div className="runtime-input-row">
                    <input
                      min="0"
                      onChange={(event) => updateTimeSlots(event.target.value)}
                      required
                      step="1"
                      type="number"
                      value={draft.timeSlots}
                    />
                    <b>ช่อง</b>
                  </div>
                </label>
                <label className="runtime-input-block">
                  <span>นาที/ช่อง <RequiredMark /></span>
                  <div className="runtime-input-row">
                    <input
                      min="0"
                      onChange={(event) => updateMinutesPerSlot(event.target.value)}
                      required
                      step="0.01"
                      type="number"
                      value={draft.minutesPerSlot}
                    />
                    <b>นาที</b>
                  </div>
                </label>
                <label className="runtime-input-block">
                  <span>เวลาตามกะ <RequiredMark /></span>
                  <div className="runtime-input-row">
                    <input
                      min="0"
                      onChange={(event) => updateWorkMinutes(event.target.value)}
                      required
                      type="number"
                      value={draft.workMinutes}
                    />
                    <b>นาที</b>
                  </div>
                </label>
                <label className="runtime-input-block">
                  <span>ความเร็วเครื่องจักร <RequiredMark /></span>
                  <div className="runtime-input-row">
                    <input
                      min="0"
                      onChange={(event) => handleNumber("machineSpeed", event.target.value)}
                      step="0.01"
                      type="number"
                      value={numberInputValue(draft.machineSpeed)}
                    />
                    <b>ชิ้น/นาที</b>
                  </div>
                </label>
                <label className="runtime-input-block">
                  <span>จำนวนคาวิตี้ <RequiredMark /></span>
                  <div className="runtime-input-row">
                    <input
                      min="0"
                      onChange={(event) => handleNumber("cavityQty", event.target.value)}
                      step="1"
                      type="number"
                      value={numberInputValue(draft.cavityQty)}
                    />
                    <b>ช่อง</b>
                  </div>
                </label>
                <div>
                  <span>Downtime</span>
                  <strong>{formatNumber(totalDraftDowntime)} นาที</strong>
                </div>
                <div>
                  <span>Normal production</span>
                  <strong>{formatNumber(computedNormalMinutes)} นาที</strong>
                </div>
              </div>

              <div className="section-title compact">
                <TableProperties size={19} />
                <h2>ยอดผลิต</h2>
              </div>
              <div className="form-grid three">
                <label>
                  <span className="label-text">Good quantity <RequiredMark /></span>
                  <input value={numberInputValue(draft.goodQty)} onChange={(event) => handleNumber("goodQty", event.target.value)} min="0" type="number" />
                </label>
                <label>
                  <span className="label-text">NG quantity</span>
                  <input value={numberInputValue(draft.ngQty)} onChange={(event) => handleNumber("ngQty", event.target.value)} min="0" type="number" />
                </label>
                <label>
                  <span className="label-text">Test / ตรวจชิ้นงาน</span>
                  <input value={numberInputValue(draft.testQty)} onChange={(event) => handleNumber("testQty", event.target.value)} min="0" type="number" />
                </label>
              </div>

              <div className="section-title compact">
                <History size={19} />
                <h2>เวลาหยุด</h2>
              </div>
              <p className="slot-help">
                {isEmployeeEntry
                  ? `กดปุ่มตามหัวข้อที่เกิดขึ้น: 1 ครั้ง = ${formatRate(draft.minutesPerSlot || defaultMinutesPerSlot)} นาที ระบบจะบันทึกเวลาปัจจุบันที่กดลงหมายเหตุ`
                  : `กรอกเป็นจำนวนช่อง: 1 ช่อง = ${formatRate(draft.minutesPerSlot || defaultMinutesPerSlot)} นาที ค่าเริ่มต้น 0 และแก้ไขได้`}
              </p>
              <div className="downtime-grid">
                {downtimeFields.map((field) => (
                  <label key={field.key}>
                    <span className="downtime-label-row">
                      <span>{field.label}</span>
                      <b>Excel {downtimeExcelCodes[field.key]}</b>
                    </span>
                    {isEmployeeEntry ? (
                      <button className="downtime-press-button" onClick={() => pressEmployeeDowntime(field.key)} type="button">
                        กดบันทึกเวลาปัจจุบัน
                      </button>
                    ) : (
                      <div className="downtime-slot-input">
                        <input
                          value={numberInputValue(minutesToSlots(Number(draft[field.key] || 0), draft.minutesPerSlot))}
                          onChange={(event) => updateDowntimeSlots(field.key, event.target.value)}
                          min="0"
                          step="1"
                          type="number"
                        />
                        <b>ช่อง</b>
                      </div>
                    )}
                    <small>{formatRate(Number(draft[field.key] || 0))} นาที</small>
                    {isEmployeeEntry && downtimePressTimes[field.key] && (
                      <small className="downtime-press-time">กดล่าสุด {downtimePressTimes[field.key]}</small>
                    )}
                  </label>
                ))}
              </div>

              <label>
                หมายเหตุ
                <textarea value={draft.note} onChange={(event) => setDraft({ ...draft, note: event.target.value })} rows={3} />
              </label>

              <div className="form-actions">
                <button className="primary-button" disabled={saving || Boolean(duplicateEntry)} type="submit">
                  <Save size={18} /> {saving ? "กำลังบันทึก" : editingLog ? "บันทึกการแก้ไข" : "บันทึกยอด"}
                </button>
                <button className="ghost-button" onClick={resetDraft} type="button">
                  {editingLog ? "ยกเลิกแก้ไข" : "ล้างฟอร์ม"}
                </button>
              </div>
            </form>

            <aside className="entry-summary">
              <div className="summary-block">
                <span>เครื่องที่เลือก</span>
                <strong>{currentMachine.name}</strong>
                <p>{currentMachine.hasStep ? "มี Step ใน Excel" : "ไม่มี Step ใน Excel"}</p>
              </div>
              <div className="summary-block">
                <span>รุ่นในเครื่องนี้</span>
                <strong>{formatNumber(machineProducts.length)}</strong>
                <p>อิงจาก OEE-2026.xlsx</p>
              </div>
              <div className="recent-list">
                <h3>รายการล่าสุด</h3>
                {entryDateLogs.map((log) => (
                  <div className="recent-item" key={log.id}>
                    <b>{log.machineName}</b>
                    <span>
                      {log.date} · {shiftLabel(log.shift)} · {shiftWindowLabel(log.date, log.shift)} · {log.productName} · Good {formatNumber(log.goodQty)} · Speed {formatRate(log.machineSpeed ?? 0)}
                    </span>
                  </div>
                ))}
                {entryDateLogs.length === 0 && <p className="empty-text">ยังไม่มีรายการของวันที่ {draft.date}</p>}
              </div>
            </aside>
          </section>
        )}

        {tab === "dashboard" && (
          <section className="dashboard-layout">
            <div className="kpi-grid">
              <Kpi label="Good" value={formatNumber(summary.good)} tone="green" />
              <Kpi label="NG" value={formatNumber(summary.ng)} tone="red" />
              <Kpi label="Quality" value={formatPercent(summary.quality)} tone="blue" />
              <Kpi label="Availability" value={formatPercent(summary.availability)} tone="amber" />
              <Kpi label="Downtime" value={`${formatNumber(summary.downtime)} นาที`} tone="red" />
              <Kpi label="Logs" value={formatNumber(dashboardLogs.length)} tone="neutral" />
            </div>
            <FiltersBar filters={dashboardFilters} setFilters={setDashboardFilters} />
            {dashboardEmptyMessage && (
              <FilterEmptyNotice
                latestDate={dashboardAvailableDateRange?.lastDate}
                message={dashboardEmptyMessage}
                onClearDates={clearDashboardDates}
                onUseLatest={useLatestDashboardDate}
              />
            )}
            <MachineCapacityDashboard logs={dashboardLogs} />
            <PartNoSummary logs={dashboardLogs} />
            <OeeSummaryChart summary={summary} />
            <div className="analytics-grid">
              <DowntimeChart items={downtime} />
              <MachineRanking logs={dashboardLogs} />
            </div>
            <Trend logs={dashboardLogs} />
          </section>
        )}

        {tab === "reports" && (
          <ReportsView
            emptyMessage={reportEmptyMessage}
            latestDate={reportAvailableDateRange?.lastDate}
            filters={reportFilters}
            logs={reportLogs}
            onClearDates={clearReportDates}
            onDownloadPdf={downloadPdfReport}
            onUseLatest={useLatestReportDate}
            setFilters={setReportFilters}
          />
        )}

        {tab === "pd" && (
          <PdSheetsView
            error={pdError}
            loading={pdLoading}
            onRefresh={() => void loadPdSheets()}
            sources={pdSheets}
            updatedAt={pdUpdatedAt}
          />
        )}

        {tab === "history" && (
          <section className="table-view">
            <FiltersBar filters={historyFilters} setFilters={setHistoryFilters} />
            {historyEmptyMessage && (
              <FilterEmptyNotice
                latestDate={historyAvailableDateRange?.lastDate}
                message={historyEmptyMessage}
                onClearDates={clearHistoryDates}
                onUseLatest={useLatestHistoryDate}
              />
            )}
            <div className="table-toolbar">
              <div className="input-with-icon search-box">
                <Search size={16} />
                <input
                  value={historySearch}
                  onChange={(event) => setHistorySearch(event.target.value)}
                  placeholder="ค้นหาเครื่อง รุ่น หรือ Part No."
                  type="search"
                />
              </div>
              <button className="ghost-button danger" onClick={clearLocal} type="button">
                ล้าง local
              </button>
            </div>
            <LogsTable logs={searchedHistory} onEdit={editLog} />
          </section>
        )}

        {tab === "master" && (
          <section className="table-view">
            <div className="master-stats">
              <Kpi label="Machines" value={formatNumber(machines.length)} tone="green" />
              <Kpi label="Products" value={formatNumber(products.length)} tone="blue" />
              <Kpi label="Seed logs" value={formatNumber(seedLogs.length)} tone="amber" />
            </div>
            <MasterTable />
          </section>
        )}

        {tab === "users" && <UsersAdmin currentUsername={session.username} />}
      </main>

      {confirmSaveDialog && (
        <div className="confirm-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="confirm-save-dialog-title">
          <div className="confirm-modal">
            <div className="confirm-modal-icon">
              <AlertTriangle size={30} />
            </div>
            <h2 id="confirm-save-dialog-title">{confirmSaveDialog.title}</h2>
            <p>{confirmSaveDialog.message}</p>
            <div className="modal-actions">
              <button className="primary-button" type="button" autoFocus disabled={saving} onClick={() => void saveDraft()}>
                ยืนยันบันทึก
              </button>
              <button className="ghost-button" type="button" disabled={saving} onClick={() => setConfirmSaveDialog(null)}>
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {successDialog && (
        <div className="success-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="success-dialog-title">
          <div className="success-modal">
            <div className="success-modal-icon">
              <CheckCircle2 size={30} />
            </div>
            <h2 id="success-dialog-title">{successDialog.title}</h2>
            <p>{successDialog.message}</p>
            <button className="primary-button" type="button" autoFocus onClick={() => setSuccessDialog(null)}>
              ยืนยัน
            </button>
          </div>
        </div>
      )}

      {problemDialog && (
        <div className="problem-modal-backdrop" role="alertdialog" aria-modal="true" aria-labelledby="problem-dialog-title">
          <div className="problem-modal">
            <div className="problem-modal-icon">
              <AlertTriangle size={30} />
            </div>
            <h2 id="problem-dialog-title">{problemDialog.title}</h2>
            <p>{problemDialog.message}</p>
            <button className="ghost-button danger" type="button" autoFocus onClick={() => setProblemDialog(null)}>
              ยืนยัน
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const emptyUserForm = {
  username: "",
  displayName: "",
  password: "",
  role: "production" as AppRole,
};

const createEmptyPasswordForm = (username: string) => ({
  username,
  password: "",
  confirmPassword: "",
});

function UsersAdmin({ currentUsername }: { currentUsername: string }) {
  const [users, setUsers] = useState<AppUserSummary[]>([]);
  const [form, setForm] = useState(emptyUserForm);
  const [passwordForm, setPasswordForm] = useState(() => createEmptyPasswordForm(currentUsername));
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [savingUser, setSavingUser] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    let active = true;
    listUsers()
      .then((nextUsers) => {
        if (active) setUsers(nextUsers);
      })
      .catch((userError) => {
        if (active) setError(userError instanceof Error ? userError.message : "โหลดรายชื่อผู้ใช้ไม่สำเร็จ");
      });
    return () => {
      active = false;
    };
  }, []);

  const submitUser = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setSavingUser(true);
    try {
      const nextUsers = await createUser(form);
      setUsers(nextUsers);
      setMessage(`สร้างผู้ใช้ ${form.username.trim().toLowerCase()} แล้ว`);
      setForm(emptyUserForm);
    } catch (userError) {
      setError(userError instanceof Error ? userError.message : "สร้างผู้ใช้ไม่สำเร็จ");
    } finally {
      setSavingUser(false);
    }
  };

  const removeUser = async (username: string) => {
    setMessage("");
    setError("");
    try {
      setUsers(await deleteUser(username));
      setMessage(`ลบผู้ใช้ ${username} แล้ว`);
    } catch (userError) {
      setError(userError instanceof Error ? userError.message : "ลบผู้ใช้ไม่สำเร็จ");
    }
  };

  const submitPassword = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    setError("");
    if (passwordForm.password !== passwordForm.confirmPassword) {
      setError("รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }
    setChangingPassword(true);
    try {
      const nextUsers = await changePassword(passwordForm.username, passwordForm.password);
      setUsers(nextUsers);
      setMessage(`เปลี่ยนรหัสผ่าน ${passwordForm.username} แล้ว`);
      setPasswordForm(createEmptyPasswordForm(passwordForm.username));
    } catch (passwordError) {
      setError(passwordError instanceof Error ? passwordError.message : "เปลี่ยนรหัสผ่านไม่สำเร็จ");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <section className="users-layout">
      <form className="user-form" onSubmit={submitUser}>
        <div className="section-title">
          <UserPlus size={20} />
          <h2>สร้างผู้ใช้งาน</h2>
        </div>
        <div className="form-grid">
          <label>
            <span className="label-text">Username <RequiredMark /></span>
            <input
              autoComplete="off"
              onChange={(event) => setForm({ ...form, username: event.target.value })}
              placeholder="เช่น operator01"
              required
              type="text"
              value={form.username}
            />
          </label>
          <label>
            <span className="label-text">ชื่อแสดงผล <RequiredMark /></span>
            <input
              autoComplete="off"
              onChange={(event) => setForm({ ...form, displayName: event.target.value })}
              placeholder="เช่น Line A"
              required
              type="text"
              value={form.displayName}
            />
          </label>
          <label>
            <span className="label-text">Role <RequiredMark /></span>
            <select
              onChange={(event) => setForm({ ...form, role: event.target.value as AppRole })}
              required
              value={form.role}
            >
              <option value="production">Production</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <label>
            <span className="label-text">Password <RequiredMark /></span>
            <input
              autoComplete="new-password"
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder="อย่างน้อย 6 ตัว"
              required
              type="password"
              value={form.password}
            />
          </label>
        </div>
        <div className="form-actions">
          <button className="primary-button" disabled={savingUser} type="submit">
            <Save size={18} /> {savingUser ? "กำลังสร้าง" : "สร้างผู้ใช้"}
          </button>
        </div>
        {message && <p className="form-message success">{message}</p>}
        {error && <p className="form-message error">{error}</p>}
      </form>

      <form className="user-form" onSubmit={submitPassword}>
        <div className="section-title">
          <KeyRound size={20} />
          <h2>เปลี่ยนรหัสผ่าน</h2>
        </div>
        <div className="form-grid three">
          <label>
            <span className="label-text">บัญชี <RequiredMark /></span>
            <select
              onChange={(event) => setPasswordForm(createEmptyPasswordForm(event.target.value))}
              required
              value={passwordForm.username}
            >
              {users.map((user) => (
                <option key={user.username} value={user.username}>
                  {user.username} - {user.displayName}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="label-text">รหัสผ่านใหม่ <RequiredMark /></span>
            <input
              autoComplete="new-password"
              onChange={(event) => setPasswordForm({ ...passwordForm, password: event.target.value })}
              placeholder="อย่างน้อย 6 ตัว"
              required
              type="password"
              value={passwordForm.password}
            />
          </label>
          <label>
            <span className="label-text">ยืนยันรหัสผ่าน <RequiredMark /></span>
            <input
              autoComplete="new-password"
              onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })}
              placeholder="พิมพ์ซ้ำอีกครั้ง"
              required
              type="password"
              value={passwordForm.confirmPassword}
            />
          </label>
        </div>
        <div className="form-actions">
          <button className="primary-button" disabled={changingPassword} type="submit">
            <Save size={18} /> {changingPassword ? "กำลังบันทึก" : "บันทึกรหัสผ่าน"}
          </button>
        </div>
      </form>

      <div className="data-table-wrap users-table">
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Display name</th>
              <th>Role</th>
              <th>Type</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const locked = user.builtIn || user.username === currentUsername;
              return (
                <tr key={user.username}>
                  <td>{user.username}</td>
                  <td>{user.displayName}</td>
                  <td>
                    <span className={`role-pill ${user.role}`}>{user.role}</span>
                  </td>
                  <td>{user.builtIn ? "Default" : "Custom"}</td>
                  <td>{user.createdAt ? new Date(user.createdAt).toLocaleString("th-TH") : "-"}</td>
                  <td>
                    <button
                      className="icon-danger-button"
                      disabled={locked}
                      onClick={() => removeUser(user.username)}
                      title={locked ? "บัญชีนี้ลบไม่ได้" : "ลบผู้ใช้"}
                      type="button"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function LoginScreen({ onSignedIn }: { onSignedIn: (session: AppSession) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submitLogin = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const nextSession = await signIn(username, password);
      onSignedIn(nextSession);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-screen">
      <form className="login-card" onSubmit={submitLogin}>
        <div className="login-brand">
          <img alt="JR logo" className="login-logo" src={brandLogoSrc} />
          <div>
            <strong>OEE Entry</strong>
            <span>Production access</span>
          </div>
        </div>
        <div className="login-heading">
          <LockKeyhole size={22} />
          <h1>เข้าสู่ระบบ</h1>
        </div>
        <label>
          <span className="label-text">Username <RequiredMark /></span>
          <input
            autoComplete="username"
            autoFocus
            onChange={(event) => setUsername(event.target.value)}
            placeholder="admin หรือ production"
            required
            type="text"
            value={username}
          />
        </label>
        <label>
          <span className="label-text">Password <RequiredMark /></span>
          <input
            autoComplete="current-password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="รหัสผ่าน"
            required
            type="password"
            value={password}
          />
        </label>
        {error && <p className="login-error">{error}</p>}
        <button className="primary-button login-button" disabled={loading} type="submit">
          {loading ? "กำลังตรวจสอบ" : "เข้าใช้งาน"}
        </button>
        <p className="login-note">
          ใช้สำหรับกันหน้าจอเบื้องต้นบน GitHub Pages หากต้องการความปลอดภัยจริงควรต่อ backend authentication
        </p>
      </form>
    </main>
  );
}

function FilterEmptyNotice({
  latestDate,
  message,
  onClearDates,
  onUseLatest,
}: {
  latestDate?: string;
  message: string;
  onClearDates: () => void;
  onUseLatest: () => void;
}) {
  return (
    <div className="filter-empty-message" role="status">
      <span>{message}</span>
      <div>
        {latestDate && (
          <button onClick={onUseLatest} type="button">
            ใช้วันที่ล่าสุด {latestDate}
          </button>
        )}
        <button onClick={onClearDates} type="button">
          ล้างวันที่
        </button>
      </div>
    </div>
  );
}

function PdSheetsView({
  error,
  loading,
  onRefresh,
  sources,
  updatedAt,
}: {
  error: string;
  loading: boolean;
  onRefresh: () => void;
  sources: PdWorkbook[];
  updatedAt: string;
}) {
  const [pdView, setPdView] = useState<"summary" | "search" | "tables">("summary");
  const [pdQuery, setPdQuery] = useState("");
  const [pdSourceFilter, setPdSourceFilter] = useState("");
  const [uploadedSources, setUploadedSources] = useState<PdWorkbook[]>([]);
  const [importError, setImportError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const allSources = useMemo(() => [...uploadedSources, ...sources], [uploadedSources, sources]);
  const totalSheets = allSources.reduce((sum, source) => sum + source.sheets.length, 0);
  const totalAllRows = allSources.reduce(
    (sum, source) => sum + source.sheets.reduce((sheetSum, sheet) => sheetSum + sheet.rowCount, 0),
    0,
  );
  const flatRows = useMemo(
    () =>
      allSources.flatMap((source) =>
        source.sheets.flatMap((sheet) =>
          sheet.rows.map((row, rowIndex) => ({
            row,
            rowIndex,
            sheet,
            source,
            text: [source.label, source.name, sheet.name, ...sheet.headers, ...row].join(" ").toLowerCase(),
          })),
        ),
      ),
    [allSources],
  );
  const visibleSearchRows = useMemo(() => {
    const query = pdQuery.trim().toLowerCase();
    return flatRows
      .filter((item) => (!pdSourceFilter || item.source.id === pdSourceFilter) && (!query || item.text.includes(query)))
      .slice(0, 120);
  }, [flatRows, pdQuery, pdSourceFilter]);
  const readySources = allSources.filter((source) => source.ok);
  const blockedSources = allSources.filter((source) => !source.ok);
  const totalColumns = allSources.reduce(
    (sum, source) => sum + source.sheets.reduce((sheetSum, sheet) => sheetSum + sheet.headers.length, 0),
    0,
  );
  const capacitySummary = useMemo(() => summarizePdCapacity(allSources), [allSources]);
  const importFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setImportError("");
    try {
      const imported = await Promise.all([...files].map(readPdUploadFile));
      setUploadedSources((current) => [...imported, ...current]);
      setPdView("summary");
    } catch (uploadError) {
      setImportError(uploadError instanceof Error ? uploadError.message : "นำเข้าไฟล์ไม่สำเร็จ กรุณาลองใช้ไฟล์ .xlsx, .xls หรือ .csv");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <section className="pd-layout">
      <div className="report-toolbar analysis-panel">
        <div>
          <p className="eyebrow">PD Google Sheets</p>
          <h2>ข้อมูล PD จาก Google Sheet</h2>
          <p>ระบบจะรีเฟรชอัตโนมัติทุก 60 วินาทีเมื่อเปิดหน้านี้</p>
          {updatedAt && <p>อัปเดตล่าสุด: {updatedAt}</p>}
        </div>
        <div className="pd-toolbar-actions">
          <input
            accept=".xlsx,.xls,.csv,.txt"
            className="visually-hidden"
            multiple
            onChange={(event) => void importFiles(event.target.files)}
            ref={fileInputRef}
            type="file"
          />
          <button className="primary-button" onClick={() => fileInputRef.current?.click()} type="button">
            <Upload size={18} /> นำเข้าไฟล์
          </button>
          <button className="ghost-button" disabled={loading} onClick={onRefresh} type="button">
            <TableProperties size={18} /> {loading ? "กำลังโหลด" : "รีเฟรชข้อมูล"}
          </button>
        </div>
      </div>

      {error && (
        <div className="duplicate-warning" role="alert">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}
      {importError && (
        <div className="duplicate-warning" role="alert">
          <AlertTriangle size={18} />
          <span>{importError}</span>
        </div>
      )}

      <div className="kpi-grid">
        <Kpi label="Files" value={formatNumber(allSources.length)} tone="blue" />
        <Kpi label="Worksheets" value={formatNumber(totalSheets)} tone="green" />
        <Kpi label="Rows" value={formatNumber(totalAllRows)} tone="amber" />
        <Kpi label="Auto refresh" value="60 วินาที" tone="neutral" />
      </div>

      {allSources.length === 0 && !loading && <p className="empty-text">ยังไม่มีข้อมูล PD ให้แสดง</p>}

      <div className="pd-view-tabs">
        {[
          { id: "summary", label: "สรุป" },
          { id: "search", label: "ค้นหา" },
          { id: "tables", label: "ตารางข้อมูล" },
        ].map((item) => (
          <button
            className={pdView === item.id ? "active" : ""}
            key={item.id}
            onClick={() => setPdView(item.id as typeof pdView)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>

      {pdView === "summary" && (
        <div className="pd-summary-grid">
          <div className="analysis-panel pd-analysis-card">
            <p className="eyebrow">PD Analysis</p>
            <h2>ภาพรวมข้อมูล</h2>
            <div className="pd-mini-stats">
              <div>
                <span>พร้อมใช้</span>
                <strong>{formatNumber(readySources.length)} ไฟล์</strong>
              </div>
              <div>
                <span>ต้องแก้สิทธิ์</span>
                <strong>{formatNumber(blockedSources.length)} ไฟล์</strong>
              </div>
              <div>
                <span>คอลัมน์</span>
                <strong>{formatNumber(totalColumns)}</strong>
              </div>
              <div>
                <span>Part No.</span>
                <strong>{formatNumber(capacitySummary.partCount)}</strong>
              </div>
              <div>
                <span>M/C</span>
                <strong>{formatNumber(capacitySummary.machineCount)}</strong>
              </div>
              <div>
                <span>Avg target</span>
                <strong>{formatNumber(capacitySummary.targetAverage)}</strong>
              </div>
            </div>
            <div className="pd-target-summary">
              <div>
                <span>Target รวม</span>
                <strong>{formatNumber(capacitySummary.targetTotal)}</strong>
                <small>{formatNumber(capacitySummary.targetCount)} รายการที่มี target</small>
              </div>
              <div>
                <span>Top target</span>
                {capacitySummary.topTargets.length ? (
                  capacitySummary.topTargets.map((item) => (
                    <p key={`${item.label}-${item.target}`}>
                      <b>{formatNumber(item.target)}</b> {item.label}
                    </p>
                  ))
                ) : (
                  <p>ยังไม่พบคอลัมน์ target ในข้อมูล</p>
                )}
              </div>
            </div>
            <p className="pd-analysis-note">
              เมื่อแชร์ไฟล์เป็น Anyone with the link can view แล้ว หน้า PD จะสรุปและค้นหาข้อมูลใหม่อัตโนมัติ
            </p>
          </div>
          <div className="analysis-panel pd-source-menu">
            <div className="report-table-heading compact-heading">
              <h2>เมนูไฟล์ PD</h2>
              <span>{formatNumber(allSources.length)} ไฟล์</span>
            </div>
            {allSources.map((source) => (
              <PdSourceCard key={source.id} source={source} onOpenTables={() => setPdView("tables")} />
            ))}
          </div>
        </div>
      )}

      {pdView === "search" && (
        <div className="analysis-panel pd-search-panel">
          <div className="report-table-heading compact-heading">
            <h2>ค้นหาข้อมูล PD</h2>
            <span>{formatNumber(visibleSearchRows.length)} รายการ</span>
          </div>
          <div className="pd-search-controls">
            <div className="input-with-icon">
              <Search size={16} />
              <input
                autoFocus
                onChange={(event) => setPdQuery(event.target.value)}
                placeholder="ค้นหา Part No., รุ่น, วันที่, ข้อความในตาราง"
                type="search"
                value={pdQuery}
              />
            </div>
            <select onChange={(event) => setPdSourceFilter(event.target.value)} value={pdSourceFilter}>
              <option value="">ทุกไฟล์ PD</option>
              {allSources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.label} - {source.name}
                </option>
              ))}
            </select>
          </div>
          <PdSearchResults rows={visibleSearchRows} />
        </div>
      )}

      {pdView === "tables" && allSources.map((source) => (
        <div className="analysis-panel pd-source" key={source.id}>
          <div className="pd-source-heading">
            <div>
              <p className="eyebrow">{source.label}</p>
              <h2>{source.name}</h2>
              {source.url && (
                <a href={source.url} rel="noreferrer" target="_blank">
                  เปิด Google Sheet
                </a>
              )}
            </div>
            <span className={source.ok ? "pd-status ok" : "pd-status error"}>{source.ok ? "พร้อมใช้งาน" : "อ่านไม่ได้"}</span>
          </div>
          {source.error && <PdAccessNotice source={source} />}
          {source.sheets.map((sheet) => (
            <PdWorksheetTable key={`${source.id}-${sheet.name}`} sheet={sheet} />
          ))}
        </div>
      ))}
    </section>
  );
}

function PdSourceCard({ onOpenTables, source }: { onOpenTables: () => void; source: PdWorkbook }) {
  const rows = source.sheets.reduce((sum, sheet) => sum + sheet.rowCount, 0);
  return (
    <div className="pd-source-card">
      <div>
        <span className={source.ok ? "pd-status ok" : "pd-status error"}>{source.ok ? "พร้อมใช้" : "ต้องแชร์ไฟล์"}</span>
        <strong>{source.name}</strong>
        <small>
          {formatNumber(source.sheets.length)} sheets / {formatNumber(rows)} rows
        </small>
      </div>
      <div>
        {source.url && (
          <a href={source.url} rel="noreferrer" target="_blank">
            เปิดไฟล์
          </a>
        )}
        <button onClick={onOpenTables} type="button">
          ดูตาราง
        </button>
      </div>
    </div>
  );
}

function PdSearchResults({
  rows,
}: {
  rows: Array<{
    row: string[];
    rowIndex: number;
    sheet: PdWorkbook["sheets"][number];
    source: PdWorkbook;
  }>;
}) {
  if (!rows.length) {
    return <p className="empty-text">ไม่พบข้อมูลตามคำค้น หรือไฟล์ PD ยังไม่ได้เปิดสิทธิ์ให้อ่าน</p>;
  }

  return (
    <div className="pd-search-results">
      {rows.map((item) => (
        <div className="pd-search-result" key={`${item.source.id}-${item.sheet.name}-${item.rowIndex}`}>
          <div>
            <strong>
              {item.source.label} / {item.sheet.name}
            </strong>
            <span>แถว {formatNumber(item.rowIndex + 2)}</span>
          </div>
          <dl>
            {item.sheet.headers.slice(0, 8).map((header, index) => (
              <div key={`${header}-${index}`}>
                <dt>{header || `Column ${index + 1}`}</dt>
                <dd>{item.row[index] || "-"}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}

function PdAccessNotice({ source }: { source: PdWorkbook }) {
  return (
    <div className="pd-access-notice" role="status">
      <AlertTriangle size={20} />
      <div>
        <strong>ยังดึงข้อมูลจากไฟล์นี้ไม่ได้</strong>
        <p>{source.error}</p>
        {source.shareEmail && <p>อีเมลที่ใช้แชร์ให้ Apps Script: {source.shareEmail}</p>}
        {source.technicalError && <small>รายละเอียดระบบ: {source.technicalError}</small>}
      </div>
    </div>
  );
}

function PdWorksheetTable({ sheet }: { sheet: PdWorkbook["sheets"][number] }) {
  return (
    <div className="pd-sheet-block">
      <div className="report-table-heading">
        <h2>{sheet.name}</h2>
        <span>
          {formatNumber(sheet.rowCount)} rows / {formatNumber(sheet.columnCount)} cols
        </span>
      </div>
      {sheet.truncated && <p className="pd-note">แสดงข้อมูลบางส่วนเพื่อให้โหลดเร็ว หากมีข้อมูลเพิ่ม ระบบจะอ่านใหม่ตอนรีเฟรช</p>}
      <div className="data-table-wrap pd-table">
        <table>
          <thead>
            <tr>
              {sheet.headers.map((header, index) => (
                <th key={`${header}-${index}`}>{header || `Column ${index + 1}`}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sheet.rows.length === 0 ? (
              <tr>
                <td className="empty-cell" colSpan={Math.max(sheet.headers.length, 1)}>
                  ไม่มีข้อมูลในชีตนี้
                </td>
              </tr>
            ) : (
              sheet.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {sheet.headers.map((_, columnIndex) => (
                    <td key={columnIndex}>{row[columnIndex] || ""}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReportsView({
  emptyMessage,
  filters,
  latestDate,
  logs,
  onClearDates,
  onDownloadPdf,
  onUseLatest,
  setFilters,
}: {
  emptyMessage: string;
  filters: Filters;
  latestDate?: string;
  logs: ProductionLog[];
  onClearDates: () => void;
  onDownloadPdf: () => void;
  onUseLatest: () => void;
  setFilters: (filters: Filters) => void;
}) {
  const summary = summarize(logs);
  const oee = summary.availability * summary.quality;
  const shiftRows = aggregateReportRows(
    logs,
    (log) => shiftLabel(log.shift),
    (log) => shiftRuleLabel(log.shift),
  );
  const machineRows = aggregateReportRows(logs, (log) => log.machineName, () => "");
  const partRows = aggregateReportRows(
    logs,
    (log) => `${log.productName} / ${log.partNo}`,
    (log) => `Step ${log.step || "-"} | ${log.machineName} | ${shiftWindowLabel(log.date, log.shift)}`,
  );
  const downtimeRows = groupDowntime(logs);
  const downtimeStats = getDowntimeStats(logs);

  return (
    <section className="reports-layout">
      <div className="report-toolbar analysis-panel">
        <div>
          <p className="eyebrow">Production document</p>
          <h2>สรุปการกรอกยอดสำหรับดาวน์โหลด PDF</h2>
          <p>ช่วงวันที่ผลิต: {reportRangeLabel(filters)} | เครื่อง: {reportMachineLabel(filters)} | กะ: {reportShiftLabel(filters)}</p>
          <p>กะเช้า 08:00-20:00 ของวันที่ผลิต | กะดึก 20:00-08:00 ของวันถัดไป</p>
        </div>
        <button className="primary-button" onClick={onDownloadPdf} type="button">
          <FileText size={18} /> ดาวน์โหลด PDF
        </button>
      </div>

      <FiltersBar filters={filters} setFilters={setFilters} />
      {emptyMessage && (
        <FilterEmptyNotice
          latestDate={latestDate}
          message={emptyMessage}
          onClearDates={onClearDates}
          onUseLatest={onUseLatest}
        />
      )}

      <div className="kpi-grid">
        <Kpi label="Good" value={formatNumber(summary.good)} tone="green" />
        <Kpi label="NG" value={formatNumber(summary.ng)} tone="red" />
        <Kpi label="Test" value={formatNumber(summary.test)} tone="amber" />
        <Kpi label="Total" value={formatNumber(summary.total)} tone="blue" />
        <Kpi label="Downtime" value={`${formatNumber(summary.downtime)} นาที`} tone="red" />
        <Kpi label="Records" value={formatNumber(logs.length)} tone="neutral" />
      </div>

      <div className="kpi-grid report-oee-kpis">
        <Kpi label="OEE" value={formatPercent(oee)} tone="green" />
        <Kpi label="Availability" value={formatPercent(summary.availability)} tone="amber" />
        <Kpi label="Quality" value={formatPercent(summary.quality)} tone="blue" />
        <Kpi label="Run Time" value={`${formatNumber(summary.run)} นาที`} tone="neutral" />
      </div>
      <OeeSummaryChart summary={summary} />
      <DowntimeInsightPanel rows={downtimeStats} summary={summary} />

      <ReportRowsTable rows={shiftRows} title="สรุปตามกะและช่วงเวลาทำงาน" />
      <ReportRowsTable rows={machineRows} title="สรุปตามเครื่องจักร" />
      <ReportRowsTable rows={partRows.slice(0, 40)} title="สรุปตามรุ่น / Part No." />

      <div className="analysis-panel">
        <h2>Downtime แยกตามหัวข้อ</h2>
        <div className="report-downtime-grid">
          {downtimeRows.map((item) => (
            <div className="report-downtime-item" key={item.key}>
              <span>{item.shortLabel}</span>
              <strong>{formatNumber(item.minutes)} นาที</strong>
            </div>
          ))}
        </div>
      </div>
      <DowntimeStatsTable rows={downtimeStats} />
    </section>
  );
}

function DowntimeInsightPanel({ rows, summary }: { rows: DowntimeStatRow[]; summary: ReturnType<typeof summarize> }) {
  const activeRows = rows.filter((row) => row.minutes > 0 || row.count > 0);
  const topRows = activeRows.slice(0, 5);
  const topIssue = activeRows[0];
  const topThreeMinutes = activeRows.slice(0, 3).reduce((sum, row) => sum + row.minutes, 0);
  const topThreePercent = summary.downtime > 0 ? topThreeMinutes / summary.downtime : 0;
  const maxMinutes = Math.max(...topRows.map((row) => row.minutes), 1);
  const downtimeShare = summary.run + summary.downtime > 0 ? summary.downtime / (summary.run + summary.downtime) : 0;
  const insightText = topIssue
    ? `ควรโฟกัส ${topIssue.shortLabel} ก่อน เพราะใช้เวลา ${formatNumber(topIssue.minutes)} นาที (${formatPercent(topIssue.percent)})`
    : "ยังไม่มี Downtime ตามตัวกรองนี้";

  return (
    <div className="analysis-panel downtime-insight-panel">
      <div className="report-table-heading compact-heading">
        <h2>วิเคราะห์การหยุดเครื่อง</h2>
        <span>สรุปสั้น</span>
      </div>
      <div className="downtime-insight-grid">
        <div className="downtime-insight-card focus">
          <span>ปัญหาหลัก</span>
          <strong>{topIssue?.shortLabel ?? "-"}</strong>
          <p>{insightText}</p>
        </div>
        <div className="downtime-insight-card">
          <span>Downtime รวม</span>
          <strong>{formatNumber(summary.downtime)} นาที</strong>
          <p>คิดเป็น {formatPercent(downtimeShare)} ของเวลาทั้งหมด</p>
        </div>
        <div className="downtime-insight-card">
          <span>Top 3</span>
          <strong>{formatPercent(topThreePercent)}</strong>
          <p>ของเวลาหยุดทั้งหมด</p>
        </div>
        <div className="downtime-insight-card">
          <span>จำนวนปัญหา</span>
          <strong>{formatNumber(activeRows.length)}</strong>
          <p>หัวข้อที่เกิด downtime</p>
        </div>
      </div>
      <div className="downtime-insight-bars">
        {topRows.length === 0 ? (
          <p className="empty-text">ไม่มีข้อมูล Downtime ตามตัวกรองนี้</p>
        ) : (
          topRows.map((row) => (
            <div className="downtime-insight-bar" key={row.key}>
              <div>
                <span>{row.shortLabel}</span>
                <b>{formatNumber(row.minutes)} นาที</b>
              </div>
              <div className="downtime-insight-track">
                <i style={{ width: `${Math.max((row.minutes / maxMinutes) * 100, 4)}%` }} />
              </div>
              <em>{formatPercent(row.percent)}</em>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function DowntimeStatsTable({ rows }: { rows: DowntimeStatRow[] }) {
  const visibleRows = rows.filter((row) => row.minutes > 0 || row.count > 0);
  return (
    <div className="data-table-wrap report-table">
      <div className="report-table-heading">
        <h2>สถิติการหยุดเครื่อง</h2>
        <span>{formatNumber(visibleRows.length)} ปัญหา</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>No.</th>
            <th>ปัญหาการหยุดเครื่อง</th>
            <th>เวลาหยุดรวม</th>
            <th>จำนวนครั้ง</th>
            <th>สัดส่วน</th>
          </tr>
        </thead>
        <tbody>
          {visibleRows.length === 0 ? (
            <tr>
              <td className="empty-cell" colSpan={5}>
                ไม่มีข้อมูลตามตัวกรองนี้
              </td>
            </tr>
          ) : (
            visibleRows.map((row, index) => (
              <tr key={row.key}>
                <td>{index + 1}</td>
                <td>
                  <strong>{row.label}</strong>
                  <small>{row.shortLabel}</small>
                </td>
                <td>{formatNumber(row.minutes)} นาที</td>
                <td>{formatNumber(row.count)} ครั้ง</td>
                <td>{formatPercent(row.percent)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function ReportRowsTable({ rows, title }: { rows: ReportRow[]; title: string }) {
  return (
    <div className="data-table-wrap report-table">
      <div className="report-table-heading">
        <h2>{title}</h2>
        <span>{formatNumber(rows.length)} รายการ</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>No.</th>
            <th>รายการ</th>
            <th>Good</th>
            <th>NG</th>
            <th>Test</th>
            <th>Total</th>
            <th>Downtime</th>
            <th>Normal</th>
            <th>Records</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="empty-cell" colSpan={9}>
                ไม่มีข้อมูลตามตัวกรองนี้
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={`${row.label}-${index}`}>
                <td>{index + 1}</td>
                <td>
                  <strong>{row.label}</strong>
                  {row.detail && <small>{row.detail}</small>}
                </td>
                <td>{formatNumber(row.good)}</td>
                <td>{formatNumber(row.ng)}</td>
                <td>{formatNumber(row.test)}</td>
                <td>{formatNumber(row.total)}</td>
                <td>{formatNumber(row.downtime)} นาที</td>
                <td>{formatNumber(row.normalMinutes)} นาที</td>
                <td>{formatNumber(row.count)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function FiltersBar({ filters, setFilters }: { filters: Filters; setFilters: (filters: Filters) => void }) {
  return (
    <div className="filters-bar">
      <label>
        จาก
        <input value={filters.from} onChange={(event) => setFilters({ ...filters, from: event.target.value })} type="date" />
      </label>
      <label>
        ถึง
        <input value={filters.to} onChange={(event) => setFilters({ ...filters, to: event.target.value })} type="date" />
      </label>
      <label>
        เครื่อง
        <select value={filters.machineId} onChange={(event) => setFilters({ ...filters, machineId: event.target.value })}>
          <option value="">ทั้งหมด</option>
          {machines.map((machine) => (
            <option key={machine.id} value={machine.id}>
              {machine.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        กะ
        <select value={filters.shift} onChange={(event) => setFilters({ ...filters, shift: event.target.value })}>
          <option value="">ทั้งหมด</option>
          {orderedShiftOptions.map((shift) => (
            <option key={shift} value={shift}>
              {shiftLabel(shift)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className={`kpi ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function PartNoSummary({ logs }: { logs: ProductionLog[] }) {
  const rows = [...logs
    .reduce(
      (map, log) => {
        const key = `${log.productName}::${log.partNo}::${log.step}`;
        const current =
          map.get(key) ??
          {
            good: 0,
            ng: 0,
            partNo: log.partNo,
            productName: log.productName,
            step: log.step,
            test: 0,
            total: 0,
          };
        current.good += Number(log.goodQty || 0);
        current.ng += Number(log.ngQty || 0);
        current.test += Number(log.testQty || 0);
        current.total += 1;
        map.set(key, current);
        return map;
      },
      new Map<
        string,
        {
          good: number;
          ng: number;
          partNo: string;
          productName: string;
          step: string;
          test: number;
          total: number;
        }
      >(),
    )
    .values()]
    .sort((a, b) => b.total - a.total || a.partNo.localeCompare(b.partNo));
  const visibleRows = rows.slice(0, 12);
  const hiddenCount = Math.max(rows.length - visibleRows.length, 0);

  return (
    <div className="analysis-panel part-summary-panel">
      <div className="part-summary-heading">
        <h2>รุ่น / Part No.</h2>
        <span>{formatNumber(rows.length)} Part No.</span>
      </div>
      {visibleRows.length > 0 ? (
        <>
          <div className="part-summary-grid">
            {visibleRows.map((row) => (
              <div className="part-summary-row" key={`${row.productName}-${row.partNo}-${row.step}`}>
                <div>
                  <strong>{row.partNo || "-"}</strong>
                  <span>{row.productName || "-"}</span>
                </div>
                <em>Step {row.step || "-"}</em>
                <b>{formatNumber(row.good + row.ng + row.test)}</b>
                <small>{formatNumber(row.total)} logs</small>
              </div>
            ))}
          </div>
          {hiddenCount > 0 && <p className="empty-text">แสดงอีก {formatNumber(hiddenCount)} Part No. ในตารางประวัติ</p>}
        </>
      ) : (
        <p className="empty-text">ไม่มี Part No. ตามตัวกรองนี้</p>
      )}
    </div>
  );
}

function OeeSummaryChart({ summary }: { summary: ReturnType<typeof summarize> }) {
  const oee = summary.availability * summary.quality;
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(oee, 0), 1);
  const strokeDashoffset = circumference * (1 - progress);
  const factors = [
    { label: "Availability", value: summary.availability, tone: "amber" },
    { label: "Quality", value: summary.quality, tone: "blue" },
    { label: "OEE", value: oee, tone: "green" },
  ];

  return (
    <div className="analysis-panel oee-summary-chart">
      <div className="section-title">
        <Gauge size={20} />
        <h2>สรุป OEE</h2>
      </div>
      <div className="oee-summary-layout">
        <div className="oee-gauge-wrap">
          <svg aria-label={`OEE ${formatPercent(oee)}`} className="oee-gauge" viewBox="0 0 180 180" role="img">
            <circle className="oee-gauge-bg" cx="90" cy="90" r={radius} />
            <circle
              className="oee-gauge-value"
              cx="90"
              cy="90"
              r={radius}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>
          <div className="oee-gauge-label">
            <span>OEE</span>
            <strong>{formatPercent(oee)}</strong>
          </div>
        </div>
        <div className="oee-factor-list">
          {factors.map((factor) => (
            <div className={`oee-factor ${factor.tone}`} key={factor.label}>
              <div>
                <span>{factor.label}</span>
                <strong>{formatPercent(factor.value)}</strong>
              </div>
              <div className="oee-factor-track">
                <div style={{ width: `${Math.min(Math.max(factor.value, 0), 1) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="oee-volume-summary">
          <div>
            <span>Run time</span>
            <strong>{formatNumber(summary.run)} นาที</strong>
          </div>
          <div>
            <span>Downtime</span>
            <strong>{formatNumber(summary.downtime)} นาที</strong>
          </div>
          <div>
            <span>Total output</span>
            <strong>{formatNumber(summary.total)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

function DowntimeChart({ items }: { items: ReturnType<typeof groupDowntime> }) {
  const max = Math.max(...items.map((item) => item.minutes), 1);
  return (
    <div className="analysis-panel">
      <h2>Downtime Pareto</h2>
      <div className="bar-list">
        {items.map((item) => (
          <div className="bar-row" key={item.key}>
            <span>{item.label}</span>
            <div className="bar-track">
              <div style={{ width: `${(item.minutes / max) * 100}%` }} />
            </div>
            <b>{formatNumber(item.minutes)}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

type MachineCapacityRow = {
  actualOutput: number;
  availability: number;
  count: number;
  downtime: number;
  firstDate: string;
  gapQty: number;
  lastDate: string;
  machine: Pick<Machine, "id" | "name">;
  normalMinutes: number;
  targetQty: number;
  utilization: number;
  workMinutes: number;
};

function buildMachineCapacityRows(logs: ProductionLog[]): MachineCapacityRow[] {
  const rows = logs.reduce((map, log) => {
    const machine = machines.find((item) => item.id === log.machineId) ?? { id: log.machineId, name: log.machineName || log.machineId };
    const current =
      map.get(log.machineId) ??
      {
        actualOutput: 0,
        count: 0,
        downtime: 0,
        firstDate: log.date,
        gapQty: 0,
        lastDate: log.date,
        machine,
        normalMinutes: 0,
        targetQty: 0,
        workMinutes: 0,
      };
    const workMinutes = getLogWorkMinutes(log);
    const targetQty = getLogTargetQty(log);
    current.actualOutput += totalOutput(log);
    current.count += 1;
    current.downtime += totalDowntime(log);
    current.firstDate = current.firstDate ? (log.date < current.firstDate ? log.date : current.firstDate) : log.date;
    current.lastDate = current.lastDate ? (log.date > current.lastDate ? log.date : current.lastDate) : log.date;
    current.normalMinutes += Number(log.normalMinutes || 0);
    current.targetQty += targetQty;
    current.workMinutes += workMinutes;
    map.set(log.machineId, current);
    return map;
  }, new Map<string, Omit<MachineCapacityRow, "availability" | "gapQty" | "utilization">>());

  const machineOrder = new Map(machines.map((machine, index) => [machine.id, index]));
  return [...rows.values()]
    .map((row) => ({
      ...row,
      availability: row.workMinutes > 0 ? row.normalMinutes / row.workMinutes : 0,
      gapQty: row.actualOutput - row.targetQty,
      utilization: row.targetQty > 0 ? row.actualOutput / row.targetQty : 0,
    }))
    .sort(
      (a, b) =>
        (machineOrder.get(a.machine.id) ?? Number.MAX_SAFE_INTEGER) -
          (machineOrder.get(b.machine.id) ?? Number.MAX_SAFE_INTEGER) ||
        a.machine.name.localeCompare(b.machine.name),
    );
}

function MachineCapacityDashboard({ logs }: { logs: ProductionLog[] }) {
  const rows = useMemo(() => buildMachineCapacityRows(logs), [logs]);
  return (
    <div className="analysis-panel capacity-panel">
      <div className="report-table-heading compact-heading">
        <h2>อัตราใช้กำลังผลิตรายเครื่อง</h2>
        <span>{formatNumber(rows.length)} เครื่อง</span>
      </div>
      <div className="data-table-wrap capacity-table">
        <table>
          <thead>
            <tr>
              <th>Machine</th>
              <th>Dates</th>
              <th>Logs</th>
              <th>Work min</th>
              <th>Target</th>
              <th>Actual</th>
              <th>Gap</th>
              <th>Utilization</th>
              <th>Availability</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="empty-cell" colSpan={9}>
                  ไม่มีข้อมูลตามตัวกรองนี้
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const utilizationTone = row.utilization >= 1 ? "good" : row.utilization >= 0.85 ? "warn" : "risk";
                const utilizationWidth = `${Math.min(Math.max(row.utilization, 0), 1) * 100}%`;
                return (
                  <tr key={row.machine.id}>
                    <td>
                      <strong>{row.machine.name}</strong>
                    </td>
                    <td>
                      <span className="muted-cell">
                        {row.firstDate === row.lastDate ? row.firstDate : `${row.firstDate} - ${row.lastDate}`}
                      </span>
                    </td>
                    <td>{formatNumber(row.count)}</td>
                    <td>{formatNumber(row.workMinutes)}</td>
                    <td>{formatNumber(row.targetQty)}</td>
                    <td>{formatNumber(row.actualOutput)}</td>
                    <td className={row.gapQty >= 0 ? "gap-positive" : "gap-negative"}>{formatNumber(row.gapQty)}</td>
                    <td>
                      <div className={`capacity-utilization ${utilizationTone}`}>
                        <strong>{formatPercent(row.utilization)}</strong>
                        <div className="capacity-utilization-track">
                          <i style={{ width: utilizationWidth }} />
                        </div>
                      </div>
                    </td>
                    <td>{formatPercent(row.availability)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MachineRanking({ logs }: { logs: ProductionLog[] }) {
  const summaries = logs.reduce(
    (map, log) => {
      const current =
        map.get(log.machineId) ??
        {
          downtime: 0,
          good: 0,
          ng: 0,
          normalMinutes: 0,
          test: 0,
          count: 0,
        };
      current.good += Number(log.goodQty || 0);
      current.ng += Number(log.ngQty || 0);
      current.test += Number(log.testQty || 0);
      current.normalMinutes += Number(log.normalMinutes || 0);
      current.downtime += totalDowntime(log);
      current.count += 1;
      map.set(log.machineId, current);
      return map;
    },
    new Map<
      string,
      {
        count: number;
        downtime: number;
        good: number;
        ng: number;
        normalMinutes: number;
        test: number;
      }
    >(),
  );
  const rows = [...summaries.entries()]
    .map(([machineId, row]) => {
      const machine = machines.find((item) => item.id === machineId) ?? { id: machineId, name: machineId };
      const qualityValue = row.good + row.ng === 0 ? 0 : row.good / (row.good + row.ng);
      return { machine, quality: qualityValue, ...row };
    })
    .sort((a, b) => b.good - a.good)
    .slice(0, 10);

  return (
    <div className="analysis-panel">
      <h2>Machine ranking</h2>
      <div className="ranking-list">
        {rows.map((row, index) => (
          <div className="ranking-row" key={row.machine.id}>
            <span>{index + 1}</span>
            <strong>{row.machine.name}</strong>
            <b>{formatNumber(row.good)}</b>
            <em>{formatPercent(row.quality)}</em>
          </div>
        ))}
      </div>
    </div>
  );
}

function Trend({ logs }: { logs: ProductionLog[] }) {
  const points = [
    ...logs
      .reduce((map, log) => {
        map.set(log.date, (map.get(log.date) ?? 0) + Number(log.goodQty || 0));
        return map;
      }, new Map<string, number>())
      .entries(),
  ]
    .map(([date, good]) => ({ date, good }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-18);
  const max = Math.max(...points.map((point) => point.good), 1);
  const width = 900;
  const height = 220;
  const path = points
    .map((point, index) => {
      const x = points.length === 1 ? width / 2 : (index / (points.length - 1)) * width;
      const y = height - (point.good / max) * (height - 28) - 14;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div className="analysis-panel trend-panel">
      <h2>Good quantity trend</h2>
      <svg viewBox={`0 0 ${width} ${height}`} role="img">
        <path d={path} fill="none" stroke="#2563eb" strokeLinecap="round" strokeWidth="4" />
        {points.map((point, index) => {
          const x = points.length === 1 ? width / 2 : (index / (points.length - 1)) * width;
          const y = height - (point.good / max) * (height - 28) - 14;
          return <circle cx={x} cy={y} fill="#16a34a" key={point.date} r="5" />;
        })}
      </svg>
      <div className="trend-labels">
        {points.map((point) => (
          <span key={point.date}>{point.date.slice(5)}</span>
        ))}
      </div>
    </div>
  );
}

function LogsTable({ logs, onEdit }: { logs: ProductionLog[]; onEdit: (log: ProductionLog) => void }) {
  return (
    <div className="data-table-wrap">
      <table>
        <thead>
          <tr>
            <th>Action</th>
            <th>Entry Date</th>
            <th>Entry Time</th>
            <th>Production Date</th>
            <th>Shift</th>
            <th>Shift Time</th>
            <th>Machine</th>
            <th>Product</th>
            <th>Part No.</th>
            <th>Step</th>
            <th>Speed</th>
            <th>Good</th>
            <th>NG</th>
            <th>Downtime</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>
                <button className="icon-action-button" onClick={() => onEdit(log)} title="แก้ไขรายการนี้" type="button">
                  <Pencil size={16} />
                </button>
              </td>
              <td>{getRecordDate(log)}</td>
              <td>{getRecordTime(log)}</td>
              <td>{log.date}</td>
              <td>{shiftLabel(log.shift)}</td>
              <td>{shiftWindowLabel(log.date, log.shift)}</td>
              <td>{log.machineName}</td>
              <td>{log.productName}</td>
              <td>{log.partNo}</td>
              <td>{log.step}</td>
              <td>{formatRate(log.machineSpeed ?? 0)}</td>
              <td>{formatNumber(log.goodQty)}</td>
              <td>{formatNumber(log.ngQty)}</td>
              <td>{formatNumber(totalDowntime(log))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MasterTable() {
  const [query, setQuery] = useState("");
  const rows = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return products.slice(0, 200);
    return products
      .filter((product) =>
        `${product.machineName} ${product.productName} ${product.partNo} ${product.step}`.toLowerCase().includes(search),
      )
      .slice(0, 200);
  }, [query]);

  return (
    <>
      <div className="table-toolbar">
        <div className="input-with-icon search-box">
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหา master data" type="search" />
        </div>
      </div>
      <div className="data-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Machine</th>
              <th>Product</th>
              <th>Part No.</th>
              <th>Step</th>
              <th>Sample Good</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((product) => (
              <tr key={product.id}>
                <td>{product.machineName}</td>
                <td>{product.productName}</td>
                <td>{product.partNo}</td>
                <td>{product.step}</td>
                <td>{formatNumber(product.sampleGoodQty)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default App;
