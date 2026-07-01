const SPREADSHEET_ID = "1-3RKcRJC_ENe-xCWMIYYHqYYaKj0cyCG8n-MwMWQMXM";
const DATABASE_TITLE = "OEE Production Database";
const LOG_SHEET = "production_logs";
const MACHINE_SHEET = "machines";
const PRODUCT_MASTER_SHEET = "product_master";
const DOWNTIME_CATALOG_SHEET = "downtime_catalog";
const USER_SHEET = "app_users";
const EMPLOYEE_STATUS_SHEET = "employee_machine_status";
const KPI_DASHBOARD_SHEET = "kpi_dashboard";
const KPI_MACHINE_SHEET = "kpi_machine";
const KPI_MACHINE_STEP_SHEET = "kpi_machine_step";
const KPI_MACHINE_JOB_STEP_SHEET = "kpi_machine_job_step";
const KPI_DAILY_DETAIL_SHEET = "kpi_daily_detail";
const KPI_NOTES_SHEET = "kpi_notes";
const KPI_REFRESH_ACTION = "refreshKpi";
const PD_EXTERNAL_SHEETS = [
  {
    id: "1O1q9jOeTs81xOAUjTTXoDvVSqM5zFl5j",
    label: "PD 1",
    gid: "708075205",
    url: "https://docs.google.com/spreadsheets/d/1O1q9jOeTs81xOAUjTTXoDvVSqM5zFl5j/edit?gid=708075205#gid=708075205",
  },
  {
    id: "1eXby1xmCjhp_C8H_r7OC8JmnLu00WRYq",
    label: "PD 2",
    gid: "255697382",
    url: "https://docs.google.com/spreadsheets/d/1eXby1xmCjhp_C8H_r7OC8JmnLu00WRYq/edit?gid=255697382#gid=255697382",
  },
];
const PD_MAX_ROWS_PER_SHEET = 300;
const PD_MAX_COLUMNS_PER_SHEET = 40;

const MACHINES_CSV_URL = "https://raw.githubusercontent.com/weeraphonjod99-cmyk/oee-production-entry/main/google-sheet/machines.csv";
const PRODUCT_MASTER_CSV_URL = "https://raw.githubusercontent.com/weeraphonjod99-cmyk/oee-production-entry/main/google-sheet/product_master.csv";
const PRODUCTION_LOGS_SEED_CSV_URL = "https://raw.githubusercontent.com/weeraphonjod99-cmyk/oee-production-entry/main/google-sheet/production_logs_seed.csv";
const OEE_HEADER_ROW = 3;
const OEE_FIRST_DATA_ROW = 4;
const OEE_MINUTES_PER_SLOT = 5;
const OEE_SHIFT_BREAK_MINUTES = 110;
const OEE_ENTRY_DATE_HEADER = "วันที่กรอกยอด\nEntry Date";
const OEE_ENTRY_TIME_HEADER = "เวลากรอก\nEntry Time";
const OEE_TEST_HEADER = "งาน\nทดสอบ\n/Test";

const LOG_HEADERS = [
  "id",
  "recordDate",
  "recordTime",
  "date",
  "shift",
  "shiftStartAt",
  "shiftEndAt",
  "machineId",
  "machineName",
  "productName",
  "partNo",
  "step",
  "materialOfProduction",
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
  "createdAt",
  "updatedAt",
  "source",
];

const LOG_NUMBER_HEADERS = [
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
];

const EMPLOYEE_STATUS_HEADERS = [
  "machineId",
  "machineName",
  "date",
  "shift",
  "productName",
  "partNo",
  "step",
  "materialOfProduction",
  "userName",
  "goodQty",
  "ngQty",
  "testQty",
  "workMinutes",
  "timeSlots",
  "minutesPerSlot",
  "machineSpeed",
  "cavityQty",
  "downtimeMinutes",
  "normalMinutes",
  "changeoverMinutes",
  "inspectionMinutes",
  "equipmentRepairMinutes",
  "moldRepairMinutes",
  "materialChangeMinutes",
  "emergencyStopMinutes",
  "meetingMinutes",
  "plannedStopMinutes",
  "note",
  "activeTimerKey",
  "activeTimerLabel",
  "activeTimerStartedAt",
  "activeTimerBaseAt",
  "activeTimerBaseMinutes",
  "workStartedAt",
  "entryStartedAt",
  "status",
  "entryUpdatedAt",
  "updatedAt",
  "expiresAt",
];

const LOG_DATE_HEADERS = ["recordDate", "date"];

const MACHINE_NUMBER_HEADERS = ["capacityUnits", "capacityMinutes", "rowCount"];
const PRODUCT_NUMBER_HEADERS = ["sampleGoodQty", "sampleNgQty", "sampleTestQty"];

const MACHINE_HEADERS = [
  "id",
  "name",
  "capacityUnits",
  "capacityMinutes",
  "hasStep",
  "rowCount",
];

const PRODUCT_MASTER_HEADERS = [
  "id",
  "machineId",
  "machineName",
  "productName",
  "partNo",
  "step",
  "sampleGoodQty",
  "sampleNgQty",
  "sampleTestQty",
];

const USER_HEADERS = [
  "username",
  "displayName",
  "role",
  "passwordHash",
  "builtIn",
  "createdAt",
  "passwordChangedAt",
  "active",
];

const DEFAULT_USER_ROWS = [
  ["admin", "Administrator", "admin", "c3baf7d2bef9cffb097eb144a14df41f143af3b023ef21d448f449d2e9d4baf0", true, "", "", true],
  ["production", "Production", "production", "86a1f963447b489c579084029ae10e1c31ffcc90081bc220fa9da83bf1dfe89f", true, "", "", true],
];

const DOWNTIME_CATALOG_ROWS = [
  ["key", "thLabel", "enLabel", "sortOrder"],
  ["changeoverMinutes", "เปลี่ยนรุ่น", "Changeover", 10],
  ["inspectionMinutes", "ตรวจสอบ", "Inspection", 20],
  ["equipmentRepairMinutes", "ซ่อมเครื่อง", "Equipment repair", 30],
  ["moldRepairMinutes", "ซ่อมแม่พิมพ์", "Mold repair", 40],
  ["materialChangeMinutes", "เปลี่ยนวัตถุดิบ", "Material change", 50],
  ["emergencyStopMinutes", "หยุดไม่ทราบสาเหตุ", "Emergency stop", 60],
  ["meetingMinutes", "ประชุม / 5S / เปลี่ยนกะ", "Meeting or shift break", 70],
  ["plannedStopMinutes", "หยุดตามแผน", "Planned stop", 80],
];

function doGet(e) {
  const action = e.parameter.action || "health";
  try {
    if (action === "logs") {
      const limit = Number(e.parameter.limit || 500);
      return jsonResponse({ ok: true, logs: getLogs(limit) });
    }
    if (action === "machines") {
      return jsonResponse({ ok: true, machines: getMachines() });
    }
    if (action === "employeeMachineStatuses") {
      return jsonResponse({ ok: true, statuses: getEmployeeMachineStatuses() });
    }
    if (action === "pdSheets") {
      return jsonResponse({ ok: true, sources: getPdExternalSheets() });
    }
    if (action === KPI_REFRESH_ACTION || action === "kpi") {
      return jsonResponse({ ok: true, result: refreshKpiSheets() });
    }
    if (action === "setup") {
      const book = setupProductionWorkbook();
      return jsonResponse({
        ok: true,
        service: "oee-production-entry",
        spreadsheetId: book.getId(),
        spreadsheetUrl: book.getUrl(),
      });
    }
    if (action === "refreshMasterData") {
      return jsonResponse({ ok: true, result: refreshMasterData() });
    }
    if (action === "refreshSeedLogs") {
      return jsonResponse({ ok: true, result: refreshSeedLogs() });
    }
    if (action === "importCncMachineSheets") {
      return jsonResponse({ ok: true, result: importCncMachineSheets(e.parameter.force === "1") });
    }
    if (action === "repairOeeFormulas") {
      return jsonResponse({ ok: true, result: repairOeeFormulas() });
    }
    if (action === "repairSheetTypes") {
      return jsonResponse({ ok: true, result: repairSheetTypes() });
    }
    if (action === "migrateOeeEntryTimestampColumns") {
      return jsonResponse({ ok: true, result: migrateOeeEntryTimestampColumns() });
    }
    if (action === "migrateOeeTestColumns") {
      return jsonResponse({ ok: true, result: migrateOeeTestColumns() });
    }
    return jsonResponse({ ok: true, service: "oee-production-entry" });
  } catch (error) {
    return jsonResponse({ ok: false, error: String(error && error.message ? error.message : error) });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || "{}");
    if (body.action === "appendLog") {
      const log = appendLog(body.payload || {});
      return jsonResponse({ ok: true, log });
    }
    if (body.action === "upsertLog") {
      const log = upsertLog(body.payload || {});
      return jsonResponse({ ok: true, log });
    }
    if (body.action === "upsertEmployeeMachineStatus") {
      const status = upsertEmployeeMachineStatus(body.payload || {});
      return jsonResponse({ ok: true, status });
    }
    if (body.action === "clearEmployeeMachineStatus") {
      clearEmployeeMachineStatus(body.payload || {});
      return jsonResponse({ ok: true });
    }
    if (body.action === "getProductDefaults") {
      return jsonResponse({ ok: true, defaults: getProductDefaults(body.payload || {}) });
    }
    if (body.action === "listUsers") {
      return jsonResponse({ ok: true, users: listAppUsers() });
    }
    if (body.action === "signIn") {
      return jsonResponse({ ok: true, session: signInUser(body.payload || {}) });
    }
    if (body.action === "createUser") {
      return jsonResponse({ ok: true, users: createAppUser(body.payload || {}) });
    }
    if (body.action === "updateUser") {
      return jsonResponse({ ok: true, users: updateAppUser(body.payload || {}) });
    }
    if (body.action === "changePassword") {
      return jsonResponse({ ok: true, users: changeAppUserPassword(body.payload || {}) });
    }
    if (body.action === "deleteUser") {
      return jsonResponse({ ok: true, users: deleteAppUser(body.payload || {}) });
    }
    return jsonResponse({ ok: false, error: "Unknown action" });
  } catch (error) {
    return jsonResponse({ ok: false, error: String(error && error.message ? error.message : error) });
  }
}

function appendLog(payload) {
  const now = new Date();
  const log = Object.assign({}, payload, {
    id: payload.id || Utilities.getUuid(),
    recordDate: formatRecordDate(payload.recordDate) || todayBangkok(now),
    recordTime: formatRecordTime(payload.recordTime) || timeBangkok(now),
    shiftStartAt: payload.shiftStartAt || getShiftStartAt(payload.date, payload.shift),
    shiftEndAt: payload.shiftEndAt || getShiftEndAt(payload.date, payload.shift),
    createdAt: payload.createdAt || now.toISOString(),
    updatedAt: payload.updatedAt || now.toISOString(),
    source: "google-sheet",
  });
  assertNoDuplicateOeeLog(log, "", true);
  appendFormattedOeeRow(log);
  const sheet = ensureSheet(LOG_SHEET, LOG_HEADERS);
  writeSerializedLogRow(sheet, Math.max(sheet.getLastRow() + 1, 2), log);
  return log;
}

function upsertLog(payload) {
  if (!payload.id) {
    return appendLog(payload);
  }

  const sheet = ensureSheet(LOG_SHEET, LOG_HEADERS);
  const values = sheet.getDataRange().getValues();
  const idColumn = LOG_HEADERS.indexOf("id") + 1;
  const rowIndex = values.findIndex(function(row, index) {
    return index > 0 && String(row[idColumn - 1]) === String(payload.id);
  });
  const log = Object.assign({}, payload, {
    recordDate: formatRecordDate(payload.recordDate) || todayBangkok(new Date()),
    recordTime: formatRecordTime(payload.recordTime) || timeBangkok(new Date()),
    shiftStartAt: payload.shiftStartAt || getShiftStartAt(payload.date, payload.shift),
    shiftEndAt: payload.shiftEndAt || getShiftEndAt(payload.date, payload.shift),
    createdAt: payload.createdAt || new Date().toISOString(),
    updatedAt: payload.updatedAt || new Date().toISOString(),
    source: "google-sheet",
  });
  assertNoDuplicateOeeLog(log, payload.id, false);

  if (rowIndex >= 0) {
    writeSerializedLogRow(sheet, rowIndex + 1, log);
    return log;
  }

  writeSerializedLogRow(sheet, Math.max(sheet.getLastRow() + 1, 2), log);
  return log;
}

function getEmployeeMachineStatuses() {
  const sheet = ensureSheet(EMPLOYEE_STATUS_SHEET, EMPLOYEE_STATUS_HEADERS);
  const values = sheet.getDataRange().getValues();
  const now = new Date();
  const rows = [];
  for (let i = 1; i < values.length; i++) {
    const item = rowToObject(EMPLOYEE_STATUS_HEADERS, values[i]);
    if (!item.machineId || item.status !== "active") continue;
    if (item.expiresAt) {
      const expiresAt = new Date(item.expiresAt);
      if (!isNaN(expiresAt.getTime()) && expiresAt.getTime() < now.getTime()) continue;
    }
    rows.push(item);
  }
  return rows.sort(function(a, b) {
    return String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""));
  });
}

