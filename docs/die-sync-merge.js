// Shared by the browser and server tests. No clock-based last-write-wins.
function canonicalDieData(data){
 const out=JSON.parse(JSON.stringify(data)),ids={};
 out.dies.forEach(d=>{if(d.toolingSource){const key=JSON.stringify([d.toolingSource.base,d.toolingSource.serial]);const id='source-'+Array.from(key).map(c=>c.codePointAt(0).toString(16)).join('-');ids[d.id]=id;d.id=id;}});
 ['shots','checks','repairs'].forEach(k=>out[k].forEach(r=>{r.dieId=ids[r.dieId]||r.dieId;}));return out;
}
function mergeDieData(remote,base,local){
 const result=JSON.parse(JSON.stringify(remote)),conflicts=[];
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),blank=v=>v===undefined||v===null||v===''||v===0;
 for(const kind of ['dies','shots','checks','repairs']){
  const rm=new Map(result[kind].map(r=>[r.id,r])),bm=new Map((base?.[kind]||[]).map(r=>[r.id,r])),lm=new Map(local[kind].map(r=>[r.id,r]));
  for(const id of new Set([...bm.keys(),...lm.keys()])){
   const b=bm.get(id),l=lm.get(id),r=rm.get(id);
   if(base&&same(b,l))continue;
   if(!l){if(same(r,b))rm.delete(id);else if(r)conflicts.push(kind+':'+id);continue;}
   if(!r){if(!b)rm.set(id,l);else conflicts.push(kind+':'+id);continue;}
   const merged={...r};
   for(const key of new Set([...Object.keys(b||{}),...Object.keys(l)])){
    if(key==='id'||same(l[key],r[key])||(base&&same(l[key],b?.[key])))continue;
    if(!base&&kind==='dies'&&(key==='toolingSource'||blank(l[key])))continue;
    if((base&&same(r[key],b?.[key]))||(!base&&blank(r[key]))) {if(l[key]===undefined)delete merged[key];else merged[key]=l[key];}
    else conflicts.push(kind+':'+id+':'+key);
   }
   rm.set(id,merged);
  }
  result[kind]=Array.from(rm.values());
 }
 const dies=new Set(result.dies.map(d=>d.id));
 for(const kind of ['shots','checks','repairs'])if(result[kind].some(r=>!dies.has(r.dieId)))conflicts.push('Missing die for history');
 return {data:result,conflicts};
}
