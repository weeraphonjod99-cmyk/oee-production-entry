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
    const button = [...document.querySelectorAll('.production-report button')].find(node => text(node).includes('รายวัน / By Day'));
    if (button && button.getAttribute('aria-pressed') !== 'true') button.click();
  };
  const findColumn = (headers, pattern) => headers.findIndex(header => pattern.test(text(header)));
  const render = () => {
    const root = document.querySelector('.production-report');
    if (!root || !reportHeading()) return;
    // Draw from grouped report rows so the chart reflects the visible report table.
    root.querySelector('.pr-machine-chart')?.remove();
    const old = root.querySelector('.daily-machine-summary');
    const activeDetail = [...root.querySelectorAll('.pr-tabs button')].some(button => button.getAttribute('aria-pressed') === 'true' && text(button).includes('รายวัน / By Day'));
    if (!activeDetail) { old?.remove(); return; }
    const table = root.querySelector('.pr-scroll table');
    if (!table) return;
    const headers = [...table.querySelectorAll('thead th')];
    const dateCol = findColumn(headers, /Date/i);
    const shiftCol = findColumn(headers, /Shift/i);
    const machineCol = findColumn(headers, /Machine/i);
    const partCol = findColumn(headers, /Part/i);
    const countCol = findColumn(headers, /Items/i);
    const outputCol = findColumn(headers, /Output/i);
    const timeCol = findColumn(headers, /TOTAL TIME/i);
    const targetCol = headers.findIndex(header => /^เป้าหมาย\s*\/\s*TARGET/i.test(text(header)));
    const lossCol = findColumn(headers, /RECORDED LOSSES/i);
    if ([dateCol, shiftCol, machineCol, partCol, countCol, outputCol, targetCol].some(index => index < 0)) return;
    const dates = [...document.querySelectorAll('input[type="date"]')].map(input => input.value).filter(Boolean);
    const productionDate = dates.length > 1 && dates[0] !== dates[1] ? `${dates[0]} ถึง ${dates[1]}` : (dates[0] || 'ตามตัวกรองวันที่');
    const shiftSelect = [...root.querySelectorAll('select')].find(select => /กะ|shift/i.test(select.parentElement?.innerText || select.getAttribute('aria-label') || ''));
    const shiftButton = [...document.querySelectorAll('button')].find(button => /ทุกกะ\s*\/\s*All shifts|กะเช้า\s*\/\s*Day|กะดึก\s*\/\s*Night/i.test(text(button)));
    const selectedShift = shiftSelect?.selectedOptions?.[0]?.textContent?.trim() || text(shiftButton) || 'ตามตัวกรองกะ';
    const recorderCol = findColumn(headers, /Recorded By/i);
    const rows = [...table.querySelectorAll('tbody tr')].map(tr => {
      const cells = [...tr.children];
      const timeText = timeCol >= 0 ? text(cells[timeCol]) : '';
      const runningMatch = timeText.match(/เดิน\s*([\d,.]+)/i);
      const runningMinutes = runningMatch ? parseNumber(runningMatch[1]) : null;
      const stopMatch = timeText.match(/หยุด\s*([\d,.]+)/i);
      const stopMinutes = stopMatch ? parseNumber(stopMatch[1]) : null;
      const lossText = lossCol >= 0 ? text(cells[lossCol]) : '';
      const losses = [...lossText.matchAll(/([^:]+?)\s*:\s*([\d,.]+)\s*นาที/g)].map(match => ({ label: match[1].trim(), minutes: parseNumber(match[2]) || 0 })).filter(loss => loss.minutes > 0);
      return { date: text(cells[dateCol]), shift: text(cells[shiftCol]) || selectedShift, recorder: recorderCol >= 0 ? text(cells[recorderCol]) : '', runningMinutes, stopMinutes, losses, timeText, machine: text(cells[machineCol]), part: (cells[partCol]?.innerText || text(cells[partCol])).replace(/\s+/g, ' ').trim(), count: text(cells[countCol]), output: parseNumber(text(cells[outputCol])) || 0, target: parseNumber(text(cells[targetCol])) };
    }).filter(row => row.machine).sort((a, b) => compareMachineOrder(a.machine, b.machine));
    const section = old || document.createElement('section');
    section.className = 'daily-machine-summary';
    const heading = document.createElement('div'); heading.className = 'daily-machine-heading';
    const title = document.createElement('div');
    title.innerHTML = '<h3>สรุปผลผลิตรายเครื่องและชิ้นงาน / Production by Machine, Part & Shift</h3><p>แยกตามวันที่และกะ · เป้าหมายคำนวณแยกสำหรับแต่ละช่วงผลิต</p>';
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
      const count = document.createElement('small'); count.textContent = `${row.count} งาน · ${row.shift || 'ไม่ระบุกะ'}`;
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
      const timeBreakdown = [{ label: 'ผลิตปกติ', short: 'ผลิต', minutes: row.runningMinutes || 0, color: '#2f9e62' }, ...row.losses.map(loss => {
        const kind = /inspection|ตรวจสอบ/i.test(loss.label) ? ['ตรวจสอบ', '#8b5cf6']
          : /equipment|machine repair|ซ่อมเครื่อง/i.test(loss.label) ? ['ซ่อมเครื่อง', '#ef4444']
          : /mold repair|ซ่อมแม่พิมพ์/i.test(loss.label) ? ['ซ่อมแม่พิมพ์', '#f97316']
          : /material|วัตถุดิบ/i.test(loss.label) ? ['เปลี่ยนวัตถุดิบ', '#eab308']
          : /unplanned|emergency|หยุดไม่ทราบ/i.test(loss.label) ? ['หยุดฉุกเฉิน', '#dc2626']
          : /meeting|5s|shift change|ประชุม|เปลี่ยนกะ/i.test(loss.label) ? ['ประชุม/เปลี่ยนกะ', '#64748b']
          : /planned|ตามแผน/i.test(loss.label) ? ['หยุดตามแผน', '#0ea5e9']
          : /new model|ทดลองงานใหม่/i.test(loss.label) ? ['ทดลองงานใหม่', '#14b8a6']
          : [loss.label, '#94a3b8'];
        return { label: kind[0], short: kind[0], minutes: loss.minutes, color: kind[1] };
      })];
      const loggedLossMinutes = row.losses.reduce((sum, loss) => sum + loss.minutes, 0);
      const unclassified = Math.max(0, (row.stopMinutes || 0) - loggedLossMinutes);
      if (unclassified > 0) timeBreakdown.push({ label: 'หยุดไม่ระบุสาเหตุ', short: 'หยุดไม่ระบุ', minutes: unclassified, color: '#cbd5e1' });
      const timeTotal = timeBreakdown.reduce((sum, part) => sum + part.minutes, 0);
      const timeSection = document.createElement('div'); timeSection.className = 'daily-machine-time-breakdown';
      const timeTrack = document.createElement('div'); timeTrack.className = 'daily-machine-time-track'; timeTrack.setAttribute('aria-label', 'สัดส่วนเวลาเดินผลิตและเวลาหยุดแยกประเภท');
      for (const part of timeBreakdown.filter(part => part.minutes > 0)) {
        const segment = document.createElement('i'); segment.className = 'daily-machine-time-segment'; segment.style.width = `${timeTotal ? part.minutes / timeTotal * 100 : 0}%`; segment.style.backgroundColor = part.color; segment.title = `${part.label}: ${part.minutes.toLocaleString()} นาที`; segment.setAttribute('aria-label', segment.title); timeTrack.append(segment);
      }
      const timeList = document.createElement('div'); timeList.className = 'daily-machine-time-list';
      for (const part of timeBreakdown.filter(part => part.minutes > 0)) {
        const line = document.createElement('span'); const dot = document.createElement('i'); dot.style.backgroundColor = part.color; const label = document.createElement('b'); label.textContent = part.short; const minutes = document.createElement('small'); minutes.textContent = `${part.minutes.toLocaleString()} นาที`; line.append(dot, label, minutes); timeList.append(line);
      }
      if (timeTotal === 0) { const missing = document.createElement('small'); missing.textContent = 'ไม่มีข้อมูลเวลาแยกประเภท'; timeList.append(missing); }
      timeSection.append(timeTrack, timeList);
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
        `เวลาเดินผลิต: ${row.runningMinutes === null ? 'ไม่มีข้อมูล' : `${row.runningMinutes.toLocaleString()} นาที`}`,
        `เวลารวมตามรายงาน: ${row.timeText || 'ไม่มีข้อมูล'}`,
        ...timeBreakdown.filter(part => part.minutes > 0).map(part => `${part.label}: ${part.minutes.toLocaleString()} นาที`),
      ].join('\n');
      item.setAttribute('aria-label', tooltipText.replace(/\n/g, ', '));
      item.title = tooltipText;
      const tooltip = document.createElement('div'); tooltip.className = 'daily-machine-tooltip'; tooltip.setAttribute('role', 'tooltip'); tooltip.textContent = tooltipText;
      item.append(label, track, value, timeSection, status, tooltip); bars.append(item);
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