function upsertEmployeeMachineStatus(payload) {
  const now = new Date();
  const status = {
    machineId: String(payload.machineId || ""),
    machineName: String(payload.machineName || ""),
    date: String(payload.date || ""),
    shift: String(payload.shift || ""),
    productName: String(payload.productName || ""),
    partNo: String(payload.partNo || ""),
    step: String(payload.step || "-"),
    materialOfProduction: String(payload.materialOfProduction || ""),
    userName: String(payload.userName || ""),
    goodQty: Number(payload.goodQty || 0),
    ngQty: Number(payload.ngQty || 0),
    testQty: Number(payload.testQty || 0),
    workMinutes: Number(payload.workMinutes || 0),
    timeSlots: Number(payload.timeSlots || 0),
    minutesPerSlot: Number(payload.minutesPerSlot || 0),
    machineSpeed: Number(payload.machineSpeed || 0),
    cavityQty: Number(payload.cavityQty || 0),
    downtimeMinutes: Number(payload.downtimeMinutes || 0),
    normalMinutes: Number(payload.normalMinutes || 0),
    changeoverMinutes: Number(payload.changeoverMinutes || 0),
    inspectionMinutes: Number(payload.inspectionMinutes || 0),
    equipmentRepairMinutes: Number(payload.equipmentRepairMinutes || 0),
    moldRepairMinutes: Number(payload.moldRepairMinutes || 0),
    materialChangeMinutes: Number(payload.materialChangeMinutes || 0),
    emergencyStopMinutes: Number(payload.emergencyStopMinutes || 0),
    meetingMinutes: Number(payload.meetingMinutes || 0),
    plannedStopMinutes: Number(payload.plannedStopMinutes || 0),
    note: String(payload.note || ""),
    activeTimerKey: String(payload.activeTimerKey || ""),
    activeTimerLabel: String(payload.activeTimerLabel || ""),
    activeTimerStartedAt: String(payload.activeTimerStartedAt || ""),
    activeTimerBaseAt: String(payload.activeTimerBaseAt || ""),
    activeTimerBaseMinutes: Number(payload.activeTimerBaseMinutes || 0),
    workStartedAt: String(payload.workStartedAt || ""),
    entryStartedAt: String(payload.entryStartedAt || ""),
    status: "active",
    entryUpdatedAt: String(payload.entryUpdatedAt || now.toISOString()),
    updatedAt: now.toISOString(),
    expiresAt: String(payload.expiresAt || payload.shiftEndAt || new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString()),
  };
  if (!status.machineId) {
    throw new Error("machineId is required");
  }

  const sheet = ensureSheet(EMPLOYEE_STATUS_SHEET, EMPLOYEE_STATUS_HEADERS);
  const values = sheet.getDataRange().getValues();
  let rowIndex = -1;
  let existingStatus = null;
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === status.machineId) {
      rowIndex = i + 1;
      existingStatus = rowToObject(EMPLOYEE_STATUS_HEADERS, values[i]);
      break;
    }
  }
  if (existingStatus && existingStatus.status === "cleared") {
    const existingUpdatedAt = new Date(existingStatus.updatedAt || existingStatus.expiresAt || "");
    const incomingUpdatedAt = new Date(payload.updatedAt || payload.entryUpdatedAt || payload.savedAt || "");
    if (!isNaN(existingUpdatedAt.getTime()) && !isNaN(incomingUpdatedAt.getTime()) && incomingUpdatedAt.getTime() <= existingUpdatedAt.getTime()) {
      return existingStatus;
    }
  }
  const row = EMPLOYEE_STATUS_HEADERS.map(function(header) {
    return status[header] || "";
  });
  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, EMPLOYEE_STATUS_HEADERS.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
  return status;
}

function clearEmployeeMachineStatus(payload) {
  const machineId = String(payload.machineId || "");
  if (!machineId) return;
  const sheet = ensureSheet(EMPLOYEE_STATUS_SHEET, EMPLOYEE_STATUS_HEADERS);
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === machineId) {
      const statusColumn = EMPLOYEE_STATUS_HEADERS.indexOf("status") + 1;
      const nowIso = payload.clearedAt ? String(payload.clearedAt) : new Date().toISOString();
      sheet.getRange(i + 1, statusColumn, 1, 4).setValues([["cleared", "", nowIso, nowIso]]);
      return;
    }
  }
}

function assertNoDuplicateOeeLog(log, ignoredId, includeMachineSheet) {
  const duplicate = findDuplicateOeeLog(log, ignoredId, includeMachineSheet);
  if (!duplicate) return;
  throw new Error(
    "รายการซ้ำ: วันที่ " +
      formatLegacyDate(log.date) +
      " กะ " +
      toOriginalShift(log.shift) +
      " เครื่อง " +
      (log.machineName || duplicate.machineName || "") +
      " Part No. " +
      (log.partNo || duplicate.partNo || "") +
      " Step " +
      (log.step || duplicate.step || "-") +
      " มีการบันทึกแล้ว"
  );
}

function writeSerializedLogRow(sheet, row, log) {
  ensureRowExists(sheet, row);
  applyTypedRowFormats(sheet, row, LOG_HEADERS, LOG_NUMBER_HEADERS);
  sheet.getRange(row, 1, 1, LOG_HEADERS.length).setValues([
    LOG_HEADERS.map(function(header) {
      return serializeTypedValue(header, log[header], LOG_NUMBER_HEADERS);
    }),
  ]);
}

function serializeTypedValue(header, value, numberHeaders) {
  if (numberHeaders.indexOf(header) >= 0) {
    return numberValue(value);
  }
  if (header === "shift") {
    return String(toOriginalShift(value) || "");
  }
  if (value instanceof Date) {
    return Utilities.formatDate(value, "Asia/Bangkok", "yyyy-MM-dd");
  }
  return value == null ? "" : String(value);
}

function applyTypedRowFormats(sheet, row, headers, numberHeaders) {
  headers.forEach(function(header, index) {
    const range = sheet.getRange(row, index + 1);
    if (numberHeaders.indexOf(header) >= 0) {
      range.setNumberFormat("0.##");
    } else {
      range.setNumberFormat("@");
    }
  });
}

function findDuplicateOeeLog(log, ignoredId, includeMachineSheet) {
  const wantedKey = buildDuplicateOeeLogKey(log);
  const logSheet = ensureSheet(LOG_SHEET, LOG_HEADERS);
  const rows = logSheet.getDataRange().getValues();
  if (rows.length > 1) {
    const headers = rows[0];
    for (let index = 1; index < rows.length; index++) {
      const row = rows[index];
      if (!row.some(function(cell) { return cell !== ""; })) continue;
      const existing = rowToObject(headers, row);
      if (String(existing.id || "") === String(ignoredId || "")) continue;
      if (buildDuplicateOeeLogKey(existing) === wantedKey) return existing;
    }
  }

  if (!includeMachineSheet) return null;
  const book = getWorkbook();
  const machineSheet = findOeeMachineSheet(book, log.machineName);
  if (!machineSheet || machineSheet.getLastRow() < OEE_FIRST_DATA_ROW) return null;
  const layout = getOeeLayout(machineSheet);
  const rowCount = machineSheet.getLastRow() - OEE_FIRST_DATA_ROW + 1;
  const sourceWidth = layout.hasStep ? layout.step : layout.partNo;
  const values = machineSheet.getRange(OEE_FIRST_DATA_ROW, 1, rowCount, sourceWidth).getValues();
  for (let index = 0; index < values.length; index++) {
    const row = values[index];
    const productName = String(row[layout.productName - 1] || "").trim();
    const partNo = String(row[layout.partNo - 1] || "").trim();
    if (!productName || !partNo) continue;
    const existing = {
      date: formatLegacyDate(row[layout.date - 1]),
      shift: toOriginalShift(row[layout.shift - 1]),
      machineName: log.machineName,
      productName: productName,
      partNo: partNo,
      step: layout.hasStep ? String(row[layout.step - 1] || "-").trim() || "-" : "-",
    };
    if (buildDuplicateOeeLogKey(existing) === wantedKey) return existing;
  }
  return null;
}

function listAppUsers() {
  return getUserRows().map(function(item) {
    return toUserSummary(item.user);
  });
}

function signInUser(payload) {
  const username = normalizeUsername(payload.username);
  const passwordHash = String(payload.passwordHash || "");
  const user = getUserRows().map(function(item) { return item.user; }).find(function(item) {
    return item.username === username && item.active !== false;
  });
  if (!user || user.passwordHash !== passwordHash) {
    throw new Error("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
  }
  return {
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    signedInAt: new Date().toISOString(),
  };
}

function createAppUser(payload) {
  const username = normalizeUsername(payload.username);
  const displayName = String(payload.displayName || username).trim() || username;
  const role = String(payload.role || "production").trim();
  const passwordHash = String(payload.passwordHash || "").trim();
  if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
    throw new Error("Username ต้องเป็น a-z, 0-9, จุด, ขีดกลาง หรือ underscore ความยาว 3-32 ตัว");
  }
  if (["admin", "production", "qc", "tooling_repair", "technician"].indexOf(role) < 0) {
    throw new Error("Role ไม่ถูกต้อง");
  }
  if (!passwordHash) {
    throw new Error("Password hash is required");
  }

  const sheet = ensureUsersSheet();
  const users = getUserRows();
  if (users.some(function(item) { return item.user.username === username; })) {
    throw new Error("Username นี้มีอยู่แล้ว");
  }
  sheet.appendRow([username, displayName, role, passwordHash, false, new Date().toISOString(), "", true]);
  return listAppUsers();
}

function changeAppUserPassword(payload) {
  const username = normalizeUsername(payload.username);
  const passwordHash = String(payload.passwordHash || "").trim();
  if (!passwordHash) {
    throw new Error("Password hash is required");
  }
  const sheet = ensureUsersSheet();
  const rows = getUserRows();
  const found = rows.find(function(item) { return item.user.username === username; });
  if (!found) {
    throw new Error("ไม่พบบัญชีผู้ใช้");
  }
  sheet.getRange(found.row, 4).setValue(passwordHash);
  sheet.getRange(found.row, 7).setValue(new Date().toISOString());
  sheet.getRange(found.row, 8).setValue(true);
  return listAppUsers();
}

function updateAppUser(payload) {
  const username = normalizeUsername(payload.username);
  const displayName = String(payload.displayName || "").trim();
  if (!displayName) {
    throw new Error("กรุณากรอกชื่อแสดงผล");
  }
  const sheet = ensureUsersSheet();
  const rows = getUserRows();
  const found = rows.find(function(item) { return item.user.username === username; });
  if (!found) {
    throw new Error("ไม่พบบัญชีผู้ใช้");
  }
  sheet.getRange(found.row, 2).setValue(displayName);
  return listAppUsers();
}

function deleteAppUser(payload) {
  const username = normalizeUsername(payload.username);
  const sheet = ensureUsersSheet();
  const rows = getUserRows();
  const found = rows.find(function(item) { return item.user.username === username; });
  if (!found) {
    throw new Error("ไม่พบบัญชีผู้ใช้");
  }
  if (found.user.builtIn) {
    throw new Error("ไม่สามารถลบบัญชีเริ่มต้นได้");
  }
  sheet.deleteRow(found.row);
  return listAppUsers();
}

function getProductDefaults(payload) {
  const book = getWorkbook();
  const sheet = findOeeMachineSheet(book, payload.machineName);
  if (!sheet) {
    return { minutesPerSlot: OEE_MINUTES_PER_SLOT };
  }
  const layout = getOeeLayout(sheet);
  const row = findOeeProductRow(sheet, layout, {
    productName: payload.productName,
    partNo: payload.partNo,
    step: payload.step || "-",
  });
  if (!row || row < OEE_FIRST_DATA_ROW) {
    return { minutesPerSlot: OEE_MINUTES_PER_SLOT };
  }
  const machineSpeed = numberValue(sheet.getRange(row, layout.theoreticalImpulse).getValue());
  const cavityQty = numberValue(sheet.getRange(row, layout.cavityQty).getValue());
  return {
    machineSpeed: machineSpeed > 0 ? machineSpeed : "",
    cavityQty: cavityQty > 0 ? cavityQty : "",
    minutesPerSlot: OEE_MINUTES_PER_SLOT,
  };
}

function findOeeProductRow(sheet, layout, log) {
  const product = normalizeLookup(log.productName);
  const partNo = normalizeLookup(log.partNo);
  const step = normalizeLookup(log.step || "-");
  const lastRow = sheet.getLastRow();
  if (lastRow < OEE_FIRST_DATA_ROW) return null;

  const width = layout.hasStep ? 3 : 2;
  const values = sheet.getRange(OEE_FIRST_DATA_ROW, layout.productName, lastRow - OEE_FIRST_DATA_ROW + 1, width).getDisplayValues();
  for (let index = values.length - 1; index >= 0; index--) {
    const row = values[index];
    const sameProduct = normalizeLookup(row[0]) === product;
    const samePart = normalizeLookup(row[1]) === partNo;
    const sameStep = !layout.hasStep || normalizeLookup(row[2] || "-") === step;
    if (sameProduct && samePart && sameStep) {
      return OEE_FIRST_DATA_ROW + index;
    }
  }
  return null;
}

function ensureUsersSheet() {
  const sheet = ensureSheet(USER_SHEET, USER_HEADERS);
  const rows = getUserRows(false);
  DEFAULT_USER_ROWS.forEach(function(defaultRow) {
    const username = defaultRow[0];
    if (!rows.some(function(item) { return item.user.username === username; })) {
      sheet.appendRow(defaultRow);
    }
  });
  formatHeader(sheet, USER_HEADERS.length);
  return sheet;
}

function getUserRows(seedDefaults) {
  if (seedDefaults !== false) {
    ensureUsersSheet();
  }
  const sheet = ensureSheet(USER_SHEET, USER_HEADERS);
  const values = sheet.getDataRange().getValues();
  return values.slice(1).map(function(row, index) {
    return {
      row: index + 2,
      user: {
        username: normalizeUsername(row[0]),
        displayName: String(row[1] || row[0] || "").trim(),
        role: String(row[2] || "production").trim(),
        passwordHash: String(row[3] || "").trim(),
        builtIn: row[4] === true || String(row[4]).toLowerCase() === "true",
        createdAt: row[5] ? String(row[5]) : "",
        passwordChangedAt: row[6] ? String(row[6]) : "",
        active: row[7] === "" ? true : row[7] === true || String(row[7]).toLowerCase() === "true",
      },
    };
  }).filter(function(item) {
    return item.user.username && item.user.passwordHash && item.user.active !== false;
  });
}

function toUserSummary(user) {
  return {
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    builtIn: Boolean(user.builtIn),
    createdAt: user.createdAt,
    passwordChangedAt: user.passwordChangedAt,
  };
}

function normalizeUsername(value) {
  return String(value || "").trim().toLowerCase();
}

function appendFormattedOeeRow(log) {
  const book = getWorkbook();
  const sheet = findOeeMachineSheet(book, log.machineName);
  if (!sheet) {
    throw new Error("Machine sheet not found: " + log.machineName);
  }

  ensureOeeEntryTimestampColumns(sheet);
  ensureOeeTestColumn(sheet);
  const layout = getOeeLayout(sheet);
  const targetRow = Math.max(sheet.getLastRow() + 1, OEE_FIRST_DATA_ROW);
  ensureRowExists(sheet, targetRow);

  const templateRow = findOeeTemplateRow(sheet, layout, log, targetRow - 1);
  copyOeeTemplateRow(sheet, templateRow, targetRow);
  writeOeeInputRow(sheet, layout, targetRow, log);

  return { sheetName: sheet.getName(), row: targetRow };
}

function findOeeMachineSheet(book, machineName) {
  if (!machineName) return null;
  const exact = book.getSheetByName(machineName);
  if (exact) return exact;

  const wanted = normalizeSheetName(machineName);
  const sheets = book.getSheets();
  for (let i = 0; i < sheets.length; i++) {
    if (normalizeSheetName(sheets[i].getName()) === wanted) {
      return sheets[i];
    }
  }
  return null;
}

