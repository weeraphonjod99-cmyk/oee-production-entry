export const WELDING_PLAN_ID='welding-maintenance-2026';
export function initialPlan(id){
 const rows=[['SW1','Spot Welding','DTB7 100'],['SW2','Spot Welding','YR-A05C'],['SW3','Spot Welding','YR-A05C'],['SW4','Spot Welding','WL-MFSQ-90K*2'],['SW5','Spot Welding','WL-MFSQ-90K*3'],['SW6','Spot Welding','DTBZ-80'],['SW7','Spot Welding','JW-200'],['SW8','Spot Welding','RSN-100'],['▲RW1','Robot Welding','TM-1400G3'],['▲RW2','Robot Welding','TM-1400G4'],['▲RW3','Robot Spot Welding','YRC1000 SP165'],['RW3-GD','Grinding M/C','MFG745D-6RS1.0-4'],['RW3-WC','Water chiller M/C','DIC030ASH-LE2']];
 return {version:1,title:id===WELDING_PLAN_ID?'Welding Machine Maintenance Plan':'แผนซ่อมบำรุงเครื่องจักร',year:'2026',documentNo:'JRTL-PM-002',rows:id===WELDING_PLAN_ID?rows.map((r,i)=>({id:'welding-'+i,machine:r[0],name:r[1],model:r[2],first:'Once/Day',second:'Once/Month',third:i===8||i===9?'Once/Quarterly':i===10?'Once/year. Suppliers to maintenance and Calibration':'/',months:Array.from({length:12},(_,m)=>({plan:'○',result:m<10&&(i<4||i>=8||m>=6)?'●':''})),calibration:i>=8&&i<=10?'△ ○':'/',calibrationResult:i<8?'/':'',note:''})):[]};
}
const months=['ม.ค. / Jan','ก.พ. / Feb','มี.ค. / Mar','เม.ย. / Apr','พ.ค. / May','มิ.ย. / Jun','ก.ค. / Jul','ส.ค. / Aug','ก.ย. / Sep','ต.ค. / Oct','พ.ย. / Nov','ธ.ค. / Dec'];
const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e};
export function mountPlanEditor(host,id){
 const key='jrtl_machine_plan_v1:'+id;let plan,stored,blocked=false;
 const root=el('div',null,'machine-plan-editor');host.append(root);
 const state=el('p',null,'mp-save-state');state.setAttribute('role','status');
 try{stored=localStorage.getItem(key);plan=stored?JSON.parse(stored):initialPlan(id);if(plan.version!==1||!Array.isArray(plan.rows)||!plan.rows.every(r=>Array.isArray(r.months)&&r.months.length===12))throw Error();}catch{root.append(el('p','อ่านแผนที่บันทึกไม่ได้ จึงหยุดแก้ไขเพื่อป้องกันข้อมูลเดิมถูกทับ'));return;}
 function persist(){
  try{if(blocked)throw Error('ข้อมูลเปลี่ยนจากอีกแท็บ กรุณาเปิดหน้านี้ใหม่ก่อนแก้ไข');if(localStorage.getItem(key)!==stored){blocked=true;throw Error('ข้อมูลเปลี่ยนจากอีกแท็บ กรุณาเปิดหน้านี้ใหม่ก่อนแก้ไข');}const next=JSON.stringify(plan);localStorage.setItem(key,next);stored=next;state.textContent='บันทึกในเบราว์เซอร์แล้ว • '+new Date().toLocaleTimeString('th-TH');state.classList.remove('mp-error');}
  catch(e){state.textContent='ยังไม่ได้บันทึก: '+e.message;state.classList.add('mp-error');}
 }
 function field(value,label,set,multi=false){const input=el(multi?'textarea':'input');input.value=value||'';input.setAttribute('aria-label',label);input.maxLength=multi?600:160;input.addEventListener('input',()=>{set(input.value);persist()});return input;}
 const meta=el('div',null,'mp-meta');
 for(const [key,label] of [['title','ชื่อแผน / Plan Title'],['year','ปี / Year'],['documentNo','เลขที่เอกสาร / Document No.']]){const l=el('label',label);l.append(field(plan[key],label,v=>plan[key]=v));meta.append(l)}
 const note=el('p','นำเข้าจากภาพที่ให้มาเฉพาะ 13 รายการที่มองเห็น • โปรดตรวจสอบรุ่นและสัญลักษณ์กับต้นฉบับก่อนใช้งาน สัญลักษณ์ ○ ● △ คงตามภาพ ไม่ได้ใช้ยืนยันการซ่อมจริง','mp-source-note');
 const storage=el('p','แก้ไขช่องข้อมูลแล้วบันทึกอัตโนมัติในเบราว์เซอร์นี้ ยังไม่ซิงก์กับ Google Sheet หรืออุปกรณ์อื่น','mp-source-note');
 const tools=el('div',null,'mp-actions');const add=el('button','+ เพิ่มเครื่องจักร / Add Machine');add.type='button';add.onclick=()=>{plan.rows.push({id:crypto.randomUUID(),machine:'',name:'',model:'',first:'',second:'',third:'',months:months.map(()=>({plan:'',result:''})),calibration:'',calibrationResult:'',note:''});persist();renderRows()};
 const backup=el('button','ดาวน์โหลดสำรอง JSON / Backup');backup.type='button';backup.onclick=()=>{const u=URL.createObjectURL(new Blob([JSON.stringify(plan,null,2)],{type:'application/json'}));const a=el('a');a.href=u;a.download='machine-maintenance-plan-'+String(plan.year).replace(/[^0-9]/g,'')+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)};tools.append(add,backup);
 const wrap=el('div',null,'mp-table-scroll');wrap.tabIndex=0;wrap.setAttribute('aria-label','ตารางแผนซ่อมบำรุง เลื่อนซ้ายขวาและขึ้นลงได้');const table=el('table'),thead=el('thead'),head=el('tr'),tbody=el('tbody');
 const columns=[['machine','M/C No.'],['name','ชื่อเครื่อง / Name'],['model','รุ่น / Model'],['first','ระดับ 1 / First Level'],['second','ระดับ 2 / Secondary Level'],['third','ระดับ 3 / Third Level']];
 columns.forEach(([,label])=>head.append(el('th',label)));months.forEach(m=>head.append(el('th',m)));head.append(el('th','สอบเทียบประจำปี / Annual Calibration'),el('th','ผลสอบเทียบ / Calibration Result'),el('th','หมายเหตุ / Notes'));thead.append(head);table.append(thead,tbody);wrap.append(table);
 function renderRows(){tbody.replaceChildren();for(const [index,row] of plan.rows.entries()){const tr=el('tr');for(const [key,label] of columns){const td=el('td');td.append(field(row[key],`${label} แถว ${index+1}`,v=>row[key]=v,key==='third'));tr.append(td)}
 row.months.forEach((month,m)=>{const td=el('td',null,'mp-month');for(const [key,label] of [['plan','แผน'],['result','ผล']]){const l=el('label',label);l.append(field(month[key],`${row.machine||index+1} ${months[m]} ${label}`,v=>month[key]=v));td.append(l)}tr.append(td)});
 for(const key of ['calibration','calibrationResult','note']){const td=el('td');td.append(field(row[key],`${key} แถว ${index+1}`,v=>row[key]=v,true));tr.append(td)}tbody.append(tr)}}
 root.append(meta,note,storage,tools,state,el('p','เลื่อนตารางซ้าย–ขวาเพื่อดูครบทุกเดือน / Scroll horizontally for all months'),wrap);renderRows();state.textContent=stored?'เปิดข้อมูลที่บันทึกไว้แล้ว':'ข้อมูลตั้งต้นจากภาพ — ระบบจะบันทึกเมื่อแก้ไข';
}

