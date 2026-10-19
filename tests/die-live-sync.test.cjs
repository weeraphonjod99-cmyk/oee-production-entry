const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const source=fs.readFileSync('public/die-sync-merge.js','utf8')+'\n'+fs.readFileSync('public/die-live-sync.js','utf8');
(async()=>{
 const base={dies:[{id:'d',baseline:0,interval:100}],shots:[],checks:[],repairs:[]};
 const remote=structuredClone(base);remote.shots.push({id:'other-user-shot',dieId:'d',qty:25});
 const nodes={},events={},storage=new Map([['session',JSON.stringify({dieSyncToken:'test'})]]);let calls=0,renders=0,summaries=0,interval;
 const node=id=>nodes[id]??=( {textContent:'',elements:{username:{value:''}},after(){},addEventListener(t,f){events[id+':'+t]=f;},setAttribute(){}} );
 const context={KEY:'db',db:structuredClone(base),DIE_BACKUP_URL:'test',console,AbortController,Set,Date,JSON,
 localStorage:{getItem:k=>k==='oee-production-session-v1'?storage.get('session'):null,setItem:(k,v)=>storage.set(k,v)},
 document:{hidden:false,createElement:()=>node('banner'),addEventListener(t,f){events[t]=f;},querySelector:()=>null},
 window:{addEventListener(){}},$:node,queueDieBackup(){},render(){renders++},renderSummary(){summaries++},fmt:String,state:()=>({status:'ok'}),
 setInterval:(f,ms)=>interval=ms,setTimeout:()=>0,clearTimeout(){},fetch:async()=>{calls++;return {ok:true,json:async()=>({ok:true,data:remote})}}};
 vm.createContext(context);vm.runInContext(source,context);
 await new Promise(setImmediate);
 assert.equal(context.db.shots[0].qty,25);assert.equal(renders,1);assert.equal(interval,10000);
 // A second remote update is received while a user is editing a draft.
 events.input({target:{form:{}}});remote.shots.push({id:'second-user-shot',dieId:'d',qty:10});
 await vm.runInContext('syncDieNow()',context);
 assert.equal(context.db.shots.length,2);assert.equal(renders,1);assert.equal(summaries,1);
 // Unchanged polling must not rebuild forms or tables.
 await vm.runInContext('syncDieNow()',context);assert.equal(summaries,1);
 // A save made while a request is in flight survives the remote response.
 context.fetch=async()=>{context.db.shots.push({id:'local-shot',dieId:'d',qty:7});return {ok:true,json:async()=>({ok:true,data:remote})}};
 await vm.runInContext('syncDieNow()',context);assert.equal(context.db.shots.length,3);
 assert.ok(context.db.shots.some(s=>s.id==='local-shot'));
 console.log('PASS: cross-user totals, draft preservation, unchanged polling, concurrent local save');
})();
