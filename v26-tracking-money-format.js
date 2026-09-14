(() => {
  'use strict';

  // v26.0.9 — Realisasi money fields use Indonesian thousand separators.
  // Kept isolated from the proven tracking core: only SweetAlert inputs with
  // stable-tracking IDs are touched. The existing preConfirm parsers already
  // strip non-digits, so 73.000 is safely stored as 73000.
  const IDS = ['st-revenue', 'st-cost', 'st-amount', 'st-profit'];
  const MARK = '__v2609TrackingMoneyWrapped';

  const digits = value => String(value ?? '').replace(/\D/g, '');
  const format = value => {
    const d = digits(value);
    return d ? Number(d).toLocaleString('id-ID') : '';
  };

  function bindInput(el) {
    if (!el || el.dataset.v2609Money === '1') return;
    el.dataset.v2609Money = '1';
    el.type = 'text';
    el.inputMode = 'numeric';
    el.autocomplete = 'off';
    el.value = format(el.value);
    el.addEventListener('input', () => {
      const before = el.value;
      const next = format(before);
      if (before !== next) el.value = next;
      try { el.setSelectionRange(el.value.length, el.value.length); } catch {}
    });
  }

  function bindPopup() {
    IDS.forEach(id => bindInput(document.getElementById(id)));
  }

  function wrap() {
    if (!window.Swal || typeof Swal.fire !== 'function' || Swal.fire[MARK]) return false;
    const original = Swal.fire;
    const wrapped = function (...args) {
      if (args.length === 1 && args[0] && typeof args[0] === 'object') {
        const opts = args[0];
        const html = typeof opts.html === 'string' ? opts.html : '';
        if (IDS.some(id => html.includes(`id="${id}"`) || html.includes(`id='${id}'`))) {
          const previousDidOpen = opts.didOpen;
          const next = {...opts};
          next.didOpen = popup => {
            try { previousDidOpen?.(popup); } finally { bindPopup(); }
          };
          return original.call(this, next);
        }
      }
      return original.apply(this, args);
    };
    wrapped[MARK] = true;
    wrapped.__original = original;
    Swal.fire = wrapped;
    return true;
  }

  function boot() {
    if (wrap()) return;
    setTimeout(wrap, 300);
    setTimeout(wrap, 900);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
