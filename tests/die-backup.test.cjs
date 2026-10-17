const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 let resolve,request;const nodes={},stored=new Map();
 const ctx={KEY:'test',db:{dies:[],shots:[],checks:[],repairs:[]},crypto:require('node:crypto').webcrypto,AbortController,console,
 document:{createElement:()=>({setAttribute(){},addEventListener(){}}),getElementById:id=>nodes[id]??=({append(){},addEventListener(){}})},
 localStorage:{getItem:k=>stored.get(k),setItem:(k,v)=>stored.set(k,v)},window:{addEventListener(){}},setTimeout:()=>0,clearTimeout(){},setInterval(){},
 fetch:async(u,o)=>{request=JSON.parse(o.body);return new Promise(r=>resolve=r)}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync('public/die-backup.js','utf8'),ctx);
 ctx.db.shots.push({id:'s1',dieId:'d1',qty:250,date:'2026-10-17'});
 vm.runInContext('queueDieBackup()',ctx);
 assert.equal(request.payload.data.shots[0].qty,250);
 assert.ok(JSON.parse(stored.get('test_cloud_v1')).pending);
 resolve({ok:true,json:async()=>({ok:true,backupId:request.payload.backupId,receivedAt:'2026-10-17T09:00:00Z'})});
 await new Promise(setImmediate);
 assert.equal(JSON.parse(stored.get('test_cloud_v1')).pending,null);
 assert.match(nodes.backupStatus.textContent,/Backed up/);
 ctx.fetch=async()=>{throw Error('offline')};await vm.runInContext('queueDieBackup()',ctx);await new Promise(setImmediate);
 assert.ok(JSON.parse(stored.get('test_cloud_v1')).pending);assert.match(nodes.backupStatus.textContent,/pending/);
 console.log('PASS: shot payload, acknowledged save, offline retry persistence');
})();
