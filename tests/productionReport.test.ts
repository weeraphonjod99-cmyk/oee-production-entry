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
 {...base,id:'d1',date:'2026-10-13',shift:'白'},
 {...base,id:'d2',date:'2026-10-13',shift:'D',entryUser:'Bob'},
 {...base,id:'d3',date:'2026-10-13',shift:'夜'},
 {...base,id:'d4',date:'2026-10-13',shift:'白',partNo:'B',productName:'Part B'},
 {...base,id:'d5',date:'2026-10-13',shift:'白',step:'2'},
 {...base,id:'d6',date:'2026-10-13',shift:'白',machineId:'m2',machineName:'Other'},
 {...base,id:'d7',date:'2026-10-14',shift:'白'},
];
const daily=buildProductionReport(dailyLogs,'day',matcher);
assert.equal(daily.rows.length,6,'separate date, shift, machine, part and step');
const combined=daily.rows.find(row=>row.count===2)!;
assert.equal(combined.date,'2026-10-13');assert.equal(combined.shift,'白');
assert.equal(combined.machine,'CNC-C1');assert.equal(combined.partNo,'A');assert.equal(combined.step,'1');
assert.equal(combined.output,200);assert.equal(combined.run,160);assert.equal(combined.downtime,40);
assert.equal(reportValues(combined).target,200);assert.equal(reportValues(combined).kpi,100);
assert.equal(reportValues(daily.rows.find(row=>row.machine==='Other')!).target,null,'missing target affects only its own group');
assert.equal(daily.rows.reduce((sum,row)=>sum+row.output,0),daily.total.output,'no duplicated output');
assert.deepEqual(daily.total,buildProductionReport(dailyLogs,'detail',matcher).total,'view preserves totals');
assert.equal(buildProductionReport(dailyLogs.slice(0,1),'day',matcher).rows[0].output,100,'honor filtered records');
assert.equal(buildProductionReport([],'day',matcher).rows.length,0);
assert.equal(buildProductionReport([base],'day',matcher).rows[0].date,'','do not invent dates');
assert.equal(buildProductionReport([base],'day',matcher).rows[0].shift,'','do not invent shifts');
console.log('Daily production breakdown tests passed');