function normalizeSheetName(value) {
  return String(value || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function getOeeLayout(sheet) {
  const headers = sheet.getRange(OEE_HEADER_ROW, 1, 1, Math.min(sheet.getLastColumn(), 60)).getDisplayValues()[0];
  const hasEntryTimestamp = isOeeEntryTimestampHeader(headers[1], headers[2]);
  const offset = hasEntryTimestamp ? 2 : 0;
  const hasStep = String(headers[5 + offset] || "").toLowerCase().indexOf("step") >= 0;
  const detected = detectOeeOutputColumns(headers);
  const layout = hasStep
    ? {
      hasStep: true,
      hasEntryTimestamp: hasEntryTimestamp,
      sequence: 1,
      entryDate: hasEntryTimestamp ? 2 : 0,
      entryTime: hasEntryTimestamp ? 3 : 0,
      date: 2 + offset,
      shift: 3 + offset,
      productName: 4 + offset,
      partNo: 5 + offset,
      step: 6 + offset,
      normalSlot: 7 + offset,
      downtimeStart: 8 + offset,
      normalMinutes: 16 + offset,
      goodQty: detected.goodQty || 25 + offset,
      ngQty: detected.ngQty || 26 + offset,
      testQty: detected.testQty || 27 + offset,
      totalQty: detected.totalQty || 28 + offset,
      theoreticalImpulse: detected.theoreticalImpulse || 29 + offset,
      cavityQty: detected.cavityQty || 30 + offset,
    }
    : {
      hasStep: false,
      hasEntryTimestamp: hasEntryTimestamp,
      sequence: 1,
      entryDate: hasEntryTimestamp ? 2 : 0,
      entryTime: hasEntryTimestamp ? 3 : 0,
      date: 2 + offset,
      shift: 3 + offset,
      productName: 4 + offset,
      partNo: 5 + offset,
      normalSlot: 6 + offset,
      downtimeStart: 7 + offset,
      normalMinutes: 15 + offset,
      goodQty: detected.goodQty || 24 + offset,
      ngQty: detected.ngQty || 25 + offset,
      testQty: detected.testQty || 26 + offset,
      totalQty: detected.totalQty || 27 + offset,
      theoreticalImpulse: detected.theoreticalImpulse || 28 + offset,
      cavityQty: detected.cavityQty || 29 + offset,
    };
  layout.theoreticalEffectiveTime = detected.theoreticalEffectiveTime || layout.cavityQty + 1;
  layout.totalProductionTime = detected.totalProductionTime || layout.cavityQty + 2;
  layout.equipmentUtilizationRate = detected.equipmentUtilizationRate || layout.cavityQty + 3;
  layout.passRate = detected.passRate || layout.cavityQty + 4;
  layout.timeUtilizationRate = detected.timeUtilizationRate || layout.cavityQty + 5;
  layout.oeeRate = detected.oeeRate || layout.cavityQty + 6;
  return layout;
}

function detectOeeOutputColumns(headers) {
  const result = {};
  headers.forEach(function(header, index) {
    const text = normalizeHeaderText(header);
    const column = index + 1;
    if (!result.goodQty && text.indexOf("good") >= 0) result.goodQty = column;
    if (
      !result.ngQty &&
      (
        text.indexOf("不合格") >= 0 ||
        text.indexOf("ng quantity") >= 0 ||
        text.indexOf("ng quant") >= 0 ||
        text === "ng" ||
        /\bng\b/.test(text)
      )
    ) result.ngQty = column;
    if (!result.testQty && (text.indexOf("test") >= 0 || text.indexOf("ทดสอบ") >= 0)) result.testQty = column;
    if (!result.totalQty && text.indexOf("total") >= 0 && text.indexOf("quantity") >= 0) result.totalQty = column;
    if (!result.theoreticalImpulse && (text.indexOf("theoretical") >= 0 || text.indexOf("impulse") >= 0)) result.theoreticalImpulse = column;
    if (!result.cavityQty && (text.indexOf("cavity") >= 0 || text.indexOf("cavities") >= 0)) result.cavityQty = column;
    if (!result.theoreticalEffectiveTime && text.indexOf("theoretical effective production time") >= 0) result.theoreticalEffectiveTime = column;
    if (!result.totalProductionTime && text.indexOf("total production time") >= 0) result.totalProductionTime = column;
    if (!result.equipmentUtilizationRate && text.indexOf("equipment utilization") >= 0) result.equipmentUtilizationRate = column;
    if (!result.passRate && text.indexOf("pass rate") >= 0) result.passRate = column;
    if (!result.timeUtilizationRate && text.indexOf("time utilization") >= 0) result.timeUtilizationRate = column;
    if (!result.oeeRate && text.indexOf("oee") >= 0) result.oeeRate = column;
  });
  return result;
}

function normalizeHeaderText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function isOeeEntryTimestampHeader(entryDateHeader, entryTimeHeader) {
  const dateText = String(entryDateHeader || "").toLowerCase();
  const timeText = String(entryTimeHeader || "").toLowerCase();
  return (
    dateText.indexOf("กรอกยอด") >= 0 ||
    dateText.indexOf("entry date") >= 0 ||
    timeText.indexOf("เวลากรอก") >= 0 ||
    timeText.indexOf("entry time") >= 0
  );
}

function ensureOeeEntryTimestampColumns(sheet) {
  const headers = sheet.getRange(OEE_HEADER_ROW, 1, 1, Math.min(sheet.getLastColumn(), 60)).getDisplayValues()[0];
  if (isOeeEntryTimestampHeader(headers[1], headers[2])) return false;

  sheet.insertColumnsAfter(1, 2);
  const headerRange = sheet.getRange(OEE_HEADER_ROW, 2, 1, 2);
  const styleSource = sheet.getRange(OEE_HEADER_ROW, 4, 1, 1);
  styleSource.copyTo(headerRange, { contentsOnly: false });
  headerRange.setValues([[OEE_ENTRY_DATE_HEADER, OEE_ENTRY_TIME_HEADER]]);
  headerRange
    .setBackground("#fbbc04")
    .setFontColor("#000000")
    .setFontWeight("bold")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setWrap(true);
  sheet.setColumnWidth(2, 105);
  sheet.setColumnWidth(3, 90);
  if (sheet.getLastRow() >= OEE_FIRST_DATA_ROW) {
    const rowCount = sheet.getLastRow() - OEE_FIRST_DATA_ROW + 1;
    sheet.getRange(OEE_FIRST_DATA_ROW, 2, rowCount, 1).setNumberFormat("yyyy-mm-dd");
    sheet.getRange(OEE_FIRST_DATA_ROW, 3, rowCount, 1).setNumberFormat("@");
  }
  return true;
}

function migrateOeeEntryTimestampColumns() {
  const book = getWorkbook();
  const machineByName = getMachineMap();
  let sheets = 0;
  let inserted = 0;
  book.getSheets().forEach(function(sheet) {
    const machine = machineByName[normalizeSheetName(sheet.getName())];
    if (!machine || sheet.getLastRow() < OEE_HEADER_ROW) return;
    sheets++;
    if (ensureOeeEntryTimestampColumns(sheet)) inserted++;
  });
  return { sheets: sheets, inserted: inserted };
}

function ensureOeeTestColumn(sheet) {
  const headers = sheet.getRange(OEE_HEADER_ROW, 1, 1, Math.min(sheet.getLastColumn(), 80)).getDisplayValues()[0];
  const detected = detectOeeOutputColumns(headers);
  if (detected.testQty) return false;
  if (!detected.ngQty || !detected.totalQty || detected.ngQty >= detected.totalQty) return false;

  sheet.insertColumnAfter(detected.ngQty);
  const testColumn = detected.ngQty + 1;
  const headerRange = sheet.getRange(OEE_HEADER_ROW, testColumn);
  sheet.getRange(OEE_HEADER_ROW, detected.ngQty).copyTo(headerRange, { contentsOnly: false });
  headerRange
    .setValue(OEE_TEST_HEADER)
    .setBackground("#fbbc04")
    .setFontColor("#d00000")
    .setFontWeight("bold")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setWrap(true);
  sheet.setColumnWidth(testColumn, Math.max(sheet.getColumnWidth(detected.ngQty), 72));
  if (sheet.getLastRow() >= OEE_FIRST_DATA_ROW) {
    const rowCount = sheet.getLastRow() - OEE_FIRST_DATA_ROW + 1;
    sheet.getRange(OEE_FIRST_DATA_ROW, testColumn, rowCount, 1).clearContent().setNumberFormat("0.##");
  }
  return true;
}

function migrateOeeTestColumns() {
  const book = getWorkbook();
  const machineByName = getMachineMap();
  let sheets = 0;
  let inserted = 0;
  let totalFormulas = 0;
  book.getSheets().forEach(function(sheet) {
    const machine = machineByName[normalizeSheetName(sheet.getName())];
    if (!machine || sheet.getLastRow() < OEE_HEADER_ROW) return;
    sheets++;
    ensureOeeEntryTimestampColumns(sheet);
    if (ensureOeeTestColumn(sheet)) inserted++;
    const layout = getOeeLayout(sheet);
    if (sheet.getLastRow() >= OEE_FIRST_DATA_ROW) {
      const rowCount = sheet.getLastRow() - OEE_FIRST_DATA_ROW + 1;
      const formulas = [];
      for (let index = 0; index < rowCount; index++) {
        formulas.push([buildTotalQuantityFormula(OEE_FIRST_DATA_ROW + index, layout)]);
      }
      sheet.getRange(OEE_FIRST_DATA_ROW, layout.totalQty, rowCount, 1).setFormulas(formulas);
      sheet.getRange(OEE_FIRST_DATA_ROW, layout.goodQty, rowCount, 3).setNumberFormat("0.##");
      totalFormulas += rowCount;
    }
  });
  return { sheets: sheets, inserted: inserted, totalFormulas: totalFormulas };
}

function ensureRowExists(sheet, row) {
  if (row > sheet.getMaxRows()) {
    sheet.insertRowsAfter(sheet.getMaxRows(), row - sheet.getMaxRows());
  }
}

function findOeeTemplateRow(sheet, layout, log, lastDataRow) {
  const product = normalizeLookup(log.productName);
  const partNo = normalizeLookup(log.partNo);
  const step = normalizeLookup(log.step || "-");

  for (let row = lastDataRow; row >= OEE_FIRST_DATA_ROW; row--) {
    const width = layout.hasStep ? 3 : 2;
    const values = sheet.getRange(row, layout.productName, 1, width).getDisplayValues()[0];
    const sameProduct = normalizeLookup(values[0]) === product;
    const samePart = normalizeLookup(values[1]) === partNo;
    const sameStep = !layout.hasStep || normalizeLookup(values[2] || "-") === step;
    if (sameProduct && samePart && sameStep) {
      return row;
    }
  }

  return Math.max(lastDataRow, OEE_FIRST_DATA_ROW);
}

function normalizeLookup(value) {
  return String(value == null ? "" : value).trim().replace(/\s+/g, " ").toLowerCase();
}

function copyOeeTemplateRow(sheet, templateRow, targetRow) {
  if (templateRow < OEE_FIRST_DATA_ROW || templateRow === targetRow) return;
  const lastColumn = sheet.getLastColumn();
  sheet
    .getRange(templateRow, 1, 1, lastColumn)
    .copyTo(sheet.getRange(targetRow, 1, 1, lastColumn), { contentsOnly: false });
  sheet.setRowHeight(targetRow, sheet.getRowHeight(templateRow));
}

function writeOeeInputRow(sheet, layout, row, log) {
  const minutesPerSlot = numberValue(log.minutesPerSlot) || OEE_MINUTES_PER_SLOT;
  const downtimeSlots = [
    minutesToSheetSlots(log.changeoverMinutes, minutesPerSlot),
    minutesToSheetSlots(log.inspectionMinutes, minutesPerSlot),
    minutesToSheetSlots(log.equipmentRepairMinutes, minutesPerSlot),
    minutesToSheetSlots(log.moldRepairMinutes, minutesPerSlot),
    minutesToSheetSlots(log.materialChangeMinutes, minutesPerSlot),
    minutesToSheetSlots(log.emergencyStopMinutes, minutesPerSlot),
    minutesToSheetSlots(log.meetingMinutes, minutesPerSlot),
    minutesToSheetSlots(log.plannedStopMinutes, minutesPerSlot),
  ];
  const workMinutes = Number(log.workMinutes || 0) || (Number(log.normalMinutes || 0) + sumValues([
    log.changeoverMinutes,
    log.inspectionMinutes,
    log.equipmentRepairMinutes,
    log.moldRepairMinutes,
    log.materialChangeMinutes,
    log.emergencyStopMinutes,
    log.meetingMinutes,
    log.plannedStopMinutes,
  ]));
  const workSlots = roundNumber(workMinutes / minutesPerSlot);

  sheet.getRange(row, layout.sequence).setFormula("=ROW()-ROW($A$3)");
  if (layout.entryDate) {
    sheet
      .getRange(row, layout.entryDate)
      .setNumberFormat("yyyy-mm-dd")
      .setValue(parseSheetDate(formatRecordDate(log.recordDate) || todayBangkok(new Date())));
  }
  if (layout.entryTime) {
    sheet
      .getRange(row, layout.entryTime)
      .setNumberFormat("@")
      .setValue(formatRecordTime(log.recordTime) || timeBangkok(new Date()));
  }
  sheet.getRange(row, layout.date).setNumberFormat("yyyy-mm-dd").setValue(parseSheetDate(log.date));
  sheet.getRange(row, layout.shift).setNumberFormat("@").setValue(String(toOriginalShift(log.shift) || ""));
  sheet.getRange(row, layout.productName).setNumberFormat("@").setValue(String(log.productName || ""));
  sheet.getRange(row, layout.partNo).setNumberFormat("@").setValue(String(log.partNo || ""));
  if (layout.hasStep) {
    sheet.getRange(row, layout.step).setNumberFormat("@").setValue(String(log.step || "-"));
  }

  sheet.getRange(row, layout.normalSlot).setFormula(buildNormalSlotFormula(row, layout, workSlots));
  sheet.getRange(row, layout.downtimeStart, 1, downtimeSlots.length).setNumberFormat("0.##");
  sheet.getRange(row, layout.downtimeStart, 1, downtimeSlots.length).setValues([downtimeSlots]);
  sheet.getRange(row, layout.normalMinutes, 1, 9).setFormulas([
    Array.from({ length: 9 }, function(_, index) {
      return buildSlotToMinuteFormula(row, layout.normalSlot + index);
    }),
  ]);
  sheet.getRange(row, layout.goodQty).setNumberFormat("0.##").setValue(numberValue(log.goodQty));
  sheet.getRange(row, layout.ngQty).setNumberFormat("0.##").setValue(numberValue(log.ngQty));
  sheet
    .getRange(row, layout.testQty)
    .setNumberFormat("0.##")
    .setValue(numberValue(log.testQty) > 0 ? numberValue(log.testQty) : "");
  sheet.getRange(row, layout.totalQty).setFormula(buildTotalQuantityFormula(row, layout));
  sheet.getRange(row, layout.theoreticalEffectiveTime, 1, 6).setFormulas([
    buildOeeComputedFormulas(row, layout),
  ]);

  sheet.getRange(row, layout.theoreticalImpulse).setNumberFormat("0.##").setValue(numberValue(log.machineSpeed));
  sheet.getRange(row, layout.cavityQty).setNumberFormat("0.##").setValue(numberValue(log.cavityQty));
  sheet.getRange(row, layout.equipmentUtilizationRate, 1, 4).setNumberFormat("0.00%");
}

function repairOeeFormulas() {
  const book = getWorkbook();
  const machineByName = getMachineMap();
  const loggedTestValues = getLoggedTestValueMap();
  let sheetCount = 0;
  let testValueCount = 0;
  let normalFormulaCount = 0;
  let minuteFormulaCount = 0;
  let totalFormulaCount = 0;
  let computedFormulaCount = 0;

  book.getSheets().forEach(function(sheet) {
    const machine = machineByName[normalizeSheetName(sheet.getName())];
    if (!machine || sheet.getLastRow() < OEE_FIRST_DATA_ROW) return;
    ensureOeeEntryTimestampColumns(sheet);
    ensureOeeTestColumn(sheet);

    const layout = getOeeLayout(sheet);
    const rowCount = sheet.getLastRow() - OEE_FIRST_DATA_ROW + 1;
    const width = layout.partNo - layout.productName + 1;
    const identityValues = sheet.getRange(OEE_FIRST_DATA_ROW, layout.productName, rowCount, width).getDisplayValues();
    const sourceWidth = layout.hasStep ? layout.step : layout.partNo;
    const sourceValues = sheet.getRange(OEE_FIRST_DATA_ROW, 1, rowCount, sourceWidth).getValues();
    const testRange = sheet.getRange(OEE_FIRST_DATA_ROW, layout.testQty, rowCount, 1);
    const testValues = testRange.getValues();
    const testFormulas = testRange.getFormulas();
    const normalSlotRange = sheet.getRange(OEE_FIRST_DATA_ROW, layout.normalSlot, rowCount, 1);
    const normalSlotValues = normalSlotRange.getValues();
    const normalSlotFormulas = normalSlotRange.getFormulas();
    const downtimeSlotValues = sheet.getRange(OEE_FIRST_DATA_ROW, layout.downtimeStart, rowCount, 8).getValues();
    const minuteRange = sheet.getRange(OEE_FIRST_DATA_ROW, layout.normalMinutes, rowCount, 9);
    const minuteFormulas = minuteRange.getFormulas();
    const totalRange = sheet.getRange(OEE_FIRST_DATA_ROW, layout.totalQty, rowCount, 1);
    const totalFormulas = totalRange.getFormulas();
    const computedRange = sheet.getRange(OEE_FIRST_DATA_ROW, layout.theoreticalEffectiveTime, rowCount, 6);
    const computedFormulas = computedRange.getFormulas();
    let testChanged = false;
    let normalChanged = false;
    let minuteChanged = false;
    let totalChanged = false;
    let computedChanged = false;

    sheetCount++;
    for (let index = 0; index < rowCount; index++) {
      const row = OEE_FIRST_DATA_ROW + index;
      const productName = String(identityValues[index][0] || "").trim();
      const partNo = String(identityValues[index][width - 1] || "").trim();
      if (!productName || !partNo) continue;

      const logKey = buildOeeLogKey({
        date: formatLegacyDate(sourceValues[index][layout.date - 1]),
        shift: toOriginalShift(sourceValues[index][layout.shift - 1]),
        machineName: machine.name,
        productName: productName,
        partNo: partNo,
        step: layout.hasStep ? String(sourceValues[index][layout.step - 1] || "-").trim() || "-" : "-",
      });
      if (Object.prototype.hasOwnProperty.call(loggedTestValues, logKey)) {
        const loggedTest = loggedTestValues[logKey];
        const nextTestValue = numberValue(loggedTest) > 0 ? numberValue(loggedTest) : "";
        if (testFormulas[index][0] || testValues[index][0] !== nextTestValue) {
          testValues[index][0] = nextTestValue;
          testValueCount++;
          testChanged = true;
        }
      } else if (testFormulas[index][0]) {
        testValues[index][0] = "";
        testValueCount++;
        testChanged = true;
      }

      const workSlots = readWorkSlotsFromNormalFormula(
        normalSlotFormulas[index][0],
        normalSlotValues[index][0],
        downtimeSlotValues[index],
      );
      const expectedNormalFormula = buildNormalSlotFormula(row, layout, workSlots);
      if (normalSlotFormulas[index][0] !== expectedNormalFormula) {
        normalSlotFormulas[index][0] = expectedNormalFormula;
        normalFormulaCount++;
        normalChanged = true;
      }

      const expectedMinuteFormulas = Array.from({ length: 9 }, function(_, minuteIndex) {
        return buildSlotToMinuteFormula(row, layout.normalSlot + minuteIndex);
      });
      for (let minuteIndex = 0; minuteIndex < expectedMinuteFormulas.length; minuteIndex++) {
        if (minuteFormulas[index][minuteIndex] !== expectedMinuteFormulas[minuteIndex]) {
          minuteFormulas[index][minuteIndex] = expectedMinuteFormulas[minuteIndex];
          minuteFormulaCount++;
          minuteChanged = true;
        }
      }

      const expectedFormula = buildTotalQuantityFormula(row, layout);
      if (totalFormulas[index][0] !== expectedFormula) {
        totalFormulas[index][0] = expectedFormula;
        totalFormulaCount++;
        totalChanged = true;
      }

      const expectedComputedFormulas = buildOeeComputedFormulas(row, layout);
      for (let computedIndex = 0; computedIndex < expectedComputedFormulas.length; computedIndex++) {
        if (computedFormulas[index][computedIndex] !== expectedComputedFormulas[computedIndex]) {
          computedFormulas[index][computedIndex] = expectedComputedFormulas[computedIndex];
          computedFormulaCount++;
          computedChanged = true;
        }
      }
    }

    if (testChanged) {
      testRange.setValues(testValues);
    }
    if (normalChanged) {
      normalSlotRange.setFormulas(normalSlotFormulas);
    }
    if (minuteChanged) {
      minuteRange.setFormulas(minuteFormulas).setNumberFormat("0.00");
    }
    if (totalChanged) {
      totalRange.setFormulas(totalFormulas);
    }
    if (computedChanged) {
      computedRange.setFormulas(computedFormulas);
      sheet.getRange(OEE_FIRST_DATA_ROW, layout.equipmentUtilizationRate, rowCount, 4).setNumberFormat("0.00%");
    }
  });

  return {
    sheets: sheetCount,
    testValues: testValueCount,
    normalFormulas: normalFormulaCount,
    minuteFormulas: minuteFormulaCount,
    totalFormulas: totalFormulaCount,
    computedFormulas: computedFormulaCount,
  };
}

function repairSheetTypes() {
  const book = getWorkbook();
  let typedRows = 0;
  let typedSheets = 0;

  typedRows += rewriteTypedDataRows(ensureSheet(LOG_SHEET, LOG_HEADERS), LOG_HEADERS, LOG_NUMBER_HEADERS);
  typedSheets++;
  typedRows += rewriteTypedDataRows(ensureSheet(MACHINE_SHEET, MACHINE_HEADERS), MACHINE_HEADERS, MACHINE_NUMBER_HEADERS);
  typedSheets++;
  typedRows += rewriteTypedDataRows(ensureSheet(PRODUCT_MASTER_SHEET, PRODUCT_MASTER_HEADERS), PRODUCT_MASTER_HEADERS, PRODUCT_NUMBER_HEADERS);
  typedSheets++;

  const machineByName = getMachineMap();
  book.getSheets().forEach(function(sheet) {
    const machine = machineByName[normalizeSheetName(sheet.getName())];
    if (!machine || sheet.getLastRow() < OEE_FIRST_DATA_ROW) return;
    ensureOeeEntryTimestampColumns(sheet);
    ensureOeeTestColumn(sheet);
    const layout = getOeeLayout(sheet);
    const rowCount = sheet.getLastRow() - OEE_FIRST_DATA_ROW + 1;
    if (layout.entryDate) sheet.getRange(OEE_FIRST_DATA_ROW, layout.entryDate, rowCount, 1).setNumberFormat("yyyy-mm-dd");
    if (layout.entryTime) sheet.getRange(OEE_FIRST_DATA_ROW, layout.entryTime, rowCount, 1).setNumberFormat("@");
    sheet.getRange(OEE_FIRST_DATA_ROW, layout.date, rowCount, 1).setNumberFormat("yyyy-mm-dd");
    sheet.getRange(OEE_FIRST_DATA_ROW, layout.shift, rowCount, 1).setNumberFormat("@");
    sheet.getRange(OEE_FIRST_DATA_ROW, layout.productName, rowCount, 1).setNumberFormat("@");
    sheet.getRange(OEE_FIRST_DATA_ROW, layout.partNo, rowCount, 1).setNumberFormat("@");
    if (layout.hasStep) {
      sheet.getRange(OEE_FIRST_DATA_ROW, layout.step, rowCount, 1).setNumberFormat("@");
    }
    sheet.getRange(OEE_FIRST_DATA_ROW, layout.downtimeStart, rowCount, 8).setNumberFormat("0.##");
    sheet.getRange(OEE_FIRST_DATA_ROW, layout.goodQty, rowCount, 3).setNumberFormat("0.##");
    sheet.getRange(OEE_FIRST_DATA_ROW, layout.theoreticalImpulse, rowCount, 1).setNumberFormat("0.##");
    sheet.getRange(OEE_FIRST_DATA_ROW, layout.cavityQty, rowCount, 1).setNumberFormat("0.##");
    typedSheets++;
  });

  return { sheets: typedSheets, rows: typedRows };
}

function rewriteTypedDataRows(sheet, headers, numberHeaders) {
  applySheetTypeFormats(sheet, headers, numberHeaders);
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return 0;
  const values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  const rewritten = values.map(function(row) {
    return headers.map(function(header, index) {
      return serializeTypedValue(header, row[index], numberHeaders);
    });
  });
  sheet.getRange(2, 1, rewritten.length, headers.length).setValues(rewritten);
  return rewritten.length;
}

function getLoggedTestValueMap() {
  const sheet = ensureSheet(LOG_SHEET, LOG_HEADERS);
  const rows = sheet.getDataRange().getValues();
  const map = {};
  if (rows.length <= 1) return map;

  const headers = rows[0];
  rows.slice(1).forEach(function(row) {
    if (!row.some(function(cell) { return cell !== ""; })) return;
    const log = rowToObject(headers, row);
    const testQty = numberValue(log.testQty);
    if (testQty <= 0) return;
    map[buildOeeLogKey(log)] = testQty;
  });
  return map;
}

function buildOeeLogKey(log) {
  return [
    formatLegacyDate(log.date),
    toOriginalShift(log.shift),
    normalizeSheetName(log.machineName),
    normalizeLookup(log.productName),
    normalizeLookup(log.partNo),
    normalizeLookup(log.step || "-"),
  ].join("::");
}

function buildDuplicateOeeLogKey(log) {
  return [
    formatLegacyDate(log.date),
    toOriginalShift(log.shift),
    normalizeSheetName(log.machineName),
    normalizeLookup(log.partNo),
    normalizeLookup(log.step || "-"),
  ].join("::");
}

function minutesToSheetSlots(value, minutesPerSlot) {
  return roundNumber(numberValue(value) / (numberValue(minutesPerSlot) || OEE_MINUTES_PER_SLOT));
}

function numberValue(value) {
  const number = Number(value || 0);
  return isFinite(number) ? number : 0;
}

function sumValues(values) {
  return values.reduce((sum, value) => sum + numberValue(value), 0);
}

function roundNumber(value) {
  return Math.round(numberValue(value) * 100) / 100;
}

function buildNormalSlotFormula(row, layout, workSlots) {
  const parts = [];
  for (let index = 0; index < 8; index++) {
    const cell = columnToLetter(layout.downtimeStart + index) + row;
    if (index === 6) {
      parts.push("MAX(" + cell + "-" + getBreakSlots() + ",0)");
    } else {
      parts.push(cell);
    }
  }
  return "=" + workSlots + "-" + parts.join("-");
}

function buildSlotToMinuteFormula(row, slotColumn) {
  return "=" + columnToLetter(slotColumn) + row + "*" + OEE_MINUTES_PER_SLOT;
}

function buildTotalQuantityFormula(row, layout) {
  return [
    "=",
    columnToLetter(layout.goodQty),
    row,
    "+",
    columnToLetter(layout.ngQty),
    row,
    "+",
    columnToLetter(layout.testQty),
    row,
  ].join("");
}

function buildTheoreticalEffectiveTimeFormula(row, layout) {
  return "=IFERROR(" +
    columnToLetter(layout.totalQty) + row +
    "/(" + columnToLetter(layout.theoreticalImpulse) + row +
    "*" + columnToLetter(layout.cavityQty) + row + "),0)";
}

function buildTotalProductionTimeFormula(row, layout) {
  const normalColumn = layout.normalMinutes;
  const downtimeColumn = layout.normalMinutes + 1;
  const cells = [
    columnToLetter(normalColumn) + row,
    columnToLetter(downtimeColumn) + row,
    columnToLetter(downtimeColumn + 1) + row,
    columnToLetter(downtimeColumn + 2) + row,
    columnToLetter(downtimeColumn + 3) + row,
    columnToLetter(downtimeColumn + 4) + row,
    columnToLetter(downtimeColumn + 5) + row,
    "MAX(" + columnToLetter(downtimeColumn + 6) + row + "-" + OEE_SHIFT_BREAK_MINUTES + ",0)",
    columnToLetter(downtimeColumn + 7) + row,
  ];
  return "=IFERROR(" + cells.join("+") + ",0)";
}

function buildEquipmentUtilizationRateFormula(row, layout) {
  return "=IFERROR(" +
    columnToLetter(layout.theoreticalEffectiveTime) + row +
    "/" + columnToLetter(layout.normalMinutes) + row +
    ",0)";
}

function buildPassRateFormula(row, layout) {
  return "=IFERROR(" +
    columnToLetter(layout.goodQty) + row +
    "/(" + columnToLetter(layout.goodQty) + row +
    "+" + columnToLetter(layout.ngQty) + row + "),0)";
}

function buildTimeUtilizationRateFormula(row, layout) {
  return "=IFERROR(" +
    columnToLetter(layout.normalMinutes) + row +
    "/" + columnToLetter(layout.totalProductionTime) + row +
    ",0)";
}

function buildOeeRateFormula(row, layout) {
  return "=IFERROR(" +
    columnToLetter(layout.passRate) + row +
    "*" + columnToLetter(layout.timeUtilizationRate) + row +
    ",0)";
}

function buildOeeComputedFormulas(row, layout) {
  return [
    buildTheoreticalEffectiveTimeFormula(row, layout),
    buildTotalProductionTimeFormula(row, layout),
    buildEquipmentUtilizationRateFormula(row, layout),
    buildPassRateFormula(row, layout),
    buildTimeUtilizationRateFormula(row, layout),
    buildOeeRateFormula(row, layout),
  ];
}

function readWorkSlotsFromNormalFormula(formula, normalSlotValue, downtimeSlots) {
  const match = String(formula || "").match(/^=\s*([0-9]+(?:\.[0-9]+)?)/);
  if (match) return numberValue(match[1]);
  return roundNumber(numberValue(normalSlotValue) + sumValues(downtimeSlots || []));
}

function getBreakSlots() {
  return roundNumber(OEE_SHIFT_BREAK_MINUTES / OEE_MINUTES_PER_SLOT);
}

function columnToLetter(column) {
  let letter = "";
  while (column > 0) {
    const modulo = (column - 1) % 26;
    letter = String.fromCharCode(65 + modulo) + letter;
    column = Math.floor((column - modulo) / 26);
  }
  return letter;
}

function parseSheetDate(value) {
  const text = String(value || "");
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value || "";
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function toOriginalShift(value) {
  const text = String(value || "").trim();
  const lower = text.toLowerCase();
  if (text === "白" || text === "็ฝ" || lower === "day" || text.toUpperCase() === "A" || lower.indexOf("day") >= 0 || text.indexOf("เช้า") >= 0 || text.indexOf("กลางวัน") >= 0) return "白";
  if (text === "夜" || text === "ๅค\u009c" || lower === "night" || text.toUpperCase() === "B" || lower.indexOf("night") >= 0 || text.indexOf("ดึก") >= 0 || text.indexOf("กลางคืน") >= 0) return "夜";
  return text;
}

function isNightShift(shift) {
  return toOriginalShift(shift) === "夜";
}

function getLogs(limit) {
  const sheet = ensureSheet(LOG_SHEET, LOG_HEADERS);
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return getLegacyOeeLogs().slice(0, limit);
  const headers = values[0];
  const productionLogs = values
    .slice(1)
    .filter((row) => row.some((cell) => cell !== ""))
    .map((row) => rowToObject(headers, row))
    .filter(isUsableLog)
    .reverse();
  return mergeLogs(productionLogs, getLegacyOeeLogs()).slice(0, limit);
}

function refreshKpiSheets() {
  const book = getWorkbook();
  const refreshedAt = new Date().toISOString();
  const rawLogs = getLogs(100000);
  const logs = dedupeKpiLogs(rawLogs);
  const duplicateRowsRemoved = rawLogs.length - logs.length;
  const machineRows = buildKpiMachineRows(logs);
  const machineStepRows = buildKpiMachineStepRows(logs);
  const machineJobStepRows = buildKpiMachineJobStepRows(logs);
  const dailyRows = buildKpiDailyRows(logs);
  const mainTarget = writeKpiReportToBook(
    book,
    logs,
    machineRows,
    machineStepRows,
    machineJobStepRows,
    dailyRows,
    rawLogs.length,
    duplicateRowsRemoved,
    refreshedAt,
    true
  );
  const pdTargets = writeKpiReportsToPdBooks(
    logs,
    machineRows,
    machineStepRows,
    machineJobStepRows,
    dailyRows,
    rawLogs.length,
    duplicateRowsRemoved,
    refreshedAt
  );

  return {
    spreadsheetId: book.getId(),
    spreadsheetUrl: book.getUrl(),
    refreshedAt: refreshedAt,
    rowsDownloaded: rawLogs.length,
    rowsUsed: logs.length,
    duplicateRowsRemoved: duplicateRowsRemoved,
    machineGroups: machineRows.length,
    machineStepGroups: machineStepRows.length,
    machineJobStepGroups: machineJobStepRows.length,
    dailyRows: dailyRows.length,
    sheets: [
      KPI_DASHBOARD_SHEET,
      KPI_MACHINE_SHEET,
      KPI_MACHINE_STEP_SHEET,
      KPI_MACHINE_JOB_STEP_SHEET,
      KPI_DAILY_DETAIL_SHEET,
      KPI_NOTES_SHEET,
    ],
    targets: [mainTarget].concat(pdTargets),
  };
}

function writeKpiReportToBook(book, logs, machineRows, machineStepRows, machineJobStepRows, dailyRows, rawCount, duplicateRowsRemoved, refreshedAt, includeDailyDetail) {
  const sheets = [
    KPI_DASHBOARD_SHEET,
    KPI_MACHINE_SHEET,
    KPI_MACHINE_STEP_SHEET,
    KPI_MACHINE_JOB_STEP_SHEET,
    KPI_NOTES_SHEET,
  ];
  writeKpiDashboardSheet(book, logs, machineRows, machineStepRows, machineJobStepRows, rawCount, duplicateRowsRemoved, refreshedAt);
  writeKpiSheet(book, KPI_MACHINE_SHEET, getKpiMachineHeaders(), machineRows, getKpiMachineFormatRules());
  writeKpiSheet(book, KPI_MACHINE_STEP_SHEET, getKpiMachineStepHeaders(), machineStepRows, getKpiMachineStepFormatRules());
  writeKpiSheet(book, KPI_MACHINE_JOB_STEP_SHEET, getKpiMachineJobStepHeaders(), machineJobStepRows, getKpiMachineJobStepFormatRules());
  if (includeDailyDetail) {
    writeKpiSheet(book, KPI_DAILY_DETAIL_SHEET, getKpiDailyHeaders(), dailyRows, getKpiDailyFormatRules());
    sheets.splice(4, 0, KPI_DAILY_DETAIL_SHEET);
  }
  writeKpiSheet(book, KPI_NOTES_SHEET, ["Item", "Detail"], buildKpiNotesRows(refreshedAt, rawCount, rawCount - duplicateRowsRemoved, duplicateRowsRemoved), []);
  return {
    ok: true,
    spreadsheetId: book.getId(),
    spreadsheetUrl: book.getUrl(),
    sheets: sheets,
  };
}

function writeKpiReportsToPdBooks(logs, machineRows, machineStepRows, machineJobStepRows, dailyRows, rawCount, duplicateRowsRemoved, refreshedAt) {
  return PD_EXTERNAL_SHEETS.map(function(source) {
    try {
      const book = SpreadsheetApp.openById(source.id);
      const result = writeKpiReportToBook(
        book,
        logs,
        machineRows,
        machineStepRows,
        machineJobStepRows,
        dailyRows,
        rawCount,
        duplicateRowsRemoved,
        refreshedAt,
        false
      );
      result.label = source.label;
      result.gid = source.gid || "";
      return result;
    } catch (error) {
      return {
        ok: false,
        label: source.label,
        spreadsheetId: source.id,
        spreadsheetUrl: source.url,
        gid: source.gid || "",
        error: String(error && error.message ? error.message : error),
      };
    }
  });
}

function dedupeKpiLogs(rawLogs) {
  const map = {};
  rawLogs.forEach(function(raw) {
    const log = normalizeKpiLog(raw);
    if (!log.date || !log.machineId || !log.partKey) return;
    const key = [
      log.date,
      log.shiftStartAt || log.shift,
      log.machineId,
      log.productKey,
      log.partKey,
      log.stepKey,
    ].join("|");
    map[key] = map[key] ? preferKpiLog(map[key], log) : log;
  });

  return Object.keys(map)
    .map(function(key) { return map[key]; })
    .sort(function(a, b) {
      return (
        a.date.localeCompare(b.date) ||
        a.machineName.localeCompare(b.machineName, undefined, { numeric: true }) ||
        a.partNo.localeCompare(b.partNo, undefined, { numeric: true }) ||
        a.step.localeCompare(b.step, undefined, { numeric: true })
      );
    });
}

function normalizeKpiLog(raw) {
  const workMinutes = numberValue(raw.workMinutes);
  const machineSpeed = numberValue(raw.machineSpeed);
  const cavityQty = numberValue(raw.cavityQty) || 1;
  const goodQty = numberValue(raw.goodQty);
  const ngQty = numberValue(raw.ngQty);
  const testQty = numberValue(raw.testQty);
  const downtimeMinutes = sumValues([
    raw.changeoverMinutes,
    raw.inspectionMinutes,
    raw.equipmentRepairMinutes,
    raw.moldRepairMinutes,
    raw.materialChangeMinutes,
    raw.emergencyStopMinutes,
    raw.meetingMinutes,
    raw.plannedStopMinutes,
  ]);
  const rawNormalMinutes = numberValue(raw.normalMinutes);
  const normalMinutes = rawNormalMinutes > 0 ? rawNormalMinutes : Math.max(workMinutes - downtimeMinutes, 0);
  const speedPcsPerMinute = machineSpeed >= 1000 ? machineSpeed / 480 : machineSpeed * cavityQty;
  const targetQty = speedPcsPerMinute * workMinutes;
  const actualOutput = goodQty + ngQty + testQty;
  const target8h = speedPcsPerMinute * 480;
  const kpi = targetQty > 0 ? actualOutput / targetQty : 0;
  const availability = workMinutes > 0 ? normalMinutes / workMinutes : 0;
  const quality = goodQty + ngQty > 0 ? goodQty / (goodQty + ngQty) : 0;

  return {
    id: normalizeKpiText(raw.id),
    date: formatLegacyDate(raw.date),
    month: String(formatLegacyDate(raw.date)).slice(0, 7),
    shift: toOriginalShift(raw.shift) || "-",
    shiftStartAt: normalizeKpiText(raw.shiftStartAt),
    machineId: normalizeKpiText(raw.machineId || raw.machineName, "unknown"),
    machineName: normalizeKpiText(raw.machineName, "Unknown machine"),
    productName: normalizeKpiText(raw.productName, "-"),
    productKey: normalizeKpiKey(raw.productName),
    partNo: normalizeKpiText(raw.partNo, "(blank)"),
    partKey: normalizeKpiKey(raw.partNo),
    step: normalizeKpiText(raw.step, "-"),
    stepKey: normalizeKpiKey(raw.step || "-"),
    source: normalizeKpiText(raw.source, "unknown"),
    workMinutes: workMinutes,
    normalMinutes: normalMinutes,
    downtimeMinutes: downtimeMinutes,
    machineSpeed: machineSpeed,
    cavityQty: cavityQty,
    speedPcsPerMinute: speedPcsPerMinute,
    target8h: target8h,
    targetQty: targetQty,
    goodQty: goodQty,
    ngQty: ngQty,
    testQty: testQty,
    actualOutput: actualOutput,
    gapQty: actualOutput - targetQty,
    kpi: kpi,
    availability: availability,
    quality: quality,
    oee: kpi * availability * quality,
    speedSource: machineSpeed >= 1000 ? "machineSpeed / 480" : "machineSpeed x cavityQty",
    createdAt: normalizeKpiText(raw.createdAt),
    updatedAt: normalizeKpiText(raw.updatedAt),
  };
}

function preferKpiLog(current, candidate) {
  const currentScore = getKpiSourceScore(current) * 100000000000000 + getKpiTimestamp(current);
  const candidateScore = getKpiSourceScore(candidate) * 100000000000000 + getKpiTimestamp(candidate);
  return candidateScore > currentScore ? candidate : current;
}

function getKpiSourceScore(log) {
  if (log.source === "google-sheet") return 3;
  if (log.source === "local") return 2;
  return 1;
}

function getKpiTimestamp(log) {
  return Date.parse(log.updatedAt || log.createdAt || log.date || "") || 0;
}

function normalizeKpiText(value, fallback) {
  const text = String(value == null ? "" : value).replace(/\u00a0/g, " ").trim();
  return text || fallback || "";
}

function normalizeKpiKey(value) {
  return normalizeKpiText(value).toUpperCase().replace(/\s+/g, "");
}

function buildKpiMachineRows(logs) {
  return buildKpiGroupedRows(logs, function(log) {
    return log.machineId;
  }, function(rows) {
    const metrics = aggregateKpiRows(rows);
    return [
      rows[0].machineId,
      commonKpiValue(rows, "machineName"),
      rows.length,
      countUniqueKpi(rows, "partKey"),
      countUniqueKpi(rows, "stepKey"),
      metrics.firstDate,
      metrics.lastDate,
      metrics.workMinutes,
      metrics.normalMinutes,
      metrics.downtimeMinutes,
      metrics.speedPcsPerMinute,
      metrics.target8h,
      metrics.targetQty,
      metrics.actualOutput,
      metrics.gapQty,
      metrics.kpi,
      metrics.availability,
      metrics.quality,
      metrics.oee,
      metrics.goodQty,
      metrics.ngQty,
      metrics.testQty,
      sourceMixKpi(rows),
    ];
  }).sort(function(a, b) {
    return a[1].localeCompare(b[1], undefined, { numeric: true });
  });
}

function buildKpiMachineStepRows(logs) {
  return buildKpiGroupedRows(logs, function(log) {
    return log.machineId + "|" + log.stepKey;
  }, function(rows) {
    const metrics = aggregateKpiRows(rows);
    return [
      rows[0].machineId,
      commonKpiValue(rows, "machineName"),
      commonKpiValue(rows, "step"),
      rows.length,
      countUniqueKpi(rows, "partKey"),
      metrics.firstDate,
      metrics.lastDate,
      metrics.workMinutes,
      metrics.normalMinutes,
      metrics.downtimeMinutes,
      metrics.speedPcsPerMinute,
      metrics.target8h,
      metrics.targetQty,
      metrics.actualOutput,
      metrics.gapQty,
      metrics.kpi,
      metrics.availability,
      metrics.quality,
      metrics.oee,
      metrics.goodQty,
      metrics.ngQty,
      metrics.testQty,
      sourceMixKpi(rows),
    ];
  }).sort(function(a, b) {
    return (
      a[1].localeCompare(b[1], undefined, { numeric: true }) ||
      a[2].localeCompare(b[2], undefined, { numeric: true })
    );
  });
}

function buildKpiMachineJobStepRows(logs) {
  return buildKpiGroupedRows(logs, function(log) {
    return log.machineId + "|" + log.productKey + "|" + log.partKey + "|" + log.stepKey;
  }, function(rows) {
    const metrics = aggregateKpiRows(rows);
    return [
      rows[0].machineId,
      commonKpiValue(rows, "machineName"),
      commonKpiValue(rows, "productName"),
      commonKpiValue(rows, "partNo"),
      commonKpiValue(rows, "step"),
      rows.length,
      metrics.firstDate,
      metrics.lastDate,
      metrics.workMinutes,
      metrics.normalMinutes,
      metrics.downtimeMinutes,
      metrics.speedPcsPerMinute,
      metrics.target8h,
      metrics.targetQty,
      metrics.actualOutput,
      metrics.gapQty,
      metrics.kpi,
      metrics.availability,
      metrics.quality,
      metrics.oee,
      metrics.goodQty,
      metrics.ngQty,
      metrics.testQty,
      sourceMixKpi(rows),
    ];
  }).sort(function(a, b) {
    return (
      a[1].localeCompare(b[1], undefined, { numeric: true }) ||
      a[3].localeCompare(b[3], undefined, { numeric: true }) ||
      a[4].localeCompare(b[4], undefined, { numeric: true })
    );
  });
}

function buildKpiDailyRows(logs) {
  return logs.map(function(log) {
    return [
      log.date,
      log.month,
      log.shift,
      log.machineId,
      log.machineName,
      log.productName,
      log.partNo,
      log.step,
      log.workMinutes,
      log.normalMinutes,
      log.downtimeMinutes,
      log.machineSpeed,
      log.cavityQty,
      log.speedPcsPerMinute,
      log.target8h,
      log.targetQty,
      log.goodQty,
      log.ngQty,
      log.testQty,
      log.actualOutput,
      log.gapQty,
      log.kpi,
      log.availability,
      log.quality,
      log.oee,
      log.speedSource,
      log.source,
      log.createdAt,
      log.updatedAt,
    ];
  });
}

function buildKpiGroupedRows(logs, keyFn, rowFn) {
  const groups = {};
  logs.forEach(function(log) {
    const key = keyFn(log);
    if (!groups[key]) groups[key] = [];
    groups[key].push(log);
  });
  return Object.keys(groups).map(function(key) {
    return rowFn(groups[key]);
  });
}

function aggregateKpiRows(rows) {
  const metrics = {
    firstDate: "",
    lastDate: "",
    workMinutes: 0,
    normalMinutes: 0,
    downtimeMinutes: 0,
    targetQty: 0,
    goodQty: 0,
    ngQty: 0,
    testQty: 0,
    actualOutput: 0,
  };
  rows.forEach(function(row) {
    metrics.workMinutes += row.workMinutes;
    metrics.normalMinutes += row.normalMinutes;
    metrics.downtimeMinutes += row.downtimeMinutes;
    metrics.targetQty += row.targetQty;
    metrics.goodQty += row.goodQty;
    metrics.ngQty += row.ngQty;
    metrics.testQty += row.testQty;
    metrics.actualOutput += row.actualOutput;
    if (!metrics.firstDate || row.date < metrics.firstDate) metrics.firstDate = row.date;
    if (!metrics.lastDate || row.date > metrics.lastDate) metrics.lastDate = row.date;
  });
  metrics.speedPcsPerMinute = metrics.workMinutes > 0 ? metrics.targetQty / metrics.workMinutes : 0;
  metrics.target8h = metrics.speedPcsPerMinute * 480;
  metrics.gapQty = metrics.actualOutput - metrics.targetQty;
  metrics.kpi = metrics.targetQty > 0 ? metrics.actualOutput / metrics.targetQty : 0;
  metrics.availability = metrics.workMinutes > 0 ? metrics.normalMinutes / metrics.workMinutes : 0;
  metrics.quality = metrics.goodQty + metrics.ngQty > 0 ? metrics.goodQty / (metrics.goodQty + metrics.ngQty) : 0;
  metrics.oee = metrics.kpi * metrics.availability * metrics.quality;
  return metrics;
}

function commonKpiValue(rows, field) {
  const counts = {};
  rows.forEach(function(row) {
    const value = normalizeKpiText(row[field]);
    if (!value) return;
    counts[value] = (counts[value] || 0) + 1;
  });
  return Object.keys(counts).sort(function(a, b) {
    return counts[b] - counts[a] || a.localeCompare(b, undefined, { numeric: true });
  })[0] || "";
}

function countUniqueKpi(rows, field) {
  const seen = {};
  rows.forEach(function(row) {
    const value = normalizeKpiText(row[field]);
    if (value) seen[value] = true;
  });
  return Object.keys(seen).length;
}

function sourceMixKpi(rows) {
  const counts = {};
  rows.forEach(function(row) {
    const source = normalizeKpiText(row.source, "unknown");
    counts[source] = (counts[source] || 0) + 1;
  });
  return Object.keys(counts)
    .sort()
    .map(function(source) {
      return source + ": " + counts[source];
    })
    .join("; ");
}

function writeKpiDashboardSheet(book, logs, machineRows, machineStepRows, machineJobStepRows, rawCount, duplicateRowsRemoved, refreshedAt) {
  const sheet = resetKpiSheet(book, KPI_DASHBOARD_SHEET);
  const overall = aggregateKpiRows(logs);
  const topRows = machineJobStepRows
    .filter(function(row) { return row[13] > 0; })
    .slice()
    .sort(function(a, b) { return b[16] - a[16] || b[14] - a[14]; })
    .slice(0, 10);
  const lowRows = machineJobStepRows
    .filter(function(row) { return row[13] > 0; })
    .slice()
    .sort(function(a, b) { return a[16] - b[16] || a[14] - b[14]; })
    .slice(0, 10);

  const matrix = [];
  matrix.push(["KPI by Machine, Job, and Step", "", "", "", "", "", "", ""]);
  matrix.push(["Production date range", (overall.firstDate || "") + " to " + (overall.lastDate || ""), "Rows used", logs.length, "Duplicates removed", duplicateRowsRemoved, "Refreshed at", refreshedAt]);
  matrix.push(["Raw rows", rawCount, "Machine groups", machineRows.length, "Machine+Step groups", machineStepRows.length, "Machine+Job+Step groups", machineJobStepRows.length]);
  matrix.push(["", "", "", "", "", "", "", ""]);
  matrix.push(["Metric", "Value", "Metric", "Value", "Metric", "Value", "Metric", "Value"]);
  matrix.push(["Actual Output", overall.actualOutput, "Target Qty", overall.targetQty, "Gap Qty", overall.gapQty, "KPI %", overall.kpi]);
  matrix.push(["Work Minutes", overall.workMinutes, "Normal Minutes", overall.normalMinutes, "Downtime Minutes", overall.downtimeMinutes, "Availability %", overall.availability]);
  matrix.push(["Good Qty", overall.goodQty, "NG Qty", overall.ngQty, "Test Qty", overall.testQty, "Quality %", overall.quality]);
  matrix.push(["", "", "", "", "", "", "", ""]);

  const topTitleRow = matrix.length + 1;
  matrix.push(["Top Machine+Job+Step by KPI %", "", "", "", "", "", "", ""]);
  matrix.push(["Machine", "Job", "Part No.", "Step", "KPI %", "Target Qty", "Actual Output", "Gap Qty"]);
  topRows.forEach(function(row) {
    matrix.push([row[1], row[2], row[3], row[4], row[16], row[13], row[14], row[15]]);
  });
  matrix.push(["", "", "", "", "", "", "", ""]);

  const lowTitleRow = matrix.length + 1;
  matrix.push(["Lowest Machine+Job+Step by KPI %", "", "", "", "", "", "", ""]);
  matrix.push(["Machine", "Job", "Part No.", "Step", "KPI %", "Target Qty", "Actual Output", "Gap Qty"]);
  lowRows.forEach(function(row) {
    matrix.push([row[1], row[2], row[3], row[4], row[16], row[13], row[14], row[15]]);
  });

  ensureKpiCapacity(sheet, matrix.length, 8);
  sheet.getRange(1, 1, matrix.length, 8).setValues(matrix);
  sheet.setFrozenRows(1);
  styleKpiHeaderRange(sheet.getRange(1, 1, 1, 8), "#1f4e79");
  styleKpiHeaderRange(sheet.getRange(5, 1, 1, 8), "#0f766e");
  styleKpiHeaderRange(sheet.getRange(topTitleRow, 1, 1, 8), "#1f4e79");
  styleKpiHeaderRange(sheet.getRange(topTitleRow + 1, 1, 1, 8), "#0f766e");
  styleKpiHeaderRange(sheet.getRange(lowTitleRow, 1, 1, 8), "#1f4e79");
  styleKpiHeaderRange(sheet.getRange(lowTitleRow + 1, 1, 1, 8), "#0f766e");
  sheet.getRange(1, 1, matrix.length, 8).setWrap(true).setVerticalAlignment("middle");
  sheet.getRange(6, 2, 3, 6).setNumberFormat("#,##0.0");
  sheet.getRange(6, 8, 3, 1).setNumberFormat("0.0%");
  if (topRows.length) {
    sheet.getRange(topTitleRow + 2, 5, topRows.length, 1).setNumberFormat("0.0%");
    sheet.getRange(topTitleRow + 2, 6, topRows.length, 3).setNumberFormat("#,##0.0");
  }
  if (lowRows.length) {
    sheet.getRange(lowTitleRow + 2, 5, lowRows.length, 1).setNumberFormat("0.0%");
    sheet.getRange(lowTitleRow + 2, 6, lowRows.length, 3).setNumberFormat("#,##0.0");
  }
  sheet.getRange(1, 1, matrix.length, 8).setBorder(true, true, true, true, true, true, "#d9e2ec", SpreadsheetApp.BorderStyle.SOLID);
  sheet.autoResizeColumns(1, 8);
}

function writeKpiSheet(book, name, headers, rows, formatRules) {
  const sheet = resetKpiSheet(book, name);
  const matrix = [headers].concat(rows);
  ensureKpiCapacity(sheet, matrix.length, headers.length);
  sheet.getRange(1, 1, matrix.length, headers.length).setValues(matrix);
  sheet.setFrozenRows(1);
  styleKpiHeaderRange(sheet.getRange(1, 1, 1, headers.length), "#17372f");
  sheet.getRange(1, 1, matrix.length, headers.length).setWrap(true).setVerticalAlignment("middle");
  sheet.getRange(1, 1, matrix.length, headers.length).setBorder(true, true, true, true, true, true, "#d9e2ec", SpreadsheetApp.BorderStyle.SOLID);
  applyKpiFormatRules(sheet, matrix.length, formatRules);
  if (matrix.length > 1) {
    sheet.getRange(1, 1, matrix.length, headers.length).createFilter();
  }
  sheet.autoResizeColumns(1, Math.min(headers.length, 26));
}

function resetKpiSheet(book, name) {
  const sheet = book.getSheetByName(name) || book.insertSheet(name);
  const filter = sheet.getFilter();
  if (filter) filter.remove();
  sheet.clear();
  return sheet;
}

function ensureKpiCapacity(sheet, rowCount, columnCount) {
  if (sheet.getMaxRows() < rowCount) {
    sheet.insertRowsAfter(sheet.getMaxRows(), rowCount - sheet.getMaxRows());
  }
  if (sheet.getMaxColumns() < columnCount) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), columnCount - sheet.getMaxColumns());
  }
}

