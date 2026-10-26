(() => {
  if (window.__jrtlMachineListExcelReady) return;
  window.__jrtlMachineListExcelReady = true;
  const registry = (node) => node?.closest?.(".equipment-registry");
  const esc = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  const download = (root) => {
    const cards = [...root.querySelectorAll(".equipment-cards > details.equipment-card")];
    const records = cards.map((card) => {
      const summary = card.querySelector("summary");
      const dl = [...card.querySelectorAll("dl > div")].map((field) => [field.querySelector("dt")?.textContent?.trim() || "", field.querySelector("dd")?.textContent?.trim() || ""]);
      const spans = [...(summary?.querySelectorAll(":scope > span") || [])].map((item) => item.textContent?.trim() || "");
      return {
        no: summary?.querySelector("strong")?.textContent?.trim() || "",
        status: summary?.querySelector(".equipment-status")?.textContent?.trim() || "",
        name: summary?.querySelector(":scope > b")?.textContent?.trim() || "",
        categoryModel: spans[0] || "",
        details: Object.fromEntries(dl),
      };
    });
    const labels = [...new Set(records.flatMap((record) => Object.keys(record.details)))];
    const headers = ["หมายเลขเครื่อง / Equipment No.", "ชื่อเครื่อง / Machine Name", "หมวด · รุ่น / Category · Model", "สถานะ / Status", ...labels];
    const rows = [headers, ...records.map((record) => [record.no, record.name, record.categoryModel, record.status, ...labels.map((label) => record.details[label] || "")])];
    const table = rows.map((row, index) => "<tr>" + row.map((cell) => "<td" + (index === 0 ? ' style="font-weight:bold;background:#dceaf6"' : "") + ">" + esc(cell) + "</td>").join("") + "</tr>").join("");
    const html = '<html><head><meta charset="utf-8"></head><body><table>' + table + "</table></body></html>";
    const blob = new Blob(["\ufeff", html], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "JRTL-MC-List.xls";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };
  const updateButton = () => {
    document.querySelectorAll(".equipment-registry .equipment-heading button").forEach((button) => {
      if (button.textContent !== "ดาวน์โหลด M/C List Excel") button.textContent = "ดาวน์โหลด M/C List Excel";
      button.title = "ดาวน์โหลดรายการเครื่องจักรที่ตรงกับตัวกรองเป็นไฟล์ Excel";
    });
  };
  new MutationObserver(updateButton).observe(document.documentElement, { childList: true, subtree: true });
  updateButton();
  document.addEventListener("click", (event) => {
    const button = event.target?.closest?.(".equipment-registry .equipment-heading button");
    const root = registry(button);
    if (!root) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    download(root);
  }, true);
})();