import { useMemo, useState } from "react";
import registry from "../data/equipmentRegistry.json";
import type { Machine } from "../types";
import "./equipment-registry.css";

const statusLabel = (value: string) => value === "USE" ? "ใช้งาน (ตามทะเบียน)" : value === "CANCEL" ? "ยกเลิก (Cancel)" : "รอยืนยันสถานะ";
export function EquipmentRegistry({ machines }: { machines: Machine[] }) {
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("");
  const [status, setStatus] = useState("");
  const [issuesOnly, setIssuesOnly] = useState(false);
  const rows = useMemo(() => registry.records.filter(row => (!group || row.group === group) && (!status || row.status === status) && (!issuesOnly || row.issues.length > 0) && [row.equipmentNumber, row.factoryNumber, row.name, row.model, row.serial, row.manufacturer, row.group].join(" ").toLowerCase().includes(search.toLowerCase())), [search, group, status, issuesOnly]);
  const exportCsv = () => {
    const escape = (v: unknown) => `"${String(v ?? "").replace(/^[=+@-]/, "'$&").replaceAll('"', '""')}"`;
    const data = [["หมวด", "รหัสทะเบียน", "หมายเลขอุปกรณ์", "Factory Number", "ชื่อ", "ผู้ผลิต", "รุ่น", "Serial", "ผลิตเมื่อ (ต้นฉบับ)", "เข้าโรงงาน (ต้นฉบับ)", "สถานะ", "อุปกรณ์สำคัญ", "ตรวจสอบ", "ชีต", "แถว"], ...rows.map(r => [r.group, r.id, r.equipmentNumber, r.factoryNumber, r.name, r.manufacturer, r.model, r.serial, r.manufactured, r.entryDate, r.status, r.keyEquipment ? "ใช่" : "", r.issues.join("; "), r.sourceSheet, r.sourceRow])].map(r => r.map(escape).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\ufeff", data], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "JRTL-equipment-registry.csv"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <section className="equipment-registry">
    <div className="equipment-heading"><div><h2>ทะเบียนเครื่องจักรและอุปกรณ์</h2><p>นำเข้าจาก {registry.sourceName} • {registry.importedAt}</p></div><button type="button" className="ghost-button" onClick={exportCsv}>ส่งออกทะเบียน CSV</button></div>
    <div className="equipment-counts"><div><b>{registry.records.length}</b><span>รายการต้นทาง / 16 หมวด</span></div><div><b>{registry.records.filter(r => r.status === "USE").length}</b><span>ระบุ USE</span></div><div><b>{registry.records.filter(r => r.status === "CANCEL").length}</b><span>ระบุ Cancel</span></div><div><b>{registry.records.filter(r => r.status === "UNSPECIFIED").length}</b><span>ไม่ระบุสถานะ</span></div></div>
    <p className="equipment-note">สถานะเป็นข้อมูลจากไฟล์ ไม่ใช่สถานะเดินเครื่องปัจจุบัน มี 6 แถวที่ระบุเฉพาะชื่อและยังต้องยืนยันว่าเป็นเครื่องจริง วันที่คงความละเอียดตามต้นฉบับ ทะเบียนนี้ไม่เปลี่ยนรหัสหรือประวัติการผลิต OEE</p>
    <div className="equipment-filters"><label>ค้นหาเครื่อง / รุ่น / Serial<input type="search" value={search} onChange={e => setSearch(e.target.value)} /></label><label>หมวด<select value={group} onChange={e => setGroup(e.target.value)}><option value="">ทุกหมวด</option>{[...new Set(registry.records.map(r => r.group))].map(g => <option key={g}>{g}</option>)}</select></label><label>สถานะ<select value={status} onChange={e => setStatus(e.target.value)}><option value="">ทุกสถานะ</option>{["USE", "CANCEL", "UNSPECIFIED"].map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}</select></label><label className="equipment-check"><input type="checkbox" checked={issuesOnly} onChange={e => setIssuesOnly(e.target.checked)} />เฉพาะรายการที่ต้องตรวจสอบ</label></div>
    <p>แสดง {rows.length} / {registry.records.length} รายการ • เปิดรายละเอียดเพื่อดูข้อมูลต้นทาง</p>
    <div className="equipment-cards">{rows.map(row => <details key={row.id} className="equipment-card"><summary><div><strong>{row.equipmentNumber || row.factoryNumber || "ยังไม่มีรหัส"}</strong><span className={`equipment-status ${row.status.toLowerCase()}`}>{statusLabel(row.status)}</span></div><b>{row.name}</b><span>{row.group} · {row.model || "ไม่ระบุรุ่น"}</span>{row.keyEquipment && <span>▲ อุปกรณ์สำคัญตามต้นฉบับ</span>}{row.issues.length > 0 && <span className="equipment-issue">ต้องตรวจสอบ {row.issues.length} ประเด็น</span>}</summary><dl>{[["รหัสรายการในทะเบียน",row.id],["หมายเลขอุปกรณ์ต้นฉบับ",row.equipmentNumberRaw],["Factory Number",row.factoryNumber],["ผู้ผลิต / Factory ในไฟล์",row.manufacturer],["รุ่น",row.model],["Serial No.",row.serial],["ผลิตเมื่อ (ต้นฉบับ)",row.manufactured],["เข้าโรงงาน (ต้นฉบับ)",row.entryDate],["โรงงาน",row.location],["หมายเหตุ",row.remark],["แหล่งข้อมูล",`${row.sourceSheet} • แถว ${row.sourceRow}`]].map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value || "ไม่ระบุ"}</dd></div>)}</dl>{row.issues.length > 0 && <ul className="equipment-issue">{row.issues.map(issue => <li key={issue}>{issue}</li>)}</ul>}</details>)}</div>
    {!rows.length && <p>ไม่พบรายการตามตัวกรอง</p>}
    <details className="equipment-oee"><summary>เทียบกับรายการเครื่องใน OEE ({machines.length} เครื่อง)</summary><p>รหัสในไฟล์ เช่น Y1 และ C1 อาจใช้ชื่อคนละรูปแบบกับ OEE รายการต่อไปนี้ใช้สำหรับตรวจเทียบ ยังไม่ได้ผูกข้อมูลหรือรวมประวัติโดยอัตโนมัติ</p><div>{machines.map(m => <span key={m.id}>{m.name} <small>({m.id})</small></span>)}</div></details>
  </section>;
}
