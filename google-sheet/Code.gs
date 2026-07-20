const SPREADSHEET_ID = "1-3RKcRJC_ENe-xCWMIYYHqYYaKj0cyCG8n-MwMWQMXM";
const DATABASE_TITLE = "OEE Production Database";
const LOG_SHEET = "production_logs";
const MACHINE_SHEET = "machines";
const PRODUCT_MASTER_SHEET = "product_master";
const DOWNTIME_CATALOG_SHEET = "downtime_catalog";
const USER_SHEET = "app_users";
const ONLINE_USER_SHEET = "app_online_users";
const EMPLOYEE_STATUS_SHEET = "employee_machine_status";
const ROLE_NOTIFICATION_SHEET = "role_notifications";
const SUBMIT_HISTORY_SHEET = "submit_history";
const SUBMIT_HISTORY_SHEET_ID = 1754160605;
const ONLINE_USER_ACTIVE_WINDOW_MS = 2 * 60 * 1000;
const EMPLOYEE_STATUS_HEARTBEAT_MAX_AGE_MS = 16 * 60 * 60 * 1000;
const EMPLOYEE_STATUS_CACHE_KEY = "employee_machine_statuses_v2";
const EMPLOYEE_STATUS_CACHE_SECONDS = 3;
const ROLE_NOTIFICATION_MAX_AGE_MS = 2 * 60 * 60 * 1000;
const ROLE_NOTIFICATION_MAX_ROWS = 300;
const HIDDEN_MACHINE_IDS = {
  "1-arc-stack": true,
  "2-arc-stack": true,
  "3-cut-chamber": true,
  "4-gv2": true,
  "5-arc-chute": true,
  "6-arc-chute": true,
  "7-arc-chute": true,
  "8-arc-chute": true,
};
function isVisibleMachineId(machineId) {
  return !HIDDEN_MACHINE_IDS[String(machineId || "").trim()];
}
const KPI_DASHBOARD_SHEET = "kpi_dashboard";
const KPI_MACHINE_SHEET = "kpi_machine";
const KPI_MACHINE_STEP_SHEET = "kpi_machine_step";
const KPI_MACHINE_JOB_STEP_SHEET = "kpi_machine_job_step";
const KPI_DAILY_DETAIL_SHEET = "kpi_daily_detail";
const KPI_NOTES_SHEET = "kpi_notes";
const KPI_REFRESH_ACTION = "refreshKpi";
const KPI_AUTO_REFRESH_HANDLER = "refreshKpiSheets";
const KPI_PD_CACHE_PREFIX = "pd_native_cache_";
const PRODUCTION_ORDER_SPREADSHEET_ID = "1gR-a77vkgVxDu0jdSZ9RPhnGLC5OabIRHSRGBN0hZ18";
const PRODUCTION_ORDER_MAX_ROWS = 200;
const PRODUCTION_ORDER_COLUMNS = {
  no: 1,
  openedDate: 2,
  orderNo: 3,
  productName: 4,
  partNo: 5,
  rmNo: 6,
  orderQty: 7,
  unit: 8,
  dueDate: 9,
  shift: 10,
  kpi85: 11,
  dailyTarget: 12,
  expectedDoneDate: 13,
  expectedDoneTime: 14,
  startDate: 15,
  endDate: 16,
  producedQty: 17,
  readyForPainting: 18,
  backlogQty: 19,
  ngRework: 20,
  status: 21,
  progress: 22,
  stock: 23,
};
const PRODUCTION_ORDER_HEADERS = [
  "No.",
  "วันที่เปิดออเดอร์",
  "Order No.",
  "Part Name",
  "Part No.",
  "RM No.",
  "ยอดสั่งซื้อ",
  "",
  "วันที่ต้องการ ",
  "กะ",
  "KPI85 ชิ้น/นาที",
  "เป้าหมายผลิต/วัน KPI 85%",
  "คาดเสร็จวันที่",
  "คาดเสร็จเวลา",
  "วันที่เริ่ม",
  "วันที่จบ ",
  "ยอดการผลิต ",
  "Ready for painting",
  "ยอดค้างส่ง ",
  "NG/ReWork",
  "สถานะการผลิต ",
  "%ความคืบหน้า ",
  "Stock",
];
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
    gid: "120835667",
    url: "https://docs.google.com/spreadsheets/d/1eXby1xmCjhp_C8H_r7OC8JmnLu00WRYq/edit?gid=120835667#gid=120835667",
  },
];
const PD_MAX_ROWS_PER_SHEET = 300;
const PD_KPI_MAX_ROWS_PER_SHEET = 2000;
const PD_MAX_COLUMNS_PER_SHEET = 40;
const PRODUCTION_CAPACITY_SPREADSHEET_ID = "1eXby1xmCjhp_C8H_r7OC8JmnLu00WRYq";
const PRODUCTION_CAPACITY_GID = "1541790103";
const PRODUCTION_CAPACITY_URL = "https://docs.google.com/spreadsheets/d/1eXby1xmCjhp_C8H_r7OC8JmnLu00WRYq/edit?gid=1541790103#gid=1541790103";
const PRODUCTION_CAPACITY_CACHE_KEY = "production_capacity_v1";
const PRODUCTION_CAPACITY_CACHE_SECONDS = 60;
const PRODUCTION_CAPACITY_MAX_ROWS_PER_SHEET = 700;
const PRODUCTION_CAPACITY_MAX_COLUMNS_PER_SHEET = 32;

const MACHINES_CSV_URL = "https://raw.githubusercontent.com/weeraphonjod99-cmyk/oee-production-entry/main/google-sheet/machines.csv";
const PRODUCT_MASTER_CSV_URL = "https://raw.githubusercontent.com/weeraphonjod99-cmyk/oee-production-entry/main/google-sheet/product_master.csv";
const PRODUCTION_LOGS_SEED_CSV_URL = "https://raw.githubusercontent.com/weeraphonjod99-cmyk/oee-production-entry/main/google-sheet/production_logs_seed.csv";
const OEE_HEADER_ROW = 3;
const OEE_FIRST_DATA_ROW = 4;
const OEE_MINUTES_PER_SLOT = 5;
const OEE_SHIFT_BREAK_MINUTES = 130;
const OEE_ENTRY_DATE_HEADER = "วันที่กรอกยอด\nEntry Date";
const OEE_ENTRY_TIME_HEADER = "เวลากรอก\nEntry Time";
const OEE_ENTRY_USER_HEADER = "ผู้กรอก\nEntry User";
const OEE_SUBMIT_TIME_HEADER = "เวลาส่งยอด\nSubmit Time";
const OEE_BUTTON_DETAILS_HEADER = "รายละเอียดการกดปุ่ม\nButton Details";
const OEE_TEST_HEADER = "งาน\nทดสอบ\n/Test";

const OEE_ORDER_NO_HEADER = "เลขที่ออเดอร์\nOrder No.";

const LOG_HEADERS = [
  "id",
  "recordDate",
  "recordTime",
  "entryUser",
  "submittedAt",
  "buttonDetails",
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
  "productionOrderNo",
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
  "newModelMinutes",
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
  "newModelMinutes",
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
  "newModelMinutes",
  "note",
  "activeTimerKey",
  "activeTimerLabel",
  "activeTimerStartedAt",
  "activeTimerBaseAt",
  "activeTimerBaseMinutes",
  "buttonDetails",
  "buttonDetailsUpdatedAt",
  "workStartedAt",
  "entryStartedAt",
  "status",
  "entryUpdatedAt",
  "updatedAt",
  "expiresAt",
];

const SUBMIT_HISTORY_HEADERS = [
  "historyId",
  "action",
  "entryDate",
  "entryTime",
  "submittedAt",
  "entryUser",
  "productionDate",
  "shift",
  "shiftStartAt",
  "shiftEndAt",
  "machineId",
  "machineName",
  "productName",
  "partNo",
  "step",
  "materialOfProduction",
  "productionOrderNo",
  "goodQty",
  "ngQty",
  "testQty",
  "totalQty",
  "workMinutes",
  "normalMinutes",
  "downtimeMinutes",
  "machineSpeed",
  "cavityQty",
  "recordDate",
  "recordTime",
  "logId",
  "formattedSheet",
  "formattedRow",
  "buttonDetails",
  "note",
  "createdAt",
];

const SUBMIT_HISTORY_NUMBER_HEADERS = [
  "goodQty",
  "ngQty",
  "testQty",
  "totalQty",
  "workMinutes",
  "normalMinutes",
  "downtimeMinutes",
  "machineSpeed",
  "cavityQty",
  "formattedRow",
];

const LOG_DATE_HEADERS = ["recordDate", "date"];

