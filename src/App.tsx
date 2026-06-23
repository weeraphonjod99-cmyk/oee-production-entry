import {
  BarChart3,
  ClipboardList,
  Database,
  Download,
  Gauge,
  History,
  KeyRound,
  LockKeyhole,
  LogOut,
  Save,
  Search,
  Share2,
  TableProperties,
  Trash2,
  UserPlus,
  UserRound,
  Wifi,
  WifiOff,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { machines, products, seedLogs, shiftOptions } from "./data/oeeMasterData.generated";
import { appendRemoteLog, fetchRemoteLogs, remoteEnabled } from "./lib/api";
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
  downtimeFields,
  formatNumber,
  formatPercent,
  formatRate,
  groupDowntime,
  summarize,
  totalDowntime,
} from "./lib/metrics";
import { appendLocalLog, exportLogsCsv, loadLocalLogs, saveLocalLogs } from "./lib/storage";
import type { EntryDraft, Machine, ProductionLog, ProductMaster } from "./types";

type TabId = "entry" | "dashboard" | "history" | "master" | "users";

type Filters = {
  machineId: string;
  shift: string;
  from: string;
  to: string;
};

type ProductFieldKey = "productName" | "partNo" | "step";

const today = new Date().toISOString().slice(0, 10);
const defaultMachine = machines[0];
const defaultProduct = products.find((product) => product.machineId === defaultMachine.id) ?? products[0];
const orderedShiftOptions = Array.from(new Set(["白", "夜", ...shiftOptions]));
const brandLogoSrc = `${import.meta.env.BASE_URL}jr-logo.png`;
const productionShareUrl = "https://weeraphonjod99-cmyk.github.io/oee-production-entry/";
const defaultMinutesPerSlot = 5;

const toPositiveNumber = (value: string) => Math.max(Number(value) || 0, 0);
const roundNumber = (value: number) => Number(value.toFixed(2));

const slotsFromMinutes = (workMinutes: number, minutesPerSlot: number) =>
  minutesPerSlot > 0 ? roundNumber(workMinutes / minutesPerSlot) : 0;

