import type { ProductionLog } from '../types';
import { downtimeFields } from './metrics';

export const searchPartKey = (l: ProductionLog) => JSON.stringify([l.partNo || l.productName, l.step || '']);
export const sheetNumber = (v: unknown) => Number.isFinite(Number(v)) ? Number(v) : 0;
// This search is a ledger view: preserve the sheet's recorded downtime,
// including meeting/break minutes, without the dashboard's break deduction.
export const recordedStop = (l: ProductionLog) => downtimeFields.reduce((s,f)=>s+sheetNumber(l[f.key]),0);
export type SearchFilters = {machine:string;part:string;from:string;to:string;shift:string;query:string};
export function searchProduction(logs:ProductionLog[], f:SearchFilters) {
  const q=f.query.trim().toLocaleLowerCase();
  if(f.from && f.to && f.from>f.to) return [];
  return logs.filter(l=>(!f.machine || l.machineId===f.machine)&&(!f.part || searchPartKey(l)===f.part)&&(!f.from || l.date>=f.from)&&(!f.to || l.date<=f.to)&&(!f.shift || l.shift===f.shift)&&(!q || [l.machineName,l.productName,l.partNo,l.productionOrderNo,l.entryUser,l.note].join(' ').toLocaleLowerCase().includes(q))).sort((a,b)=>b.date.localeCompare(a.date)||a.machineName.localeCompare(b.machineName));
}
export function productionSearchSummary(logs:ProductionLog[], group:'date'|'machine'|'part', match?: (l:ProductionLog)=>{rate:number|null}) {
  const map=new Map<string,{label:string;output:number;run:number;stop:number;count:number;target:number;minutes:number;eligible:number}>();
  for(const l of logs){
    const key=group==='date'?l.date:group==='machine'?l.machineId:searchPartKey(l);
    const label=group==='date'?l.date:group==='machine'?l.machineName:`${l.partNo || l.productName} · Step ${l.step || '—'}`;
    const row=map.get(key)||{label,output:0,run:0,stop:0,count:0,target:0,minutes:0,eligible:0};
    const minutes=Number(l.normalMinutes)+recordedStop(l),rate=match?.(l).rate;
    const valid=[l.normalMinutes,...downtimeFields.map(f=>l[f.key]??0)].every(v=>Number.isFinite(Number(v))&&Number(v)>=0)&&minutes>0&&minutes<=1440;
    if(rate!=null&&valid){row.target+=rate*minutes;row.minutes+=minutes;row.eligible++;}
    row.output+=sheetNumber(l.goodQty)+sheetNumber(l.ngQty)+sheetNumber(l.testQty);
    row.run+=sheetNumber(l.normalMinutes);row.stop+=recordedStop(l);row.count++;map.set(key,row);
  }
  return [...map.values()].sort((a,b)=>group==='date'?a.label.localeCompare(b.label):b.output-a.output);
}