const MACHINE_NUMBER_HEADERS = ["capacityUnits", "capacityMinutes", "rowCount"];
const PRODUCT_NUMBER_HEADERS = ["sampleGoodQty", "sampleNgQty", "sampleTestQty"];
const EMPLOYEE_STATUS_NUMBER_HEADERS = [
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
  "newModelMinutes",
  "activeTimerBaseMinutes",
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

const ONLINE_USER_HEADERS = [
  "clientId",
  "username",
  "displayName",
  "role",
  "lastSeenAt",
  "userAgent",
];

const ROLE_NOTIFICATION_HEADERS = [
  "id",
  "createdAt",
  "targetRoles",
  "sourceRole",
  "sourceUser",
  "machineId",
  "machineName",
  "buttonCode",
  "buttonLabel",
  "message",
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
  ["newModelMinutes", "ทดลองงานใหม่ / New model", "New model", 90],
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
    if (action === "onlineUsers") {
      return jsonResponse({ ok: true, online: getOnlineUsersSummary() });
    }
    if (action === "employeeMachineStatuses") {
      return jsonResponse({ ok: true, statuses: getEmployeeMachineStatuses() });
    }
    if (action === "roleNotifications") {
      return jsonResponse({ ok: true, notifications: getRoleNotifications(e.parameter || {}) });
    }
    if (action === "productionOrders") {
      return jsonResponse({ ok: true, orders: getProductionOrders(e.parameter || {}) });
    }
    if (action === "productionOrderSummaries") {
      return jsonResponse({ ok: true, summaries: getProductionOrderSummaries() });
    }
    if (action === "productionCapacity") {
      return jsonResponse({ ok: true, capacity: getProductionCapacityData(e.parameter || {}) });
    }
    if (action === "auditEmployeeMachineStatuses") {
      return jsonResponse({ ok: true, result: auditEmployeeMachineStatuses() });
    }
    if (action === "pdSheets") {
      return jsonResponse({ ok: true, sources: [], disabled: true });
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
    if (action === "auditOeeMachineSheets") {
      return jsonResponse({ ok: true, result: auditOeeMachineSheets() });
    }
    if (action === "repairMissingFormattedOeeRows") {
      return jsonResponse({ ok: true, result: repairMissingFormattedOeeRows() });
    }
    if (action === "compactOeeMachineRows") {
      return jsonResponse({ ok: true, result: compactOeeMachineRows() });
    }
    if (action === "migrateOeeEntryTimestampColumns") {
      return jsonResponse({ ok: true, result: migrateOeeEntryTimestampColumns() });
    }
    if (action === "migrateOeeTestColumns") {
      return jsonResponse({ ok: true, result: migrateOeeTestColumns() });
    }
    if (action === "migrateOeeMinuteInputColumns") {
      return jsonResponse({ ok: true, result: migrateOeeMinuteInputColumns() });
    }
    if (action === "repairOeeMinuteOutputValues") {
      return jsonResponse({ ok: true, result: repairOeeMinuteOutputValues() });
    }
    if (action === "repairOeeMinuteOutputFormulas") {
      return jsonResponse({ ok: true, result: repairOeeMinuteOutputValues() });
    }
    if (action === "repairNegativeOeeMinuteValues") {
      return jsonResponse({ ok: true, result: repairNegativeOeeMinuteValues() });
    }
    if (action === "repairOeeMinutePrecision") {
      return jsonResponse({ ok: true, result: repairOeeMinutePrecision() });
    }
    if (action === "setupSubmitHistory") {
      const sheet = ensureSubmitHistorySheet();
      return jsonResponse({
        ok: true,
        result: {
          sheetId: sheet.getSheetId(),
          sheetName: sheet.getName(),
          spreadsheetId: sheet.getParent().getId(),
          spreadsheetUrl: sheet.getParent().getUrl(),
        },
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
    if (body.action === "upsertEmployeeMachineStatus") {
      const status = upsertEmployeeMachineStatus(body.payload || {});
      return jsonResponse({ ok: true, status });
    }
    if (body.action === "clearEmployeeMachineStatus") {
      clearEmployeeMachineStatus(body.payload || {});
      return jsonResponse({ ok: true });
    }
    if (body.action === "createRoleNotification") {
      const notification = createRoleNotification(body.payload || {});
      return jsonResponse({ ok: true, notification: notification });
    }
    if (body.action === "upsertProductionOrder") {
      const order = upsertProductionOrder(body.payload || {});
      return jsonResponse({ ok: true, order: order });
    }
    if (body.action === "reorderProductionOrder") {
      const order = reorderProductionOrder(body.payload || {});
      return jsonResponse({ ok: true, order: order });
    }
    if (body.action === "onlineUserHeartbeat") {
      return jsonResponse({ ok: true, online: onlineUserHeartbeat(body.payload || {}) });
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

function onlineUserHeartbeat(payload) {
  const clientId = String(payload.clientId || "").trim();
  if (!clientId) {
    throw new Error("clientId is required");
  }
  const now = new Date();
  const sheet = ensureSheet(ONLINE_USER_SHEET, ONLINE_USER_HEADERS);
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    const values = sheet.getDataRange().getValues();
    let rowIndex = -1;
    for (let index = 1; index < values.length; index += 1) {
      if (String(values[index][0] || "") === clientId) {
        rowIndex = index + 1;
        break;
      }
    }
    const row = [
      clientId,
      String(payload.username || "").trim(),
      String(payload.displayName || "").trim(),
      String(payload.role || "").trim(),
      now.toISOString(),
      String(payload.userAgent || "").slice(0, 180),
    ];
    if (rowIndex > 0) {
      sheet.getRange(rowIndex, 1, 1, ONLINE_USER_HEADERS.length).setValues([row]);
    } else {
      sheet.appendRow(row);
    }
    return pruneAndReadOnlineUsers(sheet, now);
  } finally {
    lock.releaseLock();
  }
}

function getOnlineUsersSummary() {
  const sheet = ensureSheet(ONLINE_USER_SHEET, ONLINE_USER_HEADERS);
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    return pruneAndReadOnlineUsers(sheet, new Date());
  } finally {
    lock.releaseLock();
  }
}

function pruneAndReadOnlineUsers(sheet, now) {
  const rows = sheet.getDataRange().getValues();
  const activeUsers = [];
  for (let index = rows.length - 1; index >= 1; index -= 1) {
    const lastSeenAt = parseOnlineUserDate(rows[index][4]);
    if (!lastSeenAt || now.getTime() - lastSeenAt.getTime() > ONLINE_USER_ACTIVE_WINDOW_MS) {
      sheet.deleteRow(index + 1);
      continue;
    }
    activeUsers.push({
      clientId: String(rows[index][0] || ""),
      username: String(rows[index][1] || ""),
      displayName: String(rows[index][2] || ""),
      role: String(rows[index][3] || ""),
      lastSeenAt: lastSeenAt.toISOString(),
    });
  }
  activeUsers.sort(function(left, right) {
    return String(right.lastSeenAt || "").localeCompare(String(left.lastSeenAt || ""));
  });
  return {
    activeWindowSeconds: Math.floor(ONLINE_USER_ACTIVE_WINDOW_MS / 1000),
    onlineCount: activeUsers.length,
    updatedAt: now.toISOString(),
    users: activeUsers,
  };
}

function parseOnlineUserDate(value) {
  if (value instanceof Date) return value;
  const date = new Date(String(value || ""));
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeRoleList(value) {
  const allowed = {
    admin: true,
    production: true,
    qc: true,
    tooling_repair: true,
    technician: true,
    planning: true,
  };
  const source = Array.isArray(value) ? value : String(value || "").split(",");
  const seen = {};
  const roles = [];
  source.forEach(function(item) {
    const role = String(item || "").trim();
    if (!role || !allowed[role] || seen[role]) return;
    seen[role] = true;
    roles.push(role);
  });
  return roles;
}

function createRoleNotification(payload) {
  const now = new Date();
  const roles = normalizeRoleList(payload.targetRoles);
  const notification = {
    id: String(payload.id || Utilities.getUuid()),
    createdAt: String(payload.createdAt || now.toISOString()),
    targetRoles: roles.join(","),
    sourceRole: String(payload.sourceRole || ""),
    sourceUser: String(payload.sourceUser || ""),
    machineId: String(payload.machineId || ""),
    machineName: String(payload.machineName || ""),
    buttonCode: String(payload.buttonCode || ""),
    buttonLabel: String(payload.buttonLabel || ""),
    message: String(payload.message || ""),
  };
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    const sheet = ensureSheet(ROLE_NOTIFICATION_SHEET, ROLE_NOTIFICATION_HEADERS);
    sheet.appendRow(ROLE_NOTIFICATION_HEADERS.map(function(header) {
      return notification[header] || "";
    }));
    pruneRoleNotifications(sheet, now);
  } finally {
    lock.releaseLock();
  }
  return normalizeRoleNotification(notification);
}

function getRoleNotifications(params) {
  const role = String(params.role || "").trim();
  if (!role) return [];
  if (role === "admin") return [];
  const sinceDate = parseOnlineUserDate(params.since);
  const now = new Date();
  const sheet = ensureSheet(ROLE_NOTIFICATION_SHEET, ROLE_NOTIFICATION_HEADERS);
  const values = sheet.getDataRange().getValues();
  const notifications = [];
  for (let i = values.length - 1; i >= 1; i--) {
    const item = normalizeRoleNotification(rowToObject(ROLE_NOTIFICATION_HEADERS, values[i]));
    const createdAt = parseOnlineUserDate(item.createdAt);
    if (!createdAt) continue;
    if (now.getTime() - createdAt.getTime() > ROLE_NOTIFICATION_MAX_AGE_MS) continue;
    if (sinceDate && createdAt.getTime() <= sinceDate.getTime()) continue;
    if (role !== "admin" && item.targetRoles.indexOf(role) < 0) continue;
    notifications.push(item);
    if (notifications.length >= 20) break;
  }
  return notifications;
}

function normalizeRoleNotification(item) {
  const targetRoles = normalizeRoleList(item.targetRoles);
  return {
    id: String(item.id || ""),
    createdAt: String(item.createdAt || ""),
    targetRoles: targetRoles,
    sourceRole: String(item.sourceRole || ""),
    sourceUser: String(item.sourceUser || ""),
    machineId: String(item.machineId || ""),
    machineName: String(item.machineName || ""),
    buttonCode: String(item.buttonCode || ""),
    buttonLabel: String(item.buttonLabel || ""),
    message: String(item.message || ""),
  };
}

function pruneRoleNotifications(sheet, now) {
  const values = sheet.getDataRange().getValues();
  let keptRows = 0;
  for (let i = values.length - 1; i >= 1; i--) {
    const createdAt = parseOnlineUserDate(values[i][1]);
    const expired = !createdAt || now.getTime() - createdAt.getTime() > ROLE_NOTIFICATION_MAX_AGE_MS;
    keptRows += expired ? 0 : 1;
    if (expired || keptRows > ROLE_NOTIFICATION_MAX_ROWS) {
      sheet.deleteRow(i + 1);
    }
  }
}

function appendLog(payload) {
  const now = new Date();
  const productionDate = formatRecordDate(payload.date) || todayBangkok(now);
  const log = normalizeProductionLogMinuteFields(Object.assign({}, payload, {
    id: payload.id || Utilities.getUuid(),
    date: productionDate,
    buttonDetails: String(payload.buttonDetails || ""),
    entryUser: String(payload.entryUser || payload.userName || ""),
    recordDate: formatRecordDate(payload.recordDate) || todayBangkok(now),
    recordTime: formatRecordTime(payload.recordTime) || timeBangkok(now),
    submittedAt: formatRecordDateTime(payload.submittedAt) || dateTimeBangkok(now),
    shiftStartAt: payload.shiftStartAt || getShiftStartAt(productionDate, payload.shift),
    shiftEndAt: payload.shiftEndAt || getShiftEndAt(productionDate, payload.shift),
    createdAt: payload.createdAt || now.toISOString(),
    updatedAt: payload.updatedAt || now.toISOString(),
    source: "google-sheet",
  }));
  assertNoDuplicateOeeLog(log, "", true);
  const formattedRow = appendFormattedOeeRow(log);
  const sheet = ensureSheet(LOG_SHEET, LOG_HEADERS);
  writeSerializedLogRow(sheet, Math.max(sheet.getLastRow() + 1, 2), log);
  appendSubmitHistory(log, "บันทึกยอดใหม่", formattedRow);
  log.productionOrderProgress = updateProductionOrderProgressFromLog(log);
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
  const now = new Date();
  const productionDate = formatRecordDate(payload.date) || todayBangkok(now);
  const log = normalizeProductionLogMinuteFields(Object.assign({}, payload, {
    date: productionDate,
    buttonDetails: String(payload.buttonDetails || ""),
    entryUser: String(payload.entryUser || payload.userName || ""),
    recordDate: formatRecordDate(payload.recordDate) || todayBangkok(now),
    recordTime: formatRecordTime(payload.recordTime) || timeBangkok(now),
    submittedAt: formatRecordDateTime(payload.submittedAt) || dateTimeBangkok(now),
    shiftStartAt: payload.shiftStartAt || getShiftStartAt(productionDate, payload.shift),
    shiftEndAt: payload.shiftEndAt || getShiftEndAt(productionDate, payload.shift),
    createdAt: payload.createdAt || now.toISOString(),
    updatedAt: payload.updatedAt || now.toISOString(),
    source: "google-sheet",
  }));
  assertNoDuplicateOeeLog(log, payload.id, false);

  if (rowIndex >= 0) {
    writeSerializedLogRow(sheet, rowIndex + 1, log);
    appendSubmitHistory(log, "แก้ไขรายการบันทึก", { sheetName: LOG_SHEET, row: rowIndex + 1 });
    return log;
  }

  writeSerializedLogRow(sheet, Math.max(sheet.getLastRow() + 1, 2), log);
  appendSubmitHistory(log, "บันทึกยอดใหม่", { sheetName: LOG_SHEET, row: Math.max(sheet.getLastRow(), 2) });
  return log;
}

function getEmployeeMachineStatuses() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(EMPLOYEE_STATUS_CACHE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (error) {
      cache.remove(EMPLOYEE_STATUS_CACHE_KEY);
    }
  }
  const sheet = ensureSheet(EMPLOYEE_STATUS_SHEET, EMPLOYEE_STATUS_HEADERS);
  const values = sheet.getDataRange().getValues();
  const now = new Date();
  const rows = [];
  for (let i = 1; i < values.length; i++) {
    const item = rowToObject(EMPLOYEE_STATUS_HEADERS, values[i]);
    if (!isVisibleMachineId(item.machineId)) continue;
    if (!isEmployeeMachineStatusFresh(item, now)) continue;
    rows.push(item);
  }
  const sortedRows = rows.sort(function(a, b) {
    return String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""));
  });
  try {
    cache.put(EMPLOYEE_STATUS_CACHE_KEY, JSON.stringify(sortedRows), EMPLOYEE_STATUS_CACHE_SECONDS);
  } catch (error) {
    // Keep realtime reads working even when detailed status text is too large for CacheService.
  }
  return sortedRows;
}

function getEmployeeMachineStatusLastSeenAt(item) {
  const candidates = [
    item.updatedAt,
    item.entryUpdatedAt,
    item.buttonDetailsUpdatedAt,
    item.activeTimerBaseAt,
    item.activeTimerStartedAt,
    item.workStartedAt,
  ];
  for (let i = 0; i < candidates.length; i++) {
    if (!candidates[i]) continue;
    const parsed = new Date(candidates[i]);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return null;
}

function isEmployeeMachineStatusFresh(item, now) {
  if (!item.machineId || item.status !== "active") return false;
  if (!item.activeTimerKey && !item.workStartedAt) return false;

  const lastSeenAt = getEmployeeMachineStatusLastSeenAt(item);
  if (!lastSeenAt || now.getTime() - lastSeenAt.getTime() > EMPLOYEE_STATUS_HEARTBEAT_MAX_AGE_MS) return false;

  if (item.expiresAt) {
    const expiresAt = new Date(item.expiresAt);
    if (!isNaN(expiresAt.getTime()) && expiresAt.getTime() < now.getTime()) return false;
  }
  return true;
}

function auditEmployeeMachineStatuses() {
  const sheet = ensureSheet(EMPLOYEE_STATUS_SHEET, EMPLOYEE_STATUS_HEADERS);
  const values = sheet.getDataRange().getValues();
  const now = new Date();
  const nowIso = now.toISOString();
  const statusColumn = EMPLOYEE_STATUS_HEADERS.indexOf("status") + 1;
  const updatedAtColumn = EMPLOYEE_STATUS_HEADERS.indexOf("updatedAt") + 1;
  const expiresAtColumn = EMPLOYEE_STATUS_HEADERS.indexOf("expiresAt") + 1;
  const checked = Math.max(values.length - 1, 0);
  let cleared = 0;

  for (let i = 1; i < values.length; i++) {
    const item = rowToObject(EMPLOYEE_STATUS_HEADERS, values[i]);
    if (!item.machineId || item.status !== "active") continue;
    if (isEmployeeMachineStatusFresh(item, now)) continue;
    const row = i + 1;
    sheet.getRange(row, statusColumn).setValue("cleared");
    sheet.getRange(row, updatedAtColumn).setValue(nowIso);
    sheet.getRange(row, expiresAtColumn).setValue(nowIso);
    cleared++;
  }

  if (cleared > 0) {
    CacheService.getScriptCache().remove(EMPLOYEE_STATUS_CACHE_KEY);
  }
  return { checked: checked, cleared: cleared, at: nowIso };
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
    goodQty: nonNegativeNumber(payload.goodQty),
    ngQty: nonNegativeNumber(payload.ngQty),
    testQty: nonNegativeNumber(payload.testQty),
    workMinutes: minuteNumber(payload.workMinutes),
    timeSlots: minuteNumber(payload.timeSlots),
    minutesPerSlot: nonNegativeNumber(payload.minutesPerSlot),
    machineSpeed: nonNegativeNumber(payload.machineSpeed),
    cavityQty: nonNegativeNumber(payload.cavityQty),
    downtimeMinutes: minuteNumber(payload.downtimeMinutes),
    normalMinutes: minuteNumber(payload.normalMinutes),
    changeoverMinutes: minuteNumber(payload.changeoverMinutes),
    inspectionMinutes: minuteNumber(payload.inspectionMinutes),
    equipmentRepairMinutes: minuteNumber(payload.equipmentRepairMinutes),
    moldRepairMinutes: minuteNumber(payload.moldRepairMinutes),
    materialChangeMinutes: minuteNumber(payload.materialChangeMinutes),
    emergencyStopMinutes: minuteNumber(payload.emergencyStopMinutes),
    meetingMinutes: minuteNumber(payload.meetingMinutes),
    plannedStopMinutes: minuteNumber(payload.plannedStopMinutes),
    newModelMinutes: minuteNumber(payload.newModelMinutes),
    note: String(payload.note || ""),
    activeTimerKey: String(payload.activeTimerKey || ""),
    activeTimerLabel: String(payload.activeTimerLabel || ""),
    activeTimerStartedAt: String(payload.activeTimerStartedAt || ""),
    activeTimerBaseAt: String(payload.activeTimerBaseAt || ""),
    activeTimerBaseMinutes: minuteNumber(payload.activeTimerBaseMinutes),
    buttonDetails: String(payload.buttonDetails || ""),
    buttonDetailsUpdatedAt: String(payload.buttonDetailsUpdatedAt || payload.entryUpdatedAt || now.toISOString()),
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

  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
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
    CacheService.getScriptCache().remove(EMPLOYEE_STATUS_CACHE_KEY);
    return status;
  } finally {
    lock.releaseLock();
  }
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
      CacheService.getScriptCache().remove(EMPLOYEE_STATUS_CACHE_KEY);
      return;
    }
  }
}

function openProductionOrderWorkbook() {
  return SpreadsheetApp.openById(PRODUCTION_ORDER_SPREADSHEET_ID);
}

