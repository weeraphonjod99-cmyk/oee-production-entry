import type {ProductionLog} from '../types';
import {searchPartKey} from './productionSearch';
export type DefectGroup={key:string;label:string;good:number;ng:number;records:number;affected:number;rate:number|null};
export const validDefectQuantity=(v:unknown)=>v!==null&&v!==undefined&&String(v).trim()!==''&&Number.isFinite(Number(v))&&Number(v)>=0;
export const validDefectLog=(l:ProductionLog)=>validDefectQuantity(l.goodQty)&&validDefectQuantity(l.ngQty);
export const defectRate=(good:number,ng:number)=>good+ng>0?ng/(good+ng)*100:null;
export function defectStatistics(logs:ProductionLog[]){
 const valid=logs.filter(validDefectLog);
 const good=valid.reduce((s,l)=>s+Number(l.goodQty),0),ng=valid.reduce((s,l)=>s+Number(l.ngQty),0);
 return {valid,good,ng,total:good+ng,rate:defectRate(good,ng),affected:valid.filter(l=>Number(l.ngQty)>0).length,invalid:logs.length-valid.length};
}
export function groupDefects(logs:ProductionLog[],by:'date'|'machine'|'part'):DefectGroup[]{
 const groups=new Map<string,DefectGroup>();
 for(const l of logs.filter(validDefectLog)){
  const key=by==='date'?l.date:by==='machine'?l.machineId:searchPartKey(l);
  const label=by==='date'?l.date:by==='machine'?l.machineName:`${l.partNo||l.productName} · ${l.productName} · Step ${l.step||'—'}`;
  const row=groups.get(key)||{key,label,good:0,ng:0,records:0,affected:0,rate:null};
  row.good+=Number(l.goodQty);row.ng+=Number(l.ngQty);row.records++;if(Number(l.ngQty)>0)row.affected++;
  row.rate=defectRate(row.good,row.ng);groups.set(key,row);
 }
 return [...groups.values()].sort((a,b)=>by==='date'?a.key.localeCompare(b.key):b.ng-a.ng||a.label.localeCompare(b.label));
}
export function defectCsv(logs:ProductionLog[]){
 const cell=(value:unknown)=>{const s=String(value??'');return '"'+(/^[=+@\-\t\r]/.test(s)?"'"+s:s).replace(/"/g,'""')+'"';};
 const header=['วันที่ / Date','กะ / Shift','เครื่อง / Machine','ชิ้นงาน / Product','รหัส / Part No.','ขั้นตอน / Step','งานดี / Good','งานเสีย / NG','อัตรางานเสีย / NG %','สถานะ / Status','หมายเหตุ / Note'];
 return '\uFEFF'+[header,...logs.map(l=>[l.date,l.shift,l.machineName,l.productName,l.partNo,l.step,l.goodQty,l.ngQty,validDefectLog(l)?defectRate(Number(l.goodQty),Number(l.ngQty))??'':'',validDefectLog(l)?'ข้อมูลครบ / Valid':'ไม่นำมาคำนวณ / Excluded',l.note])].map(r=>r.map(cell).join(',')).join('\r\n');
}
