(() => {
  const STYLE_ID = "oee-help-tip-style";
  const TIP_ID = "oee-help-tip";
  const PROCEDURE_URL = "./JRTL_OEE_Calculation_Procedure_TH_EN_Rev01.pdf";

  function install() {
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = `
        .oee-help-anchor { position: relative; display: inline-flex; align-items: center; margin-left: 8px; vertical-align: middle; }
        .oee-help-button { display: inline-grid; place-items: center; width: 25px; height: 25px; padding: 0; border: 1px solid #93c5fd; border-radius: 50%; background: #eff6ff; color: #1d4ed8; font: 700 15px/1 system-ui,sans-serif; cursor: help; }
        .oee-help-button:hover, .oee-help-button:focus-visible { background: #dbeafe; outline: 2px solid #60a5fa; outline-offset: 2px; }
        .oee-help-popover { display: none; position: absolute; z-index: 10000; top: calc(100% + 9px); left: 0; width: min(400px, calc(100vw - 48px)); max-height: calc(100vh - 150px); overflow:auto; box-sizing: border-box; padding: 15px 17px; border: 1px solid #bfdbfe; border-radius: 12px; background: #fff; color: #172033; box-shadow: 0 12px 32px rgba(15,23,42,.2); font: 14px/1.55 system-ui,Segoe UI,sans-serif; white-space: normal; }
        .oee-help-anchor:hover .oee-help-popover, .oee-help-anchor:focus-within .oee-help-popover, .oee-help-anchor.is-open .oee-help-popover { display: block; }
        .oee-help-popover strong { display:block; margin-bottom: 5px; color:#123b63; font-size:15px; }
        .oee-help-popover p { margin:7px 0; }
        .oee-help-popover ul { margin:6px 0; padding-left:20px; }
        .oee-help-formula { display:block; margin:9px 0; padding:8px 10px; border-radius:8px; background:#eff6ff; color:#123b63; font-weight:700; }
        .oee-help-pdf { display:block; margin-top:10px; padding:9px 11px; border-radius:8px; background:#f0fdf4; color:#166534; font-weight:700; text-decoration:underline; }
        .oee-help-draft { display:block; margin-top:5px; color:#92400e; font-size:12px; }
        @media (max-width: 600px) { .oee-help-popover { left: -45px; } }
      `;
      document.head.appendChild(style);
    }

    const headings = [...document.querySelectorAll(".oee-summary-chart .section-title h2")];
    const heading = headings.find((item) => item.textContent?.includes("OEE Summary"));
    if (!heading || heading.parentElement?.querySelector(".oee-help-anchor")) return;

    const anchor = document.createElement("span");
    anchor.className = "oee-help-anchor";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "oee-help-button";
    button.setAttribute("aria-label", "ความหมายและวิธีคำนวณ OEE");
    button.setAttribute("aria-controls", TIP_ID);
    button.setAttribute("aria-expanded", "false");
    button.textContent = "?";

    const tip = document.createElement("div");
    tip.className = "oee-help-popover";
    tip.id = TIP_ID;
    tip.setAttribute("role", "tooltip");
    tip.innerHTML = `
      <strong>OEE คืออะไร?</strong>
      <p>OEE บอกว่าเวลาที่วางแผนผลิต เปลี่ยนเป็นงานดีได้มีประสิทธิภาพแค่ไหน ยิ่งใกล้ 100% ยิ่งดี</p>
      <ul>
        <li><b>Availability (ความพร้อม):</b> เวลาเดินเครื่อง ÷ เวลาผลิตตามแผน</li>
        <li><b>Performance (ความเร็ว):</b> (เวลา/ชิ้นมาตรฐาน × จำนวนผลิตทั้งหมด) ÷ เวลาเดินเครื่อง</li>
        <li><b>Quality (คุณภาพ):</b> จำนวนงานดี ÷ จำนวนผลิตทั้งหมด</li>
      </ul>
      <span class="oee-help-formula">OEE = Availability × Performance × Quality</span>
      <p><b>ตัวอย่างจากเอกสาร:</b> วางแผน 500 นาที หยุด 200 นาที จึงเดินเครื่อง 300 นาที ผลิตทั้งหมด 5,400 ชิ้น งานดี 5,300 ชิ้น และเวลา/ชิ้นมาตรฐาน 0.05 นาที</p>
      <p>Availability = 300 ÷ 500 = 60%<br>Performance = (0.05 × 5,400) ÷ 300 = 90%<br>Quality = 5,300 ÷ 5,400 = 98.15%<br><b>OEE = 60% × 90% × 98.15% ≈ 53.00%</b></p>
      <a class="oee-help-pdf" href="${PROCEDURE_URL}" target="_blank" rel="noopener noreferrer">เปิดเอกสารวิธีคำนวณ OEE (PDF · 5 หน้า) ↗</a>
      <small class="oee-help-draft">เอกสารระบุสถานะ “รออนุมัติ / Draft – For Approval”</small>
    `;
    anchor.append(button, tip);
    heading.insertAdjacentElement("afterend", anchor);

    button.addEventListener("click", () => {
      const open = anchor.classList.toggle("is-open");
      button.setAttribute("aria-expanded", String(open));
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && anchor.classList.contains("is-open")) {
        anchor.classList.remove("is-open");
        button.setAttribute("aria-expanded", "false");
        button.focus();
      }
    });
    document.addEventListener("click", (event) => {
      if (!anchor.contains(event.target) && anchor.classList.contains("is-open")) {
        anchor.classList.remove("is-open");
        button.setAttribute("aria-expanded", "false");
      }
    });
  }

  install();
  new MutationObserver(install).observe(document.documentElement, { childList: true, subtree: true });
})();

