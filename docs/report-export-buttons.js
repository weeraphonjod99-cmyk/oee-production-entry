(() => {
  const rootSelector = '.production-report';
  const esc = value => String(value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
  const column = index => { let n=index+1, name=''; while(n){const r=(n-1)%26;name=String.fromCharCode(65+r)+name;n=Math.floor((n-1)/26);}return name; };
  const crc32 = bytes => { let crc=-1; for(const byte of bytes){crc^=byte;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^-1)>>>0; };
  const join = parts => { const out=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let at=0;for(const part of parts){out.set(part,at);at+=part.length;}return out; };
  function makeZip(files) {
    const encoder=new TextEncoder(), local=[], central=[];let offset=0;
    for(const [name,content] of Object.entries(files)){
      const filename=encoder.encode(name), data=encoder.encode(content), crc=crc32(data);
      const header=new Uint8Array(30+filename.length), view=new DataView(header.buffer);
      view.setUint32(0,0x04034b50,true);view.setUint16(4,20,true);view.setUint16(6,0,true);view.setUint16(8,0,true);view.setUint16(10,0,true);view.setUint16(12,0x21,true);view.setUint32(14,crc,true);view.setUint32(18,data.length,true);view.setUint32(22,data.length,true);view.setUint16(26,filename.length,true);view.setUint16(28,0,true);header.set(filename,30);
      local.push(header,data);
      const directory=new Uint8Array(46+filename.length), cv=new DataView(directory.buffer);
      cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(8,0,true);cv.setUint16(10,0,true);cv.setUint16(12,0,true);cv.setUint16(14,0x21,true);cv.setUint32(16,crc,true);cv.setUint32(20,data.length,true);cv.setUint32(24,data.length,true);cv.setUint16(28,filename.length,true);cv.setUint16(30,0,true);cv.setUint16(32,0,true);cv.setUint16(34,0,true);cv.setUint16(36,0,true);cv.setUint32(38,0,true);cv.setUint32(42,offset,true);directory.set(filename,46);central.push(directory);offset+=header.length+data.length;
    }
    const centralBytes=join(central), end=new Uint8Array(22), view=new DataView(end.buffer);
    view.setUint32(0,0x06054b50,true);view.setUint16(4,0,true);view.setUint16(6,0,true);view.setUint16(8,central.length,true);view.setUint16(10,central.length,true);view.setUint32(12,centralBytes.length,true);view.setUint32(16,offset,true);view.setUint16(20,0,true);
    return join([...local,centralBytes,end]);
  }
  function xlsx(rows, chartRows) {
    const makeSheet = values => {
      const statusColumn=values[0]?.findIndex(value=>String(value).toLowerCase().includes('status'))??-1;
      const sheetRows=values.map((row,ri)=>`<row r="${ri+1}" ht="${ri===0?34:24}" customHeight="1">${row.map((value,ci)=>{
        let style=ri===0?1:ci===statusColumn?(/ถึงเป้า/.test(String(value))?3:/ต่ำกว่าเป้า/.test(String(value))?2:4):0;
        return `<c r="${column(ci)}${ri+1}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${esc(value)}</t></is></c>`;
      }).join('')}</row>`).join('');
      const lastColumn=column(Math.max(0,(values[0]?.length||1)-1)), lastRow=values.length;
      const columns=(values[0]||[]).map((_,index)=>{const width=index===0?27:index===1?15:18;return `<col min="${index+1}" max="${index+1}" width="${width}" customWidth="1"/>`;}).join('');
      return `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${columns}</cols><sheetData>${sheetRows}</sheetData><autoFilter ref="A1:${lastColumn}${lastRow}"/></worksheet>`;
    };
    const files={
      '[Content_Types].xml':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>',
      '_rels/.rels':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
      'xl/workbook.xml':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Production Report" sheetId="1" r:id="rId1"/><sheet name="Production Chart" sheetId="2" r:id="rId2"/></sheets></workbook>',
      'xl/_rels/workbook.xml.rels':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
      'xl/styles.xml':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="6"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF174A73"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFE2E2"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE2F0D9"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFF2CC"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFD9E2F3"/></left><right style="thin"><color rgb="FFD9E2F3"/></right><top/><bottom style="thin"><color rgb="FFD9E2F3"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="5"><xf numFmtId="0" fontId="0" fillId="0" borderId="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="1" fillId="2" borderId="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="3" borderId="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="4" borderId="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="5" borderId="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>',
      'xl/worksheets/sheet1.xml':makeSheet(rows),
      'xl/worksheets/sheet2.xml':makeSheet(chartRows||[])
    };
    return makeZip(files);
  }
  function readChart(report, tableRows) {
    const heading=['Machine / เครื่อง','งาน / Items','Actual / ผลิตได้','Target / เป้าหมาย','KPI %','สถานะ / Target Status','กราฟแท่ง Actual'];
    let rows=[...report.querySelectorAll('.pr-machine-bar-row')].map(row=>{
      const label=text(row.querySelector('.pr-machine-label b'));
      const count=Number((text(row.querySelector('.pr-machine-label span')).match(/[\d,]+/)||['0'])[0].replaceAll(',',''));
      const values=text(row.querySelector('.pr-machine-values')).split('/');
      const actual=Number((values[0]||'').replace(/[^\d.-]/g,''));
      const target=Number((values[1]||'').replace(/[^\d.-]/g,''));
      const kpi=target>0?actual/target*100:null;
      return [label,count,actual,Number.isFinite(target)&&target>0?target:'—',kpi===null?'—':kpi.toFixed(1)+'%',kpi===null?'ไม่มีเป้าหมาย':kpi<100?'ต่ำกว่าเป้า':'ถึงเป้า','█'.repeat(Math.max(1,Math.round(actual/(Math.max(actual,target)||1)*24)))];
    });
    if(!rows.length&&tableRows?.length>1){
      const headers=tableRows[0].map(value=>String(value||''));
      const indexOf=term=>headers.findIndex(value=>value.toLowerCase().includes(term.toLowerCase()));
      const machine=indexOf('Machine'), part=indexOf('Part / Step'), date=indexOf('Date'), shift=indexOf('Shift'), items=indexOf('Items'), actual=indexOf('Output'), target=indexOf('Target'), status=indexOf('Status and Completeness');
      if(machine>=0&&actual>=0){
        rows=tableRows.slice(1).map(row=>{
          const numberAt=index=>Number(String(row[index]??'').replace(/[^\d.-]/g,''));
          const output=numberAt(actual), goal=target>=0?numberAt(target):NaN;
          const label=[date>=0?row[date]:'',shift>=0?row[shift]:'',row[machine],part>=0?row[part]:''].filter(Boolean).join(' · ');
          const kpi=goal>0?output/goal*100:null;
          return [label,items>=0?row[items]:'',output,Number.isFinite(goal)&&goal>0?goal:'—',kpi===null?'—':kpi.toFixed(1)+'%',status>=0?row[status]:kpi===null?'ไม่มีเป้าหมาย':kpi<100?'ต่ำกว่าเป้า':'ถึงเป้า','█'.repeat(Math.max(1,Math.round(output/(Math.max(output,goal)||1)*24)))];
        });
      }
    }
    return [heading,...rows];
  }
  window.JRTLReportExcel = { create: xlsx };
  const text=node=>(node?.innerText||node?.textContent||'').replace(/\s+/g,' ').trim();
  const readPage=report=>{const table=report.querySelector('.pr-scroll table');if(!table)return[];return [...table.querySelectorAll('tr')].map(row=>[...row.children].map(text));};
  const wait=()=>new Promise(resolve=>setTimeout(resolve,80));
  async function allRows(report){
    const heading=readPage(report);if(!heading.length)return[];
    const pager=()=>{const match=text(report.querySelector('.pr-pagination span')).match(/หน้า\s*(\d+)\s*\/\s*(\d+)/);return {current:Number(match?.[1]||1),total:Number(match?.[2]||1)};};
    const start=pager().current;
    while(pager().current>1){const previous=[...report.querySelectorAll('.pr-pagination button')].find(button=>text(button).includes('ก่อนหน้า'));if(!previous||previous.disabled)break;previous.click();await wait();}
    const totalPages=pager().total;
    const rows=[...heading];
    for(let page=1;page<totalPages;page++){
      const next=[...report.querySelectorAll('.pr-pagination button')].find(button=>text(button).includes('ถัดไป'));
      if(!next||next.disabled)break;
      next.click();await wait();rows.push(...readPage(report).slice(1));
    }
    while(pager().current>start){const previous=[...report.querySelectorAll('.pr-pagination button')].find(button=>text(button).includes('ก่อนหน้า'));if(!previous||previous.disabled)break;previous.click();await wait();}
    return rows;
  }
  function downloadBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);}
  function printReport(){const report=document.querySelector(rootSelector);if(!report)return;document.body.classList.add('report-export-print');const cleanup=()=>document.body.classList.remove('report-export-print');window.addEventListener('afterprint',cleanup,{once:true});window.print();setTimeout(cleanup,60000);}
  function mount(){const report=document.querySelector(rootSelector),heading=report?.querySelector('.pr-table-heading');if(!heading||heading.querySelector('.report-export-actions'))return;
    const actions=document.createElement('div');actions.className='report-export-actions';
    const button=(label,handler)=>{const b=document.createElement('button');b.type='button';b.className='ghost-button';b.textContent=label;b.addEventListener('click',handler);actions.append(b);return b;};
    button('ดาวน์โหลด CSV',()=>report.querySelector('.pr-header button')?.click());
    button('ดาวน์โหลด PDF',printReport);
    button('ดาวน์โหลด Excel',async event=>{const excel=event.currentTarget;if(excel.disabled)return;excel.disabled=true;excel.textContent='กำลังเตรียม Excel…';try{const rows=await allRows(report);if(rows.length<2)throw Error('ไม่มีข้อมูลในตาราง');const chartRows=readChart(report,rows);downloadBlob(new Blob([xlsx(rows,chartRows)],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),'production-report.xlsx');}catch(error){alert(error instanceof Error?error.message:'สร้าง Excel ไม่สำเร็จ');}finally{excel.disabled=false;excel.textContent='ดาวน์โหลด Excel';}});
    heading.append(actions);
  }
  const style=document.createElement('style');style.textContent='.report-export-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.report-export-actions button{white-space:nowrap;padding:8px 12px;border:1px solid #b8d1e6;border-radius:7px;background:#f1f7fc;color:#164f7e;cursor:pointer;font:inherit}.report-export-actions button:disabled{opacity:.55;cursor:wait}@media print{body.report-export-print *{visibility:hidden!important}body.report-export-print .production-report,body.report-export-print .production-report *{visibility:visible!important}body.report-export-print .production-report{position:absolute!important;left:0!important;top:0!important;width:100%!important;max-width:none!important;padding:8px!important;overflow:visible!important;background:white!important}body.report-export-print .production-report button,body.report-export-print .production-report select,body.report-export-print .production-report input,body.report-export-print .production-report .report-export-actions,body.report-export-print .pr-tabs,body.report-export-print .pr-scroll{max-height:none!important}body.report-export-print .production-report button,body.report-export-print .production-report select,body.report-export-print .production-report input,body.report-export-print .production-report .report-export-actions{display:none!important}body.report-export-print .pr-scroll{overflow:visible!important}body.report-export-print .pr-machine-chart,body.report-export-print .pr-machine-bar-row{break-inside:avoid;page-break-inside:avoid}body.report-export-print .pr-machine-chart{print-color-adjust:exact;-webkit-print-color-adjust:exact}body.report-export-print .pr-scroll table{min-width:0!important;width:100%!important;font-size:7px!important}body.report-export-print .pr-scroll td,body.report-export-print .pr-scroll th{padding:3px!important;white-space:normal!important}}';document.head.append(style);
  new MutationObserver(mount).observe(document.documentElement,{childList:true,subtree:true});mount();
})();