function normalizeOrderMachineName(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function getProductionOrderSheet(machineName, machineId) {
  const book = openProductionOrderWorkbook();
  const foundSheet = findProductionOrderSheet(book, machineName, machineId);
  if (foundSheet) return foundSheet;
  const sheetName = String(machineName || machineId || "Production Orders").slice(0, 90);
  const sheet = book.insertSheet(sheetName);
  ensureProductionOrderLayout(sheet);
  return sheet;
}

function findProductionOrderSheet(book, machineName, machineId) {
  const target = normalizeOrderMachineName(machineName || machineId);
  const cncTarget = target && target.length <= 3 ? "cnc" + target : "";
  const sheets = book.getSheets();
  for (let i = 0; i < sheets.length; i++) {
    const normalized = normalizeOrderMachineName(sheets[i].getName());
    if (normalized === target || (cncTarget && normalized === cncTarget)) return sheets[i];
  }
  for (let i = 0; i < sheets.length; i++) {
    const normalized = normalizeOrderMachineName(sheets[i].getName());
    if ((target && normalized.indexOf(target) >= 0) || (cncTarget && normalized.indexOf(cncTarget) >= 0)) return sheets[i];
  }
  return null;
}

function ensureProductionOrderLayout(sheet) {
  ensureSheetSize(sheet, 3, Math.max(PRODUCTION_ORDER_HEADERS.length, 30));
  const current = sheet.getRange(1, 1, 1, PRODUCTION_ORDER_HEADERS.length).getValues()[0];
  const hasHeader = current.some(function(value) {
    return String(value || "").trim();
  });
  if (!hasHeader) {
    sheet.getRange(1, 1, 1, PRODUCTION_ORDER_HEADERS.length).setValues([PRODUCTION_ORDER_HEADERS]);
    sheet.getRange(2, 23, 1, 7).setValues([["Min", "Blance", "Max", "1", "2", "3", "4"]]);
    sheet.setFrozenRows(2);
    sheet.getRange(1, 1, 2, PRODUCTION_ORDER_HEADERS.length).setFontWeight("bold").setBackground("#fbbf24").setFontColor("#111827");
  }
}

function getProductionOrders(params) {
  const machineName = String(params.machineName || "");
  const machineId = String(params.machineId || "");
  const sheet = getProductionOrderSheet(machineName, machineId);
  ensureProductionOrderLayout(sheet);
  return readProductionOrdersFromSheet(sheet, machineId);
}

function readProductionOrdersFromSheet(sheet, machineId) {
  const lastRow = Math.max(sheet.getLastRow(), 2);
  if (lastRow < 3) return [];
  const rowCount = Math.min(lastRow - 2, PRODUCTION_ORDER_MAX_ROWS);
  const values = sheet.getRange(3, 1, rowCount, PRODUCTION_ORDER_HEADERS.length).getDisplayValues();
  const orders = [];
  for (let index = 0; index < values.length; index++) {
    const row = values[index];
    const hasOrder = [row[2], row[3], row[4], row[6], row[20]].some(function(value) {
      return String(value || "").trim();
    });
    if (!hasOrder) continue;
    orders.push({
      rowNumber: index + 3,
      machineId: machineId,
      machineName: sheet.getName(),
      no: String(row[0] || ""),
      openedDate: String(row[1] || ""),
      orderNo: String(row[2] || ""),
      productName: String(row[3] || ""),
      partNo: String(row[4] || ""),
      rmNo: String(row[5] || ""),
      orderQty: numberValue(String(row[6] || "").replace(/,/g, "")),
      unit: String(row[7] || ""),
      dueDate: String(row[8] || ""),
      shift: String(row[9] || ""),
      kpi85: numberValue(String(row[10] || "").replace(/,/g, "")),
      dailyTarget: numberValue(String(row[11] || "").replace(/,/g, "")),
      expectedDoneDate: String(row[12] || ""),
      expectedDoneTime: String(row[13] || ""),
      startDate: String(row[14] || ""),
      endDate: String(row[15] || ""),
      producedQty: numberValue(String(row[16] || "").replace(/,/g, "")),
      readyForPainting: numberValue(String(row[17] || "").replace(/,/g, "")),
      backlogQty: numberValue(String(row[18] || "").replace(/,/g, "")),
      ngRework: numberValue(String(row[19] || "").replace(/,/g, "")),
      status: String(row[20] || ""),
      progress: String(row[21] || ""),
      stock: String(row[22] || ""),
    });
  }
  return orders;
}

function isCompletedProductionOrder(order) {
  const status = String(order && order.status || "").trim().toLowerCase();
  const progress = String(order && order.progress || "").trim().toLowerCase();
  return status.indexOf("complete") >= 0 ||
    status.indexOf("done") >= 0 ||
    status.indexOf("finished") >= 0 ||
    status.indexOf("closed") >= 0 ||
    status.indexOf("จบ") >= 0 ||
    status.indexOf("เสร็จ") >= 0 ||
    progress === "100%" ||
    progress === "100";
}

function getProductionOrderSummaries() {
  const book = openProductionOrderWorkbook();
  const machines = getMachines();
  const summaries = machines.map(function(machine) {
    const sheet = findProductionOrderSheet(book, machine.name, machine.id);
    if (!sheet) {
      return {
        machineId: machine.id,
        machineName: machine.name,
        pendingCount: 0,
        pendingOrders: [],
      };
    }
    ensureProductionOrderLayout(sheet);
    const orders = readProductionOrdersFromSheet(sheet, machine.id)
      .filter(function(order) {
        return !isCompletedProductionOrder(order) && [order.orderNo, order.productName, order.partNo].some(function(value) {
          return String(value || "").trim();
        });
      })
      .sort(function(left, right) {
        const leftNo = parseProductionOrderNumber(left.no);
        const rightNo = parseProductionOrderNumber(right.no);
        if (leftNo > 0 && rightNo > 0 && leftNo !== rightNo) return leftNo - rightNo;
        if (leftNo > 0 && rightNo <= 0) return -1;
        if (rightNo > 0 && leftNo <= 0) return 1;
        return Number(left.rowNumber || 0) - Number(right.rowNumber || 0);
      });
    return {
      machineId: machine.id,
      machineName: machine.name,
      pendingCount: orders.length,
      pendingOrders: orders.slice(0, 3).map(function(order) {
        return {
          rowNumber: order.rowNumber,
          no: order.no,
          orderNo: order.orderNo,
          productName: order.productName,
          partNo: order.partNo,
          orderQty: order.orderQty,
          unit: order.unit,
        };
      }),
    };
  });
  return summaries;
}

function findNextProductionOrderRow(sheet) {
  const lastRow = Math.max(sheet.getLastRow(), 2);
  if (lastRow < 3) return 3;
  const values = sheet.getRange(3, 1, lastRow - 2, 6).getValues();
  for (let index = 0; index < values.length; index++) {
    const isEmpty = values[index].every(function(value) {
      return String(value || "").trim() === "";
    });
    if (isEmpty) return index + 3;
  }
  return lastRow + 1;
}

function upsertProductionOrder(payload) {
  const machineName = String(payload.machineName || "");
  const machineId = String(payload.machineId || "");
  const sheet = getProductionOrderSheet(machineName, machineId);
  ensureProductionOrderLayout(sheet);
  const lastRow = Math.max(sheet.getLastRow(), 2);
  const rowNumber = Number(payload.rowNumber || 0);
  const targetRow = rowNumber >= 3 && rowNumber <= Math.max(lastRow + 1, 3) ? rowNumber : findNextProductionOrderRow(sheet);
  ensureSheetSize(sheet, targetRow, Math.max(PRODUCTION_ORDER_HEADERS.length, 30));
  const currentNo = String(sheet.getRange(targetRow, 1).getDisplayValue() || "");
  const nextNo = String(payload.no == null ? currentNo : payload.no);
  const currentUnit = String(sheet.getRange(targetRow, 8).getDisplayValue() || "");
  const row = [
    nextNo,
    String(payload.openedDate || sheet.getRange(targetRow, 2).getDisplayValue() || Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd")),
    String(payload.orderNo || ""),
    String(payload.productName || ""),
    String(payload.partNo || ""),
    String(payload.rmNo || payload.materialOfProduction || ""),
    numberValue(payload.orderQty || 0) || "",
    String(payload.unit || currentUnit || "pcs"),
    String(payload.dueDate || ""),
    String(payload.shift || ""),
    numberValue(payload.kpi85 || 0) || "",
    numberValue(payload.dailyTarget || 0) || "",
    String(payload.expectedDoneDate || ""),
    String(payload.expectedDoneTime || ""),
    String(payload.startDate || ""),
    String(payload.endDate || ""),
    numberValue(payload.producedQty || 0) || "",
    numberValue(payload.readyForPainting || 0) || "",
    numberValue(payload.backlogQty || 0) || "",
    numberValue(payload.ngRework || 0) || "",
    String(payload.status || ""),
    String(payload.progress || ""),
    String(payload.stock || ""),
  ];
  sheet.getRange(targetRow, 1, 1, row.length).setValues([row]);
  return getProductionOrders({ machineId: machineId, machineName: sheet.getName() }).filter(function(order) {
    return Number(order.rowNumber || 0) === targetRow;
  })[0] || {
    rowNumber: targetRow,
    machineId: machineId,
    machineName: sheet.getName(),
    orderNo: String(payload.orderNo || ""),
    productName: String(payload.productName || ""),
    partNo: String(payload.partNo || ""),
  };
}

function reorderProductionOrder(payload) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const machineName = String(payload.machineName || "");
    const machineId = String(payload.machineId || "");
    const sheet = getProductionOrderSheet(machineName, machineId);
    ensureProductionOrderLayout(sheet);
    const requestedSequence = parseProductionOrderNumber(payload.no);
    if (requestedSequence <= 0) {
      return upsertProductionOrder(payload);
    }

    const rowNumber = Number(payload.rowNumber || 0);
    const lastRow = Math.max(sheet.getLastRow(), 2);
    const targetRow = rowNumber >= 3 && rowNumber <= Math.max(lastRow + 1, 3) ? rowNumber : findNextProductionOrderRow(sheet);
    const orders = readProductionOrdersFromSheet(sheet, machineId).filter(function(order) {
      return !isCompletedProductionOrder(order);
    });
    const currentOrder = orders.filter(function(order) {
      return Number(order.rowNumber || 0) === targetRow;
    })[0];
    const previousSequence = currentOrder ? parseProductionOrderNumber(currentOrder.no) : 0;

    orders.forEach(function(order) {
      const orderRow = Number(order.rowNumber || 0);
      if (orderRow === targetRow) return;
      const sequence = parseProductionOrderNumber(order.no);
      if (sequence <= 0) return;
      let nextSequence = sequence;
      if (previousSequence > 0 && requestedSequence > previousSequence) {
        if (sequence > previousSequence && sequence <= requestedSequence) nextSequence = sequence - 1;
      } else if (sequence >= requestedSequence && (previousSequence <= 0 || sequence < previousSequence)) {
        nextSequence = sequence + 1;
      }
      if (nextSequence !== sequence) {
        sheet.getRange(orderRow, PRODUCTION_ORDER_COLUMNS.no).setValue(String(nextSequence));
      }
    });

    return upsertProductionOrder(Object.assign({}, payload, {
      rowNumber: targetRow,
      no: String(requestedSequence),
    }));
  } finally {
    lock.releaseLock();
  }
}

function parseProductionOrderNumber(value) {
  const text = String(value || "").replace(/,/g, "").replace(/[^\d.-]/g, "");
  return numberValue(text);
}

function setProductionOrderCell(sheet, row, column, value, options) {
  const cell = sheet.getRange(row, column);
  if (options && options.keepFormula && String(cell.getFormula() || "").trim()) return;
  cell.setValue(value);
}

function findProductionOrderRowForLog(sheet, log) {
  const requestedRow = Number(log.productionOrderRowNumber || 0);
  if (requestedRow >= 3 && requestedRow <= sheet.getMaxRows()) return requestedRow;

  const lastRow = Math.max(sheet.getLastRow(), 2);
  if (lastRow < 3) return 0;
  const values = sheet.getRange(3, 1, Math.min(lastRow - 2, PRODUCTION_ORDER_MAX_ROWS), PRODUCTION_ORDER_HEADERS.length).getDisplayValues();
  const orderNo = normalizeLookup(log.productionOrderNo || "");
  const productName = normalizeLookup(log.productName || "");
  const partNo = normalizeLookup(log.partNo || "");
  const activeStatuses = ["", "กำลังผลิต", "รอผลิต", "pending", "inprogress", "in progress"];

  if (orderNo) {
    for (let index = 0; index < values.length; index++) {
      if (normalizeLookup(values[index][PRODUCTION_ORDER_COLUMNS.orderNo - 1]) === orderNo) return index + 3;
    }
  }

  for (let index = 0; index < values.length; index++) {
    const row = values[index];
    const rowProduct = normalizeLookup(row[PRODUCTION_ORDER_COLUMNS.productName - 1]);
    const rowPart = normalizeLookup(row[PRODUCTION_ORDER_COLUMNS.partNo - 1]);
    const rowStatus = normalizeLookup(row[PRODUCTION_ORDER_COLUMNS.status - 1]);
    if (rowProduct !== productName || rowPart !== partNo) continue;
    if (activeStatuses.indexOf(rowStatus) >= 0) return index + 3;
  }

  return 0;
}

function updateProductionOrderProgressFromLog(log) {
  try {
    if (!log || (!log.productionOrderRowNumber && !log.productionOrderNo)) return null;
    const goodQty = numberValue(log.goodQty);
    if (goodQty <= 0) return null;

    const sheet = getProductionOrderSheet(log.machineName || "", log.machineId || "");
    ensureProductionOrderLayout(sheet);
    const targetRow = findProductionOrderRowForLog(sheet, log);
    if (!targetRow) return null;

    const row = sheet.getRange(targetRow, 1, 1, PRODUCTION_ORDER_HEADERS.length).getDisplayValues()[0];
    const orderQty = parseProductionOrderNumber(row[PRODUCTION_ORDER_COLUMNS.orderQty - 1]) || numberValue(log.productionOrderQty);
    if (orderQty <= 0) return null;

    const currentProduced = parseProductionOrderNumber(row[PRODUCTION_ORDER_COLUMNS.producedQty - 1]);
    const currentNg = parseProductionOrderNumber(row[PRODUCTION_ORDER_COLUMNS.ngRework - 1]);
    const nextProduced = roundNumber(currentProduced + goodQty);
    const nextNg = roundNumber(currentNg + numberValue(log.ngQty));
    const backlog = Math.max(roundNumber(orderQty - nextProduced), 0);
    const progressPercent = Math.min(roundNumber((nextProduced / orderQty) * 100), 100);
    const completed = nextProduced >= orderQty;
    const submittedDate = formatRecordDate(log.submittedAt) || formatRecordDate(log.date) || todayBangkok(new Date());
    const productionDate = formatRecordDate(log.date) || submittedDate;

    if (!String(row[PRODUCTION_ORDER_COLUMNS.startDate - 1] || "").trim()) {
      setProductionOrderCell(sheet, targetRow, PRODUCTION_ORDER_COLUMNS.startDate, productionDate, { keepFormula: true });
    }
    setProductionOrderCell(sheet, targetRow, PRODUCTION_ORDER_COLUMNS.producedQty, nextProduced);
    setProductionOrderCell(sheet, targetRow, PRODUCTION_ORDER_COLUMNS.backlogQty, backlog, { keepFormula: true });
    if (numberValue(log.ngQty) > 0) {
      setProductionOrderCell(sheet, targetRow, PRODUCTION_ORDER_COLUMNS.ngRework, nextNg, { keepFormula: true });
    }
    setProductionOrderCell(sheet, targetRow, PRODUCTION_ORDER_COLUMNS.progress, progressPercent + "%", { keepFormula: true });
    setProductionOrderCell(sheet, targetRow, PRODUCTION_ORDER_COLUMNS.status, completed ? "จบการผลิตแล้ว" : "กำลังผลิต");
    if (completed) {
      setProductionOrderCell(sheet, targetRow, PRODUCTION_ORDER_COLUMNS.endDate, submittedDate, { keepFormula: true });
    }

    return {
      completed: completed,
      orderQty: orderQty,
      producedQty: nextProduced,
      remainingQty: backlog,
      rowNumber: targetRow,
      sheetName: sheet.getName(),
    };
  } catch (error) {
    return { error: String(error && error.message ? error.message : error) };
  }
}

function appendSubmitHistory(log, action, formattedRow) {
  const now = new Date();
  const sheet = ensureSubmitHistorySheet();
  const row = Math.max(sheet.getLastRow() + 1, 2);
  ensureRowExists(sheet, row);
  applyTypedRowFormats(sheet, row, SUBMIT_HISTORY_HEADERS, SUBMIT_HISTORY_NUMBER_HEADERS);
  sheet.getRange(row, 1, 1, SUBMIT_HISTORY_HEADERS.length).setValues([
    SUBMIT_HISTORY_HEADERS.map(function(header) {
      return serializeTypedValue(header, buildSubmitHistoryValue(header, log, action, formattedRow, now), SUBMIT_HISTORY_NUMBER_HEADERS);
    }),
  ]);
  return { row: row, sheetName: sheet.getName() };
}

function buildSubmitHistoryValue(header, log, action, formattedRow, now) {
  const totalQty = nonNegativeNumber(log.goodQty) + nonNegativeNumber(log.ngQty) + nonNegativeNumber(log.testQty);
  const formatted = formattedRow || {};
  const values = {
    historyId: Utilities.getUuid(),
    action: action || "บันทึกยอด",
    entryDate: formatRecordDate(log.recordDate) || todayBangkok(now),
    entryTime: formatRecordTime(log.recordTime) || timeBangkok(now),
    submittedAt: formatRecordDateTime(log.submittedAt) || dateTimeBangkok(now),
    entryUser: String(log.entryUser || log.userName || ""),
    productionDate: formatRecordDate(log.date) || todayBangkok(now),
    shift: String(toOriginalShift(log.shift) || ""),
    shiftStartAt: String(log.shiftStartAt || ""),
    shiftEndAt: String(log.shiftEndAt || ""),
    machineId: String(log.machineId || ""),
    machineName: String(log.machineName || ""),
    productName: String(log.productName || ""),
    partNo: String(log.partNo || ""),
    step: String(log.step || "-"),
    materialOfProduction: String(log.materialOfProduction || ""),
    productionOrderNo: String(log.productionOrderNo || ""),
    goodQty: nonNegativeNumber(log.goodQty),
    ngQty: nonNegativeNumber(log.ngQty),
    testQty: nonNegativeNumber(log.testQty),
    totalQty: totalQty,
    workMinutes: minuteNumber(log.workMinutes),
    normalMinutes: minuteNumber(log.normalMinutes),
    downtimeMinutes: getSubmitHistoryDowntimeMinutes(log),
    machineSpeed: nonNegativeNumber(log.machineSpeed),
    cavityQty: nonNegativeNumber(log.cavityQty),
    recordDate: formatRecordDate(log.recordDate) || todayBangkok(now),
    recordTime: formatRecordTime(log.recordTime) || timeBangkok(now),
    logId: String(log.id || ""),
    formattedSheet: String(formatted.sheetName || ""),
    formattedRow: nonNegativeNumber(formatted.row),
    buttonDetails: String(log.buttonDetails || ""),
    note: String(log.note || ""),
    createdAt: String(log.createdAt || now.toISOString()),
  };
  return values[header] == null ? "" : values[header];
}

