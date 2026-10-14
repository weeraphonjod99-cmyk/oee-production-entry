export const TOOLING_URL='https://docs.google.com/spreadsheets/d/1GJT6p_Yfn7Lda-kYgH7-lFofOO0GOn1ZfwWjTlGXm2c/edit?gid=704073111#gid=704073111';
export const TOOLING_CSV='https://docs.google.com/spreadsheets/d/1GJT6p_Yfn7Lda-kYgH7-lFofOO0GOn1ZfwWjTlGXm2c/export?format=csv&gid=704073111';
export function parseToolingCsv(text:string){
 const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);rows.push(row);row=[];cell='';}else cell+=c;}
 if(quoted)throw new Error('ข้อมูล CSV ไม่สมบูรณ์ / Incomplete CSV');
 if(cell||row.length){row.push(cell);rows.push(row);}
 const headerIndex=rows.findIndex(r=>r.some(v=>v.trim()==='Part No.')&&r.some(v=>v.trim()==='Manufacture No.'));
 if(headerIndex<0)throw new Error('ไม่พบหัวข้อ Tooling หรือไม่มีสิทธิ์อ่านชีต / Tooling headings unavailable or sheet access denied');
 const headers=rows[headerIndex].map(v=>v.trim().replace(/\s+/g,' '));
 const records=rows.slice(headerIndex+1).map((cells,i)=>({sourceRow:headerIndex+i+2,cells:headers.map((_,c)=>(cells[c]||'').trim())})).filter(r=>r.cells[0]&&r.cells[headers.indexOf('Part No.')]);
 return {headers,records};
}
export const toolingThai:Record<string,string>={'SL.NO':'ลำดับ','Part Picture':'รูปชิ้นงาน','Customer':'ลูกค้า','Part Name':'ชื่อชิ้นงาน','Part No.':'รหัสชิ้นงาน','Rev.':'ฉบับแก้ไข','Manufacture No.':'หมายเลขแม่พิมพ์','Press Tonnage':'ขนาดแรงกด','Mech. No.':'หมายเลขเครื่อง','Tooling Life':'อายุแม่พิมพ์','Speed':'ความเร็ว','Model':'แบบแม่พิมพ์','Cavity No.':'จำนวน/หมายเลขคาวิตี้','Tooling Size (L * W * H)':'ขนาดแม่พิมพ์ (ยาว × กว้าง × สูง)','Material Model':'เกรดวัสดุ','Thickness':'ความหนา','Material Width * Step':'ความกว้างวัสดุ × ระยะป้อน','PPEP NO.':'หมายเลข PPEP','Blanking Gap':'ระยะห่างตัด','Designer':'ผู้ออกแบบ','Plating Supplier':'ผู้ชุบ','Production Flow Chart':'ขั้นตอนการผลิต','Complete First Submission Date':'วันที่ส่งครั้งแรก','Design Change Date':'วันที่เปลี่ยนแบบ','Product Position':'สถานที่ผลิต'};

export const TOOLING_SHEETS=[
 {gid:'253202641',name:'JRTL TooLing List 2024',year:'2024'},
 {gid:'1138052328',name:'JRTL TooLing List2025',year:'2025'},
 {gid:'704073111',name:'JRTL Tooling List2026',year:'2026'},
 {gid:'1102046676',name:'CNC Fixture',year:''},
 {gid:'2031114030',name:'Welding / Riveting jig fixture',year:''},
 {gid:'1083557117',name:'2024 Assemble',year:'2024'},
];
export type ToolingSheet=typeof TOOLING_SHEETS[number];
export type ToolingRecord={sourceRow:number;gid:string;sheet:string;year:string;values:Record<string,string>;images:string[]};
export type ToolingData={headers:string[];records:ToolingRecord[]};
const toolingText=(node:Node):string=>node.nodeType===3?node.textContent||'':node.nodeName.toLowerCase()==='br'?'\n':Array.from(node.childNodes).map(toolingText).join('');
export function parseToolingHtml(html:string,sheet:ToolingSheet,parse=(s:string)=>new DOMParser().parseFromString(s,'text/html')):ToolingData{
 const doc=parse(html);const trs=Array.from(doc.getElementsByTagName('tr'));const grid:{row:number;cells:string[];images:Record<number,string[]>}[]=[];
 const safeImage=(url:string|null)=>url&&/^https:\/\/docs\.google\.com\/sheets-images-rt\//.test(url)?url:'';
 const spans=new Map<number,{value:string;left:number}>();
 for(const tr of trs){const th=Array.from(tr.getElementsByTagName('th')).find(e=>(e.getAttribute('id')||'').startsWith(sheet.gid+'R'));if(!th)continue;
 const row=Number((th.getAttribute('id')||'').slice((sheet.gid+'R').length))+1;const cells:string[]=[];const images:Record<number,string[]>={};
 for(const [col,v] of spans){cells[col]=v.value;if(--v.left<=0)spans.delete(col);}
 let col=0;for(const td of Array.from(tr.childNodes).filter(n=>n.nodeName.toLowerCase()==='td') as Element[]){while(cells[col]!==undefined)col++;const value=toolingText(td).trim();const width=Number(td.getAttribute('colspan')||1),height=Number(td.getAttribute('rowspan')||1);for(let i=0;i<width;i++){cells[col+i]=i?'':value;if(height>1)spans.set(col+i,{value:i?'':value,left:height-1});}
 images[col]=Array.from(td.getElementsByTagName('img')).map(img=>safeImage(img.getAttribute('src'))).filter(Boolean);col+=width;}
 grid.push({row,cells,images});}
 const hi=grid.findIndex(r=>r.cells.some(v=>v==='Part No.')&&r.cells.some(v=>v==='Part Name'));if(hi<0)throw new Error('Unsupported tooling sheet: '+sheet.name);
 const headers=grid[hi].cells.map((h,i)=>{h=(h||'').replace(/\s+/g,' ').trim();return h==='No.'?'SL.NO':h||'Operation';});
 const imageCol=headers.indexOf('Part Picture');const overlays=new Map<number,string[]>();
 const pattern=/posObj\('([0-9]+)',\s*'(embed_[0-9]+)',\s*(\d+),\s*(\d+),/g;let match:RegExpExecArray|null;
 while((match=pattern.exec(html))){if(match[1]!==sheet.gid||Number(match[4])!==imageCol)continue;const element=Array.from(doc.getElementsByTagName('div')).find(e=>e.getAttribute('id')===match![2]);const url=safeImage(element?.getElementsByTagName('img')[0]?.getAttribute('src')||null);if(url){const row=Number(match[3])+1;overlays.set(row,[...(overlays.get(row)||[]),url]);}}
 const records=grid.slice(hi+1).filter(r=>r.cells[headers.indexOf('Part No.')]||r.cells[headers.indexOf('Part Name')]).map(r=>({sourceRow:r.row,gid:sheet.gid,sheet:sheet.name,year:sheet.year,values:Object.fromEntries(headers.map((h,i)=>[h,r.cells[i]||''])),images:[...new Set([...(r.images[imageCol]||[]),...(overlays.get(r.row)||[])])]}));
 return {headers,records};
}
export function combineTooling(data:ToolingData[]):ToolingData{return {headers:[...new Set(data.flatMap(d=>d.headers))],records:data.flatMap(d=>d.records)};}
Object.assign(toolingThai,{'Operation':'กระบวนการ','Factory No.':'หมายเลขโรงงาน/จิ๊ก','Incoming':'วันที่รับเข้า'});
