function toolingAnalytics(data, dueIds){
 const repairs=new Map(), failures=new Map(), parts=new Map(), waiting=new Map(), pm=new Map();
 const add=(m,k)=>m.set(k,(m.get(k)||0)+1);
 for(const r of data.repairs||[]){
  add(repairs,r.dieId);
  if(/breakdown/i.test(r.type||''))add(failures,r.dieId);
  for(const part of new Set(String(r.spare||'').split(/[,;\n]+/).map(s=>s.trim().replace(/\s+/g,' ').toLocaleLowerCase()).filter(s=>s&&!['-','—','ไม่มี','none','n/a'].includes(s))))add(parts,part);
  if(/open|pending|รอซ่อม|กำลังซ่อม/i.test(r.status||''))add(waiting,r.dieId);
 }
 for(const id of dueIds)pm.set(id,{due:true,orders:0});
 for(const c of data.checks||[])if(c.pmOrder===true&&c.completion!=='yes'){
  const item=pm.get(c.dieId)||{due:false,orders:0};item.orders++;pm.set(c.dieId,item);
 }
 const ranked=m=>[...m].sort((a,b)=>b[1]-a[1]||String(a[0]).localeCompare(String(b[0])));
 return {repairs:ranked(repairs),failures:ranked(failures),parts:ranked(parts),waiting:[...waiting],pm:[...pm]};
}
if(typeof module!=='undefined')module.exports=toolingAnalytics;
if(typeof document!=='undefined'){
 const panel=document.createElement('section');panel.id='toolingAnalytics';panel.style.marginTop='16px';
 document.querySelector('#dashboard .cards').after(panel);
 const style=document.createElement('style');style.textContent='.tooling-charts{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px}.tooling-bars{max-height:360px;overflow:auto}.tooling-bar{margin:12px 0}.tooling-bar-label{display:flex;justify-content:space-between;gap:12px;overflow-wrap:anywhere}.tooling-bar-track{height:12px;background:#edf3ef;border-radius:5px;margin-top:5px}.tooling-bar-fill{height:100%;background:#21816a;border-radius:5px}.tooling-charts .panel{min-width:0}.tooling-queue{max-height:320px;overflow:auto}';document.head.append(style);
 function analyticsDieLabel(id){const d=die(id);return d?d.dieNo+' • '+d.partNo:'ไม่พบทะเบียน / Missing die: '+String(id||'—');}
 function analyticsBars(title,rows,part=false){const max=rows[0]?.[1]||1;return '<div class="panel"><h2>'+title+'</h2><div class="tooling-bars">'+(rows.map(([id,count])=>'<div class="tooling-bar"><div class="tooling-bar-label"><span>'+esc(part?id:analyticsDieLabel(id))+'</span><b>'+fmt(count)+' ครั้ง</b></div><div class="tooling-bar-track"><div class="tooling-bar-fill" style="width:'+count/max*100+'%"></div></div></div>').join('')||'<p class="muted">ยังไม่มีประวัติ / No records</p>')+'</div></div>';}
 function renderToolingAnalytics(){
  const a=toolingAnalytics(db,db.dies.filter(d=>state(d).status==='due').map(d=>d.id));
  panel.innerHTML='<h2>สรุปการซ่อมและบำรุงรักษา / Maintenance Overview</h2><p class="muted">ประวัติทั้งหมด • นับครั้งตามบันทึกซ่อม แยกตามทะเบียนแม่พิมพ์ • เสียบ่อยนับเฉพาะ Breakdown Repair • อะไหล่นับจำนวนบันทึกที่ระบุ ไม่ใช่จำนวนชิ้น (แยกชื่อด้วย , ; หรือขึ้นบรรทัดใหม่)</p><div class="tooling-charts">'+analyticsBars('แม่พิมพ์ซ่อมบ่อย / Frequent Repairs',a.repairs)+analyticsBars('แม่พิมพ์เสียบ่อย / Frequent Breakdowns',a.failures)+analyticsBars('ชิ้นส่วนเปลี่ยนบ่อย / Frequent Replacements',a.parts,true)+'</div><div class="tooling-charts"><div class="panel"><h2>รอซ่อม / กำลังซ่อม: '+fmt(a.waiting.length)+' แม่พิมพ์</h2><p class="muted">รายการซ่อมที่ยังเปิดอยู่ / Open repair records</p><div class="tooling-queue">'+(a.waiting.map(([id,count])=>'<p>'+esc(analyticsDieLabel(id))+' — '+fmt(count)+' งาน</p>').join('')||'<p>ไม่มีรายการรอซ่อม / No open repairs</p>')+'</div></div><div class="panel"><h2>รอซ่อมบำรุง / Pending PM: '+fmt(a.pm.length)+' แม่พิมพ์</h2><p class="muted">ครบกำหนด PM หรือมีใบแจ้งที่ยังไม่ปิด • นับแม่พิมพ์ไม่ซ้ำ</p><div class="tooling-queue">'+(a.pm.map(([id,s])=>'<p>'+esc(analyticsDieLabel(id))+' — '+(s.due?'ครบกำหนด PM':'')+(s.due&&s.orders?' • ':'')+(s.orders?'ใบแจ้งเปิด '+fmt(s.orders)+' งาน':'')+'</p>').join('')||'<p>ไม่มีรายการรอ PM / No pending PM</p>')+'</div></div></div>';
 }
 const analyticsSummary=renderSummary;renderSummary=function(){analyticsSummary();renderToolingAnalytics();};
 renderToolingAnalytics();
}
