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
    if (action === "repairOeeFormulas") {
      return jsonResponse({ ok: true, result: repairOeeFormulas() });
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
  assertNoDuplicateOeeLog(log, "", true);
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
  assertNoDuplicateOeeLog(log, payload.id, false);

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
      " มีการบันทึกแล้ว"
  );
}

function findDuplicateOeeLog(log, ignoredId, includeMachineSheet) {
  const wantedKey = buildOeeLogKey(log);
  const logSheet = ensureSheet(LOG_SHEET, LOG_HEADERS);
  const rows = logSheet.getDataRange().getValues();
  if (rows.length > 1) {
    const headers = rows[0];
    for (let index = 1; index < rows.length; index++) {
      const row = rows[index];
      if (!row.some(function(cell) { return cell !== ""; })) continue;
      const existing = rowToObject(headers, row);
      if (String(existing.id || "") === String(ignoredId || "")) continue;
      if (buildOeeLogKey(existing) === wantedKey) return existing;
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
    if (buildOeeLogKey(existing) === wantedKey) return existing;
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
        totalQty: 28,
        theoreticalImpulse: 29,
        cavityQty: 30,
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
        totalQty: 27,
        theoreticalImpulse: 28,
        cavityQty: 29,
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
    numberValue(log.testQty) > 0 ? numberValue(log.testQty) : "",
  ]]);
  sheet.getRange(row, layout.totalQty).setFormula(buildTotalQuantityFormula(row, layout));

  sheet.getRange(row, layout.theoreticalImpulse).setValue(numberValue(log.machineSpeed));
  sheet.getRange(row, layout.cavityQty).setValue(numberValue(log.cavityQty));
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
  if (text === "白" || text === "็ฝ" || text.toLowerCase() === "day" || text.toUpperCase() === "A") return "白";
  if (text === "夜" || text === "ๅค\u009c" || text.toLowerCase() === "night" || text.toUpperCase() === "B") return "夜";
  return text;
}

function getLogs(limit) {
  const sheet = ensureSheet(LOG_SHEET, LOG_HEADERS);
  const values = sheet.getDataRange().getValues();
  const legacyLogs = getLegacyOeeLogs();
  if (values.length <= 1) return legacyLogs.slice(0, limit);
  const headers = values[0];
  const productionLogs = values
    .slice(1)
    .filter((row) => row.some((cell) => cell !== ""))
    .slice(Math.max(values.length - 1 - limit, 0))
    .map((row) => rowToObject(headers, row))
    .reverse();
  return mergeLogs(productionLogs, legacyLogs).slice(0, limit);
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
        date: date,
        shift: toOriginalShift(row[layout.shift - 1]),
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
