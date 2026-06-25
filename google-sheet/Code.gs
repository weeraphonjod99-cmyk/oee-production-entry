const SPREADSHEET_ID = "1-3RKcRJC_ENe-xCWMIYYHqYYaKj0cyCG8n-MwMWQMXM";
const DATABASE_TITLE = "OEE Production Database";
const LOG_SHEET = "production_logs";
const MACHINE_SHEET = "machines";
const PRODUCT_MASTER_SHEET = "product_master";
const DOWNTIME_CATALOG_SHEET = "downtime_catalog";
const USER_SHEET = "app_users";
const PD_EXTERNAL_SHEETS = [
  {
    id: "1O1q9jOeTs81xOAUjTTXoDvVSqM5zFl5j",
    label: "PD 1",
    url: "https://docs.google.com/spreadsheets/d/1O1q9jOeTs81xOAUjTTXoDvVSqM5zFl5j/edit",
  },
  {
    id: "1eXby1xmCjhp_C8H_r7OC8JmnLu00WRYq",
    label: "PD 2",
    url: "https://docs.google.com/spreadsheets/d/1eXby1xmCjhp_C8H_r7OC8JmnLu00WRYq/edit",
  },
];
const PD_MAX_ROWS_PER_SHEET = 300;
const PD_MAX_COLUMNS_PER_SHEET = 40;

const MACHINES_CSV_URL = "https://raw.githubusercontent.com/weeraphonjod99-cmyk/oee-production-entry/main/google-sheet/machines.csv";
const PRODUCT_MASTER_CSV_URL = "https://raw.githubusercontent.com/weeraphonjod99-cmyk/oee-production-entry/main/google-sheet/product_master.csv";
const OEE_HEADER_ROW = 3;
const OEE_FIRST_DATA_ROW = 4;
const OEE_MINUTES_PER_SLOT = 5;
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
    if (action === "pdSheets") {
      return jsonResponse({ ok: true, sources: getPdExternalSheets() });
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
  if (role !== "admin" && role !== "production") {
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
  return hasStep
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
}

function detectOeeOutputColumns(headers) {
  const result = {};
  headers.forEach(function(header, index) {
    const text = normalizeHeaderText(header);
    const column = index + 1;
    if (!result.goodQty && text.indexOf("good") >= 0) result.goodQty = column;
    if (!result.ngQty && (text.indexOf("ng") >= 0 || text.indexOf("不合格") >= 0)) result.ngQty = column;
    if (!result.testQty && (text.indexOf("test") >= 0 || text.indexOf("ทดสอบ") >= 0)) result.testQty = column;
    if (!result.totalQty && text.indexOf("total") >= 0 && text.indexOf("quantity") >= 0) result.totalQty = column;
    if (!result.theoreticalImpulse && (text.indexOf("theoretical") >= 0 || text.indexOf("impulse") >= 0)) result.theoreticalImpulse = column;
    if (!result.cavityQty && (text.indexOf("cavity") >= 0 || text.indexOf("cavities") >= 0)) result.cavityQty = column;
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
  sheet.getRange(row, layout.goodQty).setNumberFormat("0.##").setValue(numberValue(log.goodQty));
  sheet.getRange(row, layout.ngQty).setNumberFormat("0.##").setValue(numberValue(log.ngQty));
  sheet
    .getRange(row, layout.testQty)
    .setNumberFormat("0.##")
    .setValue(numberValue(log.testQty) > 0 ? numberValue(log.testQty) : "");
  sheet.getRange(row, layout.totalQty).setFormula(buildTotalQuantityFormula(row, layout));

  sheet.getRange(row, layout.theoreticalImpulse).setNumberFormat("0.##").setValue(numberValue(log.machineSpeed));
  sheet.getRange(row, layout.cavityQty).setNumberFormat("0.##").setValue(numberValue(log.cavityQty));
}

function repairOeeFormulas() {
  const book = getWorkbook();
  const machineByName = getMachineMap();
  const loggedTestValues = getLoggedTestValueMap();
  let sheetCount = 0;
  let testValueCount = 0;
  let totalFormulaCount = 0;

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
    const totalRange = sheet.getRange(OEE_FIRST_DATA_ROW, layout.totalQty, rowCount, 1);
    const totalFormulas = totalRange.getFormulas();
    let testChanged = false;
    let totalChanged = false;

    sheetCount++;
    for (let index = 0; index < rowCount; index++) {
      const row = OEE_FIRST_DATA_ROW + index;
      const productName = String(identityValues[index][0] || "").trim();
      const partNo = String(identityValues[index][width - 1] || "").trim();
      if (!productName || !partNo) continue;

      const loggedTest = loggedTestValues[
        buildOeeLogKey({
          date: formatLegacyDate(sourceValues[index][layout.date - 1]),
          shift: toOriginalShift(sourceValues[index][layout.shift - 1]),
          machineName: machine.name,
          productName: productName,
          partNo: partNo,
          step: layout.hasStep ? String(sourceValues[index][layout.step - 1] || "-").trim() || "-" : "-",
        })
      ];
      const nextTestValue = numberValue(loggedTest) > 0 ? numberValue(loggedTest) : "";
      if (testFormulas[index][0] || testValues[index][0] !== nextTestValue) {
        testValues[index][0] = nextTestValue;
        testValueCount++;
        testChanged = true;
      }

      const expectedFormula = buildTotalQuantityFormula(row, layout);
      if (totalFormulas[index][0] !== expectedFormula) {
        totalFormulas[index][0] = expectedFormula;
        totalFormulaCount++;
        totalChanged = true;
      }
    }

    if (testChanged) {
      testRange.setValues(testValues);
    }
    if (totalChanged) {
      totalRange.setFormulas(totalFormulas);
    }
  });

  return { sheets: sheetCount, testValues: testValueCount, totalFormulas: totalFormulaCount };
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
  for (let column = layout.downtimeStart; column < layout.downtimeStart + 8; column++) {
    parts.push(columnToLetter(column) + row);
  }
  return "=" + workSlots + "-" + parts.join("-");
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

function getNumberHeadersForSheet(name) {
  if (name === LOG_SHEET) return LOG_NUMBER_HEADERS;
  if (name === MACHINE_SHEET) return MACHINE_NUMBER_HEADERS;
  if (name === PRODUCT_MASTER_SHEET) return PRODUCT_NUMBER_HEADERS;
  return [];
}

function getPdExternalSheets() {
  return PD_EXTERNAL_SHEETS.map(function(source) {
    try {
      const url = "https://docs.google.com/spreadsheets/d/" + source.id + "/export?format=csv&gid=0";
      const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
      const statusCode = response.getResponseCode();
      if (statusCode < 200 || statusCode >= 300) {
        throw new Error("อ่านไฟล์ไม่ได้ HTTP " + statusCode + " กรุณาแชร์ Google Sheet เป็น Anyone with the link can view หรือแชร์ให้บัญชี Apps Script");
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
        name: source.label,
        url: source.url,
        fetchedAt: new Date().toISOString(),
        error: String(error && error.message ? error.message : error),
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
