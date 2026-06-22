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
  TableProperties,
  Trash2,
  UserPlus,
  UserRound,
  Wifi,
  WifiOff,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { machines, products, seedLogs, shiftOptions } from "./data/oeeMasterData.generated";
import { oeeWorkbookHeadings } from "./data/oeeWorkbookHeadings.generated";
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

const today = new Date().toISOString().slice(0, 10);
const defaultMachine = machines[0];
const defaultProduct = products.find((product) => product.machineId === defaultMachine.id) ?? products[0];
const orderedShiftOptions = Array.from(new Set(["白", "夜", ...shiftOptions]));
const brandLogoSrc = `${import.meta.env.BASE_URL}jr-logo.png`;

function createEmptyDraft(machine: Machine, product: ProductMaster): EntryDraft {
  return {
    date: today,
    shift: orderedShiftOptions[0] ?? "白",
    machineId: machine.id,
    productName: product.productName,
    partNo: product.partNo,
    step: product.step,
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
  const computedNormalMinutes = Math.max(currentMachine.capacityMinutes - totalDraftDowntime, 0);

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
    }));
  };

  const selectProduct = (productId: string) => {
    const product = products.find((item) => item.id === productId);
    if (!product) return;
    setDraft((prev) => ({
      ...prev,
      productName: product.productName,
      partNo: product.partNo,
      step: product.step,
    }));
  };

  const handleNumber = (key: keyof EntryDraft, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: Math.max(Number(value) || 0, 0) }));
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
                <label className="wide-field">
                  รุ่น / Part No. / Step
                  <select
                    value={
                      products.find(
                        (product) =>
                          product.machineId === draft.machineId &&
                          product.productName === draft.productName &&
                          product.partNo === draft.partNo &&
                          product.step === draft.step,
                      )?.id ?? ""
                    }
                    onChange={(event) => selectProduct(event.target.value)}
                  >
                    {filteredProducts.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.productName} | {product.partNo || "-"} | Step {product.step || "-"}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="runtime-panel">
                <div>
                  <span>เวลาตามกะ</span>
                  <strong>{formatNumber(currentMachine.capacityMinutes)} นาที</strong>
                </div>
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
                      {log.date} · {log.productName} · Good {formatNumber(log.goodQty)}
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
            <FiltersBar filters={filters} setFilters={setFilters} />
            <div className="kpi-grid">
              <Kpi label="Good" value={formatNumber(summary.good)} tone="green" />
              <Kpi label="NG" value={formatNumber(summary.ng)} tone="red" />
              <Kpi label="Quality" value={formatPercent(summary.quality)} tone="blue" />
              <Kpi label="Availability" value={formatPercent(summary.availability)} tone="amber" />
              <Kpi label="Downtime" value={`${formatNumber(summary.downtime)} นาที`} tone="red" />
              <Kpi label="Logs" value={formatNumber(visibleLogs.length)} tone="neutral" />
            </div>
            <div className="analytics-grid">
              <DowntimeChart items={downtime} />
              <MachineRanking logs={visibleLogs} />
            </div>
            <Trend logs={visibleLogs} />
            <OeeHeadingsPanel />
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

function OeeHeadingsPanel() {
  return (
    <div className="analysis-panel oee-headings-panel">
      <div className="headings-panel-header">
        <div>
          <p className="eyebrow">OEE workbook structure</p>
          <h2>หัวข้อทั้งหมดจากไฟล์ {oeeWorkbookHeadings.sourceFile}</h2>
        </div>
        <div className="headings-summary">
          <span>{formatNumber(oeeWorkbookHeadings.sheetCount)} sheets</span>
          <span>{formatNumber(oeeWorkbookHeadings.uniqueHeadingCount)} headings</span>
          <span>{oeeWorkbookHeadings.timeCodes.join(" / ")}</span>
        </div>
      </div>

      <div className="heading-chip-grid">
        {oeeWorkbookHeadings.uniqueHeadings.map((heading) => (
          <span className="heading-chip" key={heading}>
            {heading}
          </span>
        ))}
      </div>

      <div className="sheet-heading-list">
        {oeeWorkbookHeadings.sheets.map((sheet) => (
          <details className="sheet-heading-item" key={sheet.sheetName}>
            <summary>
              <strong>{sheet.sheetName}</strong>
              <span>{formatNumber(sheet.rowCount)} rows</span>
              <span>{formatNumber(sheet.columnCount)} columns</span>
              {sheet.hasStep && <em>Step</em>}
            </summary>
            <div className="sheet-heading-body">
              {sheet.headings.map((heading, index) => (
                <span className="heading-chip compact" key={`${sheet.sheetName}-${heading}-${index}`}>
                  {heading}
                </span>
              ))}
            </div>
          </details>
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
