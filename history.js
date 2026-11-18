/* history.js — سجل العمليات (حفظ، إعادة استخدام، حذف عملية، مسح الكل) */
(function () {
  'use strict';
  const KEY = 'history', MAX = 100;
  const h = AppUI.h;
  let list = AppStorage.get(KEY, []);
  if (!Array.isArray(list)) list = [];
  const save = () => AppStorage.set(KEY, list);

  const AppHistory = {
    add(e, r) {
      list.unshift({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), e, r });
      if (list.length > MAX) list.length = MAX;
      save();
    },
    remove(id) { list = list.filter(x => x.id !== id); save(); },
    clear() { list = []; save(); },
    render(box, onUse) {
      box.replaceChildren();
      if (!list.length) { box.append(h('p', { class: 'empty' }, AppSettings.t('empty'))); return; }
      list.forEach(it => box.append(h('div', { class: 'hist-item' },
        h('button', { class: 'hist-use', type: 'button', onclick: () => onUse(it.r) },
          h('span', { class: 'hist-e' }, it.e + ' ='), h('b', { class: 'hist-r' }, it.r)),
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Delete',
          onclick: () => { AppHistory.remove(it.id); AppHistory.render(box, onUse); } }, '🗑'))));
    }
  };
  window.AppHistory = AppHistory;
})();
