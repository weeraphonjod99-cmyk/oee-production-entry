import {useEffect,useMemo,useState} from 'react';
import {parseToolingCsv,TOOLING_URL,TOOLING_CSV,toolingThai} from '../lib/tooling';
import './tooling-list.css';
export function ToolingList(){
 const [data,setData]=useState<ReturnType<typeof parseToolingCsv>|null>(null),[loading,setLoading]=useState(false),[error,setError]=useState(''),[updated,setUpdated]=useState(''),[reload,setReload]=useState(0);
 const [query,setQuery]=useState(''),[customer,setCustomer]=useState(''),[machine,setMachine]=useState(''),[page,setPage]=useState(0);
 useEffect(()=>{let disposed=false,busy=false;let controller:AbortController|undefined;
 const load=async()=>{if(busy)return;busy=true;controller=new AbortController();const timeout=setTimeout(()=>controller?.abort(),45000);setLoading(true);
 try{const response=await fetch(TOOLING_CSV+'&_='+Date.now(),{signal:controller.signal,credentials:'omit',cache:'no-store'});if(!response.ok)throw new Error('HTTP '+response.status);const next=parseToolingCsv(await response.text());if(!disposed){setData(next);setUpdated(new Date().toLocaleString('th-TH'));setError('');}}
 catch{if(!disposed)setError('โหลดข้อมูลไม่สำเร็จ กรุณาตรวจการเชื่อมต่อหรือสิทธิ์อ่าน Google Sheet / Unable to load. Check connection or Google Sheet access.');}
 finally{clearTimeout(timeout);busy=false;if(!disposed)setLoading(false);}};
 void load();const refresh=()=>{if(!document.hidden)void load();};const timer=setInterval(refresh,60000);window.addEventListener('focus',refresh);return()=>{disposed=true;controller?.abort();clearInterval(timer);window.removeEventListener('focus',refresh);};},[reload]);
 const customerIndex=data?.headers.indexOf('Customer')??-1,machineIndex=data?.headers.indexOf('Mech. No.')??-1;
 const rows=useMemo(()=>data?.records.filter(r=>(!customer||r.cells[customerIndex]===customer)&&(!machine||r.cells[machineIndex]===machine)&&(!query||r.cells.join(' ').toLowerCase().includes(query.trim().toLowerCase())))||[],[data,customer,machine,query,customerIndex,machineIndex]);
 useEffect(()=>setPage(0),[customer,machine,query]);const maxPage=Math.max(0,Math.ceil(rows.length/50)-1),current=Math.min(page,maxPage);
 const options=(index:number)=>[...new Set(data?.records.map(r=>r.cells[index]).filter(Boolean)||[])].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
 return <section className="tooling-list" aria-label="JRTL TooLing List"><header><div><p>ทะเบียนแม่พิมพ์ / Tooling Register</p><h2>JRTL TooLing List</h2><p>ข้อมูลจากแท็บที่เลือกใน Google Sheet / Linked Google Sheet tab</p></div><a href={TOOLING_URL} target="_blank" rel="noreferrer">เปิดชีตต้นทาง / Open Sheet ↗</a><button type="button" className="ghost-button" disabled={loading} onClick={()=>setReload(v=>v+1)}>{loading?'กำลังโหลด / Loading…':'โหลดใหม่ / Refresh'}</button></header>
 <p role="status">อัปเดตอัตโนมัติทุก 1 นาทีขณะเปิดหน้า / Auto-refresh every minute while visible<br/>สำเร็จล่าสุด / Last successful update: {updated||'—'}</p>
 {error&&<p role="alert" className="pr-warning">{error}{data&&' • แสดงข้อมูลที่โหลดสำเร็จครั้งก่อน / Showing last successful data'}</p>}
 <div className="tooling-filters"><label>ค้นหา / Search<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="รหัสชิ้นงาน แม่พิมพ์ วัสดุ / Part, tooling, material"/></label><label>ลูกค้า / Customer<select value={customer} onChange={e=>setCustomer(e.target.value)}><option value="">ทั้งหมด / All</option>{options(customerIndex).map(v=><option key={v}>{v}</option>)}</select></label><label>เครื่องจักร / Machine<select value={machine} onChange={e=>setMachine(e.target.value)}><option value="">ทั้งหมด / All</option>{options(machineIndex).map(v=><option key={v}>{v}</option>)}</select></label><button className="ghost-button" onClick={()=>{setQuery('');setCustomer('');setMachine('');}}>ล้างตัวกรอง / Clear Filters</button></div>
 <p>พบ {rows.length.toLocaleString()} จาก {data?.records.length.toLocaleString()||0} รายการ / Matching records • รูปชิ้นงานที่ฝังในชีตให้ดูจากต้นทาง / Embedded pictures are available in the source sheet.</p>
 <div className="tooling-scroll" tabIndex={0} aria-label="ตารางแม่พิมพ์ / Tooling table"><table><thead><tr>{data?.headers.map((h,i)=><th key={i}>{toolingThai[h]||h}<small>{h}</small></th>)}</tr></thead><tbody>{rows.slice(current*50,current*50+50).map(r=><tr key={r.sourceRow}>{r.cells.map((v,i)=><td key={i}>{data?.headers[i]==='Part Picture'?<a href={TOOLING_URL.replace(/#gid=.*/,`#gid=704073111&range=B${r.sourceRow}`)} target="_blank" rel="noreferrer">ดูในชีต / View</a>:v||'—'}</td>)}</tr>)}</tbody></table></div>
 {!loading&&!rows.length&&<p>ไม่พบรายการตามตัวกรอง / No matching records</p>}
 {maxPage>0&&<div className="tooling-pages"><button disabled={current===0} onClick={()=>setPage(current-1)}>ก่อนหน้า / Previous</button><span>{current+1} / {maxPage+1}</span><button disabled={current===maxPage} onClick={()=>setPage(current+1)}>ถัดไป / Next</button></div>}
 </section>;
}