function styleKpiHeaderRange(range, fill) {
  range
    .setFontWeight("bold")
    .setFontColor("#ffffff")
    .setBackground(fill)
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setWrap(true);
}

function applyKpiFormatRules(sheet, rowCount, rules) {
  if (rowCount <= 1) return;
  rules.forEach(function(rule) {
    sheet.getRange(2, rule.start, rowCount - 1, rule.end - rule.start + 1).setNumberFormat(rule.format);
  });
}

function getKpiMachineHeaders() {
  return ["Machine ID", "Machine", "Logs", "Job Groups", "Step Groups", "First Date", "Last Date", "Work Minutes", "Normal Minutes", "Downtime Minutes", "Speed pcs/min", "Target/8h", "Target Qty", "Actual Output", "Gap Qty", "KPI %", "Availability %", "Quality %", "OEE %", "Good Qty", "NG Qty", "Test Qty", "Source Mix"];
}

function getKpiMachineStepHeaders() {
  return ["Machine ID", "Machine", "Step", "Logs", "Job Groups", "First Date", "Last Date", "Work Minutes", "Normal Minutes", "Downtime Minutes", "Speed pcs/min", "Target/8h", "Target Qty", "Actual Output", "Gap Qty", "KPI %", "Availability %", "Quality %", "OEE %", "Good Qty", "NG Qty", "Test Qty", "Source Mix"];
}

