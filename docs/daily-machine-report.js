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
  const selectMachineView = () => {
    const root = document.querySelector('.production-report');
    if (!root) { initializedReport = null; return; }
    if (initializedReport === root) return;
    initializedReport = root;
    const button = [...document.querySelectorAll('.production-report button')].find(node => text(node).includes('By Machine'));
    if (button && button.getAttribute('aria-pressed') !== 'true') button.click();
  };
  const findColumn = (headers, pattern) => headers.findIndex(header => pattern.test(text(header)));
  const render = () => {
    const root = document.querySelector('.production-report');
    if (!root || !reportHeading()) return;
    // Draw from grouped report rows so the chart reflects the visible report table.
    root.querySelector('.pr-machine-chart')?.remove();
    const old = root.querySelector('.daily-machine-summary');
    const activeMachine = [...root.querySelectorAll('.pr-tabs button')].some(button => button.getAttribute('aria-pressed') === 'true' && text(button).includes('By Machine'));
    if (!activeMachine) { old?.remove(); return; }
    const table = root.querySelector('.pr-scroll table');
    if (!table) return;
    const headers = [...table.querySelectorAll('thead th')];
    const machineCol = findColumn(headers, /Machine/);
    const countCol = findColumn(headers, /Items/);
    const outputCol = findColumn(headers, /Output/);
    const targetCol = findColumn(headers, /Target/);
    if ([machineCol, countCol, outputCol, targetCol].some(index => index < 0)) return;
    const rows = [...table.querySelectorAll('tbody tr')].map(tr => {
      const cells = [...tr.children];
      return { machine: text(cells[machineCol]), count: text(cells[countCol]), output: parseNumber(text(cells[outputCol])) || 0, target: parseNumber(text(cells[targetCol])) };
    }).filter(row => row.machine);
    const max = Math.max(1, ...rows.flatMap(row => [row.output, row.target || 0]));
    const section = old || document.createElement('section');
    section.className = 'daily-machine-summary';
    const heading = document.createElement('div'); heading.className = 'daily-machine-heading';
    const title = document.createElement('div');
    title.innerHTML = '<h3>สรุปการผลิตรายเครื่อง / Daily Production by Machine</h3><p>จำนวนงานผลิต ยอดผลิตจริง และเป้าหมายตามวันและตัวกรองที่เลือก</p>';
    const legend = document.createElement('div'); legend.className = 'daily-machine-legend';
    legend.innerHTML = '<span><i class="daily-actual-key"></i> ผลิตได้ / Actual</span><span><i class="daily-target-key"></i> เป้าหมาย / Target</span>';
    heading.append(title, legend);
    const bars = document.createElement('div'); bars.className = 'daily-machine-bars';
    if (!rows.length) {
      const loading = [...document.querySelectorAll('button')].some(button => /กำลังโหลดประวัติการผลิต/.test(text(button)));
      bars.innerHTML = `<p>${loading ? 'กำลังโหลดประวัติการผลิต…' : 'ไม่มีข้อมูลการผลิตสำหรับวันที่และตัวกรองที่เลือก'}</p>`;
    }
    for (const row of rows) {
      const item = document.createElement('div'); item.className = 'daily-machine-row';
      const label = document.createElement('div'); label.className = 'daily-machine-label';
      const machine = document.createElement('b'); machine.textContent = row.machine;
      const count = document.createElement('span'); count.textContent = `${row.count} งาน`;
      label.append(machine, count);
      const track = document.createElement('div'); track.className = 'daily-machine-track'; track.setAttribute('aria-label', `${row.machine}: ผลิตได้ ${row.output.toLocaleString()} เป้าหมาย ${row.target === null ? 'ไม่มีข้อมูล' : row.target.toLocaleString()}`);
      const fill = document.createElement('div'); fill.className = 'daily-machine-fill'; fill.style.width = `${Math.min(100, row.output / max * 100)}%`;
      track.append(fill);
      if (row.target !== null) { const marker = document.createElement('i'); marker.className = 'daily-machine-target-marker'; marker.style.left = `${Math.min(100, row.target / max * 100)}%`; track.append(marker); }
      const value = document.createElement('div'); value.className = 'daily-machine-value';
      const actual = document.createElement('b'); actual.textContent = row.output.toLocaleString();
      const target = document.createElement('span'); target.textContent = ` / ${row.target === null ? '—' : row.target.toLocaleString()}`;
      value.append(actual, target); item.append(label, track, value); bars.append(item);
    }
    section.replaceChildren(heading, bars);
    const kpis = root.querySelector('.pr-kpis');
    if (kpis) kpis.after(section);
  };
  const run = () => { initialiseFilters(); selectMachineView(); render(); };
  let scheduled = false;
  const observer = new MutationObserver(() => { if (scheduled) return; scheduled = true; requestAnimationFrame(() => { scheduled = false; run(); }); });
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-pressed'] });
  run();
})();


