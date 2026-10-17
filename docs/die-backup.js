
const DIE_BACKUP_URL="https://script.google.com/macros/s/AKfycbz05f1rSaHl73PFVAoOA7T2DCfBwVEcTJ564zrwU2GariZgTkLH3KGbxzSSXtTwgXj6Wg/exec";
const BACKUP_KEY=KEY+'_cloud_v1';
let backupState;try{backupState=JSON.parse(localStorage.getItem(BACKUP_KEY)||'null')}catch{}
if(!backupState||!backupState.clientId)backupState={clientId:crypto.randomUUID(),pending:null,lastAt:''};
let backupBusy=false;
const shotBackupStatus=document.createElement('div');
shotBackupStatus.className='notice';shotBackupStatus.setAttribute('role','status');
document.getElementById('shotForm').append(shotBackupStatus);
function backupMessage(message){
 document.getElementById('backupStatus').textContent=message;
 shotBackupStatus.textContent=message+' • รวมยอดปั๊มในชุดสำรอง Google Sheet / Shot records included in backup';
}
const shotBackupRetry=document.createElement('button');
shotBackupRetry.type='button';shotBackupRetry.className='secondary';
shotBackupRetry.textContent='ส่งข้อมูลไป Google Sheet อีกครั้ง / Retry';
shotBackupRetry.addEventListener('click',()=>{if(backupState.pending)void sendDieBackup();else queueDieBackup();});
document.getElementById('shotForm').append(shotBackupRetry);
function persistBackup(){localStorage.setItem(BACKUP_KEY,JSON.stringify(backupState));}
function queueDieBackup(){
 try{
 backupState.pending={backupId:crypto.randomUUID(),clientId:backupState.clientId,data:JSON.parse(JSON.stringify(db))};
 persistBackup();backupMessage('รอสำรอง Google Sheet / Waiting for Google Sheet backup');void sendDieBackup();
 }catch{backupMessage('บันทึกในเครื่องแล้ว แต่เตรียมสำรองไม่สำเร็จ กรุณาส่งออก JSON / Saved locally; backup queue failed. Export JSON.');}
}
async function sendDieBackup(){
 if(backupBusy||!backupState.pending)return;
 backupBusy=true;
 const item=backupState.pending,controller=new AbortController(),timer=setTimeout(()=>controller.abort(),45000);
 backupMessage('กำลังสำรอง Google Sheet / Backing up to Google Sheet…');
 try{
 const response=await fetch(DIE_BACKUP_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'backupDieMaintenance',payload:item}),signal:controller.signal});
 const result=await response.json();
 if(!response.ok||result.ok!==true||result.backupId!==item.backupId)throw Error('Not acknowledged');
 backupState.lastAt=result.receivedAt;
 if(backupState.pending?.backupId===item.backupId)backupState.pending=null;
 persistBackup();
 backupMessage(backupState.pending?'ยังมีข้อมูลรอสำรอง / More changes pending':'สำรอง Google Sheet สำเร็จ / Backed up: '+new Date(result.receivedAt).toLocaleString('th-TH'));
 }catch{backupMessage('บันทึกในเครื่องแล้ว • รอส่งสำรองอีกครั้ง / Saved locally • Backup pending; will retry');}
 finally{clearTimeout(timer);backupBusy=false;
 // Drain a newer save immediately, but leave failed requests to the retry timer.
 if(backupState.pending && backupState.pending.backupId!==item.backupId)setTimeout(()=>void sendDieBackup(),0);
 }
}
window.addEventListener('online',()=>void sendDieBackup());
setInterval(()=>void sendDieBackup(),30000);
document.getElementById('retryBackup').addEventListener('click',()=>{if(backupState.pending)void sendDieBackup();else queueDieBackup();});
if(backupState.pending)void sendDieBackup();
else if(['dies','shots','checks','repairs'].some(k=>db[k].length)&&!backupState.lastAt)queueDieBackup();
else backupMessage(backupState.lastAt?'สำรองล่าสุด / Last backup: '+new Date(backupState.lastAt).toLocaleString('th-TH'):'พร้อมสำรองเมื่อบันทึก / Ready to back up when saved');
