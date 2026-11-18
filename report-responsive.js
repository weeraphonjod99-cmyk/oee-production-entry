// Compatibility enhancement for the currently deployed report bundle.
function enhanceReports(){
 document.querySelectorAll('.production-report').forEach(report=>{
  const tabs=report.querySelector('.pr-tabs');if(!tabs)return;
  let label=report.querySelector('.pr-mode-select');
  if(!label){
   label=document.createElement('label');label.className='pr-mode-select';label.textContent='รูปแบบรายงาน / Report View';
   const select=document.createElement('select');
   [...tabs.querySelectorAll('button')].forEach((button,index)=>{const option=document.createElement('option');option.value=String(index);option.textContent=button.textContent;select.append(option)});
   select.addEventListener('change',()=>tabs.querySelectorAll('button')[Number(select.value)]?.click());
   label.append(select);tabs.before(label);
  }
  const active=[...tabs.querySelectorAll('button')].findIndex(b=>b.getAttribute('aria-pressed')==='true');
  if(active>=0)label.querySelector('select').value=String(active);
  const scroll=report.querySelector('.pr-scroll');
  if(scroll&&!report.querySelector('.pr-scroll-hint')){const hint=document.createElement('p');hint.className='pr-scroll-hint';hint.textContent='เลื่อนตารางซ้าย–ขวาและขึ้น–ลงเพื่อดูข้อมูลทั้งหมด / Scroll to view all columns and rows';scroll.before(hint)}
 });
}
let scheduled=false;
new MutationObserver(()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;enhanceReports()})}).observe(document.getElementById('root'),{childList:true,subtree:true,attributes:true,attributeFilter:['aria-pressed']});
enhanceReports();

