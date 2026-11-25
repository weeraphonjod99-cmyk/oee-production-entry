(() => {
  const installMonthlySummaryMenu = () => {
    const nav = document.querySelector('.side-nav nav');
    if (!nav || nav.querySelector('[data-monthly-summary-menu]')) return;
    if ([...nav.querySelectorAll('button')].some((button) => /สรุปรายงาน.*เดือน|Monthly Summary/i.test(button.textContent || ''))) return;

    const dashboardButton = [...nav.querySelectorAll('button')].find((button) =>
      /ภาพรวม\s*\/\s*Dashboard/i.test(button.textContent || '')
    );
    if (!dashboardButton) return;

    const reportButton = [...nav.querySelectorAll('button')].find((button) =>
      /รายงานการผลิต\s*\/\s*Production Report/i.test(button.textContent || '')
    );
    const menuButton = document.createElement('button');
    menuButton.type = 'button';
    menuButton.dataset.monthlySummaryMenu = 'true';
    menuButton.setAttribute('aria-label', 'สรุปรายงานประจำเดือน / Monthly Summary');
    menuButton.innerHTML = '<span aria-hidden="true">▦</span> สรุปรายงานประจำเดือน / Monthly Summary';
    menuButton.addEventListener('click', () => {
      dashboardButton.click();
      window.setTimeout(() => {
        const report = document.querySelector('.monthly-report');
        if (report) {
          report.scrollIntoView({ behavior: 'smooth', block: 'start' });
          report.setAttribute('tabindex', '-1');
          report.focus({ preventScroll: true });
        }
      }, 180);
    });

    if (reportButton?.parentElement === nav) reportButton.insertAdjacentElement('afterend', menuButton);
    else dashboardButton.insertAdjacentElement('afterend', menuButton);
  };

  installMonthlySummaryMenu();
  const observer = new MutationObserver(installMonthlySummaryMenu);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('pageshow', installMonthlySummaryMenu);
})();