function createEmptyDraft(machine: Machine, product: ProductMaster): EntryDraft {
  const minutesPerSlot = defaultMinutesPerSlot;
  return {
    date: today,
    shift: orderedShiftOptions[0] ?? "白",
    machineId: machine.id,
    productName: product.productName,
    partNo: product.partNo,
    step: product.step,
    machineSpeed: 0,
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
  if (shift === "白") return "白 / Day";
  if (shift === "夜") return "夜 / Night";
  return shift;
};

const makeLogId = () => `log-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const normalizeText = (value: string) => value.trim().toLowerCase();

function uniqueProductValues(items: ProductMaster[], key: ProductFieldKey) {
  return Array.from(new Set(items.map((item) => item[key]).filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function uniqueLogs(logs: ProductionLog[]) {
  const map = new Map<string, ProductionLog>();
  for (const log of logs) map.set(log.id, log);
  return [...map.values()].sort((a, b) => `${b.date}-${b.createdAt}`.localeCompare(`${a.date}-${a.createdAt}`));
}

function App() {
  const [tab, setTab] = useState<TabId>("entry");
  const [session, setSession] = useState<AppSession | null>(() => loadSession());
  const [localLogs, setLocalLogs] = useState<ProductionLog[]>([]);
  const [remoteLogs, setRemoteLogs] = useState<ProductionLog[]>([]);
  const [status, setStatus] = useState(remoteEnabled ? "พร้อมเชื่อมต่อ Google Sheet" : "โหมดทดลองในเครื่อง");
  const [saving, setSaving] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [filters, setFilters] = useState<Filters>({ machineId: "", shift: "", from: "", to: "" });
  const [draft, setDraft] = useState<EntryDraft>(() => createEmptyDraft(defaultMachine, defaultProduct));

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
    if (session && !canAccessTab(session, tab)) setTab("entry");
  }, [session, tab]);

  const currentMachine = machines.find((machine) => machine.id === draft.machineId) ?? defaultMachine;
  const machineProducts = useMemo(
    () => products.filter((product) => product.machineId === draft.machineId),
    [draft.machineId],
  );
  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    if (!query) return machineProducts;
    return machineProducts.filter((product) =>
      `${product.productName} ${product.partNo} ${product.step}`.toLowerCase().includes(query),
    );
  }, [machineProducts, productSearch]);
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
  const visibleLogs = useMemo(() => {
    return allLogs.filter((log) => {
      if (filters.machineId && log.machineId !== filters.machineId) return false;
      if (filters.shift && log.shift !== filters.shift) return false;
      if (filters.from && log.date < filters.from) return false;
      if (filters.to && log.date > filters.to) return false;
      return true;
    });
  }, [allLogs, filters]);

  const searchedHistory = useMemo(() => {
    const query = historySearch.trim().toLowerCase();
    if (!query) return visibleLogs.slice(0, 120);
    return visibleLogs
      .filter((log) => `${log.machineName} ${log.productName} ${log.partNo} ${log.step}`.toLowerCase().includes(query))
      .slice(0, 120);
  }, [visibleLogs, historySearch]);

  const summary = useMemo(() => summarize(visibleLogs), [visibleLogs]);
  const downtime = useMemo(() => groupDowntime(visibleLogs), [visibleLogs]);
  const totalDraftDowntime = totalDowntime(draft);
  const computedNormalMinutes = Math.max(draft.workMinutes - totalDraftDowntime, 0);

  const selectMachine = (machineId: string) => {
    const machine = machines.find((item) => item.id === machineId) ?? defaultMachine;
    const nextProduct = products.find((product) => product.machineId === machine.id) ?? defaultProduct;
    setProductSearch("");
    setDraft((prev) => ({
      ...prev,
      machineId: machine.id,
      productName: nextProduct.productName,
      partNo: nextProduct.partNo,
      step: nextProduct.step,
      machineSpeed: 0,
      workMinutes: machine.capacityMinutes,
      timeSlots: slotsFromMinutes(machine.capacityMinutes, prev.minutesPerSlot),
    }));
  };

  const updateProductField = (key: ProductFieldKey, value: string) => {
    const normalized = normalizeText(value);
    const matches = normalized
      ? filteredProducts.filter((product) => normalizeText(product[key]) === normalized)
      : [];
    const matchedProduct = matches.length === 1 ? matches[0] : null;

    setDraft((prev) =>
      matchedProduct
        ? {
            ...prev,
            productName: matchedProduct.productName,
            partNo: matchedProduct.partNo,
            step: matchedProduct.step,
          }
        : {
            ...prev,
            [key]: value,
          },
    );
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
    }));
  };

  const resetDraft = () => {
    const product = products.find((item) => item.machineId === draft.machineId) ?? defaultProduct;
    setDraft(createEmptyDraft(currentMachine, product));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const machine = machines.find((item) => item.id === draft.machineId) ?? currentMachine;
    const log: ProductionLog = {
      ...draft,
      id: makeLogId(),
      machineName: machine.name,
      normalMinutes: computedNormalMinutes,
      createdAt: new Date().toISOString(),
      source: remoteEnabled ? "google-sheet" : "local",
    };

    setSaving(true);
    try {
      const saved = remoteEnabled ? await appendRemoteLog(log) : log;
      const next = appendLocalLog(saved);
      setLocalLogs(next);
      setStatus(remoteEnabled ? "บันทึกลง Google Sheet แล้ว" : "บันทึกในเครื่องแล้ว");
      resetDraft();
    } catch (error) {
      const next = appendLocalLog({ ...log, source: "local" });
      setLocalLogs(next);
      setStatus(error instanceof Error ? `${error.message} - เก็บสำรองในเครื่องแล้ว` : "เก็บสำรองในเครื่องแล้ว");
    } finally {
      setSaving(false);
    }
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
          <button className={tab === "entry" ? "active" : ""} onClick={() => setTab("entry")} type="button">
            <ClipboardList size={18} /> กรอกยอด
          </button>
          {canAccessTab(session, "dashboard") && (
            <button className={tab === "dashboard" ? "active" : ""} onClick={() => setTab("dashboard")} type="button">
              <BarChart3 size={18} /> Dashboard
            </button>
          )}
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
            <button className="ghost-button" onClick={() => exportLogsCsv(visibleLogs)} type="button">
              <Download size={17} /> CSV
            </button>
            <button className="ghost-button" onClick={signOut} type="button">
              <LogOut size={17} /> Logout
            </button>
          </div>
        </header>

        {tab === "entry" && (
          <section className="entry-layout">
            <form className="entry-form" onSubmit={submit}>
              <div className="section-title">
                <Gauge size={20} />
                <h2>กรอกยอดผลิต</h2>
              </div>

              <div className="form-grid">
                <label>
                  วันที่
                  <input value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} type="date" />
                </label>
                <label>
                  กะ
                  <select value={draft.shift} onChange={(event) => setDraft({ ...draft, shift: event.target.value })}>
                    {orderedShiftOptions.map((shift) => (
                      <option key={shift} value={shift}>
                        {shiftLabel(shift)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  เครื่อง / ไลน์
                  <select value={draft.machineId} onChange={(event) => selectMachine(event.target.value)}>
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
                  รุ่น
                  <input
                    list="product-name-options"
                    onChange={(event) => updateProductField("productName", event.target.value)}
                    type="text"
                    value={draft.productName}
                  />
                </label>
                <label>
                  Part No.
                  <input
                    list="part-no-options"
                    onChange={(event) => updateProductField("partNo", event.target.value)}
                    type="text"
                    value={draft.partNo}
                  />
                </label>
                <label>
                  Step
                  <input
                    list="step-options"
                    onChange={(event) => updateProductField("step", event.target.value)}
                    placeholder="-"
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

              <div className="runtime-panel">
                <label className="runtime-input-block">
                  <span>เวลาตามกะ</span>
                  <div className="runtime-input-row">
                    <input
                      min="0"
                      onChange={(event) => updateWorkMinutes(event.target.value)}
                      type="number"
                      value={draft.workMinutes}
                    />
                    <b>นาที</b>
                  </div>
                </label>
                <label className="runtime-input-block">
                  <span>จำนวนช่องเวลา</span>
                  <div className="runtime-input-row">
                    <input
                      min="0"
                      onChange={(event) => updateTimeSlots(event.target.value)}
                      step="0.01"
                      type="number"
                      value={draft.timeSlots}
                    />
                    <b>ช่อง</b>
                  </div>
                </label>
                <label className="runtime-input-block">
                  <span>นาที/ช่อง</span>
                  <div className="runtime-input-row">
                    <input
                      min="0"
                      onChange={(event) => updateMinutesPerSlot(event.target.value)}
                      step="0.01"
                      type="number"
                      value={draft.minutesPerSlot}
                    />
                    <b>นาที</b>
                  </div>
                </label>
                <label className="runtime-input-block">
                  <span>ความเร็วเครื่องจักร</span>
                  <div className="runtime-input-row">
                    <input
                      min="0"
                      onChange={(event) => handleNumber("machineSpeed", event.target.value)}
                      step="0.01"
                      type="number"
                      value={draft.machineSpeed}
                    />
                    <b>ชิ้น/นาที</b>
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
                  Good quantity
                  <input value={draft.goodQty} onChange={(event) => handleNumber("goodQty", event.target.value)} min="0" type="number" />
                </label>
                <label>
                  NG quantity
                  <input value={draft.ngQty} onChange={(event) => handleNumber("ngQty", event.target.value)} min="0" type="number" />
                </label>
                <label>
                  Test
                  <input value={draft.testQty} onChange={(event) => handleNumber("testQty", event.target.value)} min="0" type="number" />
                </label>
              </div>

              <div className="section-title compact">
                <History size={19} />
                <h2>เวลาหยุด</h2>
              </div>
              <div className="downtime-grid">
                {downtimeFields.map((field) => (
                  <label key={field.key}>
                    {field.label}
                    <input
                      value={draft[field.key]}
                      onChange={(event) => handleNumber(field.key, event.target.value)}
                      min="0"
                      type="number"
                    />
                  </label>
                ))}
              </div>

              <label>
                หมายเหตุ
                <textarea value={draft.note} onChange={(event) => setDraft({ ...draft, note: event.target.value })} rows={3} />
              </label>

              <div className="form-actions">
                <button className="primary-button" disabled={saving} type="submit">
                  <Save size={18} /> {saving ? "กำลังบันทึก" : "บันทึกยอด"}
                </button>
                <button className="ghost-button" onClick={resetDraft} type="button">
                  ล้างฟอร์ม
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
                {localLogs.slice(0, 6).map((log) => (
                  <div className="recent-item" key={log.id}>
                    <b>{log.machineName}</b>
                    <span>
                      {log.date} · {log.productName} · Good {formatNumber(log.goodQty)} · Speed {formatRate(log.machineSpeed ?? 0)}
                    </span>
                  </div>
                ))}
                {localLogs.length === 0 && <p className="empty-text">ยังไม่มีรายการทดลองในเครื่อง</p>}
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
              <Kpi label="Logs" value={formatNumber(visibleLogs.length)} tone="neutral" />
            </div>
            <FiltersBar filters={filters} setFilters={setFilters} />
            <PartNoSummary logs={visibleLogs} />
            <OeeSummaryChart summary={summary} />
            <div className="analytics-grid">
              <DowntimeChart items={downtime} />
              <MachineRanking logs={visibleLogs} />
            </div>
            <Trend logs={visibleLogs} />
          </section>
        )}

        {tab === "history" && (
          <section className="table-view">
            <FiltersBar filters={filters} setFilters={setFilters} />
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
            <LogsTable logs={searchedHistory} />
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
  const [users, setUsers] = useState<AppUserSummary[]>(() => listUsers());
  const [form, setForm] = useState(emptyUserForm);
  const [passwordForm, setPasswordForm] = useState(() => createEmptyPasswordForm(currentUsername));
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [savingUser, setSavingUser] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

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

  const removeUser = (username: string) => {
    setMessage("");
    setError("");
    try {
      setUsers(deleteUser(username));
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
            Username
            <input
              autoComplete="off"
              onChange={(event) => setForm({ ...form, username: event.target.value })}
              placeholder="เช่น operator01"
              type="text"
              value={form.username}
            />
          </label>
          <label>
            ชื่อแสดงผล
            <input
              autoComplete="off"
              onChange={(event) => setForm({ ...form, displayName: event.target.value })}
              placeholder="เช่น Line A"
              type="text"
              value={form.displayName}
            />
          </label>
          <label>
            Role
            <select
              onChange={(event) => setForm({ ...form, role: event.target.value as AppRole })}
              value={form.role}
            >
              <option value="production">Production</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <label>
            Password
            <input
              autoComplete="new-password"
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder="อย่างน้อย 6 ตัว"
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
            บัญชี
            <select
              onChange={(event) => setPasswordForm(createEmptyPasswordForm(event.target.value))}
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
            รหัสผ่านใหม่
            <input
              autoComplete="new-password"
              onChange={(event) => setPasswordForm({ ...passwordForm, password: event.target.value })}
              placeholder="อย่างน้อย 6 ตัว"
              type="password"
              value={passwordForm.password}
            />
          </label>
          <label>
            ยืนยันรหัสผ่าน
            <input
              autoComplete="new-password"
              onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })}
              placeholder="พิมพ์ซ้ำอีกครั้ง"
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
          Username
          <input
            autoComplete="username"
            autoFocus
            onChange={(event) => setUsername(event.target.value)}
            placeholder="admin หรือ production"
            type="text"
            value={username}
          />
        </label>
        <label>
          Password
          <input
            autoComplete="current-password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="รหัสผ่าน"
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

function MachineRanking({ logs }: { logs: ProductionLog[] }) {
  const rows = machines
    .map((machine) => {
      const machineLogs = logs.filter((log) => log.machineId === machine.id);
      const summary = summarize(machineLogs);
      return { machine, ...summary, count: machineLogs.length };
    })
    .filter((row) => row.count > 0)
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
  const points = [...logs]
    .reduce<Array<{ date: string; good: number }>>((acc, log) => {
      const current = acc.find((item) => item.date === log.date);
      if (current) current.good += log.goodQty;
      else acc.push({ date: log.date, good: log.goodQty });
      return acc;
    }, [])
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

function LogsTable({ logs }: { logs: ProductionLog[] }) {
  return (
    <div className="data-table-wrap">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Shift</th>
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
              <td>{log.date}</td>
              <td>{shiftLabel(log.shift)}</td>
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
