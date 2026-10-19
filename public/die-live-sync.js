const DIE_SYNC_KEY=KEY+'_shared_base_v1';
let dieSyncBase=null,dieSyncBusy=false,dieSyncDirty=new Set(),dieSyncRenderPending=false;
try{dieSyncBase=JSON.parse(localStorage.getItem(DIE_SYNC_KEY)||'null');}catch{}
const syncBanner=document.createElement('div');syncBanner.className='notice';syncBanner.id='dieLiveSyncStatus';syncBanner.setAttribute('role','status');$('toolingSyncStatus').after(syncBanner);
function syncMessage(text){syncBanner.textContent=text;}
const syncLogin=document.createElement('form');
syncLogin.className='notice';syncLogin.hidden=true;
syncLogin.innerHTML='<strong>เชื่อมยอดร่วม Google Sheet / Connect shared data</strong><p>ยืนยันบัญชีแอปเดิมเพื่อส่งยอดที่ค้างและโหลดข้อมูลร่วม โดยเก็บข้อมูลในเครื่องไว้</p><label>ชื่อผู้ใช้ / Username <input name="username" autocomplete="username" required></label><label>รหัสผ่าน / Password <input name="password" type="password" autocomplete="current-password" required></label><button type="submit">เชื่อมต่อและโหลดข้อมูล / Connect & sync</button><p role="status" class="sync-login-message"></p>';
syncBanner.after(syncLogin);
function showSyncLogin(session){syncLogin.hidden=false;if(session?.username){syncLogin.elements.username.value=session.username;syncLogin.elements.username.readOnly=true;}}
syncLogin.addEventListener('submit',async e=>{
 e.preventDefault();const button=syncLogin.querySelector('button'),message=syncLogin.querySelector('.sync-login-message');
 if(button.disabled)return;button.disabled=true;message.textContent='กำลังยืนยันบัญชี…';
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),45000);
 try{
  const bytes=new TextEncoder().encode(syncLogin.elements.password.value);
  syncLogin.elements.password.value='';
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  const passwordHash=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
  const response=await fetch(DIE_BACKUP_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'signIn',payload:{username:syncLogin.elements.username.value.trim().toLowerCase(),passwordHash}}),signal:controller.signal});
  const result=await response.json();
  if(!response.ok||!result.ok||!result.session)throw Error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง หรือบริการเข้าใช้งานไม่พร้อม');
  if(!result.session.dieSyncToken)throw Error('เซิร์ฟเวอร์ยังไม่ออกสิทธิ์ซิงก์ ต้องอัปเดต Apps Script ก่อน');
  localStorage.setItem('oee-production-session-v1',JSON.stringify(result.session));
  dieSyncDirty.delete(syncLogin);syncLogin.hidden=true;message.textContent='';
  await syncDieNow();
 }catch(error){message.textContent=error.name==='AbortError'?'เชื่อมต่อหมดเวลา กรุณาลองอีกครั้ง':error.message;}
 finally{clearTimeout(timer);button.disabled=false;}
});
document.addEventListener('input',e=>{if(e.target.form)dieSyncDirty.add(e.target.form);},true);
document.addEventListener('change',e=>{if(e.target.form)dieSyncDirty.add(e.target.form);},true);
document.addEventListener('reset',e=>dieSyncDirty.delete(e.target),true);
$('dieDialog').addEventListener('close',()=>dieSyncDirty.delete($('dieForm')));
function syncEditing(){return dieSyncDirty.size>0||!!document.querySelector('dialog[open]');}
async function syncDieNow(){
 if(dieSyncBusy||document.hidden)return;
 let session;try{session=JSON.parse(localStorage.getItem('oee-production-session-v1')||'null');}catch{}
 if(!session?.dieSyncToken){syncMessage('ยังไม่เชื่อมยอดร่วม Google Sheet — กรุณายืนยันบัญชีด้านล่าง / Shared sync needs sign-in');showSyncLogin(session);return;}
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
 }catch(error){if(error.message==='SYNC_LOGIN_REQUIRED')showSyncLogin(session);syncMessage(error.message==='SYNC_LOGIN_REQUIRED'?'สิทธิ์ซิงก์หมดอายุ กรุณาเข้าใช้งานใหม่ / Sync session expired; sign in again':'ซิงก์ไม่สำเร็จ ข้อมูลในเครื่องยังอยู่ จะลองใหม่อัตโนมัติ / Sync failed; local data retained. Retrying automatically.');}
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