function getKpiMachineJobStepHeaders() {
  return ["Machine ID", "Machine", "Product / Job", "Part No.", "Step", "Logs", "First Date", "Last Date", "Work Minutes", "Normal Minutes", "Downtime Minutes", "Speed pcs/min", "Target/8h", "Target Qty", "Actual Output", "Gap Qty", "KPI %", "Availability %", "Quality %", "OEE %", "Good Qty", "NG Qty", "Test Qty", "Source Mix"];
}

function getKpiDailyHeaders() {
  return ["Date", "Month", "Shift", "Machine ID", "Machine", "Product / Job", "Part No.", "Step", "Work Minutes", "Normal Minutes", "Downtime Minutes", "Machine Speed", "Cavity Qty", "Speed pcs/min", "Target/8h", "Target Qty", "Good Qty", "NG Qty", "Test Qty", "Actual Output", "Gap Qty", "KPI %", "Availability %", "Quality %", "OEE %", "Speed Source", "Source", "Created At", "Updated At"];
}

function getKpiMachineFormatRules() {
  return [
    { start: 8, end: 15, format: "#,##0.0" },
    { start: 16, end: 19, format: "0.0%" },
    { start: 20, end: 22, format: "#,##0" },
  ];
}

function getKpiMachineStepFormatRules() {
  return [
    { start: 8, end: 15, format: "#,##0.0" },
    { start: 16, end: 19, format: "0.0%" },
    { start: 20, end: 22, format: "#,##0" },
  ];
}

