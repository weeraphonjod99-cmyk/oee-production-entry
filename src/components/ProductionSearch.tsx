import {fetchProductionCapacity,type ProductionCapacityData} from '../lib/api';
import {capacityMatcher} from '../lib/productionReport';
import {useEffect,useMemo,useState} from 'react';
import type {ProductionLog} from '../types';
import {downtimeFields} from '../lib/metrics';
import {productionSearchSummary,recordedStop,searchPartKey,searchProduction,sheetNumber, type SearchFilters} from '../lib/productionSearch';
import './production-search.css';
import {useCapacityRefreshTick} from './CapacitySourceStatus';
const empty:SearchFilters={machine:'',part:'',from:'',to:'',shift:'',query:''};
const n=(v:number)=>v.toLocaleString('th-TH',{maximumFractionDigits:2});
export function ProductionSearch({logs,loading,error,onRefresh}:{logs:ProductionLog[];loading:boolean;error:string;onRefresh:()=>void}){
 const autoRefresh=useCapacityRefreshTick();
 const [filter,setFilter]=useState(empty),[group,setGroup]=useState<'date'|'machine'|'part'>('date'),[page,setPage]=useState(0);
 const [capacity,setCapacity]=useState<ProductionCapacityData|null>(null),[capacityLoading,setCapacityLoading]=useState(true),[capacityError,setCapacityError]=useState(''),[capacityRefresh,setCapacityRefresh]=useState(0);
 useEffect(()=>{let cancelled=false;setCapacityLoading(true);setCapacityError('');fetchProductionCapacity('').then(data=>{if(!cancelled){setCapacity(data);if(!data)setCapacityError('ยังไม่มีข้อมูลกำลังผลิต');}}).catch(()=>{if(!cancelled)setCapacityError('โหลดเป้าหมายไม่สำเร็จ กรุณาลองใหม่');}).finally(()=>{if(!cancelled)setCapacityLoading(false);});return()=>{cancelled=true;};},[capacityRefresh,autoRefresh]);
 const match=useMemo(()=>capacityMatcher(capacity,[...new Map(logs.map(l=>[l.machineId,{id:l.machineId,name:l.machineName,capacityUnits:0,capacityMinutes:0,hasStep:true,rowCount:0}])).values()],85),[capacity,logs]);
 const change=(key:keyof SearchFilters,value:string)=>{setFilter(f=>({...f,[key]:value,...(key==='machine'?{part:''}:{})}));setPage(0);};
 const machines=useMemo(()=>[...new Map(logs.map(l=>[l.machineId,l.machineName])).entries()].sort((a,b)=>a[1].localeCompare(b[1])),[logs]);
 const parts=useMemo(()=>[...new Map(logs.filter(l=>!filter.machine||l.machineId===filter.machine).map(l=>[searchPartKey(l),`${l.partNo || 'ไม่ระบุรหัส'} · ${l.productName} · Step ${l.step || '—'}`])).entries()].sort((a,b)=>a[1].localeCompare(b[1])),[logs,filter.machine]);
 const rows=useMemo(()=>searchProduction(logs,filter),[logs,filter]);
 const charts=useMemo(()=>productionSearchSummary(rows,group,match),[rows,group,match]);
 const total=useMemo(()=>productionSearchSummary(rows,'date').reduce((s,r)=>({output:s.output+r.output,run:s.run+r.run,stop:s.stop+r.stop}),{output:0,run:0,stop:0}),[rows]);
 const stops=useMemo(()=>downtimeFields.map(f=>({...f,value:rows.reduce((s,l)=>s+sheetNumber(l[f.key]),0)})).sort((a,b)=>b.value-a.value),[rows]);
 const maxOutput=Math.max(1,...charts.map(r=>r.output)),maxTime=Math.max(1,...charts.map(r=>r.run+r.stop));
 const pages=Math.max(1,Math.ceil(rows.length/30)),current=Math.min(page,pages-1);
 const invalid=rows.filter(l=>[l.normalMinutes,...downtimeFields.map(f=>l[f.key])].some(v=>v!=null&&(!Number.isFinite(Number(v))||Number(v)<0||Number(v)>1440))).length;
 return <section className="production-search">
  <header className="ps-panel"><div><small>ค้นหาการผลิต / PRODUCTION EXPLORER</small><h2>ค้นหาการผลิต / Production Search</h2><p>ค้นตามเครื่องจักร ชิ้นงาน และวันที่ • ข้อมูลจาก Google Sheet</p></div><button type="button" onClick={onRefresh} disabled={loading}>{loading?'กำลังโหลดข้อมูล…':'โหลดข้อมูลจากชีตใหม่'}</button></header>
  {error&&<p role="alert" className="ps-warning">{error}</p>}
  <div className="ps-panel"><b>เป้าหมายต่อนาที / Target per Minute • KPI 85%</b><p>{capacityLoading?'กำลังโหลดเป้าหมาย…':capacityError||'อ้างอิงกำลังผลิตตามเครื่อง / ชิ้นงาน / Step'}</p><button type="button" disabled={capacityLoading} onClick={()=>setCapacityRefresh(v=>v+1)}>โหลดเป้าหมายใหม่</button><p>เป้ารวม = เป้าชิ้นต่อนาที × (เวลาผลิต + หยุดตามชีต) • เมื่อรวมหลายงาน ใช้เป้าเฉลี่ยถ่วงน้ำหนักตามเวลา • หากข้อมูลไม่ครบจะแสดง —</p></div>
  <div className="ps-panel ps-filters">
   <label>เครื่องจักร / Machine<select value={filter.machine} onChange={e=>change('machine',e.target.value)}><option value="">ทุกเครื่อง</option>{machines.map(([id,name])=><option value={id} key={id}>{name}</option>)}</select></label>
   <label>ชิ้นงานและขั้นตอน / Part / Step<select value={filter.part} onChange={e=>change('part',e.target.value)}><option value="">ทุกชิ้นงาน</option>{parts.map(([id,name])=><option value={id} key={id}>{name}</option>)}</select></label>
   <label>ตั้งแต่วันที่ / From Date<input type="date" value={filter.from} onChange={e=>change('from',e.target.value)}/></label>
   <label>ถึงวันที่ / To Date<input type="date" value={filter.to} onChange={e=>change('to',e.target.value)}/></label>
   <label>กะ / Shift<select value={filter.shift} onChange={e=>change('shift',e.target.value)}><option value="">ทุกกะ</option>{[...new Set(logs.map(l=>l.shift))].sort().map(s=><option key={s} value={s}>{s||'ไม่ระบุ'}</option>)}</select></label>
   <label>คำค้น / Search<input type="search" placeholder="รหัสงาน ชื่อผู้บันทึก หมายเหตุ" value={filter.query} onChange={e=>change('query',e.target.value)}/></label>
   <button type="button" onClick={()=>{setFilter(empty);setPage(0);}}>ล้างการค้นหา</button><p>เลือกวันเริ่มและวันสิ้นสุดเป็นวันเดียวกันเพื่อดูรายวัน • กราฟและรายละเอียดเปลี่ยนตามตัวกรอง</p>
  </div>
  {filter.from&&filter.to&&filter.from>filter.to&&<p role="alert" className="ps-warning">วันเริ่มต้องไม่เกินวันสิ้นสุด</p>}
  <div className="ps-cards">{[['รายการที่พบ / Matching Records',n(rows.length)],["ผลผลิตรวม / Output (Good + NG + Test)",n(total.output)],["เวลาผลิตตามชีต / Sheet Run Time (min)",n(total.run)],["หยุดรวมตามชีต / Sheet Downtime (min)",n(total.stop)]].map(([label,value])=><div className="ps-panel" key={label}><span>{label}</span><strong>{loading?'…':value}</strong></div>)}</div>
  <p>เวลารวมเป็นผลรวมรายการ ไม่ใช่ช่วงเวลาบนนาฬิกา รวมเวลาหยุดทุกหัวข้อที่ชีตบันทึก (ไม่หักเวลาพักอัตโนมัติ) จึงอาจต่างจาก Dashboard • โหลดได้ {n(logs.length)} รายการ สูงสุด 100,000 รายการ</p>
  {invalid>0&&<p className="ps-warning">พบ {n(invalid)} รายการที่เวลาติดลบ ไม่ใช่ตัวเลข หรือเกิน 24 ชั่วโมงต่อหัวข้อ โปรดตรวจข้อมูลต้นทาง ยอดแสดงตามค่าที่บันทึก</p>}
  {!loading&&rows.length===0?<div className="ps-panel" role="status">ไม่พบการผลิตตามเงื่อนไขนี้ ลองเปลี่ยนวันที่ เครื่องจักร หรือชิ้นงาน</div>:<>
  <div className="ps-panel"><h3>กราฟสรุปการผลิต / Production Summary Chart</h3><label>สรุปกราฟตาม / Group Chart By<select value={group} onChange={e=>setGroup(e.target.value as typeof group)}><option value="date">วันที่ / Date</option><option value="machine">เครื่องจักร / Machine</option><option value="part">ชิ้นงานและขั้นตอน / Part / Step</option></select></label><p>ยอดผลิต: สีเขียว • เวลาผลิต: สีน้ำเงิน • เวลาหยุด: สีแดง • {n(charts.length)} กลุ่ม (เลื่อนดูได้ครบ)</p>
   <div className="ps-charts">{charts.map((r,i)=><div className="ps-chart-row" key={i}><b>{r.label}</b><span>ยอดผลิต / Output {n(r.output)} ชิ้น</span><strong>เป้าหมายเฉลี่ย {r.eligible===r.count&&r.minutes>0?n(r.target/r.minutes):'—'} ชิ้น/นาที</strong><span>เป้ารวม / Total Target {r.eligible===r.count?n(r.target):'—'} ชิ้น • ผลิตจริงเฉลี่ย {r.eligible===r.count&&r.minutes>0?n(r.output/r.minutes):'—'} ชิ้น/นาที</span><span className={r.eligible===r.count&&r.output<r.target?'ps-negative':''}>{r.eligible===r.count?'ส่วนต่าง '+n(r.output-r.target)+' ชิ้น':'ตรวจสอบเป้าหมายหรือเวลา: ข้อมูลครบ '+r.eligible+'/'+r.count+' รายการ'}</span><div className="ps-track"><i style={{width:`${Math.max(0,r.output)/maxOutput*100}%`}}/></div><span>ผลิต / Production {n(r.run)} / หยุด {n(r.stop)} นาที</span><div className="ps-track ps-time"><i style={{width:`${Math.max(0,r.run)/maxTime*100}%`}}/><i style={{width:`${Math.max(0,r.stop)/maxTime*100}%`}}/></div></div>)}</div>
  </div>
  <div className="ps-panel"><h3>เวลาหยุดแยกทุกสาเหตุ / Downtime by Cause</h3><div className="ps-stop-grid">{stops.map(f=><div key={f.key}><span>{f.label}</span><b>{n(f.value)} นาที</b><div className="ps-track ps-stop"><i style={{width:`${Math.max(0,f.value)/Math.max(1,...stops.map(s=>s.value))*100}%`}}/></div></div>)}</div></div>
  <div className="ps-panel"><h3>รายละเอียดการผลิต / Production Details • {n(rows.length)}  รายการ / Items</h3><p>เปิด “รายละเอียด” เพื่อดูทุกสาเหตุหยุด เวลาเริ่ม–จบที่มีในชีต และหมายเหตุ</p><div className="ps-table"><table><thead><tr>{['วันที่ / กะ / Date / Shift','เครื่อง / ชิ้นงาน / Machine / Part',"งานดี / งานเสีย / งานทดลอง (Good / NG / Test)",'ยอดผลิต / Output','เป้าหมาย 85% (ชิ้น/นาที) / 85% Target (pcs/min)','ผลิต (นาที) / Run (min)','หยุด (นาที) / Stop (min)','รายละเอียด / Details'].map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{rows.slice(current*30,current*30+30).map(l=><tr key={l.id}><td>{l.date}<br/>{l.shift}</td><td><b>{l.machineName}</b><br/>{l.productName}<br/>{l.partNo} · Step {l.step||'—'}</td><td>{n(sheetNumber(l.goodQty))} / {n(sheetNumber(l.ngQty))} / {n(sheetNumber(l.testQty))}</td><td>{n(sheetNumber(l.goodQty)+sheetNumber(l.ngQty)+sheetNumber(l.testQty))}</td><td>{match(l).rate==null?<span title={match(l).reason}>— {match(l).reason}</span>:n(match(l).rate!)}</td><td>{n(sheetNumber(l.normalMinutes))}</td><td className={recordedStop(l)>0?'ps-negative':''}>{n(recordedStop(l))}</td><td><details><summary>รายละเอียด / Details</summary><div className="ps-detail"><p>ผู้บันทึก: {l.entryUser||'ไม่ระบุ'} • ใบสั่งผลิต: {l.productionOrderNo||'—'}</p><p>เริ่มกะ: {l.shiftStartAt||'ไม่ได้บันทึก'} • จบกะ: {l.shiftEndAt||'ไม่ได้บันทึก'}</p><p>เวลารวมที่บันทึก: {l.workMinutes==null?'ไม่ได้บันทึก':n(l.workMinutes)+' นาที'}</p>{downtimeFields.map(f=><p key={f.key}>{f.label}: <b>{n(sheetNumber(l[f.key]))} นาที</b></p>)}<p>หมายเหตุ: {l.note||'—'}</p><p>รายละเอียดปุ่ม/เวลา: {l.buttonDetails||'ไม่ได้บันทึก'}</p></div></details></td></tr>)}</tbody></table></div><div className="ps-pagination"><button disabled={current===0} onClick={()=>setPage(current-1)}>ก่อนหน้า</button><span>หน้า {current+1} / {pages}</span><button disabled={current+1>=pages} onClick={()=>setPage(current+1)}>ถัดไป</button></div></div>
  </>}
 </section>;
}
