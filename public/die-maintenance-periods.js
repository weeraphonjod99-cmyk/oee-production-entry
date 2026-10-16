function maintenanceKey(value){return String(value||'').normalize('NFKC').toUpperCase().replace(/[\s.\-_/&]+/g,'');}
function maintenanceMatch(d,rows){
 const key=maintenanceKey(d.dieNo);if(!key)return null;
 const candidates=rows.filter(r=>r.toolingNo&&maintenanceKey(r.toolingNo)===key&&Number.isSafeInteger(r.interval)&&r.interval>0);
 if(!candidates.length)return null;
 const parts=candidates.filter(r=>maintenanceKey(r.partNo)===maintenanceKey(d.partNo));
 const selected=parts.length?parts:candidates;
 // Repeated generic tool numbers must match their part. Never select the first row.
 if(!parts.length&&new Set(candidates.map(r=>maintenanceKey(r.partNo))).size>1)return null;
 if(new Set(selected.map(r=>r.interval)).size!==1)return null;
 return selected[0];
}
function applyMaintenancePeriods(dies,rows){
 let updated=0,matched=0;const used=new Set();
 const result=dies.map(d=>{const r=maintenanceMatch(d,rows);if(!r)return d;matched++;used.add(r.row);
 const version=JSON.stringify([r.row,r.toolingNo,r.partNo,r.interval]);
 if(d.maintenancePeriodSource?.version===version)return d;
 updated++;return {...d,interval:r.interval,maintenancePeriodSource:{file:'Tooling_Maintenance_List.xlsx',sheet:'Maintenance List',row:r.row,toolingNo:r.toolingNo,partNo:r.partNo,interval:r.interval,version}};
 });return {dies:result,updated,matched,used:[...used]};
}