function getKpiMachineJobStepFormatRules() {
  return [
    { start: 9, end: 16, format: "#,##0.0" },
    { start: 17, end: 20, format: "0.0%" },
    { start: 21, end: 23, format: "#,##0" },
  ];
}

function getKpiDailyFormatRules() {
  return [
    { start: 9, end: 21, format: "#,##0.0" },
    { start: 22, end: 25, format: "0.0%" },
  ];
}

function buildKpiNotesRows(refreshedAt, rawCount, usedCount, duplicateRowsRemoved) {
  return [
    ["Method", "KPI % = Actual Output / Target Qty. Target Qty = Work Minutes x Speed pcs/min."],
    ["Actual Output", "Good Qty + NG Qty + Test Qty."],
    ["Speed pcs/min", "If machineSpeed >= 1000, treat machineSpeed as target per 8 hours and divide by 480. Otherwise speed = machineSpeed x cavityQty."],
    ["Availability %", "Normal Minutes / Work Minutes."],
    ["Quality %", "Good Qty / (Good Qty + NG Qty). Test Qty is excluded from quality."],
    ["OEE %", "KPI % x Availability % x Quality %."],
    ["Machine KPI", "Grouped by machine."],
    ["Machine Step KPI", "Grouped by machine + step."],
    ["Machine Job Step KPI", "Grouped by machine + product/job + part no. + step."],
    ["Raw rows downloaded", rawCount],
    ["Rows used after duplicate preference", usedCount],
    ["Duplicate rows removed", duplicateRowsRemoved],
    ["Duplicate rule", "Same date + shift/start + machine + product + part + step keeps google-sheet/latest over excel-seed."],
    ["Refreshed at", refreshedAt],
    ["PD 1", PD_EXTERNAL_SHEETS[0].url],
    ["PD 2", PD_EXTERNAL_SHEETS[1].url],
  ];
}

function isUsableLog(log) {
  return Boolean(
    formatLegacyDate(log.date) &&
      String(log.machineId || log.machineName || "").trim() &&
      String(log.partNo || log.productName || "").trim()
  );
}

