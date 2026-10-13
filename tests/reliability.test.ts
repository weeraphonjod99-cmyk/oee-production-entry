import assert from 'node:assert/strict';
import {buildReliability} from '../src/lib/reliability';
import type {ProductionLog} from '../src/types';
const row=(patch:Partial<ProductionLog>={})=>({id:'1',machineId:'m1',machineName:'Press 1',normalMinutes:480,moldRepairMinutes:60,equipmentRepairMinutes:20,moldRepairCount:2,...patch} as ProductionLog);
let r=buildReliability([row(),row({id:'2',normalMinutes:240,moldRepairMinutes:30,moldRepairCount:1})],'mold');
assert.equal(r.total.mttr,30);assert.equal(r.total.mtbf,240);assert.equal(r.total.count,3);
r=buildReliability([row(),row({machineId:'m2',machineName:'Press 2',normalMinutes:120,moldRepairMinutes:120,moldRepairCount:1})],'mold');
assert.equal(r.total.mttr,60);assert.equal(r.total.mtbf,200);assert.equal(r.rows.length,2);
assert.equal(buildReliability([row({moldRepairCount:undefined})],'mold').total.mttr,null);
assert.equal(buildReliability([row({moldRepairCount:undefined})],'mold').total.missing,1);
r=buildReliability([row({moldRepairCount:undefined})],'mold',true);assert.equal(r.total.mttr,60);assert.equal(r.total.mtbf,480);assert.equal(r.total.estimated,1);
assert.equal(buildReliability([row()],'mold',true).total.count,2,'estimate does not override known counts');
r=buildReliability([row({moldRepairMinutes:0,moldRepairCount:undefined})],'mold');assert.equal(r.total.count,0);assert.equal(r.total.mtbf,null);assert.equal(r.total.missing,0);
assert.equal(buildReliability([],'mold').total.mttr,null);
for(const count of [-1,0,1.5,NaN]){r=buildReliability([row({moldRepairCount:count})],'mold',true);assert.equal(r.total.invalid,1);assert.equal(r.total.mttr,null);}
for(const minutes of [-1,Infinity,1500]){r=buildReliability([row({normalMinutes:minutes})],'mold');assert.equal(r.total.invalid,1);assert.equal(r.total.mtbf,null);}
r=buildReliability([row(),row({normalMinutes:-1})],'mold');assert.equal(r.total.run,480);assert.equal(r.total.mttr,null,'do not present partial rates as complete');
r=buildReliability([row({equipmentRepairCount:4})],'equipment');assert.equal(r.total.mttr,5);assert.equal(r.total.mtbf,120,'equipment counts are separate from mold counts');
r=buildReliability([row({moldRepairMinutes:0,moldRepairCount:0}),row()],'mold');assert.equal(r.total.mtbf,480,'include non-failure operating exposure');
console.log('Reliability: weighted totals, missing counts, estimates, zero failures, invalid data and repair categories passed');
