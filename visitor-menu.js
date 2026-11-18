(() => {
  const params = new URLSearchParams(window.location.search);
  if (params.get("visitor") === "1") {
    const target = new URL("./visitor.html", window.location.href);
    if (params.has("customer")) target.searchParams.set("customer", params.get("customer"));
    window.location.replace(target.href);
    return;
  }
  const addItems = () => {
    const nav = document.querySelector(".side-nav nav");
    if (nav && !nav.querySelector("[data-visitor-public]")) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.visitorPublic = "1";
      button.innerHTML = '<span class="nav-icon-badge" aria-hidden="true">◉</span> ดูรายงานผู้เยี่ยมชม / Visitor Production';
      button.addEventListener("click", () => window.location.assign("./visitor.html"));
      nav.appendChild(button);
    }    if (nav && !nav.querySelector("[data-visitor-admin]")) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.visitorAdmin = "1";
      button.innerHTML = '<span class="nav-icon-badge" aria-hidden="true">◉</span> กำหนดสิทธิ์ผู้เยี่ยมชม / Visitor Access';
      button.addEventListener("click", () => window.location.assign("./visitor-admin.html"));
      nav.appendChild(button);
    }
    const login = document.querySelector(".login-card");
    if (login && !login.querySelector("[data-visitor-report]")) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "ghost-button";
      button.dataset.visitorReport = "1";
      button.textContent = "ดูรายงานสำหรับผู้เยี่ยมชม / Visitor Production";
      button.addEventListener("click", () => window.location.assign("./visitor.html"));
      login.appendChild(button);
    }
  };
  addItems();
  new MutationObserver(addItems).observe(document.documentElement, { childList: true, subtree: true });
})();


