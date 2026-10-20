import {unzipSync,strFromU8} from 'fflate';
import type {ProductionCapacityData,ProductionCapacityRecord} from './api';
export const CAPACITY_SHEET_ID='1PvNRR9uekifW7O-cmxh78bOWpYMuYhk3VtK76FGy6BE';
export const CAPACITY_SHEET_URL=`https://docs.google.com/spreadsheets/d/${CAPACITY_SHEET_ID}/edit?gid=373536304`;
export type CapacitySheet={name:string;rows:unknown[][]};
const text=(v:unknown)=>String(v??'').trim();
const key=(v:unknown)=>text(v).toLowerCase().replace(/[^a-z0-9]/g,'');
const num=(v:unknown)=>{if(v===null||v===undefined||text(v)==='')return undefined;const n=Number(v);return Number.isFinite(n)&&n>=0?n:undefined;};
const ratio=(v:unknown)=>{const n=Number(text(v).replace('%',''));return n>1?n/100:n;};
export function capacityGroup(name:string){const t=name.trim().toUpperCase(),ton=t.match(/(\d+)\s*T/);if(ton)return ton[1]+'T';for(const g of ['CNC','BENDING','RIVETING','TAPPING','SORTING','RW','SW'])if(t.includes(g))return g;if(/^RV\s*\d/ .test(t))return 'RIVETING';return 'ASSEMBLY';}

