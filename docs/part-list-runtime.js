(() => {
  'use strict';
  if (window.__JRTL_PART_LIST__) return;
  window.__JRTL_PART_LIST__ = true;

  const book = '1OShntM3Vo4z7CFt_Qxpuz7L_s4XJKaI1a_Zdvv3WYAg';
  const sheets = [
    { gid: '1726977328', name: 'Auto Part', label: 'ชิ้นส่วนรถยนต์ / Auto Part' },
    { gid: '443429873', name: 'Electronics', label: 'อิเล็กทรอนิกส์ / Electronics' },
    { gid: '156843303', name: 'Box', label: 'กล่อง / Box' },
  ];
  const state = { items: [], category: 'All', query: '', page: 0, loading: false, error: '', updated: '', open: false };
  const el = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
  const normalize = value => clean(value).toLowerCase();
  const style = el('style');
  style.textContent = `
    #jrtl-part-overlay{position:fixed;inset:0;z-index:10000;background:#f1f6fb;color:#173a5d;font:14px Arial,sans-serif;overflow:auto;padding:20px;box-sizing:border-box}
    #jrtl-part-overlay *{box-sizing:border-box}#jrtl-part-overlay .jrtl-pl-shell{max-width:1500px;margin:auto;background:#fff;border:1px solid #d4e3f0;border-radius:12px;padding:20px;min-height:calc(100vh - 40px)}
    #jrtl-part-overlay .jrtl-pl-head{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;border-bottom:1px solid #dfeaf2;padding-bottom:14px}
    #jrtl-part-overlay h1{margin:4px 0;font-size:24px;color:#153c62}#jrtl-part-overlay p{margin:5px 0;color:#55718c}
    #jrtl-part-overlay button,#jrtl-part-overlay a{font:inherit}#jrtl-part-overlay .jrtl-pl-actions{display:flex;align-items:center;gap:8px}
    #jrtl-part-overlay .jrtl-pl-actions button,#jrtl-part-overlay .jrtl-pl-actions a,#jrtl-part-overlay .jrtl-pl-pages button{border:1px solid #bed3e6;border-radius:8px;background:#fff;color:#164b73;padding:9px 13px;text-decoration:none;cursor:pointer}
    #jrtl-part-overlay .jrtl-pl-actions button:disabled,#jrtl-part-overlay .jrtl-pl-pages button:disabled{opacity:.55;cursor:default}
    #jrtl-part-overlay .jrtl-pl-cats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:16px 0}
    #jrtl-part-overlay .jrtl-pl-cats button{display:grid;gap:7px;text-align:left;border:1px solid #d4e3f0;border-radius:9px;background:#f5f9fc;padding:12px;color:#234a6e;cursor:pointer}
    #jrtl-part-overlay .jrtl-pl-cats button.active{background:#e9f4fc;border-color:#3889c1;box-shadow:inset 0 0 0 1px #3889c1}
    #jrtl-part-overlay .jrtl-pl-cats span{font-size:12px;color:#607e97}
    #jrtl-part-overlay .jrtl-pl-tools{display:flex;align-items:end;justify-content:space-between;gap:14px;margin:16px 0}
    #jrtl-part-overlay .jrtl-pl-tools label{display:grid;gap:6px;flex:1;max-width:550px;font-weight:600}
    #jrtl-part-overlay .jrtl-pl-tools input{height:40px;border:1px solid #c8d9e8;border-radius:7px;padding:8px 12px;font:inherit}
    #jrtl-part-overlay .jrtl-pl-table-wrap{overflow:auto;max-height:68vh;border:1px solid #d9e5ee;border-radius:8px}
    #jrtl-part-overlay table{width:100%;min-width:850px;border-collapse:collapse;font-size:13px}
    #jrtl-part-overlay th{position:sticky;top:0;background:#eaf3fa;text-align:left;z-index:1;font-size:12px}
    #jrtl-part-overlay th,#jrtl-part-overlay td{padding:10px;border-bottom:1px solid #e4edf3;vertical-align:top}
    #jrtl-part-overlay tbody tr:hover{background:#f7fbfe}#jrtl-part-overlay .jrtl-pl-no{font-weight:700;white-space:nowrap;color:#124d78}
    #jrtl-part-overlay small{display:block;margin-top:4px;max-width:480px;color:#637d94;white-space:normal}
    #jrtl-part-overlay .jrtl-pl-imgs{display:flex;gap:5px}#jrtl-part-overlay .jrtl-pl-imgs img{width:76px;height:58px;object-fit:contain;border:1px solid #d8e4ec;border-radius:5px;background:#fff}
    #jrtl-part-overlay .jrtl-pl-empty{padding:34px;text-align:center;background:#f8fbfd;border:1px dashed #c9d8e6;border-radius:9px;color:#5a7289}
    #jrtl-part-overlay .jrtl-pl-error{padding:11px;background:#fff7e6;border:1px solid #eecb84;border-radius:8px;color:#865c04}
    #jrtl-part-overlay .jrtl-pl-pages{display:flex;justify-content:center;align-items:center;gap:14px;padding-top:14px}
    @media(max-width:760px){#jrtl-part-overlay{padding:8px}#jrtl-part-overlay .jrtl-pl-shell{padding:12px;min-height:calc(100vh - 16px)}#jrtl-part-overlay .jrtl-pl-cats{grid-template-columns:repeat(2,minmax(0,1fr))}#jrtl-part-overlay h1{font-size:20px}#jrtl-part-overlay .jrtl-pl-tools{align-items:stretch;flex-direction:column}}
  `;
  document.head.append(style);

  const overlay = el('div');
  overlay.id = 'jrtl-part-overlay';
  overlay.hidden = true;
  const shell = el('section', 'jrtl-pl-shell');
  const head = el('header', 'jrtl-pl-head');
  const titleWrap = el('div');
  titleWrap.append(el('p', '', 'รายการชิ้นงาน / PARTS CATALOG'), el('h1', '', 'รายการชิ้นงาน / Part List'));
  const updated = el('p', '', 'อัปเดตล่าสุด —');
  titleWrap.append(updated);
  const actions = el('div', 'jrtl-pl-actions');
  const sourceLink = el('a', '', 'เปิด Google Sheet ↗');
  sourceLink.href = `https://docs.google.com/spreadsheets/d/${book}/edit?gid=${sheets[0].gid}#gid=${sheets[0].gid}`;
  sourceLink.target = '_blank'; sourceLink.rel = 'noreferrer';
  const reload = el('button', '', 'อัปเดตข้อมูล');
  const close = el('button', '', 'ปิด');
  actions.append(sourceLink, reload, close); head.append(titleWrap, actions);
  const cats = el('div', 'jrtl-pl-cats');
  const tools = el('div', 'jrtl-pl-tools');
  const searchLabel = el('label', '', 'ค้นหาชิ้นงาน / Search parts');
  const search = el('input'); search.type = 'search'; search.placeholder = 'Part No., ชื่อชิ้นงาน, Mode, รายละเอียด';
  searchLabel.append(search);
  const found = el('span'); tools.append(searchLabel, found);
  const alert = el('p', 'jrtl-pl-error'); alert.hidden = true;
  const content = el('div');
  shell.append(head, cats, tools, alert, content); overlay.append(shell); document.body.append(overlay);

  function parseSheet(html, sheet) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const rows = [];
    const spans = new Map();
    for (const tr of doc.getElementsByTagName('tr')) {
      const rh = Array.from(tr.getElementsByTagName('th')).find(th => (th.id || '').startsWith(`${sheet.gid}R`));
      if (!rh) continue;
      const row = Number(rh.id.slice(`${sheet.gid}R`.length)) + 1;
      const cells = [], images = [];
      for (const [col, span] of spans) { cells[col] = span.value; if (--span.left <= 0) spans.delete(col); }
      let col = 0;
      for (const td of Array.from(tr.children).filter(node => node.tagName.toLowerCase() === 'td')) {
        while (cells[col] !== undefined) col++;
        const value = clean(td.textContent);
        const width = Number(td.getAttribute('colspan') || 1), height = Number(td.getAttribute('rowspan') || 1);
        for (let i = 0; i < width; i++) {
          cells[col + i] = i === 0 ? value : '';
          images[col + i] = i === 0 ? Array.from(td.getElementsByTagName('img')).map(img => img.getAttribute('src') || '').filter(src => src.startsWith('https://docs.google.com/sheets-images-rt/')) : [];
          if (height > 1) spans.set(col + i, { value: i === 0 ? value : '', left: height - 1 });
        }
        col += width;
      }
      rows.push({ row, cells, images });
    }
    const isNo = value => /^(no\.?|serial no\.?|ลำดับ|序号)$/.test(value);
    const isNum = value => /part\s*(no\.?|number)|规格/.test(value);
    const isName = value => /part\s*(name|description)|名称/.test(value);
    const hi = rows.findIndex(({ cells }) => cells.map(normalize).some(isNum) && cells.map(normalize).some(isName) && (cells.map(normalize).some(isNo) || sheet.name !== 'Auto Part'));
    if (hi < 0) throw new Error(`ไม่พบหัวตาราง ${sheet.name}`);
    const headers = rows[hi].cells.map(normalize);
    const idx = regex => headers.findIndex(value => regex.test(value));
    const ni = idx(/^(no\.?|serial no\.?|ลำดับ|序号)$/), pni = idx(/part\s*(no\.?|number)|规格/), pmi = idx(/part\s*(name|description)|名称/), mi = idx(/^mode$|型号|模式/);
    return rows.slice(hi + 1).flatMap(({ row, cells, images }) => {
      const partNo = clean(cells[pni]), partName = clean(cells[pmi]);
      if (!partNo && !partName) return [];
      const details = headers.map((_, i) => i).filter(i => ![ni, pni, pmi, mi].includes(i)).map(i => clean(cells[i])).filter(Boolean).join(' · ');
      return [{ key: `${sheet.gid}:${row}:${partNo}`, row, no: clean(cells[ni]) || String(row), mode: clean(cells[mi]), partNo, partName, details, images: images.flat() }];
    });
  }

  async function load(force = false) {
    if (state.loading) return;
    state.loading = true; reload.disabled = true; reload.textContent = 'กำลังโหลด…';
    alert.hidden = true;
    if (!state.items.length) { content.replaceChildren(el('div', 'jrtl-pl-empty', 'กำลังโหลดรายการจาก Google Sheet…')); }
    try {
      const results = await Promise.all(sheets.map(async sheet => {
        const url = `https://docs.google.com/spreadsheets/d/${book}/htmlview/sheet?headers=true&gid=${sheet.gid}`;
        const response = await fetch(url, { credentials: 'omit', cache: force ? 'no-store' : 'default' });
        if (!response.ok) throw new Error(`${sheet.name}: HTTP ${response.status}`);
        return parseSheet(await response.text(), sheet).map(item => ({ ...item, category: sheet.name }));
      }));
      state.items = results.flat(); state.updated = new Date().toLocaleString('th-TH'); state.error = '';
    } catch (error) {
      state.error = 'อ่านข้อมูล Google Sheet ไม่สำเร็จ อาจต้องเปิดสิทธิ์การดูชีตให้ผู้มีลิงก์ · ' + (error?.message || 'Network error');
    } finally {
      state.loading = false; reload.disabled = false; reload.textContent = 'อัปเดตข้อมูล';
      updated.textContent = `อัปเดตล่าสุด ${state.updated || '—'}`;
      render();
    }
  }
  function render() {
    cats.replaceChildren();
    const options = [{ name: 'All', label: 'ทั้งหมด / All parts', count: state.items.length }, ...sheets.map(sheet => ({ ...sheet, count: state.items.filter(item => item.category === sheet.name).length }))];
    for (const option of options) {
      const button = el('button', state.category === option.name ? 'active' : '');
      button.append(el('strong', '', option.label), el('span', '', `${option.count.toLocaleString()} รายการ`));
      button.addEventListener('click', () => { state.category = option.name; state.page = 0; updateSourceLink(); render(); });
      cats.append(button);
    }
    alert.hidden = !state.error; alert.textContent = state.error;
    const query = state.query.toLocaleLowerCase();
    const list = state.items.filter(item => (state.category === 'All' || item.category === state.category) && (!query || `${item.no} ${item.mode} ${item.partNo} ${item.partName} ${item.details}`.toLocaleLowerCase().includes(query)));
    found.textContent = `พบ ${list.length.toLocaleString()} รายการ`;
    if (!list.length) { content.replaceChildren(el('div', 'jrtl-pl-empty', state.loading ? 'กำลังโหลดรายการจาก Google Sheet…' : 'ไม่พบชิ้นงานที่ตรงกับตัวกรอง')); return; }
    const pages = Math.max(1, Math.ceil(list.length / 50)); state.page = Math.min(state.page, pages - 1);
    const wrap = el('div', 'jrtl-pl-table-wrap'), table = el('table'), thead = el('thead'), trh = el('tr');
    for (const title of ['หมวด', 'ลำดับ', 'Mode', 'Part No.', 'ชื่อชิ้นงาน / รายละเอียด', 'ภาพ']) trh.append(el('th', '', title));
    thead.append(trh); table.append(thead); const tbody = el('tbody');
    for (const item of list.slice(state.page * 50, (state.page + 1) * 50)) {
      const tr = el('tr');
      tr.append(el('td', '', sheets.find(sheet => sheet.name === item.category)?.label || item.category), el('td', '', item.no), el('td', '', item.mode || '—'), el('td', 'jrtl-pl-no', item.partNo || '—'));
      const name = el('td'); name.append(el('strong', '', item.partName || '—')); if (item.details) name.append(el('small', '', item.details)); tr.append(name);
      const pics = el('td');
      if (item.images.length) { const holder = el('div', 'jrtl-pl-imgs'); for (const src of item.images.slice(0, 2)) { const a = el('a'); a.href = src; a.target = '_blank'; a.rel = 'noreferrer'; const img = el('img'); img.src = src; img.loading = 'lazy'; img.alt = item.partName; a.append(img); holder.append(a); } pics.append(holder); } else pics.textContent = '—';
      tr.append(pics); tbody.append(tr);
    }
    table.append(tbody); wrap.append(table);
    const pagination = el('footer', 'jrtl-pl-pages'), previous = el('button', '', 'ก่อนหน้า'), pageLabel = el('span', '', `${state.page + 1} / ${pages}`), next = el('button', '', 'ถัดไป');
    previous.disabled = state.page === 0; next.disabled = state.page >= pages - 1;
    previous.addEventListener('click', () => { state.page--; render(); }); next.addEventListener('click', () => { state.page++; render(); });
    pagination.append(previous, pageLabel, next); content.replaceChildren(wrap, pagination);
  }
  function updateSourceLink() {
    const sheet = sheets.find(item => item.name === state.category) || sheets[0];
    sourceLink.href = `https://docs.google.com/spreadsheets/d/${book}/edit?gid=${sheet.gid}#gid=${sheet.gid}`;
  }
  function open() { state.open = true; overlay.hidden = false; document.body.style.overflow = 'hidden'; if (!state.items.length) void load(); }
  function shut() { state.open = false; overlay.hidden = true; document.body.style.overflow = ''; }
  search.addEventListener('input', () => { state.query = search.value; state.page = 0; render(); });
  reload.addEventListener('click', () => void load(true)); close.addEventListener('click', shut);
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && state.open) shut(); });
  let menuButton;
  function ensureMenu() {
    const nav = document.querySelector('nav');
    if (!nav) return;
    if (Array.from(nav.querySelectorAll('button')).some(button => /รายการชิ้นงาน\s*\/\s*Part List/i.test(button.textContent || ''))) return;
    if (!menuButton) {
      menuButton = el('button', ''); menuButton.type = 'button';
      const icon = el('span', 'nav-icon-badge', '▤'); icon.setAttribute('aria-hidden', 'true');
      menuButton.append(icon, document.createTextNode(' รายการชิ้นงาน / Part List'));
      menuButton.addEventListener('click', open);
    }
    if (!menuButton.isConnected) {
      const insertBefore = Array.from(nav.querySelectorAll('button')).find(button => /Defect Statistics/i.test(button.textContent || ''));
      nav.insertBefore(menuButton, insertBefore || null);
    }
  }
  ensureMenu();
  new MutationObserver(ensureMenu).observe(document.body, { childList: true, subtree: true });
  window.setInterval(() => { if (state.open && !document.hidden && !state.loading) void load(); }, 10 * 60 * 1000);
})();

