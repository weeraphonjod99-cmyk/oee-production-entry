let repairPhotos=[],repairPhotosBusy=false;
const photoSafe=p=>p&&typeof p.data==='string'&&/^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(p.data);
function repairPhotoCells(record){
 return (record.photos||[]).filter(photoSafe).map((p,i)=>'<button type="button" class="repair-thumb secondary" data-repair-photo="'+esc(record.id)+'" data-photo-index="'+i+'" aria-label="ดูรูปการซ่อม / View repair photo '+(i+1)+'"><img src="'+p.data+'" alt="'+esc(p.name||'รูปการซ่อม / Repair photo')+'" loading="lazy"></button>').join('')||'<span class="muted">ไม่มีรูป / No photos</span>';
}
function showRepairPreview(){
 $('repairPhotoPreview').innerHTML=repairPhotos.map((p,i)=>'<div class="repair-preview"><img src="'+p.data+'" alt="'+esc(p.name)+'"><span>'+esc(p.name)+'</span><button type="button" class="secondary" data-remove-photo="'+i+'">ลบรูป / Remove</button></div>').join('');
}
async function prepareRepairPhoto(file){
 if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('ใช้รูป JPG, PNG หรือ WebP / Use JPG, PNG or WebP');
 if(file.size>10*1024*1024)throw Error('รูปต้นฉบับต้องไม่เกิน 10 MB / Original image must not exceed 10 MB');
 const bitmap=await createImageBitmap(file);
 try{
  let scale=Math.min(1,1280/Math.max(bitmap.width,bitmap.height)),result='';
  for(let attempt=0;attempt<6;attempt++){
   const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
   const context=canvas.getContext('2d');context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(bitmap,0,0,canvas.width,canvas.height);
   result=canvas.toDataURL('image/jpeg',.76);
   if(result.length<=110000)return {name:file.name,data:result};
   scale*=.75;
  }
  throw Error('รูปนี้มีขนาดใหญ่เกินไปหลังย่อ / Image remains too large');
 }finally{bitmap.close();}
}
$('repairPhotoInput').addEventListener('change',async event=>{
 if(repairPhotosBusy)return;
 const files=Array.from(event.target.files||[]);event.target.value='';
 if(repairPhotos.length+files.length>3){$('repairPhotoStatus').textContent='แนบได้สูงสุด 3 รูปต่อรายการ / Maximum 3 photos per repair';return;}
 repairPhotosBusy=true;$('repairSubmit').disabled=true;$('repairPhotoInput').disabled=true;
 $('repairPhotoStatus').textContent='กำลังย่อรูป / Compressing photos…';
 try{const next=await Promise.all(files.map(prepareRepairPhoto));repairPhotos.push(...next);showRepairPreview();$('repairPhotoStatus').textContent='พร้อมบันทึก '+repairPhotos.length+' รูป / Photos ready: '+repairPhotos.length;}
 catch(error){$('repairPhotoStatus').textContent=error.message;}
 finally{repairPhotosBusy=false;$('repairSubmit').disabled=false;$('repairPhotoInput').disabled=false;}
});
$('repairPhotoPreview').addEventListener('click',event=>{const button=event.target.closest('[data-remove-photo]');if(!button)return;repairPhotos.splice(Number(button.dataset.removePhoto),1);showRepairPreview();$('repairPhotoStatus').textContent='รูปที่เลือก / Selected: '+repairPhotos.length;});
$('repairRows').addEventListener('click',event=>{
 const button=event.target.closest('[data-repair-photo]');if(!button)return;
 const record=db.repairs.find(r=>r.id===button.dataset.repairPhoto),photo=record?.photos?.[Number(button.dataset.photoIndex)];
 if(!photoSafe(photo))return;
 $('repairPhotoFull').src=photo.data;$('repairPhotoFull').alt=photo.name||'Repair photo';$('repairPhotoCaption').textContent=photo.name||'รูปการซ่อม / Repair photo';$('repairPhotoDialog').showModal();
});
$('repairPhotoClose').addEventListener('click',()=>$('repairPhotoDialog').close());
$('repairForm').addEventListener('submit',event=>{
 event.preventDefault();if(repairPhotosBusy)return;
 const form=event.target,o=formObj(form);
 if(!die(o.dieId))return alert('เลือกแม่พิมพ์ / Select die');
 for(const k of ['downtime','cost']){o[k]=Number(o[k]);if(!Number.isFinite(o[k])||o[k]<0)return alert('ตัวเลขต้องไม่ติดลบ / Numbers must be non-negative');}
 if(o.status==='เสร็จสิ้น / Closed'&&(!o.action.trim()||!repairPhotos.some(photoSafe)))return alert('ต้องมีรายงานการแก้ไขและรูปก่อนปิดงาน / Repair report and photo required to close');
 o.id=uid();o.photos=repairPhotos.map(p=>({...p}));
 const next={...db,repairs:[...db.repairs,o]},serialized=JSON.stringify(next);
 if(serialized.length>1900000){$('repairPhotoStatus').textContent='ข้อมูลเกินขนาดสำรอง Google Sheet กรุณาลดจำนวนรูปหรือขอเพิ่มพื้นที่ / Google Sheet backup limit reached. Reduce photos or request expanded storage.';return;}
 try{localStorage.setItem(KEY,serialized);}catch{$('repairPhotoStatus').textContent='พื้นที่เต็ม บันทึกไม่สำเร็จ แบบฟอร์มและรูปยังอยู่ / Storage full; form and photos retained.';return;}
 db=next;repairPhotos=[];resetDate(form);showRepairPreview();$('repairPhotoStatus').textContent='บันทึกข้อมูลและรูปแล้ว / Record and photos saved';render();queueDieBackup();
});
render();
