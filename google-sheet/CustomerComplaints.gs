/** Customer complaints: authenticated append-only revisions in Google Sheet. */
function customerComplaints_(p){
 var user=requireDieSyncUser_(p&&p.token),lock=LockService.getScriptLock();lock.waitLock(30000);
 try{
  var sheet=ensureSheet('customer_complaints',['id','revision','updated_at','updated_by','json']);
  var all=sheet.getLastRow()>1?sheet.getRange(2,1,sheet.getLastRow()-1,5).getValues():[],map={};
  var pieces={};all.forEach(function(r){var key=r[0]+'@'+r[1];if(!pieces[key])pieces[key]=[];pieces[key].push(String(r[4]).slice(5));});Object.keys(pieces).forEach(function(key){var c=JSON.parse(pieces[key].join(''));map[c.id]=c;});
  function result(){return {ok:true,cases:Object.keys(map).map(function(k){return map[k];}).sort(function(a,b){return b.createdAt.localeCompare(a.createdAt);})};}
  if(p.op==='list')return result();
  var now=new Date().toISOString(),c,note='',event=p.op;
  function required(value,label){if(typeof value!=='string'||!value.trim()||value.length>5000)throw Error('กรุณาระบุ '+label);return value.trim();}
  if(p.op==='create'){
   var r=p.record||{};if(!/^[a-zA-Z0-9-]{8,100}$/.test(r.id||''))throw Error('Invalid id');
   if(map[r.id])return result();
   c={id:r.id,revision:0,createdAt:now,createdBy:user.username,status:'เปิดใหม่',history:[]};
   ['customer','part','problem','occurredAt','due','team','owner','priority'].forEach(function(k){c[k]=required(r[k],k);});
   if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(c.occurredAt)||!/^\d{4}-\d{2}-\d{2}$/.test(c.due))throw Error('วันที่ไม่ถูกต้อง');
   if(c.due<c.occurredAt.slice(0,10))throw Error('กำหนดเสร็จต้องไม่ก่อนวันที่พบปัญหา');
   var owner=getUserRows().map(function(r){return r.user;}).find(function(u){return u.username===c.owner&&u.active!==false;});if(!owner)throw Error('ไม่พบ Username ผู้รับผิดชอบที่ใช้งานอยู่');
   c.photos=r.photos||[];if(!Array.isArray(c.photos)||c.photos.length>3)throw Error('แนบได้สูงสุด 3 รูป');c.photos=c.photos.map(function(photo){if(!photo||typeof photo.data!=='string'||photo.data.length>90000||!/^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/=]+$/.test(photo.data))throw Error('ข้อมูลรูปภาพไม่ถูกต้อง');return {name:String(photo.name||'photo').slice(0,150),data:photo.data};});
   event='บันทึกและเปิดแผนแก้ไข';
  }else{
   c=map[p.id];if(!c)throw Error('ไม่พบรายการ');if(c.revision!==p.revision)throw Error('รายการถูกแก้ไขโดยผู้ใช้อื่น กรุณาอัปเดตข้อมูลแล้วตรวจอีกครั้ง');
   if(c.status==='ปิดแล้ว')throw Error('รายการปิดแล้ว ไม่สามารถเปลี่ยนผลย้อนหลัง');
   if(p.op==='start'||p.op==='respond'){
    if(user.role!=='admin'&&user.username!==c.owner)throw Error('เฉพาะผู้รับผิดชอบหรือ Admin');
    if(p.op==='start'){if(c.status==='รอตรวจสอบ')throw Error('รายการอยู่ระหว่างตรวจสอบ');c.status='กำลังแก้ไข';event='รับงาน';}
    else{var response=p.response||{};['containment','rootCause','action','response','evidence'].forEach(function(k){c[k]=required(response[k],k);});if(!/^https:\/\//i.test(c.evidence))throw Error('หลักฐานต้องเป็นลิงก์ HTTPS');c.status='รอตรวจสอบ';c.respondedBy=user.username;event='ส่งคำตอบและหลักฐาน';note=c.response;}
   }else if(p.op==='review'){
    if(['admin','qc'].indexOf(user.role)<0)throw Error('เฉพาะ QC / Admin ตรวจรับได้');
    if(c.status!=='รอตรวจสอบ'||!c.evidence||!c.response)throw Error('ต้องมีคำตอบและเอกสารส่งตรวจก่อน');
    c.review=required(p.review,'ผลตรวจสอบ');c.reviewedBy=user.username;note=c.review;
    if(p.decision==='close'){c.status='ปิดแล้ว';c.closedAt=now;event='ตรวจผ่านและปิดปัญหา';}
    else if(p.decision==='return'){c.status='ส่งกลับแก้ไข';event='ส่งกลับแก้ไข';}else throw Error('Invalid decision');
   }else throw Error('Unknown operation');
  }
  c.revision++;c.history.push({at:now,by:user.username,event:event,note:note});
  var json=JSON.stringify(c);if(json.length>350000)throw Error('ประวัติรายการมีขนาดเกินขีดจำกัด กรุณาติดต่อผู้ดูแล');
  var writeRows=[];for(var pos=0;pos<json.length;pos+=40000)writeRows.push([c.id,c.revision,now,user.username,'json:'+json.slice(pos,pos+40000)]);sheet.getRange(sheet.getLastRow()+1,1,writeRows.length,5).setValues(writeRows);SpreadsheetApp.flush();map[c.id]=c;return result();
 }finally{lock.releaseLock();}
}
