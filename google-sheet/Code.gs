const SPREADSHEET_ID = "1-3RKcRJC_ENe-xCWMIYYHqYYaKj0cyCG8n-MwMWQMXM";
const DATABASE_TITLE = "OEE Production Database";
const LOG_SHEET = "production_logs";
const MACHINE_SHEET = "machines";
const PRODUCT_MASTER_SHEET = "product_master";
const DOWNTIME_CATALOG_SHEET = "downtime_catalog";
const USER_SHEET = "app_users";

const MACHINES_CSV_URL = "https://raw.githubusercontent.com/weeraphonjod99-cmyk/oee-production-entry/main/google-sheet/machines.csv";
const PRODUCT_MASTER_CSV_URL = "https://raw.githubusercontent.com/weeraphonjod99-cmyk/oee-production-entry/main/google-sheet/product_master.csv";
const OEE_HEADER_ROW = 3;
const OEE_FIRST_DATA_ROW = 4;
const OEE_MINUTES_PER_SLOT = 5;

const LOG_HEADERS = [
  "id",
  "date",
  "shift",
  "machineId",
  "machineName",
  "productName",
  "partNo",
  "step",
  "workMinutes",
  "timeSlots",
  "minutesPerSlot",
  "machineSpeed",
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
    if (action === "setup") {
      const book = setupProductionWorkbook();
      return jsonResponse({
        ok: true,
        service: "oee-production-entry",
        spreadsheetId: book.getId(),
        spreadsheetUrl: book.getUrl(),
      });
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
  const log = Object.assign({}, payload, {
    id: payload.id || Utilities.getUuid(),
    createdAt: payload.createdAt || new Date().toISOString(),
    updatedAt: payload.updatedAt || new Date().toISOString(),
    source: "google-sheet",
  });
  appendFormattedOeeRow(log);
  const sheet = ensureSheet(LOG_SHEET, LOG_HEADERS);
  sheet.appendRow(LOG_HEADERS.map((header) => log[header] == null ? "" : log[header]));
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
    createdAt: payload.createdAt || new Date().toISOString(),
    updatedAt: payload.updatedAt || new Date().toISOString(),
    source: "google-sheet",
  });

  if (rowIndex >= 0) {
    sheet.getRange(rowIndex + 1, 1, 1, LOG_HEADERS.length).setValues([
      LOG_HEADERS.map(function(header) {
        return log[header] == null ? "" : log[header];
      }),
    ]);
    return log;
  }

  sheet.appendRow(LOG_HEADERS.map(function(header) {
    return log[header] == null ? "" : log[header];
  }));
  return log;
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
  return {
    machineSpeed: machineSpeed > 0 ? machineSpeed : "",
    minutesPerSlot: OEE_MINUTES_PER_SLOT,
  };
}

function findOeeProductRow(sheet, layout, log) {
  const product = normalizeLookup(log.productName);
  const partNo = normalizeLookup(log.partNo);
  const step = normalizeLookup(log.step || "-");

  for (let row = sheet.getLastRow(); row >= OEE_FIRST_DATA_ROW; row--) {
    const width = layout.hasStep ? 3 : 2;
    const values = sheet.getRange(row, layout.productName, 1, width).getDisplayValues()[0];
    const sameProduct = normalizeLookup(values[0]) === product;
    const samePart = normalizeLookup(values[1]) === partNo;
    const sameStep = !layout.hasStep || normalizeLookup(values[2] || "-") === step;
    if (sameProduct && samePart && sameStep) {
      return row;
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
  const hasStep = String(headers[5] || "").toLowerCase().indexOf("step") >= 0;
  return hasStep
    ? {
        hasStep: true,
        sequence: 1,
        date: 2,
        shift: 3,
        productName: 4,
        partNo: 5,
        step: 6,
        normalSlot: 7,
        downtimeStart: 8,
        normalMinutes: 16,
        goodQty: 25,
        ngQty: 26,
        testQty: 27,
        theoreticalImpulse: 29,
      }
    : {
        hasStep: false,
        sequence: 1,
        date: 2,
        shift: 3,
        productName: 4,
        partNo: 5,
        normalSlot: 6,
        downtimeStart: 7,
        normalMinutes: 15,
        goodQty: 24,
        ngQty: 25,
        testQty: 26,
        theoreticalImpulse: 28,
      };
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
  sheet.getRange(row, layout.date).setValue(parseSheetDate(log.date));
  sheet.getRange(row, layout.shift).setValue(toOriginalShift(log.shift));
  sheet.getRange(row, layout.productName).setValue(log.productName || "");
  sheet.getRange(row, layout.partNo).setValue(log.partNo || "");
  if (layout.hasStep) {
    sheet.getRange(row, layout.step).setValue(log.step || "-");
  }

  sheet.getRange(row, layout.normalSlot).setFormula(buildNormalSlotFormula(row, layout, workSlots));
  sheet.getRange(row, layout.downtimeStart, 1, downtimeSlots.length).setValues([downtimeSlots]);
  sheet.getRange(row, layout.goodQty, 1, 3).setValues([[
    numberValue(log.goodQty),
    numberValue(log.ngQty),
    numberValue(log.testQty),
  ]]);

  if (numberValue(log.machineSpeed) > 0) {
    sheet.getRange(row, layout.theoreticalImpulse).setValue(numberValue(log.machineSpeed));
  }
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
  if (text === "白" || text === "็ฝ" || text.toLowerCase() === "day" || text.toUpperCase() === "A") return "白";
  if (text === "夜" || text === "ๅค\u009c" || text.toLowerCase() === "night" || text.toUpperCase() === "B") return "夜";
  return text;
}

function getLogs(limit) {
  const sheet = ensureSheet(LOG_SHEET, LOG_HEADERS);
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  const headers = values[0];
  return values
    .slice(1)
    .filter((row) => row.some((cell) => cell !== ""))
    .slice(Math.max(values.length - 1 - limit, 0))
    .map((row) => rowToObject(headers, row))
    .reverse();
}

function setupProductionWorkbook() {
  const sheet = ensureSheet(LOG_SHEET, LOG_HEADERS);
  formatHeader(sheet, LOG_HEADERS.length);
  importCsvSheet(MACHINE_SHEET, MACHINE_HEADERS, MACHINES_CSV_URL);
  importCsvSheet(PRODUCT_MASTER_SHEET, PRODUCT_MASTER_HEADERS, PRODUCT_MASTER_CSV_URL);
  setupDowntimeCatalog();
  ensureUsersSheet();
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
    formatHeader(sheet, headers.length);
    return;
  }

  const csv = UrlFetchApp.fetch(url).getContentText();
  const rows = Utilities.parseCsv(csv);
  if (!rows.length) return;

  const normalizedRows = rows.map((row, index) => {
    if (index === 0) return headers;
    return headers.map((_, columnIndex) => row[columnIndex] == null ? "" : row[columnIndex]);
  });

  sheet.clearContents();
  sheet.getRange(1, 1, normalizedRows.length, headers.length).setValues(normalizedRows);
  formatHeader(sheet, headers.length);
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
    object[header] = value instanceof Date ? Utilities.formatDate(value, "Asia/Bangkok", "yyyy-MM-dd") : value;
  });
  return object;
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