function getSubmitHistoryDowntimeMinutes(log) {
  return (
    minuteNumber(log.changeoverMinutes) +
    minuteNumber(log.inspectionMinutes) +
    minuteNumber(log.equipmentRepairMinutes) +
    minuteNumber(log.moldRepairMinutes) +
    minuteNumber(log.materialChangeMinutes) +
    minuteNumber(log.emergencyStopMinutes) +
    minuteNumber(log.meetingMinutes) +
    minuteNumber(log.plannedStopMinutes) +
    minuteNumber(log.newModelMinutes)
  );
}

function ensureSubmitHistorySheet() {
  const book = getWorkbook();
  let sheet = getSheetById(book, SUBMIT_HISTORY_SHEET_ID) || book.getSheetByName(SUBMIT_HISTORY_SHEET);
  if (!sheet) {
    sheet = book.insertSheet(SUBMIT_HISTORY_SHEET);
  }
  if (sheet.getName() !== SUBMIT_HISTORY_SHEET) {
    try {
      sheet.setName(SUBMIT_HISTORY_SHEET);
    } catch (error) {
      // Keep the existing tab name if Google Sheets rejects the rename.
    }
  }
  ensureSubmitHistoryHeaders(sheet);
  return sheet;
}

function getSheetById(book, sheetId) {
  const wantedId = Number(sheetId || 0);
  if (!wantedId) return null;
  const sheets = book.getSheets();
  for (let index = 0; index < sheets.length; index++) {
    if (sheets[index].getSheetId() === wantedId) return sheets[index];
  }
  return null;
}

function getProductionCapacityData(params) {
  const force = params && String(params.force || "") === "1";
  const selectedGroup = normalizeProductionCapacityGroupParam(params && params.group);
  const cache = CacheService.getScriptCache();
  const cacheKey = PRODUCTION_CAPACITY_CACHE_KEY + "_" + (selectedGroup || "all");
  if (!force) {
    const cached = cache.get(cacheKey);
    const parsed = parseJsonSafe(cached);
    if (parsed) return parsed;
  }

  const book = SpreadsheetApp.openById(PRODUCTION_CAPACITY_SPREADSHEET_ID);
  const selectedSheet = getSheetById(book, PRODUCTION_CAPACITY_GID);
  const visibleSheets = book.getSheets().filter(function(sheet) {
    return !shouldSkipProductionCapacitySheet(sheet);
  });
  const sheets = selectedSheet
    ? [selectedSheet].concat(visibleSheets.filter(function(sheet) {
        return sheet.getSheetId() !== selectedSheet.getSheetId();
      }))
    : visibleSheets;
  const groups = buildProductionCapacityGroups(visibleSheets);
  const filteredSheets = selectedGroup
    ? sheets.filter(function(sheet) {
        return getProductionCapacityGroup(sheet.getName()) === selectedGroup;
      })
    : sheets;

  const machines = [];
  filteredSheets.forEach(function(sheet) {
    const machine = readProductionCapacityMachine(sheet);
    if (machine && machine.records.length > 0) machines.push(machine);
  });

  const result = {
    spreadsheetId: PRODUCTION_CAPACITY_SPREADSHEET_ID,
    spreadsheetUrl: PRODUCTION_CAPACITY_URL,
    sourceName: book.getName(),
    gid: PRODUCTION_CAPACITY_GID,
    fetchedAt: new Date().toISOString(),
    selectedGroup: selectedGroup,
    groups: groups,
    machines: machines,
    totalRows: machines.reduce(function(sum, machine) {
      return sum + machine.rowCount;
    }, 0),
  };
  try {
    cache.put(cacheKey, JSON.stringify(result), PRODUCTION_CAPACITY_CACHE_SECONDS);
  } catch (cacheError) {
    // Capacity payload can exceed Apps Script cache limits; keep serving live data.
  }
  return result;
}

function normalizeProductionCapacityGroupParam(value) {
  const group = normalizeKpiText(value).toUpperCase();
  if (!group || group === "ALL" || group === "OTHER" || group === "ทั้งหมด") return "";
  return group;
}

function buildProductionCapacityGroups(sheets) {
  const groupMap = {};
  sheets.forEach(function(sheet) {
    const group = getProductionCapacityGroup(sheet.getName());
    if (group && group !== "OTHER") groupMap[group] = true;
  });
  return Object.keys(groupMap).sort(function(a, b) {
    return productionCapacityGroupSort(a) - productionCapacityGroupSort(b) || a.localeCompare(b);
  });
}

function shouldSkipProductionCapacitySheet(sheet) {
  const rawName = sheet.getName();
  const name = normalizeKpiKey(rawName);
  if (typeof sheet.isSheetHidden === "function" && sheet.isSheetHidden()) return true;
  if (!name) return true;
  if (name.indexOf("APP_USERS") >= 0 || name.indexOf("SUBMIT_HISTORY") >= 0) return true;
  if (name.indexOf("PRODUCTION_LOG") >= 0 || name.indexOf("EMPLOYEE") >= 0) return true;
  if (name.indexOf("ORDER") >= 0 || name.indexOf("MASTER") >= 0 || name.indexOf("MACHINE") === 0) return true;
  if (name.indexOf("DASHBOARD") >= 0 || name.indexOf("NOTE") >= 0 || name.indexOf("KPI") === 0) return true;
  return false;
}

function readProductionCapacityMachine(sheet) {
  const lastRow = Math.min(sheet.getLastRow(), PRODUCTION_CAPACITY_MAX_ROWS_PER_SHEET);
  const lastColumn = Math.min(sheet.getLastColumn(), PRODUCTION_CAPACITY_MAX_COLUMNS_PER_SHEET);
  if (lastRow < 2 || lastColumn < 3) return null;

  const values = sheet.getRange(1, 1, lastRow, lastColumn).getDisplayValues();
  const layout = detectProductionCapacityLayout(values);
  if (!layout) return null;

  const records = [];
  for (let rowIndex = layout.headerRow + 1; rowIndex < values.length; rowIndex++) {
    const record = extractProductionCapacityRecord(values[rowIndex], layout, sheet.getName(), rowIndex + 1);
    if (record) records.push(record);
  }
  if (records.length === 0) return null;

  const partMap = {};
  let targetTotal = 0;
  let targetCount = 0;
  let targetMax = 0;
  let kpiTotal = 0;
  let kpiCount = 0;
  records.forEach(function(record) {
    const partKey = normalizeKpiKey(record.partNo || record.productName);
    if (partKey) partMap[partKey] = true;
    if (record.target8h > 0) {
      targetTotal += record.target8h;
      targetCount += 1;
      targetMax = Math.max(targetMax, record.target8h);
    }
    if (record.kpi85PerMinute > 0) {
      kpiTotal += record.kpi85PerMinute;
      kpiCount += 1;
    }
  });

  const machineName = inferProductionCapacityMachineName(sheet.getName(), records[0]);
  const group = getProductionCapacityGroup(machineName);
  records.forEach(function(record) {
    record.machineName = machineName;
    record.group = group;
  });

  return {
    sheetName: sheet.getName(),
    machineName: machineName,
    group: group,
    rowCount: records.length,
    partCount: Object.keys(partMap).length,
    avgKpi85PerMinute: kpiCount > 0 ? kpiTotal / kpiCount : 0,
    avgTarget8h: targetCount > 0 ? targetTotal / targetCount : 0,
    maxTarget8h: targetMax,
    totalTarget8h: targetTotal,
    records: records,
  };
}

function detectProductionCapacityLayout(values) {
  let best = null;
  values.forEach(function(row, rowIndex) {
    const headers = row.map(function(cell) {
      return normalizeKpiKey(cell);
    });
    const partNoIndex = findPdHeaderIndex(headers, ["PARTNO", "PARTNUMBER", "PN"]);
    const partNameIndex = findPdHeaderIndex(headers, ["PARTNAME", "PRODUCTNAME", "PRODUCT", "ITEMNAME"]);
    const stepIndex = findPdHeaderIndex(headers, ["STEP"]);
    const machineIndex = findPdHeaderIndex(headers, ["MCNO", "M/CNO", "MACHINE", "M/C"]);
    const targetIndex = findPdTargetIndex(headers);
    const cycleIndex = findPdHeaderIndex(headers, ["10MIN/PCS", "MIN/PCS", "CYCLE", "CYCLETIME"]);
    const score =
      (partNoIndex >= 0 ? 3 : 0) +
      (partNameIndex >= 0 ? 3 : 0) +
      (stepIndex >= 0 ? 1 : 0) +
      (targetIndex >= 0 ? 2 : 0) +
      (machineIndex >= 0 ? 1 : 0);
    if (!best || score > best.score) {
      best = {
        headerRow: rowIndex,
        score: score,
        partNameIndex: partNameIndex >= 0 ? partNameIndex : 1,
        partNoIndex: partNoIndex >= 0 ? partNoIndex : 2,
        stepIndex: stepIndex >= 0 ? stepIndex : 3,
        cycleIndex: cycleIndex >= 0 ? cycleIndex : 4,
        targetIndex: targetIndex >= 0 ? targetIndex : 25,
        machineIndex: machineIndex,
        target8h100Index: 14,
        target8h85Index: 16,
        target10_5h100Index: 17,
        target10_5h85Index: 19,
        target12_5h100Index: 20,
        target12_5h85Index: 22,
        machineTypeIndex: 23,
        machineNoIndex: 24,
      };
    }
  });
  if (best && best.score >= 4) return best;

  const fixedScore = values.some(function(row) {
    return normalizeKpiKey(row[1]).indexOf("PART") >= 0 && normalizeKpiKey(row[2]).indexOf("PART") >= 0;
  });
  return fixedScore
    ? {
        headerRow: 0,
        partNameIndex: 1,
        partNoIndex: 2,
        stepIndex: 3,
        cycleIndex: 4,
        targetIndex: 25,
        machineIndex: -1,
        target8h100Index: 14,
        target8h85Index: 16,
        target10_5h100Index: 17,
        target10_5h85Index: 19,
        target12_5h100Index: 20,
        target12_5h85Index: 22,
        machineTypeIndex: 23,
        machineNoIndex: 24,
      }
    : null;
}

function extractProductionCapacityRecord(row, layout, sheetName, rowNumber) {
  const productName = normalizeKpiText(row[layout.partNameIndex]);
  const partNo = normalizeKpiText(row[layout.partNoIndex]);
  if (!productName && !partNo) return null;
  const productKey = normalizeKpiKey(productName);
  const partKey = normalizeKpiKey(partNo);
  if (productKey.indexOf("PARTNAME") >= 0 || partKey.indexOf("PARTNO") >= 0) return null;

  const target8h100 = productionCapacityNumber(row[layout.target8h100Index]);
  const target8h85 = productionCapacityNumber(row[layout.target8h85Index]);
  const targetFallback = productionCapacityNumber(row[layout.targetIndex]);
  const target10_5h100 = productionCapacityNumber(row[layout.target10_5h100Index]);
  const target10_5h85 = productionCapacityNumber(row[layout.target10_5h85Index]);
  const target12_5h100 = productionCapacityNumber(row[layout.target12_5h100Index]);
  const target12_5h85 = productionCapacityNumber(row[layout.target12_5h85Index]);
  const target8h = firstProductionCapacityNumber([target8h85, targetFallback, target8h100]);
  const target8h100Resolved = firstProductionCapacityNumber([target8h100, target8h > 0 ? target8h / 0.85 : 0]);
  const target10_5h100Resolved = firstProductionCapacityNumber([target10_5h100, target10_5h85 > 0 ? target10_5h85 / 0.85 : 0]);
  const target12_5h100Resolved = firstProductionCapacityNumber([target12_5h100, target12_5h85 > 0 ? target12_5h85 / 0.85 : 0]);
  const kpi85PerMinute = target8h > 0 ? target8h / 480 : 0;
  const kpi100PerMinute = target8h100Resolved > 0 ? target8h100Resolved / 480 : 0;

  return {
    rowNumber: rowNumber,
    sheetName: sheetName,
    machineName: normalizeKpiText(row[layout.machineIndex], sheetName),
    group: getProductionCapacityGroup(sheetName),
    productName: productName,
    partNo: partNo,
    step: normalizeKpiText(row[layout.stepIndex], "-"),
    cycleMinutes: productionCapacityNumber(row[layout.cycleIndex]),
    kpi85PerMinute: kpi85PerMinute,
    kpi100PerMinute: kpi100PerMinute,
    target8h: target8h,
    target8h100: target8h100Resolved,
    target10_5h: target10_5h85,
    target10_5h100: target10_5h100Resolved,
    target12_5h: target12_5h85,
    target12_5h100: target12_5h100Resolved,
    machineType: normalizeKpiText(row[layout.machineTypeIndex]),
    machineNo: normalizeKpiText(row[layout.machineNoIndex]),
  };
}

function productionCapacityNumber(value) {
  const cleaned = String(value == null ? "" : value).replace(/,/g, "").trim();
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : 0;
}

function firstProductionCapacityNumber(values) {
  for (let index = 0; index < values.length; index++) {
    if (values[index] > 0) return values[index];
  }
  return 0;
}

function inferProductionCapacityMachineName(sheetName, record) {
  const machineNo = normalizeKpiText(record && record.machineNo);
  if (machineNo) return machineNo;
  return normalizeKpiText(sheetName, "Machine");
}

function getProductionCapacityGroup(machineName) {
  const text = normalizeKpiText(machineName).toUpperCase();
  const tonMatch = text.match(/(\d+)\s*T/);
  if (tonMatch) return tonMatch[1] + "T";
  if (text.indexOf("CNC") >= 0) return "CNC";
  if (text.indexOf("BENDING") >= 0) return "BENDING";
  if (text.indexOf("RW") >= 0) return "RW";
  if (text.indexOf("SW") >= 0) return "SW";
  if (text.indexOf("RIVETING") >= 0) return "RIVETING";
  if (text.indexOf("TAPPING") >= 0) return "TAPPING";
  return "OTHER";
}

function productionCapacityGroupSort(group) {
  const order = { "80T": 10, "110T": 20, "150T": 30, "200T": 40, "260T": 50, "300T": 60, "500T": 70, CNC: 80, BENDING: 90, RW: 100, SW: 110, RIVETING: 120, TAPPING: 130, OTHER: 999 };
  return order[group] || 500;
}

