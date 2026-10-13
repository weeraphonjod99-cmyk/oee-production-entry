import registry from '../data/equipmentRegistry.json';
import './stamping-machine-photo.css';

// OEE press numbers 1–13 correspond to the equipment register's Y1–Y13.
// Explicit names prevent a similarly numbered feeder or another machine group
// from receiving a press photo.
const pressNames = ['1# OCP-80T','2# MHS-80T','3# OCP-110T','4# SN1-110T','5# OCP-110T','6# STD-150T','7# GTX-300T','8# GTX-500T','9# OCP-110T','10# OCP-260 T','11# 200T','12# 200T','13# 110T'];
const normalize=(name:string)=>name.replace(/\s/g,'').toUpperCase();
export function StampingMachinePhoto({name}:{name:string}) {
 const index=pressNames.findIndex(n=>normalize(n)===normalize(name));
 const otherMachines:Record<string,[string,string,string]>={
  'BENDING#1':['Bending','BD1','เครื่องพับ'], 'BENDING#2':['Bending','BD2','เครื่องพับ'],
  'SW1#SPOT':['Spot welding machine','SW1','เครื่องเชื่อม'],
  'SW#2SPOT':['Spot welding machine','SW2','เครื่องเชื่อม'],
  'SW#3SPOT':['Spot welding machine','SW3','เครื่องเชื่อม'],
  'SW4NMS':['Spot welding machine','SW4','เครื่องเชื่อม'],
  'SW5CU':['Spot welding machine','SW5','เครื่องเชื่อม'],
  'SW6NLC':['Spot welding machine','SW6','เครื่องเชื่อม'],
  'SW7LC600':['Spot welding machine','SW7','เครื่องเชื่อม'],
  'SW8DOORLC':['Spot welding machine','SW8','เครื่องเชื่อม'],
  '#1RW':['Robot welding','RW1','หุ่นยนต์เชื่อม'],
  '#2RW':['Robot welding','RW2','หุ่นยนต์เชื่อม'],
  '#3RW':['Robot welding','RW3','หุ่นยนต์เชื่อม'],
 };
 const cnc=/^CNC-C([1-8])$/.exec(normalize(name));
 const match=index>=0?['Stamping equipment',`Y${index+1}`,'เครื่องปั๊ม']:cnc?['CNC,Airtight',`C${cnc[1]}`,'เครื่อง CNC']:otherMachines[normalize(name)];
 if(!match)return null;
 const [group,code,label]=match;
 const equipment=registry.records.find(r=>r.group===group&&r.equipmentNumber===code);
 if(!equipment)return null;
 const photo=equipment.images.find(p=>p.sourceColumn==='N')||equipment.images[0];
 return <span className="press-photo-block">
  {photo&&<img src={`${import.meta.env.BASE_URL}${photo.src}`} alt={`${label} ${name} · ${equipment.equipmentNumber} · ${equipment.model}`} loading="lazy" decoding="async" width={photo.width} height={photo.height}/>}
  <span className="press-full-name">{label} {equipment.equipmentNumber} · {equipment.manufacturer}</span>
  <span className="press-model">รุ่น {equipment.model}</span>
 </span>;
}
