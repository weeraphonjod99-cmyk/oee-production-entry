(() => {
  'use strict';
  if (window.__JRTL_DEFECT_PART_CATEGORIES__) return;
  window.__JRTL_DEFECT_PART_CATEGORIES__ = true;

  const book = '1OShntM3Vo4z7CFt_Qxpuz7L_s4XJKaI1a_Zdvv3WYAg';
  const sheets = [
    { gid: '1726977328', name: 'Auto Part', label: 'ชิ้นส่วนรถยนต์ / Auto Part' },
    { gid: '443429873', name: 'Electronics', label: 'อิเล็กทรอนิกส์ / Electronics' },
    { gid: '156843303', name: 'Box', label: 'กล่อง / Box' },
  ];
  const categoryByPart = new Map();
  let loading = false, lastSignature = '', timer = 0;
  const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
  const key = value => clean(value).toLocaleLowerCase().replace(/[\s\-–—_./]/g, '');
  const number = value => Number(String(value || '').replace(/[^\d.-]/g, '')) || 0;
  const parseHtml = (html, sheet) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const rows = [];
    for (const tr of doc.querySelectorAll('tr')) {
      const th = [...tr.querySelectorAll('th')].find(cell => (cell.id || '').startsWith(`${sheet.gid}R`));
      if (!th) continue;
      const cells = [...tr.children].filter(cell => cell.tagName.toLowerCase() === 'td').map(cell => clean(cell.textContent));
      rows.push(cells);
    }
    const headersAt = rows.findIndex(row => row.some(value => /part\s*(no\.?|number)|规格/i.test(value)) && row.some(value => /part\s*(name|description)|名称/i.test(value)));
    if (headersAt < 0) throw new Error(`Missing headers: ${sheet.name}`);
    const headers = rows[headersAt].map(value => value.toLowerCase());
    const noAt = headers.findIndex(value => /part\s*(no\.?|number)|规格/i.test(value));
    const nameAt = headers.findIndex(value => /part\s*(name|description)|名称/i.test(value));
    return rows.slice(headersAt + 1).flatMap(row => {
      const partNo = clean(row[noAt]);
      if (!partNo) return [];
      return [{ partNo, partName: clean(row[nameAt]), category: sheet.name }];
    });
  };

  async function loadCategories() {
    if (loading || document.hidden) return;
    loading = true;
    try {
      const results = await Promise.all(sheets.map(async sheet => {
        const url = `https://docs.google.com/spreadsheets/d/${book}/htmlview/sheet?headers=true&gid=${sheet.gid}&_=${Date.now()}`;
        const response = await fetch(url, { credentials: 'omit', cache: 'no-store' });
        if (!response.ok) throw new Error(`Sheet HTTP ${response.status}`);
        return parseHtml(await response.text(), sheet);
      }));
      categoryByPart.clear();
      for (const item of results.flat()) {
        const id = key(item.partNo);
        if (id && !categoryByPart.has(id)) categoryByPart.set(id, item);
      }
      lastSignature = '';
      scheduleRender();
    } catch (error) {
      const panel = document.querySelector('.jrtl-defect-part-categories');
      if (panel) panel.querySelector('.jrtl-dpc-status').textContent = 'อ่านหมวด Part No. จาก Google Sheet ไม่สำเร็จ / Unable to load categories.';
    } finally { loading = false; }
  }

  function installStyle() {
    if (document.getElementById('jrtl-defect-part-category-style')) return;
    const style = document.createElement('style');
    style.id = 'jrtl-defect-part-category-style';
    style.textContent = `.jrtl-defect-part-categories{margin:14px 0;padding:16px;background:#f6faff;border:1px solid #cfe0f1;border-radius:10px;color:#173a5d}.jrtl-defect-part-categories h3{margin:0 0 5px;font-size:16px}.jrtl-dpc-status{margin:4px 0 12px;color:#58738d;font-size:12px}.jrtl-dpc-groups{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.jrtl-dpc-group{padding:12px;background:#fff;border:1px solid #d6e4f0;border-radius:8px;min-width:0}.jrtl-dpc-group h4{margin:0 0 8px;font-size:14px}.jrtl-dpc-total{font-size:20px;font-weight:800;color:#a5232b}.jrtl-dpc-group ul{margin:8px 0 0;padding-left:18px;max-height:220px;overflow:auto}.jrtl-dpc-group li{margin:5px 0;font-size:12px;overflow-wrap:anywhere}.jrtl-dpc-group li b{display:block}.jrtl-dpc-unmapped{margin-top:10px;padding:8px;background:#fff8e8;border:1px solid #f0d59a;border-radius:7px;font-size:12px}@media(max-width:760px){.jrtl-dpc-groups{grid-template-columns:1fr}}`;
    document.head.append(style);
  }

  function scheduleRender() {
    if (timer) return;
    timer = window.setTimeout(() => { timer = 0; render(); }, 180);
  }

  function render() {
    const root = document.querySelector('.defect-statistics');
    const ranking = root?.querySelector('.ds-rank-grid');
    if (!root || !ranking) return;
    installStyle();
    let panel = root.querySelector('.jrtl-defect-part-categories');
    if (!panel) {
      panel = document.createElement('section');
      panel.className = 'jrtl-defect-part-categories';
      panel.setAttribute('aria-label', 'งานเสียแยกตามประเภทชิ้นงาน');
      const title = document.createElement('h3'); title.textContent = 'งานเสียแยกตามประเภทชิ้นงาน / Defects by Part Category';
      const status = document.createElement('p'); status.className = 'jrtl-dpc-status';
      status.textContent = 'อ้างอิงหมวดและ Part No. จาก Google Sheet Part List';
      const groups = document.createElement('div'); groups.className = 'jrtl-dpc-groups';
      panel.append(title, status, groups);
      root.insertBefore(panel, ranking);
    }
    const entries = [...ranking.querySelectorAll('.ds-rank')].map(row => {
      const label = clean(row.querySelector('button')?.textContent).replace(/^\d+\.\s*/, '');
      const stat = clean(row.querySelector('span')?.textContent);
      const match = [...categoryByPart.entries()].find(([part]) => part && key(label).includes(part));
      const item = match?.[1];
      return { label, ng: number(row.querySelector('span b')?.textContent), category: item?.category || 'Unclassified', partNo: item?.partNo || 'ไม่พบ Part No. ในชีต', partName: item?.partName || label, stat };
    });
    const signature = JSON.stringify(entries);
    if (signature === lastSignature && categoryByPart.size) return;
    lastSignature = signature;
    const groups = panel.querySelector('.jrtl-dpc-groups');
    groups.replaceChildren();
    for (const sheet of sheets) {
      const items = entries.filter(item => item.category === sheet.name).sort((a,b) => b.ng-a.ng);
      const card = document.createElement('article'); card.className = 'jrtl-dpc-group';
      const heading = document.createElement('h4'); heading.textContent = sheet.label;
      const total = items.reduce((sum,item) => sum + item.ng,0);
      const count = document.createElement('div'); count.className = 'jrtl-dpc-total'; count.textContent = `${total.toLocaleString('th-TH')} NG`;
      const list = document.createElement('ul');
      for (const item of items) { const li = document.createElement('li'); const name = document.createElement('b'); name.textContent = `${item.partNo} · ${item.partName}`; li.append(name, document.createTextNode(`${item.ng.toLocaleString('th-TH')} ชิ้นเสีย`)); list.append(li); }
      if (!items.length) { const li = document.createElement('li'); li.textContent = 'ไม่พบงานเสียในหมวดนี้ตามตัวกรอง'; list.append(li); }
      card.append(heading, count, list); groups.append(card);
    }
    const unmatched = entries.filter(item => item.category === 'Unclassified');
    if (unmatched.length) {
      const warning = document.createElement('p'); warning.className = 'jrtl-dpc-unmapped';
      warning.textContent = `รายการที่ยังจับคู่ Part No. ใน Google Sheet ไม่ได้ ${unmatched.length} รายการ: ${unmatched.map(item => item.label).join(' · ')}`;
      groups.after(warning);
    } else panel.querySelector('.jrtl-dpc-unmapped')?.remove();
    const status = panel.querySelector('.jrtl-dpc-status');
    status.textContent = categoryByPart.size ? `จับคู่กับ Google Sheet Part List แล้ว ${categoryByPart.size.toLocaleString('th-TH')} Part No. · สรุปงานเสียตามตัวกรองปัจจุบัน` : 'กำลังโหลดรายการ Part No. จาก Google Sheet…';
  }

  const observer = new MutationObserver(scheduleRender);
  observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { void loadCategories(); scheduleRender(); } });
  window.setInterval(() => { if (!document.hidden && document.querySelector('.defect-statistics')) void loadCategories(); }, 60_000);
  void loadCategories();
  scheduleRender();
})();

