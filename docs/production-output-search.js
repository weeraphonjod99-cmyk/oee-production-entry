(() => {
  const clean = value => (value || '').replace(/\s+/g, ' ').trim();
  const number = value => {
    const parsed = Number(clean(value).replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const fmt = value => Math.round(value).toLocaleString('th-TH');
  let activeRoot = null;
  let searchText = '';
  const mount = () => {
    const root = document.querySelector('.production-report');
    if (!root) { activeRoot = null; return; }
    const table = root.querySelector('.pr-scroll table');
    if (!table) return;
    let panel = root.querySelector('.production-output-search');
    if (!panel) {
      panel = document.createElement('section');
      panel.className = 'production-output-search';
      panel.innerHTML = '<div class="pos-heading"><div><h3>ค้นหางานที่ผลิต / Production Output Search</h3><p>เลือกวันที่หรือช่วงวันที่ แล้วค้นหาชื่อชิ้นงาน เครื่องจักร หรือ Part No.</p></div><label>จาก / From<input type="date" data-pos-from></label><label>ถึง / To<input type="date" data-pos-to></label><label class="pos-query">ค้นหางาน / Search job<input type="search" data-pos-query placeholder="ชื่อชิ้นงาน, Part No., เครื่องจักร, Step"></label></div><div class="pos-totals"><article><span>งานดี / GOOD</span><strong data-pos-good>0</strong></article><article><span>งานเสีย / NG</span><strong data-pos-ng>0</strong></article><article><span>รวม / TOTAL OUTPUT</span><strong data-pos-total>0</strong></article><article><span>รายการที่พบ / Records</span><strong data-pos-count>0</strong></article></div><p class="pos-note" data-pos-note></p>';
      const scroll = root.querySelector('.pr-scroll');
      (scroll || root.firstChild)?.before(panel);
      panel.querySelector('[data-pos-query]').addEventListener('input', event => { searchText = event.target.value.trim().toLocaleLowerCase(); render(); });
      panel.querySelector('[data-pos-from]').addEventListener('change', event => syncDate(0, event.target.value));
      panel.querySelector('[data-pos-to]').addEventListener('change', event => syncDate(1, event.target.value));
      activeRoot = root;
    }
    const dates = [...root.querySelectorAll('input[type="date"]')].filter(input => !input.closest('.production-output-search'));
    if (dates.length >= 2) {
      for (const [input, idx] of [[panel.querySelector('[data-pos-from]'), 0], [panel.querySelector('[data-pos-to]'), 1]]) {
        if (document.activeElement !== input && input.value !== dates[idx].value) input.value = dates[idx].value;
      }
    }
    render();
  };
  const syncDate = (index, value) => {
    const root = document.querySelector('.production-report');
    const input = [...(root?.querySelectorAll('input[type="date"]') || [])].filter(node => !node.closest('.production-output-search'))[index];
    if (!input || !value) return;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    setter?.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  };
  const render = () => {
    const root = document.querySelector('.production-report');
    const panel = root?.querySelector('.production-output-search');
    const table = root?.querySelector('.pr-scroll table');
    if (!panel || !table) return;
    const headers = [...table.querySelectorAll('thead th')].map(th => clean(th.textContent).toLocaleLowerCase());
    const find = pattern => headers.findIndex(header => pattern.test(header));
    const goodCol = find(/good|งานดี/), ngCol = find(/\bng\b|งานเสีย/), outputCol = find(/output|ยอดผลิต/);
    const rows = [...table.querySelectorAll('tbody tr')];
    let good = 0, ng = 0, total = 0, count = 0;
    const query = searchText;
    for (const row of rows) {
      const cells = [...row.children];
      const matches = !query || clean(row.textContent).toLocaleLowerCase().includes(query);
      row.hidden = !matches;
      if (!matches) continue;
      good += goodCol >= 0 ? number(cells[goodCol]?.textContent) : 0;
      ng += ngCol >= 0 ? number(cells[ngCol]?.textContent) : 0;
      total += outputCol >= 0 ? number(cells[outputCol]?.textContent) : 0;
      count++;
    }
    panel.querySelector('[data-pos-good]').textContent = fmt(good);
    panel.querySelector('[data-pos-ng]').textContent = fmt(ng);
    panel.querySelector('[data-pos-total]').textContent = fmt(total || good + ng);
    panel.querySelector('[data-pos-count]').textContent = fmt(count);
    panel.querySelector('[data-pos-note]').textContent = count ? 'ยอดสรุปตามช่วงวันที่และคำค้น โดยใช้ข้อมูลรายการที่แสดงในรายงานด้านล่าง' : 'ไม่พบรายการผลิตตามวันที่หรือคำค้นนี้';
  };
  const observer = new MutationObserver(mount);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  mount();
})();