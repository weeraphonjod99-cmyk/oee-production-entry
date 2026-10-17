const KEY='jrtl_machine_maintenance_menus_v1';
function readMenus(){const raw=localStorage.getItem(KEY);if(!raw)return [];const value=JSON.parse(raw);if(!Array.isArray(value)||!value.every(x=>typeof x.id==='string'&&typeof x.name==='string'))throw Error('ข้อมูลเมนูไม่ถูกต้อง');return value;}
function mountMenus(section){
 if(section.querySelector('.maintenance-menus'))return;
 const root=document.createElement('div');root.className='maintenance-menus';section.append(root);
 let menus=[],active='',loadError='';try{menus=readMenus();active=menus[0]?.id||''}catch{loadError='อ่านข้อมูลเมนูไม่ได้ กรุณาตรวจสอบการจัดเก็บของเบราว์เซอร์';}
 const heading=document.createElement('h3');heading.textContent='เมนูแผนซ่อมบำรุง / Maintenance Plan Menus';
 const add=document.createElement('button');add.type='button';add.textContent='+ เพิ่มเมนู / Add Menu';
 const nav=document.createElement('nav');nav.setAttribute('aria-label','เมนูย่อยแผนซ่อมบำรุง');
 const panel=document.createElement('div');panel.className='maintenance-menu-panel';
 const message=document.createElement('p');message.setAttribute('role','status');
 const note=document.createElement('small');note.textContent='ชื่อเมนูบันทึกในเบราว์เซอร์นี้ / Menu names are saved in this browser.';
 const dialog=document.createElement('dialog');
 const form=document.createElement('form');form.method='dialog';
 const title=document.createElement('h3');const label=document.createElement('label');label.textContent='ชื่อเมนู / Menu Name';
 const input=document.createElement('input');input.required=true;input.maxLength=80;label.append(input);
 const error=document.createElement('p');error.setAttribute('role','alert');
 const save=document.createElement('button');save.type='submit';save.textContent='บันทึก / Save';
 const cancel=document.createElement('button');cancel.type='button';cancel.textContent='ยกเลิก / Cancel';cancel.onclick=()=>dialog.close();
 form.append(title,label,error,save,cancel);dialog.append(form);root.append(heading,add,nav,panel,message,note,dialog);
 let editId=null;
 function open(id){editId=id;title.textContent=id?'แก้ไขชื่อเมนู / Rename Menu':'เพิ่มเมนู / Add Menu';input.value=menus.find(m=>m.id===id)?.name||'';error.textContent='';dialog.showModal();input.focus();}
 function render(){
 nav.replaceChildren();panel.replaceChildren();
 for(const item of menus){const b=document.createElement('button');b.type='button';b.textContent=item.name;b.setAttribute('aria-pressed',String(active===item.id));b.onclick=()=>{active=item.id;render()};nav.append(b);}
 const item=menus.find(m=>m.id===active);
 const h=document.createElement('h4');h.textContent=item?item.name:'ยังไม่มีเมนู — กด “เพิ่มเมนู” เพื่อเริ่มต้น';panel.append(h);
 if(item){const rename=document.createElement('button');rename.type='button';rename.textContent='แก้ไขชื่อ / Rename';rename.onclick=()=>open(item.id);const p=document.createElement('p');p.textContent='ยังไม่มีรายการแผนซ่อมบำรุงในเมนูนี้';panel.append(rename,p);}
 add.disabled=!!loadError;message.textContent=loadError;
 }
 add.onclick=()=>open(null);
 form.onsubmit=e=>{
 e.preventDefault();const name=input.value.trim();if(!name){error.textContent='กรุณากรอกชื่อเมนู';return;}
 try{const latest=readMenus();if(editId&&!latest.some(m=>m.id===editId))throw Error('ไม่พบเมนูที่ต้องการแก้ไข กรุณาเปิดหน้าใหม่');
 if(latest.some(m=>m.id!==editId&&m.name.trim().toLocaleLowerCase()===name.toLocaleLowerCase()))throw Error('มีชื่อเมนูนี้แล้ว กรุณาใช้ชื่ออื่น');
 const id=editId||crypto.randomUUID();const next=editId?latest.map(m=>m.id===id?{...m,name}:m):[...latest,{id,name}];localStorage.setItem(KEY,JSON.stringify(next));menus=next;active=id;dialog.close();render();message.textContent='บันทึกชื่อเมนูแล้ว';
 }catch(err){error.textContent=err.message||'บันทึกไม่สำเร็จ';}
 };
 render();
}
let queued=false;
const update=()=>{document.querySelectorAll('section[aria-label="แผนซ่อมบำรุง / Maintenance Plan"]').forEach(mountMenus)};
new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;update()})}).observe(document.getElementById('root'),{subtree:true,childList:true});update();

