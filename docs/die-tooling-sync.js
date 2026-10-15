// Tooling source identities use sheet + physical tooling/part/operation, not row position.
function toolingBase(record){
 const v=record.values,n=x=>String(x||'').trim().replace(/\s+/g,' ').toUpperCase();
 return JSON.stringify([record.gid,n(v['Manufacture No.']),n(v['Part No.']),n(v['Operation']),!n(v['Part No.'])?n(v['Part Name']):'']);
}
function mergeToolingSource(dies,records,newId){
 const counts=new Map();records.forEach(r=>counts.set(toolingBase(r),(counts.get(toolingBase(r))||0)+1));
 const used=new Set(),next=dies.map(d=>({...d}));let added=0,updated=0;
 for(const r of records){
  const base=toolingBase(r),serial=String(r.values['SL.NO']||'').trim();
  let candidates=next.filter(d=>d.toolingSource?.base===base&&!used.has(d.id));
  let d=candidates.find(d=>d.toolingSource.serial===serial);
  if(!d&&counts.get(base)===1&&candidates.length===1)d=candidates[0];
  // Adopt an existing manual record only when its die and part are an unambiguous exact match.
  if(!d&&counts.get(base)===1&&r.values['Manufacture No.']){
   const match=next.filter(x=>!x.toolingSource&&!used.has(x.id)&&x.dieNo===r.values['Manufacture No.']&&x.partNo===r.values['Part No.']);
   if(match.length===1)d=match[0];
  }
  const source={base,serial,gid:r.gid,sheet:r.sheet,year:r.year,sourceRow:r.sourceRow,values:r.values};
  if(!d){
   d={id:newId(),dieNo:r.values['Manufacture No.']||('ไม่ระบุ / Unspecified · '+r.sheet+' · '+(serial||r.sourceRow)),partNo:r.values['Part No.']||'',partName:r.values['Part Name']||'',machine:r.values['Mech. No.']||'',location:r.values['Product Position']||'',owner:'',interval:null,baseline:0,lastPM:0,note:''};
   next.push(d);added++;
  }else if(JSON.stringify(d.toolingSource)!==JSON.stringify(source))updated++;
  // Refresh source-owned identity fields only; preserve counters, PM, notes, owners and history IDs.
  d.dieNo=r.values['Manufacture No.']||d.dieNo;d.partNo=r.values['Part No.']||'';d.partName=r.values['Part Name']||'';
  if(!d.toolingSource||d.machine===(d.toolingSource.values['Mech. No.']||''))d.machine=r.values['Mech. No.']||'';
  d.toolingSource=source;used.add(d.id);
 }
 return {dies:next,added,updated,linked:used.size};
}
const toolingPictures=new Map();
function sourceDetails(d){
 const s=d.toolingSource;if(!s)return '';
 const images=(toolingPictures.get(d.id)||[]).filter(u=>/^https:\/\/docs\.google\.com\/sheets-images-rt\//.test(u));
 return '<div class="muted">'+esc(s.year||'ไม่ระบุปี / No year')+' · '+esc(s.sheet)+'</div><details><summary>ข้อมูลต้นทาง / Source details</summary><div class="source-details">'+images.map(u=>'<img loading="lazy" crossorigin="anonymous" referrerpolicy="no-referrer" src="'+esc(u)+'" alt="'+esc(d.partName)+'">').join('')+Object.entries(s.values).filter(([k,v])=>v&&k!=='Part Picture').map(([k,v])=>'<div><strong>'+esc(k)+'</strong>: '+esc(v)+'</div>').join('')+'</div></details>';
}
window.addEventListener('message',event=>{
 if(event.origin!==location.origin||event.source!==parent||event.data?.type!=='jrtl-tooling-source-v1')return;
 const records=event.data.records;
 if(!Array.isArray(records)||records.some(r=>!r||typeof r.gid!=='string'||!r.values||!Array.isArray(r.images)))return;
 try{
  const merged=mergeToolingSource(db.dies,records,uid);
  const changed=JSON.stringify(db.dies)!==JSON.stringify(merged.dies);
  if(changed){
   const next={...db,dies:merged.dies};
   localStorage.setItem(KEY,JSON.stringify(next));
   db=next;
   queueDieBackup();
  }
  toolingPictures.clear();
  for(const d of db.dies){const s=d.toolingSource;if(!s)continue;const r=records.find(r=>r.gid===s.gid&&r.sourceRow===s.sourceRow);if(r)toolingPictures.set(d.id,r.images);}
  render();
  $('toolingSyncStatus').textContent='เชื่อมทะเบียน '+merged.linked+' รายการ • เพิ่ม '+merged.added+' • อัปเดต '+merged.updated+' / Linked '+merged.linked+' records • Added '+merged.added+' • Updated '+merged.updated+' · '+new Date().toLocaleString('th-TH');
 }catch{
  $('toolingSyncStatus').textContent='อัปเดตทะเบียนไม่สำเร็จ ข้อมูลเดิมยังอยู่ / Registry update failed; previous data retained';
 }
});
