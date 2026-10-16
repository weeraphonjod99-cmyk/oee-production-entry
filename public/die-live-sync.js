const DIE_SYNC_KEY=KEY+'_shared_base_v1';
let dieSyncBase=null,dieSyncBusy=false,dieSyncDirty=new Set();
try{dieSyncBase=JSON.parse(localStorage.getItem(DIE_SYNC_KEY)||'null');}catch{}
const syncBanner=document.createElement('div');syncBanner.className='notice';syncBanner.id='dieLiveSyncStatus';syncBanner.setAttribute('role','status');$('toolingSyncStatus').after(syncBanner);
function syncMessage(text){syncBanner.textContent=text;}
document.addEventListener('input',e=>{if(e.target.form)dieSyncDirty.add(e.target.form);},true);
document.addEventListener('change',e=>{if(e.target.form)dieSyncDirty.add(e.target.form);},true);
document.addEventListener('reset',e=>dieSyncDirty.delete(e.target),true);
$('dieDialog').addEventListener('close',()=>dieSyncDirty.delete($('dieForm')));
function syncEditing(){return dieSyncDirty.size>0||!!document.querySelector('dialog[open]');}
async function syncDieNow(){
 if(dieSyncBusy||document.hidden)return;
 if(syncEditing()){syncMessage('พักการรับข้อมูลระหว่างกรอกแบบฟอร์ม / Updates paused while editing');return;}
 let session;try{session=JSON.parse(localStorage.getItem('oee-production-session-v1')||'null');}catch{}
 if(!session?.dieSyncToken){syncMessage('กรุณาออกจากระบบแล้วเข้าใหม่หนึ่งครั้งเพื่อเปิดซิงก์ร่วมกัน / Sign out and sign in once to enable shared sync.');return;}
 dieSyncBusy=true;const sent=canonicalDieData(db),controller=new AbortController(),timer=setTimeout(()=>controller.abort(),45000);
 try{
  const response=await fetch(DIE_BACKUP_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'syncDieMaintenance',payload:{token:session.dieSyncToken,base:dieSyncBase,data:sent}}),signal:controller.signal});
  const result=await response.json();
  if(result.conflict){syncMessage('มีข้อมูลแก้ไขชนกัน ข้อมูลในเครื่องยังอยู่ กรุณาส่งออก JSON และตรวจรายการร่วมกับผู้ดูแล / Conflicting edits; local data retained. Export JSON and review with administrator.');return;}
  if(!response.ok||!result.ok)throw Error(result.error||'Sync failed');
  if(!result.data||!['dies','shots','checks','repairs'].every(k=>Array.isArray(result.data[k])))throw Error('Invalid response');
  if(syncEditing()){syncMessage('มีข้อมูลใหม่ รอให้กรอกแบบฟอร์มเสร็จ / Updates waiting until editing finishes');return;}
  const merged=mergeDieData(result.data,sent,canonicalDieData(db));
  if(merged.conflicts.length)throw Error('Changes during sync; retry');
  // Persist before updating the visible data; pending local edits are merged against the sent snapshot.
  localStorage.setItem(KEY,JSON.stringify(merged.data));localStorage.setItem(DIE_SYNC_KEY,JSON.stringify(result.data));
  db=merged.data;dieSyncBase=result.data;render();
  syncMessage('ซิงก์อัตโนมัติทุก 30 วินาที • ล่าสุด '+new Date().toLocaleTimeString('th-TH')+' / Shared sync every 30 seconds');
 }catch(error){syncMessage(error.message==='SYNC_LOGIN_REQUIRED'?'สิทธิ์ซิงก์หมดอายุ กรุณาเข้าใช้งานใหม่ / Sync session expired; sign in again':'ซิงก์ไม่สำเร็จ ข้อมูลในเครื่องยังอยู่ จะลองใหม่อัตโนมัติ / Sync failed; local data retained. Retrying automatically.');}
 finally{clearTimeout(timer);dieSyncBusy=false;}
}
setInterval(()=>void syncDieNow(),30000);
window.addEventListener('online',()=>void syncDieNow());
window.addEventListener('focus',()=>void syncDieNow());
document.addEventListener('visibilitychange',()=>{if(!document.hidden)void syncDieNow();});
const originalQueueDieBackup=queueDieBackup;
queueDieBackup=function(){originalQueueDieBackup();setTimeout(()=>void syncDieNow(),0);};
void syncDieNow();
