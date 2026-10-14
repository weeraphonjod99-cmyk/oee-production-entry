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
