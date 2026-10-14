import assert from 'node:assert/strict';
import {buildProductionReport,capacityMatcher,reportValues,reportRate} from '../src/lib/productionReport';
const base:any={id:'1',machineId:'m1',machineName:'CNC-C1',productName:'Part A',partNo:'A',step:'1',entryUser:'Ann',goodQty:90,ngQty:10,testQty:0,workMinutes:100,normalMinutes:80,changeoverMinutes:20,inspectionMinutes:0,equipmentRepairMinutes:0,moldRepairMinutes:0,materialChangeMinutes:0,emergencyStopMinutes:0,meetingMinutes:0,plannedStopMinutes:0};
const mm:any=[{id:'m1',name:'CNC-C1'}];
const rec:any={sheetName:'CNC-C1',machineName:'CNC',partNo:'A',productName:'Part A',step:'1',kpi85PerMinute:1,target8h100:1};
const data:any={machines:[{sheetName:'CNC-C1',machineName:'CNC',records:[rec,{...rec,partNo:'B',productName:'Part B',kpi85PerMinute:2}]}]};
const matcher=capacityMatcher(data,mm,85);
assert.equal(matcher(base).rate,1,'match actual sheet machine, not generic CNC group');
assert.equal(matcher({...base,step:'2'}).rate,null,'never fallback across explicit steps');
const r=buildProductionReport([base,{...base,id:'2',partNo:'B',productName:'Part B',workMinutes:50,normalMinutes:50,changeoverMinutes:0,goodQty:50,ngQty:0}], 'person',matcher);
assert.equal(r.rows.length,1);assert.equal(r.total.target,200);assert.equal(r.total.output,150);assert.equal(reportValues(r.total).kpi,75);assert.equal(reportValues(r.total).gap,-50);assert.equal(reportValues(r.total).rate,200/150);assert.equal(reportValues(r.total).actualRate,1);
assert.equal(buildProductionReport([base,{...base,entryUser:'Bob'}],'detail',matcher).rows.length,2);
assert.equal(buildProductionReport([base,{...base,step:'2'}],'part',matcher).rows.length,2);
assert.equal(reportValues(buildProductionReport([base,{...base,partNo:'unknown'}],'machine',matcher).total).kpi,null,'incomplete targets must not report partial KPI');
assert.equal(reportValues(buildProductionReport([{...base,workMinutes:0}],'machine',matcher).total).kpi,null,'explicit zero time is not replaced');
assert.equal(reportValues(buildProductionReport([{...base,goodQty:-1}],'machine',matcher).total).kpi,null);
assert.ok(Math.abs(reportValues(buildProductionReport([{...base,goodQty:210}],'machine',matcher).total).kpi!-220)<1e-10);
const ambiguous:any={machines:[{...data.machines[0],records:[rec,{...rec,step:'2',kpi85PerMinute:3}]}]};
assert.equal(capacityMatcher(ambiguous,mm,85)({...base,step:''}).rate,null);
assert.equal(capacityMatcher({machines:[{...data.machines[0],records:[rec,{...rec,kpi85PerMinute:3}]}]} as any,mm,85)(base).rate,null);
assert.ok(Math.abs(reportRate(rec,100)!-1/.85)<1e-10);
assert.equal(reportValues(buildProductionReport([{...base,workMinutes:1500}],'machine',matcher).total).kpi,null);
console.log('Production report calculation tests passed');
for(const [sheet,name] of [['SW#1 Spot','SW1# spot'],['SW4 NMS/CU Box','SW4 NMS'],['SW5 CU Cover','SW5 CU'],['SW6 NLC Door','SW6 NLC'],['SW7 LC /NLC Box','SW7 LC 600'],['SW8 LC Door','SW8 Door LC'],['Tapping LC/NLC Box','Tapping'],['Riveting PDB','Riveting']]){
 const source:any={machines:[{sheetName:sheet,machineName:'group',records:[{...rec,sheetName:sheet,machineName:'group'}]}]};
 const match=capacityMatcher(source,[{...mm[0],name}],85);
 assert.equal(match({...base,machineName:name}).rate,1);
 assert.equal(match({...base,machineName:name,step:'2'}).rate,null);
 assert.equal(match({...base,machineName:'Other machine'}).rate,null);
}

const dailyLogs = [
 {...base,date:'2026-10-13'},
 {...base,id:'2',date:'2026-10-13',entryUser:'Bob',partNo:'B',productName:'Part B',workMinutes:50,normalMinutes:50,changeoverMinutes:0,goodQty:50,ngQty:0},
 {...base,id:'3',date:'2026-10-14',machineId:'m2',machineName:'Other',goodQty:30,ngQty:5},
];
const daily=buildProductionReport(dailyLogs,'day',matcher);
assert.equal(daily.rows.length,2,'group all machines, recorders and parts by production date');
const firstDay=daily.rows.find(row=>row.date==='2026-10-13')!;
assert.equal(firstDay.count,2);assert.equal(firstDay.output,150);
assert.equal(firstDay.run,130);assert.equal(firstDay.downtime,20);
assert.equal(reportValues(firstDay).target,200);
assert.equal(reportValues(firstDay).rate,200/150,'daily target rate is time weighted');
assert.equal(reportValues(firstDay).kpi,75);
assert.equal(reportValues(daily.rows.find(row=>row.date==='2026-10-14')!).target,null,'missing targets stay unavailable within their day');
assert.equal(daily.rows.reduce((sum,row)=>sum+row.output,0),daily.total.output,'each record counted once');
assert.deepEqual(daily.total,buildProductionReport(dailyLogs,'detail',matcher).total,'changing view preserves totals');
assert.equal(buildProductionReport(dailyLogs.slice(1,2),'day',matcher).rows[0].output,50,'aggregate only supplied filtered records');
assert.equal(buildProductionReport([],'day',matcher).rows.length,0);
assert.equal(buildProductionReport([base],'day',matcher).rows[0].date,'','undated records do not acquire a fabricated date');
console.log('Daily production report tests passed');
