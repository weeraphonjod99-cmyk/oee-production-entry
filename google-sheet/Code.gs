const SPREADSHEET_ID = "";
const DATABASE_TITLE = "OEE Production Database";
const LOG_SHEET = "production_logs";
const MACHINE_SHEET = "machines";
const PRODUCT_MASTER_SHEET = "product_master";
const DOWNTIME_CATALOG_SHEET = "downtime_catalog";

const MACHINES_CSV_URL = "https://raw.githubusercontent.com/weeraphonjod99-cmyk/oee-production-entry/main/google-sheet/machines.csv";
const PRODUCT_MASTER_CSV_URL = "https://raw.githubusercontent.com/weeraphonjod99-cmyk/oee-production-entry/main/google-sheet/product_master.csv";

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
    return jsonResponse({ ok: false, error: "Unknown action" });
  } catch (error) {
    return jsonResponse({ ok: false, error: String(error && error.message ? error.message : error) });
  }
}

function appendLog(payload) {
  const sheet = ensureSheet(LOG_SHEET, LOG_HEADERS);
  const log = Object.assign({}, payload, {
    id: payload.id || Utilities.getUuid(),
    createdAt: payload.createdAt || new Date().toISOString(),
    source: "google-sheet",
  });
  sheet.appendRow(LOG_HEADERS.map((header) => log[header] == null ? "" : log[header]));
  return log;
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
