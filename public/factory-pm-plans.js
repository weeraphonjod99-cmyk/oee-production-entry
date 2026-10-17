import {mountPlanEditor} from './machine-maintenance-plan.js?v=machine-zip-20261017';
export const factoryMenus=[['factory1-bending','โรง 1 • เครื่องพับ / Bending'],['factory1-riveting','โรง 1 • เครื่องย้ำหมุด / Riveting'],['factory1-stamping','โรง 1 • เครื่องปั๊ม / Stamping'],['factory1-walding','โรง 1 • เครื่องเชื่อม / Welding']].map(([id,name])=>({id,name}));
export async function mountFactoryPlans(host,id){
 const root=document.createElement('div');root.className='factory-pm';host.append(root);
 try{const r=await fetch('./'+id+'.json?v=machine-zip-20261017');if(!r.ok)throw Error('โหลดข้อมูลไม่สำเร็จ');const group=await r.json();if(!root.isConnected)return;
 const note=document.createElement('p');note.textContent='แผนจาก Machine โรง1.zip • เลือกปีเพื่อดูและแก้ไขข้อมูล • ใช้แทนชุด PM Machine Month โรง1.zip';
 const label=document.createElement('label');label.textContent='เลือกปีแผน / Plan Year';const select=document.createElement('select');select.setAttribute('aria-label','เลือกปีแผน / Plan Year');
 for(const d of group.documents){const o=document.createElement('option');o.value=d.id;o.textContent=d.year+' • '+d.sourceSheet+' • '+d.rows.length+' รายการ';select.append(o)}
 select.value=[...group.documents].sort((a,b)=>Number(b.year)-Number(a.year))[0].id;label.append(select);const panel=document.createElement('div');root.append(note,label,panel);
 function render(){panel.replaceChildren();const d=group.documents.find(d=>d.id===select.value);mountPlanEditor(panel,'machine-zip-v1:'+d.id,d)}select.onchange=render;render();
 }catch(e){root.textContent='โหลดแผนไม่สำเร็จ กรุณาเปิดเมนูใหม่ • '+e.message;}
}
