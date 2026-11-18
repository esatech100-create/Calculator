/* app.js — ربط كل الأجزاء ببعضها */
(function () {
  'use strict';
  const S = AppSettings, U = AppUI, h = U.h, t = S.t;
  const $ = id => document.getElementById(id);
  const MODES = ['basic', 'scientific', 'percent', 'discount', 'converter', 'date'];
  let mode = MODES.includes(S.get('mode')) ? S.get('mode') : 'basic';

  // [النص, النوع (v=إدراج، a=إجراء), القيمة, الصنف]
  const KEYS = [
    ['C', 'a', 'clear', 'danger'], ['⌫', 'a', 'back', 'fn'], ['(', 'v', '(', 'fn'], [')', 'v', ')', 'fn'],
    ['7', 'v', '7', ''], ['8', 'v', '8', ''], ['9', 'v', '9', ''], ['÷', 'v', '÷', 'op'],
    ['4', 'v', '4', ''], ['5', 'v', '5', ''], ['6', 'v', '6', ''], ['×', 'v', '×', 'op'],
    ['1', 'v', '1', ''], ['2', 'v', '2', ''], ['3', 'v', '3', ''], ['−', 'v', '-', 'op'],
    ['0', 'v', '0', ''], ['.', 'v', '.', ''], ['%', 'v', '%', 'fn'], ['+', 'v', '+', 'op'],
    ['±', 'a', 'negate', 'fn'], ['=', 'a', 'equals', 'equals']
  ];

  const pad = new Calc.ExpressionPad({
    exprEl: $('expr'), resultEl: $('result'),
    onResult: (e, r) => AppHistory.add(e, r)
  });

  function keyBtn(label, kind, val, cls) {
    return h('button', { class: 'key ' + cls, type: 'button', 'data-k': kind, 'data-v': val }, label);
  }

  function handleKey(e) {
    const b = e.target.closest('button[data-k]');
    if (!b) return;
    if (b.dataset.v === 'angle') {
      S.set('angle', S.get('angle') === 'deg' ? 'rad' : 'deg');
      updateAngle(); pad.refresh();
      return;
    }
    pad.press(b.dataset.k, b.dataset.v);
  }

  function buildKeys() {
    $('keypad').replaceChildren(...KEYS.map(k => keyBtn(k[0], k[1], k[2], k[3])));
    $('sci').replaceChildren(...Scientific.keys.map(k =>
      k.a ? keyBtn(k.l, 'a', k.a, 'angle') : keyBtn(k.l, 'v', k.v, '')));
    updateAngle();
  }

  function updateAngle() {
    const b = document.querySelector('#sci .angle');
    if (b) b.textContent = t(S.get('angle'));
  }

  function buildNav() {
    $('nav').replaceChildren(...MODES.map(m =>
      h('button', { class: 'mode-tab' + (m === mode ? ' active' : ''), type: 'button', 'data-mode': m,
        onclick: () => setMode(m) }, t(m))));
  }

  function renderPanels() {
    Percentage.renderPercent($('panel-percent'));
    Percentage.renderDiscount($('panel-discount'));
    Percentage.renderDate($('panel-date'));
    Converter.render($('panel-converter'));
  }

  function setMode(m) {
    mode = m;
    S.set('mode', m);
    document.querySelectorAll('.mode-tab').forEach(b => b.classList.toggle('active', b.dataset.mode === m));
    $('panel-calc').hidden = !(m === 'basic' || m === 'scientific');
    $('sci').hidden = m !== 'scientific';
    ['percent', 'discount', 'converter', 'date'].forEach(x => { $('panel-' + x).hidden = x !== m; });
  }

  /* ----- السجل ----- */
  const useFromHistory = v => { setMode(mode === 'scientific' ? 'scientific' : 'basic'); pad.useValue(v); closeHistory(); };
  function openHistory() { AppHistory.render($('hist-list'), useFromHistory); $('sheet').hidden = false; }
  function closeHistory() { $('sheet').hidden = true; }

  /* ----- الأحداث ----- */
  $('keypad').addEventListener('click', handleKey);
  $('sci').addEventListener('click', handleKey);
  $('result').addEventListener('click', () => { const s = pad.getShown(); if (s) U.copy(s); });
  $('btn-theme').addEventListener('click', () => S.toggleTheme());
  $('btn-sound').addEventListener('click', () => { S.toggleSound(); S.click(); });
  $('btn-lang').addEventListener('click', () => {
    S.toggleLang(); buildNav(); renderPanels(); updateAngle(); pad.refresh();
    if (!$('sheet').hidden) openHistory();
  });
  $('btn-history').addEventListener('click', openHistory);
  $('sheet-close').addEventListener('click', closeHistory);
  $('sheet').addEventListener('click', e => { if (e.target === $('sheet')) closeHistory(); });
  $('hist-clear').addEventListener('click', () => { AppHistory.clear(); openHistory(); });

  // لوحة المفاتيح
  const KMAP = { '+': '+', '-': '-', '*': '×', x: '×', X: '×', '/': '÷', '^': '^', '(': '(', ')': ')', '%': '%', '!': '!', '.': '.', ',': '.', p: 'π' };
  document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (!(mode === 'basic' || mode === 'scientific') || !$('sheet').hidden) return;
    if (e.target && /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
    const k = e.key;
    let m = null;
    if (/^\d$/.test(k)) m = ['v', k];
    else if (k === 'Enter' || k === '=') m = ['a', 'equals'];
    else if (k === 'Backspace') m = ['a', 'back'];
    else if (k === 'Escape' || k === 'Delete') m = ['a', 'clear'];
    else if (Object.prototype.hasOwnProperty.call(KMAP, k)) m = ['v', KMAP[k]];
    if (m) { e.preventDefault(); pad.press(m[0], m[1]); }
  });

  /* ----- التشغيل ----- */
  S.init();
  buildKeys();
  buildNav();
  renderPanels();
  setMode(mode);

  // PWA: يعمل فقط عبر http/https (وليس file://)
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', () => navigator.serviceWorker.register('service-worker.js').catch(() => {}));
  }
})();