function ensureSubmitHistoryHeaders(sheet) {
  ensureSheetSize(sheet, 1, SUBMIT_HISTORY_HEADERS.length);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, SUBMIT_HISTORY_HEADERS.length).setValues([SUBMIT_HISTORY_HEADERS]);
  } else {
    const current = sheet.getRange(1, 1, 1, SUBMIT_HISTORY_HEADERS.length).getValues()[0].map(String);
    const hasHeaders = SUBMIT_HISTORY_HEADERS.every(function(header, index) {
      return current[index] === header;
    });
    if (!hasHeaders) {
      sheet.insertRowsBefore(1, 1);
      sheet.getRange(1, 1, 1, SUBMIT_HISTORY_HEADERS.length).setValues([SUBMIT_HISTORY_HEADERS]);
    }
  }
  formatHeader(sheet, SUBMIT_HISTORY_HEADERS.length);
  sheet.setFrozenRows(1);
  sheet.setColumnWidths(1, 6, 130);
  sheet.setColumnWidths(7, 10, 130);
  sheet.setColumnWidths(17, 12, 105);
  sheet.setColumnWidth(29, 130);
  sheet.setColumnWidth(30, 95);
  sheet.setColumnWidth(31, 420);
  sheet.setColumnWidth(32, 240);
  if (sheet.getLastRow() >= 2) {
    applySheetTypeFormats(sheet, SUBMIT_HISTORY_HEADERS, SUBMIT_HISTORY_NUMBER_HEADERS, sheet.getLastRow());
    sheet.getRange(2, 31, sheet.getLastRow() - 1, 2).setWrap(true);
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
    return nonNegativeNumber(value);
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
  const machineSheet = findOeeMachineSheet(book, log.machineName, log.machineId);
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
  if (["admin", "production", "qc", "tooling_repair", "technician", "planning"].indexOf(role) < 0) {
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
  const role = String(payload.role || "production").trim();
  if (!displayName) {
    throw new Error("กรุณากรอกชื่อแสดงผล");
  }
  if (["admin", "production", "qc", "tooling_repair", "technician", "planning"].indexOf(role) < 0) {
    throw new Error("Role ไม่ถูกต้อง");
  }
  const sheet = ensureUsersSheet();
  const rows = getUserRows();
  const found = rows.find(function(item) { return item.user.username === username; });
  if (!found) {
    throw new Error("ไม่พบบัญชีผู้ใช้");
  }
  sheet.getRange(found.row, 2).setValue(displayName);
  sheet.getRange(found.row, 3).setValue(role);
  sheet.getRange(found.row, 7).setValue(new Date().toISOString());
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
  const sheet = findOeeMachineSheet(book, payload.machineName, payload.machineId);
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
  const sheet = findOeeMachineSheet(book, log.machineName, log.machineId);
  if (!sheet) {
    throw new Error("Machine sheet not found: " + log.machineName);
  }

  ensureOeeEntryTimestampColumns(sheet);
  ensureOeeTestColumn(sheet);
  const layout = getOeeLayout(sheet);
  const targetRow = findNextOeeInputRow(sheet, layout);
  ensureRowExists(sheet, targetRow);

  const templateRow = findOeeTemplateRow(sheet, layout, log, targetRow - 1);
  copyOeeTemplateRow(sheet, templateRow, targetRow);
  writeOeeInputRow(sheet, layout, targetRow, log);

  return { sheetName: sheet.getName(), row: targetRow };
}

function findNextOeeInputRow(sheet, layout) {
  const lastRow = Math.max(sheet.getLastRow(), OEE_FIRST_DATA_ROW);
  const width = Math.max(layout.date, layout.productName, layout.partNo, layout.hasStep ? layout.step : 0);
  const values = sheet.getRange(OEE_FIRST_DATA_ROW, 1, lastRow - OEE_FIRST_DATA_ROW + 1, width).getDisplayValues();
  let lastInputRow = OEE_FIRST_DATA_ROW - 1;
  for (let index = 0; index < values.length; index++) {
    const row = values[index];
    const hasInput =
      String(row[layout.date - 1] || "").trim() ||
      String(row[layout.productName - 1] || "").trim() ||
      String(row[layout.partNo - 1] || "").trim() ||
      (layout.hasStep ? String(row[layout.step - 1] || "").trim() : "");
    if (hasInput) lastInputRow = OEE_FIRST_DATA_ROW + index;
  }
  return Math.max(lastInputRow + 1, OEE_FIRST_DATA_ROW);
}

function compactOeeMachineRows() {
  const book = getWorkbook();
  const result = {
    sheets: 0,
    moved: 0,
    skipped: [],
    errors: [],
  };
  book.getSheets().forEach(function(sheet) {
    const machine = findMachineBySheetName(sheet.getName());
    if (!machine || !isVisibleMachineId(machine.id)) return;
    if (sheet.getLastRow() < OEE_FIRST_DATA_ROW) return;
    try {
      const layout = getOeeLayout(sheet);
      const lastRow = sheet.getLastRow();
      const width = Math.max(layout.date, layout.productName, layout.partNo, layout.hasStep ? layout.step : 0);
      const values = sheet.getRange(OEE_FIRST_DATA_ROW, 1, lastRow - OEE_FIRST_DATA_ROW + 1, width).getDisplayValues();
      const dataRows = [];
      for (let index = 0; index < values.length; index++) {
        if (isOeeInputDisplayRow(values[index], layout)) {
          dataRows.push(OEE_FIRST_DATA_ROW + index);
        }
      }
      let targetRow = OEE_FIRST_DATA_ROW;
      const lastColumn = sheet.getLastColumn();
      dataRows.forEach(function(sourceRow) {
        if (sourceRow !== targetRow) {
          sheet
            .getRange(sourceRow, 1, 1, lastColumn)
            .copyTo(sheet.getRange(targetRow, 1, 1, lastColumn), { contentsOnly: false });
          sheet.getRange(sourceRow, 1, 1, lastColumn).clearContent();
          sheet.setRowHeight(targetRow, sheet.getRowHeight(sourceRow));
          result.moved++;
        }
        targetRow++;
      });
      result.sheets++;
    } catch (error) {
      result.errors.push({
        sheetName: sheet.getName(),
        error: String(error && error.message ? error.message : error),
      });
    }
  });
  return result;
}

function findMachineBySheetName(sheetName) {
  const wanted = normalizeSheetName(sheetName);
  const wantedLoose = normalizeLooseSheetName(sheetName);
  const machines = getMachines();
  for (let index = 0; index < machines.length; index++) {
    const machineName = String(machines[index].name || "");
    if (normalizeSheetName(machineName) === wanted || normalizeLooseSheetName(machineName) === wantedLoose) {
      return machines[index];
    }
  }
  return null;
}

function isOeeInputDisplayRow(row, layout) {
  return Boolean(
    String(row[layout.date - 1] || "").trim() ||
    String(row[layout.productName - 1] || "").trim() ||
    String(row[layout.partNo - 1] || "").trim() ||
    (layout.hasStep ? String(row[layout.step - 1] || "").trim() : "")
  );
}

function repairMissingFormattedOeeRows() {
  const logSheet = ensureSheet(LOG_SHEET, LOG_HEADERS);
  const values = logSheet.getDataRange().getValues();
  const result = {
    checked: 0,
    appended: 0,
    skipped: 0,
    missingSheets: [],
    errors: [],
  };
  if (values.length <= 1) return result;

  const headers = values[0];
  const book = getWorkbook();
  for (let index = 1; index < values.length; index++) {
    const row = values[index];
    if (!row.some(function(cell) { return cell !== ""; })) continue;
    const log = rowToObject(headers, row);
    if (!isUsableLog(log) || !isVisibleMachineId(log.machineId)) continue;
    result.checked++;

    const sheet = findOeeMachineSheet(book, log.machineName, log.machineId);
    if (!sheet) {
      result.missingSheets.push({
        row: index + 1,
        machineId: String(log.machineId || ""),
        machineName: String(log.machineName || ""),
      });
      continue;
    }

    try {
      if (hasFormattedOeeRow(sheet, log)) {
        result.skipped++;
        continue;
      }
      appendFormattedOeeRow(log);
      result.appended++;
    } catch (error) {
      result.errors.push({
        row: index + 1,
        machineId: String(log.machineId || ""),
        machineName: String(log.machineName || ""),
        error: String(error && error.message ? error.message : error),
      });
    }
  }
  return result;
}

function hasFormattedOeeRow(sheet, log) {
  if (!sheet || sheet.getLastRow() < OEE_FIRST_DATA_ROW) return false;
  const layout = getOeeLayout(sheet);
  const rowCount = sheet.getLastRow() - OEE_FIRST_DATA_ROW + 1;
  const sourceWidth = layout.hasStep ? layout.step : layout.partNo;
  const values = sheet.getRange(OEE_FIRST_DATA_ROW, 1, rowCount, sourceWidth).getDisplayValues();
  const wantedKey = buildDuplicateOeeLogKey(log);
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
    if (buildDuplicateOeeLogKey(existing) === wantedKey) return true;
  }
  return false;
}

function findOeeMachineSheet(book, machineName, machineId) {
  const candidates = buildMachineSheetCandidates(machineName, machineId);
  for (let index = 0; index < candidates.length; index++) {
    const exact = book.getSheetByName(candidates[index]);
    if (exact) return exact;
  }

  const sheets = book.getSheets();
  const wantedNames = candidates.map(normalizeSheetName);
  const wantedLooseNames = candidates.map(normalizeLooseSheetName);
  for (let i = 0; i < sheets.length; i++) {
    const sheetName = sheets[i].getName();
    if (wantedNames.indexOf(normalizeSheetName(sheetName)) >= 0) {
      return sheets[i];
    }
    if (wantedLooseNames.indexOf(normalizeLooseSheetName(sheetName)) >= 0) {
      return sheets[i];
    }
  }
  return null;
}

function buildMachineSheetCandidates(machineName, machineId) {
  const candidates = [];
  addMachineSheetCandidate(candidates, machineName);
  const id = String(machineId || "").trim();
  if (id) {
    addMachineSheetCandidate(candidates, id);
    const cncMatch = id.match(/^cnc[-_\s]?(c\d+)$/i);
    if (cncMatch) addMachineSheetCandidate(candidates, cncMatch[1].toUpperCase());
    const machine = findMachineById(id);
    if (machine && machine.name) addMachineSheetCandidate(candidates, machine.name);
  }
  return candidates;
}

function addMachineSheetCandidate(candidates, value) {
  const text = String(value || "").trim();
  if (!text) return;
  if (candidates.indexOf(text) < 0) candidates.push(text);
}

function findMachineById(machineId) {
  const wanted = String(machineId || "").trim().toLowerCase();
  if (!wanted) return null;
  const sheet = ensureSheet(MACHINE_SHEET, MACHINE_HEADERS);
  const rows = sheet.getDataRange().getValues();
  for (let index = 1; index < rows.length; index++) {
    const id = String(rows[index][0] || "").trim();
    if (id.toLowerCase() !== wanted) continue;
    return {
      id: id,
      name: String(rows[index][1] || "").trim(),
    };
  }
  const cncMatch = wanted.match(/^cnc[-_\s]?(c\d+)$/);
  if (!cncMatch) return null;
  for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
    const id = String(rows[rowIndex][0] || "").trim().toLowerCase();
    if (id !== cncMatch[1]) continue;
    return {
      id: String(rows[rowIndex][0] || "").trim(),
      name: String(rows[rowIndex][1] || "").trim(),
    };
  }
  return null;
}

