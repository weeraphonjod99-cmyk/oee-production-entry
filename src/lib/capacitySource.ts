import type {ProductionCapacityData} from './api';
import {CAPACITY_SHEET_ID,CAPACITY_SHEET_URL} from './capacityWorkbook';
const APPS_SCRIPT_URL=(import.meta.env.VITE_APPS_SCRIPT_URL||'').trim();
type SourceState={data:ProductionCapacityData|null;loading:boolean;error:string};
let state:SourceState={data:null,loading:false,error:''};
const listeners=new Set<()=>void>();
const publish=(patch:Partial<SourceState>)=>{state={...state,...patch};listeners.forEach(l=>l());};
export const subscribeCapacity=(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener);};};
export const capacitySnapshot=()=>state;
let pending:Promise<ProductionCapacityData>|null=null,lastSuccess=0;
export function fetchCurrentCapacity():Promise<ProductionCapacityData>{
 if(pending)return pending;
 if(state.data&&Date.now()-lastSuccess<8000)return Promise.resolve(state.data);
 publish({loading:!state.data});
 pending=(async()=>{
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),45000);
  try{
   if(!APPS_SCRIPT_URL)throw new Error('Production data endpoint is not configured');
   const url=new URL(APPS_SCRIPT_URL);url.searchParams.set('action','productionCapacity');url.searchParams.set('_',String(Date.now()));
   const response=await fetch(url.toString(),{cache:'no-store',signal:controller.signal});
   if(!response.ok)throw new Error('HTTP '+response.status);
   const payload=await response.json() as {ok?:boolean;capacity?:ProductionCapacityData;error?:string};
   if(payload.ok!==true||!payload.capacity||!Array.isArray(payload.capacity.machines)||!payload.capacity.machines.every(m=>Array.isArray(m.records))||!payload.capacity.machines.some(m=>m.records.length))throw new Error(payload.error||'Invalid capacity response');
   const data={...payload.capacity,spreadsheetId:CAPACITY_SHEET_ID,spreadsheetUrl:CAPACITY_SHEET_URL,sourceName:'Production Capacity (Google Sheet)',fetchedAt:payload.capacity.fetchedAt||new Date().toISOString()};
   lastSuccess=Date.now();publish({data,error:'',loading:false});return data;
  }catch(error){const detail=error instanceof Error?error.message:String(error);const message=`โหลดกำลังผลิตจากชีตใหม่ไม่สำเร็จ / New capacity sheet refresh failed: ${detail}`;publish({error:message,loading:false});throw new Error(message,{cause:error});}
  finally{clearTimeout(timeout);pending=null;}
 })();return pending;
}
