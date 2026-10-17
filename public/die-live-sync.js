const DIE_SYNC_KEY=KEY+'_shared_base_v1';
let dieSyncBase=null,dieSyncBusy=false,dieSyncDirty=new Set(),dieSyncRenderPending=false;
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
 let session;try{session=JSON.parse(localStorage.getItem('oee-production-session-v1')||'null');}catch{}
 if(!session?.dieSyncToken){syncMessage('กรุณาออกจากระบบแล้วเข้าใหม่หนึ่งครั้งเพื่อเปิดซิงก์ร่วมกัน / Sign out and sign in once to enable shared sync.');return;}
 dieSyncBusy=true;const sent=canonicalDieData(db),controller=new AbortController(),timer=setTimeout(()=>controller.abort(),45000);
 try{
  const response=await fetch(DIE_BACKUP_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'syncDieMaintenance',payload:{token:session.dieSyncToken,base:dieSyncBase,data:sent}}),signal:controller.signal});
  const result=await response.json();
  if(result.conflict){syncMessage('มีข้อมูลแก้ไขชนกัน ข้อมูลในเครื่องยังอยู่ กรุณาส่งออก JSON และตรวจรายการร่วมกับผู้ดูแล / Conflicting edits; local data retained. Export JSON and review with administrator.');return;}
  if(!response.ok||!result.ok)throw Error(result.error||'Sync failed');
  if(!result.data||!['dies','shots','checks','repairs'].every(k=>Array.isArray(result.data[k])))throw Error('Invalid response');
  const merged=mergeDieData(result.data,sent,canonicalDieData(db));
  if(merged.conflicts.length)throw Error('Changes during sync; retry');
  // Persist before updating the visible data; pending local edits are merged against the sent snapshot.
  localStorage.setItem(KEY,JSON.stringify(merged.data));localStorage.setItem(DIE_SYNC_KEY,JSON.stringify(result.data));
  const changed=JSON.stringify(canonicalDieData(db))!==JSON.stringify(merged.data);
  db=merged.data;dieSyncBase=result.data;
  if(changed){
   // Draft form values belong to the user; update totals without rebuilding selects.
   if(syncEditing()){
    renderSummary();
    $('kTotal').textContent=fmt(db.dies.length);
    $('kDue').textContent=fmt(db.dies.filter(d=>state(d).status==='due').length);
    $('kNear').textContent=fmt(db.dies.filter(d=>state(d).status==='near').length);
    $('kRepair').textContent=fmt(db.repairs.length);
    dieSyncRenderPending=true;
   }else{render();dieSyncRenderPending=false;}
  }
  syncMessage((changed?'อัปเดตยอดล่าสุดแล้ว • ':'ข้อมูลเป็นปัจจุบัน • ')+'ตรวจยอดร่วมกันทุก 10 วินาที • ล่าสุด '+new Date().toLocaleTimeString('th-TH')+(syncEditing()?' • เก็บข้อมูลที่กำลังกรอกไว้':''));
 }catch(error){syncMessage(error.message==='SYNC_LOGIN_REQUIRED'?'สิทธิ์ซิงก์หมดอายุ กรุณาเข้าใช้งานใหม่ / Sync session expired; sign in again':'ซิงก์ไม่สำเร็จ ข้อมูลในเครื่องยังอยู่ จะลองใหม่อัตโนมัติ / Sync failed; local data retained. Retrying automatically.');}
 finally{clearTimeout(timer);dieSyncBusy=false;}
}
setInterval(()=>void syncDieNow(),10000);
window.addEventListener('online',()=>void syncDieNow());
window.addEventListener('focus',()=>void syncDieNow());
document.addEventListener('visibilitychange',()=>{if(!document.hidden)void syncDieNow();});
const originalQueueDieBackup=queueDieBackup;
queueDieBackup=function(){originalQueueDieBackup();setTimeout(()=>void syncDieNow(),0);};
void syncDieNow();

function finishDieSyncDraft(){
 setTimeout(()=>{if(!syncEditing()){
  if(dieSyncRenderPending){render();dieSyncRenderPending=false;}
  void syncDieNow();
 }},0);
}
document.addEventListener('reset',finishDieSyncDraft,true);
$('dieDialog').addEventListener('close',finishDieSyncDraft);
window.addEventListener('storage',e=>{
 if(e.key==='oee-production-session-v1')void syncDieNow();
});
