(() => {
  const spreadsheetId = "1UbCCm8pYrDvsZLoJMeMrD9_GIlQuy6i_DZ_m5OR3VLc";
  const sheets = [
    ["720713407", "LUG&SCREW"], ["1736436375", "H1 Coil"], ["977273869", "Stamping equipment"],
    ["1142900615", "Stamping Feeder"], ["1354102251", "Spot welding machine"], ["658162863", "Robot welding"],
    ["24528626", "Rivet"], ["1657105243", "Bending"], ["1975950718", "Tapping machine"],
    ["697867396", "Grinder"], ["127907619", "Arc chamber"], ["882090618", "Air compressors and chillers"],
    ["403476593", "Powder coating production line"], ["368300926", "JRTL Assemble H9"],
    ["1551023115", "CNC,Airtight"], ["438847987", "Die casting machine"],
  ];
  const statusOptions = [
    ["", "ทุกสถานะ"], ["USE", "ใช้งาน (ตามทะเบียน)"], ["CANCEL", "ยกเลิก (Cancel)"], ["UNSPECIFIED", "รอยืนยันสถานะ"],
  ];
  let records = null;
  let updatedAt = "";
  let busy = false;
  let observerTimer = 0;
  const imageByNumber = new Map();
  const clean = value => String(value || "").trim();
  const normalize = value => clean(value).toLowerCase();
  const esc = value => clean(value);

  function parseCsv(text) {
    const rows = [];
    let row = [], cell = "", quoted = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === '"') {
        if (quoted && text[i + 1] === '"') { cell += '"'; i++; }
        else quoted = !quoted;
      } else if (ch === "," && !quoted) { row.push(cell); cell = ""; }
      else if ((ch === "\n" || ch === "\r") && !quoted) {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        row.push(cell); rows.push(row); row = []; cell = "";
      } else cell += ch;
    }
    if (quoted) throw new Error("CSV ไม่สมบูรณ์");
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows;
  }

  function column(headers, regex, fallback) {
    const index = headers.findIndex(value => regex.test(value));
    return index >= 0 ? index : fallback;
  }

  function parseSheet(csv, gid, name) {
    const rows = parseCsv(csv);
    const headerIndex = rows.findIndex(row => row.some(value => /equipment\s*number/i.test(value) || /หมายเลขอุปกรณ์/.test(value)));
    if (headerIndex < 0) throw new Error(`ไม่พบหัวตาราง ${name}`);
    const h = rows[headerIndex].map(value => clean(value).toLowerCase());
    const cols = {
      equipment: column(h, /equipment\s*number|หมายเลขอุปกรณ์/, 1),
      name: column(h, /^name\b|ชื่อ/, 2),
      factory: column(h, /^factory\b|โรงงาน/, 3),
      model: column(h, /^model\b|รุ่น/, 4),
      manufactured: column(h, /manufacturing\s*date|วันที่ผลิต/, 5),
      serial: column(h, /manufacturing\s*number|หมายเลขการผลิต/, 6),
      entryDate: column(h, /factory\s*entry\s*date|วันที่เข้าโรงงาน/, 7),
      factoryNumber: column(h, /^factory\s*number|หมายเลขโรงงาน/, 11),
      status: column(h, /^remark\b|หมายเหตุ/, 14),
    };
    const output = [];
    rows.slice(headerIndex + 1).forEach((cells, offset) => {
      const equipmentNumberRaw = clean(cells[cols.equipment]);
      const equipmentNumber = equipmentNumberRaw.replace(/^\s*[-–—]+\s*$/, "");
      const factoryNumber = clean(cells[cols.factoryNumber]);
      const nameValue = clean(cells[cols.name]);
      if ([equipmentNumber, factoryNumber, nameValue].every(value => !value || value === "/" || value === "-")) return;
      const rawStatus = clean(cells[cols.status]).toUpperCase();
      const status = rawStatus === "USE" ? "USE" : rawStatus === "CANCEL" ? "CANCEL" : "UNSPECIFIED";
      const dateHead = clean(cells[cols.entryDate]);
      const dateTail = clean(cells[cols.entryDate + 1]);
      const entryDate = dateHead === "/" || dateHead === "-" ? "" : dateHead + (/^\d{4}(?:\.0)?$/.test(dateTail) ? dateTail.replace(/\.0$/, "") : "");
      const key = normalize(equipmentNumber || factoryNumber);
      output.push({
        id: `${gid}-${headerIndex + offset + 2}`, group: name, sourceSheet: name, sourceRow: headerIndex + offset + 2,
        equipmentNumber, equipmentNumberRaw, factoryNumber, name: nameValue, manufacturer: clean(cells[cols.factory]),
        model: clean(cells[cols.model]), manufactured: clean(cells[cols.manufactured]), serial: clean(cells[cols.serial]),
        entryDate, location: "", status, remark: clean(cells[cols.status]),
        issues: [...(!equipmentNumber && !factoryNumber ? ["ไม่ระบุหมายเลขเครื่อง"] : []), ...(!clean(cells[cols.serial]) ? ["ไม่ระบุ Serial No."] : []), ...(status === "UNSPECIFIED" ? ["ไม่ระบุสถานะ USE / Cancel"] : [])],
        images: imageByNumber.get(key) || [],
      });
    });
    return output;
  }

  async function fetchAll() {
    if (busy || document.visibilityState === "hidden") return;
    const section = document.querySelector(".equipment-registry");
    if (!section || !section.getClientRects().length) return;
    busy = true;
    try {
      const lists = await Promise.all(sheets.map(async ([gid, name]) => {
        const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}&_=${Date.now()}`;
        const response = await fetch(url, { cache: "no-store", credentials: "omit" });
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${name}`);
        return parseSheet(await response.text(), gid, name);
      }));
      const next = lists.flat();
      if (!next.length) throw new Error("ไม่พบข้อมูลทะเบียนเครื่องจักร");
      records = next;
      updatedAt = new Date().toLocaleString("th-TH");
      ensureView();
      render();
      setStatus(`อ้างอิง Google Sheet • ${records.length} รายการ • อัปเดตสำเร็จ ${updatedAt} • อัตโนมัติทุก 10 วินาที`);
    } catch (error) {
      const message = `อัปเดตจาก Google Sheet ไม่สำเร็จ: ${error instanceof Error ? error.message : "ตรวจการเชื่อมต่อ/สิทธิ์ชีต"}`;
      setStatus(message, true);
    } finally {
      busy = false;
    }
  }

  function statusLabel(value) {
    return value === "USE" ? "ใช้งาน (ตามทะเบียน)" : value === "CANCEL" ? "ยกเลิก (Cancel)" : "รอยืนยันสถานะ";
  }
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = esc(text);
    return node;
  }
  function setStatus(text, error) {
    const section = document.querySelector(".equipment-registry");
    const status = section?.querySelector(".equipment-live-status");
    if (status) {
      status.textContent = text;
      status.classList.toggle("equipment-live-error", !!error);
      status.setAttribute("role", error ? "alert" : "status");
    }
  }
  function exportCsv() {
    if (!records) return;
    const headings = ["หมวด / Category", "หมายเลขอุปกรณ์ / Equipment No.", "Factory Number", "ชื่อ / Name", "ผู้ผลิต / Factory", "Model", "Serial", "ผลิตเมื่อ", "เข้าโรงงาน", "สถานะ", "หมายเหตุ", "ชีตต้นทาง", "แถวต้นทาง"];
    const values = records.map(row => [row.group,row.equipmentNumber,row.factoryNumber,row.name,row.manufacturer,row.model,row.serial,row.manufactured,row.entryDate,row.status,row.remark,row.sourceSheet,row.sourceRow]);
    const quote = value => {
      let text = String(value ?? "");
      if (/^[\s\u0000-\u001f]*[=+@]/.test(text) || /^[\s\u0000-\u001f]*-/.test(text)) text = "'" + text;
      return `"${text.replace(/"/g, '""')}"`;
    };
    const blob = new Blob(["\uFEFF", [headings, ...values].map(row => row.map(quote).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob), link = document.createElement("a");
    link.href = url; link.download = "JRTL-Machine-Registry.csv"; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function readLegacyImages(section) {
    if (imageByNumber.size) return;
    section.querySelectorAll(".equipment-card").forEach(card => {
      const number = clean(card.querySelector("summary strong")?.textContent);
      const imgs = [...card.querySelectorAll(".equipment-gallery img")].map(img => ({ src: img.getAttribute("src"), width: Number(img.getAttribute("width")) || 1200, height: Number(img.getAttribute("height")) || 900 }));
      if (number && imgs.length) imageByNumber.set(normalize(number), imgs);
    });
  }
  function ensureView() {
    const section = document.querySelector(".equipment-registry");
    if (!section) return;
    readLegacyImages(section);
    const oldList = section.querySelector(":scope > .equipment-cards:not(.equipment-live-cards)");
    if (records && oldList && oldList.style.display !== "none") oldList.style.display = "none";
    const heading = section.querySelector(".equipment-heading");
    if (heading && !heading.querySelector(".equipment-live-actions")) {
      const actions = el("div", "equipment-live-actions");
      const sheet = el("a", "ghost-button", "เปิด Google Sheet ↗");
      sheet.href = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit?gid=1354102251`;
      sheet.target = "_blank"; sheet.rel = "noreferrer";
      const refresh = el("button", "ghost-button equipment-live-refresh", "อัปเดตข้อมูล");
      refresh.type = "button"; refresh.addEventListener("click", () => void fetchAll());
      actions.append(sheet, refresh);
      heading.append(actions);
      const sourceLine = heading.querySelector("p");
      if (sourceLine && records) sourceLine.textContent = `อ้างอิง ${spreadsheetId} • ${records.length} รายการ • ${updatedAt}`;
    }
    let status = section.querySelector(":scope > .equipment-live-status");
    if (!status) {
      status = el("p", "equipment-live-status", "กำลังเชื่อมต่อ Google Sheet…");
      heading?.after(status);
    }
    let list = section.querySelector(":scope > .equipment-live-cards");
    if (!list && oldList && records) {
      list = el("div", "equipment-cards equipment-live-cards");
      oldList.after(list);
    }
    if (records) {
      const exportButton = heading?.querySelector("button:not(.equipment-live-refresh)");
      if (exportButton && !exportButton.dataset.equipmentLiveExport) {
        exportButton.dataset.equipmentLiveExport = "true";
        exportButton.textContent = "ดาวน์โหลด M/C List CSV";
        exportButton.addEventListener("click", event => { event.preventDefault(); event.stopImmediatePropagation(); exportCsv(); }, true);
      }
      const countText = [...section.querySelectorAll(":scope > p")].find(p => p.textContent.includes("แสดง"));
      if (countText) countText.dataset.equipmentLiveCount = "true";
      const selects = section.querySelectorAll(".equipment-filters select");
      if (selects[0]) {
        const current = selects[0].value;
        selects[0].replaceChildren(new Option("ทุกหมวด", ""), ...[...new Set(records.map(row => row.group))].map(name => new Option(name, name)));
        selects[0].value = current;
      }
      if (selects[1] && !selects[1].dataset.equipmentLiveReady) {
        const current = selects[1].value;
        selects[1].replaceChildren(...statusOptions.map(([value, label]) => new Option(label, value)));
        selects[1].value = current;
        selects[1].dataset.equipmentLiveReady = "true";
      }
      const counts = section.querySelectorAll(".equipment-counts b");
      if (counts.length >= 4) {
        counts[0].textContent = records.length.toLocaleString();
        counts[1].textContent = records.filter(row => row.status === "USE").length.toLocaleString();
        counts[2].textContent = records.filter(row => row.status === "CANCEL").length.toLocaleString();
        counts[3].textContent = records.filter(row => row.status === "UNSPECIFIED").length.toLocaleString();
      }
      const labels = section.querySelectorAll(".equipment-counts span");
      if (labels[0]) labels[0].textContent = `รายการต้นทาง / ${new Set(records.map(row => row.group)).size} หมวด`;
      const note = section.querySelector(".equipment-note");
      if (note) note.textContent = `สถานะเป็นข้อมูลจากชีต ไม่ใช่สถานะเดินเครื่องปัจจุบัน มี ${records.filter(row => !row.equipmentNumber && !row.factoryNumber).length} แถวที่ไม่มีหมายเลขเครื่องและควรตรวจยืนยัน วันที่คงความละเอียดตามต้นฉบับ ทะเบียนนี้ไม่เปลี่ยนรหัสหรือประวัติการผลิต OEE`;
      if (list) list.setAttribute("aria-label", "รายการเครื่องจักรจาก Google Sheet");
      if (heading) {
        const p = heading.querySelector("p");
        if (p) p.textContent = `อ้างอิง List of Production Equipment (Google Sheet) • ${updatedAt}`;
      }
    }
  }

  function addDetail(dl, label, value) {
    const wrap = el("div"), dt = el("dt", "", label), dd = el("dd", "", value || "ไม่ระบุ");
    wrap.append(dt, dd); dl.append(wrap);
  }
  function makeCard(row) {
    const card = el("details", "equipment-card"), summary = el("summary");
    const photos = row.images || [];
    if (photos.length) {
      const photo = el("img", "equipment-photo");
      photo.src = photos.find(p => p.sourceColumn === "N")?.src || photos[0].src;
      photo.alt = `รูป ${row.equipmentNumber || row.name}`; photo.loading = "lazy"; photo.decoding = "async";
      summary.append(photo);
    } else summary.append(el("span", "equipment-no-photo", "ไม่มีรูปในรายการเดิม"));
    const top = el("div"), number = el("strong", "", row.equipmentNumber || row.factoryNumber || "ยังไม่มีรหัส");
    const badge = el("span", `equipment-status ${row.status.toLowerCase()}`, statusLabel(row.status));
    top.append(number, badge); summary.append(top, el("b", "", row.name || "ไม่ระบุชื่อ"), el("span", "", `${row.group} · ${row.model || "ไม่ระบุรุ่น"}`));
    card.append(summary);
    if (photos.length) {
      const gallery = el("div", "equipment-gallery");
      photos.forEach((photo, index) => {
        const link = el("a"), img = el("img"), caption = el("span", "", `ภาพ ${index + 1} · กดดูขยาย ↗`);
        link.href = photo.src; link.target = "_blank"; link.rel = "noopener noreferrer";
        img.src = photo.src; img.alt = `${row.equipmentNumber || row.name} ภาพ ${index + 1}`; img.loading = "lazy"; img.decoding = "async";
        link.append(img, caption); gallery.append(link);
      });
      card.append(gallery);
    }
    const dl = el("dl");
    addDetail(dl, "หมายเลขอุปกรณ์ต้นฉบับ / Source Equipment Number", row.equipmentNumberRaw);
    addDetail(dl, "รหัสโรงงาน / Factory Number", row.factoryNumber);
    addDetail(dl, "ผู้ผลิต / Factory in Source", row.manufacturer);
    addDetail(dl, "รุ่น / Model", row.model);
    addDetail(dl, "หมายเลขเครื่อง / Serial No.", row.serial);
    addDetail(dl, "ผลิตเมื่อ (ต้นฉบับ) / Manufacture Date", row.manufactured);
    addDetail(dl, "เข้าโรงงาน (ต้นฉบับ) / Factory Entry Date", row.entryDate);
    addDetail(dl, "หมายเหตุ / Notes", row.remark);
    addDetail(dl, "แหล่งข้อมูล / Data Source", `${row.sourceSheet} • แถว ${row.sourceRow}`);
    card.append(dl);
    if (row.issues.length) {
      const ul = el("ul", "equipment-issue"); row.issues.forEach(issue => ul.append(el("li", "", issue))); card.append(ul);
    }
    return card;
  }
  function render() {
    const section = document.querySelector(".equipment-registry");
    if (!section || !records) return;
    ensureView();
    const list = section.querySelector(":scope > .equipment-live-cards");
    if (!list) return;
    const search = normalize(section.querySelector('.equipment-filters input[type="search"]')?.value);
    const selects = section.querySelectorAll(".equipment-filters select");
    const group = selects[0]?.value || "", status = selects[1]?.value || "";
    const issuesOnly = !!section.querySelector('.equipment-filters input[type="checkbox"]')?.checked;
    const rows = records.filter(row => (!group || row.group === group) && (!status || row.status === status) && (!issuesOnly || row.issues.length) && normalize([row.equipmentNumber,row.factoryNumber,row.name,row.model,row.serial,row.manufacturer,row.group].join(" ")).includes(search));
    list.replaceChildren(...rows.map(makeCard));
    const countText = section.querySelector('[data-equipment-live-count="true"]');
    if (countText) countText.textContent = `แสดง ${rows.length.toLocaleString()} / ${records.length.toLocaleString()} รายการ • เปิดรายละเอียดเพื่อดูข้อมูลต้นทาง`;
  }
  function bindFilters() {
    const section = document.querySelector(".equipment-registry");
    if (!section || section.dataset.equipmentLiveFilters) return;
    section.dataset.equipmentLiveFilters = "true";
    section.querySelector(".equipment-filters")?.addEventListener("input", render);
    section.querySelector(".equipment-filters")?.addEventListener("change", render);
  }
  function installStyle() {
    if (document.getElementById("equipment-live-style")) return;
    const style = document.createElement("style"); style.id = "equipment-live-style";
    style.textContent = ".equipment-live-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.equipment-live-actions .ghost-button{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:8px 12px;border:1px solid #c6d8cf;border-radius:7px;background:#fff;color:#183d30;font:inherit;font-size:12px;text-decoration:none;white-space:nowrap}.equipment-live-status{font-size:12px;color:#176534;margin:8px 0}.equipment-live-error{color:#a6231a;background:#fff8e8;border:1px solid #f0c46a;border-radius:7px;padding:8px 10px}.equipment-live-cards{margin-top:10px}";
    document.head.append(style);
  }
  function observe() {
    installStyle();
    const section = document.querySelector(".equipment-registry");
    if (!section) return;
    ensureView(); bindFilters();
    if (records) render();
  }
  const observer = new MutationObserver(() => {
    if (observerTimer) return;
    observerTimer = window.setTimeout(() => { observerTimer = 0; observe(); }, 120);
  });
  if (document.documentElement) observer.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") void fetchAll(); });
  window.setInterval(() => { if (document.visibilityState === "visible") void fetchAll(); }, 10000);
  observe();
})();

