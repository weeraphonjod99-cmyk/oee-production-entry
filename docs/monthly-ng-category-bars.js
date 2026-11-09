(() => {
  'use strict';
  const palette = [
    { key: 'Auto Part', label: 'ชิ้นส่วนรถยนต์ / Auto Part', color: '#2878d0' },
    { key: 'Electronics', label: 'อิเล็กทรอนิกส์ / Electronics', color: '#ed8b32' },
    { key: 'Box', label: 'กล่อง / Box', color: '#20a36b' },
    { key: 'Unmatched', label: 'ยังไม่พบหมวด / Unmatched', color: '#98a5b3' },
  ];
  const normalize = value => String(value || '').trim().toLocaleLowerCase().replace(/[\s\-–—_./]/g, '');
  const number = value => Number(value) || 0;
  const today = () => new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());

  function readLogs(section) {
    const fiberKey = Object.keys(section).find(key => key.startsWith('__reactFiber$'));
    if (!fiberKey) return [];
    let fiber = section[fiberKey];
    for (let depth = 0; fiber && depth < 16; depth++, fiber = fiber.return) {
      const logs = fiber.memoizedProps?.logs;
      if (Array.isArray(logs)) return logs;
    }
    return [];
  }

  function installLegend(wrapper) {
    let legend = wrapper.querySelector('.jrtl-ng-category-legend');
    if (!legend) {
      legend = document.createElement('div');
      legend.className = 'mr-defect-legend jrtl-ng-category-legend';
      legend.setAttribute('aria-label', 'คำอธิบายสีกราฟงานเสีย');
      for (const item of palette) {
        const entry = document.createElement('span');
        const swatch = document.createElement('i');
        swatch.style.background = item.color;
        entry.append(swatch, document.createTextNode(item.label));
        legend.append(entry);
      }
      const target = document.createElement('span');
      target.className = 'mr-defect-target-key';
      const line = document.createElement('i');
      target.append(line, document.createTextNode('เป้าหมาย / Target'));
      legend.append(target);
      wrapper.insertBefore(legend, wrapper.firstChild);
    }
  }

  function render() {
    const section = document.querySelector('.monthly-report');
    const chart = section?.querySelector('[aria-label="กราฟอัตรางานเสียรายเดือนและ YTD พร้อมเส้นเป้าหมาย"]');
    if (!section || !chart) return;
    const wrapper = chart.parentElement;
    const logs = readLogs(section);
    if (!logs.length) return;

    const monthInput = section.querySelector('input[type="month"]');
    const selectedYear = Number((monthInput?.value || '').slice(0, 4));
    if (!selectedYear) return;
    const machine = section.querySelector('select')?.value || '';
    const limit = today();
    const map = window.__JRTL_PART_CATEGORY_MAP__;
    const totals = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, good: 0, ng: 0, AutoPart: 0, Electronics: 0, Box: 0, Unmatched: 0 }));

    for (const log of logs) {
      const date = String(log.date || '');
      if (date.slice(0, 4) !== String(selectedYear) || date > limit || (machine && log.machineName !== machine)) continue;
      const month = Number(date.slice(5, 7));
      const row = totals[month - 1];
      if (!row) continue;
      row.good += number(log.goodQty);
      const ng = number(log.ngQty);
      row.ng += ng;
      if (ng <= 0) continue;
      const part = map?.get(normalize(log.partNo || ''));
      const category = part?.category;
      if (category === 'Auto Part') row.AutoPart += ng;
      else if (category === 'Electronics') row.Electronics += ng;
      else if (category === 'Box') row.Box += ng;
      else row.Unmatched += ng;
    }
    const ytd = totals.reduce((sum, row) => {
      for (const key of ['good', 'ng', 'AutoPart', 'Electronics', 'Box', 'Unmatched']) sum[key] += row[key];
      return sum;
    }, { month: 'YTD', good: 0, ng: 0, AutoPart: 0, Electronics: 0, Box: 0, Unmatched: 0 });
    const rows = [...totals, ytd];
    const targetInput = section.querySelector('input[type="number"]');
    const target = targetInput && targetInput.value !== '' ? number(targetInput.value) : null;
    const maxRate = Math.max(1, target || 0, ...rows.map(row => row.good + row.ng > 0 ? row.ng / (row.good + row.ng) * 100 : 0)) * 1.2;
    const signature = JSON.stringify([selectedYear, machine, map?.size || 0, target, rows.map(({ good, ng, AutoPart, Electronics, Box, Unmatched }) => [good, ng, AutoPart, Electronics, Box, Unmatched])]);
    if (section.dataset.jrtlNgGraph === signature) return;
    section.dataset.jrtlNgGraph = signature;
    installLegend(wrapper);
    chart.setAttribute('aria-label', 'กราฟแท่งงานเสียรายเดือนแยกสีตามประเภทรถยนต์ อิเล็กทรอนิกส์ กล่อง และรายการไม่พบหมวด พร้อมเส้นเป้าหมาย');

    for (const period of chart.children) {
      const label = period.querySelector('span')?.textContent?.trim() || '';
      const index = label === 'YTD' ? 12 : Number(label.split('/')[0]) - 1;
      const row = rows[index];
      const plot = period.querySelector('div');
      if (!row || !plot) continue;
      const targetLine = plot.querySelector('span');
      const denominator = row.good + row.ng;
      const bars = palette.map(item => {
        const field = item.key === 'Auto Part' ? 'AutoPart' : item.key;
        const ng = row[field] || 0;
        const rate = denominator > 0 ? ng / denominator * 100 : 0;
        const bar = document.createElement('i');
        bar.title = `${item.label}: ${ng.toLocaleString('th-TH')} ชิ้น · ${rate.toFixed(2)}%`;
        bar.setAttribute('aria-label', bar.title);
        bar.style.cssText = `height:${rate / maxRate * 100}%;background:${item.color};width:12%;max-width:18px;min-width:5px;border-radius:3px 3px 0 0;display:block`;
        return bar;
      });
      plot.style.position = 'relative';
      plot.replaceChildren(...bars, ...(targetLine ? [targetLine] : []));
      period.dataset.jrtlNgBars = 'true';
    }
  }

  const observer = new MutationObserver(() => render());
  observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
  window.setInterval(render, 1500);
  render();
})();

