const SPREADSHEET_ID = "";
const LOG_SHEET = "production_logs";

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

function doGet(e) {
  const action = e.parameter.action || "health";
  try {
    if (action === "logs") {
      const limit = Number(e.parameter.limit || 500);
      return jsonResponse({ ok: true, logs: getLogs(limit) });
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
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, LOG_HEADERS.length).setFontWeight("bold").setBackground("#17372f").setFontColor("#ffffff");
  sheet.autoResizeColumns(1, LOG_HEADERS.length);
}

function ensureSheet(name, headers) {
  const book = SPREADSHEET_ID
    ? SpreadsheetApp.openById(SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
  const sheet = book.getSheetByName(name) || book.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  } else {
    migrateHeaders(sheet, headers);
  }
  return sheet;
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