function getLegacyOeeLogs() {
  const book = getWorkbook();
  const machineByName = getMachineMap();
  const logs = [];
  book.getSheets().forEach(function(sheet) {
    const machine = machineByName[normalizeSheetName(sheet.getName())];
    if (!machine || sheet.getLastRow() < OEE_FIRST_DATA_ROW) return;

    const layout = getOeeLayout(sheet);
    const lastColumn = Math.max(layout.cavityQty, layout.theoreticalImpulse, layout.testQty);
    const rows = sheet
      .getRange(OEE_FIRST_DATA_ROW, 1, sheet.getLastRow() - OEE_FIRST_DATA_ROW + 1, lastColumn)
      .getValues();

    rows.forEach(function(row, index) {
      const productName = String(row[layout.productName - 1] || "").trim();
      const partNo = String(row[layout.partNo - 1] || "").trim();
      if (!productName || !partNo) return;

      const date = formatLegacyDate(row[layout.date - 1]);
      if (!date) return;

      const step = layout.hasStep ? String(row[layout.step - 1] || "-").trim() || "-" : "-";
      const normalSlots = numberValue(row[layout.normalSlot - 1]);
      const downtimeSlots = [];
      for (let column = layout.downtimeStart; column < layout.downtimeStart + 8; column++) {
        downtimeSlots.push(numberValue(row[column - 1]));
      }
      const downtimeMinutes = downtimeSlots.map(function(value) {
        return roundNumber(value * OEE_MINUTES_PER_SLOT);
      });
      const normalMinutes = roundNumber(normalSlots * OEE_MINUTES_PER_SLOT);
      const workMinutes = roundNumber(normalMinutes + sumValues(downtimeMinutes));
      const sourceRow = index + OEE_FIRST_DATA_ROW;

      logs.push({
        id: "legacy-" + machine.id + "-" + sourceRow,
        recordDate: layout.entryDate ? formatRecordDate(row[layout.entryDate - 1]) : "",
        recordTime: layout.entryTime ? formatRecordTime(row[layout.entryTime - 1]) : "",
        date: date,
        shift: toOriginalShift(row[layout.shift - 1]),
        shiftStartAt: getShiftStartAt(date, row[layout.shift - 1]),
        shiftEndAt: getShiftEndAt(date, row[layout.shift - 1]),
        machineId: machine.id,
        machineName: machine.name,
        productName: productName,
        partNo: partNo,
        step: step,
        workMinutes: workMinutes,
        timeSlots: roundNumber(workMinutes / OEE_MINUTES_PER_SLOT),
        minutesPerSlot: OEE_MINUTES_PER_SLOT,
        machineSpeed: numberValue(row[layout.theoreticalImpulse - 1]),
        cavityQty: numberValue(row[layout.cavityQty - 1]),
        normalMinutes: normalMinutes,
        changeoverMinutes: downtimeMinutes[0],
        inspectionMinutes: downtimeMinutes[1],
        equipmentRepairMinutes: downtimeMinutes[2],
        moldRepairMinutes: downtimeMinutes[3],
        materialChangeMinutes: downtimeMinutes[4],
        emergencyStopMinutes: downtimeMinutes[5],
        meetingMinutes: downtimeMinutes[6],
        plannedStopMinutes: downtimeMinutes[7],
        goodQty: numberValue(row[layout.goodQty - 1]),
        ngQty: numberValue(row[layout.ngQty - 1]),
        testQty: numberValue(row[layout.testQty - 1]),
        note: "",
        createdAt: date + "T00:00:00.000Z",
        updatedAt: "",
        source: "excel-seed",
      });
    });
  });

  return logs.sort(function(a, b) {
    return (b.date + "-" + b.createdAt).localeCompare(a.date + "-" + a.createdAt);
  });
}

function getMachineMap() {
  const sheet = ensureSheet(MACHINE_SHEET, MACHINE_HEADERS);
  const rows = sheet.getDataRange().getValues();
  const map = {};
  rows.slice(1).forEach(function(row) {
    const id = String(row[0] || "").trim();
    const name = String(row[1] || "").trim();
    if (!id || !name) return;
    map[normalizeSheetName(name)] = {
      id: id,
      name: name,
    };
  });
  return map;
}

function getMachines() {
  const sheet = ensureSheet(MACHINE_SHEET, MACHINE_HEADERS);
  const rows = sheet.getDataRange().getValues();
  return rows.slice(1).map(function(row) {
    const id = String(row[0] || "").trim();
    const name = String(row[1] || "").trim();
    if (!id || !name) return null;
    return {
      id: id,
      name: name,
      capacityUnits: Number(row[2] || 0),
      capacityMinutes: Number(row[3] || 0),
      hasStep: String(row[4]).toLowerCase() === "true" || row[4] === true,
      rowCount: Number(row[5] || 0),
    };
  }).filter(function(machine) {
    return Boolean(machine);
  });
}

function mergeLogs(primaryLogs, fallbackLogs) {
  const seen = {};
  const merged = [];
  primaryLogs.concat(fallbackLogs).forEach(function(log) {
    const key = String(log.id || "");
    if (!key || seen[key]) return;
    seen[key] = true;
    merged.push(log);
  });
  return merged.sort(function(a, b) {
    return String(b.date || "").localeCompare(String(a.date || ""));
  });
}

function formatLegacyDate(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, "Asia/Bangkok", "yyyy-MM-dd");
  }
  const text = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const slash = text.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
  if (!slash) return "";
  const year = Number(slash[3].length === 2 ? "20" + slash[3] : slash[3]);
  const month = Number(slash[2]);
  const day = Number(slash[1]);
  if (!year || !month || !day) return "";
  return Utilities.formatDate(new Date(year, month - 1, day), "Asia/Bangkok", "yyyy-MM-dd");
}

function formatRecordDate(value) {
  const text = String(value || "").trim();
  const isoDate = text.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoDate) return isoDate[1];
  return formatLegacyDate(value);
}

function formatRecordTime(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, "Asia/Bangkok", "HH:mm:ss");
  }
  const text = String(value || "").trim();
  const isoTime = text.match(/T(\d{2}:\d{2}(?::\d{2})?)/);
  if (isoTime) return normalizeTimeText(isoTime[1]);
  const time = text.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (time) return normalizeTimeText(time[1] + ":" + time[2] + ":" + (time[3] || "00"));
  return "";
}

function normalizeTimeText(value) {
  const parts = String(value || "").split(":");
  const hour = String(Number(parts[0]) || 0).padStart(2, "0");
  const minute = String(Number(parts[1]) || 0).padStart(2, "0");
  const second = String(Number(parts[2]) || 0).padStart(2, "0");
  return hour + ":" + minute + ":" + second;
}

function todayBangkok(value) {
  return Utilities.formatDate(value || new Date(), "Asia/Bangkok", "yyyy-MM-dd");
}

function timeBangkok(value) {
  return Utilities.formatDate(value || new Date(), "Asia/Bangkok", "HH:mm:ss");
}

function addDaysToLegacyDate(date, days) {
  const formatted = formatLegacyDate(date);
  if (!formatted) return "";
  const parts = formatted.split("-").map(Number);
  const value = new Date(parts[0], parts[1] - 1, parts[2]);
  value.setDate(value.getDate() + days);
  return Utilities.formatDate(value, "Asia/Bangkok", "yyyy-MM-dd");
}

function getShiftStartAt(date, shift) {
  const productionDate = formatLegacyDate(date);
  if (!productionDate) return "";
  return productionDate + "T" + (isNightShift(shift) ? "20:00:00" : "08:00:00");
}

function getShiftEndAt(date, shift) {
  const productionDate = formatLegacyDate(date);
  if (!productionDate) return "";
  const isNight = isNightShift(shift);
  return (isNight ? addDaysToLegacyDate(productionDate, 1) : productionDate) + "T" + (isNight ? "08:00:00" : "20:00:00");
}

function setupProductionWorkbook() {
  const sheet = ensureSheet(LOG_SHEET, LOG_HEADERS);
  formatHeader(sheet, LOG_HEADERS.length);
  importCsvSheet(MACHINE_SHEET, MACHINE_HEADERS, MACHINES_CSV_URL);
  importCsvSheet(PRODUCT_MASTER_SHEET, PRODUCT_MASTER_HEADERS, PRODUCT_MASTER_CSV_URL);
  setupDowntimeCatalog();
  ensureUsersSheet();
  migrateOeeEntryTimestampColumns();
  migrateOeeTestColumns();
  return sheet.getParent();
}

function refreshMasterData() {
  const book = getWorkbook();
  const machineRows = importCsvSheetForce(MACHINE_SHEET, MACHINE_HEADERS, MACHINES_CSV_URL);
  const productRows = importCsvSheetForce(PRODUCT_MASTER_SHEET, PRODUCT_MASTER_HEADERS, PRODUCT_MASTER_CSV_URL);
  return {
    spreadsheetId: book.getId(),
    spreadsheetUrl: book.getUrl(),
    machines: machineRows,
    products: productRows,
    refreshedAt: new Date().toISOString(),
  };
}

function refreshSeedLogs() {
  const book = getWorkbook();
  const sheet = ensureSheet(LOG_SHEET, LOG_HEADERS);
  const csv = UrlFetchApp.fetch(PRODUCTION_LOGS_SEED_CSV_URL).getContentText();
  const rows = Utilities.parseCsv(csv);
  if (!rows.length) {
    return {
      spreadsheetId: book.getId(),
      spreadsheetUrl: book.getUrl(),
      inserted: 0,
      kept: 0,
      removed: 0,
      total: 0,
      refreshedAt: new Date().toISOString(),
    };
  }

  const csvHeaders = rows[0].map(String);
  const sourceIndex = LOG_HEADERS.indexOf("source");
  const existingRowCount = Math.max(sheet.getLastRow() - 1, 0);
  const existingRows = existingRowCount
    ? sheet.getRange(2, 1, existingRowCount, LOG_HEADERS.length).getValues()
    : [];
  const keptRows = existingRows
    .filter(function(row) {
      return String(row[sourceIndex] || "").trim() !== "excel-seed";
    })
    .map(function(row) {
      return LOG_HEADERS.map(function(_header, index) {
        return row[index] === undefined ? "" : row[index];
      });
    });
  const seedRows = rows.slice(1).map(function(row) {
    return LOG_HEADERS.map(function(header, columnIndex) {
      const csvIndex = csvHeaders.indexOf(header);
      return serializeTypedValue(header, csvIndex >= 0 ? row[csvIndex] : row[columnIndex], LOG_NUMBER_HEADERS);
    });
  });
  const totalRows = 1 + keptRows.length + seedRows.length;

  ensureSheetSize(sheet, totalRows, LOG_HEADERS.length);
  sheet.clearContents();
  applySheetTypeFormats(sheet, LOG_HEADERS, LOG_NUMBER_HEADERS, totalRows);
  sheet.getRange(1, 1, 1, LOG_HEADERS.length).setValues([LOG_HEADERS]);
  if (keptRows.length) {
    sheet.getRange(2, 1, keptRows.length, LOG_HEADERS.length).setValues(keptRows);
  }
  if (seedRows.length) {
    sheet.getRange(2 + keptRows.length, 1, seedRows.length, LOG_HEADERS.length).setValues(seedRows);
  }
  formatHeader(sheet, LOG_HEADERS.length);

  return {
    spreadsheetId: book.getId(),
    spreadsheetUrl: book.getUrl(),
    inserted: seedRows.length,
    kept: keptRows.length,
    removed: existingRows.length - keptRows.length,
    total: keptRows.length + seedRows.length,
    refreshedAt: new Date().toISOString(),
  };
}

function importCncMachineSheets(force) {
  const book = getWorkbook();
  refreshMasterData();
  refreshSeedLogs();

  const cncIds = ["c1", "c2", "c3", "c4", "c5", "c6"];
  const csv = UrlFetchApp.fetch(PRODUCTION_LOGS_SEED_CSV_URL).getContentText();
  const rows = Utilities.parseCsv(csv);
  if (!rows.length) {
    return { created: [], skipped: [], rows: 0, refreshedAt: new Date().toISOString() };
  }

  const csvHeaders = rows[0].map(String);
  const logsByMachine = {};
  rows.slice(1).forEach(function(row) {
    const values = LOG_HEADERS.map(function(header, columnIndex) {
      const csvIndex = csvHeaders.indexOf(header);
      return csvIndex >= 0 ? row[csvIndex] : row[columnIndex];
    });
    const log = rowToObject(LOG_HEADERS, values);
    const machineId = String(log.machineId || "").trim().toLowerCase();
    if (cncIds.indexOf(machineId) < 0) return;
    if (!logsByMachine[machineId]) logsByMachine[machineId] = [];
    logsByMachine[machineId].push(log);
  });

  const machineSheet = ensureSheet(MACHINE_SHEET, MACHINE_HEADERS);
  const machineRows = machineSheet.getDataRange().getValues();
  const machinesById = {};
  machineRows.slice(1).forEach(function(row) {
    const id = String(row[0] || "").trim().toLowerCase();
    if (!id) return;
    machinesById[id] = {
      id: id,
      name: String(row[1] || "").trim() || id.toUpperCase(),
      capacityUnits: numberValue(row[2]),
      capacityMinutes: numberValue(row[3]),
      rowCount: numberValue(row[5]),
    };
  });

  const created = [];
  const skipped = [];
  let importedRows = 0;
  cncIds.forEach(function(machineId) {
    const machine = machinesById[machineId] || {
      id: machineId,
      name: machineId.toUpperCase(),
      capacityUnits: 0,
      capacityMinutes: 0,
      rowCount: 0,
    };
    const sheet = book.getSheetByName(machine.name) || book.insertSheet(machine.name);
    if (!force && sheet.getLastRow() >= OEE_FIRST_DATA_ROW && sheet.getRange(OEE_FIRST_DATA_ROW, 1, sheet.getLastRow() - OEE_FIRST_DATA_ROW + 1, 7).getDisplayValues().some(function(row) {
      return row.some(function(value) { return String(value || "").trim(); });
    })) {
      skipped.push({ machine: machine.name, reason: "sheet already has data" });
      return;
    }

    const logs = (logsByMachine[machineId] || []).sort(function(a, b) {
      return String(a.date || "").localeCompare(String(b.date || "")) || String(a.shift || "").localeCompare(String(b.shift || ""));
    });
    writeCncMachineSheet(sheet, machine, logs);
    importedRows += logs.length;
    created.push({ machine: machine.name, rows: logs.length });
  });

  return {
    spreadsheetId: book.getId(),
    spreadsheetUrl: book.getUrl(),
    created: created,
    skipped: skipped,
    rows: importedRows,
    refreshedAt: new Date().toISOString(),
  };
}

