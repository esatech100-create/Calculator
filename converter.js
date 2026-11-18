/* converter.js — محول الوحدات */
(function () {
  'use strict';
  const S = AppSettings, U = AppUI, h = U.h, t = S.t, E = Calc.Engine;

  // المعامل = كم وحدة أساسية في هذه الوحدة (الأساس: م، كغ، م²، لتر، م/ث، ثانية، بايت)
  const C = {
    length: { m: 1, mm: 0.001, cm: 0.01, km: 1000, in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344 },
    mass: { kg: 1, mg: 1e-6, g: 0.001, t: 1000, oz: 0.028349523125, lb: 0.45359237 },
    area: { 'm²': 1, 'cm²': 1e-4, ha: 1e4, 'km²': 1e6, 'ft²': 0.09290304, ac: 4046.8564224 },
    volume: { L: 1, mL: 0.001, 'm³': 1000, gal: 3.785411784, cup: 0.2365882365, 'fl oz': 0.0295735295625 },
    temp: { '°C': 1, '°F': 1, K: 1 },
    speed: { 'm/s': 1, 'km/h': 1 / 3.6, mph: 0.44704, kn: 1852 / 3600 },
    time: { s: 1, ms: 0.001, min: 60, h: 3600, day: 86400, week: 604800 },
    data: { B: 1, bit: 0.125, KB: 1024, MB: 1048576, GB: 1073741824, TB: 1099511627776 }
  };

  function convert(cat, v, from, to) {
    if (cat === 'temp') {
      const c = from === '°C' ? v : from === '°F' ? (v - 32) * 5 / 9 : v - 273.15;
      return to === '°C' ? c : to === '°F' ? c * 9 / 5 + 32 : c + 273.15;
    }
    return v * C[cat][from] / C[cat][to];
  }

  let cat = 'length';

  function render(el) {
    const opts = () => Object.keys(C[cat]).map(u => h('option', { value: u }, u));
    const catSel = h('select', {}, ...Object.keys(C).map(k => h('option', { value: k }, t('u_' + k))));
    const val = h('input', { type: 'number', inputmode: 'decimal', step: 'any', value: 1 });
    const from = h('select', {}), to = h('select', {});
    const out = h('div', { class: 'out' });

    function fill() {
      from.replaceChildren(...opts()); to.replaceChildren(...opts());
      const keys = Object.keys(C[cat]);
      from.value = keys[0]; to.value = keys[1];
    }
    function calc() {
      out.replaceChildren();
      if (val.value === '') return;
      try {
        const txt = E.format(convert(cat, Number(val.value), from.value, to.value)) + ' ' + to.value;
        out.append(h('div', { class: 'line big' }, h('span', {}, t('r_res')), h('b', { onclick: () => U.copy(txt) }, txt)));
      } catch (e) {
        out.append(h('div', { class: 'line err' }, t('e_overflow')));
      }
    }

    catSel.value = cat;
    fill();
    catSel.addEventListener('change', () => { cat = catSel.value; fill(); calc(); });
    [val, from, to].forEach(x => x.addEventListener('input', calc));
    from.addEventListener('change', calc); to.addEventListener('change', calc);

    const swap = h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Swap', onclick: () => {
      const a = from.value; from.value = to.value; to.value = a; calc();
    } }, '⇄');

    el.replaceChildren(h('div', { class: 'card' },
      h('label', { class: 'field' }, h('span', {}, t('f_cat')), catSel),
      h('label', { class: 'field' }, h('span', {}, t('f_value')), val),
      h('div', { class: 'row' },
        h('label', { class: 'field' }, h('span', {}, t('f_ufrom')), from), swap,
        h('label', { class: 'field' }, h('span', {}, t('f_uto')), to)),
      out));
    calc();
  }

  window.Converter = { render };
})();
