/* calculator.js — المحرك الحسابي (بدون eval) + متحكم لوحة الإدخال */
(function () {
  'use strict';

  class CalcError extends Error {
    constructor(code) { super(code); this.code = code; }
  }

  // تقريب إلى 15 رقمًا معنويًا يزيل أخطاء مثل 0.1 + 0.2
  function clean(v) {
    if (Number.isNaN(v)) throw new CalcError('domain');
    if (!Number.isFinite(v)) throw new CalcError('overflow');
    if (v === 0) return 0;
    return parseFloat(v.toPrecision(15));
  }

  function factorial(n) {
    if (!Number.isInteger(n) || n < 0) throw new CalcError('domain');
    if (n > 170) throw new CalcError('overflow');
    let r = 1;
    for (let i = 2; i <= n; i++) r *= i;
    return r;
  }

  function power(b, e) {
    if (b === 0 && e < 0) throw new CalcError('divzero');
    if (b < 0 && !Number.isInteger(e)) throw new CalcError('domain');
    return Math.pow(b, e);
  }

  function tokenize(src) {
    const s = src.replace(/\s+/g, '').replace(/×/g, '*').replace(/÷/g, '/').replace(/[−–]/g, '-');
    const tokens = [];
    const numRe = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i;
    const idRe = /^(π|[a-z]+)/i;
    let i = 0;
    while (i < s.length) {
      const rest = s.slice(i);
      let m;
      if ((m = numRe.exec(rest))) { tokens.push({ t: 'num', v: parseFloat(m[0]) }); i += m[0].length; }
      else if ((m = idRe.exec(rest))) { tokens.push({ t: 'id', v: m[0] }); i += m[0].length; }
      else if ('+-*/^()%!,'.indexOf(rest[0]) !== -1) { tokens.push({ t: rest[0] }); i += 1; }
      else throw new CalcError('syntax');
    }
    return tokens;
  }

  const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

  const Engine = {
    constants: { 'π': Math.PI, 'e': Math.E },
    functions: {},                       // تُسجَّل في scientific.js

    messageFor(code) {
      const k = 'e_' + code;
      const msg = AppSettings.t(k);
      return msg === k ? AppSettings.t('e_syntax') : msg;
    },

    // Recursive Descent Parser: يحترم أولوية العمليات
    evaluate(src) {
      const tokens = tokenize(src);
      if (!tokens.length) throw new CalcError('syntax');
      let pos = 0;
      const peek = () => tokens[pos];
      const next = () => tokens[pos++];

      function parseExpr() {
        let left = parseTerm();
        while (peek() && (peek().t === '+' || peek().t === '-')) {
          const op = next().t;
          const right = parseTerm();
          let rv = right.value;
          if (right.pct) rv = left.value * right.value;   // 200 + 10% = 220
          left = { value: clean(op === '+' ? left.value + rv : left.value - rv), pct: false };
        }
        return left;
      }

      function parseTerm() {
        let left = parseUnary();
        for (;;) {
          const p = peek();
          if (!p) break;
          let op;
          if (p.t === '*' || p.t === '/') { next(); op = p.t; }
          else if (p.t === '(' || p.t === 'num' || p.t === 'id') op = '*';   // ضرب ضمني: 2(3) أو 2π
          else break;
          const right = parseUnary();
          let v;
          if (op === '*') v = left.value * right.value;
          else {
            if (right.value === 0) throw new CalcError('divzero');
            v = left.value / right.value;
          }
          left = { value: clean(v), pct: false };
        }
        return left;
      }

      function parseUnary() {
        const p = peek();
        if (p && p.t === '-') { next(); const v = parseUnary(); return { value: -v.value, pct: v.pct }; }
        if (p && p.t === '+') { next(); return parseUnary(); }
        return parsePower();
      }

      function parsePower() {
        const base = parsePostfix();
        if (peek() && peek().t === '^') {
          next();
          const exp = parseUnary();            // ترابط من اليمين: 2^3^2 = 2^9
          return { value: clean(power(base.value, exp.value)), pct: false };
        }
        return base;
      }

      function parsePostfix() {
        let node = parsePrimary();
        for (;;) {
          const p = peek();
          if (p && p.t === '%') { next(); node = { value: clean(node.value / 100), pct: true }; }
          else if (p && p.t === '!') { next(); node = { value: clean(factorial(node.value)), pct: false }; }
          else break;
        }
        return node;
      }

      function parsePrimary() {
        const p = next();
        if (!p) throw new CalcError('syntax');
        if (p.t === 'num') return { value: p.v, pct: false };
        if (p.t === '(') {
          const inner = parseExpr();
          if (!peek() || peek().t !== ')') throw new CalcError('syntax');
          next();
          return { value: inner.value, pct: false };
        }
        if (p.t === 'id') {
          const name = p.v.toLowerCase();
          if (has(Engine.constants, name)) return { value: Engine.constants[name], pct: false };
          if (has(Engine.functions, name)) {
            if (!peek() || peek().t !== '(') throw new CalcError('syntax');
            next();
            const args = [];
            if (peek() && peek().t === ')') next();
            else {
              for (;;) {
                args.push(parseExpr().value);
                const q = next();
                if (!q) throw new CalcError('syntax');
                if (q.t === ')') break;
                if (q.t !== ',') throw new CalcError('syntax');
              }
            }
            return { value: clean(Engine.functions[name].apply(null, args)), pct: false };
          }
        }
        throw new CalcError('syntax');
      }

      const result = parseExpr();
      if (pos < tokens.length) throw new CalcError('syntax');
      return result.value;
    },

    // يحذف العامل الأخير ويغلق الأقواس المفتوحة
    autoClose(expr) {
      const s = expr.replace(/[+\-×÷^]+$/, '');
      const open = (s.match(/\(/g) || []).length - (s.match(/\)/g) || []).length;
      return s + ')'.repeat(Math.max(0, open));
    },

    // عرض الرقم بدقة مناسبة دون المساس بالدقة الداخلية
    format(n) {
      if (!Number.isFinite(n)) throw new CalcError('overflow');
      if (n === 0) return '0';
      const abs = Math.abs(n);
      if (Number.isInteger(n) && abs < 1e15) return String(n);
      if (abs >= 1e15 || abs < 1e-6) return n.toExponential(11).replace(/\.?0+e/, 'e');
      return String(parseFloat(n.toPrecision(12)));
    }
  };

  /* ========== متحكم لوحة الإدخال ========== */
  const OPS = '+-×÷^';
  const pretty = s => s.replace(/sqrt\(/g, '√(').replace(/-/g, '−');
  const ENDS_VAL = /[\d)πe%!.]$/;

  class ExpressionPad {
    constructor(o) {
      this.exprEl = o.exprEl;
      this.resultEl = o.resultEl;
      this.onResult = o.onResult || function () {};
      this.expr = ''; this.top = ''; this.shown = '0';
      this.done = false; this.error = false;
      this.refresh();
    }

    press(kind, val) {
      AppSettings.click();
      if (this.error) { this.expr = ''; this.top = ''; this.shown = '0'; this.error = false; }
      if (kind === 'a') { if (typeof this[val] === 'function') this[val](); }
      else this.insert(val);
      this.refresh();
    }

    insert(v) {
      const opLike = (v.length === 1 && OPS.includes(v)) || v === '%' || v === '!' || v === '^2';
      let e = this.expr;
      if (this.done && !opLike) e = '';          // رقم جديد بعد "=" يبدأ عملية جديدة
      const r = this.apply(e, v);
      if (r === null) return;
      this.expr = r;
      if (this.done) { this.done = false; this.top = ''; }
    }

    apply(e, v) {
      const last = e.slice(-1);
      const endsVal = ENDS_VAL.test(e);
      if (v.length === 1 && OPS.includes(v)) {
        if (e === '' || last === '(') return v === '-' ? e + v : null;
        if (OPS.includes(last)) {
          if (v === '-' && '×÷^'.includes(last)) return e + v;
          const s = e.replace(/[+\-×÷^]+$/, '');
          if (s === '' || s.slice(-1) === '(') return v === '-' ? s + v : null;
          return s + v;
        }
        return e + v;
      }
      if (v === '%' || v === '!' || v === '^2') return endsVal ? e + v : null;
      if (v === ')') {
        const o = (e.match(/\(/g) || []).length - (e.match(/\)/g) || []).length;
        return o > 0 && endsVal ? e + v : null;
      }
      if (v === '.') {
        const seg = e.match(/[\d.]*$/)[0];
        if (seg.includes('.')) return null;
        if (seg === '') return (/[)πe%!]$/.test(e) ? e + '×' : e) + '0.';
        return e + '.';
      }
      if (/^\d$/.test(v)) {
        if (/(^|[^\d.])0$/.test(e)) return e.slice(0, -1) + v;      // منع 007
        return e + (/[)πe%!]$/.test(e) ? '×' : '') + v;
      }
      // (  أو دالة  أو π أو e
      return e + (endsVal ? '×' : '') + v;
    }

    clear() { this.expr = ''; this.top = ''; this.shown = '0'; this.done = false; this.error = false; }

    back() {
      if (this.done || !this.expr) return this.clear();
      this.expr = this.expr.replace(/(?:[a-z]+\()$|.$/, '');
    }

    negate() {
      if (!this.expr) return;
      let m = this.expr.match(/\(-(\d+\.?\d*)\)$/);
      if (m) { this.expr = this.expr.slice(0, -m[0].length) + m[1]; return; }
      m = this.expr.match(/\d+\.?\d*$/);
      if (m) this.expr = this.expr.slice(0, -m[0].length) + '(-' + m[0] + ')';
    }

    equals() {
      if (!this.expr || this.done) return;
      try {
        const src = Engine.autoClose(this.expr);
        const v = Engine.evaluate(src);
        const shown = Engine.format(v);
        this.onResult(pretty(src), shown);
        this.top = pretty(src) + ' =';
        this.expr = String(v);
        this.shown = shown;
        this.done = true;
      } catch (err) {
        this.error = true;
        this.shown = Engine.messageFor(err && err.code);
      }
    }

    // إدراج نتيجة سابقة من السجل
    useValue(str) {
      if (!this.expr || this.done || this.error || !/[+\-×÷^(]$/.test(this.expr)) this.expr = str;
      else this.expr += str;
      this.done = false; this.error = false; this.top = '';
      this.refresh();
    }

    getShown() { return this.error ? null : this.shown; }

    refresh() {
      if (!this.error && !this.done) {
        const plain = /^-?[\d.]*$/.test(this.expr);
        this.top = plain ? '' : pretty(this.expr);
        if (!this.expr) this.shown = '0';
        else if (plain) this.shown = this.expr;
        else {
          try { this.shown = Engine.format(Engine.evaluate(Engine.autoClose(this.expr))); }
          catch (e) { /* نُبقي آخر نتيجة صحيحة أثناء الكتابة */ }
        }
      }
      this.exprEl.textContent = this.top;
      this.resultEl.textContent = this.shown;
      const len = this.shown.length;
      this.resultEl.classList.toggle('is-error', this.error);
      this.resultEl.classList.toggle('small', !this.error && len > 11 && len <= 16);
      this.resultEl.classList.toggle('xsmall', !this.error && len > 16);
    }
  }

  window.Calc = { Engine, ExpressionPad, CalcError };
})();
