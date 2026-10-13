import registry from '../data/equipmentRegistry.json';
import './stamping-machine-photo.css';

// OEE press numbers 1–13 correspond to the equipment register's Y1–Y13.
// Explicit names prevent a similarly numbered feeder or another machine group
// from receiving a press photo.
const pressNames = ['1# OCP-80T','2# MHS-80T','3# OCP-110T','4# SN1-110T','5# OCP-110T','6# STD-150T','7# GTX-300T','8# GTX-500T','9# OCP-110T','10# OCP-260 T','11# 200T','12# 200T','13# 110T'];
const normalize=(name:string)=>name.replace(/\s/g,'').toUpperCase();
export function StampingMachinePhoto({name}:{name:string}) {
 const index=pressNames.findIndex(n=>normalize(n)===normalize(name));
 if(index<0)return null;
 const equipment=registry.records.find(r=>r.group==='Stamping equipment'&&r.equipmentNumber===`Y${index+1}`);
 if(!equipment)return null;
 const photo=equipment.images.find(p=>p.sourceColumn==='N')||equipment.images[0];
 return <span className="press-photo-block">
  {photo&&<img src={`${import.meta.env.BASE_URL}${photo.src}`} alt={`เครื่องปั๊ม ${name} · ${equipment.equipmentNumber} · ${equipment.model}`} loading="lazy" decoding="async" width={photo.width} height={photo.height}/>}
  <span className="press-full-name">เครื่องปั๊ม {equipment.equipmentNumber} · {equipment.manufacturer}</span>
  <span className="press-model">รุ่น {equipment.model}</span>
 </span>;
}
