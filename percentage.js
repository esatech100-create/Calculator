/* percentage.js — حاسبات النسب المئوية والخصومات والتاريخ */
(function () {
  'use strict';
  const S = AppSettings, U = AppUI, h = U.h, t = S.t, E = Calc.Engine;
  const f = n => E.format(n);

  // بطاقة عامة: حقول + دالة حساب ترجع أسطر [مفتاح_العنوان, القيمة]
  function card(title, fields, calc) {
    const out = h('div', { class: 'out' });
    const inputs = fields.map(F => h('input', {
      type: F.type || 'number', inputmode: F.type === 'date' ? null : 'decimal', step: 'any',
      value: F.val != null ? F.val : null, oninput: update
    }));
    function update() {
      const vals = inputs.map((el, i) => (fields[i].type === 'date' ? el.value : (el.value === '' ? NaN : Number(el.value))));
      out.replaceChildren();
      if (vals.some(v => v === '' || Number.isNaN(v))) return;
      try {
        calc(vals).forEach(([k, v]) => out.append(h('div', { class: 'line' },
          h('span', {}, t(k)), h('b', { onclick: () => U.copy(v) }, v))));
      } catch (e) {
        out.append(h('div', { class: 'line err' }, t('e_' + (typeof e === 'string' ? e : 'domain'))));
      }
    }
    return h('div', { class: 'card' }, h('h2', {}, t(title)),
      ...fields.map((F, i) => h('label', { class: 'field' }, h('span', {}, t(F.k)), inputs[i])), out);
  }

  function renderPercent(el) {
    el.replaceChildren(
      card('p1', [{ k: 'f_pct' }, { k: 'f_num' }], ([p, n]) => [['r_res', f(p / 100 * n)]]),
      card('p2', [{ k: 'f_a' }, { k: 'f_b' }], ([a, b]) => {
        if (b === 0) throw 'divzero';
        return [['r_res', f(a / b * 100) + '%']];
      }),
      card('p3', [{ k: 'f_from' }, { k: 'f_to' }], ([a, b]) => {
        if (a === 0) throw 'divzero';
        const ch = (b - a) / a * 100;
        return [['r_diff', f(b - a)], [ch >= 0 ? 'r_inc' : 'r_dec', f(Math.abs(ch)) + '%']];
      }),
      card('p4', [{ k: 'f_a' }, { k: 'f_b' }], ([a, b]) => {
        const lines = [['r_diff', f(Math.abs(a - b))]];
        const avg = Math.abs(a + b) / 2;
        if (avg !== 0) lines.push(['r_pct', f(Math.abs(a - b) / avg * 100) + '%']);
        return lines;
      })
    );
  }

  function renderDiscount(el) {
    el.replaceChildren(card('d_title', [{ k: 'd_price' }, { k: 'd_pct' }], ([price, pct]) => {
      if (price < 0 || pct < 0 || pct > 100) throw 'input';
      const save = price * pct / 100;
      return [['r_final', f(price - save)], ['r_save', f(save)]];
    }));
  }

  /* ----- التاريخ (UTC لتجنب مشاكل التوقيت الصيفي) ----- */
  const P = s => { const [y, m, d] = s.split('-').map(Number); return { y, m: m - 1, d }; };
  const dim = (y, m) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const iso = d => d.toISOString().slice(0, 10);

  function dateDiff([a, b]) {
    let A = P(a), B = P(b);
    const ta = Date.UTC(A.y, A.m, A.d), tb = Date.UTC(B.y, B.m, B.d);
    const days = Math.round(Math.abs(tb - ta) / 864e5);
    if (ta > tb) [A, B] = [B, A];
    let y = B.y - A.y, m = B.m - A.m, d = B.d - A.d, pm = B.m - 1, py = B.y;
    if (pm < 0) { pm = 11; py--; }
    while (d < 0) { m--; d += dim(py, pm); pm--; if (pm < 0) { pm = 11; py--; } }
    if (m < 0) { y--; m += 12; }
    return [['r_days', String(days)], ['r_ymd', `${y} ${t('u_y')} ${m} ${t('u_m')} ${d} ${t('u_d')}`]];
  }

  function dateShift(sign) {
    return ([base, Y, M, D]) => {
      const B = P(base);
      const tm = B.y * 12 + B.m + sign * (Math.trunc(Y) * 12 + Math.trunc(M));
      const ny = Math.floor(tm / 12), nm = ((tm % 12) + 12) % 12;
      const day = Math.min(B.d, dim(ny, nm));
      const r = new Date(Date.UTC(ny, nm, day + sign * Math.trunc(D)));
      const wd = r.toLocaleDateString(S.lang() === 'ar' ? 'ar' : 'en', { weekday: 'long', timeZone: 'UTC' });
      return [['r_date', iso(r) + ' — ' + wd]];
    };
  }

  function renderDate(el) {
    const shiftFields = [{ k: 'dt_base', type: 'date' }, { k: 'f_years', val: 0 }, { k: 'f_months', val: 0 }, { k: 'f_days', val: 0 }];
    el.replaceChildren(
      card('dt_diff', [{ k: 'dt_from', type: 'date' }, { k: 'dt_to', type: 'date' }], dateDiff),
      card('dt_add', shiftFields, dateShift(1)),
      card('dt_sub', shiftFields, dateShift(-1))
    );
  }

  window.Percentage = { renderPercent, renderDiscount, renderDate };
})();
