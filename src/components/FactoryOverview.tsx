import { useMemo, useState } from "react";
import type { Machine, ProductionLog } from "../types";
import { formatNumber as number, formatPercent as percent, groupDowntime, summarize, totalDowntime } from "../lib/metrics";
import "./factory-overview.css";

export function recordedMinutes(log: ProductionLog) {
  const explicit = Number(log.workMinutes);
  return Number.isFinite(explicit) && explicit > 0 ? explicit : Number(log.normalMinutes || 0) + totalDowntime(log);
}

export function FactoryOverview({ logs, machines, onSelect }: { logs: ProductionLog[]; machines: Machine[]; onSelect: (id: string) => void }) {
  const [search, setSearch] = useState("");
  const [view, setView] = useState("all");
  const data = useMemo(() => {
    const summary = summarize(logs);
    const grouped = new Map<string, ProductionLog[]>();
    const days = new Map<string, number>();
    const ids = new Set<string>();
    let duplicateIds = 0;
    let invalidTime = 0;
    for (const log of logs) {
      grouped.set(log.machineId, [...(grouped.get(log.machineId) || []), log]);
      days.set(log.date, (days.get(log.date) || 0) + Number(log.goodQty || 0));
      if (ids.has(log.id)) duplicateIds++;
      ids.add(log.id);
      if (Number(log.normalMinutes) > recordedMinutes(log) || (recordedMinutes(log) === 0 && Number(log.goodQty) > 0)) invalidTime++;
    }
    const known = new Map(machines.map(machine => [machine.id, machine.name]));
    for (const log of logs) if (!known.has(log.machineId)) known.set(log.machineId, log.machineName);
    const rows = [...known].map(([id, name]) => {
      const entries = grouped.get(id) || [];
      return { id, name, entries: entries.length, ...summarize(entries), minutes: entries.reduce((sum, log) => sum + recordedMinutes(log), 0) };
    }).sort((a, b) => b.downtime - a.downtime || a.name.localeCompare(b.name));
    return { summary, rows, duplicateIds, invalidTime, recorded: logs.reduce((sum, log) => sum + recordedMinutes(log), 0), days: [...days].sort(([a], [b]) => a.localeCompare(b)), losses: groupDowntime(logs).filter(item => item.minutes > 0), covered: grouped.size };
  }, [logs, machines]);
  const visible = data.rows.filter(row => row.name.toLowerCase().includes(search.toLowerCase()) && (view === "all" || (view === "loss" ? row.downtime > 0 : row.entries === 0)));
  const maxDay = Math.max(1, ...data.days.map(([, value]) => value));
  const csv = () => {
    const quote = (value: unknown) => `"${String(value).replace(/^[=+@-]/, "'$&").replaceAll('"', '""')}"`;
    const content = [["Machine", "Logs", "Good", "NG", "Test", "Recorded minutes", "Downtime minutes"], ...visible.map(row => [row.name, row.entries, row.good, row.ng, row.test, row.minutes, row.downtime])].map(row => row.map(quote).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\ufeff", content], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "production-overview.csv"; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <div className="factory-overview">
    <header className="fo-hero"><div><span className="fo-eyebrow">PRODUCTION INTELLIGENCE</span><h1>ภาพรวมการผลิต</h1><p>ข้อมูลสำหรับการประชุมและติดตามประสิทธิภาพโรงงาน</p></div><div className="fo-period"><b>{data.days.length ? `${data.days[0][0]} → ${data.days[data.days.length - 1][0]}` : "ยังไม่มีข้อมูลในช่วงนี้"}</b><span>วันที่มีรายการตามตัวกรอง • ไม่ใช่สถานะเครื่องแบบสด</span></div></header>
    <div className="fo-kpis">
      {[{ label: "ผลผลิตดี", value: number(data.summary.good), unit: "ชิ้น", detail: `ผลิตรวม ${number(data.summary.total)} ชิ้น รวมงานทดลอง` }, { label: "คุณภาพ", value: data.summary.good + data.summary.ng ? percent(data.summary.quality) : "—", unit: "", detail: `NG ${number(data.summary.ng)} ชิ้น • Good ÷ (Good + NG)` }, { label: "เวลาสูญเสีย", value: number(data.summary.downtime), unit: "นาที", detail: "รวมสาเหตุหยุดตามกติกาของระบบ" }, { label: "เครื่องที่มีข้อมูล", value: `${data.covered} / ${data.rows.length}`, unit: "เครื่อง", detail: `${number(logs.length)} รายการ • ตามขอบเขตที่เลือก` }].map(item => <article key={item.label}><span>{item.label}</span><strong>{item.value} <small>{item.unit}</small></strong><p>{item.detail}</p></article>)}
    </div>
    <div className="fo-panels"><section className="fo-panel"><div className="fo-heading"><div><span className="fo-eyebrow">DAILY OUTPUT</span><h2>แนวโน้มผลผลิตดี</h2></div><span>{data.days.length} วันที่มีข้อมูล</span></div><div className="fo-trend">{data.days.map(([date, good]) => <div className="fo-day" key={date}><span>{number(good)}</span><div><i style={{ height: `${good / maxDay * 100}%` }} /></div><time>{date.slice(5)}</time></div>)}{!logs.length && <p>ไม่มีรายการในช่วงที่เลือก</p>}</div></section>
    <section className="fo-panel"><div className="fo-heading"><div><span className="fo-eyebrow">LOSS PRIORITIES</span><h2>สาเหตุสูญเสียสูงสุด</h2></div><span>นาที / สัดส่วน</span></div>{data.losses.slice(0, 5).map(item => <div className="fo-loss" key={item.key}><div><span>{item.label}</span><b>{number(item.minutes)} <small>({percent(item.minutes / data.summary.downtime)})</small></b></div><div className="fo-track"><i style={{ width: `${item.minutes / data.summary.downtime * 100}%` }} /></div></div>)}{!data.losses.length && <p>ไม่มีเวลาสูญเสียที่บันทึกในช่วงนี้</p>}</section></div>
    <section className="fo-panel"><div className="fo-heading"><div><span className="fo-eyebrow">MACHINE REVIEW</span><h2>ติดตามรายเครื่อง</h2><p>เรียงตามเวลาสูญเสีย • แตะเครื่องเพื่อดูรายละเอียดตามตัวกรอง</p></div><button type="button" onClick={csv}>ส่งออก CSV</button></div><div className="fo-controls"><input aria-label="ค้นหาเครื่องจักร" placeholder="ค้นหาเครื่องจักร…" value={search} onChange={event => setSearch(event.target.value)} /><select aria-label="กรองข้อมูลเครื่อง" value={view} onChange={event => setView(event.target.value)}><option value="all">ทุกเครื่อง</option><option value="loss">มีเวลาสูญเสีย</option><option value="missing">ไม่มีรายการ</option></select></div><div className="fo-machine-grid">{visible.map(row => <button type="button" className="fo-machine" key={row.id} onClick={() => onSelect(row.id)}><div><b>{row.name}</b><span className={row.entries ? "fo-tag" : "fo-tag muted"}>{row.entries ? `${number(row.entries)} รายการ` : "ไม่มีข้อมูล"}</span></div><strong>{row.entries ? number(row.good) : "—"}<small> ชิ้นดี</small></strong><div className="fo-machine-details"><span>คุณภาพ <b>{row.good + row.ng ? percent(row.quality) : "—"}</b></span><span>สูญเสีย <b>{number(row.downtime)} นาที</b></span></div></button>)}</div>{!visible.length && <p>ไม่พบเครื่องตามเงื่อนไข</p>}</section>
    <details className="fo-method"><summary>ฐานการคำนวณและคุณภาพข้อมูล{data.duplicateIds + data.invalidTime > 0 ? ` • พบ ${data.duplicateIds + data.invalidTime} ประเด็นที่ควรตรวจสอบ` : ""}</summary><p>เวลาบันทึกรวม {number(data.recorded)} นาที: รวม workMinutes ของแต่ละรายการ หากไม่ระบุหรือเป็นศูนย์ ใช้เวลาผลิตปกติบวกเวลาหยุดตามกติกาเดิม ยังไม่ใช่เวลาตามแผน และรายการที่ช่วงเวลาซ้อนกันอาจถูกนับซ้ำ</p><p>ยังไม่แสดงอัตราใช้กำลังผลิตตามปฏิทิน เพราะต้องมีตารางกะและแผนหยุดของแต่ละเครื่องก่อน เครื่องที่ไม่มีรายการไม่ได้หมายความว่าหยุดทำงาน</p><p>รหัสรายการซ้ำ: {data.duplicateIds} • รายการเวลาผิดเงื่อนไข: {data.invalidTime} (เวลาผลิตมากกว่าเวลาบันทึก หรือมีผลผลิตดีแต่ไม่มีเวลา) • ไม่มีการลบหรือแก้ข้อมูลต้นทางอัตโนมัติ</p><p>เวลาสูญเสียใช้กติกาเดิม: รายการประชุมที่ไม่ได้ระบุว่ากรอกด้วยตนเองหักเวลาพัก 130 นาที ควรตรวจสอบกติกานี้กับรูปแบบข้อมูลโรงงาน</p></details>
  </div>;
}
