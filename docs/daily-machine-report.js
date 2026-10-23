(() => {
  const DATE_MS = 24 * 60 * 60 * 1000;
  const yesterday = () => {
    const date = new Date(Date.now() - DATE_MS);
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
    const value = key => parts.find(part => part.type === key)?.value || '';
    return `${value('year')}-${value('month')}-${value('day')}`;
  };
  const text = node => (node?.textContent || '').replace(/\s+/g, ' ').trim();
  const parseNumber = value => { if (!value || value.includes('—')) return null; const parsed = Number(value.replace(/[^0-9.-]/g, '')); return Number.isFinite(parsed) ? parsed : null; };
  const machineOrder = ['1# OCP-80T', '2# MHS-80T', '3# OCP-110T', '4# SN1-110T', '5# OCP-110T', '6# STD-150T', '7# GTX-300T', '8# GTX-500T', '9# OCP-110T', '10# OCP-260 T', '11# 200T', '12# 200T', '13# 110T', 'Bending #1', 'Bending #2', 'SW4 NMS', 'SW5 CU', 'SW6 NLC', 'SW7 LC 600', 'SW8 Door LC', 'Riveting', 'Tapping', 'RV1', 'RV2', '#1 RW', '#2 RW', '#3 RW', 'SW1# spot', 'SW#2 Spot', 'SW#3 Spot', '#8 Rubber Cap', 'CNC-C1', 'CNC-C2', 'CNC-C3', 'CNC-C4', 'CNC-C5', 'CNC-C6', 'CNC-C7', 'CNC-C8'];
  const machineRank = new Map(machineOrder.map((name, index) => [name.toLocaleLowerCase('en'), index]));
  const compareMachineOrder = (a, b) => (machineRank.get(a.trim().toLocaleLowerCase('en')) ?? Number.MAX_SAFE_INTEGER) - (machineRank.get(b.trim().toLocaleLowerCase('en')) ?? Number.MAX_SAFE_INTEGER) || a.localeCompare(b, 'en', { numeric: true });
  let initializedReport = null;
  const reportHeading = () => [...document.querySelectorAll('h2,h3')].find(node => text(node).includes('Production Performance Report'));
  const setDate = input => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    setter?.call(input, yesterday());
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  };
  const initialiseFilters = () => {
    if (!reportHeading()) return;
    const dates = [...document.querySelectorAll('input[type="date"]')];
    if (dates.length < 2 || dates.some(input => input.dataset.dailyDefaultApplied === '1')) return;
    dates.slice(0, 2).forEach(input => {
      input.dataset.dailyDefaultApplied = '1';
      setDate(input);
    });
  };
  const selectDetailView = () => {
    const root = document.querySelector('.production-report');
    if (!root) { initializedReport = null; return; }
    if (initializedReport === root) return;
    initializedReport = root;
    const button = [...document.querySelectorAll('.production-report button')].find(node => text(node).includes('Machine × Recorder × Part'));
    if (button && button.getAttribute('aria-pressed') !== 'true') button.click();
  };
  const findColumn = (headers, pattern) => headers.findIndex(header => pattern.test(text(header)));
  const render = () => {
    const root = document.querySelector('.production-report');
    if (!root || !reportHeading()) return;
    // Draw from grouped report rows so the chart reflects the visible report table.
    root.querySelector('.pr-machine-chart')?.remove();
    const old = root.querySelector('.daily-machine-summary');
    const activeDetail = [...root.querySelectorAll('.pr-tabs button')].some(button => button.getAttribute('aria-pressed') === 'true' && text(button).includes('Machine × Recorder × Part'));
    if (!activeDetail) { old?.remove(); return; }
    const table = root.querySelector('.pr-scroll table');
    if (!table) return;
    const headers = [...table.querySelectorAll('thead th')];
    const machineCol = findColumn(headers, /Machine/i);
    const partCol = findColumn(headers, /Part/i);
    const countCol = findColumn(headers, /Items/i);
    const outputCol = findColumn(headers, /Output/i);
    const targetCol = headers.findIndex(header => /^เป้าหมาย\s*\/\s*TARGET/i.test(text(header)));
    if ([machineCol, partCol, countCol, outputCol, targetCol].some(index => index < 0)) return;
    const dates = [...root.querySelectorAll('input[type="date"]')].map(input => input.value).filter(Boolean);
    const productionDate = dates.length > 1 && dates[0] !== dates[1] ? `${dates[0]} ถึง ${dates[1]}` : (dates[0] || 'ตามตัวกรองวันที่');
    const shiftSelect = [...root.querySelectorAll('select')].find(select => /กะ|shift/i.test(select.parentElement?.innerText || select.getAttribute('aria-label') || ''));
    const selectedShift = shiftSelect?.selectedOptions?.[0]?.textContent?.trim() || 'ตามตัวกรองกะ';
    const recorderCol = findColumn(headers, /Recorded By/i);
    const rows = [...table.querySelectorAll('tbody tr')].map(tr => {
      const cells = [...tr.children];
      return { date: productionDate, shift: selectedShift, recorder: recorderCol >= 0 ? text(cells[recorderCol]) : '', machine: text(cells[machineCol]), part: (cells[partCol]?.innerText || text(cells[partCol])).replace(/\s+/g, ' ').trim(), count: text(cells[countCol]), output: parseNumber(text(cells[outputCol])) || 0, target: parseNumber(text(cells[targetCol])) };
    }).filter(row => row.machine).sort((a, b) => compareMachineOrder(a.machine, b.machine));
    const section = old || document.createElement('section');
    section.className = 'daily-machine-summary';
    const heading = document.createElement('div'); heading.className = 'daily-machine-heading';
    const title = document.createElement('div');
    title.innerHTML = '<h3>สรุปผลผลิตรายเครื่องและชิ้นงาน / Production by Machine & Part</h3><p>ยอดผลิตจริงเทียบเป้าหมายรายชิ้นงาน · แสดงว่าถึงเป้าหรือไม่</p>';
    const legend = document.createElement('div'); legend.className = 'daily-machine-legend';
    legend.innerHTML = '<span><i class="daily-actual-key"></i> ผลิตได้ / Actual</span><span><i class="daily-target-key"></i> เป้าหมาย / Target</span>';
    heading.append(title, legend);
    const bars = document.createElement('div'); bars.className = 'daily-machine-bars';
    if (!rows.length) {
      const loading = [...document.querySelectorAll('button')].some(button => /กำลังโหลดประวัติการผลิต/.test(text(button)));
      bars.innerHTML = `<p>${loading ? 'กำลังโหลดประวัติการผลิต…' : 'ไม่มีข้อมูลการผลิตสำหรับวันที่และตัวกรองที่เลือก'}</p>`;
    }
    for (const row of rows) {
      const item = document.createElement('div'); item.className = 'daily-machine-row'; item.tabIndex = 0;
      const label = document.createElement('div'); label.className = 'daily-machine-label';
      const machine = document.createElement('b'); machine.textContent = row.machine;
      const part = document.createElement('span'); part.className = 'daily-part-label'; part.textContent = row.part;
      const count = document.createElement('small'); count.textContent = `${row.count} งาน`;
      label.append(machine, part, count);
      const track = document.createElement('div'); track.className = 'daily-machine-track'; track.setAttribute('aria-label', `${row.machine}: ผลิตได้ ${row.output.toLocaleString()} เป้าหมาย ${row.target === null ? 'ไม่มีข้อมูล' : row.target.toLocaleString()}`);
      const scale = Math.max(1, row.output, row.target || 0);
      const fill = document.createElement('div'); fill.className = 'daily-machine-fill'; fill.style.height = `${Math.min(100, row.output / scale * 100)}%`;
      track.append(fill);
      if (row.target !== null) { const marker = document.createElement('i'); marker.className = 'daily-machine-target-marker'; marker.style.bottom = `${Math.min(100, row.target / scale * 100)}%`; track.append(marker); }
      const value = document.createElement('div'); value.className = 'daily-machine-value';
      const actual = document.createElement('b'); actual.textContent = row.output.toLocaleString();
      const target = document.createElement('span'); target.textContent = ` / ${row.target === null ? '—' : row.target.toLocaleString()}`;
      value.append(actual, target);
      const status = document.createElement('strong'); status.className = 'daily-machine-status';
      if (row.target === null || row.target <= 0) { status.textContent = 'ไม่มีข้อมูลเป้าหมาย'; status.classList.add('unknown'); }
      else { const percent = row.output / row.target * 100; status.textContent = `${row.output >= row.target ? 'ถึงเป้าหมาย' : 'ต่ำกว่าเป้าหมาย'} · ${percent.toLocaleString('th-TH', { maximumFractionDigits: 1 })}%`; status.classList.add(row.output >= row.target ? 'met' : 'below'); }
      const targetValue = row.target === null ? 'ไม่มีข้อมูล' : row.target.toLocaleString('th-TH', { maximumFractionDigits: 1 });
      const percentValue = row.target > 0 ? `${(row.output / row.target * 100).toLocaleString('th-TH', { maximumFractionDigits: 1 })}%` : 'คำนวณไม่ได้';
      const tooltipText = [
        `วันที่ผลิต: ${row.date}`,
        `กะ: ${row.shift}`,
        `เครื่อง: ${row.machine}`,
        `ชิ้นงาน / หมายเลขงาน: ${row.part || 'ไม่ระบุ'}`,
        `จำนวนงาน: ${row.count || 'ไม่ระบุ'}`,
        `ผู้บันทึก: ${row.recorder || 'ไม่ระบุ'}`,
        `ผลิตได้ (Output): ${row.output.toLocaleString()}`,
        `เป้าหมาย: ${targetValue}`,
        `ผลเทียบเป้าหมาย: ${percentValue}`,
      ].join('\n');
      item.setAttribute('aria-label', tooltipText.replace(/\n/g, ', '));
      item.title = tooltipText;
      const tooltip = document.createElement('div'); tooltip.className = 'daily-machine-tooltip'; tooltip.setAttribute('role', 'tooltip'); tooltip.textContent = tooltipText;
      item.append(label, track, value, status, tooltip); bars.append(item);
    }
    section.replaceChildren(heading, bars);
    const kpis = root.querySelector('.pr-kpis');
    if (kpis) kpis.after(section);
  };
  const run = () => { initialiseFilters(); selectDetailView(); render(); };
  let scheduled = false;
  const observer = new MutationObserver(() => { if (scheduled) return; scheduled = true; requestAnimationFrame(() => { scheduled = false; run(); }); });
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-pressed'] });
  run();
})();


