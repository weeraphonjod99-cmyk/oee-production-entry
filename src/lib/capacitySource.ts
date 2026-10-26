import type {ProductionCapacityData} from './api';
import {CAPACITY_SHEET_ID,readCapacityWorkbook} from './capacityWorkbook';
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
 publish({loading:true});
 pending=(async()=>{
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),45000);
  try{
   const url=`https://docs.google.com/spreadsheets/d/${CAPACITY_SHEET_ID}/export?format=xlsx&_=${Date.now()}`;
   const response=await fetch(url,{cache:'no-store',credentials:'omit',signal:controller.signal});
   if(!response.ok)throw new Error('HTTP '+response.status);
   const buffer=await response.arrayBuffer();if(buffer.byteLength>20_000_000)throw new Error('Workbook too large');
   const data=readCapacityWorkbook(new Uint8Array(buffer));lastSuccess=Date.now();publish({data,error:'',loading:false});return data;
  }catch(error){const message='โหลดกำลังผลิตจากชีตใหม่ไม่สำเร็จ / New capacity sheet refresh failed';publish({error:message,loading:false});throw new Error(message,{cause:error});}
  finally{clearTimeout(timeout);pending=null;}
 })();return pending;
}
