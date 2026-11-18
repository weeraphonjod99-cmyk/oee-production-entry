(() => {
  'use strict';
  const palette = [
    {key:'Auto Part',label:'ชิ้นส่วนรถยนต์ / Auto Part',color:'#2878d0'},
    {key:'Electronics',label:'อิเล็กทรอนิกส์ / Electronics',color:'#ed8b32'},
    {key:'Box',label:'กล่อง / Box',color:'#20a36b'},
    {key:'Unmatched',label:'ยังไม่พบหมวด / Unmatched',color:'#98a5b3'},
  ];
  const normalize=v=>String(v||'').trim().toLowerCase().replace(/^nms\s*\/\s*(?=bru\d)/,'').replace(/\s*\(\d+\s*\/\s*\d+\)$/,'').replace(/[\s\-–—_./]/g,'');
  const quantity=v=>Number.isFinite(Number(v))&&Number(v)>=0?Number(v):0;
  const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const format=v=>v.toLocaleString('th-TH',{maximumFractionDigits:1});
  const percent=v=>v===null?'—':v>0&&v<.01?'<0.01%':v.toFixed(2)+'%';
  const el=(tag,cls,value)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(value!==undefined)n.textContent=value;return n;};
  function summarize(logs,year,machine,limit,map){
    const blank=month=>({month,good:0,ng:0,categories:Object.fromEntries(palette.map(p=>[p.key,0]))});
    const months=Array.from({length:12},(_,i)=>blank(i+1));
    for(const log of logs){
      const date=String(log.date||'');
      if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||date.slice(0,4)!==String(year)||date>limit||(machine&&log.machineName!==machine&&log.machineId!==machine))continue;
      const row=months[Number(date.slice(5,7))-1];if(!row)continue;
      row.good+=quantity(log.goodQty);const ng=quantity(log.ngQty);row.ng+=ng;
      const category=map.get(normalize(log.partNo))?.category;
      row.categories[palette.some(p=>p.key===category)?category:'Unmatched']+=ng;
    }
    const ytd=blank('YTD');for(const row of months){ytd.good+=row.good;ytd.ng+=row.ng;for(const p of palette)ytd.categories[p.key]+=row.categories[p.key];}
    return [...months,ytd];
  }
  function readLogs(section){
    const key=Object.keys(section).find(k=>k.startsWith('__reactFiber$'));let fiber=key&&section[key];
    for(let depth=0;fiber&&depth<16;depth++,fiber=fiber.return)if(Array.isArray(fiber.memoizedProps?.logs))return fiber.memoizedProps.logs;
    return [];
  }
  function installStyle(){
    if(document.getElementById('jrtl-ng-style-v2'))return;
    const s=el('style');s.id='jrtl-ng-style-v2';
    s.textContent=`.jrtl-ng-original{display:none!important}.jrtl-ng-output{margin-top:10px}.jrtl-ng-status,.jrtl-ng-note{font-size:12px;color:#526c85;margin:8px 0}.jrtl-ng-legend{display:flex;flex-wrap:wrap;gap:16px;font-size:12px;margin:12px 0}.jrtl-ng-legend span{display:flex;align-items:center;gap:6px}.jrtl-ng-legend i{display:inline-block;width:12px;height:12px;border-radius:2px}.jrtl-ng-scroll{overflow-x:auto}.jrtl-ng-chart{display:grid;grid-template-columns:repeat(13,minmax(105px,1fr));min-width:1450px;gap:7px}.jrtl-ng-period{text-align:center;font-size:11px}.jrtl-ng-period>strong{display:block;height:28px}.jrtl-ng-plot{height:220px;display:flex;gap:5px;align-items:flex-end;justify-content:center;position:relative;border-bottom:1px solid #cadaed;background:repeating-linear-gradient(to top,transparent 0,transparent 43px,#e3edf7 43px,#e3edf7 44px)}.jrtl-ng-bar{position:relative;width:19%;max-width:23px;border-radius:3px 3px 0 0}.jrtl-ng-bar b{position:absolute;left:50%;transform:translateX(-50%);font-size:9px;white-space:nowrap;bottom:calc(100% + 3px);font-weight:600}.jrtl-ng-bar.inside b{bottom:45%;color:#fff;text-shadow:0 1px 2px #333}.jrtl-ng-target{position:absolute;left:0;right:0;height:1px;background:#f58220;pointer-events:none}.jrtl-ng-period>span{display:block;padding:8px 0}.jrtl-ng-table{border-collapse:collapse;min-width:1450px;width:100%;font-size:11px}.jrtl-ng-table td,.jrtl-ng-table th{padding:10px 8px;border-bottom:1px solid #dbe7f2;text-align:center;white-space:nowrap}.jrtl-ng-table th:first-child{text-align:left;min-width:210px;background:#e8f2fa}.jrtl-ng-table thead{background:#e8f2fa}.jrtl-ng-table .jrtl-ng-total{color:#b42329;font-weight:700}.jrtl-ng-dot{display:inline-block;width:9px;height:9px;margin-right:6px;border-radius:2px}`;
    document.head.append(s);
  }
  let lastSignature='',lastHost=null,pending=0;
  function render(){
    const section=document.querySelector('.monthly-report');
    const block=section?.querySelector('[aria-label="Monthly defect chart"]');if(!block)return;
    const native=block.querySelector('.mr-table');if(!native)return;
    installStyle();let host=block.querySelector('.jrtl-ng-output');if(!host){host=el('div','jrtl-ng-output');native.after(host);}
    const map=window.__JRTL_PART_CATEGORY_MAP__,state=window.__JRTL_PART_CATEGORY_STATUS__;
    if(!map?.size){
      const message=state?.state==='error'?'โหลดหมวดไม่สำเร็จ กำลังลองใหม่ · กราฟเดิมแสดงยอดรวม ยังไม่ใช่ยอดแยกประเภท':'กำลังโหลดหมวดชิ้นงาน · จะแยกสีเมื่อโหลดครบทั้ง 3 หมวด';
      if(host.textContent!==message)host.replaceChildren(el('p','jrtl-ng-status',message));return;
    }
    const logs=readLogs(section),year=Number((section.querySelector('input[type="month"]')?.value||'').slice(0,4));if(!year)return;
    const machine=section.querySelector('select')?.value||'',input=block.querySelector('input[type="number"]');
    const target=input&&input.value!==''?quantity(input.value):null,limit=today(),rows=summarize(logs,year,machine,limit,map);
    const signature=JSON.stringify([year,machine,target,limit,rows,state?.state,map.size]);if(lastHost===host&&lastSignature===signature)return;
    lastHost=host;lastSignature=signature;native.classList.add('jrtl-ng-original');
    for(const legend of block.querySelectorAll('.mr-defect-legend'))legend.classList.add('jrtl-ng-original');
    const status=el('p','jrtl-ng-status',`โหลดหมวดแล้ว ${map.size} รหัส · ${state?.state==='stale'?'ใช้หมวดล่าสุดที่โหลดสำเร็จ ขณะรอเชื่อมต่อใหม่':'จับคู่ Part No. กับ Part List'} · YTD ถึง ${limit}`);
    const legend=el('div','jrtl-ng-legend');legend.setAttribute('aria-label','คำอธิบายสีงานเสีย');
    for(const p of palette){const label=el('span'),swatch=el('i');swatch.style.background=p.color;label.append(swatch,document.createTextNode(p.label));legend.append(label);}
    const targetLabel=el('span'),line=el('i');line.style.cssText='height:2px;background:#f58220';targetLabel.append(line,document.createTextNode('เป้าหมาย / Target'));legend.append(targetLabel);
    const maxRate=Math.max(.01,target||0,...rows.map(r=>r.good+r.ng?r.ng/(r.good+r.ng)*100:0))*1.2;
    const scroll=el('div','jrtl-ng-scroll'),chart=el('div','jrtl-ng-chart');chart.setAttribute('aria-label','งานเสียรายเดือนแยกประเภท พร้อมเปอร์เซ็นต์และเส้นเป้าหมาย');
    for(const row of rows){
      const period=el('div','jrtl-ng-period'),denominator=row.good+row.ng;period.append(el('strong','',percent(denominator?row.ng/denominator*100:null)));
      const plot=el('div','jrtl-ng-plot');
      for(const p of palette){
        const ng=row.categories[p.key],rate=denominator?ng/denominator*100:null,height=(rate||0)/maxRate*100;
        const bar=el('div','jrtl-ng-bar'+(height>=15?' inside':''));bar.style.height=height+'%';bar.style.background=p.color;
        bar.title=`${row.month==='YTD'?'YTD':row.month+'/'+year} · ${p.label}: ${format(ng)} ชิ้น · ${percent(rate)}`;bar.setAttribute('aria-label',bar.title);
        if(ng>0){const label=el('b','',percent(rate));if(height<15)label.style.color=p.color;bar.append(label);}plot.append(bar);
      }
      if(target!==null){const line=el('span','jrtl-ng-target');line.style.bottom=target/maxRate*100+'%';line.title='เป้าหมาย '+percent(target);plot.append(line);}
      period.append(plot,el('span','',row.month==='YTD'?'YTD':row.month+'/'+year));chart.append(period);
    }
    const table=el('table','jrtl-ng-table');table.setAttribute('aria-label','ตารางงานเสียแยกประเภท รายเดือนและ YTD');
    const head=el('thead'),header=el('tr');header.append(el('th','','เดือน'));for(const r of rows)header.append(el('th','',r.month));head.append(header);table.append(head);
    const body=el('tbody');
    const addRow=(label,value,cls='',color='')=>{const tr=el('tr',cls),th=el('th','',label);if(color){const dot=el('i','jrtl-ng-dot');dot.style.background=color;th.prepend(dot);}tr.append(th);for(const r of rows)tr.append(el('td','',value(r)));body.append(tr);};
    addRow('งานเสียรวม (ชิ้น · %)',r=>`${format(r.ng)} · ${percent(r.good+r.ng?r.ng/(r.good+r.ng)*100:null)}`,'jrtl-ng-total');
    for(const p of palette)addRow(p.label,r=>`${format(r.categories[p.key])} · ${percent(r.good+r.ng?r.categories[p.key]/(r.good+r.ng)*100:null)}`,'',p.color);
    addRow('งานดี + งานเสีย (ชิ้น)',r=>format(r.good+r.ng));addRow('อัตรางานเสียรวม',r=>percent(r.good+r.ng?r.ng/(r.good+r.ng)*100:null));addRow('เป้าหมาย (เส้นสีส้ม)',()=>percent(target));table.append(body);
    scroll.append(chart,table);host.replaceChildren(status,legend,scroll,el('p','jrtl-ng-note','% แต่ละประเภท = งานเสียประเภทนั้น ÷ (งานดี + งานเสียทุกประเภทในเดือนเดียวกัน) × 100 · รวมเปอร์เซ็นต์ทุกสีเท่ากับอัตรางานเสียรวม ก่อนปัดเศษ · — คือไม่มีฐานผลิต'));
  }
  function schedule(){if(pending)return;pending=setTimeout(()=>{pending=0;render();},150);}
  const owned=node=>node instanceof Element&&!!node.closest('.jrtl-ng-output');
  new MutationObserver(changes=>{if(changes.some(m=>!owned(m.target)))schedule();}).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  window.addEventListener('jrtl:part-categories',schedule);document.addEventListener('input',schedule);document.addEventListener('change',schedule);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();});window.setInterval(()=>{if(!document.hidden)schedule();},5000);schedule();
})();
