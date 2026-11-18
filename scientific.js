/* scientific.js — الدوال العلمية + تعريف أزرار الوضع العلمي */
(function () {
  'use strict';
  const E = Calc.Engine, S = AppSettings;
  const bad = () => new Calc.CalcError('domain');
  const D2R = Math.PI / 180;
  const isDeg = () => S.get('angle') === 'deg';
  const toRad = x => (isDeg() ? x * D2R : x);
  const fromRad = x => (isDeg() ? x / D2R : x);
  const tiny = v => (Math.abs(v) < 1e-14 ? 0 : v);      // sin(180°) = 0 وليس 1.2e-16

  E.functions = {
    sin: x => tiny(Math.sin(toRad(x))),
    cos: x => tiny(Math.cos(toRad(x))),
    tan: x => {
      const r = toRad(x);
      if (Math.abs(Math.cos(r)) < 1e-14) throw bad();     // tan(90°) غير معرّف
      return tiny(Math.tan(r));
    },
    asin: x => fromRad(Math.asin(x)),
    acos: x => fromRad(Math.acos(x)),
    atan: x => fromRad(Math.atan(x)),
    ln: x => { if (x <= 0) throw bad(); return Math.log(x); },
    log: x => { if (x <= 0) throw bad(); return Math.log10(x); },
    sqrt: x => { if (x < 0) throw bad(); return Math.sqrt(x); },
    cbrt: x => Math.cbrt(x),
    abs: x => Math.abs(x),
    exp: x => Math.exp(x)
  };

  // l = النص على الزر ، v = ما يُدرَج ، a = إجراء خاص
  window.Scientific = {
    keys: [
      { l: 'sin', v: 'sin(' }, { l: 'cos', v: 'cos(' }, { l: 'tan', v: 'tan(' }, { l: 'DEG', a: 'angle' },
      { l: 'sin⁻¹', v: 'asin(' }, { l: 'cos⁻¹', v: 'acos(' }, { l: 'tan⁻¹', v: 'atan(' }, { l: 'π', v: 'π' },
      { l: 'ln', v: 'ln(' }, { l: 'log', v: 'log(' }, { l: '√', v: 'sqrt(' }, { l: 'x²', v: '^2' },
      { l: 'xʸ', v: '^' }, { l: 'n!', v: '!' }, { l: 'e', v: 'e' }, { l: '|x|', v: 'abs(' }
    ]
  };
})();
