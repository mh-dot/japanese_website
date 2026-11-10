/* Flashcard page: move progress stats, mode, search, furigana and sound options into the left sidebar. */
(function () {
  'use strict';
  function move() {
    var side = document.querySelector('.app-shell .side');
    if (!side || side.querySelector('.kf-side')) return !!side;
    var box = document.createElement('div'); box.className = 'kf-side';
    [].forEach.call(document.querySelectorAll('.kf-stats,.kf-tools'), function (el) { box.appendChild(el); });
    side.appendChild(box);
    return true;
  }
  if (!move()) document.addEventListener('DOMContentLoaded', move);
})();
