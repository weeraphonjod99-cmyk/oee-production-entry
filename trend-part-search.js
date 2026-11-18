(() => {
  if (window.__trendPartSearchInstalled) return;
  window.__trendPartSearchInstalled = true;

  const selector = 'select[aria-label="เลือกชิ้นงานสำหรับกราฟ"]';
  const styleId = 'trend-part-search-style';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .trend-part-search { position: relative; display: inline-block; min-width: 250px; }
      .trend-part-search input { box-sizing: border-box; width: 270px; max-width: 100%; min-width: 220px; padding: 8px 10px; border: 1px solid #bfd2e7; border-radius: 7px; background: #fff; color: #24496d; font: inherit; }
      .trend-part-search input:focus { outline: 2px solid #9bc9f3; outline-offset: 1px; border-color: #3986df; }
      .trend-part-search-list { position: absolute; z-index: 1000; top: calc(100% + 4px); left: 0; width: max(100%, 270px); max-width: min(380px, 82vw); max-height: 300px; overflow: auto; padding: 4px; border: 1px solid #c5d8e9; border-radius: 8px; background: #fff; box-shadow: 0 8px 24px #1839542b; }
      .trend-part-search-list[hidden] { display: none; }
      .trend-part-search-list button { display: block; width: 100%; padding: 8px 10px; border: 0; border-radius: 5px; background: transparent; color: #254765; text-align: left; font: inherit; font-size: 12px; cursor: pointer; }
      .trend-part-search-list button:hover, .trend-part-search-list button.active { background: #e8f2fc; }
      .trend-part-search-list button[aria-selected="true"] { font-weight: 700; color: #14558f; }
      .trend-part-search-empty, .trend-part-search-count { display: block; padding: 8px 10px; color: #64796d; font-size: 11px; }
      .trend-part-search-source { position: absolute !important; width: 1px !important; height: 1px !important; padding: 0 !important; margin: -1px !important; overflow: hidden !important; clip: rect(0, 0, 0, 0) !important; white-space: nowrap !important; border: 0 !important; opacity: 0 !important; pointer-events: none !important; }
    `;
    document.head.append(style);
  }

  let nextId = 0;
  const enhance = select => {
    if (select.dataset.trendSearchEnhanced === '1' || !select.parentElement) return;
    select.dataset.trendSearchEnhanced = '1';
    select.classList.add('trend-part-search-source');
    select.tabIndex = -1;

    const wrapper = document.createElement('div');
    wrapper.className = 'trend-part-search';
    wrapper.addEventListener('click', event => event.stopPropagation());
    const input = document.createElement('input');
    input.type = 'search';
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-label', 'ค้นหาชิ้นงานตามชื่อ, Part No. หรือ Step');
    input.placeholder = 'พิมพ์ชื่อชิ้นงานหรือ Part No. เพื่อค้นหา';
    input.autocomplete = 'off';

    const list = document.createElement('div');
    list.className = 'trend-part-search-list';
    list.id = `trend-part-search-list-${++nextId}`;
    list.setAttribute('role', 'listbox');
    list.setAttribute('aria-label', 'ผลการค้นหาชิ้นงาน');
    input.setAttribute('aria-controls', list.id);
    list.hidden = true;
    wrapper.append(input, list);
    select.parentElement.insertBefore(wrapper, select);

    let open = false;
    let query = '';
    let active = 0;
    let visibleOptions = [];
    const options = () => Array.from(select.options).map(option => ({ value: option.value, label: option.textContent.trim() }));
    const syncInput = () => {
      const selected = select.options[select.selectedIndex];
      input.value = selected && selected.value ? selected.textContent.trim() : '';
    };
    const close = restore => {
      open = false;
      query = '';
      list.hidden = true;
      input.setAttribute('aria-expanded', 'false');
      if (restore) syncInput();
    };
    const choose = value => {
      select.value = value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      close(true);
    };
    const render = () => {
      const all = options();
      const needle = query.trim().toLocaleLowerCase('th');
      visibleOptions = all.filter(option => !needle || option.label.toLocaleLowerCase('th').includes(needle));
      const limited = visibleOptions.slice(0, 250);
      list.replaceChildren();
      const addOption = (option, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('role', 'option');
        button.setAttribute('aria-selected', String(select.value === option.value));
        button.classList.toggle('active', active === index);
        button.textContent = option.label;
        button.addEventListener('mousedown', event => event.preventDefault());
        button.addEventListener('click', () => choose(option.value));
        list.append(button);
      };
      if (!needle) {
        addOption(all.find(option => option.value === '') || { value: '', label: 'ทั้งหมด / All' }, 0);
        limited.filter(option => option.value !== '').forEach((option, index) => addOption(option, index + 1));
      } else {
        limited.forEach((option, index) => addOption(option, index));
      }
      if (!visibleOptions.length) {
        const empty = document.createElement('span');
        empty.className = 'trend-part-search-empty';
        empty.textContent = 'ไม่พบชิ้นงานที่ตรงกัน';
        list.append(empty);
      }
      if (visibleOptions.length > limited.length) {
        const count = document.createElement('span');
        count.className = 'trend-part-search-count';
        count.textContent = `แสดง ${limited.length} จาก ${visibleOptions.length} รายการ — พิมพ์เพิ่มเพื่อกรองให้แคบลง`;
        list.append(count);
      }
      list.hidden = false;
      input.setAttribute('aria-expanded', 'true');
    };

    input.addEventListener('focus', () => {
      open = true;
      query = '';
      input.value = '';
      const current = options().findIndex(option => option.value === select.value);
      active = select.value ? Math.max(1, current) : 0;
      render();
    });
    input.addEventListener('input', () => {
      query = input.value;
      active = 0;
      open = true;
      render();
    });
    input.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close(true);
      } else if (event.key === 'ArrowDown' && open) {
        event.preventDefault();
        active = Math.min(active + 1, Math.max(0, visibleOptions.length - (query ? 1 : 0)));
        render();
      } else if (event.key === 'ArrowUp' && open) {
        event.preventDefault();
        active = Math.max(0, active - 1);
        render();
      } else if (event.key === 'Enter' && open) {
        event.preventDefault();
        if (!query && active === 0) choose('');
        else {
          const offset = query ? 0 : 1;
          const option = visibleOptions[active - offset];
          if (option) choose(option.value);
        }
      }
    });
    input.addEventListener('blur', () => setTimeout(() => {
      if (!wrapper.contains(document.activeElement)) close(true);
    }, 80));
    select.addEventListener('change', syncInput);
    syncInput();
  };

  const scan = () => document.querySelectorAll(selector).forEach(enhance);
  scan();
  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
})();