function normalizeSheetName(value) {
  return String(value || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function normalizeLooseSheetName(value) {
  return normalizeSheetName(value).replace(/[^a-z0-9]+/g, "");
}

function getOeeLayout(sheet) {
  const headers = sheet.getRange(OEE_HEADER_ROW, 1, 1, Math.min(sheet.getLastColumn(), 90)).getDisplayValues()[0];
  const hasEntryTimestamp = isOeeEntryTimestampHeader(headers[1], headers[2]);
  const hasEntryDetails = hasEntryTimestamp && isOeeEntryDetailsHeader(headers[3], headers[4], headers[5]);
  const hasEntryOrderNo = hasEntryDetails && isOeeOrderNoHeader(headers[6]);
  const offset = hasEntryTimestamp ? (hasEntryDetails ? (hasEntryOrderNo ? 6 : 5) : 2) : 0;
  const hasStep = String(headers[5 + offset] || "").toLowerCase().indexOf("step") >= 0;
  const detected = detectOeeOutputColumns(headers);
  const layout = hasStep
    ? {
      hasStep: true,
      hasEntryDetails: hasEntryDetails,
      hasEntryTimestamp: hasEntryTimestamp,
      sequence: 1,
      entryDate: hasEntryTimestamp ? 2 : 0,
      entryTime: hasEntryTimestamp ? 3 : 0,
      entryUser: hasEntryDetails ? 4 : 0,
      submittedAt: hasEntryDetails ? 5 : 0,
      buttonDetails: hasEntryDetails ? 6 : 0,
      productionOrderNo: hasEntryOrderNo ? 7 : 0,
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
      hasEntryDetails: hasEntryDetails,
      hasEntryTimestamp: hasEntryTimestamp,
      sequence: 1,
      entryDate: hasEntryTimestamp ? 2 : 0,
      entryTime: hasEntryTimestamp ? 3 : 0,
      entryUser: hasEntryDetails ? 4 : 0,
      submittedAt: hasEntryDetails ? 5 : 0,
      buttonDetails: hasEntryDetails ? 6 : 0,
      productionOrderNo: hasEntryOrderNo ? 7 : 0,
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

function isOeeEntryDetailsHeader(entryUserHeader, submitTimeHeader, buttonDetailsHeader) {
  const userText = normalizeHeaderText(entryUserHeader);
  const submitText = normalizeHeaderText(submitTimeHeader);
  const detailsText = normalizeHeaderText(buttonDetailsHeader);
  return (
    (userText.indexOf("entry user") >= 0 || userText.indexOf("ผู้กรอก") >= 0) &&
    (submitText.indexOf("submit time") >= 0 || submitText.indexOf("ส่งยอด") >= 0) &&
    (detailsText.indexOf("button details") >= 0 || detailsText.indexOf("รายละเอียด") >= 0)
  );
}

function isOeeOrderNoHeader(orderNoHeader) {
  const text = normalizeHeaderText(orderNoHeader);
  return text.indexOf("order no") >= 0 || text.indexOf("เลขที่ออเดอร์") >= 0;
}

function isOeeDataSheet(sheet, machineByName) {
  if (sheet && typeof sheet.getType === "function" && sheet.getType() !== SpreadsheetApp.SheetType.GRID) return false;
  if (!sheet || sheet.getLastRow() < OEE_HEADER_ROW) return false;
  if (machineByName && machineByName[normalizeSheetName(sheet.getName())]) return true;

  const headers = sheet.getRange(OEE_HEADER_ROW, 1, 1, Math.min(sheet.getLastColumn(), 90)).getDisplayValues()[0];
  if (isOeeEntryTimestampHeader(headers[1], headers[2])) return true;

  const headerText = headers.map(normalizeHeaderText).join(" ");
  const hasDate = headerText.indexOf("date") >= 0 || headerText.indexOf("日期") >= 0;
  const hasProduct = headerText.indexOf("product") >= 0 || headerText.indexOf("产品") >= 0;
  const hasPart = headerText.indexOf("part") >= 0;
  const hasOutput = headerText.indexOf("good") >= 0 || headerText.indexOf("total quantity") >= 0 || headerText.indexOf("normal production") >= 0;
  return hasDate && hasProduct && hasPart && hasOutput;
}

function ensureOeeEntryTimestampColumns(sheet) {
  const headers = sheet.getRange(OEE_HEADER_ROW, 1, 1, Math.min(sheet.getLastColumn(), 90)).getDisplayValues()[0];
  const hasEntryTimestamp = isOeeEntryTimestampHeader(headers[1], headers[2]);
  const hasEntryDetails = hasEntryTimestamp && isOeeEntryDetailsHeader(headers[3], headers[4], headers[5]);
  const hasEntryOrderNo = hasEntryDetails && isOeeOrderNoHeader(headers[6]);
  if (hasEntryTimestamp && hasEntryDetails && hasEntryOrderNo) return false;

  const insertAfter = !hasEntryTimestamp ? 1 : (hasEntryDetails ? 6 : 3);
  const insertCount = !hasEntryTimestamp ? 6 : (hasEntryDetails ? 1 : 4);
  sheet.insertColumnsAfter(insertAfter, insertCount);
  const headerColumn = !hasEntryTimestamp ? 2 : (hasEntryDetails ? 7 : 4);
  const headerValues = !hasEntryTimestamp
    ? [[OEE_ENTRY_DATE_HEADER, OEE_ENTRY_TIME_HEADER, OEE_ENTRY_USER_HEADER, OEE_SUBMIT_TIME_HEADER, OEE_BUTTON_DETAILS_HEADER, OEE_ORDER_NO_HEADER]]
    : (hasEntryDetails
      ? [[OEE_ORDER_NO_HEADER]]
      : [[OEE_ENTRY_USER_HEADER, OEE_SUBMIT_TIME_HEADER, OEE_BUTTON_DETAILS_HEADER, OEE_ORDER_NO_HEADER]]);
  const headerRange = sheet.getRange(OEE_HEADER_ROW, headerColumn, 1, insertCount);
  const styleSource = sheet.getRange(OEE_HEADER_ROW, headerColumn + insertCount, 1, 1);
  styleSource.copyTo(headerRange, { contentsOnly: false });
  headerRange.setValues(headerValues);
  headerRange
    .setBackground("#fbbc04")
    .setFontColor("#000000")
    .setFontWeight("bold")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setWrap(true);
  sheet.setColumnWidth(2, 105);
  sheet.setColumnWidth(3, 90);
  sheet.setColumnWidth(4, 140);
  sheet.setColumnWidth(5, 145);
  sheet.setColumnWidth(6, 360);
  sheet.setColumnWidth(7, 150);
  if (sheet.getLastRow() >= OEE_FIRST_DATA_ROW) {
    const rowCount = sheet.getLastRow() - OEE_FIRST_DATA_ROW + 1;
    sheet.getRange(OEE_FIRST_DATA_ROW, 2, rowCount, 6).setNumberFormat("@").setWrap(true);
  }
  return true;
}

function migrateOeeEntryTimestampColumns() {
  const book = getWorkbook();
  const machineByName = getMachineMap();
  let sheets = 0;
  let inserted = 0;
  const insertedSheets = [];
  const skippedSheets = [];
  book.getSheets().forEach(function(sheet) {
    try {
      if (!isOeeDataSheet(sheet, machineByName)) return;
      sheets++;
      if (ensureOeeEntryTimestampColumns(sheet)) {
        inserted++;
        insertedSheets.push(sheet.getName());
      }
    } catch (error) {
      skippedSheets.push({
        sheet: sheet && typeof sheet.getName === "function" ? sheet.getName() : "",
        error: String(error && error.message ? error.message : error),
      });
    }
  });
  return { sheets: sheets, inserted: inserted, insertedSheets: insertedSheets, skippedSheets: skippedSheets };
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

function migrateOeeMinuteInputColumns() {
  const book = getWorkbook();
  const machineByName = getMachineMap();
  let sheets = 0;
  let rows = 0;
  const skippedSheets = [];

  book.getSheets().forEach(function(sheet) {
    try {
      if (!isOeeDataSheet(sheet, machineByName)) return;
      ensureOeeEntryTimestampColumns(sheet);
      ensureOeeTestColumn(sheet);

      const layout = getOeeLayout(sheet);
      const lastRow = sheet.getLastRow();
      if (lastRow < OEE_FIRST_DATA_ROW) return;

      const rowCount = lastRow - OEE_FIRST_DATA_ROW + 1;
      const sourceMinutes = sheet.getRange(OEE_FIRST_DATA_ROW, layout.normalMinutes, rowCount, 9).getValues();
      const currentNormalInputs = sheet.getRange(OEE_FIRST_DATA_ROW, layout.normalSlot, rowCount, 1).getValues();
      const currentDowntimeInputs = sheet.getRange(OEE_FIRST_DATA_ROW, layout.downtimeStart, rowCount, 8).getValues();
      const identityValues = sheet.getRange(
        OEE_FIRST_DATA_ROW,
        layout.productName,
        rowCount,
        layout.partNo - layout.productName + 1
      ).getDisplayValues();

      const nextNormalInputs = [];
      const nextDowntimeInputs = [];
      let changedRows = 0;

      for (let index = 0; index < rowCount; index++) {
        const productName = String(identityValues[index][0] || "").trim();
        const partNo = String(identityValues[index][identityValues[index].length - 1] || "").trim();
        const minuteRow = sourceMinutes[index];
        const hasMinuteSource = minuteRow.some(function(value) {
          return value !== "" && value != null && !isNaN(Number(value));
        });

        if (!productName || !partNo || !hasMinuteSource) {
          nextNormalInputs.push(currentNormalInputs[index]);
          nextDowntimeInputs.push(currentDowntimeInputs[index]);
          continue;
        }

        const currentMinuteInputs = [currentNormalInputs[index][0]].concat(currentDowntimeInputs[index]);
        const hasCurrentInput = currentMinuteInputs.some(function(value) {
          return value !== "" && value != null && !isNaN(Number(value));
        });

        if (hasCurrentInput) {
          nextNormalInputs.push(currentNormalInputs[index]);
          nextDowntimeInputs.push(currentDowntimeInputs[index]);
        } else {
          nextNormalInputs.push([minuteNumber(minuteRow[0])]);
          nextDowntimeInputs.push(minuteRow.slice(1, 9).map(function(value) {
            return minuteNumber(value);
          }));
          changedRows++;
        }
      }

      if (changedRows > 0) {
        sheet.getRange(OEE_FIRST_DATA_ROW, layout.normalSlot, rowCount, 1).setNumberFormat("0").setValues(nextNormalInputs);
        sheet.getRange(OEE_FIRST_DATA_ROW, layout.downtimeStart, rowCount, 8).setNumberFormat("0").setValues(nextDowntimeInputs);
        sheets++;
        rows += changedRows;
      }
    } catch (error) {
      skippedSheets.push({
        sheet: sheet && typeof sheet.getName === "function" ? sheet.getName() : "",
        error: String(error && error.message ? error.message : error),
      });
    }
  });

  return { sheets: sheets, rows: rows, skippedSheets: skippedSheets };
}

function repairOeeMinuteOutputValues() {
  const book = getWorkbook();
  const machineByName = getMachineMap();
  const result = {
    sheets: 0,
    rows: 0,
    formulas: 0,
    skippedSheets: [],
  };

  book.getSheets().forEach(function(sheet) {
    try {
      if (!isOeeDataSheet(sheet, machineByName)) return;
      ensureOeeEntryTimestampColumns(sheet);
      ensureOeeTestColumn(sheet);

      const layout = getOeeLayout(sheet);
      const rowCount = Math.max(sheet.getLastRow() - OEE_FIRST_DATA_ROW + 1, 0);
      if (rowCount <= 0) return;

      const targetRange = sheet.getRange(OEE_FIRST_DATA_ROW, layout.normalMinutes, rowCount, 9);
      const targetFormulas = targetRange.getFormulas();
      const nextFormulas = [];
      let changed = false;
      let changedRows = {};

      for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
        const rowNumber = OEE_FIRST_DATA_ROW + rowIndex;
        const expectedFormulas = buildOeeMinuteOutputFormulas(rowNumber, layout);
        nextFormulas.push(expectedFormulas);

        for (let columnIndex = 0; columnIndex < 9; columnIndex++) {
          const currentFormula = targetFormulas[rowIndex][columnIndex];
          if (currentFormula !== expectedFormulas[columnIndex]) {
            changed = true;
            changedRows[rowIndex] = true;
            result.formulas++;
          }
        }
      }

      if (changed) {
        targetRange.setNumberFormat("0.00").setFormulas(nextFormulas);
        result.sheets++;
        result.rows += Object.keys(changedRows).length;
      }
    } catch (error) {
      result.skippedSheets.push({
        sheet: sheet && typeof sheet.getName === "function" ? sheet.getName() : "",
        error: String(error && error.message ? error.message : error),
      });
    }
  });

  return result;
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
  const normalMinutes = minuteNumber(log.normalMinutes);
  const downtimeMinutes = [
    minutesToSheetMinutes(log.changeoverMinutes),
    minutesToSheetMinutes(log.inspectionMinutes),
    minutesToSheetMinutes(log.equipmentRepairMinutes),
    minutesToSheetMinutes(log.moldRepairMinutes),
    minutesToSheetMinutes(log.materialChangeMinutes),
    minutesToSheetMinutes(log.emergencyStopMinutes),
    minutesToSheetMinutes(log.meetingMinutes),
    minutesToSheetMinutes(log.plannedStopMinutes),
  ];

  sheet.getRange(row, layout.sequence).setFormula("=ROW()-ROW($A$3)");
  if (layout.entryDate) {
    sheet
      .getRange(row, layout.entryDate)
      .setNumberFormat("@")
      .setValue(formatRecordDate(log.recordDate) || todayBangkok(new Date()));
  }
  if (layout.entryTime) {
    sheet
      .getRange(row, layout.entryTime)
      .setNumberFormat("@")
      .setValue(formatRecordTime(log.recordTime) || timeBangkok(new Date()));
  }
  if (layout.entryUser) {
    sheet
      .getRange(row, layout.entryUser)
      .setNumberFormat("@")
      .setValue(String(log.entryUser || log.userName || ""));
  }
  if (layout.submittedAt) {
    sheet
      .getRange(row, layout.submittedAt)
      .setNumberFormat("@")
      .setValue(formatRecordDateTime(log.submittedAt) || dateTimeBangkok(new Date()));
  }
  if (layout.buttonDetails) {
    sheet
      .getRange(row, layout.buttonDetails)
      .setNumberFormat("@")
      .setWrap(true)
      .setValue(String(log.buttonDetails || ""));
  }
  if (layout.productionOrderNo) {
    sheet
      .getRange(row, layout.productionOrderNo)
      .setNumberFormat("@")
      .setValue(String(log.productionOrderNo || ""));
  }
  sheet.getRange(row, layout.date).setNumberFormat("@").setValue(formatRecordDate(log.date) || todayBangkok(new Date()));
  sheet.getRange(row, layout.shift).setNumberFormat("@").setValue(String(toOriginalShift(log.shift) || ""));
  sheet.getRange(row, layout.productName).setNumberFormat("@").setValue(String(log.productName || ""));
  sheet.getRange(row, layout.partNo).setNumberFormat("@").setValue(String(log.partNo || ""));
  if (layout.hasStep) {
    sheet.getRange(row, layout.step).setNumberFormat("@").setValue(String(log.step || "-"));
  }

  sheet.getRange(row, layout.normalSlot).setNumberFormat("0").setValue(normalMinutes);
  sheet.getRange(row, layout.downtimeStart, 1, downtimeMinutes.length).setNumberFormat("0");
  sheet.getRange(row, layout.downtimeStart, 1, downtimeMinutes.length).setValues([downtimeMinutes]);
  sheet
    .getRange(row, layout.normalMinutes, 1, 9)
    .setNumberFormat("0")
    .setFormulas([buildOeeMinuteOutputFormulas(row, layout)]);
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
    const totalRange = sheet.getRange(OEE_FIRST_DATA_ROW, layout.totalQty, rowCount, 1);
    const totalFormulas = totalRange.getFormulas();
    const computedRange = sheet.getRange(OEE_FIRST_DATA_ROW, layout.theoreticalEffectiveTime, rowCount, 6);
    const computedFormulas = computedRange.getFormulas();
    let testChanged = false;
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
  typedRows += rewriteTypedDataRows(ensureSheet(EMPLOYEE_STATUS_SHEET, EMPLOYEE_STATUS_HEADERS), EMPLOYEE_STATUS_HEADERS, EMPLOYEE_STATUS_NUMBER_HEADERS);
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
    if (layout.entryUser) sheet.getRange(OEE_FIRST_DATA_ROW, layout.entryUser, rowCount, 1).setNumberFormat("@");
    if (layout.submittedAt) sheet.getRange(OEE_FIRST_DATA_ROW, layout.submittedAt, rowCount, 1).setNumberFormat("@");
    if (layout.buttonDetails) sheet.getRange(OEE_FIRST_DATA_ROW, layout.buttonDetails, rowCount, 1).setNumberFormat("@").setWrap(true);
    sheet.getRange(OEE_FIRST_DATA_ROW, layout.date, rowCount, 1).setNumberFormat("yyyy-mm-dd");
    sheet.getRange(OEE_FIRST_DATA_ROW, layout.shift, rowCount, 1).setNumberFormat("@");
    sheet.getRange(OEE_FIRST_DATA_ROW, layout.productName, rowCount, 1).setNumberFormat("@");
    sheet.getRange(OEE_FIRST_DATA_ROW, layout.partNo, rowCount, 1).setNumberFormat("@");
    if (layout.hasStep) {
      sheet.getRange(OEE_FIRST_DATA_ROW, layout.step, rowCount, 1).setNumberFormat("@");
    }
    sheet.getRange(OEE_FIRST_DATA_ROW, layout.normalSlot, rowCount, 1).setNumberFormat("0");
    sheet.getRange(OEE_FIRST_DATA_ROW, layout.downtimeStart, rowCount, 8).setNumberFormat("0");
    sheet.getRange(OEE_FIRST_DATA_ROW, layout.goodQty, rowCount, 3).setNumberFormat("0.##");
    sheet.getRange(OEE_FIRST_DATA_ROW, layout.theoreticalImpulse, rowCount, 1).setNumberFormat("0.##");
    sheet.getRange(OEE_FIRST_DATA_ROW, layout.cavityQty, rowCount, 1).setNumberFormat("0.##");
    typedSheets++;
  });

  return { sheets: typedSheets, rows: typedRows };
}

function repairNegativeOeeMinuteValues() {
  const book = getWorkbook();
  const machineByName = getMachineMap();
  const result = {
    sheets: 0,
    rows: 0,
    cells: 0,
    skipped: [],
  };

  book.getSheets().forEach(function(sheet) {
    try {
      if (!isOeeDataSheet(sheet, machineByName)) return;
      ensureOeeEntryTimestampColumns(sheet);
      ensureOeeTestColumn(sheet);
      const layout = getOeeLayout(sheet);
      const rowCount = Math.max(sheet.getLastRow() - OEE_FIRST_DATA_ROW + 1, 0);
      if (rowCount <= 0) return;

      const minuteRanges = [
        { start: layout.normalSlot, width: 1 },
        { start: layout.downtimeStart, width: 8 },
      ];
      let sheetChanged = false;
      let changedRows = {};

      minuteRanges.forEach(function(item) {
        if (!item.start || item.start < 1 || item.width < 1) return;
        const range = sheet.getRange(OEE_FIRST_DATA_ROW, item.start, rowCount, item.width);
        const values = range.getValues();
        let changed = false;
        for (let rowIndex = 0; rowIndex < values.length; rowIndex++) {
          for (let columnIndex = 0; columnIndex < values[rowIndex].length; columnIndex++) {
            const value = values[rowIndex][columnIndex];
            if (value === "" || value == null || isNaN(Number(value))) continue;
            if (Number(value) < 0) {
              values[rowIndex][columnIndex] = 0;
              changed = true;
              sheetChanged = true;
              changedRows[rowIndex] = true;
              result.cells++;
            }
          }
        }
        if (changed) {
          range.setValues(values);
        }
      });

      if (sheetChanged) {
        result.sheets++;
        result.rows += Object.keys(changedRows).length;
      }
    } catch (error) {
      result.skipped.push({
        sheet: sheet && typeof sheet.getName === "function" ? sheet.getName() : "",
        error: String(error && error.message ? error.message : error),
      });
    }
  });

  return result;
}

function repairOeeMinutePrecision() {
  const book = getWorkbook();
  const machineByName = getMachineMap();
  const result = {
    sheets: 0,
    rows: 0,
    cells: 0,
    skipped: [],
  };

  book.getSheets().forEach(function(sheet) {
    try {
      if (!isOeeDataSheet(sheet, machineByName)) return;
      ensureOeeEntryTimestampColumns(sheet);
      ensureOeeTestColumn(sheet);
      const layout = getOeeLayout(sheet);
      const rowCount = Math.max(sheet.getLastRow() - OEE_FIRST_DATA_ROW + 1, 0);
      if (rowCount <= 0) return;

      const minuteRanges = [
        { start: layout.normalSlot, width: 1 },
        { start: layout.downtimeStart, width: 8 },
      ];
      let sheetChanged = false;
      const changedRows = {};

      minuteRanges.forEach(function(item) {
        if (!item.start || item.start < 1 || item.width < 1) return;
        const range = sheet.getRange(OEE_FIRST_DATA_ROW, item.start, rowCount, item.width);
        const values = range.getValues();
        let changed = false;
        for (let rowIndex = 0; rowIndex < values.length; rowIndex++) {
          for (let columnIndex = 0; columnIndex < values[rowIndex].length; columnIndex++) {
            const value = values[rowIndex][columnIndex];
            if (value === "" || value == null || isNaN(Number(value))) continue;
            const rounded = minuteNumber(value);
            if (Number(value) !== rounded) {
              values[rowIndex][columnIndex] = rounded;
              changed = true;
              sheetChanged = true;
              changedRows[rowIndex] = true;
              result.cells++;
            }
          }
        }
        if (changed) {
          range.setNumberFormat("0").setValues(values);
        } else {
          range.setNumberFormat("0");
        }
      });

      if (sheetChanged) {
        result.sheets++;
        result.rows += Object.keys(changedRows).length;
      }
    } catch (error) {
      result.skipped.push({
        sheet: sheet && typeof sheet.getName === "function" ? sheet.getName() : "",
        error: String(error && error.message ? error.message : error),
      });
    }
  });

  return result;
}

function auditOeeMachineSheets() {
  const entryColumns = migrateOeeEntryTimestampColumns();
  const testColumns = migrateOeeTestColumns();
  const minuteInputColumns = migrateOeeMinuteInputColumns();
  const negativeMinutes = repairNegativeOeeMinuteValues();
  const minutePrecision = repairOeeMinutePrecision();
  const minuteOutputValues = repairOeeMinuteOutputValues();
  const formulas = repairOeeFormulas();
  const types = repairSheetTypes();
  const styles = formatOeeMachineSheets();
  const historySheet = ensureSubmitHistorySheet();

  return {
    entryColumns: entryColumns,
    testColumns: testColumns,
    minuteInputColumns: minuteInputColumns,
    negativeMinutes: negativeMinutes,
    minutePrecision: minutePrecision,
    minuteOutputValues: minuteOutputValues,
    formulas: formulas,
    types: types,
    styles: styles,
    storage: {
      logSheet: LOG_SHEET,
      submitHistorySheet: historySheet.getName(),
      submitHistorySheetId: historySheet.getSheetId(),
    },
    refreshedAt: new Date().toISOString(),
  };
}

function formatOeeMachineSheets() {
  const book = getWorkbook();
  const machineByName = getMachineMap();
  const result = {
    sheets: 0,
    rows: 0,
    skipped: [],
  };

  book.getSheets().forEach(function(sheet) {
    if (!isOeeDataSheet(sheet, machineByName)) return;
    try {
      ensureOeeEntryTimestampColumns(sheet);
      ensureOeeTestColumn(sheet);
      const layout = getOeeLayout(sheet);
      const rowCount = Math.max(sheet.getLastRow() - OEE_FIRST_DATA_ROW + 1, 0);
      const lastColumn = Math.max(sheet.getLastColumn(), layout.oeeRate || 0);

      try {
        sheet.setFrozenRows(OEE_HEADER_ROW);
      } catch (freezeRowsError) {
        // Some imported sheets contain merged title cells; formatting should continue.
      }
      try {
        sheet.setFrozenColumns(Math.min(10, lastColumn));
      } catch (freezeColumnsError) {
        // Some imported sheets contain merged title cells; formatting should continue.
      }
      sheet.getRange(OEE_HEADER_ROW, 1, 1, lastColumn)
        .setBackground("#fbbc04")
        .setFontColor("#000000")
        .setFontWeight("bold")
        .setHorizontalAlignment("center")
        .setVerticalAlignment("middle")
        .setWrap(true);
      sheet.getRange(1, 1, 2, lastColumn)
        .setHorizontalAlignment("center")
        .setVerticalAlignment("middle")
        .setWrap(true);
      if (lastColumn >= 35) {
        sheet.getRange(1, 35, 1, 1)
          .setBackground("#ff0000")
          .setFontColor("#000000")
          .setFontWeight("bold")
          .setHorizontalAlignment("center");
      }

      applyOeeMachineDataFormats(sheet, layout, rowCount);
      applyOeeMachineColumnWidths(sheet, layout, lastColumn);

      result.sheets++;
      result.rows += rowCount;
    } catch (error) {
      result.skipped.push({
        sheet: sheet.getName(),
        error: String(error && error.message ? error.message : error),
      });
    }
  });

  return result;
}

function applyOeeMachineDataFormats(sheet, layout, rowCount) {
  if (rowCount <= 0) return;

  if (layout.entryDate) sheet.getRange(OEE_FIRST_DATA_ROW, layout.entryDate, rowCount, 1).setNumberFormat("yyyy-mm-dd");
  if (layout.entryTime) sheet.getRange(OEE_FIRST_DATA_ROW, layout.entryTime, rowCount, 1).setNumberFormat("@");
  if (layout.entryUser) sheet.getRange(OEE_FIRST_DATA_ROW, layout.entryUser, rowCount, 1).setNumberFormat("@");
  if (layout.submittedAt) sheet.getRange(OEE_FIRST_DATA_ROW, layout.submittedAt, rowCount, 1).setNumberFormat("@");
  if (layout.buttonDetails) sheet.getRange(OEE_FIRST_DATA_ROW, layout.buttonDetails, rowCount, 1).setNumberFormat("@").setWrap(true);

  sheet.getRange(OEE_FIRST_DATA_ROW, layout.date, rowCount, 1).setNumberFormat("yyyy-mm-dd");
  sheet.getRange(OEE_FIRST_DATA_ROW, layout.shift, rowCount, 1).setNumberFormat("@");
  sheet.getRange(OEE_FIRST_DATA_ROW, layout.productName, rowCount, 1).setNumberFormat("@").setWrap(true);
  sheet.getRange(OEE_FIRST_DATA_ROW, layout.partNo, rowCount, 1).setNumberFormat("@").setWrap(true);
  if (layout.hasStep) {
    sheet.getRange(OEE_FIRST_DATA_ROW, layout.step, rowCount, 1).setNumberFormat("@").setWrap(true);
  }

  sheet.getRange(OEE_FIRST_DATA_ROW, layout.normalSlot, rowCount, 1).setNumberFormat("0");
  sheet.getRange(OEE_FIRST_DATA_ROW, layout.downtimeStart, rowCount, 8).setNumberFormat("0");
  sheet.getRange(OEE_FIRST_DATA_ROW, layout.normalMinutes, rowCount, 9).setNumberFormat("0");
  sheet.getRange(OEE_FIRST_DATA_ROW, layout.goodQty, rowCount, 4).setNumberFormat("0.##");
  sheet.getRange(OEE_FIRST_DATA_ROW, layout.theoreticalImpulse, rowCount, 4).setNumberFormat("0.##");
  sheet.getRange(OEE_FIRST_DATA_ROW, layout.equipmentUtilizationRate, rowCount, 4).setNumberFormat("0.00%");
}

function applyOeeMachineColumnWidths(sheet, layout, lastColumn) {
  sheet.setColumnWidth(1, 55);
  if (lastColumn >= 2) sheet.setColumnWidth(2, 105);
  if (lastColumn >= 3) sheet.setColumnWidth(3, 90);
  if (lastColumn >= 4) sheet.setColumnWidth(4, 140);
  if (lastColumn >= 5) sheet.setColumnWidth(5, 145);
  if (lastColumn >= 6) sheet.setColumnWidth(6, 360);
  sheet.setColumnWidth(layout.productName, 145);
  sheet.setColumnWidth(layout.partNo, 120);
  if (layout.hasStep) sheet.setColumnWidth(layout.step, 70);
  if (lastColumn > layout.normalSlot) {
    sheet.setColumnWidths(layout.normalSlot, lastColumn - layout.normalSlot + 1, 72);
  }
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

function minutesToSheetMinutes(value) {
  return minuteNumber(value);
}

function numberValue(value) {
  const number = Number(value || 0);
  return isFinite(number) ? number : 0;
}

function minuteNumber(value) {
  return Math.max(Math.round(numberValue(value)), 0);
}

function nonNegativeNumber(value) {
  return Math.max(roundNumber(value), 0);
}

function normalizeProductionLogMinuteFields(log) {
  const next = Object.assign({}, log);
  [
    "workMinutes",
    "normalMinutes",
    "timeSlots",
    "changeoverMinutes",
    "inspectionMinutes",
    "equipmentRepairMinutes",
    "moldRepairMinutes",
    "materialChangeMinutes",
    "emergencyStopMinutes",
    "meetingMinutes",
    "plannedStopMinutes",
    "newModelMinutes",
  ].forEach(function(key) {
    next[key] = minuteNumber(next[key]);
  });
  repairProductionLogMinuteConsistency(next);
  validateProductionLogMinuteConsistency(next);
  return next;
}

function productionLogOutputQty(log) {
  return numberValue(log.goodQty) + numberValue(log.ngQty) + numberValue(log.testQty);
}

function productionLogDowntimeMinutes(log) {
  return sumValues([
    log.changeoverMinutes,
    log.inspectionMinutes,
    log.equipmentRepairMinutes,
    log.moldRepairMinutes,
    log.materialChangeMinutes,
    log.emergencyStopMinutes,
    log.meetingMinutes,
    log.plannedStopMinutes,
    log.newModelMinutes,
  ]);
}

function repairProductionLogMinuteConsistency(log) {
  if (productionLogOutputQty(log) <= 0) {
    return log;
  }
  const downtimeMinutes = minuteNumber(productionLogDowntimeMinutes(log));
  if (minuteNumber(log.workMinutes) <= 0 && minuteNumber(log.normalMinutes) > 0) {
    log.workMinutes = minuteNumber(log.normalMinutes + downtimeMinutes);
    log.timeSlots = minuteNumber(log.workMinutes);
  }
  if (minuteNumber(log.normalMinutes) <= 0 && minuteNumber(log.workMinutes) > downtimeMinutes) {
    log.normalMinutes = minuteNumber(log.workMinutes - downtimeMinutes);
  }
  return log;
}

function validateProductionLogMinuteConsistency(log) {
  if (productionLogOutputQty(log) <= 0) {
    return;
  }
  if (minuteNumber(log.normalMinutes) > 0) {
    return;
  }
  throw new Error("มียอดชิ้นงาน Good/NG/Test แต่ไม่มีเวลาผลิตจริง กรุณากดเริ่มผลิตหรือกดหัวข้อเวลาที่ใช้งานจริงก่อนส่งยอด");
}

function sumValues(values) {
  return values.reduce((sum, value) => sum + numberValue(value), 0);
}

function roundNumber(value) {
  return Math.round(numberValue(value) * 100) / 100;
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

function buildOeeMinuteOutputFormulas(row, layout) {
  const startColumn = layout.normalSlot;
  const formulas = [];
  for (let index = 0; index < 9; index++) {
    const sourceCell = columnToLetter(startColumn + index) + row;
    formulas.push('=IF(' + sourceCell + '="","",MAX(' + sourceCell + ',0))');
  }
  return formulas;
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
    "MAX(" + columnToLetter(normalColumn) + row + ",0)",
    "MAX(" + columnToLetter(downtimeColumn) + row + ",0)",
    "MAX(" + columnToLetter(downtimeColumn + 1) + row + ",0)",
    "MAX(" + columnToLetter(downtimeColumn + 2) + row + ",0)",
    "MAX(" + columnToLetter(downtimeColumn + 3) + row + ",0)",
    "MAX(" + columnToLetter(downtimeColumn + 4) + row + ",0)",
    "MAX(" + columnToLetter(downtimeColumn + 5) + row + ",0)",
    "MAX(" + columnToLetter(downtimeColumn + 6) + row + ",0)",
    "MAX(" + columnToLetter(downtimeColumn + 7) + row + ",0)",
  ];
  return "=IFERROR(" + cells.join("+") + ",0)";
}

function buildEquipmentUtilizationRateFormula(row, layout) {
  return "=IFERROR(" +
    columnToLetter(layout.theoreticalEffectiveTime) + row +
    "/MAX(" + columnToLetter(layout.normalMinutes) + row + ",0)" +
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
    "MAX(" + columnToLetter(layout.normalMinutes) + row + ",0)" +
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
    .filter(function(log) {
      return isVisibleMachineId(log.machineId);
    })
    .reverse();
  return mergeLogs(productionLogs, getLegacyOeeLogs().filter(function(log) {
    return isVisibleMachineId(log.machineId);
  })).slice(0, limit);
}

function refreshKpiSheets() {
  const book = getWorkbook();
  const refreshedAt = new Date().toISOString();
  ensureKpiAutoRefreshTrigger();
  const capacityLookup = {};
  const rawLogs = getLogs(100000);
  const logs = dedupeKpiLogs(rawLogs, capacityLookup);
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
    targets: [mainTarget],
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
  return [];
}

function ensureKpiAutoRefreshTrigger() {
  try {
    const exists = ScriptApp.getProjectTriggers().some(function(trigger) {
      return trigger.getHandlerFunction() === KPI_AUTO_REFRESH_HANDLER;
    });
    if (!exists) {
      ScriptApp.newTrigger(KPI_AUTO_REFRESH_HANDLER).timeBased().everyMinutes(10).create();
    }
  } catch (error) {
    // Web-app calls can still refresh KPI even if trigger permission has not been granted yet.
  }
}

function openPdSpreadsheet(source) {
  throw new Error("PD Sheets integration is disabled.");
}

function getNativePdSpreadsheetId(source) {
  return "";
}

function parseJsonSafe(value) {
  try {
    return value ? JSON.parse(value) : null;
  } catch (error) {
    return null;
  }
}

function buildKpiCapacityLookup() {
  return {};
}

function readPdCapacityRows(book, source) {
  return [];
}

function isKpiOutputSheet(name) {
  const normalized = String(name || "").trim().toLowerCase();
  if (normalized.indexOf("kpi_") === 0) return true;
  return [
    KPI_DASHBOARD_SHEET,
    KPI_MACHINE_SHEET,
    KPI_MACHINE_STEP_SHEET,
    KPI_MACHINE_JOB_STEP_SHEET,
    KPI_DAILY_DETAIL_SHEET,
    KPI_NOTES_SHEET,
  ].indexOf(normalized) >= 0;
}

function detectPdCapacityLayout(values) {
  let best = null;
  values.forEach(function(row, rowIndex) {
    const headers = row.map(normalizeKpiKey);
    const partNoIndex = findPdHeaderIndex(headers, ["PARTNO", "PARTNUMBER", "PN"]);
    const partNameIndex = findPdHeaderIndex(headers, ["PARTNAME", "PRODUCTNAME", "PRODUCT", "ITEMNAME"]);
    const stepIndex = findPdHeaderIndex(headers, ["STEP"]);
    const machineIndex = findPdHeaderIndex(headers, ["MCNO", "M/CNO", "MACHINE", "M/C"]);
    const targetIndex = findPdTargetIndex(headers);
    const score =
      (partNoIndex >= 0 ? 4 : 0) +
      (partNameIndex >= 0 ? 2 : 0) +
      (stepIndex >= 0 ? 2 : 0) +
      (machineIndex >= 0 ? 2 : 0) +
      (targetIndex >= 0 ? 4 : 0);
    if (!best || score > best.score) {
      best = {
        score: score,
        headerRow: rowIndex,
        partNoIndex: partNoIndex >= 0 ? partNoIndex : 2,
        partNameIndex: partNameIndex >= 0 ? partNameIndex : 1,
        stepIndex: stepIndex >= 0 ? stepIndex : 3,
        machineIndex: machineIndex,
        targetIndex: targetIndex,
      };
    }
  });
  if (!best || best.score < 4) return null;
  return best;
}

function findPdHeaderIndex(headers, tokens) {
  for (let index = 0; index < headers.length; index++) {
    if (tokens.some(function(token) { return headers[index].indexOf(token) >= 0; })) return index;
  }
  return -1;
}

function findPdTargetIndex(headers) {
  let fallback = -1;
  for (let index = 0; index < headers.length; index++) {
    const header = headers[index];
    if (!header) continue;
    if (header.indexOf("TARGET8") >= 0 || header.indexOf("TARGET/HOUR") >= 0 || header.indexOf("TARGET") >= 0) return index;
    if (header.indexOf("8HOUR") >= 0 || header.indexOf("8HR") >= 0) fallback = index;
  }
  return fallback;
}

function extractPdCapacityRow(row, layout, source, sheetName) {
  const partNo = normalizeKpiText(row[layout.partNoIndex]);
  const productName = normalizeKpiText(row[layout.partNameIndex]);
  const step = normalizeKpiText(row[layout.stepIndex], "-");
  const machineName = layout.machineIndex >= 0 ? normalizeKpiText(row[layout.machineIndex]) : "";
  const target8h = getPdCapacityTarget(row, layout.targetIndex);
  if ((!partNo && !productName) || target8h <= 0) return null;
  return {
    sourceLabel: source.label,
    sheetName: sheetName,
    machineName: machineName,
    machineAlias: sheetName,
    productName: productName,
    partNo: partNo,
    step: step,
    target8h: target8h,
    speedPcsPerMinute: target8h / 480,
  };
}

function getPdCapacityTarget(row, targetIndex) {
  if (targetIndex >= 0) {
    const target = numberValue(String(row[targetIndex] || "").replace(/,/g, ""));
    if (target > 0) return target;
  }
  for (let index = row.length - 1; index >= 0; index--) {
    const value = numberValue(String(row[index] || "").replace(/,/g, ""));
    if (value > 0) return value;
  }
  return 0;
}

function addKpiCapacityLookup(lookup, item) {
  const machineKeys = [
    normalizeKpiKey(item.machineName),
    normalizeKpiKey(item.machineAlias),
  ].filter(Boolean);
  const partKey = normalizeKpiKey(item.partNo);
  const productKey = normalizeKpiKey(item.productName);
  const stepKeys = getKpiStepKeys(item.step || "-");
  const keys = [];
  machineKeys.forEach(function(machineKey) {
    stepKeys.forEach(function(stepKey) {
      if (partKey) keys.push(machineKey + "|" + partKey + "|" + stepKey);
      if (productKey) keys.push(machineKey + "|" + productKey + "|" + stepKey);
    });
  });
  keys.forEach(function(key) {
    if (!lookup[key]) {
      lookup[key] = {
        target8h: item.target8h,
        speedPcsPerMinute: item.speedPcsPerMinute,
        source: "External capacity " + item.sourceLabel + " / " + item.sheetName,
      };
    }
  });
}

function findKpiCapacity(lookup, log) {
  if (!lookup) return null;
  const machineKeys = [
    normalizeKpiKey(log.machineId),
    normalizeKpiKey(log.machineName),
  ].filter(Boolean);
  const stepKeys = getKpiStepKeys(log.step || "-");
  const valueKeys = [
    normalizeKpiKey(log.partNo),
    normalizeKpiKey(log.productName),
  ].filter(Boolean);
  for (let machineIndex = 0; machineIndex < machineKeys.length; machineIndex++) {
    for (let valueIndex = 0; valueIndex < valueKeys.length; valueIndex++) {
      for (let stepIndex = 0; stepIndex < stepKeys.length; stepIndex++) {
        const exact = lookup[machineKeys[machineIndex] + "|" + valueKeys[valueIndex] + "|" + stepKeys[stepIndex]];
        if (exact) return exact;
      }
    }
  }
  return null;
}

function getKpiStepKeys(step) {
  const text = normalizeKpiText(step, "-");
  const keys = [normalizeKpiKey(text)];
  const slashMatch = text.match(/^(\d+)\s*\/\s*\d+$/);
  if (slashMatch) keys.push(normalizeKpiKey(slashMatch[1]));
  if (text === "/" || text === "-" || text === "1/1") keys.push(normalizeKpiKey("-"));
  return keys.filter(function(key, index, list) {
    return key && list.indexOf(key) === index;
  });
}

function dedupeKpiLogs(rawLogs, capacityLookup) {
  const map = {};
  rawLogs.forEach(function(raw) {
    const log = normalizeKpiLog(raw, capacityLookup);
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

function normalizeKpiLog(raw, capacityLookup) {
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
    raw.newModelMinutes,
  ]);
  const rawNormalMinutes = numberValue(raw.normalMinutes);
  const normalMinutes = rawNormalMinutes > 0 ? rawNormalMinutes : Math.max(workMinutes - downtimeMinutes, 0);
  const machineId = normalizeKpiText(raw.machineId || raw.machineName, "unknown");
  const machineName = normalizeKpiText(raw.machineName, "Unknown machine");
  const productName = normalizeKpiText(raw.productName, "-");
  const partNo = normalizeKpiText(raw.partNo, "(blank)");
  const step = normalizeKpiText(raw.step, "-");
  const productKey = normalizeKpiKey(productName);
  const partKey = normalizeKpiKey(partNo);
  const stepKey = normalizeKpiKey(step || "-");
  const fallbackSpeed = machineSpeed >= 1000 ? machineSpeed / 480 : machineSpeed * cavityQty;
  const capacity = findKpiCapacity(capacityLookup, {
    machineId: machineId,
    machineName: machineName,
    productName: productName,
    productKey: productKey,
    partNo: partNo,
    partKey: partKey,
    step: step,
    stepKey: stepKey,
  });
  const speedPcsPerMinute = capacity ? capacity.speedPcsPerMinute : fallbackSpeed;
  const targetQty = speedPcsPerMinute * workMinutes;
  const actualOutput = goodQty + ngQty + testQty;
  const target8h = capacity ? capacity.target8h : speedPcsPerMinute * 480;
  const kpi = targetQty > 0 ? actualOutput / targetQty : 0;
  const availability = workMinutes > 0 ? normalMinutes / workMinutes : 0;
  const quality = goodQty + ngQty > 0 ? goodQty / (goodQty + ngQty) : 0;

  return {
    id: normalizeKpiText(raw.id),
    date: formatLegacyDate(raw.date),
    month: String(formatLegacyDate(raw.date)).slice(0, 7),
    shift: toOriginalShift(raw.shift) || "-",
    shiftStartAt: normalizeKpiText(raw.shiftStartAt),
    machineId: machineId,
    machineName: machineName,
    productName: productName,
    productKey: productKey,
    partNo: partNo,
    partKey: partKey,
    step: step,
    stepKey: stepKey,
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
    speedSource: capacity ? capacity.source : (machineSpeed >= 1000 ? "machineSpeed / 480" : "machineSpeed x cavityQty"),
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
    ["Speed pcs/min", "Priority 1: if machineSpeed >= 1000, divide by 480. Priority 2: machineSpeed x cavityQty."],
    ["External capacity", "Disabled. KPI uses production log speed only."],
    ["Auto refresh", "KPI auto refresh trigger runs every 10 minutes after refreshKpi is called once."],
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
    const lastColumn = Math.max(
      layout.cavityQty,
      layout.theoreticalImpulse,
      layout.testQty,
      layout.entryUser || 0,
      layout.submittedAt || 0,
      layout.buttonDetails || 0
    );
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
      const recordedNormalInputMinutes = minuteNumber(row[layout.normalSlot - 1]);
      const recordedNormalMinutes = minuteNumber(row[layout.normalMinutes - 1]);
      const downtimeMinutes = [];
      for (let column = layout.downtimeStart; column < layout.downtimeStart + 8; column++) {
        const minuteColumn = layout.normalMinutes + (column - layout.downtimeStart) + 1;
        const recordedMinutes = minuteNumber(row[minuteColumn - 1]);
        const inputMinutes = minuteNumber(row[column - 1]);
        downtimeMinutes.push(recordedMinutes > 0 ? recordedMinutes : inputMinutes);
      }
      const normalMinutes = recordedNormalMinutes > 0 ? recordedNormalMinutes : recordedNormalInputMinutes;
      const workMinutes = minuteNumber(normalMinutes + sumValues(downtimeMinutes));
      const sourceRow = index + OEE_FIRST_DATA_ROW;

      logs.push({
        id: "legacy-" + machine.id + "-" + sourceRow,
        recordDate: layout.entryDate ? formatRecordDate(row[layout.entryDate - 1]) : "",
        recordTime: layout.entryTime ? formatRecordTime(row[layout.entryTime - 1]) : "",
        entryUser: layout.entryUser ? String(row[layout.entryUser - 1] || "") : "",
        submittedAt: layout.submittedAt ? formatRecordDateTime(row[layout.submittedAt - 1]) : "",
        buttonDetails: layout.buttonDetails ? String(row[layout.buttonDetails - 1] || "") : "",
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
        timeSlots: minuteNumber(workMinutes),
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
    if (!isVisibleMachineId(id)) return null;
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

function formatRecordDateTime(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");
  }
  const text = String(value || "").trim();
  if (!text) return "";
  const readable = text.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{1,2}:\d{2}(?::\d{2})?)/);
  if (readable) return readable[1] + " " + normalizeTimeText(readable[2]);
  const parsed = new Date(text);
  if (!isNaN(parsed.getTime())) {
    return Utilities.formatDate(parsed, "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");
  }
  return text;
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

function dateTimeBangkok(value) {
  return Utilities.formatDate(value || new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");
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
  ensureSubmitHistorySheet();
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
  sheet.setFrozenColumns(10);

  const noteRow = new Array(totalColumns).fill("");
  noteRow[1] = "只填写黄色区域表格";
  noteRow[20] = "表中每小格代表5分钟，总个数132";
  noteRow[34] = "X2";
  const codeRow = new Array(totalColumns).fill("");
  const timeCodes = ["A", "B", "C", "D", "E", "F", "G", "H", "X", "A", "B", "C", "D", "E", "F", "G", "H", "X"];
  for (let index = 0; index < timeCodes.length; index++) {
    codeRow[10 + index] = timeCodes[index];
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
  sheet.getRange(1, 35, 1, 1).setBackground("#ff0000").setFontWeight("bold");
  sheet.getRange(OEE_FIRST_DATA_ROW, 2, Math.max(logs.length, 1), 5).setNumberFormat("@").setWrap(true);
  sheet.getRange(OEE_FIRST_DATA_ROW, 7, Math.max(logs.length, 1), 4).setNumberFormat("@");
  sheet.getRange(OEE_FIRST_DATA_ROW, 11, Math.max(logs.length, 1), totalColumns - 11).setNumberFormat("0.##");
  sheet.getRange(OEE_FIRST_DATA_ROW, totalColumns, Math.max(logs.length, 1), 1).setNumberFormat("@");
  sheet.getRange(OEE_FIRST_DATA_ROW, 37, Math.max(logs.length, 1), 4).setNumberFormat("0.00%");
  sheet.autoResizeColumns(1, totalColumns);
  sheet.setColumnWidths(1, 1, 55);
  sheet.setColumnWidths(2, 4, 105);
  sheet.setColumnWidth(6, 360);
  sheet.setColumnWidths(9, 2, 145);
}

function getCncMachineSheetHeaders() {
  return [
    "序号No",
    OEE_ENTRY_DATE_HEADER,
    OEE_ENTRY_TIME_HEADER,
    OEE_ENTRY_USER_HEADER,
    OEE_SUBMIT_TIME_HEADER,
    OEE_BUTTON_DETAILS_HEADER,
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
    OEE_ORDER_NO_HEADER,
  ];
}

function buildCncMachineSheetRow(log, rowNumber) {
  const downtimeMinutes = [
    minutesToSheetMinutes(log.changeoverMinutes),
    minutesToSheetMinutes(log.inspectionMinutes),
    minutesToSheetMinutes(log.equipmentRepairMinutes),
    minutesToSheetMinutes(log.moldRepairMinutes),
    minutesToSheetMinutes(log.materialChangeMinutes),
    minutesToSheetMinutes(log.emergencyStopMinutes),
    minutesToSheetMinutes(log.meetingMinutes),
    minutesToSheetMinutes(log.plannedStopMinutes),
  ];
  const totalFormula = "=AC" + rowNumber + "+AD" + rowNumber + "+AE" + rowNumber;
  return [
    "=ROW()-ROW($A$3)",
    formatRecordDate(log.recordDate),
    formatRecordTime(log.recordTime),
    String(log.entryUser || log.userName || ""),
    formatRecordDateTime(log.submittedAt),
    String(log.buttonDetails || ""),
    formatRecordDate(log.date),
    toOriginalShift(log.shift),
    String(log.productName || ""),
    String(log.partNo || ""),
    minuteNumber(log.normalMinutes),
  ]
    .concat(downtimeMinutes)
    .concat([
      minuteNumber(log.normalMinutes),
      minuteNumber(log.changeoverMinutes),
      minuteNumber(log.inspectionMinutes),
      minuteNumber(log.equipmentRepairMinutes),
      minuteNumber(log.moldRepairMinutes),
      minuteNumber(log.materialChangeMinutes),
      minuteNumber(log.emergencyStopMinutes),
      minuteNumber(log.meetingMinutes),
      minuteNumber(log.plannedStopMinutes),
      numberValue(log.goodQty),
      numberValue(log.ngQty),
      numberValue(log.testQty) > 0 ? numberValue(log.testQty) : "",
      totalFormula,
      nonNegativeNumber(log.machineSpeed),
      nonNegativeNumber(log.cavityQty),
      "=IFERROR(AF" + rowNumber + "/AG" + rowNumber + ",\"\")",
      minuteNumber(log.workMinutes),
      "=IFERROR(AI" + rowNumber + "/AJ" + rowNumber + ",\"\")",
      "=IFERROR(AC" + rowNumber + "/AF" + rowNumber + ",\"\")",
      "=IFERROR(T" + rowNumber + "/AJ" + rowNumber + ",\"\")",
      "=IFERROR(AK" + rowNumber + "*AL" + rowNumber + "*AM" + rowNumber + ",\"\")",
      "=IF(O" + rowNumber + ">0,1,0)",
      "=IF(AO" + rowNumber + ">0,X" + rowNumber + "/AO" + rowNumber + ",\"\")",
      "=IF(AO" + rowNumber + ">0,T" + rowNumber + "/AO" + rowNumber + ",\"\")",
      String(log.productionOrderNo || ""),
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
  return [];
  return PD_EXTERNAL_SHEETS.map(function(source) {
    try {
      const gid = source.gid || "0";
      const book = openPdSpreadsheet(source);
      let sheets = book.getSheets();
      const selectedSheets = sheets.filter(function(sheet) {
        return String(sheet.getSheetId()) === String(gid);
      });
      if (selectedSheets.length) sheets = selectedSheets;
      return {
        ok: true,
        id: source.id,
        label: source.label,
        gid: gid,
        name: source.label,
        url: source.url,
        fetchedAt: new Date().toISOString(),
        sheets: sheets.map(function(sheet) {
          const lastRow = Math.min(sheet.getLastRow(), PD_MAX_ROWS_PER_SHEET + 1);
          const lastColumn = Math.min(sheet.getLastColumn(), PD_MAX_COLUMNS_PER_SHEET);
          const normalized = lastRow > 0 && lastColumn > 0
            ? trimPdValues(sheet.getRange(1, 1, lastRow, lastColumn).getDisplayValues())
            : [];
          const headers = normalized.length ? normalized[0].map(function(value, index) {
            return value || "Column " + (index + 1);
          }) : [];
          return {
            name: sheet.getName(),
            headers: headers,
            rows: normalized.slice(1, PD_MAX_ROWS_PER_SHEET),
            rowCount: Math.max(sheet.getLastRow() - 1, 0),
            columnCount: headers.length,
            truncated: sheet.getLastRow() > PD_MAX_ROWS_PER_SHEET,
          };
        }),
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
