let maintenanceRows=[];
const maintenanceNotice=document.createElement('div');maintenanceNotice.className='notice';maintenanceNotice.id='maintenanceImportStatus';maintenanceNotice.setAttribute('role','status');maintenanceNotice.textContent='กำลังอ่านรอบ PM / Loading maintenance periods';$('dies').prepend(maintenanceNotice);
function maintenanceStatus(){
 const matched=db.dies.filter(d=>maintenanceMatch(d,maintenanceRows));
 const pending=maintenanceRows.filter(r=>!db.dies.some(d=>{const m=maintenanceMatch(d,maintenanceRows);return m&&maintenanceKey(m.toolingNo)===maintenanceKey(r.toolingNo)&&maintenanceKey(m.partNo)===maintenanceKey(r.partNo)&&m.interval===r.interval;}));
 maintenanceNotice.innerHTML='รอบ PM จาก Tooling_Maintenance_List.xlsx • จับคู่ '+fmt(matched.length)+' รายการทะเบียน / Matched registry entries • ต้นทาง '+fmt(maintenanceRows.length)+' รายการ / Source rows<br>อ้างอิง Tooling No. และรหัสชิ้นงานเมื่อหมายเลขซ้ำ / Matched by tooling number; part resolves duplicate numbers.'+(pending.length?'<details><summary>ยังไม่จับคู่ '+fmt(pending.length)+' รายการต้นทาง / Unmatched source rows</summary><div class="tablewrap"><table><thead><tr><th>แถว / Row</th><th>Tooling No.</th><th>Part / Spec.</th><th>รอบ PM / Period</th></tr></thead><tbody>'+pending.map(r=>'<tr><td>'+r.row+'</td><td>'+esc(r.toolingNo||'ไม่ระบุ / Missing')+'</td><td>'+esc(r.partName)+' • '+esc(r.partNo)+'</td><td>'+fmt(r.interval)+'</td></tr>').join('')+'</tbody></table></div></details>':'');
}
function importMaintenancePeriods(){
 if(!maintenanceRows.length)return;
 if(typeof syncEditing==='function'&&syncEditing())return;
 try{const result=applyMaintenancePeriods(db.dies,maintenanceRows);if(result.updated){const next={...db,dies:result.dies},text=JSON.stringify(next);if(text.length>1900000)throw Error('Backup storage limit');localStorage.setItem(KEY,text);db=next;render();queueDieBackup();}maintenanceStatus();}
 catch(e){maintenanceNotice.textContent='นำเข้ารอบ PM ไม่สำเร็จ ข้อมูลเดิมยังอยู่ / Import failed: '+e.message;}
}
const maintenanceOriginalOpenDie=openDie;
openDie=function(id){maintenanceOriginalOpenDie(id);const d=die(id),locked=!!(d?.toolingSource||d?.maintenancePeriodSource);$('dieForm').elements.dieNo.readOnly=locked;$('dieForm').elements.dieNo.title=locked?'ล็อกหมายเลขตามทะเบียน / Tooling number locked to register':'';};
$('dieForm').addEventListener('submit',e=>{const d=die(e.target.elements.id.value);if((d?.toolingSource||d?.maintenancePeriodSource)&&e.target.elements.dieNo.value!==d.dieNo){e.preventDefault();e.stopImmediatePropagation();alert('ไม่สามารถเปลี่ยน Tooling No. ที่เชื่อมทะเบียน / Linked tooling number cannot be changed');}},true);
fetch('./maintenance-periods.json?v=20261016').then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json();}).then(rows=>{if(!Array.isArray(rows)||rows.some(r=>!Number.isSafeInteger(r.interval)||r.interval<=0))throw Error('Invalid maintenance periods');maintenanceRows=rows;importMaintenancePeriods();}).catch(e=>{maintenanceNotice.textContent='โหลดรอบ PM ไม่สำเร็จ / Period load failed: '+e.message;});
window.addEventListener('message',()=>setTimeout(importMaintenancePeriods,0));
setInterval(importMaintenancePeriods,15000);
