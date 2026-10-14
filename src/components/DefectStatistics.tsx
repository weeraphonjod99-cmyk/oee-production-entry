import {useMemo,useState} from 'react';
import type {ProductionLog} from '../types';
import {searchPartKey,searchProduction,type SearchFilters} from '../lib/productionSearch';
import {defectCsv,defectRate,defectStatistics,groupDefects,validDefectLog,type DefectGroup} from '../lib/defectStatistics';
import './defect-statistics.css';
const empty:SearchFilters={from:'',to:'',machine:'',part:'',shift:'',query:''};
const n=(v:number)=>v.toLocaleString('th-TH',{maximumFractionDigits:2});
const rate=(v:number|null)=>v===null?'—':n(v)+'%';
function Ranking({title,rows,total,onSelect}:{title:string;rows:DefectGroup[];total:number;onSelect:(key:string)=>void}){
 const ranked=rows.filter(r=>r.ng>0),max=ranked.reduce((highest,row)=>Math.max(highest,row.ng),1);
 return <section className="ds-panel" aria-label={title}><h3>{title}</h3><p>แสดงทั้งหมด {n(ranked.length)} กลุ่มตามตัวกรอง เรียงตามจำนวน NG / All {n(ranked.length)} matching groups, sorted by NG quantity</p>{!ranked.length?<p>ไม่พบงานเสีย / No defects recorded</p>:ranked.map((r,i)=><div className="ds-rank" key={r.key}><button type="button" onClick={()=>onSelect(r.key)}>{i+1}. {r.label}</button><span><b>{n(r.ng)} ชิ้น / pcs</b> · NG {rate(r.rate)} · สัดส่วน / Share {rate(total?r.ng/total*100:null)}</span><div className="ds-track"><i style={{width:`${r.ng/max*100}%`}}/></div></div>)}</section>;
}
export function DefectStatistics({logs,loading,error,onRefresh}:{logs:ProductionLog[];loading:boolean;error:string;onRefresh:()=>void}){
 const [filter,setFilter]=useState(empty),[page,setPage]=useState(0),[onlyNg,setOnlyNg]=useState(true);
 const change=(key:keyof SearchFilters,value:string)=>{setFilter(f=>({...f,[key]:value,...(key==='machine'?{part:''}:{})}));setPage(0);};
 const machines=useMemo(()=>[...new Map(logs.map(l=>[l.machineId,l.machineName])).entries()].sort((a,b)=>a[1].localeCompare(b[1])),[logs]);
 const parts=useMemo(()=>[...new Map(logs.filter(l=>!filter.machine||l.machineId===filter.machine).map(l=>[searchPartKey(l),`${l.partNo||l.productName} · ${l.productName} · Step ${l.step||'—'}`])).entries()].sort((a,b)=>a[1].localeCompare(b[1])),[logs,filter.machine]);
 const rows=useMemo(()=>searchProduction(logs,filter),[logs,filter]),stats=useMemo(()=>defectStatistics(rows),[rows]);
 const days=useMemo(()=>groupDefects(rows,'date'),[rows]),byMachine=useMemo(()=>groupDefects(rows,'machine'),[rows]),byPart=useMemo(()=>groupDefects(rows,'part'),[rows]);
 const details=rows.filter(l=>!onlyNg||Number(l.ngQty)>0||!validDefectLog(l)),pages=Math.max(1,Math.ceil(details.length/30)),current=Math.min(page,pages-1),max=Math.max(1,...days.map(d=>d.ng));
 const exportCsv=()=>{const url=URL.createObjectURL(new Blob([defectCsv(rows)],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='production-defects.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 return <section className="defect-statistics" aria-label="สถิติงานเสีย / Defect Statistics">
  <header className="ds-panel"><div><small>คุณภาพการผลิต / PRODUCTION QUALITY</small><h2>สถิติงานเสียของการผลิต / Production Defect Statistics</h2><p>วิเคราะห์ยอด NG จากประวัติการผลิตตามตัวกรอง / Analyze recorded NG quantities using the selected filters.</p></div><div className="ds-actions"><button onClick={onRefresh} disabled={loading}>{loading?'กำลังโหลด / Loading…':'โหลดข้อมูลล่าสุด / Refresh'}</button><button onClick={exportCsv} disabled={loading||!rows.length}>ส่งออกตามตัวกรอง / Export CSV</button></div></header>
  {error&&<p className="ds-warning" role="alert">{error} / Data may be incomplete.</p>}
  <div className="ds-panel ds-filters">
   <label>จากวันที่ / From Date<input type="date" value={filter.from} onChange={e=>change('from',e.target.value)}/></label>
   <label>ถึงวันที่ / To Date<input type="date" value={filter.to} onChange={e=>change('to',e.target.value)}/></label>
   <label>เครื่องจักร / Machine<select value={filter.machine} onChange={e=>change('machine',e.target.value)}><option value="">ทุกเครื่อง / All Machines</option>{machines.map(([id,name])=><option value={id} key={id}>{name}</option>)}</select></label>
   <label>ชิ้นงานและขั้นตอน / Part / Step<select value={filter.part} onChange={e=>change('part',e.target.value)}><option value="">ทุกชิ้นงาน / All Parts</option>{parts.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>
   <label>กะ / Shift<select value={filter.shift} onChange={e=>change('shift',e.target.value)}><option value="">ทุกกะ / All Shifts</option>{[...new Set(logs.map(l=>l.shift))].filter(Boolean).sort().map(s=><option key={s} value={s}>{s}</option>)}</select></label>
   <label>ค้นหา / Search<input type="search" placeholder="รหัสชิ้นงานหรือหมายเหตุ / Part or note" value={filter.query} onChange={e=>change('query',e.target.value)}/></label>
   <button onClick={()=>{setFilter(empty);setPage(0);}}>ล้างตัวกรอง / Clear Filters</button>
  </div>
  {filter.from&&filter.to&&filter.from>filter.to&&<p className="ds-warning" role="alert">วันเริ่มต้องไม่เกินวันสิ้นสุด / Start date must not be after end date.</p>}
  <p className="ds-method">อัตรางานเสีย = NG ÷ (Good + NG) × 100 • ไม่รวมงานทดลอง • คำนวณจากยอดรวม ไม่เฉลี่ยเปอร์เซ็นต์รายแถว / Weighted NG rate; test quantities excluded. ฐานเป็นศูนย์แสดง “—” / Zero denominator shows “—”.</p>
  <div className="ds-cards">{[['งานเสีย / NG (pcs)',n(stats.ng)],['อัตรางานเสีย / NG Rate',rate(stats.rate)],['งานดี + งานเสีย / Good + NG',n(stats.total)],['รายการที่มีงานเสีย / Records with NG',n(stats.affected)]].map(([label,value],i)=><article className={'ds-panel'+(i<2?' ds-danger':'')} key={label}><span>{label}</span><strong>{loading?'…':value}</strong></article>)}</div>
  <p>โหลดแล้ว / Loaded: {n(logs.length)} รายการ / records · ตรงตัวกรอง / Matching: {n(rows.length)} · ใช้คำนวณ / Included: {n(stats.valid.length)} · ประวัติจากชีตและรายการในระบบ / Sheet history and local records. ขีดจำกัดชีต / Sheet limit: 100,000 records.</p>
  {stats.invalid>0&&<p className="ds-warning" role="alert">ไม่นำ {n(stats.invalid)} รายการที่ Good หรือ NG ว่าง ติดลบ หรือไม่ใช่ตัวเลขมาคำนวณ โปรดตรวจข้อมูลต้นทาง / Records with missing, negative or invalid Good/NG quantities are excluded.</p>}
  {loading?<p className="ds-panel" role="status">กำลังโหลดประวัติการผลิต / Loading production history…</p>:!rows.length?<p className="ds-panel" role="status">ไม่พบข้อมูลตามตัวกรอง / No matching records.</p>:<>
   <section className="ds-panel"><h3>แนวโน้มงานเสียรายวัน / Daily Defect Trend</h3><p>แสดงเฉพาะวันที่มีบันทึก / Recorded dates only · {n(days.length)} วัน / days</p><div className="ds-trend">{days.map(d=><div className="ds-day" key={d.key}><span>{d.label}</span><div className="ds-track" role="img" aria-label={`${d.label}: NG ${n(d.ng)}, ${rate(d.rate)}`}><i style={{width:`${d.ng/max*100}%`}}/></div><b>{n(d.ng)} ชิ้น / pcs</b><span>NG {rate(d.rate)}</span></div>)}</div></section>
   <div className="ds-rank-grid"><Ranking title="เครื่องจักรที่มีงานเสีย / Defects by Machine" rows={byMachine} total={stats.ng} onSelect={id=>change('machine',id)}/><Ranking title="ชิ้นงานที่มีงานเสีย / Defects by Part" rows={byPart} total={stats.ng} onSelect={id=>change('part',id)}/></div>
   <section className="ds-panel"><h3>รายละเอียดงานเสีย / Defect Records</h3><p>ไม่มีรหัสสาเหตุงานเสียแยกในประวัติ จึงแสดงหมายเหตุตามต้นทาง / No structured defect-cause field is available; original notes are shown.</p><label className="ds-check"><input type="checkbox" checked={onlyNg} onChange={e=>{setOnlyNg(e.target.checked);setPage(0);}}/>แสดงเฉพาะรายการมี NG หรือข้อมูลผิดปกติ / Show NG or invalid records only</label><p>{n(details.length)} รายการ / records</p><div className="ds-table"><table><thead><tr>{['วันที่ / Date','กะ / Shift','เครื่อง / Machine','ชิ้นงาน / Part / Step','งานดี / Good','งานเสีย / NG','อัตรางานเสีย / NG %','หมายเหตุ / Note'].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{details.slice(current*30,current*30+30).map((l,i)=><tr key={l.id+'-'+i}><td>{l.date}</td><td>{l.shift}</td><td>{l.machineName}</td><td>{l.partNo} · {l.productName}<br/>Step {l.step||'—'}</td><td>{String(l.goodQty??'—')}</td><td className="ds-ng">{String(l.ngQty??'—')}</td><td>{validDefectLog(l)?rate(defectRate(Number(l.goodQty),Number(l.ngQty))):'ข้อมูลผิดปกติ / Invalid'}</td><td>{l.note||'—'}</td></tr>)}</tbody></table></div><div className="ds-pagination"><button disabled={!current} onClick={()=>setPage(current-1)}>ก่อนหน้า / Previous</button><span>{current+1} / {pages}</span><button disabled={current+1>=pages} onClick={()=>setPage(current+1)}>ถัดไป / Next</button></div></section>
  </>}
 </section>;
}
