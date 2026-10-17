const CLOUD_READY=false; // Enable after the Apps Script backup endpoints are deployed.
import {initialPlan,WELDING_PLAN_ID} from './machine-maintenance-plan.js?v=machine-zip-20261017';
const URL_API='https://script.google.com/macros/s/AKfycbz05f1rSaHl73PFVAoOA7T2DCfBwVEcTJ564zrwU2GariZgTkLH3KGbxzSSXtTwgXj6Wg/exec';
const STATE='jrtl_machine_pm_backup_v1';
const groups=['factory1-bending','factory1-riveting','factory1-stamping','factory1-walding'];
let busy=false,timer, message='พร้อมสำรองแผนบำรุงรักษา / Ready to back up';
const listeners=new Set();
function announce(text){message=text;listeners.forEach(fn=>fn(text));}
function state(){return JSON.parse(localStorage.getItem(STATE)||'{"clientId":"","pending":null}');}
async function snapshot(){
 const templates=await Promise.all(groups.map(async id=>{const r=await fetch('./'+id+'.json?v=machine-zip-20261017');if(!r.ok)throw Error('โหลดแบบฟอร์มต้นฉบับไม่สำเร็จ');return {id,...await r.json()};}));
 const menus=JSON.parse(localStorage.getItem('jrtl_machine_maintenance_menus_v1')||'[]');
 const records=[],archivedRecords=[],plans=templates.flatMap(g=>g.documents.map(d=>({key:'jrtl_machine_plan_v1:machine-zip-v1:'+d.id,data:d}))); 
 for(const key of Object.keys(localStorage).sort()){
  if(key.startsWith('jrtl_factory_pm_v1:'))archivedRecords.push({key,recordMonth:key.split(':').pop(),data:JSON.parse(localStorage.getItem(key))});
  if(key==='jrtl_machine_plan_v1:'+WELDING_PLAN_ID){archivedRecords.push({key,data:JSON.parse(localStorage.getItem(key))});continue;}
  if(key.startsWith('jrtl_machine_plan_v1:')){const item={key,data:JSON.parse(localStorage.getItem(key))},i=plans.findIndex(p=>p.key===key);if(i<0)plans.push(item);else plans[i]=item;}
 }
 return {version:1,kind:'machine-maintenance',exportedAt:new Date().toISOString(),templates,menus:menus.filter(m=>m.id!==WELDING_PLAN_ID),records,plans,archivedRecords};
}
async function api(action,payload={}){
 const token=JSON.parse(localStorage.getItem('oee-production-session-v1')||'null')?.dieSyncToken;
 if(!token)throw Error('กรุณาออกจากระบบและเข้าใหม่ เพื่อเปิดการสำรอง Google Sheet');
 const c=new AbortController(),timeout=setTimeout(()=>c.abort(),45000);
 try{const r=await fetch(URL_API,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action,payload:{...payload,token}}),signal:c.signal});const out=await r.json();if(!r.ok||out.ok!==true)throw Error(out.error==='SYNC_LOGIN_REQUIRED'?'กรุณาเข้าสู่ระบบใหม่':out.error||'Google Sheet ยังไม่ยืนยันการสำรอง');return out;}finally{clearTimeout(timeout);}
}
async function send(){
 if(busy)return;busy=true;
 try{const s=state(),item=s.pending;if(!item)return;announce('กำลังสำรอง Google Sheet…');const r=await api('backupMachineMaintenance',item);if(r.backupId!==item.backupId)throw Error('เลขสำรองไม่ตรงกัน');const latest=state();if(latest.pending?.backupId===item.backupId)latest.pending=null;latest.lastAt=r.receivedAt;localStorage.setItem(STATE,JSON.stringify(latest));announce(latest.pending?'มีข้อมูลใหม่รอสำรอง':'สำรอง Google Sheet สำเร็จ • '+new Date(r.receivedAt).toLocaleString('th-TH'));}
 catch(e){announce('ยังไม่สำรอง Google Sheet • '+e.message+' • ข้อมูลในเครื่องยังอยู่ สามารถดาวน์โหลดได้');}finally{busy=false;}
}
async function queue(){if(!CLOUD_READY){announce('ดาวน์โหลดได้ทันที • การสำรอง Google Sheet รอเปิดใช้งาน');return;}try{const data=await snapshot();const s=state();s.clientId ||= crypto.randomUUID();s.pending={backupId:crypto.randomUUID(),clientId:s.clientId,data};localStorage.setItem(STATE,JSON.stringify(s));await send();}catch(e){announce('เตรียมสำรองไม่สำเร็จ • '+e.message);}}
window.addEventListener('machine-pm-saved',()=>{clearTimeout(timer);timer=setTimeout(queue,2000);});
window.addEventListener('online',()=>{if(CLOUD_READY)void send()});
setInterval(()=>{try{if(CLOUD_READY&&state().pending)void send();}catch{}},60000);
export function csvText(data){
 const rows=[['ปี','เครื่องจักร','ชื่อ','รุ่น','เอกสาร','ระดับ 1','ระดับ 2','ระดับ 3','เดือน','แผน','ผล','ข้อมูลเพิ่มเติม 1','ข้อมูลเพิ่มเติม 2','ข้อมูลเพิ่มเติม 3','ข้อมูลเพิ่มเติม 4','หมายเหตุ']];
 for(const {data:p} of data.plans||[])for(const r of p.rows||[])for(const [m,month] of (r.months||[]).entries())rows.push([p.year,r.machine,r.name,r.model,p.documentNo,r.first,r.second,r.third,m+1,month.plan,month.result,...(r.tail||[r.calibration,r.calibrationResult,'','']),r.note]);
 return '\ufeff'+rows.map(row=>row.map(v=>'"'+String(v??'').replace(/^[=+@-]/,"'$&").replace(/"/g,'""')+'"').join(',')).join('\r\n');
}
function download(data,type){const text=type==='csv'?csvText(data):JSON.stringify(data,null,2),u=URL.createObjectURL(new Blob([text],{type:type==='csv'?'text/csv;charset=utf-8':'application/json'})),a=document.createElement('a');a.href=u;a.download='JRTL-Machine-PM-'+new Date().toISOString().slice(0,10)+'.'+type;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
export function mountMachineBackup(host){
 const box=document.createElement('div');box.className='fp-warning';box.style.cssText='display:flex;flex-wrap:wrap;gap:8px;align-items:center';const title=document.createElement('strong');title.textContent='ดาวน์โหลด / สำรองแผนบำรุงรักษาทั้งหมด';title.style.width='100%';const status=document.createElement('p');status.setAttribute('role','status');status.textContent=CLOUD_READY?message:'ดาวน์โหลดจากแอปได้ทันที • Google Sheet รอเปิดใช้งาน';status.style.width='100%';const update=t=>{if(box.isConnected)status.textContent=t;else listeners.delete(update)};listeners.add(update);box.append(title,status);
 function button(label,fn){const b=document.createElement('button');b.type='button';b.textContent=label;b.disabled=!CLOUD_READY&&label.includes('Google Sheet');b.onclick=async()=>{b.disabled=true;try{await fn();}catch(e){announce('ดำเนินการไม่สำเร็จ • '+e.message)}finally{b.disabled=false}};box.append(b);}
 button('สำรอง Google Sheet ตอนนี้',queue);
 button('ดาวน์โหลดทั้งหมด JSON',async()=>download(await snapshot(),'json'));
 button('ดาวน์โหลดแผนบำรุงรักษา CSV',async()=>download(await snapshot(),'csv'));
 const list=document.createElement('select');list.disabled=!CLOUD_READY;list.style.maxWidth='100%';list.setAttribute('aria-label','เลือกสำรองจาก Google Sheet');box.append(list);
 button('โหลดรายการสำรองจาก Google Sheet',async()=>{const r=await api('listMachineMaintenanceBackups');list.replaceChildren();for(const item of r.backups){const o=document.createElement('option');o.value=item.backupId;o.textContent=new Date(item.receivedAt).toLocaleString('th-TH')+' • '+item.username;list.append(o);}announce(r.backups.length?'เลือกชุดสำรองแล้วกดดาวน์โหลด':'ยังไม่มีชุดสำรอง Google Sheet');});
 button('ดาวน์โหลดจาก Google Sheet',async()=>{if(!list.value)throw Error('กรุณาโหลดและเลือกชุดสำรองก่อน');const r=await api('getMachineMaintenanceBackup',{backupId:list.value});download(r.data,'json');});
 const hint=document.createElement('p');hint.style.width='100%';hint.textContent='JSON เก็บแผนใหม่และข้อมูลที่แก้ไข พร้อมข้อมูลเก่าที่เคยบันทึกในส่วน archivedRecords • CSV สำหรับเปิดแผนรายเดือนใน Excel • สำรองหลังแก้ไขเมื่อ Google Sheet เชื่อมต่อสำเร็จ';box.append(hint);host.insertBefore(box,host.querySelector('nav'));
 try{const s=state();if(s.pending)announce('มีข้อมูลรอสำรอง Google Sheet');else if(s.lastAt)announce('สำรอง Google Sheet ล่าสุด • '+new Date(s.lastAt).toLocaleString('th-TH'));}catch{announce('อ่านคิวสำรองไม่ได้ กรุณาดาวน์โหลด JSON ก่อนดำเนินการต่อ');}
}
