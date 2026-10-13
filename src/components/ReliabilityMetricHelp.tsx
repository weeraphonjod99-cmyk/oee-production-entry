import {useEffect,useId,useRef,useState} from 'react';

export function ReliabilityMetricHelp({metric}:{metric:'MTTR'|'MTBF'}){
 const [open,setOpen]=useState(false),id=useId(),root=useRef<HTMLSpanElement>(null);
 useEffect(()=>{
  if(!open)return;
  const outside=(event:PointerEvent)=>{if(!root.current?.contains(event.target as Node))setOpen(false);};
  const escape=(event:KeyboardEvent)=>{if(event.key==='Escape')setOpen(false);};
  document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);
  return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};
 },[open]);
 return <span className="mtbf-help" ref={root} onPointerEnter={e=>{if(e.pointerType==='mouse')setOpen(true);}} onPointerLeave={e=>{if(e.pointerType==='mouse')setOpen(false);}}>
  <button type="button" className="mtbf-help-trigger" aria-describedby={open?id:undefined} onFocus={()=>setOpen(true)} onBlur={()=>setOpen(false)} onClick={()=>setOpen(true)}>{metric==='MTTR'?'เวลาเฉลี่ยในการซ่อม / MTTR':'เวลาเดินเครื่องเฉลี่ยระหว่างการขัดข้อง / MTBF'}</button>
  {open&&<span id={id} role="tooltip" className="mtbf-help-popup">
   <b>{metric==='MTTR'?'MTTR — Mean Time To Repair':'MTBF — Mean Time Between Failures'}</b>
   <span lang="th">{metric==='MTTR'?'เวลาเฉลี่ยที่ใช้ซ่อมให้กลับมาทำงานได้ ค่ายิ่งต่ำยิ่งซ่อมได้เร็ว สูตร: เวลาซ่อมรวม ÷ จำนวนครั้งซ่อม':'เวลาเดินเครื่องเฉลี่ยระหว่างการขัดข้อง ค่ายิ่งสูงยิ่งเดินเครื่องได้นานก่อนขัดข้อง สูตร: เวลาผลิตปกติรวม ÷ จำนวนครั้งขัดข้อง'}</span>
   <span lang="en">{metric==='MTTR'?'Average time to restore operation. Lower means faster repair. Total repair time ÷ repair count.':'Average operating time between failures. Higher means longer operation between failures. Total run time ÷ failure count.'}</span>
   <span>{metric==='MTTR'?'ตัวอย่าง / Example: 60 นาที / min ÷ 2 ครั้ง / repairs = 30 นาที/ครั้ง / min per repair':'ตัวอย่าง / Example: 480 นาที / min ÷ 2 ครั้ง / failures = 240 นาที/ครั้ง / min per failure'}</span>
  </span>}
 </span>;
}
