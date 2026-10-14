import {useState} from 'react';
export function DefectMultiSelect({label,allLabel,options,selected,onChange}:{label:string;allLabel:string;options:[string,string][];selected:string[];onChange:(values:string[])=>void}){
 const [query,setQuery]=useState('');
 const visible=options.filter(([,name])=>name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
 const names=options.filter(([id])=>selected.includes(id)).map(([,name])=>name);
 return <div className="ds-multi"><details><summary><span>{label}</span><b>{selected.length?`เลือก ${selected.length} / Selected ${selected.length}`:allLabel}</b></summary>
  <div className="ds-multi-panel"><p>ติ๊กได้หลายรายการ ไม่เลือกเฉพาะรายการ = ทั้งหมด / Select multiple; no specific selections means all.</p>
   <input type="search" aria-label={`ค้นหาในรายการ / Find in ${label}`} placeholder="ค้นหาในรายการ / Find options" value={query} onChange={e=>setQuery(e.target.value)}/>
   <div className="ds-actions"><button type="button" onClick={()=>onChange([])}>{allLabel}</button><button type="button" disabled={!visible.length} onClick={()=>onChange([...new Set([...selected,...visible.map(([id])=>id)])])}>เลือกที่ค้นพบ / Select Results ({visible.length})</button></div>
   <div className="ds-multi-options" role="group" aria-label={label}>{visible.map(([id,name])=><label key={id}><input type="checkbox" checked={selected.includes(id)} onChange={e=>onChange(e.target.checked?[...selected,id]:selected.filter(v=>v!==id))}/><span>{name}</span></label>)}{!visible.length&&<p>ไม่พบรายการ / No matching options</p>}</div>
  </div></details>{selected.length>0&&<p className="ds-multi-selected" title={names.join(', ')}>{names.slice(0,2).join(' · ')}{names.length>2?` · +${names.length-2}`:''}</p>}
 </div>;
}
