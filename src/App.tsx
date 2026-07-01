import {
  BarChart3,
  AlertTriangle,
  ArrowLeft,
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
import { machines as seedMachines, products, seedLogs } from "./data/oeeMasterData.generated";
import {
  appendRemoteLog,
  clearEmployeeMachineStatus,
  fetchEmployeeMachineStatuses,
  fetchMachines,
  fetchPdSheets,
  fetchProductDefaults,
  fetchRemoteLogs,
  remoteEnabled,
  updateRemoteLog,
  upsertEmployeeMachineStatus,
  type EmployeeMachineStatus,
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
  updateUser,
  type AppRole,
  type AppSession,
  type AppUserSummary,
} from "./lib/auth";
import {
  type DowntimeKey,
  downtimeFields,
  effectiveDowntimeValue,
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
type ProductChoice = ProductMaster & {
  latestDate?: string;
  latestGoodQty?: number;
  source?: "master" | "history";
};
type EmployeeTimerKey = "work" | DowntimeKey;
type EmployeeActiveTimer = {
  key: EmployeeTimerKey;
  startedAt: string;
  originalStartedAt?: string;
};
type PendingEmployeeTimer = {
  key: EmployeeTimerKey;
  label: string;
  pressedDate: string;
  pressedTime: string;
  startedAt: string;
};

const formatInputDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getTodayInputValue = () => formatInputDate(new Date());

const formatInputTime = (date: Date) =>
  [
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
    String(date.getSeconds()).padStart(2, "0"),
  ].join(":");

const getCurrentTimeInputValue = () => formatInputTime(new Date());

const parseLocalDateTime = (date: string, time: string) => {
  if (!date || !time) return null;
  const [year, month, day] = date.split("-").map(Number);
  const [hour = 0, minute = 0, second = 0] = time.split(":").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day, hour, minute, second);
};

const formatClock = (date: Date) =>
  [
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
    String(date.getSeconds()).padStart(2, "0"),
  ].join(":");

const formatElapsedTime = (milliseconds: number) => {
  const totalSeconds = Math.max(Math.floor(milliseconds / 1000), 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours} ชม. ${minutes} นาที ${seconds} วิ`;
  if (minutes > 0) return `${minutes} นาที ${seconds} วิ`;
  return `${seconds} วิ`;
};

const formatDurationMinutes = (minutesValue: number) => {
  const totalSeconds = Math.max(Math.round(Number(minutesValue || 0) * 60), 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours} ชม. ${minutes} นาที ${seconds} วิ`;
  if (minutes > 0) return `${minutes} นาที ${seconds} วิ`;
  return `${seconds} วิ`;
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
const productionWorkExcelCode = "A";
const employeeMachineActivityLabels: Record<string, string> = {
  work: "A กำลังผลิตอยู่",
  changeoverMinutes: "B กำลังเปลี่ยนรุ่น",
  inspectionMinutes: "C กำลังตรวจงานอยู่",
  equipmentRepairMinutes: "D กำลังซ่อมเครื่อง",
  moldRepairMinutes: "E กำลังซ่อมแม่พิมพ์",
  materialChangeMinutes: "F กำลังเปลี่ยนวัตถุดิบ",
  emergencyStopMinutes: "G หยุดไม่ทราบสาเหตุ",
  meetingMinutes: "H ประชุม/5S/เปลี่ยนกะ",
  plannedStopMinutes: "X หยุดตามแผน",
};
const getEmployeeMachineActivityLabel = (status?: Pick<EmployeeMachineStatus, "activeTimerKey" | "activeTimerLabel" | "workStartedAt">) => {
  if (!status) return "";
  if (status.activeTimerKey) return employeeMachineActivityLabels[status.activeTimerKey] || status.activeTimerLabel || "กำลังกรอก";
  if (status.workStartedAt) return "A เริ่มงานแล้ว";
  return "ร่างรอบันทึก";
};

const defaultMachine = seedMachines[0];
const defaultProduct = products.find((product) => product.machineId === defaultMachine.id) ?? products[0];
const SHIFT_DAY = "day";
const SHIFT_NIGHT = "night";
const orderedShiftOptions = [SHIFT_DAY, SHIFT_NIGHT];
const brandLogoSrc = `${import.meta.env.BASE_URL}jr-logo.png`;
const productionShareUrl = "https://weeraphonjod99-cmyk.github.io/oee-production-entry/";
const defaultMinutesPerSlot = 5;
const maxShiftWorkMinutes = 610;
const realtimeRemoteRefreshMs = 2500;
const remoteLogsRefreshMs = 120000;
const remoteMachinesRefreshMs = 60000;
const EMPLOYEE_DRAFT_KEY = "oee-production-employee-draft-v1";
const getEmployeeDraftStorageKey = (machineId: string) => `${EMPLOYEE_DRAFT_KEY}::${machineId || "unknown"}`;
const shiftBreakSchedules = {
  [SHIFT_DAY]: [
    { label: "10:00-10:10", start: "10:00", end: "10:10", minutes: 10 },
    { label: "12:00-13:00", start: "12:00", end: "13:00", minutes: 60 },
    { label: "15:00-15:10", start: "15:00", end: "15:10", minutes: 10 },
    { label: "17:00-17:30", start: "17:00", end: "17:30", minutes: 30 },
  ],
  [SHIFT_NIGHT]: [
    { label: "22:00-22:10", start: "22:00", end: "22:10", minutes: 10 },
    { label: "00:00-01:00", start: "00:00", end: "01:00", minutes: 60 },
    { label: "03:00-03:10", start: "03:00", end: "03:10", minutes: 10 },
    { label: "05:00-05:30", start: "05:00", end: "05:30", minutes: 30 },
  ],
} as const;

const getShiftBreakItems = (shift: string) =>
  normalizeShiftCode(shift) === SHIFT_NIGHT ? shiftBreakSchedules[SHIFT_NIGHT] : shiftBreakSchedules[SHIFT_DAY];
const getShiftBreakMinutes = (shift: string) => getShiftBreakItems(shift).reduce((sum, item) => sum + item.minutes, 0);
const getShiftBreakLabel = (shift: string) =>
  `${getShiftBreakItems(shift)
    .map((item) => item.label)
    .join(", ")} รวม ${getShiftBreakMinutes(shift)} นาที`;

const toPositiveNumber = (value: string) => Math.max(Number(value) || 0, 0);
const numberInputValue = (value: number | undefined) => (Number(value || 0) > 0 ? String(value) : "");
const roundNumber = (value: number) => Number(value.toFixed(2));
const getExcelCodeTone = (code: string) => {
  if (code === "A") return "code-a";
  if (code === "C") return "code-c";
  if (code === "E") return "code-e";
  return "code-default";
};
const getEmployeeTimerExcelCode = (key?: string) => {
  if (!key) return "";
  if (key === "work") return productionWorkExcelCode;
  return downtimeExcelCodes[key as DowntimeKey] || "";
};
const getEmployeeTimerToneClass = (key?: string) => {
  const code = getEmployeeTimerExcelCode(key).toLowerCase();
  return code ? `timer-tone-${code}` : "";
};

const employeeTimerRolePermissions: Partial<Record<AppRole, EmployeeTimerKey[]>> = {
  qc: ["work", "moldRepairMinutes"],
  tooling_repair: ["inspectionMinutes"],
  technician: ["work"],
};

const employeeRoleLabel = (role: AppRole) => {
  if (role === "admin") return "Admin";
  if (role === "production") return "Production";
  if (role === "qc") return "QC";
  if (role === "tooling_repair") return "Tooling repair";
  if (role === "technician") return "Technician";
  return role;
};

const canPressEmployeeTimerForRole = (role: AppRole | undefined, key: EmployeeTimerKey) => {
  if (!role || role === "admin" || role === "production") return true;
  return (employeeTimerRolePermissions[role] ?? []).includes(key);
};
const clampWorkMinutes = (value: number) => Math.min(roundNumber(Math.max(Number(value) || 0, 0)), maxShiftWorkMinutes);

const slotsFromMinutes = (workMinutes: number, minutesPerSlot: number) =>
  minutesPerSlot > 0 ? Math.round(clampWorkMinutes(workMinutes) / minutesPerSlot) : 0;

const clampTimeSlots = (slots: number, minutesPerSlot: number) =>
  minutesPerSlot > 0 ? Math.min(roundNumber(Math.max(Number(slots) || 0, 0)), slotsFromMinutes(maxShiftWorkMinutes, minutesPerSlot)) : 0;

const minutesToSlots = (minutes: number, minutesPerSlot: number) =>
  minutesPerSlot > 0 ? roundNumber(minutes / minutesPerSlot) : 0;

const slotsToMinutes = (slots: number, minutesPerSlot: number) => roundNumber(slots * minutesPerSlot);
const applyAutomaticBreakMinutes = <T extends { meetingMinutes: number; shift: string }>(draft: T): T => ({
  ...draft,
  meetingMinutes: Math.max(Number(draft.meetingMinutes || 0), getShiftBreakMinutes(draft.shift)),
});

function createEmptyDraft(machine: Machine, product: ProductMaster): EntryDraft {
  const minutesPerSlot = defaultMinutesPerSlot;
  const workMinutes = clampWorkMinutes(machine.capacityMinutes);
  const currentShift = getCurrentProductionShift();
  return {
    date: currentShift.date,
    recordDate: getTodayInputValue(),
    recordTime: getCurrentTimeInputValue(),
    shift: currentShift.shift,
    shiftStartAt: shiftStartAt(currentShift.date, currentShift.shift),
    shiftEndAt: shiftEndAt(currentShift.date, currentShift.shift),
    machineId: machine.id,
    productName: product.productName,
    partNo: product.partNo,
    step: product.step,
    materialOfProduction: "",
    machineSpeed: 0,
    cavityQty: 0,
    workMinutes,
    timeSlots: slotsFromMinutes(workMinutes, minutesPerSlot),
    minutesPerSlot,
    changeoverMinutes: 0,
    inspectionMinutes: 0,
    equipmentRepairMinutes: 0,
    moldRepairMinutes: 0,
    materialChangeMinutes: 0,
    emergencyStopMinutes: 0,
    meetingMinutes: getShiftBreakMinutes(currentShift.shift),
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

const getCurrentProductionShift = (now = new Date()) => {
  const today = formatInputDate(now);
  const hour = now.getHours();
  if (hour < 8) {
    return { date: addDaysToInputDate(today, -1), shift: SHIFT_NIGHT };
  }
  if (hour >= 20) {
    return { date: today, shift: SHIFT_NIGHT };
  }
  return { date: today, shift: SHIFT_DAY };
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

const getBreakDateForShift = (productionDate: string, shift: string, time: string) => {
  const normalized = normalizeShiftCode(shift);
  const hour = Number(time.split(":")[0] || 0);
  if (normalized === SHIFT_NIGHT && hour < 20) return addDaysToInputDate(productionDate, 1);
  return productionDate;
};

const getShiftBreakWindows = (productionDate: string, shift: string) =>
  getShiftBreakItems(shift)
    .map((item) => {
      const startDate = getBreakDateForShift(productionDate, shift, item.start);
      let endDate = getBreakDateForShift(productionDate, shift, item.end);
      const startHour = Number(item.start.split(":")[0] || 0);
      const endHour = Number(item.end.split(":")[0] || 0);
      if (endHour < startHour) endDate = addDaysToInputDate(startDate, 1);
      const startAt = parseLocalDateTime(startDate, item.start);
      const endAt = parseLocalDateTime(endDate, item.end);
      return startAt && endAt ? { ...item, endAt, startAt } : null;
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

const overlapMinutes = (startA: Date, endA: Date, startB: Date, endB: Date) => {
  const start = Math.max(startA.getTime(), startB.getTime());
  const end = Math.min(endA.getTime(), endB.getTime());
  return Math.max(roundNumber((end - start) / 60000), 0);
};

const parseStoredDateTime = (value?: string) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatSharedStatusTime = (value?: string) => {
  const date = parseStoredDateTime(value);
  return date ? formatClock(date) : "-";
};

const getRemoteLogsSignature = (logs: ProductionLog[]) =>
  logs.map((log) => `${log.id}:${log.updatedAt || log.createdAt || ""}`).join("|");

const getMachinesSignature = (items: Machine[]) =>
  items
    .map((machine) =>
      [
        machine.id,
        machine.name,
        machine.capacityUnits || 0,
        machine.capacityMinutes || 0,
        machine.hasStep ? 1 : 0,
        machine.rowCount || 0,
      ].join(":"),
    )
    .join("|");

const isFreshEmployeeMachineStatus = (status: EmployeeMachineStatus) => {
  if (status.status !== "active") return false;
  const expiresAt = parseStoredDateTime(status.expiresAt);
  return !expiresAt || expiresAt.getTime() >= Date.now();
};

const getEmployeeStatusesSignature = (statuses: EmployeeMachineStatus[]) =>
  statuses
    .filter(isFreshEmployeeMachineStatus)
    .sort((a, b) => a.machineId.localeCompare(b.machineId))
    .map((status) =>
      [
        status.machineId,
        status.activeTimerKey || "",
        status.activeTimerLabel || "",
        status.userName || "",
        status.productName || "",
        status.partNo || "",
        status.step || "",
        status.materialOfProduction || "",
        status.goodQty || 0,
        status.ngQty || 0,
        status.testQty || 0,
        status.workMinutes || 0,
        status.timeSlots || 0,
        status.minutesPerSlot || 0,
        status.machineSpeed || 0,
        status.cavityQty || 0,
        status.downtimeMinutes || 0,
        status.normalMinutes || 0,
        status.changeoverMinutes || 0,
        status.inspectionMinutes || 0,
        status.equipmentRepairMinutes || 0,
        status.moldRepairMinutes || 0,
        status.materialChangeMinutes || 0,
        status.emergencyStopMinutes || 0,
        status.meetingMinutes || 0,
        status.plannedStopMinutes || 0,
        status.activeTimerStartedAt || "",
        status.activeTimerBaseAt || "",
        status.activeTimerBaseMinutes || 0,
        status.note || "",
        status.entryUpdatedAt || "",
        status.updatedAt || "",
        status.expiresAt || "",
      ].join(":"),
    )
    .join("|");

const getSharedStatusLiveMinutes = (status: EmployeeMachineStatus | undefined, now = new Date()) => {
  if (!status?.activeTimerKey) return null;
  const baseMinutes = Number(status.activeTimerBaseMinutes || 0);
  const baseAt = status.activeTimerBaseAt || status.updatedAt || status.entryUpdatedAt || "";
  if (!baseAt) return baseMinutes;
  const liveMinutes =
    status.activeTimerKey === "work"
      ? getElapsedShiftWorkMinutes(status.date || getTodayInputValue(), status.shift, now, baseAt)
      : getElapsedWallMinutes(baseAt, now);
  return roundNumber(baseMinutes + liveMinutes);
};

const getElapsedShiftWorkMinutes = (productionDate: string, shift: string, now = new Date(), workStartedAt?: string) => {
  const schedule = getShiftSchedule(productionDate, shift);
  const shiftStart = parseLocalDateTime(schedule.startDate, schedule.startTime);
  const shiftEnd = parseLocalDateTime(schedule.endDate, schedule.endTime);
  if (!shiftStart || !shiftEnd) return 0;

  const actualStart = parseStoredDateTime(workStartedAt);
  if (!actualStart) return 0;
  const workStart = actualStart
    ? new Date(Math.min(Math.max(actualStart.getTime(), shiftStart.getTime()), shiftEnd.getTime()))
    : shiftStart;
  const cappedNow = new Date(Math.min(Math.max(now.getTime(), shiftStart.getTime()), shiftEnd.getTime()));
  const elapsed = Math.max(roundNumber((cappedNow.getTime() - workStart.getTime()) / 60000), 0);
  const breakElapsed = getShiftBreakWindows(schedule.startDate, shift).reduce(
    (sum, item) => sum + overlapMinutes(workStart, cappedNow, item.startAt, item.endAt),
    0,
  );
  return clampWorkMinutes(elapsed - breakElapsed);
};

const getElapsedWallMinutes = (startedAt: string, now = new Date()) => {
  const started = parseStoredDateTime(startedAt);
  if (!started) return 0;
  return Math.max(roundNumber((now.getTime() - started.getTime()) / 60000), 0);
};

const applyEmployeeTimerElapsed = (targetDraft: EntryDraft, timer: EmployeeActiveTimer | null, now = new Date()) => {
  if (!timer) return targetDraft;
  const minutesPerSlot = targetDraft.minutesPerSlot || defaultMinutesPerSlot;
  if (timer.key === "work") {
    const elapsed = getElapsedShiftWorkMinutes(targetDraft.date || getTodayInputValue(), targetDraft.shift, now, timer.startedAt);
    if (elapsed <= 0) return targetDraft;
    const workMinutes = clampWorkMinutes(Number(targetDraft.workMinutes || 0) + elapsed);
    return {
      ...targetDraft,
      timeSlots: slotsFromMinutes(workMinutes, minutesPerSlot),
      workMinutes,
    };
  }

  const elapsed = getElapsedWallMinutes(timer.startedAt, now);
  if (elapsed <= 0) return targetDraft;
  const nextMinutes =
    timer.key === "meetingMinutes"
      ? Math.max(Number(targetDraft[timer.key] || 0) + elapsed, getShiftBreakMinutes(targetDraft.shift))
      : Number(targetDraft[timer.key] || 0) + elapsed;
  return {
    ...targetDraft,
    [timer.key]: roundNumber(nextMinutes),
  };
};

const applyShiftClockRuntime = (targetDraft: EntryDraft, now = new Date(), workStartedAt?: string) => {
  const minutesPerSlot = targetDraft.minutesPerSlot || defaultMinutesPerSlot;
  const workMinutes = getElapsedShiftWorkMinutes(targetDraft.date || getTodayInputValue(), targetDraft.shift, now, workStartedAt);
  return applyAutomaticBreakMinutes({
    ...targetDraft,
    minutesPerSlot,
    shiftStartAt: shiftStartAt(targetDraft.date || getTodayInputValue(), targetDraft.shift),
    shiftEndAt: shiftEndAt(targetDraft.date || getTodayInputValue(), targetDraft.shift),
    timeSlots: slotsFromMinutes(workMinutes, minutesPerSlot),
    workMinutes,
  });
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

const reportMachineLabel = (filters: Filters, machineItems: Machine[]) =>
  filters.machineId ? machineItems.find((machine) => machine.id === filters.machineId)?.name ?? filters.machineId : "ทุกเครื่อง";

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

function openProductionPdfReport(logs: ProductionLog[], filters: Filters, machineItems: Machine[]) {
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
            <p>ช่วงวันที่ผลิต: ${escapeHtml(reportRangeLabel(filters))} | เครื่อง: ${escapeHtml(reportMachineLabel(filters, machineItems))} | กะ: ${escapeHtml(reportShiftLabel(filters))}</p>
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

function uniqueProductValues(items: Array<Pick<ProductMaster, ProductFieldKey>>, key: ProductFieldKey) {
  return Array.from(new Set(items.map((item) => item[key]).filter(Boolean)))
    .sort((a, b) => a.localeCompare(b))
    .slice(0, 100);
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

const productChoiceKey = (item: Pick<ProductionLog | ProductMaster, "machineId" | "productName" | "partNo" | "step">) =>
  sameProductKey(item);

const duplicateEntryLookupKey = (item: Pick<ProductionLog | EntryDraft, "date" | "shift" | "machineId" | "partNo" | "step">) =>
  [
    item.date,
    normalizeShiftCode(item.shift),
    item.machineId,
    normalizeText(item.partNo),
    normalizeText(item.step || "-"),
  ].join("::");

function buildProductChoices(machineId: string, masterProducts: ProductMaster[], logs: ProductionLog[]) {
  const choices = new Map<string, ProductChoice>();
  masterProducts.forEach((product) => {
    choices.set(productChoiceKey(product), { ...product, source: "master" });
  });

  logs
    .filter((log) => log.machineId === machineId && log.productName && log.partNo)
    .sort((a, b) => `${b.date}-${b.updatedAt || b.createdAt}`.localeCompare(`${a.date}-${a.updatedAt || a.createdAt}`))
    .forEach((log) => {
      const key = productChoiceKey(log);
      const existing = choices.get(key);
      if (existing?.source === "history") return;
      const historyChoice: ProductChoice = {
        id: existing?.id || `history-${key}`,
        machineId: log.machineId,
        machineName: log.machineName,
        productName: log.productName,
        partNo: log.partNo,
        step: log.step || "-",
        sampleGoodQty: Number(log.goodQty || existing?.sampleGoodQty || 0),
        sampleNgQty: Number(log.ngQty || existing?.sampleNgQty || 0),
        sampleTestQty: Number(log.testQty || existing?.sampleTestQty || 0),
        latestDate: log.date,
        latestGoodQty: Number(log.goodQty || 0),
        source: existing ? "master" : "history",
      };
      choices.set(key, existing ? { ...existing, latestDate: log.date, latestGoodQty: Number(log.goodQty || 0) } : historyChoice);
    });

  return [...choices.values()].sort((a, b) => {
    const sourceOrder = Number(b.source === "history") - Number(a.source === "history");
    if (sourceOrder !== 0) return sourceOrder;
    const latestOrder = String(b.latestDate || "").localeCompare(String(a.latestDate || ""));
    if (latestOrder !== 0) return latestOrder;
    return `${a.productName} ${a.partNo} ${a.step}`.localeCompare(`${b.productName} ${b.partNo} ${b.step}`);
  });
}

function productChoiceLabel(product: ProductChoice) {
  const parts = [
    product.productName,
    product.partNo,
    `Step ${product.step || "-"}`,
    product.latestDate ? `ล่าสุด ${product.latestDate}` : "",
    product.latestGoodQty ? `Good ${formatNumber(product.latestGoodQty)}` : "",
  ].filter(Boolean);
  return parts.join(" • ");
}

const findMatchingProduct = (
  items: ProductChoice[],
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
  materialOfProduction: log.materialOfProduction || "",
  workMinutes: clampWorkMinutes(Number(log.workMinutes || 0) || Number(log.normalMinutes || 0) + totalDowntime(log)),
  timeSlots: clampTimeSlots(Number(log.timeSlots || 0), Number(log.minutesPerSlot || 0) || defaultMinutesPerSlot),
  minutesPerSlot: Number(log.minutesPerSlot || 0) || defaultMinutesPerSlot,
  machineSpeed: Number(log.machineSpeed || 0),
  cavityQty: Number(log.cavityQty || 0),
  changeoverMinutes: Number(log.changeoverMinutes || 0),
  inspectionMinutes: Number(log.inspectionMinutes || 0),
  equipmentRepairMinutes: Number(log.equipmentRepairMinutes || 0),
  moldRepairMinutes: Number(log.moldRepairMinutes || 0),
  materialChangeMinutes: Number(log.materialChangeMinutes || 0),
  emergencyStopMinutes: Number(log.emergencyStopMinutes || 0),
  meetingMinutes: Math.max(Number(log.meetingMinutes || 0), getShiftBreakMinutes(log.shift)),
  plannedStopMinutes: Number(log.plannedStopMinutes || 0),
  goodQty: Number(log.goodQty || 0),
  ngQty: Number(log.ngQty || 0),
  testQty: Number(log.testQty || 0),
  note: log.note || "",
});

function RequiredMark() {
  return <span className="required-mark" aria-label="required">*</span>;
}

function StampingPressIcon() {
  return (
    <svg aria-hidden="true" className="stamping-press-icon" viewBox="0 0 64 64">
      <path d="M14 52h36" />
      <path d="M18 52V18h28v34" />
      <path d="M22 18V10h20v8" />
      <path d="M24 30h16" />
      <path d="M28 30v12h8V30" />
      <path d="M21 42h22" />
      <path d="M13 24h10" />
      <path d="M41 24h10" />
      <path d="M46 18l6 6-6 6" />
      <path d="M18 18l-6 6 6 6" />
      <circle cx="32" cy="14" r="2" />
    </svg>
  );
}

type StoredEmployeeDraft = {
  draft: EntryDraft;
  entryEvents?: EmployeeDraftEvent[];
  entryStartedAt?: string;
  entryUpdatedAt?: string;
  savedAt: string;
  shiftEndAt: string;
  workStartedAt?: string;
  activeTimer?: EmployeeActiveTimer | null;
};

type EmployeeDraftEvent = {
  at: string;
  id: string;
  label: string;
  value?: string;
  key?: EmployeeTimerKey;
  user?: string;
  reason?: string;
  startedAt?: string;
  endedAt?: string;
  durationMinutes?: number;
};

function App() {
  const [tab, setTab] = useState<TabId>("employeeEntry");
  const [session, setSession] = useState<AppSession | null>(() => loadSession());
  const [localLogs, setLocalLogs] = useState<ProductionLog[]>([]);
  const [remoteLogs, setRemoteLogs] = useState<ProductionLog[]>([]);
  const [status, setStatus] = useState(remoteEnabled ? "พร้อมเชื่อมต่อ Google Sheet" : "โหมดทดลองในเครื่อง");
  const [remoteLoaded, setRemoteLoaded] = useState(!remoteEnabled);
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
  const [machines, setMachines] = useState<Machine[]>(seedMachines);
  const [draft, setDraft] = useState<EntryDraft>(() => createEmptyDraft(defaultMachine, defaultProduct));
  const [employeeClearedMachineAt, setEmployeeClearedMachineAt] = useState<Record<string, string>>({});
  const [editingLog, setEditingLog] = useState<ProductionLog | null>(null);
  const [dateManuallyEdited, setDateManuallyEdited] = useState(false);
  const [successDialog, setSuccessDialog] = useState<{ title: string; message: string } | null>(null);
  const [problemDialog, setProblemDialog] = useState<{ title: string; message: string } | null>(null);
  const [confirmSaveDialog, setConfirmSaveDialog] = useState<{ title: string; message: string } | null>(null);
  const [warnedDuplicateKey, setWarnedDuplicateKey] = useState("");
  const [downtimePressTimes, setDowntimePressTimes] = useState<Partial<Record<DowntimeKey, string>>>({});
  const [employeeDraftSavedAt, setEmployeeDraftSavedAt] = useState("");
  const [employeeDraftActive, setEmployeeDraftActive] = useState(false);
  const [employeeDraftStartedAt, setEmployeeDraftStartedAt] = useState("");
  const [employeeDraftUpdatedAt, setEmployeeDraftUpdatedAt] = useState("");
  const [employeeDraftEvents, setEmployeeDraftEvents] = useState<EmployeeDraftEvent[]>([]);
  const [employeeWorkStartedAt, setEmployeeWorkStartedAt] = useState("");
  const [employeeActiveTimer, setEmployeeActiveTimer] = useState<EmployeeActiveTimer | null>(null);
  const [pendingEmployeeTimer, setPendingEmployeeTimer] = useState<PendingEmployeeTimer | null>(null);
  const [employeeMachineSelected, setEmployeeMachineSelected] = useState(false);
  const [employeeDraftMachineIds, setEmployeeDraftMachineIds] = useState<Set<string>>(() => new Set());
  const [employeeSharedMachineStatuses, setEmployeeSharedMachineStatuses] = useState<EmployeeMachineStatus[]>([]);
  const [employeeReportNow, setEmployeeReportNow] = useState(() => new Date());
  const draftRef = useRef(draft);
  const productDefaultsCache = useRef(new Map<string, ProductDefaults>());
  const autoSubmittingEmployeeDraft = useRef(false);
  const employeeActiveTimerRef = useRef<EmployeeActiveTimer | null>(null);
  const employeeAutoSubmitKeyRef = useRef("");
  const machinesSignatureRef = useRef(getMachinesSignature(seedMachines));
  const remoteLogsSignatureRef = useRef("");
  const employeeStatusesSignatureRef = useRef("");
  const employeeClearedMachineAtRef = useRef<Record<string, string>>({});

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    setLocalLogs(loadLocalLogs());
    if (!remoteEnabled) return;
    fetchRemoteLogs()
      .then((logs) => {
        remoteLogsSignatureRef.current = getRemoteLogsSignature(logs);
        setRemoteLogs(logs);
        setStatus(`เชื่อมต่อ Google Sheet แล้ว (${logs.length} records)`);
      })
      .catch((error) => setStatus(error instanceof Error ? error.message : "เชื่อมต่อ Google Sheet ไม่สำเร็จ"))
      .finally(() => setRemoteLoaded(true));
  }, []);

  useEffect(() => {
    if (!remoteEnabled) return;
    let cancelled = false;
    let refreshing = false;
    const refreshMachines = async () => {
      if (refreshing) return;
      refreshing = true;
      try {
        const nextMachines = await fetchMachines();
        if (cancelled || nextMachines.length === 0) return;
        const signature = getMachinesSignature(nextMachines);
        if (signature !== machinesSignatureRef.current) {
          machinesSignatureRef.current = signature;
          setMachines(nextMachines);
        }
      } catch {
        // Keep bundled machine data if the remote machine sheet is unavailable.
      } finally {
        refreshing = false;
      }
    };
    void refreshMachines();
    const timer = window.setInterval(() => {
      void refreshMachines();
    }, remoteMachinesRefreshMs);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!remoteEnabled) return;
    let cancelled = false;
    let refreshing = false;
    const refreshRemoteLogs = async () => {
      if (refreshing || document.hidden) return;
      refreshing = true;
      try {
        const logs = await fetchRemoteLogs();
        const signature = getRemoteLogsSignature(logs);
        if (!cancelled && signature !== remoteLogsSignatureRef.current) {
          remoteLogsSignatureRef.current = signature;
          setRemoteLogs(logs);
        }
      } catch {
        // Keep the last successful data visible if a realtime refresh fails.
      } finally {
        refreshing = false;
      }
    };
    const timer = window.setInterval(() => {
      void refreshRemoteLogs();
    }, remoteLogsRefreshMs);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!remoteEnabled || tab !== "employeeEntry") return;
    let cancelled = false;
    let refreshing = false;
    const refreshSharedMachineStatuses = async () => {
      if (refreshing || document.hidden) return;
      refreshing = true;
      try {
        const statuses = await fetchEmployeeMachineStatuses();
        const freshStatuses = statuses
          .filter(isFreshEmployeeMachineStatus)
          .filter((status) => {
            const clearedAt = parseStoredDateTime(employeeClearedMachineAt[status.machineId]);
            if (!clearedAt) return true;
            const statusUpdatedAt = parseStoredDateTime(status.updatedAt || status.entryUpdatedAt);
            return Boolean(statusUpdatedAt && statusUpdatedAt.getTime() > clearedAt.getTime());
          });
        const signature = getEmployeeStatusesSignature(freshStatuses);
        if (!cancelled && signature !== employeeStatusesSignatureRef.current) {
          employeeStatusesSignatureRef.current = signature;
          setEmployeeSharedMachineStatuses(freshStatuses);
        }
      } catch {
        // Keep the last known shared machine statuses visible.
      } finally {
        refreshing = false;
      }
    };
    void refreshSharedMachineStatuses();
    const timer = window.setInterval(() => {
      void refreshSharedMachineStatuses();
    }, realtimeRemoteRefreshMs);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [tab, employeeClearedMachineAt]);

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

  useEffect(() => {
    if (tab !== "employeeEntry") return;
    setEmployeeReportNow(new Date());
    const timer = window.setInterval(() => setEmployeeReportNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, [tab]);

  useEffect(() => {
    employeeActiveTimerRef.current = employeeActiveTimer;
  }, [employeeActiveTimer]);

  useEffect(() => {
    if ((tab !== "employeeEntry" && tab !== "entry") || editingLog || employeeDraftActive || employeeWorkStartedAt || employeeActiveTimer) return;
    const currentShift = getCurrentProductionShift(employeeReportNow);
    setDraft((prev) => {
      if (prev.date === currentShift.date && normalizeShiftCode(prev.shift) === currentShift.shift) return prev;
      return {
        ...prev,
        date: currentShift.date,
        meetingMinutes: Math.max(Number(prev.meetingMinutes || 0), getShiftBreakMinutes(currentShift.shift)),
        shift: currentShift.shift,
        shiftEndAt: shiftEndAt(currentShift.date, currentShift.shift),
        shiftStartAt: shiftStartAt(currentShift.date, currentShift.shift),
      };
    });
  }, [editingLog, employeeActiveTimer, employeeDraftActive, employeeReportNow, employeeWorkStartedAt, tab]);

  useEffect(() => {
    if (tab !== "employeeEntry" || editingLog) return;
    const activeTimer = employeeActiveTimerRef.current;
    if (!activeTimer && !employeeWorkStartedAt) return;
    setDraft((prev) => {
      const withActiveDowntime =
        activeTimer && activeTimer.key !== "work" ? applyEmployeeTimerElapsed(prev, activeTimer, employeeReportNow) : prev;
      return employeeWorkStartedAt
        ? applyShiftClockRuntime(withActiveDowntime, employeeReportNow, employeeWorkStartedAt)
        : withActiveDowntime;
    });
    if (activeTimer) {
      setEmployeeActiveTimer({
        ...activeTimer,
        startedAt: employeeReportNow.toISOString(),
        originalStartedAt: activeTimer.originalStartedAt ?? activeTimer.startedAt,
      });
    }
  }, [employeeReportNow, tab, editingLog, employeeWorkStartedAt]);

  useEffect(() => {
    setDraft((prev) => {
      const breakMinutes = getShiftBreakMinutes(prev.shift);
      if (Number(prev.meetingMinutes || 0) >= breakMinutes) return prev;
      return { ...prev, meetingMinutes: breakMinutes };
    });
  }, [draft.shift]);

  const currentMachine = machines.find((machine) => machine.id === draft.machineId) ?? defaultMachine;
  const allLogs = useMemo(
    () => uniqueLogs([...localLogs, ...remoteLogs, ...seedLogs]),
    [localLogs, remoteLogs],
  );
  const duplicateLogsByKey = useMemo(() => {
    const map = new Map<string, ProductionLog[]>();
    for (const log of allLogs) {
      const key = duplicateEntryLookupKey(log);
      const current = map.get(key);
      if (current) current.push(log);
      else map.set(key, [log]);
    }
    return map;
  }, [allLogs]);
  const machineProducts = useMemo(
    () => products.filter((product) => product.machineId === draft.machineId),
    [draft.machineId],
  );
  const machineProductChoices = useMemo(
    () => buildProductChoices(draft.machineId, machineProducts, allLogs),
    [allLogs, draft.machineId, machineProducts],
  );
  const machineProductChoiceByKey = useMemo(
    () => new Map(machineProductChoices.map((product) => [productChoiceKey(product), product])),
    [machineProductChoices],
  );
  const pendingOrderChoices = useMemo(() => machineProductChoices.slice(0, 8), [machineProductChoices]);
  const selectedProductChoiceKey = productChoiceKey(draft);
  const filteredProducts = useMemo(() => {
    const query = deferredProductSearch.trim().toLowerCase();
    if (!query) return machineProductChoices.slice(0, 300);
    return machineProductChoices.filter((product) =>
      productChoiceLabel(product).toLowerCase().includes(query),
    );
  }, [machineProductChoices, deferredProductSearch]);
  const productNameOptions = useMemo(() => uniqueProductValues(filteredProducts, "productName"), [filteredProducts]);
  const productScopedChoices = useMemo(() => {
    const productName = normalizeText(draft.productName);
    if (!productName) return filteredProducts;
    return filteredProducts.filter((product) => normalizeText(product.productName) === productName);
  }, [draft.productName, filteredProducts]);
  const partScopedChoices = useMemo(() => {
    const partNo = normalizeText(draft.partNo);
    if (!partNo) return productScopedChoices;
    return productScopedChoices.filter((product) => normalizeText(product.partNo) === partNo);
  }, [draft.partNo, productScopedChoices]);
  const partNoOptions = useMemo(() => uniqueProductValues(productScopedChoices, "partNo"), [productScopedChoices]);
  const stepOptions = useMemo(() => uniqueProductValues(partScopedChoices, "step"), [partScopedChoices]);
  const productCountByMachineId = useMemo(() => {
    const map = new Map<string, number>();
    for (const product of products) {
      map.set(product.machineId, (map.get(product.machineId) ?? 0) + 1);
    }
    return map;
  }, []);
  const machineLogSummaryByMachineId = useMemo(() => {
    const map = new Map<string, { latestLog?: ProductionLog; logCount: number }>();
    for (const log of allLogs) {
      const current = map.get(log.machineId) ?? { logCount: 0 };
      const currentLatestKey = current.latestLog ? `${current.latestLog.date} ${current.latestLog.updatedAt || current.latestLog.createdAt || ""}` : "";
      const nextKey = `${log.date} ${log.updatedAt || log.createdAt || ""}`;
      map.set(log.machineId, {
        latestLog: !current.latestLog || nextKey.localeCompare(currentLatestKey) > 0 ? log : current.latestLog,
        logCount: current.logCount + 1,
      });
    }
    return map;
  }, [allLogs]);
  const employeeSharedStatusByMachineId = useMemo(
    () => new Map(employeeSharedMachineStatuses.map((status) => [status.machineId, status])),
    [employeeSharedMachineStatuses],
  );
  const currentMachineSharedStatus = employeeSharedStatusByMachineId.get(draft.machineId);
  const currentMachineSharedActivity = getEmployeeMachineActivityLabel(currentMachineSharedStatus);
  const currentMachineSharedTimerKey = currentMachineSharedStatus?.activeTimerKey || "";
  const currentMachineSharedLiveMinutes = getSharedStatusLiveMinutes(currentMachineSharedStatus, employeeReportNow);
  const employeeMachineCards = useMemo(
    () =>
      machines.map((machine) => {
        const sharedStatus = employeeSharedStatusByMachineId.get(machine.id);
        const logSummary = machineLogSummaryByMachineId.get(machine.id);
        const activeTimerKey = sharedStatus?.activeTimerKey || (sharedStatus?.workStartedAt ? "work" : "");
        const timerExcelCode = getEmployeeTimerExcelCode(activeTimerKey);
        const sharedLiveMinutes = getSharedStatusLiveMinutes(sharedStatus, employeeReportNow);
        return {
          activityCode: timerExcelCode,
          hasDraft:
            (draft.machineId === machine.id && employeeDraftActive) ||
            employeeDraftMachineIds.has(machine.id) ||
            employeeSharedStatusByMachineId.has(machine.id),
          machine,
          productCount: productCountByMachineId.get(machine.id) ?? 0,
          sharedStatus,
          sharedLiveMinutes,
          timerToneClass: getEmployeeTimerToneClass(activeTimerKey),
          activityStatus: getEmployeeMachineActivityLabel(sharedStatus),
          latestLog: logSummary?.latestLog,
          logCount: logSummary?.logCount ?? 0,
        };
      }),
    [
      draft.machineId,
      employeeDraftActive,
      employeeDraftMachineIds,
      employeeReportNow,
      employeeSharedStatusByMachineId,
      machineLogSummaryByMachineId,
      productCountByMachineId,
    ],
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
  const liveClockWorkMinutes =
    isEmployeeEntry && employeeWorkStartedAt
      ? getElapsedShiftWorkMinutes(draft.date || getTodayInputValue(), draft.shift, employeeReportNow, employeeWorkStartedAt)
      : draft.workMinutes;
  const computedNormalMinutes = Math.max(liveClockWorkMinutes - totalDraftDowntime, 0);
  const employeeEntryStartedAt = useMemo(
    () =>
      employeeDraftStartedAt
        ? new Date(employeeDraftStartedAt)
        : parseLocalDateTime(draft.recordDate || getTodayInputValue(), draft.recordTime || getCurrentTimeInputValue()),
    [draft.recordDate, draft.recordTime, employeeDraftStartedAt],
  );
  const employeeEntryElapsed = employeeEntryStartedAt
    ? formatElapsedTime(employeeReportNow.getTime() - employeeEntryStartedAt.getTime())
    : "-";
  const employeeWorkStartedDate = useMemo(() => parseStoredDateTime(employeeWorkStartedAt), [employeeWorkStartedAt]);
  const employeeWorkElapsed = employeeWorkStartedDate
    ? formatElapsedTime(employeeReportNow.getTime() - employeeWorkStartedDate.getTime())
    : "-";
  const employeeWorkStartedLabel = employeeWorkStartedDate
    ? `${employeeWorkStartedDate.toLocaleDateString("th-TH")} ${formatClock(employeeWorkStartedDate)}`
    : "ยังไม่กดเริ่มงานจริง";
  const employeeDraftUpdatedLabel = employeeDraftUpdatedAt ? new Date(employeeDraftUpdatedAt).toLocaleString("th-TH") : "-";
  const employeeDraftTimeline = employeeDraftEvents.slice(0, 8);
  const employeeOperatorName = session?.displayName || session?.username || "ไม่ระบุผู้กรอก";
  const employeeTimerEventsByKey = useMemo(() => {
    const grouped = new Map<EmployeeTimerKey, EmployeeDraftEvent[]>();
    employeeDraftEvents.forEach((event) => {
      if (!event.key) return;
      const list = grouped.get(event.key) ?? [];
      list.push(event);
      grouped.set(event.key, list);
    });
    return grouped;
  }, [employeeDraftEvents]);
  const employeeDowntimeDetails = useMemo(
    () =>
      downtimeFields
        .map((field) => ({
          ...field,
          lastPressed: downtimePressTimes[field.key],
          minutes: effectiveDowntimeValue(draft, field.key),
        }))
        .filter((field) => field.minutes > 0 || field.lastPressed),
    [draft, downtimePressTimes],
  );
  const findDuplicateForDraft = (targetDraft: EntryDraft, ignoredId?: string) => {
    if (!targetDraft.date || !targetDraft.shift || !targetDraft.machineId || !normalizeText(targetDraft.partNo)) return null;
    const matches = duplicateLogsByKey.get(duplicateEntryLookupKey(targetDraft));
    return matches?.find((log) => log.id !== ignoredId) ?? null;
  };
  const getDuplicateMessage = (targetDraft: EntryDraft, duplicate: ProductionLog | null) =>
    duplicate
      ? `วันที่ผลิต ${targetDraft.date} กะ ${shiftLabel(targetDraft.shift)} (${shiftWindowLabel(targetDraft.date, targetDraft.shift)}) เครื่อง ${duplicate.machineName} Part No. ${duplicate.partNo} Step ${duplicate.step || "-"} มีการบันทึกแล้ว ห้ามบันทึกซ้ำ`
      : "";
  const duplicateEntry = useMemo(
    () => findDuplicateForDraft(draft, editingLog?.id),
    [duplicateLogsByKey, draft.date, draft.machineId, draft.partNo, draft.shift, draft.step, editingLog?.id],
  );
  const duplicateEntryKey = duplicateEntry
    ? `${draft.date}::${normalizeShiftCode(draft.shift)}::${draft.machineId}::${normalizeText(draft.partNo)}::${normalizeText(draft.step || "-")}`
    : "";
  const duplicateEntryMessage = getDuplicateMessage(draft, duplicateEntry);

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
          timeSlots: slotsFromMinutes(prev.workMinutes, minutesPerSlot),
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

  const recordEmployeeDraftEvent = (
    label: string,
    value?: string,
    details: Partial<Omit<EmployeeDraftEvent, "id" | "label" | "value">> = {},
  ) => {
    if (!isEmployeeEntry) return;
    const now = new Date();
    const { at = now.toISOString(), ...eventDetails } = details;
    const event: EmployeeDraftEvent = {
      at,
      id: `evt-${now.getTime()}-${Math.random().toString(16).slice(2)}`,
      label,
      value,
      ...eventDetails,
      user: eventDetails.user || employeeOperatorName,
    };
    setEmployeeDraftUpdatedAt(event.at);
    setEmployeeDraftEvents((prev) => [event, ...prev].slice(0, 30));
  };

  const clearEmployeeActiveTimer = () => {
    setEmployeeActiveTimer(null);
    employeeActiveTimerRef.current = null;
  };

  const hasEmployeeStoredDraftActivity = (stored: StoredEmployeeDraft) =>
    Boolean(stored.workStartedAt || stored.activeTimer || (Array.isArray(stored.entryEvents) && stored.entryEvents.length > 0));

  const refreshEmployeeDraftMachineIds = () => {
    const ids = machines
      .filter((machine) => {
        const key = getEmployeeDraftStorageKey(machine.id);
        const raw = window.localStorage.getItem(key);
        if (!raw) return false;
        try {
          const stored = JSON.parse(raw) as StoredEmployeeDraft;
          const hasActivity = Boolean(stored?.draft) && hasEmployeeStoredDraftActivity(stored);
          if (!hasActivity) window.localStorage.removeItem(key);
          return hasActivity;
        } catch {
          window.localStorage.removeItem(key);
          return false;
        }
      })
      .map((machine) => machine.id);
    setEmployeeDraftMachineIds(new Set(ids));
  };

  useEffect(() => {
    refreshEmployeeDraftMachineIds();
  }, []);

  const loadEmployeeStoredDraftForMachine = (machineId: string) => {
    const raw = window.localStorage.getItem(getEmployeeDraftStorageKey(machineId));
    if (!raw) return false;
    try {
      const stored = JSON.parse(raw) as StoredEmployeeDraft;
      if (!stored?.draft) return false;
      if (!hasEmployeeStoredDraftActivity(stored)) {
        window.localStorage.removeItem(getEmployeeDraftStorageKey(machineId));
        refreshEmployeeDraftMachineIds();
        return false;
      }
      const savedDate = stored.draft.date || getTodayInputValue();
      const minutesPerSlot = stored.draft.minutesPerSlot || defaultMinutesPerSlot;
      const workMinutes = clampWorkMinutes(stored.draft.workMinutes);
      const timeSlots = slotsFromMinutes(workMinutes, minutesPerSlot);
      const storedBaseDraft = applyAutomaticBreakMinutes({
        ...stored.draft,
        date: savedDate,
        minutesPerSlot,
        shiftStartAt: shiftStartAt(savedDate, stored.draft.shift),
        shiftEndAt: shiftEndAt(savedDate, stored.draft.shift),
        timeSlots,
        workMinutes,
      });
      const storedActiveDraft =
        stored.activeTimer && stored.activeTimer.key !== "work"
          ? applyEmployeeTimerElapsed(storedBaseDraft, stored.activeTimer)
          : storedBaseDraft;
      setDraft(stored.workStartedAt ? applyShiftClockRuntime(storedActiveDraft, new Date(), stored.workStartedAt) : storedActiveDraft);
      setDateManuallyEdited(true);
      setProductSearch("");
      setDowntimePressTimes({});
      setEmployeeDraftActive(true);
      setEmployeeDraftStartedAt(stored.entryStartedAt || parseLocalDateTime(stored.draft.recordDate || getTodayInputValue(), stored.draft.recordTime || getCurrentTimeInputValue())?.toISOString() || "");
      setEmployeeDraftUpdatedAt(stored.entryUpdatedAt || stored.savedAt || "");
      setEmployeeDraftEvents(Array.isArray(stored.entryEvents) ? stored.entryEvents : []);
      setEmployeeWorkStartedAt(stored.workStartedAt || "");
      setEmployeeActiveTimer(stored.activeTimer ?? null);
      employeeActiveTimerRef.current = stored.activeTimer ?? null;
      if (stored.savedAt) setEmployeeDraftSavedAt(new Date(stored.savedAt).toLocaleString("th-TH"));
      publishEmployeeMachineStatus(stored);
      return true;
    } catch {
      window.localStorage.removeItem(getEmployeeDraftStorageKey(machineId));
      refreshEmployeeDraftMachineIds();
      return false;
    }
  };

  const selectMachine = (machineId: string) => {
    const machine = machines.find((item) => item.id === machineId) ?? defaultMachine;
    const nextProduct = products.find((product) => product.machineId === machine.id) ?? defaultProduct;
    recordEmployeeDraftEvent("เปลี่ยนเครื่อง", machine.name);
    setProductSearch("");
    setEmployeeWorkStartedAt("");
    clearEmployeeActiveTimer();
    setDraft((prev) => ({
      ...prev,
      machineId: machine.id,
      ...applyProductToDraft(nextProduct, allLogs, machine),
      workMinutes: clampWorkMinutes(machine.capacityMinutes),
      timeSlots: slotsFromMinutes(machine.capacityMinutes, prev.minutesPerSlot),
    }));
    void loadProductDefaults(nextProduct, machine);
  };

  const openEmployeeMachineEntry = (machineId: string) => {
    if (employeeMachineSelected && employeeDraftActive) writeEmployeeStoredDraft(draft);
    if (!loadEmployeeStoredDraftForMachine(machineId)) {
      const machine = machines.find((item) => item.id === machineId) ?? defaultMachine;
      const nextProduct = products.find((product) => product.machineId === machine.id) ?? defaultProduct;
      const nextDraft = createEmptyDraft(machine, nextProduct);
      const preparedDraft = {
        ...nextDraft,
        ...applyProductToDraft(nextProduct, allLogs, machine),
      };
      refreshEmployeeDraftMachineIds();
      setDraft(preparedDraft);
      setDateManuallyEdited(false);
      setProductSearch("");
      setDowntimePressTimes({});
      setEmployeeDraftSavedAt("");
      setEmployeeDraftActive(false);
      setEmployeeDraftStartedAt("");
      setEmployeeDraftUpdatedAt("");
      setEmployeeDraftEvents([]);
      setEmployeeWorkStartedAt("");
      clearEmployeeActiveTimer();
      void loadProductDefaults(nextProduct, machine);
    }
    setEmployeeMachineSelected(true);
    setProductSearch("");
    setStatus(`เลือกเครื่อง ${machines.find((machine) => machine.id === machineId)?.name ?? machineId} สำหรับกรอกยอดพนักงาน`);
  };

  const updateProductField = (key: ProductFieldKey, value: string) => {
    const matchedProduct = findMatchingProduct(machineProductChoices, key, value, draft);
    const productFieldLabels: Record<ProductFieldKey, string> = {
      partNo: "แก้ Part No.",
      productName: "แก้รุ่น",
      step: "แก้ Step",
    };
    recordEmployeeDraftEvent(productFieldLabels[key], matchedProduct ? `${matchedProduct.productName} / ${matchedProduct.partNo}` : value || "-");

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

  const selectProductChoice = (productKey: string) => {
    const selectedProduct = machineProductChoiceByKey.get(productKey);
    if (!selectedProduct) return;
    recordEmployeeDraftEvent("เลือกประวัติงานเก่า", productChoiceLabel(selectedProduct));
    setProductSearch("");
    setDraft((prev) => ({
      ...prev,
      ...applyProductToDraft(selectedProduct),
    }));
    void loadProductDefaults(selectedProduct, currentMachine);
  };

  const handleNumber = (key: keyof EntryDraft, value: string) => {
    const nextValue = Math.max(Number(value) || 0, 0);
    const numberLabels: Partial<Record<keyof EntryDraft, string>> = {
      cavityQty: "แก้จำนวนคาวิตี้",
      goodQty: "แก้ Good quantity",
      machineSpeed: "แก้ความเร็วเครื่องจักร",
      ngQty: "แก้ NG quantity",
      testQty: "แก้ Test",
    };
    if (numberLabels[key]) recordEmployeeDraftEvent(numberLabels[key], formatRate(nextValue));
    setDraft((prev) => ({ ...prev, [key]: nextValue }));
  };

  const updateWorkMinutes = (value: string) => {
    const workMinutes = clampWorkMinutes(toPositiveNumber(value));
    setDraft((prev) => ({
      ...prev,
      workMinutes,
      timeSlots: prev.minutesPerSlot > 0 ? slotsFromMinutes(workMinutes, prev.minutesPerSlot) : prev.timeSlots,
    }));
  };

  const updateTimeSlots = (value: string) => {
    const rawTimeSlots = toPositiveNumber(value);
    recordEmployeeDraftEvent("แก้จำนวนช่องเวลา", `${formatRate(rawTimeSlots)} ช่อง`);
    setDraft((prev) => ({
      ...prev,
      timeSlots: clampTimeSlots(rawTimeSlots, prev.minutesPerSlot),
    }));
  };

  const updateMinutesPerSlot = (value: string) => {
    const minutesPerSlot = toPositiveNumber(value);
    recordEmployeeDraftEvent("แก้นาที/ช่อง", `${formatRate(minutesPerSlot)} นาที`);
    setDraft((prev) => ({
      ...prev,
      minutesPerSlot,
      timeSlots: slotsFromMinutes(prev.workMinutes, minutesPerSlot),
    }));
  };

  const updateDowntimeSlots = (key: keyof typeof downtimeExcelCodes, value: string) => {
    const slots = toPositiveNumber(value);
    setDraft((prev) => ({
      ...prev,
      [key]:
        key === "meetingMinutes"
          ? Math.max(slotsToMinutes(slots, prev.minutesPerSlot), getShiftBreakMinutes(prev.shift))
          : slotsToMinutes(slots, prev.minutesPerSlot),
    }));
  };

  const pressEmployeeWorkStart = () => {
    const now = new Date();
    const pressedDate = getTodayInputValue();
    const pressedTime = getCurrentTimeInputValue();
    const startedAt = now.toISOString();
    const noteLine = `[${pressedDate} ${pressedTime}] A เริ่มงานจริง`;
    setEmployeeWorkStartedAt(startedAt);
    recordEmployeeDraftEvent("A เริ่มงานจริง", `${pressedDate} ${pressedTime}`);
    setDraft((prev) =>
      applyShiftClockRuntime(
        {
          ...prev,
          note: prev.note.trim() ? `${prev.note.trim()}\n${noteLine}` : noteLine,
        },
        now,
        startedAt,
      ),
    );
    setStatus(`บันทึกเวลาเริ่มงานจริง A เวลา ${pressedTime}`);
  };

  const pressEmployeeDowntime = (key: DowntimeKey) => {
    if (false && !employeeWorkStartedAt) {
      const message = "";
      setStatus(message);
      setProblemDialog({ title: "", message });
      return;
    }
    const pressedDate = getTodayInputValue();
    const pressedTime = getCurrentTimeInputValue();
    const field = downtimeFields.find((item) => item.key === key);
    const minutesPerPress = draft.minutesPerSlot || defaultMinutesPerSlot;
    recordEmployeeDraftEvent(`กด ${field?.label ?? key}`, `+${formatRate(minutesPerPress)} นาที`);
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

  const switchEmployeeTimerRealtime = (key: EmployeeTimerKey, label: string) => {
    if (!canPressEmployeeTimerForRole(session?.role, key)) {
      const message = `Role ${employeeRoleLabel(session?.role || "production")} ไม่มีสิทธิ์กดหัวข้อ ${getEmployeeTimerExcelCode(key) || ""} ${label}`;
      setStatus(message);
      setProblemDialog({ title: "ไม่มีสิทธิ์กดหัวข้อนี้", message });
      return false;
    }
    const activeTimer = employeeActiveTimerRef.current;
    if (activeTimer?.key === key) {
      const message = `${label} กำลังนับเวลาอยู่แล้ว ไม่ต้องกดซ้ำ`;
      setStatus(message);
      setSuccessDialog({ title: "กำลังนับอยู่แล้ว", message });
      return false;
    }
    const now = new Date();
    const pressedDate = getTodayInputValue();
    const pressedTime = getCurrentTimeInputValue();
    const startedAt = now.toISOString();
    setPendingEmployeeTimer({ key, label, pressedDate, pressedTime, startedAt });
    return true;
  };

  const getEmployeeTimerLabel = (key: EmployeeTimerKey) => {
    if (key === "work") return "A การทำงาน / เริ่มงานจริง";
    return downtimeFields.find((field) => field.key === key)?.label ?? key;
  };

  const getEmployeeTimerDuration = (timer: EmployeeActiveTimer, endedAt: Date) =>
    timer.key === "work"
      ? getElapsedShiftWorkMinutes(draft.date || getTodayInputValue(), draft.shift, endedAt, timer.originalStartedAt ?? timer.startedAt)
      : getElapsedWallMinutes(timer.originalStartedAt ?? timer.startedAt, endedAt);

  const confirmEmployeeTimer = () => {
    if (!pendingEmployeeTimer) return;
    const { key, label, pressedDate, pressedTime, startedAt } = pendingEmployeeTimer;
    const activeTimer = employeeActiveTimerRef.current;
    const now = parseStoredDateTime(startedAt) ?? new Date();
    const noteLine = `[${pressedDate} ${pressedTime}] เริ่ม ${label}`;
    if (activeTimer) {
      const previousLabel = getEmployeeTimerLabel(activeTimer.key);
      const previousStartedAt = activeTimer.originalStartedAt ?? activeTimer.startedAt;
      const previousStart = parseStoredDateTime(previousStartedAt);
      const previousStartTime = previousStart ? formatClock(previousStart) : "-";
      recordEmployeeDraftEvent(`จบ ${previousLabel}`, `${previousStartTime} - ${pressedTime}`, {
        at: startedAt,
        key: activeTimer.key,
        reason: previousLabel,
        startedAt: previousStartedAt,
        endedAt: startedAt,
        durationMinutes: getEmployeeTimerDuration(activeTimer, now),
      });
    }
    const nextTimer = { key, startedAt, originalStartedAt: startedAt };
    const workStart = employeeWorkStartedAt || startedAt;
    const finalizedDraft = activeTimer && activeTimer.key !== "work" ? applyEmployeeTimerElapsed(draft, activeTimer, now) : draft;
    const runtimeDraft = applyShiftClockRuntime(finalizedDraft, now, workStart);
    const nextDraft = {
      ...runtimeDraft,
      note: runtimeDraft.note.trim() ? `${runtimeDraft.note.trim()}\n${noteLine}` : noteLine,
    };
    setDraft(nextDraft);
    setEmployeeActiveTimer(nextTimer);
    employeeActiveTimerRef.current = nextTimer;
    const entryStartedAt = employeeDraftActive ? employeeDraftStartedAt || startedAt : startedAt;
    if (!employeeDraftActive) setEmployeeDraftStartedAt(startedAt);
    setEmployeeDraftActive(true);
    setEmployeeDraftUpdatedAt(startedAt);
    recordEmployeeDraftEvent(`เริ่ม ${label}`, `${pressedDate} ${pressedTime}`, {
      at: startedAt,
      key,
      reason: label,
      startedAt,
    });
    if (!employeeWorkStartedAt) setEmployeeWorkStartedAt(startedAt);
    const stored = buildEmployeeStoredDraft(nextDraft, !employeeDraftActive, {
      activeTimer: nextTimer,
      entryStartedAt,
      entryUpdatedAt: startedAt,
      workStartedAt: workStart,
    });
    window.localStorage.setItem(getEmployeeDraftStorageKey(stored.draft.machineId), JSON.stringify(stored));
    publishEmployeeMachineStatus(stored);
    refreshEmployeeDraftMachineIds();
    setEmployeeDraftSavedAt(new Date(stored.savedAt).toLocaleString("th-TH"));
    if (key !== "work") setDowntimePressTimes((prev) => ({ ...prev, [key]: pressedTime }));
    setStatus(`บันทึกเวลา ${label} เริ่ม ${pressedTime}`);
    setPendingEmployeeTimer(null);
    setSuccessDialog({ title: "การกรอกสำเร็จ", message: `บันทึกเวลา ${label} เวลา ${pressedTime} แล้ว` });
  };

  const pressEmployeeWorkStartRealtime = () => {
    switchEmployeeTimerRealtime("work", "A การทำงาน / เริ่มงานจริง");
  };

  const pressEmployeeDowntimeRealtime = (key: DowntimeKey) => {
    if (false && !employeeWorkStartedAt) {
      const message = "";
      setStatus(message);
      setProblemDialog({ title: "", message });
      return;
    }
    const pressedTime = getCurrentTimeInputValue();
    const field = downtimeFields.find((item) => item.key === key);
    switchEmployeeTimerRealtime(key, field?.label ?? key);
  };

  const resetDraft = (options: { clearProduct?: boolean } = {}) => {
    const product = products.find((item) => item.machineId === draft.machineId) ?? defaultProduct;
    const nextDraft = createEmptyDraft(currentMachine, product);
    setDraft(
      options.clearProduct
        ? {
            ...nextDraft,
            cavityQty: 0,
            machineSpeed: 0,
            materialOfProduction: "",
            partNo: "",
            productName: "",
            step: "-",
          }
        : {
            ...nextDraft,
            ...applyProductToDraft(product),
          },
    );
    setEditingLog(null);
    setDateManuallyEdited(false);
    setProductSearch("");
    setDowntimePressTimes({});
    window.localStorage.removeItem(getEmployeeDraftStorageKey(draft.machineId));
    window.localStorage.removeItem(EMPLOYEE_DRAFT_KEY);
    refreshEmployeeDraftMachineIds();
    setEmployeeDraftSavedAt("");
    setEmployeeDraftActive(false);
    setEmployeeDraftStartedAt("");
    setEmployeeDraftUpdatedAt("");
    setEmployeeDraftEvents([]);
    setEmployeeWorkStartedAt("");
    clearEmployeeActiveTimer();
    if (!options.clearProduct) void loadProductDefaults(product, currentMachine);
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

  const getMissingSaveFields = (targetDraft = draft) =>
    [
      { label: "Good quantity / จำนวนงานดี", value: targetDraft.goodQty },
      { label: "ความเร็วเครื่องจักร", value: targetDraft.machineSpeed },
      { label: "จำนวนคาวิตี้", value: targetDraft.cavityQty },
    ]
      .filter((field) => Number(field.value || 0) <= 0)
      .map((field) => field.label);

  const getMissingEmployeeDraftFields = () =>
    getMissingSaveFields(draft).filter((label) => !label.startsWith("Good quantity"));

  const showMissingSaveFields = (missingFields: string[]) => {
    const message = `กรุณากรอก ${missingFields.join(", ")} ให้มากกว่า 0 ก่อนบันทึก`;
    setStatus(message);
    setProblemDialog({ title: "กรอกข้อมูลไม่ครบ", message });
  };

  const clearEmployeeStoredDraft = (machineId = draft.machineId) => {
    const clearedAt = new Date().toISOString();
    employeeClearedMachineAtRef.current = { ...employeeClearedMachineAtRef.current, [machineId]: clearedAt };
    window.localStorage.removeItem(getEmployeeDraftStorageKey(machineId));
    window.localStorage.removeItem(EMPLOYEE_DRAFT_KEY);
    setEmployeeClearedMachineAt((items) => ({ ...items, [machineId]: clearedAt }));
    if (remoteEnabled) {
      setEmployeeSharedMachineStatuses((items) => {
        const next = items.filter((item) => item.machineId !== machineId);
        employeeStatusesSignatureRef.current = getEmployeeStatusesSignature(next);
        return next;
      });
      void clearEmployeeMachineStatus(machineId, clearedAt).catch(() => undefined);
    }
    refreshEmployeeDraftMachineIds();
    if (machineId !== draft.machineId) return;
    setEmployeeDraftSavedAt("");
    setEmployeeDraftActive(false);
    setEmployeeDraftStartedAt("");
    setEmployeeDraftUpdatedAt("");
    setEmployeeDraftEvents([]);
    setEmployeeWorkStartedAt("");
    clearEmployeeActiveTimer();
  };

  const publishEmployeeMachineStatus = (stored: StoredEmployeeDraft) => {
    if (!remoteEnabled) return;
    const clearedAt = parseStoredDateTime(employeeClearedMachineAtRef.current[stored.draft.machineId]);
    const storedUpdatedAt = parseStoredDateTime(stored.savedAt || stored.entryUpdatedAt);
    if (clearedAt && storedUpdatedAt && storedUpdatedAt.getTime() <= clearedAt.getTime()) return;
    const expiresAt = parseStoredDateTime(stored.shiftEndAt || stored.draft.shiftEndAt)?.toISOString() || stored.shiftEndAt || stored.draft.shiftEndAt || "";
    const machineName = machines.find((machine) => machine.id === stored.draft.machineId)?.name || stored.draft.machineId;
    const downtimeMinutes = totalDowntime(stored.draft);
    const activeTimerStartedAt = stored.activeTimer?.originalStartedAt || stored.activeTimer?.startedAt || "";
    const activeTimerBaseAt = stored.activeTimer ? stored.savedAt : "";
    const activeTimerBaseMinutes = stored.activeTimer
      ? stored.activeTimer.key === "work"
        ? Number(stored.draft.workMinutes || 0)
        : Number(stored.draft[stored.activeTimer.key as DowntimeKey] || 0)
      : 0;
    const status: EmployeeMachineStatus = {
      machineId: stored.draft.machineId,
      machineName,
      date: stored.draft.date,
      shift: stored.draft.shift,
      productName: stored.draft.productName,
      partNo: stored.draft.partNo,
      step: stored.draft.step || "-",
      materialOfProduction: stored.draft.materialOfProduction || "",
      userName: session?.displayName || session?.username || "",
      goodQty: Number(stored.draft.goodQty || 0),
      ngQty: Number(stored.draft.ngQty || 0),
      testQty: Number(stored.draft.testQty || 0),
      workMinutes: Number(stored.draft.workMinutes || 0),
      timeSlots: Number(stored.draft.timeSlots || 0),
      minutesPerSlot: Number(stored.draft.minutesPerSlot || 0),
      machineSpeed: Number(stored.draft.machineSpeed || 0),
      cavityQty: Number(stored.draft.cavityQty || 0),
      downtimeMinutes,
      normalMinutes: Math.max(Number(stored.draft.workMinutes || 0) - downtimeMinutes, 0),
      changeoverMinutes: Number(stored.draft.changeoverMinutes || 0),
      inspectionMinutes: Number(stored.draft.inspectionMinutes || 0),
      equipmentRepairMinutes: Number(stored.draft.equipmentRepairMinutes || 0),
      moldRepairMinutes: Number(stored.draft.moldRepairMinutes || 0),
      materialChangeMinutes: Number(stored.draft.materialChangeMinutes || 0),
      emergencyStopMinutes: Number(stored.draft.emergencyStopMinutes || 0),
      meetingMinutes: Number(stored.draft.meetingMinutes || 0),
      plannedStopMinutes: Number(stored.draft.plannedStopMinutes || 0),
      note: stored.draft.note || "",
      activeTimerKey: stored.activeTimer?.key || "",
      activeTimerLabel: stored.activeTimer ? getEmployeeTimerLabel(stored.activeTimer.key) : "",
      activeTimerStartedAt,
      activeTimerBaseAt,
      activeTimerBaseMinutes,
      workStartedAt: stored.workStartedAt || "",
      entryStartedAt: stored.entryStartedAt || "",
      status: "active",
      entryUpdatedAt: stored.entryUpdatedAt || stored.savedAt,
      updatedAt: stored.savedAt,
      expiresAt,
    };
    setEmployeeSharedMachineStatuses((items) => {
      const next = [status, ...items.filter((item) => item.machineId !== status.machineId)].filter(isFreshEmployeeMachineStatus);
      employeeStatusesSignatureRef.current = getEmployeeStatusesSignature(next);
      return next;
    });
    void upsertEmployeeMachineStatus(status).catch(() => undefined);
  };

  const buildEmployeeStoredDraft = (
    targetDraft: EntryDraft,
    freshRecordTime = false,
    options: {
      activeTimer?: EmployeeActiveTimer | null;
      entryEvents?: EmployeeDraftEvent[];
      entryStartedAt?: string;
      entryUpdatedAt?: string;
      workStartedAt?: string;
    } = {},
  ): StoredEmployeeDraft => {
    const now = new Date();
    const activeTimer = options.activeTimer !== undefined ? options.activeTimer : employeeActiveTimerRef.current;
    const workStartedAt = options.workStartedAt !== undefined ? options.workStartedAt : employeeWorkStartedAt;
    const activeDraft = activeTimer && activeTimer.key !== "work" ? applyEmployeeTimerElapsed(targetDraft, activeTimer, now) : targetDraft;
    const clockDraft = workStartedAt ? applyShiftClockRuntime(activeDraft, now, workStartedAt) : activeDraft;
    const savedDate = clockDraft.date || getTodayInputValue();
    const recordDate = freshRecordTime ? getTodayInputValue() : clockDraft.recordDate || getTodayInputValue();
    const recordTime = freshRecordTime ? getCurrentTimeInputValue() : clockDraft.recordTime || getCurrentTimeInputValue();
    const minutesPerSlot = clockDraft.minutesPerSlot || defaultMinutesPerSlot;
    const workMinutes = clampWorkMinutes(clockDraft.workMinutes);
    const timeSlots = slotsFromMinutes(workMinutes, minutesPerSlot);
    const nextDraft = applyAutomaticBreakMinutes({
      ...clockDraft,
      date: savedDate,
      minutesPerSlot,
      recordDate,
      recordTime,
      shiftStartAt: shiftStartAt(savedDate, clockDraft.shift),
      shiftEndAt: shiftEndAt(savedDate, clockDraft.shift),
      timeSlots,
      workMinutes,
    });
    const entryStartedAt =
      options.entryStartedAt ||
      ((freshRecordTime ? now : employeeDraftStartedAt ? new Date(employeeDraftStartedAt) : parseLocalDateTime(recordDate, recordTime))?.toISOString() ??
        now.toISOString());
    const entryUpdatedAt = options.entryUpdatedAt || employeeDraftUpdatedAt || now.toISOString();
    return {
      draft: nextDraft,
      entryEvents: options.entryEvents || employeeDraftEvents,
      entryStartedAt,
      entryUpdatedAt,
      savedAt: now.toISOString(),
      shiftEndAt: nextDraft.shiftEndAt,
      workStartedAt,
      activeTimer: activeTimer ? { ...activeTimer, startedAt: now.toISOString() } : null,
    };
  };

  const writeEmployeeStoredDraft = (targetDraft: EntryDraft, freshRecordTime = false) => {
    const stored = buildEmployeeStoredDraft(targetDraft, freshRecordTime);
    window.localStorage.setItem(getEmployeeDraftStorageKey(stored.draft.machineId), JSON.stringify(stored));
    publishEmployeeMachineStatus(stored);
    refreshEmployeeDraftMachineIds();
    setEmployeeDraftActive(true);
    setEmployeeDraftStartedAt(stored.entryStartedAt || "");
    setEmployeeDraftUpdatedAt(stored.entryUpdatedAt || "");
    setEmployeeDraftSavedAt(new Date(stored.savedAt).toLocaleString("th-TH"));
    return stored;
  };

  useEffect(() => {
    if (!remoteEnabled || tab !== "employeeEntry" || editingLog || !employeeMachineSelected) return;
    if (!employeeDraftActive && !employeeWorkStartedAt && !employeeActiveTimerRef.current) return;
    const publishLiveStatus = () => {
      if (autoSubmittingEmployeeDraft.current) return;
      const nowIso = new Date().toISOString();
      const stored = buildEmployeeStoredDraft(draftRef.current, false, { entryUpdatedAt: nowIso });
      window.localStorage.setItem(getEmployeeDraftStorageKey(stored.draft.machineId), JSON.stringify(stored));
      publishEmployeeMachineStatus(stored);
    };
    const timer = window.setInterval(publishLiveStatus, 5000);
    publishLiveStatus();
    return () => window.clearInterval(timer);
  }, [editingLog, employeeDraftActive, employeeMachineSelected, employeeWorkStartedAt, employeeActiveTimer?.key, tab]);

  const saveEmployeeDraftLocally = () => {
    if (!isEmployeeEntry) return;
    if (editingLog) {
      setProblemDialog({ title: "ยังบันทึกร่างไม่ได้", message: "รายการที่กำลังแก้ไขให้กดยืนยันบันทึกโดยตรง" });
      return;
    }
    const missingFields = getMissingEmployeeDraftFields();
    if (missingFields.length > 0) {
      showMissingSaveFields(missingFields);
      return;
    }
    recordEmployeeDraftEvent(employeeDraftActive ? "อัปเดตร่าง" : "เริ่มบันทึกร่าง", employeeDraftActive ? "แก้ไขต่อ" : "เวลาเริ่มงาน");
    const stored = writeEmployeeStoredDraft(draft, !employeeDraftActive);
    setDraft(stored.draft);
    const savedAt = new Date(stored.savedAt).toLocaleString("th-TH");
    setStatus(`บันทึกร่างไว้แล้ว ยังไม่ส่งเข้าระบบ (${savedAt})`);
    setSuccessDialog({ title: "บันทึกร่างไว้แล้ว", message: "ร่างนี้ยังไม่ส่งเข้าระบบ จนกว่าจะกดส่งยอดบันทึก หรือระบบส่งให้อัตโนมัติหลังจบกะ" });
  };

  const submitProductionDraft = async (targetDraft: EntryDraft, options: { autoSubmit?: boolean; editingLog?: ProductionLog | null; resetAfterSave?: boolean } = {}) => {
    const shouldValidateBeforeSave = !options.autoSubmit;
    const missingFields = shouldValidateBeforeSave ? getMissingSaveFields(targetDraft) : [];
    if (missingFields.length > 0) {
      showMissingSaveFields(missingFields);
      return false;
    }
    const machine = machines.find((item) => item.id === targetDraft.machineId) ?? currentMachine;
    const shouldUpdate = Boolean(options.editingLog);
    const duplicate = shouldValidateBeforeSave ? findDuplicateForDraft(targetDraft, options.editingLog?.id) : null;
    const duplicateMessage = getDuplicateMessage(targetDraft, duplicate);
    if (duplicateMessage) {
      setStatus(duplicateMessage);
      setProblemDialog({ title: "พบรายการซ้ำ", message: duplicateMessage });
      return false;
    }
    const savedDate = targetDraft.date || getTodayInputValue();
    const savedRecordDate = shouldUpdate ? getDraftRecordDate(options.editingLog) : getDraftRecordDate(targetDraft);
    const savedRecordTime = shouldUpdate ? getDraftRecordTime(options.editingLog) : getDraftRecordTime(targetDraft);
    const savedMinutesPerSlot = targetDraft.minutesPerSlot || defaultMinutesPerSlot;
    const savedWorkMinutes = clampWorkMinutes(targetDraft.workMinutes);
    const savedTimeSlots = slotsFromMinutes(savedWorkMinutes, savedMinutesPerSlot);
    const savedMeetingMinutes = Math.max(Number(targetDraft.meetingMinutes || 0), getShiftBreakMinutes(targetDraft.shift));
    const log: ProductionLog = {
      ...targetDraft,
      meetingMinutes: savedMeetingMinutes,
      minutesPerSlot: savedMinutesPerSlot,
      recordDate: savedRecordDate,
      recordTime: savedRecordTime,
      date: savedDate,
      shiftStartAt: shiftStartAt(savedDate, targetDraft.shift),
      shiftEndAt: shiftEndAt(savedDate, targetDraft.shift),
      timeSlots: savedTimeSlots,
      workMinutes: savedWorkMinutes,
      id: options.editingLog?.id ?? makeLogId(),
      machineName: machine.name,
      normalMinutes: Math.max(savedWorkMinutes - totalDowntime({ ...targetDraft, meetingMinutes: savedMeetingMinutes }), 0),
      createdAt: options.editingLog?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: remoteEnabled ? "google-sheet" : "local",
    };

    setSaving(true);
    try {
      const saved = remoteEnabled ? (shouldUpdate ? await updateRemoteLog(log) : await appendRemoteLog(log)) : log;
      const next = shouldUpdate ? upsertLocalLog(saved) : appendLocalLog(saved);
      const successMessage = options.autoSubmit
        ? `ส่งยอดอัตโนมัติหลังจบกะแล้ว: ${saved.machineName} วันที่ ${saved.date}`
        : shouldUpdate
          ? `บันทึกการแก้ไขแล้ว: ${saved.machineName} วันที่ ${saved.date}`
          : `บันทึกยอดแล้ว: ${saved.machineName} วันที่ ${saved.date} (ลง Google Sheet และชีตเครื่องแล้ว)`;
      setLocalLogs(next);
      if (remoteEnabled) {
        fetchRemoteLogs()
          .then((logs) => setRemoteLogs(logs))
          .catch(() => setRemoteLogs((logs) => uniqueLogs([saved, ...logs])));
      }
      setStatus(successMessage);
      setSuccessDialog({ title: options.autoSubmit ? "ส่งยอดอัตโนมัติแล้ว" : "บันทึกเสร็จแล้ว", message: successMessage });
      if (!shouldUpdate) clearEmployeeStoredDraft(saved.machineId);
      if (options.resetAfterSave !== false) resetDraft({ clearProduct: !shouldUpdate && isEmployeeEntry });
      return true;
    } catch (error) {
      const localLog = { ...log, source: "local" as const };
      const next = shouldUpdate ? upsertLocalLog(localLog) : appendLocalLog(localLog);
      setLocalLogs(next);
      if (!shouldUpdate) clearEmployeeStoredDraft(localLog.machineId);
      if (options.resetAfterSave !== false) resetDraft({ clearProduct: !shouldUpdate && isEmployeeEntry });
      setStatus(error instanceof Error ? `${error.message} - เก็บสำรองในเครื่องแล้ว` : "เก็บสำรองในเครื่องแล้ว");
      return true;
    } finally {
      setSaving(false);
    }
  };

  const finalizeEmployeeDraftForSubmit = (
    targetDraft: EntryDraft,
    activeTimer: EmployeeActiveTimer | null,
    finalAt: Date,
    reason = "สิ้นสุดการผลิต / ส่งยอดบันทึก",
    workStartedAt = employeeWorkStartedAt,
  ) => {
    const endDate = formatInputDate(finalAt);
    const endTime = formatInputTime(finalAt);
    const activeDraft = activeTimer && activeTimer.key !== "work" ? applyEmployeeTimerElapsed(targetDraft, activeTimer, finalAt) : targetDraft;
    const finalizedDraft = workStartedAt ? applyShiftClockRuntime(activeDraft, finalAt, workStartedAt) : activeDraft;
    const endNoteLine = `[${endDate} ${endTime}] ${reason}`;
    return {
      draft: {
        ...finalizedDraft,
        note: finalizedDraft.note.trim() ? `${finalizedDraft.note.trim()}\n${endNoteLine}` : endNoteLine,
      },
      endDate,
      endTime,
    };
  };

  const autoSubmitStoredEmployeeDraft = async () => {
    if (autoSubmittingEmployeeDraft.current) return;
    const draftKeys = machines.map((machine) => getEmployeeDraftStorageKey(machine.id));
    for (const draftKey of draftKeys) {
      const raw = window.localStorage.getItem(draftKey);
      if (!raw) continue;
      try {
      const stored = JSON.parse(raw) as StoredEmployeeDraft;
        if (!stored?.draft || !stored.shiftEndAt) continue;
      const finalAt = new Date(stored.shiftEndAt);
        if (Date.now() < finalAt.getTime()) continue;
      autoSubmittingEmployeeDraft.current = true;
      const finalized = finalizeEmployeeDraftForSubmit(
        stored.draft,
        stored.activeTimer ?? null,
        finalAt,
        "ตัดกะอัตโนมัติ / ส่งยอดบันทึก",
        stored.workStartedAt || "",
      );
      await submitProductionDraft(finalized.draft, {
        autoSubmit: true,
        resetAfterSave: stored.draft.machineId === draft.machineId,
      });
      } catch {
        window.localStorage.removeItem(draftKey);
        refreshEmployeeDraftMachineIds();
      } finally {
        autoSubmittingEmployeeDraft.current = false;
      }
    }
  };

  const autoSubmitCurrentEmployeeDraft = async () => {
    if (!isEmployeeEntry || editingLog || autoSubmittingEmployeeDraft.current) return;
    const activeTimer = employeeActiveTimerRef.current;
    if (!employeeDraftActive && !activeTimer && !employeeWorkStartedAt) return;
    const productionDate = draft.date || getTodayInputValue();
    const finalAt = parseStoredDateTime(shiftEndAt(productionDate, draft.shift));
    if (!finalAt || Date.now() < finalAt.getTime()) return;

    const autoKey = `${productionDate}|${normalizeShiftCode(draft.shift)}|${draft.machineId}|${draft.partNo}|${draft.step}|${finalAt.toISOString()}`;
    if (employeeAutoSubmitKeyRef.current === autoKey) return;
    employeeAutoSubmitKeyRef.current = autoKey;
    autoSubmittingEmployeeDraft.current = true;
    try {
      const finalized = finalizeEmployeeDraftForSubmit(draft, activeTimer, finalAt, "ตัดกะอัตโนมัติ / ส่งยอดบันทึก");
      setDraft(finalized.draft);
      setEmployeeDraftUpdatedAt(finalAt.toISOString());
      recordEmployeeDraftEvent("ตัดกะอัตโนมัติ / ส่งยอดบันทึก", `${finalized.endDate} ${finalized.endTime}`);
      const saved = await submitProductionDraft(finalized.draft, { autoSubmit: true, resetAfterSave: true });
      if (saved) {
        clearEmployeeActiveTimer();
      } else {
        employeeAutoSubmitKeyRef.current = "";
      }
    } finally {
      autoSubmittingEmployeeDraft.current = false;
    }
  };

  useEffect(() => {
    const raw = window.localStorage.getItem(EMPLOYEE_DRAFT_KEY);
    if (raw) {
      try {
        const stored = JSON.parse(raw) as StoredEmployeeDraft;
        if (stored?.draft) {
          window.localStorage.setItem(getEmployeeDraftStorageKey(stored.draft.machineId), JSON.stringify(stored));
          refreshEmployeeDraftMachineIds();
        }
        window.localStorage.removeItem(EMPLOYEE_DRAFT_KEY);
      } catch {
        window.localStorage.removeItem(EMPLOYEE_DRAFT_KEY);
        setEmployeeDraftActive(false);
        setEmployeeDraftStartedAt("");
        setEmployeeDraftUpdatedAt("");
        setEmployeeDraftEvents([]);
      }
    }
  }, []);

  useEffect(() => {
    const hasDraftChangeActivity = employeeDraftActive || employeeDraftEvents.length > 0 || Boolean(employeeWorkStartedAt) || Boolean(employeeActiveTimer);
    if (!isEmployeeEntry || !hasDraftChangeActivity || editingLog || autoSubmittingEmployeeDraft.current) return;
    const timer = window.setTimeout(() => {
      writeEmployeeStoredDraft(draft);
    }, 800);
    return () => window.clearTimeout(timer);
  }, [draft, editingLog, employeeActiveTimer, employeeDraftActive, employeeDraftEvents, employeeDraftUpdatedAt, employeeWorkStartedAt, isEmployeeEntry]);

  useEffect(() => {
    if (!remoteLoaded) return;
    void autoSubmitCurrentEmployeeDraft();
    void autoSubmitStoredEmployeeDraft();
    const timer = window.setInterval(() => {
      void autoSubmitCurrentEmployeeDraft();
      void autoSubmitStoredEmployeeDraft();
    }, 30000);
    return () => window.clearInterval(timer);
  }, [allLogs, draft, editingLog, employeeDraftActive, employeeWorkStartedAt, isEmployeeEntry, remoteLoaded]);

  const saveDraft = async () => {
    setConfirmSaveDialog(null);
    const now = new Date();
    const activeTimer = employeeActiveTimerRef.current;
    const finalized = isEmployeeEntry && !editingLog ? finalizeEmployeeDraftForSubmit(draft, activeTimer, now) : null;
    const targetDraft =
      isEmployeeEntry && !editingLog
        ? finalized?.draft ?? draft
        : draft;
    if (targetDraft !== draft) setDraft(targetDraft);
    if (isEmployeeEntry && !editingLog) {
      setEmployeeDraftUpdatedAt(now.toISOString());
      recordEmployeeDraftEvent("สิ้นสุดการผลิต / ส่งยอดบันทึก", `${finalized?.endDate ?? formatInputDate(now)} ${finalized?.endTime ?? formatInputTime(now)}`);
    }
    if (isEmployeeEntry && !editingLog) autoSubmittingEmployeeDraft.current = true;
    try {
      const saved = await submitProductionDraft(targetDraft, { editingLog, resetAfterSave: true });
      if (saved && isEmployeeEntry && !editingLog) {
        clearEmployeeActiveTimer();
        setEmployeeWorkStartedAt("");
      } else if (!saved && isEmployeeEntry && !editingLog && activeTimer) {
        const nextTimer = { ...activeTimer, startedAt: now.toISOString() };
        setEmployeeActiveTimer(nextTimer);
        employeeActiveTimerRef.current = nextTimer;
      }
    } finally {
      if (isEmployeeEntry && !editingLog) autoSubmittingEmployeeDraft.current = false;
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
    const opened = openProductionPdfReport(activeLogs, activeFilters, machines);
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

  const getEmployeeTimerEventMinutes = (event: EmployeeDraftEvent) => {
    const activeTimer = employeeActiveTimer;
    if (typeof event.durationMinutes === "number") return event.durationMinutes;
    const activeStartedAt = activeTimer?.originalStartedAt ?? activeTimer?.startedAt;
    if (!event.startedAt || !activeTimer || activeTimer.key !== event.key || activeStartedAt !== event.startedAt) return null;
    if (event.key === "work") {
      return getElapsedShiftWorkMinutes(draft.date || getTodayInputValue(), draft.shift, employeeReportNow, event.startedAt);
    }
    return getElapsedWallMinutes(event.startedAt, employeeReportNow);
  };

  const getEmployeeTimerEventRange = (event: EmployeeDraftEvent) => {
    const activeTimer = employeeActiveTimer;
    const activeStartedAt = activeTimer?.originalStartedAt ?? activeTimer?.startedAt;
    const started = parseStoredDateTime(event.startedAt);
    const ended = parseStoredDateTime(event.endedAt);
    if (started && ended) return `${formatClock(started)} - ${formatClock(ended)}`;
    if (started && activeTimer && activeTimer.key === event.key && activeStartedAt === event.startedAt) {
      return `${formatClock(started)} - กำลังนับ`;
    }
    return new Date(event.at).toLocaleTimeString("th-TH");
  };

  const renderEmployeeTimerHistory = (key: EmployeeTimerKey) => {
    const activeTimer = employeeActiveTimer;
    const activeStartedAt = activeTimer?.originalStartedAt ?? activeTimer?.startedAt;
    const events = (employeeTimerEventsByKey.get(key) ?? [])
      .filter((event) => Boolean(event.endedAt) || (activeTimer?.key === key && activeStartedAt === event.startedAt))
      .slice(0, 4);
    if (events.length === 0) return null;
    return (
      <div className="employee-timer-history">
        {events.map((event) => {
          const minutes = getEmployeeTimerEventMinutes(event);
          const currentStartedAt = employeeActiveTimer?.originalStartedAt ?? employeeActiveTimer?.startedAt;
          const isActive = employeeActiveTimer?.key === key && currentStartedAt === event.startedAt && !event.endedAt;
          return (
            <div className={`employee-timer-history-item ${isActive ? "is-active" : ""}`} key={event.id}>
              <div className="employee-timer-history-range">
                <b>ช่วงเวลา: {getEmployeeTimerEventRange(event)}</b>
                {minutes !== null && <strong>ใช้เวลา {formatDurationMinutes(minutes)}</strong>}
              </div>
              <span>ผู้กรอก: {event.user || employeeOperatorName}</span>
              <span>เหตุผล: {event.reason || event.label}</span>
            </div>
          );
        })}
      </div>
    );
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
          <button
            className={`employee-entry ${tab === "employeeEntry" ? "active" : ""}`}
            onClick={() => {
              setTab("employeeEntry");
              setEmployeeMachineSelected(false);
            }}
            type="button"
          >
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

        {tab === "employeeEntry" && !employeeMachineSelected && (
          <section className="employee-machine-menu">
            <div className="machine-menu-heading">
              <div>
                <p className="eyebrow">Employee entry</p>
                <h2>เลือกเครื่องจักรสำหรับกรอกยอด</h2>
              </div>
              <span>{formatNumber(machines.length)} เครื่อง</span>
            </div>
            <div className="machine-icon-grid">
              {employeeMachineCards.map(({ activityCode, activityStatus, hasDraft, latestLog, logCount, machine, productCount, sharedLiveMinutes, sharedStatus, timerToneClass }) => (
                <button
                  className={`machine-icon-card ${hasDraft ? `active-draft ${timerToneClass}` : ""}`}
                  key={machine.id}
                  onClick={() => openEmployeeMachineEntry(machine.id)}
                  type="button"
                >
                  <span className="machine-icon-symbol">
                    <StampingPressIcon />
                  </span>
                  {hasDraft && activityStatus && (
                    <span className={`machine-activity-badge ${timerToneClass}`}>
                      {activityCode && <b>{activityCode}</b>}
                      <span>{activityStatus.replace(/^[A-Z]\s*/, "")}</span>
                    </span>
                  )}
                  <span className="machine-card-main">
                    <strong>{machine.name}</strong>
                    <small>
                      {formatNumber(productCount)} รุ่น / {formatNumber(logCount)} รายการ
                    </small>
                  </span>
                  {hasDraft && <span className="machine-draft-badge">มีร่างค้าง</span>}
                  {sharedStatus && (
                    <span className="machine-shared-status">
                      <strong>{activityStatus || "กำลังกรอก"}</strong>
                      <b>{sharedStatus.userName ? `ผู้กรอก: ${sharedStatus.userName}` : "มีผู้ใช้งานกำลังกรอก"}</b>
                      <small>{sharedStatus.productName || "-"} / {sharedStatus.partNo || "-"}</small>
                      <small>
                        {sharedStatus.activeTimerLabel
                          ? `กำลังนับ: ${sharedStatus.activeTimerLabel}`
                          : `อัปเดตล่าสุด: ${formatSharedStatusTime(sharedStatus.entryUpdatedAt || sharedStatus.updatedAt)}`}
                      </small>
                      <small>
                        Good {formatNumber(sharedStatus.goodQty || 0)} · NG {formatNumber(sharedStatus.ngQty || 0)} · DT {formatRate(sharedStatus.downtimeMinutes || 0)} นาที
                      </small>
                      {sharedStatus.activeTimerLabel && sharedLiveMinutes !== null && <small>ใช้เวลา {formatDurationMinutes(sharedLiveMinutes)}</small>}
                      <small>
                        Speed {formatRate(sharedStatus.machineSpeed || 0)} · Cavity {formatNumber(sharedStatus.cavityQty || 0)} · Material{" "}
                        {sharedStatus.materialOfProduction || "-"}
                      </small>
                    </span>
                  )}
                  <span className="machine-card-detail">
                    {latestLog ? `${latestLog.date} · ${shiftLabel(latestLog.shift)} · Good ${formatNumber(latestLog.goodQty)}` : "ยังไม่มีประวัติล่าสุด"}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {((tab === "employeeEntry" && employeeMachineSelected) || tab === "entry") && (
          <section className="entry-layout">
            <form className="entry-form" onSubmit={submit}>
              <div className="section-title">
                <Gauge size={20} />
                <h2>{editingLog ? "แก้ไขยอดผลิต" : "กรอกยอดผลิต"}</h2>
                {isEmployeeEntry && !editingLog && (
                  <button className="ghost-button machine-menu-back" onClick={() => setEmployeeMachineSelected(false)} type="button">
                    <ArrowLeft size={16} /> เลือกเครื่อง
                  </button>
                )}
              </div>

              {isEmployeeEntry && (
                <div className="selected-machine-lock" aria-live="polite">
                  <div className="selected-machine-main">
                    <span>เครื่อง / ไลน์ที่เลือก</span>
                    <strong>{currentMachine.name}</strong>
                    <small>ล็อกเครื่องนี้แล้ว หากต้องการเปลี่ยนให้กดปุ่มเลือกเครื่อง</small>
                  </div>
                  <div className="runtime-current-clock selected-machine-clock">
                    <span>เวลาปัจจุบัน</span>
                    <strong>{formatClock(employeeReportNow)}</strong>
                  </div>
                </div>
              )}

              <div className="form-grid entry-main-grid">
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
                    aria-readonly="true"
                    readOnly
                    tabIndex={-1}
                    value={draft.date}
                    type="text"
                  />
                </label>
                <label>
                  <span className="label-text">กะ <RequiredMark /></span>
                  <select
                    disabled
                    required
                    value={draft.shift}
                  onChange={(event) => {
                    const shift = event.target.value;
                    recordEmployeeDraftEvent("เปลี่ยนกะ", shiftLabel(shift));
                    setEmployeeWorkStartedAt("");
                    clearEmployeeActiveTimer();
                    setDraft({
                      ...draft,
                        meetingMinutes: Math.max(Number(draft.meetingMinutes || 0), getShiftBreakMinutes(shift)),
                        shift,
                        shiftEndAt: shiftEndAt(draft.date, shift),
                        shiftStartAt: shiftStartAt(draft.date, shift),
                      });
                    }}
                  >
                    {orderedShiftOptions.map((shift) => (
                      <option key={shift} value={shift}>
                        {shiftLabel(shift)}
                      </option>
                    ))}
                  </select>
                  <small className="field-help">เวลาทำงาน: {shiftWindowLabel(draft.date, draft.shift)} | พัก H: {getShiftBreakLabel(draft.shift)}</small>
                </label>
                {!isEmployeeEntry && (
                  <label>
                    <span className="label-text">เครื่อง / ไลน์ <RequiredMark /></span>
                    <select
                      required
                      value={draft.machineId}
                      onChange={(event) => selectMachine(event.target.value)}
                    >
                      {machines.map((machine) => (
                        <option key={machine.id} value={machine.id}>
                          {machine.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <div className="pending-order-panel" role="status" aria-live="polite">
                  <div className="pending-order-header">
                    <div>
                      <span>ORDER QUEUE</span>
                      <strong>Order ที่รอผลิต / งานที่ต้องผลิต</strong>
                    </div>
                    <b>{formatNumber(pendingOrderChoices.length)} รายการ</b>
                  </div>
                  {pendingOrderChoices.length > 0 ? (
                    <div className="pending-order-list">
                      {pendingOrderChoices.map((product, index) => {
                        const choiceKey = productChoiceKey(product);
                        const isSelected = choiceKey === selectedProductChoiceKey;
                        return (
                          <button
                            className={`pending-order-item ${isSelected ? "selected" : ""}`}
                            key={choiceKey}
                            onClick={() => selectProductChoice(choiceKey)}
                            type="button"
                          >
                            <span className="pending-order-rank">#{index + 1}</span>
                            <span className="pending-order-main">
                              <strong>{product.productName}</strong>
                              <small>Part No. {product.partNo} • Step {product.step || "-"}</small>
                            </span>
                            <span className="pending-order-meta">
                              {product.latestDate ? `ล่าสุด ${product.latestDate}` : "จาก Master"}
                              {product.latestGoodQty ? ` • Good ${formatNumber(product.latestGoodQty)}` : ""}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p>ยังไม่มีประวัติงานของเครื่องนี้สำหรับแนะนำงานรอผลิต</p>
                  )}
                </div>
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
                    className="production-main-input"
                    onChange={(event) => updateProductField("productName", event.target.value)}
                    required
                    type="text"
                    value={draft.productName}
                  />
                  <select
                    aria-label="เลือกรุ่นจากประวัติเก่า"
                    className="production-inline-history-select"
                    onChange={(event) => {
                      updateProductField("productName", event.target.value);
                      event.currentTarget.value = "";
                    }}
                    value=""
                  >
                    <option value="">เลือกรุ่นจากประวัติเก่า</option>
                    {productNameOptions.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="label-text">Part No. <RequiredMark /></span>
                  <input
                    className="production-main-input"
                    onChange={(event) => updateProductField("partNo", event.target.value)}
                    required
                    type="text"
                    value={draft.partNo}
                  />
                  <select
                    aria-label="เลือก Part No. จากประวัติเก่า"
                    className="production-inline-history-select"
                    onChange={(event) => {
                      updateProductField("partNo", event.target.value);
                      event.currentTarget.value = "";
                    }}
                    value=""
                  >
                    <option value="">เลือก Part No. จากประวัติเก่า</option>
                    {partNoOptions.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="label-text">Step <RequiredMark /></span>
                  <input
                    className="production-main-input"
                    onChange={(event) => updateProductField("step", event.target.value)}
                    placeholder="-"
                    required
                    type="text"
                    value={draft.step}
                  />
                  <select
                    aria-label="เลือก Step จากประวัติเก่า"
                    className="production-inline-history-select"
                    onChange={(event) => {
                      updateProductField("step", event.target.value);
                      event.currentTarget.value = "";
                    }}
                    value=""
                  >
                    <option value="">เลือก Step จากประวัติเก่า</option>
                    {stepOptions.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="production-material-field">
                  <span className="label-text">Material of production</span>
                  <input
                    className="production-main-input"
                    onChange={(event) => {
                      recordEmployeeDraftEvent("แก้ Material of production", event.target.value || "-");
                      setDraft({ ...draft, materialOfProduction: event.target.value });
                    }}
                    placeholder="Material of production"
                    type="text"
                    value={draft.materialOfProduction || ""}
                  />
                </label>
              </div>
              {duplicateEntryMessage && (
                <div className="duplicate-warning" role="alert">
                  <AlertTriangle size={18} />
                  <span>{duplicateEntryMessage}</span>
                </div>
              )}

              <div className="runtime-panel">
                {!isEmployeeEntry && (
                  <div className="runtime-current-clock">
                    <span>เวลาปัจจุบัน</span>
                    <strong>{formatClock(employeeReportNow)}</strong>
                  </div>
                )}
                <label className="runtime-input-block">
                  <span>เวลาตามกะ <RequiredMark /></span>
                  <div className="runtime-input-row">
                    <input
                      max={maxShiftWorkMinutes}
                      min="0"
                      onChange={(event) => {
                        if (!isEmployeeEntry) updateWorkMinutes(event.target.value);
                      }}
                      readOnly={isEmployeeEntry}
                      required
                      type="number"
                      value={draft.workMinutes}
                    />
                    <b>นาที</b>
                  </div>
                  {isEmployeeEntry && (
                    <small className="field-help">คำนวณอัตโนมัติจากเวลาจริงในกะ 08:00-20:00 / 20:00-08:00 หักพัก H แล้ว สูงสุด 610 นาที</small>
                  )}
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
                  <span>เวลาตามจริง (เวลาโลก)</span>
                  <strong>{formatNumber(computedNormalMinutes)} นาที</strong>
                </div>
              </div>

              <div className="section-title compact">
                <TableProperties size={19} />
                <h2>ยอดผลิต</h2>
              </div>
              <div className="form-grid three output-quantity-grid">
                <label className="good-quantity-field">
                  <span className="label-text">Good quantity <RequiredMark /></span>
                  <input className="good-quantity-input" value={numberInputValue(draft.goodQty)} onChange={(event) => handleNumber("goodQty", event.target.value)} min="0" type="number" />
                </label>
                <label className="ng-quantity-field">
                  <span className="label-text">NG quantity</span>
                  <input className="ng-quantity-input" value={numberInputValue(draft.ngQty)} onChange={(event) => handleNumber("ngQty", event.target.value)} min="0" type="number" />
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
                  ? "กดหัวข้อใดก่อนก็ได้ ปุ่มแรกคือเวลาเริ่มงานจริง จากนั้นกดหัวข้อใหม่เพื่อหยุดหัวข้อก่อนหน้าและเริ่มนับหัวข้อใหม่"
                  : `กรอกเป็นจำนวนช่อง: 1 ช่อง = ${formatRate(draft.minutesPerSlot || defaultMinutesPerSlot)} นาที ค่าเริ่มต้น 0 และแก้ไขได้`}
              </p>
              {isEmployeeEntry && currentMachineSharedStatus && (
                <div className="employee-shared-entry-status" aria-live="polite">
                  <div>
                    <span>สถานะสดเครื่องนี้</span>
                    <strong>{currentMachineSharedActivity || "กำลังกรอกอยู่"}</strong>
                  </div>
                  <p>
                    ผู้กรอก: {currentMachineSharedStatus.userName || "-"} · อัปเดตล่าสุด{" "}
                    {formatSharedStatusTime(currentMachineSharedStatus.entryUpdatedAt || currentMachineSharedStatus.updatedAt)}
                  </p>
                  <p>
                    {currentMachineSharedStatus.productName || "-"} / {currentMachineSharedStatus.partNo || "-"} · Good{" "}
                    {formatNumber(currentMachineSharedStatus.goodQty || 0)} · NG {formatNumber(currentMachineSharedStatus.ngQty || 0)} · Downtime{" "}
                    {formatRate(currentMachineSharedStatus.downtimeMinutes || 0)} นาที
                  </p>
                  <p>
                    Material {currentMachineSharedStatus.materialOfProduction || "-"} · Speed{" "}
                    {formatRate(currentMachineSharedStatus.machineSpeed || 0)} · Cavity {formatNumber(currentMachineSharedStatus.cavityQty || 0)} ·
                    Test {formatNumber(currentMachineSharedStatus.testQty || 0)}
                  </p>
                  <p>
                    Work {formatRate(currentMachineSharedStatus.workMinutes || 0)} นาที · Normal{" "}
                    {formatRate(currentMachineSharedStatus.normalMinutes || 0)} นาที · Note {currentMachineSharedStatus.note || "-"}
                  </p>
                </div>
              )}
              <div className="downtime-grid">
                {isEmployeeEntry && (
                  <label className={`downtime-card ${getExcelCodeTone(productionWorkExcelCode)}`}>
                    <button
                      className={`downtime-press-button ${getExcelCodeTone(productionWorkExcelCode)} ${getEmployeeTimerToneClass("work")} ${employeeActiveTimer?.key === "work" ? "active-timer" : ""} ${currentMachineSharedTimerKey === "work" ? "shared-active-timer" : ""}`}
                      disabled={!canPressEmployeeTimerForRole(session.role, "work")}
                      onClick={pressEmployeeWorkStartRealtime}
                      title={!canPressEmployeeTimerForRole(session.role, "work") ? `Role ${employeeRoleLabel(session.role)} ไม่มีสิทธิ์กด A` : undefined}
                      type="button"
                    >
                      <span className="downtime-button-code">{productionWorkExcelCode}</span>
                      <span className="downtime-button-title">การทำงาน / เริ่มงานจริง</span>
                      <span className="downtime-button-action">กดบันทึกเวลาปัจจุบัน</span>
                      กดเริ่มงานจริงเวลาปัจจุบัน
                    </button>
                    {currentMachineSharedTimerKey === "work" && currentMachineSharedStatus && (
                      <small className="shared-topic-note">
                        {currentMachineSharedActivity || "กำลังกรอกอยู่"} · ผู้กรอก {currentMachineSharedStatus.userName || "-"}
                        {currentMachineSharedLiveMinutes !== null ? ` · ใช้เวลา ${formatDurationMinutes(currentMachineSharedLiveMinutes)}` : ""}
                      </small>
                    )}
                    <small>{employeeWorkStartedAt ? `เริ่มงานจริง ${formatClock(employeeWorkStartedDate ?? employeeReportNow)}` : "ยังไม่กดเริ่มงานจริง"}</small>
                    {employeeActiveTimer?.key === "work" && <small className="downtime-press-time">กำลังนับ A อยู่</small>}
                    {employeeWorkStartedAt && <small className="downtime-press-time">นับเวลางานจริงแล้ว {employeeWorkElapsed}</small>}
                    {renderEmployeeTimerHistory("work")}
                  </label>
                )}
                {downtimeFields.map((field) => (
                  <label className={`downtime-card ${getExcelCodeTone(downtimeExcelCodes[field.key])}`} key={field.key}>
                    {isEmployeeEntry ? (
                      <button
                        className={`downtime-press-button ${getExcelCodeTone(downtimeExcelCodes[field.key])} ${getEmployeeTimerToneClass(field.key)} ${employeeActiveTimer?.key === field.key ? "active-timer" : ""} ${currentMachineSharedTimerKey === field.key ? "shared-active-timer" : ""}`}
                        disabled={!canPressEmployeeTimerForRole(session.role, field.key)}
                        onClick={() => pressEmployeeDowntimeRealtime(field.key)}
                        title={
                          !canPressEmployeeTimerForRole(session.role, field.key)
                            ? `Role ${employeeRoleLabel(session.role)} ไม่มีสิทธิ์กด ${downtimeExcelCodes[field.key]}`
                            : undefined
                        }
                        type="button"
                      >
                        <span className="downtime-button-code">{downtimeExcelCodes[field.key]}</span>
                        <span className="downtime-button-title">{field.label}</span>
                        <span className="downtime-button-action">กดบันทึกเวลาปัจจุบัน</span>
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
                    {isEmployeeEntry && currentMachineSharedTimerKey === field.key && currentMachineSharedStatus && (
                      <small className="shared-topic-note">
                        {currentMachineSharedActivity || "กำลังกรอกอยู่"} · ผู้กรอก {currentMachineSharedStatus.userName || "-"}
                        {currentMachineSharedLiveMinutes !== null ? ` · ใช้เวลา ${formatDurationMinutes(currentMachineSharedLiveMinutes)}` : ""}
                      </small>
                    )}
                    {isEmployeeEntry && employeeActiveTimer?.key === field.key && <small className="downtime-press-time">กำลังนับหัวข้อนี้อยู่</small>}
                    {isEmployeeEntry && renderEmployeeTimerHistory(field.key)}
                  </label>
                ))}
              </div>

              <label>
                หมายเหตุ
                <textarea value={draft.note} onChange={(event) => setDraft({ ...draft, note: event.target.value })} rows={3} />
              </label>

              {isEmployeeEntry && (
                <section className="employee-live-report" aria-live="polite">
                  <div className="employee-live-report-heading">
                    <div>
                      <span>Realtime employee report</span>
                      <h3>รายงานสดการกรอกยอดพนักงาน</h3>
                    </div>
                    <strong>{formatClock(employeeReportNow)}</strong>
                  </div>
                  <div className="employee-live-report-grid">
                    <div className="employee-work-start-card">
                      <span>A การทำงาน / เริ่มงานจริง</span>
                      <b>{employeeWorkStartedLabel}</b>
                      <small>{employeeWorkStartedAt ? `นับเวลางานจริง ${employeeWorkElapsed}` : "ยังไม่กดหัวข้อแรก ระบบยังไม่นับเวลาผลิต"}</small>
                    </div>
                    <div>
                      <span>อัปเดตล่าสุด</span>
                      <b>{employeeDraftUpdatedLabel}</b>
                      <small>รวมเวลาการกรอกอัตโนมัติ {employeeEntryElapsed}</small>
                    </div>
                    <div>
                      <span>ช่วงเวลาการกรอก</span>
                      <b>
                        {draft.recordDate || getTodayInputValue()} {draft.recordTime || getCurrentTimeInputValue()} - {formatClock(employeeReportNow)}
                      </b>
                      <small>ใช้เวลา {employeeEntryElapsed}</small>
                    </div>
                    <div>
                      <span>วันที่ผลิต / กะ</span>
                      <b>{draft.date || getTodayInputValue()}</b>
                      <small>
                        {shiftLabel(draft.shift)} · {shiftWindowLabel(draft.date, draft.shift)}
                      </small>
                    </div>
                    <div>
                      <span>เครื่อง / ไลน์</span>
                      <b>{currentMachine.name}</b>
                      <small>{draft.productName || "-"}</small>
                    </div>
                    <div>
                      <span>Part No. / Step</span>
                      <b>{draft.partNo || "-"}</b>
                      <small>Step {draft.step || "-"}</small>
                    </div>
                    <div>
                      <span>ยอดผลิต</span>
                      <b>Good {formatNumber(draft.goodQty || 0)}</b>
                      <small>
                        NG {formatNumber(draft.ngQty || 0)} / Test {formatNumber(draft.testQty || 0)}
                      </small>
                    </div>
                    <div>
                      <span>เวลาผลิต</span>
                      <b>{formatNumber(draft.workMinutes)} นาที</b>
                      <small>
                        Downtime {formatNumber(totalDraftDowntime)} / Normal {formatNumber(computedNormalMinutes)}
                      </small>
                    </div>
                  </div>
                  <div className="employee-live-downtime">
                    <span>รายละเอียดเวลาหยุด</span>
                    {employeeDowntimeDetails.length > 0 ? (
                      <div>
                        {employeeDowntimeDetails.map((item) => (
                          <em key={item.key}>
                            {item.label}: {formatRate(item.minutes)} นาที{item.lastPressed ? ` (กดล่าสุด ${item.lastPressed})` : ""}
                          </em>
                        ))}
                      </div>
                    ) : (
                      <p>ยังไม่มีการกดหัวข้อเวลาหยุด</p>
                    )}
                  </div>
                  <div className="employee-live-timeline">
                    <span>ประวัติการกรอกล่าสุด</span>
                    {employeeDraftTimeline.length > 0 ? (
                      <ol>
                        {employeeDraftTimeline.map((item) => (
                          <li key={item.id}>
                            <time>{new Date(item.at).toLocaleTimeString("th-TH")}</time>
                            <b>{item.label}</b>
                            {item.value && <small>{item.value}</small>}
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p>ยังไม่มีประวัติการแก้ไขร่าง</p>
                    )}
                  </div>
                  {employeeDraftSavedAt && <p className="employee-live-draft">ร่างล่าสุด: {employeeDraftSavedAt}</p>}
                </section>
              )}

              <div className="form-actions">
                {isEmployeeEntry && (
                  <>
                    <button className="draft-button" disabled={saving} onClick={saveEmployeeDraftLocally} type="button">
                      <Save size={18} /> บันทึกร่างไว้ก่อน
                    </button>
                    {employeeDraftSavedAt && <span className="draft-status">ร่างล่าสุด {employeeDraftSavedAt}</span>}
                  </>
                )}
                <button className="primary-button" disabled={saving || Boolean(duplicateEntry)} type="submit">
                  <Save size={18} /> {saving ? "กำลังบันทึก" : editingLog ? "บันทึกการแก้ไข" : isEmployeeEntry ? "ส่งยอดบันทึก" : "บันทึกยอด"}
                </button>
                <button className="ghost-button" onClick={() => resetDraft()} type="button">
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
            <FiltersBar filters={dashboardFilters} machines={machines} setFilters={setDashboardFilters} />
            {dashboardEmptyMessage && (
              <FilterEmptyNotice
                latestDate={dashboardAvailableDateRange?.lastDate}
                message={dashboardEmptyMessage}
                onClearDates={clearDashboardDates}
                onUseLatest={useLatestDashboardDate}
              />
            )}
            <OeeSummaryChart downtimeItems={downtime} summary={summary} />
            <DailyMachinePerformanceChart logs={dashboardLogs} machines={machines} />
            <MachineCapacityDashboard logs={dashboardLogs} machines={machines} />
            <PartNoSummary logs={dashboardLogs} />
            <MachineRanking logs={dashboardLogs} machines={machines} />
            <Trend logs={dashboardLogs} />
          </section>
        )}

        {tab === "reports" && (
          <ReportsView
            emptyMessage={reportEmptyMessage}
            latestDate={reportAvailableDateRange?.lastDate}
            filters={reportFilters}
            logs={reportLogs}
            machines={machines}
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
            <FiltersBar filters={historyFilters} machines={machines} setFilters={setHistoryFilters} />
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

      {pendingEmployeeTimer && (
        <div className="confirm-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="confirm-entry-dialog-title">
          <div className="confirm-modal">
            <div className="confirm-modal-icon">
              <AlertTriangle size={30} />
            </div>
            <h2 id="confirm-entry-dialog-title">ยืนยันการกรอก</h2>
            <p>
              ต้องการบันทึกเวลา {pendingEmployeeTimer.label} เวลา {pendingEmployeeTimer.pressedTime} ใช่หรือไม่
            </p>
            <div className="modal-actions">
              <button className="primary-button" type="button" autoFocus onClick={confirmEmployeeTimer}>
                ยืนยัน
              </button>
              <button className="ghost-button" type="button" onClick={() => setPendingEmployeeTimer(null)}>
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

const userRoleOptions: Array<{ value: AppRole; label: string }> = [
  { value: "production", label: "Production" },
  { value: "qc", label: "QC" },
  { value: "tooling_repair", label: "Tooling repair" },
  { value: "technician", label: "Technician" },
  { value: "admin", label: "Admin" },
];

const createEmptyPasswordForm = (username: string) => ({
  username,
  password: "",
  confirmPassword: "",
});

const createEmptyEditUserForm = (username = "", displayName = "", role: AppRole = "production") => ({
  username,
  displayName,
  role,
});

function UsersAdmin({ currentUsername }: { currentUsername: string }) {
  const [users, setUsers] = useState<AppUserSummary[]>([]);
  const [form, setForm] = useState(emptyUserForm);
  const [editUserForm, setEditUserForm] = useState(() => createEmptyEditUserForm());
  const [passwordForm, setPasswordForm] = useState(() => createEmptyPasswordForm(currentUsername));
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [savingUser, setSavingUser] = useState(false);
  const [savingEditUser, setSavingEditUser] = useState(false);
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

  const selectUserForEdit = (user: AppUserSummary) => {
    setMessage("");
    setError("");
    setEditUserForm(createEmptyEditUserForm(user.username, user.displayName, user.role));
    setPasswordForm(createEmptyPasswordForm(user.username));
  };

  const submitEditUser = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    setError("");
    if (!editUserForm.username) {
      setError("กรุณาเลือกผู้ใช้งานที่ต้องการแก้ไข");
      return;
    }
    setSavingEditUser(true);
    try {
      const nextUsers = await updateUser(editUserForm);
      setUsers(nextUsers);
      setMessage(`แก้ไขชื่อและ Role ผู้ใช้งาน ${editUserForm.username} แล้ว`);
      const updatedUser = nextUsers.find((user) => user.username === editUserForm.username);
      setEditUserForm(createEmptyEditUserForm(
        updatedUser?.username || editUserForm.username,
        updatedUser?.displayName || editUserForm.displayName,
        updatedUser?.role || editUserForm.role,
      ));
    } catch (editError) {
      setError(editError instanceof Error ? editError.message : "แก้ไขผู้ใช้งานไม่สำเร็จ");
    } finally {
      setSavingEditUser(false);
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
              {userRoleOptions.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
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

      <form className="user-form" onSubmit={submitEditUser}>
        <div className="section-title">
          <Pencil size={20} />
          <h2>แก้ไขชื่อและ Role ผู้ใช้งาน</h2>
        </div>
        <div className="form-grid">
          <label>
            <span className="label-text">บัญชี <RequiredMark /></span>
            <select
              onChange={(event) => {
                const selectedUser = users.find((user) => user.username === event.target.value);
                setEditUserForm(createEmptyEditUserForm(selectedUser?.username || "", selectedUser?.displayName || "", selectedUser?.role || "production"));
              }}
              required
              value={editUserForm.username}
            >
              <option value="">เลือกผู้ใช้งาน</option>
              {users.map((user) => (
                <option key={user.username} value={user.username}>
                  {user.username} - {user.displayName}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="label-text">ชื่อแสดงผล <RequiredMark /></span>
            <input
              autoComplete="off"
              onChange={(event) => setEditUserForm({ ...editUserForm, displayName: event.target.value })}
              placeholder="ชื่อที่แสดงในระบบ"
              required
              type="text"
              value={editUserForm.displayName}
            />
          </label>
          <label>
            <span className="label-text">Role <RequiredMark /></span>
            <select
              disabled={!editUserForm.username}
              onChange={(event) => setEditUserForm({ ...editUserForm, role: event.target.value as AppRole })}
              required
              value={editUserForm.role}
            >
              {userRoleOptions.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="label-text">Username</span>
            <input readOnly value={editUserForm.username || "-"} type="text" />
          </label>
        </div>
        <div className="form-actions">
          <button className="primary-button" disabled={savingEditUser || !editUserForm.username} type="submit">
            <Save size={18} /> {savingEditUser ? "กำลังบันทึก" : "บันทึกชื่อและ Role"}
          </button>
        </div>
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
                      className="ghost-button compact"
                      onClick={() => selectUserForEdit(user)}
                      title="แก้ไขชื่อและรหัสผ่าน"
                      type="button"
                    >
                      <Pencil size={16} /> แก้ไข
                    </button>
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
  machines,
  onClearDates,
  onDownloadPdf,
  onUseLatest,
  setFilters,
}: {
  emptyMessage: string;
  filters: Filters;
  latestDate?: string;
  logs: ProductionLog[];
  machines: Machine[];
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
          <p>ช่วงวันที่ผลิต: {reportRangeLabel(filters)} | เครื่อง: {reportMachineLabel(filters, machines)} | กะ: {reportShiftLabel(filters)}</p>
          <p>กะเช้า 08:00-20:00 ของวันที่ผลิต | กะดึก 20:00-08:00 ของวันถัดไป</p>
        </div>
        <button className="primary-button" onClick={onDownloadPdf} type="button">
          <FileText size={18} /> ดาวน์โหลด PDF
        </button>
      </div>

      <FiltersBar filters={filters} machines={machines} setFilters={setFilters} />
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
      <OeeSummaryChart downtimeItems={downtimeRows} summary={summary} />
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

function FiltersBar({
  filters,
  machines,
  setFilters,
}: {
  filters: Filters;
  machines: Machine[];
  setFilters: (filters: Filters) => void;
}) {
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

function OeeSummaryChart({
  downtimeItems = [],
  summary,
}: {
  downtimeItems?: ReturnType<typeof groupDowntime>;
  summary: ReturnType<typeof summarize>;
}) {
  const oee = summary.availability * summary.quality;
  const factors = [
    { label: "Availability", value: summary.availability, minutes: summary.run, color: "#22c55e", radius: 58 },
    { label: "Quality", value: summary.quality, minutes: summary.run * summary.quality, color: "#0ea5e9", radius: 44 },
    { label: "OEE", value: oee, minutes: summary.run * summary.quality, color: "#facc15", radius: 30 },
  ];
  const issueColors = ["#ef4444", "#fb923c", "#facc15", "#94a3b8"];
  const topIssueItems = downtimeItems.filter((item) => item.minutes > 0).slice(0, 3);
  const topIssueMinutes = topIssueItems.reduce((total, item) => total + item.minutes, 0);
  const otherIssueMinutes = Math.max(summary.downtime - topIssueMinutes, 0);
  const issueRows =
    summary.downtime > 0
      ? [
          ...topIssueItems.map((item, index) => ({
            color: issueColors[index],
            label: item.label,
            minutes: item.minutes,
            percent: item.minutes / Math.max(summary.downtime, 1),
          })),
          ...(otherIssueMinutes > 0
            ? [
                {
                  color: issueColors[4],
                  label: "อื่นๆ / Other",
                  minutes: otherIssueMinutes,
                  percent: otherIssueMinutes / Math.max(summary.downtime, 1),
                },
              ]
            : []),
        ]
      : [{ color: "#16a34a", label: "ไม่มี Downtime", minutes: 1, percent: 0 }];
  let issueCursor = 0;
  const issueGradient =
    summary.downtime > 0
      ? issueRows
          .map((item) => {
            const start = issueCursor;
            const size = (item.minutes / Math.max(summary.downtime, 1)) * 100;
            issueCursor += size;
            return `${item.color} ${start}% ${issueCursor}%`;
          })
          .join(", ")
      : "#16a34a 0% 100%";
  const mainIssue = topIssueItems[0];
  const issueSummary =
    summary.downtime > 0 && mainIssue
      ? `${mainIssue.label} สูงสุด ${formatNumber(mainIssue.minutes)} นาที (${formatPercent(mainIssue.minutes / Math.max(summary.downtime, 1))})`
      : "ไม่มี Downtime ตามตัวกรองนี้";
  const totalTime = summary.run + summary.downtime;
  const runPercent = totalTime > 0 ? summary.run / totalTime : 0;
  const downtimePercent = totalTime > 0 ? summary.downtime / totalTime : 0;
  const timeGradient =
    totalTime > 0
      ? `#16a34a 0% ${runPercent * 100}%, #dc2626 ${runPercent * 100}% 100%`
      : "#e5e7eb 0% 100%";

  return (
    <div className="analysis-panel oee-summary-chart">
      <div className="section-title">
        <Gauge size={20} />
        <h2>สรุป OEE</h2>
      </div>
      <div className="oee-summary-layout">
        <div className="oee-factor-list">
          <div className="oee-factor-combo">
            <svg aria-label="Availability Quality OEE summary" className="oee-factor-combo-donut" viewBox="0 0 140 140" role="img">
              {factors.map((factor) => {
                const percent = Math.min(Math.max(factor.value, 0), 1);
                const ringLength = 2 * Math.PI * factor.radius;
                return (
                  <g key={factor.label}>
                    <circle className="oee-factor-ring-bg" cx="70" cy="70" r={factor.radius} />
                    <circle
                      className="oee-factor-ring-value"
                      cx="70"
                      cy="70"
                      r={factor.radius}
                      stroke={factor.color}
                      strokeDasharray={ringLength}
                      strokeDashoffset={ringLength * (1 - percent)}
                    />
                  </g>
                );
              })}
            </svg>
            <div className="oee-factor-combo-label">
              <span>รวม</span>
              <strong>3 KPI</strong>
            </div>
          </div>
          <div className="oee-factor-combo-legend">
            {factors.map((factor) => (
              <p key={factor.label}>
                <i style={{ background: factor.color }} />
                <span>{factor.label}</span>
                <b>{formatNumber(factor.minutes)} นาที · {formatPercent(factor.value)}</b>
              </p>
            ))}
          </div>
          {false && factors.map((factor) => {
            const percent = Math.min(Math.max(factor.value, 0), 1);
            return (
              <div className="oee-factor" key={factor.label}>
                <div
                  className="oee-factor-mini-donut"
                  style={{
                    background: `conic-gradient(#16a34a 0% ${percent * 100}%, #eef1ee ${percent * 100}% 100%)`,
                  }}
                >
                  <div>{formatPercent(factor.value)}</div>
                </div>
                <div className="oee-factor-detail">
                  <span>{factor.label}</span>
                  <strong>{formatNumber(factor.minutes)} นาที · {formatPercent(factor.value)}</strong>
                </div>
              </div>
            );
          })}
        </div>
        <div className="oee-volume-summary">
          <div className="oee-time-donut" style={{ background: `conic-gradient(${timeGradient})` }}>
            <div>
              <span>เวลารวม</span>
              <strong>{formatPercent(runPercent)}</strong>
              <small>Run</small>
            </div>
          </div>
          <div className="oee-time-legend">
            <p>
              <i className="run" />
              <span>Run time</span>
              <b>{formatNumber(summary.run)} นาที · {formatPercent(runPercent)}</b>
            </p>
            <p>
              <i className="down" />
              <span>Downtime</span>
              <b>{formatNumber(summary.downtime)} นาที · {formatPercent(downtimePercent)}</b>
            </p>
            <p className="total-output">
              <span>Total output</span>
              <strong>{formatNumber(summary.total)}</strong>
            </p>
          </div>
        </div>
        <div className="oee-issue-donut-card">
          <div className="oee-issue-donut" style={{ background: `conic-gradient(${issueGradient})` }}>
            <div>
              <span>ปัญหา</span>
              <strong>{summary.downtime > 0 ? formatNumber(summary.downtime) : "0"}</strong>
              <small>นาที</small>
            </div>
          </div>
          <div className="oee-issue-summary">
            <span>วิเคราะห์ปัญหา / Problem</span>
            <strong>{issueSummary}</strong>
            <div className="oee-issue-legend">
              {issueRows.map((item) => (
                <p key={item.label}>
                  <i style={{ background: item.color }} />
                  <span>{item.label}</span>
                  <b>
                    {summary.downtime > 0
                      ? `${formatNumber(item.minutes)} นาที · ${formatPercent(item.percent)}`
                      : "ปกติ"}
                  </b>
                </p>
              ))}
            </div>
          </div>
        </div>
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

type DailyPerformanceRow = {
  actualOutput: number;
  availability: number;
  count: number;
  date: string;
  machineCount: number;
  machineNames: string[];
  normalMinutes: number;
  targetQty: number;
  utilization: number;
  workMinutes: number;
};

function buildDailyPerformanceRows(logs: ProductionLog[], machines: Machine[]): DailyPerformanceRow[] {
  const machineNameLookup = new Map(machines.map((machine) => [machine.id, machine.name]));
  const rows = logs.reduce((map, log) => {
    const current =
      map.get(log.date) ??
      {
        actualOutput: 0,
        count: 0,
        date: log.date,
        machineIds: new Set<string>(),
        machineNames: new Set<string>(),
        normalMinutes: 0,
        targetQty: 0,
        workMinutes: 0,
      };
    const machineName = machineNameLookup.get(log.machineId) || log.machineName || log.machineId;
    current.actualOutput += totalOutput(log);
    current.count += 1;
    current.machineIds.add(log.machineId);
    current.machineNames.add(machineName);
    current.normalMinutes += Number(log.normalMinutes || 0);
    current.targetQty += getLogTargetQty(log);
    current.workMinutes += getLogWorkMinutes(log);
    map.set(log.date, current);
    return map;
  }, new Map<string, Omit<DailyPerformanceRow, "availability" | "machineCount" | "machineNames" | "utilization"> & { machineIds: Set<string>; machineNames: Set<string> }>());

  return [...rows.values()]
    .map(({ machineIds, machineNames, ...row }) => {
      const sortedMachineNames = [...machineNames].sort((a, b) => a.localeCompare(b, "en"));
      return {
        ...row,
        availability: row.workMinutes > 0 ? row.normalMinutes / row.workMinutes : 0,
        machineCount: machineIds.size,
        machineNames: sortedMachineNames,
        utilization: row.targetQty > 0 ? row.actualOutput / row.targetQty : 0,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

function formatDailyMachineNames(row: DailyPerformanceRow): string {
  if (row.machineNames.length === 0) {
    return "-";
  }
  if (row.machineNames.length <= 2) {
    return row.machineNames.join(", ");
  }
  return `${row.machineNames.slice(0, 2).join(", ")} +${formatNumber(row.machineNames.length - 2)}`;
}

function DailyMachinePerformanceChart({ logs, machines }: { logs: ProductionLog[]; machines: Machine[] }) {
  const rows = useMemo(() => buildDailyPerformanceRows(logs, machines).slice(-14), [logs, machines]);
  const latest = rows.at(-1);
  const maxOutput = Math.max(1, ...rows.map((row) => row.actualOutput));

  return (
    <div className="analysis-panel daily-performance-panel">
      <div className="report-table-heading compact-heading">
        <div>
          <h2>แผนภูมิแท่งรายวัน / Daily Bar Chart</h2>
          <p>อัตราการใช้เครื่องและประสิทธิภาพเครื่อง / Utilization and Availability</p>
        </div>
        <span>{formatNumber(rows.length)} วัน</span>
      </div>
      {rows.length === 0 ? (
        <p className="empty-text">ไม่มีข้อมูลรายวันตามตัวกรองนี้ / No daily data for this filter</p>
      ) : (
        <>
          {latest && (
            <div className="daily-performance-summary">
              <div>
                <span>วันล่าสุด / Latest date</span>
                <strong>{latest.date}</strong>
              </div>
              <div>
                <span>Utilization</span>
                <strong>{formatPercent(latest.utilization)}</strong>
              </div>
              <div>
                <span>Availability</span>
                <strong>{formatPercent(latest.availability)}</strong>
              </div>
              <div>
                <span>เครื่อง / Logs</span>
                <strong>{formatNumber(latest.machineCount)} / {formatNumber(latest.count)}</strong>
              </div>
            </div>
          )}
          <div className="daily-performance-legend">
            <span><i className="utilization" /> อัตราการใช้เครื่อง / Utilization</span>
            <span><i className="availability" /> ประสิทธิภาพเครื่อง / Availability</span>
            <span><i className="output" /> จำนวนงาน / Quantity</span>
          </div>
          <div className="daily-performance-column-chart" role="img" aria-label="Daily machine utilization, availability, and quantity bar chart">
            {rows.map((row) => {
              const utilizationHeight = `${Math.min(Math.max(row.utilization, 0), 1) * 100}%`;
              const availabilityHeight = `${Math.min(Math.max(row.availability, 0), 1) * 100}%`;
              const outputHeight = `${Math.min(Math.max(row.actualOutput / maxOutput, 0), 1) * 100}%`;
              return (
                <div className="daily-performance-column" key={row.date}>
                  <div className="daily-performance-value-labels">
                    <span className="utilization-value">{formatPercent(row.utilization)}</span>
                    <span className="availability-value">{formatPercent(row.availability)}</span>
                    <span className="output-value">{formatNumber(row.actualOutput)}</span>
                  </div>
                  <div className="daily-performance-column-bars">
                    <i className="utilization" title="อัตราการใช้เครื่อง / Utilization"><b style={{ height: utilizationHeight }} /></i>
                    <i className="availability" title="ประสิทธิภาพเครื่อง / Availability"><b style={{ height: availabilityHeight }} /></i>
                    <i className="output" title="จำนวนงาน / Quantity"><b style={{ height: outputHeight }} /></i>
                  </div>
                  <div className="daily-performance-bar-labels" aria-hidden="true">
                    <span>ใช้</span>
                    <span>ประสิทธิภาพ</span>
                    <span>งาน</span>
                  </div>
                  <div className="daily-performance-column-date">
                    <strong>{row.date.slice(5)}</strong>
                    <span className="daily-performance-machine-name" title={row.machineNames.join(", ")}>
                      {formatDailyMachineNames(row)}
                    </span>
                    <span>{formatNumber(row.machineCount)} เครื่อง / Machines</span>
                    <em>Quantity {formatNumber(row.actualOutput)}</em>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function buildMachineCapacityRows(logs: ProductionLog[], machines: Machine[]): MachineCapacityRow[] {
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

function MachineCapacityDashboard({ logs, machines }: { logs: ProductionLog[]; machines: Machine[] }) {
  const rows = useMemo(() => buildMachineCapacityRows(logs, machines), [logs, machines]);
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

function MachineRanking({ logs, machines }: { logs: ProductionLog[]; machines: Machine[] }) {
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