function writeCncMachineSheet(sheet, machine, logs) {
  const headers = getCncMachineSheetHeaders();
  const totalRows = Math.max(OEE_FIRST_DATA_ROW + logs.length - 1, OEE_FIRST_DATA_ROW);
  const totalColumns = headers.length;
  ensureSheetSize(sheet, totalRows, totalColumns);
  sheet.clear();
  sheet.setFrozenRows(OEE_HEADER_ROW);
  sheet.setFrozenColumns(7);

  const noteRow = new Array(totalColumns).fill("");
  noteRow[1] = "只填写黄色区域表格";
  noteRow[17] = "表中每小格代表5分钟，总个数132";
  noteRow[31] = "X2";
  const codeRow = new Array(totalColumns).fill("");
  const timeCodes = ["A", "B", "C", "D", "E", "F", "G", "H", "X", "A", "B", "C", "D", "E", "F", "G", "H", "X"];
  for (let index = 0; index < timeCodes.length; index++) {
    codeRow[7 + index] = timeCodes[index];
  }
  const values = [noteRow, codeRow, headers].concat(logs.map(function(log, index) {
    return buildCncMachineSheetRow(log, index + OEE_FIRST_DATA_ROW);
  }));

  sheet.getRange(1, 1, values.length, totalColumns).setValues(values);
  sheet.getRange(OEE_HEADER_ROW, 1, 1, totalColumns)
    .setBackground("#fbbc04")
    .setFontWeight("bold")
    .setFontColor("#000000")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setWrap(true);
  sheet.getRange(1, 1, 2, totalColumns)
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setWrap(true);
  sheet.getRange(1, 32, 1, 1).setBackground("#ff0000").setFontWeight("bold");
  sheet.getRange(OEE_FIRST_DATA_ROW, 2, Math.max(logs.length, 1), 1).setNumberFormat("@");
  sheet.getRange(OEE_FIRST_DATA_ROW, 3, Math.max(logs.length, 1), 1).setNumberFormat("@");
  sheet.getRange(OEE_FIRST_DATA_ROW, 4, Math.max(logs.length, 1), 1).setNumberFormat("@");
  sheet.getRange(OEE_FIRST_DATA_ROW, 5, Math.max(logs.length, 1), 3).setNumberFormat("@");
  sheet.getRange(OEE_FIRST_DATA_ROW, 8, Math.max(logs.length, 1), totalColumns - 7).setNumberFormat("0.##");
  sheet.getRange(OEE_FIRST_DATA_ROW, 34, Math.max(logs.length, 1), 4).setNumberFormat("0.00%");
  sheet.autoResizeColumns(1, totalColumns);
  sheet.setColumnWidths(1, 1, 55);
  sheet.setColumnWidths(2, 3, 105);
  sheet.setColumnWidths(6, 2, 145);
}

function getCncMachineSheetHeaders() {
  return [
    "序号No",
    OEE_ENTRY_DATE_HEADER,
    OEE_ENTRY_TIME_HEADER,
    "日期 Date",
    "D/N",
    "产品名称 Product Name",
    "Part No.",
    "正常生产normal production",
    "换产 Cheng Production line",
    "检验 Inspection",
    "设备维修 Equipment Repair",
    "模具维修Mold repair",
    "换料 Cheng materil",
    "不明停机 Emergency stop",
    "换班、前会、5s, Cheng shift",
    "计划停机Stop at plan",
    "正常生产ormal production",
    "换产 cheng shift",
    "检验 Inspection",
    "设备维修Equipment Repair",
    "模具维修Mold repair",
    "换料Cheng material",
    "不明停机Emergency stop",
    "Meeting or Shot Breack",
    "计划停机 stop at plan",
    "合格数     Good quantity",
    "不合格 NG quantity",
    OEE_TEST_HEADER,
    "总生产数 Total quantity",
    "理论冲次Theoretical impulse",
    "模腔数 Quantityof cavities",
    "理论有效生产时间Theoretical effective production time",
    "总生产时间          Total production time",
    "设备稼动率 Equipment utilization rate",
    "合格率 Pass rate",
    "时间利用率Time utilization",
    "理论冲次设备OEE",
    "模具维修次数Quantity of repair mold",
    "模具MTTR(分钟)",
    "模具MTBF（分钟）",
  ];
}

function buildCncMachineSheetRow(log, rowNumber) {
  const minutesPerSlot = numberValue(log.minutesPerSlot) || OEE_MINUTES_PER_SLOT;
  const workSlots = roundNumber(numberValue(log.workMinutes) / minutesPerSlot);
  const downtimeSlots = [
    minutesToSheetSlots(log.changeoverMinutes, minutesPerSlot),
    minutesToSheetSlots(log.inspectionMinutes, minutesPerSlot),
    minutesToSheetSlots(log.equipmentRepairMinutes, minutesPerSlot),
    minutesToSheetSlots(log.moldRepairMinutes, minutesPerSlot),
    minutesToSheetSlots(log.materialChangeMinutes, minutesPerSlot),
    minutesToSheetSlots(log.emergencyStopMinutes, minutesPerSlot),
    minutesToSheetSlots(log.meetingMinutes, minutesPerSlot),
    minutesToSheetSlots(log.plannedStopMinutes, minutesPerSlot),
  ];
  const normalSlotFormula = "=" + workSlots + "-" + downtimeSlots.map(function(_value, index) {
    return columnToLetter(9 + index) + rowNumber;
  }).join("-");
  const totalFormula = "=Z" + rowNumber + "+AA" + rowNumber + "+AB" + rowNumber;
  return [
    "=ROW()-ROW($A$3)",
    formatRecordDate(log.recordDate),
    formatRecordTime(log.recordTime),
    formatRecordDate(log.date),
    toOriginalShift(log.shift),
    String(log.productName || ""),
    String(log.partNo || ""),
    normalSlotFormula,
  ]
    .concat(downtimeSlots)
    .concat([
      numberValue(log.normalMinutes),
      numberValue(log.changeoverMinutes),
      numberValue(log.inspectionMinutes),
      numberValue(log.equipmentRepairMinutes),
      numberValue(log.moldRepairMinutes),
      numberValue(log.materialChangeMinutes),
      numberValue(log.emergencyStopMinutes),
      numberValue(log.meetingMinutes),
      numberValue(log.plannedStopMinutes),
      numberValue(log.goodQty),
      numberValue(log.ngQty),
      numberValue(log.testQty) > 0 ? numberValue(log.testQty) : "",
      totalFormula,
      numberValue(log.machineSpeed),
      numberValue(log.cavityQty),
      "=IFERROR(AC" + rowNumber + "/AD" + rowNumber + ",\"\")",
      numberValue(log.workMinutes),
      "=IFERROR(AF" + rowNumber + "/AG" + rowNumber + ",\"\")",
      "=IFERROR(Z" + rowNumber + "/AC" + rowNumber + ",\"\")",
      "=IFERROR(Q" + rowNumber + "/AG" + rowNumber + ",\"\")",
      "=IFERROR(AH" + rowNumber + "*AI" + rowNumber + "*AJ" + rowNumber + ",\"\")",
      "=IF(L" + rowNumber + ">0,1,0)",
      "=IF(AL" + rowNumber + ">0,U" + rowNumber + "/AL" + rowNumber + ",\"\")",
      "=IF(AL" + rowNumber + ">0,Q" + rowNumber + "/AL" + rowNumber + ",\"\")",
    ]);
}

function ensureSheetSize(sheet, rowCount, columnCount) {
  if (sheet.getMaxRows() < rowCount) {
    sheet.insertRowsAfter(sheet.getMaxRows(), rowCount - sheet.getMaxRows());
  }
  if (sheet.getMaxColumns() < columnCount) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), columnCount - sheet.getMaxColumns());
  }
}

function ensureSheet(name, headers) {
  const book = getWorkbook();
  const sheet = book.getSheetByName(name) || book.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  } else {
    migrateHeaders(sheet, headers);
  }
  return sheet;
}

function getWorkbook() {
  if (SPREADSHEET_ID) {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }

  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) {
    return active;
  }

  const properties = PropertiesService.getScriptProperties();
  const storedId = properties.getProperty("OEE_SPREADSHEET_ID");
  if (storedId) {
    try {
      return SpreadsheetApp.openById(storedId);
    } catch (error) {
      properties.deleteProperty("OEE_SPREADSHEET_ID");
    }
  }

  const book = SpreadsheetApp.create(DATABASE_TITLE);
  properties.setProperty("OEE_SPREADSHEET_ID", book.getId());
  return book;
}

function migrateHeaders(sheet, headers) {
  const lastRow = sheet.getLastRow();
  const lastColumn = Math.max(sheet.getLastColumn(), headers.length);
  const current = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(String);
  const isCurrent = headers.every((header, index) => current[index] === header);
  if (isCurrent) return;

  const data = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, lastColumn).getValues() : [];
  const rebuilt = data.map((row) => headers.map((header) => {
    const oldIndex = current.indexOf(header);
    return oldIndex >= 0 ? row[oldIndex] : "";
  }));

  sheet.clearContents();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  if (rebuilt.length) {
    sheet.getRange(2, 1, rebuilt.length, headers.length).setValues(rebuilt);
  }
}

function importCsvSheet(name, headers, url) {
  const sheet = ensureSheet(name, headers);
  if (sheet.getLastRow() > 1) {
    applySheetTypeFormats(sheet, headers, getNumberHeadersForSheet(name));
    formatHeader(sheet, headers.length);
    return;
  }

  const csv = UrlFetchApp.fetch(url).getContentText();
  const rows = Utilities.parseCsv(csv);
  if (!rows.length) return;

  const normalizedRows = rows.map((row, index) => {
    if (index === 0) return headers;
    return headers.map((header, columnIndex) => serializeTypedValue(header, row[columnIndex], getNumberHeadersForSheet(name)));
  });

  sheet.clearContents();
  applySheetTypeFormats(sheet, headers, getNumberHeadersForSheet(name), normalizedRows.length);
  sheet.getRange(1, 1, normalizedRows.length, headers.length).setValues(normalizedRows);
  formatHeader(sheet, headers.length);
}

function importCsvSheetForce(name, headers, url) {
  const sheet = ensureSheet(name, headers);
  const csv = UrlFetchApp.fetch(url).getContentText();
  const rows = Utilities.parseCsv(csv);
  if (!rows.length) return 0;

  const normalizedRows = rows.map(function(row, index) {
    if (index === 0) return headers;
    return headers.map(function(header, columnIndex) {
      return serializeTypedValue(header, row[columnIndex], getNumberHeadersForSheet(name));
    });
  });

  sheet.clearContents();
  applySheetTypeFormats(sheet, headers, getNumberHeadersForSheet(name), normalizedRows.length);
  sheet.getRange(1, 1, normalizedRows.length, headers.length).setValues(normalizedRows);
  formatHeader(sheet, headers.length);
  return Math.max(normalizedRows.length - 1, 0);
}

function getNumberHeadersForSheet(name) {
  if (name === LOG_SHEET) return LOG_NUMBER_HEADERS;
  if (name === MACHINE_SHEET) return MACHINE_NUMBER_HEADERS;
  if (name === PRODUCT_MASTER_SHEET) return PRODUCT_NUMBER_HEADERS;
  return [];
}

function getPdExternalSheets() {
  return PD_EXTERNAL_SHEETS.map(function(source) {
    try {
      const gid = source.gid || "0";
      const url = "https://docs.google.com/spreadsheets/d/" + source.id + "/export?format=csv&gid=" + gid;
      const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
      const statusCode = response.getResponseCode();
      if (statusCode < 200 || statusCode >= 300) {
        throw new Error("HTTP " + statusCode);
      }
      const rows = Utilities.parseCsv(response.getContentText());
      const normalized = trimPdValues(rows);
      const headers = normalized.length ? normalized[0].map(function(value, index) {
        return value || "Column " + (index + 1);
      }) : [];
      return {
        ok: true,
        id: source.id,
        label: source.label,
        gid: gid,
        name: source.label,
        url: source.url,
        fetchedAt: new Date().toISOString(),
        sheets: [
          {
            name: "Sheet1",
            headers: headers,
            rows: normalized.slice(1, PD_MAX_ROWS_PER_SHEET),
            rowCount: Math.max(normalized.length - 1, 0),
            columnCount: headers.length,
            truncated: normalized.length > PD_MAX_ROWS_PER_SHEET,
          },
        ],
      };
    } catch (error) {
      return {
        ok: false,
        id: source.id,
        label: source.label,
        gid: source.gid || "0",
        name: source.label,
        url: source.url,
        fetchedAt: new Date().toISOString(),
        error: "ยังอ่านไฟล์ PD ไม่ได้ กรุณากดปุ่ม เปิด Google Sheet แล้วตั้งค่า Share เป็น Anyone with the link can view จากนั้นกลับมากดรีเฟรชข้อมูล",
        technicalError: String(error && error.message ? error.message : error),
        sheets: [],
      };
    }
  });
}

function trimPdValues(values) {
  const lastColumnIndex = values.reduce(function(maxIndex, row) {
    for (let index = row.length - 1; index >= 0; index--) {
      if (String(row[index] || "").trim()) return Math.max(maxIndex, index);
    }
    return maxIndex;
  }, -1);
  if (lastColumnIndex < 0) return [];
  return values
    .map(function(row) {
      return row.slice(0, lastColumnIndex + 1).map(function(value) {
        return String(value || "").trim();
      });
    })
    .filter(function(row) {
      return row.some(function(value) {
        return value;
      });
    });
}

function applySheetTypeFormats(sheet, headers, numberHeaders, rowCount) {
  const rows = rowCount || Math.max(sheet.getMaxRows(), 2);
  sheet.getRange(1, 1, rows, headers.length).clearDataValidations();
  headers.forEach(function(header, index) {
    const range = sheet.getRange(1, index + 1, rows, 1);
    if (numberHeaders.indexOf(header) >= 0) {
      range.setNumberFormat("0.##");
    } else {
      range.setNumberFormat("@");
    }
  });
}

function setupDowntimeCatalog() {
  const headers = DOWNTIME_CATALOG_ROWS[0];
  const sheet = ensureSheet(DOWNTIME_CATALOG_SHEET, headers);
  sheet.clearContents();
  sheet.getRange(1, 1, DOWNTIME_CATALOG_ROWS.length, headers.length).setValues(DOWNTIME_CATALOG_ROWS);
  formatHeader(sheet, headers.length);
}

function formatHeader(sheet, columnCount) {
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, columnCount).setFontWeight("bold").setBackground("#17372f").setFontColor("#ffffff");
  sheet.autoResizeColumns(1, columnCount);
}

function rowToObject(headers, row) {
  const object = {};
  headers.forEach((header, index) => {
    const value = row[index];
    if (LOG_NUMBER_HEADERS.indexOf(header) >= 0) {
      object[header] = numberValue(value);
    } else if (LOG_DATE_HEADERS.indexOf(header) >= 0) {
      object[header] = formatRecordDate(value) || formatLegacyDate(value) || "";
    } else if (header === "shift") {
      object[header] = toOriginalShift(value);
    } else if (value instanceof Date) {
      object[header] = Utilities.formatDate(value, "Asia/Bangkok", "yyyy-MM-dd");
    } else {
      object[header] = value == null ? "" : String(value);
    }
  });
  return object;
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
