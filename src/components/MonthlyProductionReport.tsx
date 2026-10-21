import { useState } from 'react';
import type { ProductionLog } from '../types';
import { monthlyToday, monthlySummary, monthlyTrend } from '../lib/monthlyReport';

type Action = { id:string; month:string; date:string; machine:string; topic:string; problem:string; correction:string; owner:string; due:string; status:string; before:string; after:string; unit:string; result:string; beforePhoto:string; afterPhoto:string; evidence:string };
const ACTION_KEY = 'jrtl_monthly_improvement_actions_v1';
const number = (n:number) => new Intl.NumberFormat('th-TH',{maximumFractionDigits:1}).format(n);
const percent = (n:number|null) => n === null ? '—' : number(n*100)+'%';
const safeLink = (value:string) => /^https?:\/\//i.test(value) ? value : undefined;
function downloadReport(name:string, text:string, type:string) {
  const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function csvCell(value:unknown) { return '"'+String(value??'').replace(/^[=+@-]/,"'$&").replaceAll('"','""')+'"'; }

export function MonthlyProductionReport({logs}:{logs:ProductionLog[]}) {
  const today=monthlyToday();
  const [month,setMonth]=useState(today.slice(0,7));
  const [machine,setMachine]=useState('');
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [actions,setActions]=useState<Action[]>(()=>{try{const rows=JSON.parse(localStorage.getItem(ACTION_KEY)||'[]');return Array.isArray(rows)?rows.filter(a=>a&&typeof a.id==='string'&&typeof a.month==='string'):[];}catch{return [];}});
  const [draft,setDraft]=useState<Action|null>(null);
  const machines=Array.from(new Set(logs.map(l=>l.machineName).filter(Boolean))).sort();
  const summary=monthlySummary(logs,month,machine,today);
  const trend=monthlyTrend(logs,month,machine,today);
  const visible=actions.filter(a=>a.month===month&&(!machine||a.machine===machine));
  const losses=summary.losses.filter(l=>l.minutes>0);
  const maxLoss=Math.max(1,...losses.map(l=>l.minutes));
  const newAction=()=>setDraft({id:crypto.randomUUID(),month,date:today,machine,topic:'Inspection',problem:'',correction:'',owner:'',due:'',status:'รอดำเนินการ',before:'',after:'',unit:'นาที',result:'',beforePhoto:'',afterPhoto:'',evidence:''});
  const save=(event:React.FormEvent)=>{
    event.preventDefault();if(!draft)return;
    const next=[...actions.filter(a=>a.id!==draft.id),draft];
    try {localStorage.setItem(ACTION_KEY,JSON.stringify(next));setActions(next);setDraft(null);setError('');setNotice('บันทึกรายการปรับปรุงแล้ว / Saved in this browser');}catch{setError('บันทึกไม่สำเร็จ พื้นที่จัดเก็บอาจเต็ม กรุณาดาวน์โหลดข้อมูลสำรอง');}
  };
  const exportCSV=()=>{
    const rows:unknown[][]=[['รายงานประจำเดือน',month,'เครื่องจักร',machine||'ทุกเครื่อง'],['OEE',summary.oee===null?'':summary.oee*100,'Output',summary.total,'Run minutes',summary.run,'Downtime minutes',summary.downtime],[],['ประเภทเวลาสูญเสีย','นาที'],...losses.map(l=>[l.label,l.minutes]),[],['เดือน','OEE %','Output'],...trend.map(t=>[t.month,t.oee===null?'':t.oee*100,t.total]),[],['วันที่','เครื่องจักร','หัวข้อ','ปัญหา','การแก้ไข','ผู้รับผิดชอบ','กำหนดเสร็จ','สถานะ','ก่อน','หลัง','หน่วย','ผลลัพธ์','รูปก่อน','รูปหลัง','เอกสาร'],...visible.map(a=>[a.date,a.machine,a.topic,a.problem,a.correction,a.owner,a.due,a.status,a.before,a.after,a.unit,a.result,a.beforePhoto,a.afterPhoto,a.evidence])];
    downloadReport(`monthly-production-${month}.csv`,'\ufeff'+rows.map(r=>r.map(csvCell).join(',')).join('\r\n'),'text/csv;charset=utf-8');
  };
  const print=()=>{document.body.classList.add('monthly-report-print');const cleanup=()=>document.body.classList.remove('monthly-report-print');window.addEventListener('afterprint',cleanup,{once:true});window.print();cleanup();};
  return <section className="monthly-report" aria-label="รายงานประจำเดือน / Monthly Production Report">
    <header><div><small>JRTL · PRODUCTION MANAGEMENT</small><h2>รายงานประจำเดือน / Monthly Production Report</h2><p>สรุปผลผลิต วิเคราะห์เวลาสูญเสีย และติดตามการปรับปรุง</p></div><div className="mr-controls"><label>เดือน / Month<input type="month" value={month} onChange={e=>{if(/^\d{4}-\d{2}$/.test(e.target.value))setMonth(e.target.value);}}/></label><label>เครื่องจักร / Machine<select value={machine} onChange={e=>setMachine(e.target.value)}><option value="">ทุกเครื่อง / All</option>{machines.map(m=><option key={m}>{m}</option>)}</select></label><button type="button" onClick={exportCSV}>ดาวน์โหลด CSV</button><button type="button" onClick={print}>พิมพ์ / PDF</button></div></header>
    <p className="mr-scope">เดือน {month} · {machine||'ทุกเครื่อง'} · {summary.rows.length} รายการ · {month===today.slice(0,7)?`ข้อมูลเดือนปัจจุบันถึง ${today} (ยังไม่ครบเดือน)`:'ข้อมูลตามเดือนที่เลือก'} · เลือกเดือนแยกจากตัวกรองรายสัปดาห์ด้านล่าง</p>
    <div className="mr-kpis">{[['Overall OEE',percent(summary.oee)],['ผลผลิตรวม / Total Output',number(summary.total)],['เดินเครื่อง / Run Time',number(summary.run)+' นาที'],['เวลาหยุด / Downtime',number(summary.downtime)+' นาที']].map(([label,value])=><div key={label}><small>{label}</small><strong>{value}</strong></div>)}</div>
    {!summary.rows.length&&<p role="status">ยังไม่มีข้อมูลการผลิตในเดือนและเครื่องจักรที่เลือก</p>}
    <section className="mr-actions"><div className="mr-section-title"><h3>รายการปรับปรุงและแก้ไข / Improvement Actions</h3><button type="button" onClick={newAction}>+ เพิ่มรายการปรับปรุง</button></div><p>บันทึกในเบราว์เซอร์เครื่องนี้ · ดาวน์โหลดสำรองเพื่อเก็บหรือส่งต่อข้อมูล</p>
      {error&&<p role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}
      {draft&&<form onSubmit={save} className="mr-form"><h4>{actions.some(a=>a.id===draft.id)?'แก้ไขรายการ':'เพิ่มรายการ'}</h4><div className="mr-fields">{([['month','เดือน','month'],['date','วันที่ปรับปรุง','date'],['machine','เครื่องจักร','text'],['topic','หัวข้อ / Topic','text'],['owner','ผู้รับผิดชอบ','text'],['due','กำหนดเสร็จ','date'],['before','ค่าก่อนปรับปรุง','number'],['after','ค่าหลังปรับปรุง','number'],['unit','หน่วย เช่น นาที, ครั้ง, %, PPM','text'],['beforePhoto','ลิงก์รูปก่อนปรับปรุง','url'],['afterPhoto','ลิงก์รูปหลังปรับปรุง','url'],['evidence','ลิงก์เอกสารหลักฐาน','url']] as const).map(([key,label,type])=><label key={key}>{label}<input type={type} step={type==='number'?'any':undefined} required={['month','date','topic','owner'].includes(key)} value={draft[key]} onChange={e=>setDraft({...draft,[key]:e.target.value})}/></label>)}<label>สถานะ<select value={draft.status} onChange={e=>setDraft({...draft,status:e.target.value})}>{['รอดำเนินการ','กำลังดำเนินการ','เสร็จสิ้น','ติดตามผล'].map(s=><option key={s}>{s}</option>)}</select></label></div>{([['problem','ปัญหาที่พบ'],['correction','การปรับปรุงและแก้ไข'],['result','ผลลัพธ์ / หลักฐานผลการปรับปรุง']] as const).map(([key,label])=><label key={key}>{label}<textarea required={key!=='result'||draft.status==='เสร็จสิ้น'} value={draft[key]} onChange={e=>setDraft({...draft,[key]:e.target.value})}/></label>)}<button type="submit">บันทึก / Save</button> <button type="button" onClick={()=>setDraft(null)}>ยกเลิก / Cancel</button></form>}
      <div className="mr-table"><table><thead><tr>{['วันที่ / เครื่อง','หัวข้อ / ปัญหา','การแก้ไข','ผู้รับผิดชอบ / กำหนด','ก่อน → หลัง','ผลลัพธ์ / หลักฐาน','สถานะ','จัดการ'].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{visible.map(a=><tr key={a.id}><td>{a.date}<br/>{a.machine||'ทุกเครื่อง'}</td><td><b>{a.topic}</b><br/>{a.problem}</td><td>{a.correction}</td><td>{a.owner}<br/>{a.due||'—'}</td><td>{a.before||'—'} → {a.after||'—'} {a.unit}</td><td>{a.result||'รอผลการปรับปรุง'}<div>{([['รูปก่อน',a.beforePhoto],['รูปหลัง',a.afterPhoto],['เอกสาร',a.evidence]] as const).filter(([,url])=>safeLink(url)).map(([name,url])=><a key={name} href={url} target="_blank" rel="noreferrer">{name} ↗ </a>)}</div></td><td>{a.status}</td><td><button type="button" onClick={()=>setDraft({...a})}>แก้ไข</button></td></tr>)}{!visible.length&&<tr><td colSpan={8}>ยังไม่มีรายการปรับปรุงของเดือนนี้ — กด “เพิ่มรายการปรับปรุง” เพื่อบันทึกข้อมูลจริง</td></tr>}</tbody></table></div><button type="button" className="mr-backup" onClick={()=>downloadReport('improvement-actions.json',JSON.stringify({version:1,actions},null,2),'application/json')}>ดาวน์โหลดสำรองรายการปรับปรุงทั้งหมด JSON</button>
    </section>
    <section className="mr-problems"><h3>สรุปปัญหาประจำเดือน / Monthly Problem Summary</h3><p>แยกกราฟตามประเภทปัญหา · เปรียบเทียบ 6 เดือนถึง {month} · หน่วย: นาที · {machine||'ทุกเครื่อง'} · ไม่มีบันทึกแสดง “—”</p><div className="mr-charts">{summary.losses.map(problem=>{const values=trend.map(t=>({month:t.month,minutes:t.losses.find(l=>l.key===problem.key)?.minutes||0,hasData:t.rows.length>0}));const maximum=Math.max(1,...values.map(v=>v.minutes));return <section key={problem.key}><h4>{problem.label}</h4><p>เดือนที่เลือก: {summary.rows.length?number(problem.minutes)+' นาที':'—'} · สัดส่วนเวลาหยุด {summary.downtime>0?percent(problem.minutes/summary.downtime):'—'}</p><div className="mr-trend" role="img" aria-label={problem.label+' เวลาหยุดรายเดือน (นาที)'}>{values.map(v=><div key={v.month}><strong>{v.hasData?number(v.minutes):'—'}</strong><div><i style={{height:(v.minutes/maximum*100)+'%'}}/></div><span>{v.month}</span></div>)}</div></section>})}</div></section>
    <div className="mr-charts"><section><h3>วิเคราะห์ปัญหาการผลิต / Production Loss Analysis</h3><p>เวลาหยุดแยกประเภท (นาที)</p>{losses.map(loss=><div className="mr-bar" key={loss.key}><span>{loss.label}</span><div><i style={{width:`${loss.minutes/maxLoss*100}%`}}/></div><b>{number(loss.minutes)}</b></div>)}{!losses.length&&<p>ไม่มีเวลาหยุดที่บันทึกไว้ในช่วงนี้</p>}</section><section><h3>แนวโน้ม OEE ย้อนหลัง 6 เดือน / Monthly KPI Trend</h3><p>OEE = ความพร้อมเดินเครื่อง × คุณภาพ ตามสูตรเดิมของ Dashboard</p><div className="mr-trend" role="img" aria-label="OEE รายเดือนจากข้อมูลจริง">{trend.map(t=><div key={t.month}><strong>{percent(t.oee)}</strong><div><i style={{height:`${Math.max(0,Math.min(100,(t.oee||0)*100))}%`}}/></div><span>{t.month}</span></div>)}</div><p>“—” หมายถึงไม่มีข้อมูลเพียงพอ · เดือนปัจจุบันยังไม่ครบเดือน</p></section></div>
  </section>;
}
