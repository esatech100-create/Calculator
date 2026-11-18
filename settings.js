/* settings.js — الإعدادات (ثيم/لغة/صوت/زاوية) + الترجمة + أدوات واجهة مشتركة */
(function () {
  'use strict';

  const D = {
    title: ['الآلة الحاسبة', 'Calculator'],
    basic: ['أساسية', 'Basic'], scientific: ['علمية', 'Scientific'], percent: ['نسب مئوية', 'Percentages'],
    discount: ['خصومات', 'Discounts'], converter: ['محول الوحدات', 'Converter'], date: ['التاريخ', 'Date'],
    history: ['سجل العمليات', 'History'], clearAll: ['مسح السجل', 'Clear history'],
    empty: ['لا توجد عمليات بعد', 'No history yet'], copied: ['تم النسخ', 'Copied'],
    deg: ['DEG درجات', 'DEG'], rad: ['RAD راديان', 'RAD'],
    e_syntax: ['صيغة غير صحيحة', 'Invalid expression'], e_divzero: ['لا يمكن القسمة على صفر', 'Cannot divide by zero'],
    e_domain: ['عملية غير معرّفة', 'Undefined operation'], e_overflow: ['الرقم كبير جدًا', 'Number too large'],
    e_input: ['أدخل قيمًا صحيحة', 'Enter valid values'],
    p1: ['نسبة من رقم', 'Percent of a number'], p2: ['رقم كنسبة من رقم آخر', 'Number as % of another'],
    p3: ['الزيادة / النقصان', 'Increase / decrease'], p4: ['الفرق بين قيمتين', 'Difference between values'],
    f_pct: ['النسبة %', 'Percent %'], f_num: ['الرقم', 'Number'], f_a: ['الرقم الأول', 'First number'],
    f_b: ['الرقم الثاني', 'Second number'], f_from: ['من قيمة', 'From value'], f_to: ['إلى قيمة', 'To value'],
    r_res: ['النتيجة', 'Result'], r_diff: ['الفرق', 'Difference'], r_inc: ['زيادة بنسبة', 'Increase of'],
    r_dec: ['نقصان بنسبة', 'Decrease of'], r_pct: ['نسبة الفرق', 'Difference %'],
    d_title: ['حاسبة الخصم', 'Discount calculator'], d_price: ['السعر الأصلي', 'Original price'],
    d_pct: ['نسبة الخصم %', 'Discount %'], r_final: ['السعر بعد الخصم', 'Price after discount'],
    r_save: ['قيمة التوفير', 'You save'],
    dt_diff: ['الفرق بين تاريخين', 'Difference between dates'], dt_add: ['إضافة إلى تاريخ', 'Add to a date'],
    dt_sub: ['طرح من تاريخ', 'Subtract from a date'], dt_from: ['من تاريخ', 'From date'], dt_to: ['إلى تاريخ', 'To date'],
    dt_base: ['التاريخ', 'Date'], f_years: ['سنوات', 'Years'], f_months: ['أشهر', 'Months'], f_days: ['أيام', 'Days'],
    r_days: ['عدد الأيام', 'Total days'], r_ymd: ['الفرق', 'Difference'], r_date: ['التاريخ الناتج', 'Resulting date'],
    u_y: ['سنة', 'y'], u_m: ['شهر', 'm'], u_d: ['يوم', 'd'],
    u_length: ['الطول', 'Length'], u_mass: ['الوزن', 'Weight'], u_area: ['المساحة', 'Area'], u_volume: ['الحجم', 'Volume'],
    u_temp: ['درجة الحرارة', 'Temperature'], u_speed: ['السرعة', 'Speed'], u_time: ['الزمن', 'Time'],
    u_data: ['البيانات الرقمية', 'Digital data'],
    f_cat: ['النوع', 'Type'], f_value: ['القيمة', 'Value'], f_ufrom: ['من', 'From'], f_uto: ['إلى', 'To']
  };

  const DEFAULTS = { theme: null, lang: 'ar', sound: false, angle: 'deg', mode: 'basic' };
  const state = Object.assign({}, DEFAULTS, AppStorage.get('settings', {}));
  let audioCtx = null;

  const save = () => AppStorage.set('settings', state);
  const systemTheme = () => (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const theme = () => state.theme || systemTheme();

  function apply() {
    const th = theme();
    document.documentElement.setAttribute('data-theme', th);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', th === 'dark' ? '#0f1117' : '#f4f5f9');
    const set = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
    set('btn-theme', th === 'dark' ? '☀️' : '🌙');
    set('btn-sound', state.sound ? '🔊' : '🔇');
    set('btn-lang', state.lang === 'ar' ? 'EN' : 'ع');
    const ar = state.lang === 'ar';
    document.documentElement.lang = ar ? 'ar' : 'en';
    document.documentElement.dir = ar ? 'rtl' : 'ltr';
    document.title = AppSettings.t('title');
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = AppSettings.t(el.dataset.i18n); });
  }

  const AppSettings = {
    init: apply,
    get: k => state[k],
    set(k, v) { state[k] = v; save(); },
    lang: () => state.lang,
    t(key) { const e = D[key]; return e ? e[state.lang === 'ar' ? 0 : 1] : key; },
    toggleTheme() { state.theme = theme() === 'dark' ? 'light' : 'dark'; save(); apply(); },
    toggleLang() { state.lang = state.lang === 'ar' ? 'en' : 'ar'; save(); apply(); },
    toggleSound() { state.sound = !state.sound; save(); apply(); },
    click() {
      if (!state.sound) return;
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        audioCtx = audioCtx || new AC();
        const o = audioCtx.createOscillator(), g = audioCtx.createGain(), t = audioCtx.currentTime;
        o.type = 'sine'; o.frequency.value = 660;
        g.gain.setValueAtTime(0.08, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
        o.connect(g); g.connect(audioCtx.destination);
        o.start(t); o.stop(t + 0.07);
      } catch (e) { /* تجاهل */ }
    }
  };

  const AppUI = {
    // إنشاء عنصر DOM بأمان (textContent وليس innerHTML)
    h(tag, attrs, ...kids) {
      const el = document.createElement(tag);
      for (const k in attrs || {}) {
        const v = attrs[k];
        if (k === 'class') el.className = v;
        else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
        else if (v !== false && v != null) el.setAttribute(k, v);
      }
      kids.flat().filter(c => c != null).forEach(c => el.append(c));
      return el;
    },
    toast(msg) {
      const el = document.getElementById('toast');
      if (!el) return;
      el.textContent = msg;
      el.classList.add('show');
      clearTimeout(AppUI._tt);
      AppUI._tt = setTimeout(() => el.classList.remove('show'), 1400);
    },
    copy(text) {
      const done = () => AppUI.toast(AppSettings.t('copied'));
      const fallback = () => {
        const ta = document.createElement('textarea');
        ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.append(ta); ta.select();
        try { document.execCommand('copy'); done(); } catch (e) { /* تجاهل */ }
        ta.remove();
      };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback);
      else fallback();
    }
  };

  window.AppSettings = AppSettings;
  window.AppUI = AppUI;
})();
