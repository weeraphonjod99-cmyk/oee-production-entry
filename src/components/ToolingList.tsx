import {useEffect,useMemo,useState,useRef} from 'react';
import {parseToolingHtml,combineTooling,TOOLING_SHEETS,TOOLING_URL,toolingThai,type ToolingData} from '../lib/tooling';
import './tooling-list.css';
export function ToolingList(){
 const [source,setSource]=useState<ToolingData|null>(null);
 const frame=useRef<HTMLIFrameElement>(null);
 const sendSource=()=>{if(source)frame.current?.contentWindow?.postMessage({type:'jrtl-tooling-source-v1',records:source.records},window.location.origin);};
 useEffect(()=>{sendSource();},[source]);
 const [section,setSection]=useState<'list'|'maintenance'>('list');
 return <div className="tooling-workspace">
  <nav className="tooling-subnav" aria-label="เมนูแม่พิมพ์ / Tooling menu">
   <button type="button" aria-pressed={section==='list'} onClick={()=>setSection('list')}>ทะเบียนแม่พิมพ์ / Tooling List</button>
   <button type="button" aria-pressed={section==='maintenance'} onClick={()=>setSection('maintenance')}>จัดการบำรุงรักษาแม่พิมพ์ / Die Maintenance Management</button>
  </nav>
  <div hidden={section!=='list'}><ToolingRegister onData={setSource} /></div>
  <section hidden={section!=='maintenance'} aria-label="จัดการบำรุงรักษาแม่พิมพ์ / Die Maintenance Management">
   <iframe ref={frame} onLoad={sendSource} className="die-maintenance-frame" src="./JRTL_Die_Maintenance.html?v=shared-sync-20261016" title="จัดการบำรุงรักษาแม่พิมพ์ / Die Maintenance Management" />
  </section>
 </div>;
}
function ToolingRegister({onData}:{onData:(data:ToolingData)=>void}){
 const [data,setData]=useState<ToolingData|null>(null),[loading,setLoading]=useState(false),[error,setError]=useState(''),[updated,setUpdated]=useState(''),[reload,setReload]=useState(0);
 const [sheetFilter,setSheetFilter]=useState(''),[year,setYear]=useState('');
 const [query,setQuery]=useState(''),[customer,setCustomer]=useState(''),[machine,setMachine]=useState(''),[page,setPage]=useState(0);
 useEffect(()=>{let disposed=false,busy=false;let controller:AbortController|undefined;
 const load=async()=>{if(busy)return;busy=true;controller=new AbortController();const timeout=setTimeout(()=>controller?.abort(),45000);setLoading(true);
 try{const results=await Promise.all(TOOLING_SHEETS.map(async sheet=>{const response=await fetch(`https://docs.google.com/spreadsheets/d/1GJT6p_Yfn7Lda-kYgH7-lFofOO0GOn1ZfwWjTlGXm2c/htmlview/sheet?headers=true&gid=${sheet.gid}&_=${Date.now()}`,{signal:controller!.signal,credentials:'omit',cache:'no-store'});if(!response.ok)throw new Error('HTTP '+response.status);return parseToolingHtml(await response.text(),sheet);}));const next=combineTooling(results);if(!disposed){setData(next);onData(next);setUpdated(new Date().toLocaleString('th-TH'));setError('');}}
 catch{if(!disposed)setError('โหลดข้อมูลไม่สำเร็จ กรุณาตรวจการเชื่อมต่อหรือสิทธิ์อ่าน Google Sheet / Unable to load. Check connection or Google Sheet access.');}
 finally{clearTimeout(timeout);busy=false;if(!disposed)setLoading(false);}};
 void load();const refresh=()=>{if(!document.hidden)void load();};const timer=setInterval(refresh,60000);window.addEventListener('focus',refresh);return()=>{disposed=true;controller?.abort();clearInterval(timer);window.removeEventListener('focus',refresh);};},[reload,onData]);
 const rows=useMemo(()=>data?.records.filter(r=>(!sheetFilter||r.gid===sheetFilter)&&(!year||r.year===year)&&(!customer||r.values.Customer===customer)&&(!machine||r.values['Mech. No.']===machine)&&(!query||Object.values(r.values).join(' ').toLowerCase().includes(query.trim().toLowerCase())))||[],[data,customer,machine,query,sheetFilter,year]);
 useEffect(()=>setPage(0),[customer,machine,query,sheetFilter,year]);const maxPage=Math.max(0,Math.ceil(rows.length/50)-1),current=Math.min(page,maxPage);
 const options=(key:string)=>[...new Set(data?.records.map(r=>r.values[key]).filter(Boolean)||[])].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
 return <section className="tooling-list" aria-label="JRTL TooLing List"><header><div><p>ทะเบียนแม่พิมพ์ / Tooling Register</p><h2>JRTL TooLing List</h2><p>รวมทุกปีและทุกหมวดจาก 6 แท็บ / All years and categories from 6 sheets</p></div><a href={TOOLING_URL} target="_blank" rel="noreferrer">เปิดชีตต้นทาง / Open Sheet ↗</a><button type="button" className="ghost-button" disabled={loading} onClick={()=>setReload(v=>v+1)}>{loading?'กำลังโหลด / Loading…':'โหลดใหม่ / Refresh'}</button></header>
 <p role="status">อัปเดตอัตโนมัติทุก 1 นาทีขณะเปิดหน้า / Auto-refresh every minute while visible<br/>สำเร็จล่าสุด / Last successful update: {updated||'—'}</p>
 {error&&<p role="alert" className="pr-warning">{error}{data&&' • แสดงข้อมูลที่โหลดสำเร็จครั้งก่อน / Showing last successful data'}</p>}
 <div className="tooling-filters"><label>ปี / Year<select value={year} onChange={e=>setYear(e.target.value)}><option value="">ทุกปีและไม่ระบุปี / All years</option>{['2024','2025','2026'].map(v=><option key={v}>{v}</option>)}</select></label><label>หมวด / Sheet<select value={sheetFilter} onChange={e=>setSheetFilter(e.target.value)}><option value="">ทุกหมวด / All sheets</option>{TOOLING_SHEETS.map(v=><option key={v.gid} value={v.gid}>{v.name}</option>)}</select></label><label>ค้นหา / Search<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="รหัสชิ้นงาน แม่พิมพ์ วัสดุ / Part, tooling, material"/></label><label>ลูกค้า / Customer<select value={customer} onChange={e=>setCustomer(e.target.value)}><option value="">ทั้งหมด / All</option>{options('Customer').map(v=><option key={v}>{v}</option>)}</select></label><label>เครื่องจักร / Machine<select value={machine} onChange={e=>setMachine(e.target.value)}><option value="">ทั้งหมด / All</option>{options('Mech. No.').map(v=><option key={v}>{v}</option>)}</select></label><button className="ghost-button" onClick={()=>{setQuery('');setCustomer('');setMachine('');setYear('');setSheetFilter('');}}>ล้างตัวกรอง / Clear Filters</button></div>
 <p>พบ {rows.length.toLocaleString()} จาก {data?.records.length.toLocaleString()||0} รายการ / Matching records • แยกรายการตามแท็บต้นทาง ไม่รวมชื่อซ้ำข้ามปี / Source rows are retained separately across years.</p>
 <div className="tooling-scroll" tabIndex={0} aria-label="ตารางแม่พิมพ์ / Tooling table"><table><thead><tr><th>ปี / Year</th><th>หมวด / Sheet</th>{data?.headers.map((h,i)=><th key={i}>{toolingThai[h]||h}<small>{h}</small></th>)}</tr></thead><tbody>{rows.slice(current*50,current*50+50).map(r=><tr key={r.gid+':'+r.sourceRow}><td>{r.year||'ไม่ระบุ / Unspecified'}</td><td><a href={TOOLING_URL.replace(/gid=\d+/g,'gid='+r.gid)+`&range=A${r.sourceRow}`} target="_blank" rel="noreferrer">{r.sheet}</a></td>{data?.headers.map((h,i)=><td key={i}>{h==='Part Picture'?r.images.length?<div className="tooling-images">{r.images.map((url,k)=><a href={url} target="_blank" rel="noreferrer" key={url}><img src={url} crossOrigin="anonymous" loading="lazy" referrerPolicy="no-referrer" alt={`${r.values['Part Name']} · ${r.values['Part No.']} (${k+1})`}/></a>)}</div>:<span>ไม่มีรูปในชีต / No source image</span>:r.values[h]||'—'}</td>)}</tr>)}</tbody></table></div>
 {!loading&&!rows.length&&<p>ไม่พบรายการตามตัวกรอง / No matching records</p>}
 {maxPage>0&&<div className="tooling-pages"><button disabled={current===0} onClick={()=>setPage(current-1)}>ก่อนหน้า / Previous</button><span>{current+1} / {maxPage+1}</span><button disabled={current===maxPage} onClick={()=>setPage(current+1)}>ถัดไป / Next</button></div>}
 </section>;
}

