(() => {
  const clean = value => String(value ?? '').replace(/\s+/g, ' ').trim();
  const numeric = value => {
    const parsed = Number(clean(value).replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const fmt = value => value.toLocaleString('th-TH', { maximumFractionDigits: 2 });
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const norm = value => clean(value).normalize('NFKC').toLocaleLowerCase();
  const dates = () => [...document.querySelectorAll('input[type="date"]')].filter(input => !input.closest('.production-output-search'));
  const setText = (node, value) => { if (node && node.textContent !== value) node.textContent = value; };
  let searchText = '';
  let timer = null;
  let rendering = false;
  const ensureDetail = () => {
    const root = document.querySelector('.production-report');
    if (!root || !searchText) return;
    const headers = [...root.querySelectorAll('.pr-scroll thead th')].map(cell => clean(cell.textContent));
    if (headers.some(header => /Part|ชิ้นงาน/i.test(header))) return;
    const button = [...root.querySelectorAll('.pr-tabs button')].find(node => /รายวัน\s*\/\s*By Day/i.test(node.textContent));
    if (button && button.getAttribute('aria-pressed') !== 'true') button.click();
  };
  const syncDate = (index, value) => {
    const input = dates()[index];
    if (!input || input.value === value) return;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    schedule();
  };
  const mount = () => {
    if (rendering) return;
    const root = document.querySelector('.production-report');
    const table = root?.querySelector('.pr-scroll table');
    if (!root || !table) return;
    rendering = true;
    try {
      let panel = root.querySelector('.production-output-search');
      if (!panel) {
        panel = document.createElement('section');
        panel.className = 'production-output-search';
        panel.setAttribute('aria-label', 'ค้นหางานที่ผลิต');
        panel.innerHTML = '<div class="pos-heading"><div><h3>ค้นหางานที่ผลิต / Production Output Search</h3><p>ค้นหาชื่อชิ้นงาน, Part No. หรือเครื่องจักร และเลือกวัน–เดือน–ปี</p></div><label>จาก / From<input type="date" data-pos-from></label><label>ถึง / To<input type="date" data-pos-to></label><label class="pos-query">ค้นหางาน / Search job<input type="search" data-pos-query placeholder="ชื่อชิ้นงาน, Part No., เครื่องจักร, Step"></label></div><div class="pos-actions"><button type="button" data-pos-single>ดูวันเดียว</button><button type="button" data-pos-clear>ล้างคำค้น</button><span>ใช้ตัวกรองเครื่องจักร กะ และชิ้นงานของรายงานร่วมกัน</span></div><div class="pos-totals" aria-live="polite"><article><span>งานดี / GOOD (ชิ้น)</span><strong data-pos-good>0</strong></article><article><span>งานเสีย / NG (ชิ้น)</span><strong data-pos-ng>0</strong></article><article><span>รวมงานดี + งานเสีย (ชิ้น)</span><strong data-pos-total>0</strong></article><article><span>บันทึกการผลิต / Records</span><strong data-pos-count>0</strong></article></div><p class="pos-note" data-pos-note></p><details class="pos-results" open><summary>รายการงานที่ผลิต / Search results</summary><div class="pos-result-scroll"><table><thead><tr><th>วันที่</th><th>เครื่องจักร / กะ</th><th>ชิ้นงาน / Part No. / Step</th><th>งานดี</th><th>งานเสีย</th><th>รวมดี + เสีย</th></tr></thead><tbody data-pos-results></tbody></table></div></details>';
        const header = root.querySelector('.pr-header');
        if (header) header.after(panel); else root.prepend(panel);
        const queryInput = panel.querySelector('[data-pos-query]');
        queryInput.value = searchText;
        queryInput.addEventListener('input', event => { searchText = event.target.value; ensureDetail(); schedule(); });
        panel.querySelector('[data-pos-from]').addEventListener('change', event => syncDate(0, event.target.value));
        panel.querySelector('[data-pos-to]').addEventListener('change', event => syncDate(1, event.target.value));
        panel.querySelector('[data-pos-single]').addEventListener('click', () => {
          const value = panel.querySelector('[data-pos-from]').value || dates()[0]?.value;
          if (value) { syncDate(0, value); syncDate(1, value); }
        });
        panel.querySelector('[data-pos-clear]').addEventListener('click', () => { searchText = ''; queryInput.value = ''; schedule(); });
      }
      const outerDates = dates();
      for (const [selector, index] of [['[data-pos-from]', 0], ['[data-pos-to]', 1]]) {
        const input = panel.querySelector(selector);
        if (outerDates[index] && document.activeElement !== input) input.value = outerDates[index].value;
      }
      const from = outerDates[0]?.value || '', to = outerDates[1]?.value || '';
      const invalidDates = from && to && from > to;
      const headers = [...table.querySelectorAll('thead th')].map(cell => clean(cell.textContent));
      const find = pattern => headers.findIndex(header => pattern.test(header));
      const columns = {
        good: find(/Good|งานดี/i), ng: find(/\bNG\b|งานเสีย/i), test: find(/\bTest\b|งานทดลอง/i),
        count: find(/Items|รายการ/i), date: find(/Date|วันที่/i), machine: find(/Machine|เครื่อง/i),
        part: find(/Part|ชิ้นงาน/i), shift: find(/Shift|กะ/i)
      };
      const tokens = norm(searchText).split(/\s+/).filter(Boolean);
      const matches = [];
      let good = 0, ng = 0, test = 0, count = 0;
      if (!invalidDates && columns.good >= 0 && columns.ng >= 0) {
        for (const row of table.querySelectorAll('tbody tr')) {
          const cells = [...row.children];
          if (cells.length < headers.length || cells.some(cell => cell.colSpan > 1)) continue;
          // Search identifiers only; quantity or KPI values must not match a job query.
          const identity = [columns.machine, columns.part].filter(index => index >= 0).map(index => cells[index]?.textContent).join(' ');
          if (!tokens.every(token => norm(identity).includes(token))) continue;
          const get = index => index >= 0 ? clean(cells[index]?.textContent) : '';
          const entry = {
            date: get(columns.date) || (from === to ? from : (from || 'ทุกวัน') + ' – ' + (to || 'ทุกวัน')),
            machine: get(columns.machine), shift: get(columns.shift), part: get(columns.part) || 'รวมตามรูปแบบรายงาน',
            good: numeric(get(columns.good)), ng: numeric(get(columns.ng))
          };
          good += entry.good; ng += entry.ng;
          test += numeric(get(columns.test));
          count += columns.count >= 0 ? numeric(get(columns.count)) : 1;
          matches.push(entry);
        }
      }
      setText(panel.querySelector('[data-pos-good]'), fmt(good));
      setText(panel.querySelector('[data-pos-ng]'), fmt(ng));
      setText(panel.querySelector('[data-pos-total]'), fmt(good + ng));
      setText(panel.querySelector('[data-pos-count]'), fmt(count));
      const note = invalidDates ? 'กรุณาเลือกวันที่เริ่มต้นไม่เกินวันที่สิ้นสุด'
        : matches.length ? 'พบ ' + fmt(count) + ' บันทึก / ' + fmt(matches.length) + ' แถวสรุป · รวม = งานดี + งานเสีย · งานทดลองแยกต่างหาก ' + fmt(test) + ' ชิ้น · อ้างอิงตัวกรองรายงานปัจจุบัน' + (matches.length > 200 ? ' · แสดงรายละเอียด 200 แถวแรก ยอดสรุปรวมทุกรายการที่พบ' : '')
        : 'ไม่พบรายการผลิตตามวันที่และคำค้นนี้';
      setText(panel.querySelector('[data-pos-note]'), note);
      const html = matches.length ? matches.slice(0, 200).map(entry =>
        '<tr><td>' + esc(entry.date) + '</td><td>' + esc(entry.machine) + '<small>' + esc(entry.shift) + '</small></td><td>' + esc(entry.part) + '</td><td>' + fmt(entry.good) + '</td><td>' + fmt(entry.ng) + '</td><td>' + fmt(entry.good + entry.ng) + '</td></tr>'
      ).join('') : '<tr><td colspan="6">' + esc(invalidDates ? 'ช่วงวันที่ไม่ถูกต้อง' : 'ไม่พบรายการที่ตรงกับตัวกรอง') + '</td></tr>';
      const body = panel.querySelector('[data-pos-results]');
      if (body.dataset.content !== html) { body.innerHTML = html; body.dataset.content = html; }
    } finally { rendering = false; }
  };
  function schedule() {
    if (timer !== null) return;
    timer = setTimeout(() => { timer = null; mount(); }, 150);
  }
  const observer = new MutationObserver(records => {
    if (records.every(record => record.target.nodeType === 1
      ? record.target.closest('.production-output-search')
      : record.target.parentElement?.closest('.production-output-search'))) return;
    schedule();
  });
  observer.observe(document.documentElement, { childList: true, characterData: true, subtree: true });
  document.addEventListener('change', event => {
    if (event.target.matches?.('input[type="date"], .pr-mode-select select')) schedule();
  });
  mount();
})();