/* storage.js — تخزين محلي آمن (لا يتعطل التطبيق إن كان LocalStorage معطّلًا) */
(function () {
  'use strict';
  const PREFIX = 'calc.';
  window.AppStorage = {
    get(key, fallback = null) {
      try {
        const raw = localStorage.getItem(PREFIX + key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; }
      catch (e) { return false; }
    },
    remove(key) {
      try { localStorage.removeItem(PREFIX + key); } catch (e) { /* تجاهل */ }
    }
  };
})();