export function capacityFromSheets(sheets:CapacitySheet[],fetchedAt=new Date().toISOString()):ProductionCapacityData {
 const machines:ProductionCapacityData['machines']=[];
 for(const sheet of sheets){
  // A formula feed repeats source rows and must never be counted a second time.
  if(sheet.name==='Capacity_KPI_Feed')continue;
  const hi=sheet.rows.slice(0,30).findIndex(r=>r.some(c=>key(c)==='partno')&&r.some(c=>key(c)==='partname'));
  if(hi<0)continue;
  const h=sheet.rows[hi],sub=sheet.rows[hi+1]||[];
  const part=h.findIndex(c=>key(c)==='partno'),name=h.findIndex(c=>key(c)==='partname'),step=h.findIndex(c=>key(c)==='step');
  const rateCol=(pct:number)=>{const start=h.findIndex(c=>Math.abs(ratio(c)-pct)<1e-8);if(start<0)return -1;for(let i=start;i<=start+1;i++)if(key(sub[i])==='speedpcsmin')return i;return -1;};
  const r85=rateCol(.85),r100=rateCol(1);
  if(r85<0||r100<0)throw new Error(`หัวข้อกำลังผลิตเปลี่ยน / Unsupported capacity headings: ${sheet.name}`);
  const targetCol=(hours:string,pct:number)=>{const start=h.findIndex(c=>key(c)===`output${hours}hrpcs`);if(start<0)return -1;for(let i=start;i<start+3;i++)if(Math.abs(ratio(sub[i])-pct)<1e-8)return i;return -1;};
  const typeCol=sub.findIndex(c=>key(c)==='mcton'),noCol=sub.findIndex(c=>key(c)==='mcno');
  const group=capacityGroup(sheet.name),records:ProductionCapacityRecord[]=[];
  for(let i=hi+2;i<sheet.rows.length;i++){
   const row=sheet.rows[i],partNo=text(row[part]),productName=text(row[name]);
   if(!partNo||key(partNo)==='partno'||/^#(REF|N\/A|VALUE|ERROR)/.test(partNo))continue;
   const kpi85PerMinute=num(row[r85]),kpi100PerMinute=num(row[r100]);
   const target=(hours:string,pct:number,minutes:number)=>{const col=targetCol(hours,pct);return col>=0?num(row[col]):(pct===.85?kpi85PerMinute:kpi100PerMinute)===undefined?undefined:(pct===.85?kpi85PerMinute!:kpi100PerMinute!)*minutes;};
   records.push({rowNumber:i+1,sheetName:sheet.name.trim(),machineName:sheet.name.trim(),group,productName,partNo,step:step<0?'':text(row[step]),kpi85PerMinute,kpi100PerMinute,cycleMinutes:kpi100PerMinute?1/kpi100PerMinute:undefined,target8h:target('8',.85,480),target8h100:target('8',1,480),target10_5h:target('105',.85,630),target10_5h100:target('105',1,630),target12_5h:target('125',.85,750),target12_5h100:target('125',1,750),machineType:typeCol<0?'':text(row[typeCol]),machineNo:noCol<0?'':text(row[noCol])});
  }
  const targets=records.map(r=>r.target8h).filter((n):n is number=>n!==undefined),rates=records.map(r=>r.kpi85PerMinute).filter((n):n is number=>n!==undefined);
  const sum=(a:number[])=>a.reduce((s,n)=>s+n,0);
  // Include empty machine sheets so removals in the source replace old rows too.
  machines.push({sheetName:sheet.name.trim(),machineName:sheet.name.trim(),group,rowCount:records.length,partCount:new Set(records.map(r=>r.partNo)).size,avgKpi85PerMinute:rates.length?sum(rates)/rates.length:0,avgTarget8h:targets.length?sum(targets)/targets.length:0,maxTarget8h:Math.max(0,...targets),totalTarget8h:sum(targets),records});
 }
 if(!machines.length)throw new Error('ไม่พบหัวข้อกำลังผลิตในชีตใหม่ / No capacity worksheets found');
 return {spreadsheetId:CAPACITY_SHEET_ID,spreadsheetUrl:CAPACITY_SHEET_URL,sourceName:'Production Capacity (Google Sheet)',gid:'373536304',fetchedAt,groups:[...new Set(machines.map(m=>m.group))],machines,totalRows:machines.reduce((s,m)=>s+m.rowCount,0)};
}

// Read cached numeric formula results from Google's XLSX export; never execute formulas.
// CSV/GViz loses mixed numeric/text part numbers and rounds displayed target values.
export function readCapacityWorkbook(bytes:Uint8Array,parseXml=(s:string)=>new DOMParser().parseFromString(s,'application/xml')){
 let totalBytes=0;
 const files=unzipSync(bytes,{filter:f=>{const wanted=/^xl\/(workbook\.xml|_rels\/workbook\.xml\.rels|sharedStrings\.xml|styles\.xml|worksheets\/sheet\d+\.xml)$/.test(f.name);if(wanted){totalBytes+=f.originalSize;if(totalBytes>80_000_000)throw new Error('ไฟล์กำลังผลิตใหญ่เกินกำหนด / Capacity workbook is too large');}return wanted;}});
 const xml=(path:string)=>{if(!files[path])throw new Error('ไฟล์ชีตไม่สมบูรณ์ / Invalid workbook: '+path);const d=parseXml(strFromU8(files[path]));if(d.getElementsByTagName('parsererror').length)throw new Error('Invalid workbook XML');return d;};
 const elements=(parent:Document|Element,tag:string)=>Array.from(parent.getElementsByTagName(tag));
 const shared=files['xl/sharedStrings.xml']?elements(xml('xl/sharedStrings.xml'),'si').map(e=>elements(e,'t').map(t=>t.textContent||'').join('')):[];
 const styles=files['xl/styles.xml']?xml('xl/styles.xml'):null;
 const formats=new Map(elements(styles||xml('xl/workbook.xml'),'numFmt').map(e=>[Number(e.getAttribute('numFmtId')),e.getAttribute('formatCode')||'']));
 const xfs=styles?.getElementsByTagName('cellXfs')[0];const styleIds=xfs?elements(xfs,'xf').map(e=>Number(e.getAttribute('numFmtId'))):[];
 const rels=new Map(elements(xml('xl/_rels/workbook.xml.rels'),'Relationship').map(e=>[e.getAttribute('Id'),e.getAttribute('Target')||'']));
 const sheets:CapacitySheet[]=[];let rowCount=0;
 for(const sh of elements(xml('xl/workbook.xml'),'sheet')){
  const name=sh.getAttribute('name')||'';if(name==='Capacity_KPI_Feed')continue;
  const target=rels.get(sh.getAttribute('r:id'));if(!target)throw new Error('Missing worksheet relationship');
  const path=target.startsWith('/')?target.slice(1):'xl/'+target;
  const rows:unknown[][]=[];
  for(const row of elements(xml(path),'row')){
   if(++rowCount>100000)throw new Error('ข้อมูลเกินขนาดที่รองรับ / Workbook exceeds 100,000 rows');
   const index=Number(row.getAttribute('r'))-1;if(!Number.isInteger(index)||index<0||index>100000)throw new Error('Invalid worksheet row');
   const cells:unknown[]=[];rows[index]=cells;
   for(const c of elements(row,'c')){
    const ref=c.getAttribute('r')||'',letters=ref.match(/^[A-Z]+/)?.[0];if(!letters)continue;
    let col=0;for(const ch of letters)col=col*26+ch.charCodeAt(0)-64;col--;
    const t=c.getAttribute('t'),v=c.getElementsByTagName('v')[0]?.textContent??'';
    const styleId=styleIds[Number(c.getAttribute('s')||0)]||0,format=formats.get(styleId)||'';
    if(t==='s')cells[col]=shared[Number(v)]??'';
    else if(t==='inlineStr')cells[col]=elements(c,'t').map(n=>n.textContent||'').join('');
    else if(t==='str'||t==='e')cells[col]=v;
    else if(v==='')cells[col]=null;
    else if((styleId>=14&&styleId<=22)||(/d/i.test(format)&&/m/i.test(format)&&!/[0#]/.test(format))){const d=new Date(Date.UTC(1899,11,30)+Number(v)*86400000);cells[col]=`${d.getUTCDate()}/${d.getUTCMonth()+1}`;}
    else if(/^0+$/.test(format)&&format.length>1)cells[col]=v.padStart(format.length,'0');
    else cells[col]=Number.isFinite(Number(v))?Number(v):v;
   }
  }
  sheets.push({name,rows:Array.from({length:rows.length},(_,i)=>rows[i]||[])});
 }
 return capacityFromSheets(sheets);
}
