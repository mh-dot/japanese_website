/* DJ_TW — typewriter for rich text (keeps <ruby>, <mark>, <span class="v"> intact).
   prepare(el) -> units (everything hidden);  type(el, units, {speed,onDone}) -> {finish,stop,done} */
(function () {
  'use strict';
  function prepare(root) {
    var units = [];
    (function walk(node, anc) {
      [].slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          Array.from(n.nodeValue).forEach(function (ch) {
            var s = document.createElement('span'); s.className = 'tw-c tw-h'; s.textContent = ch;
            frag.appendChild(s); units.push({ el: s, anc: anc });
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) {
          if (n.tagName === 'RUBY') { n.classList.add('tw-h'); units.push({ el: n, anc: anc }); }
          else walk(n, (n.tagName === 'MARK' || n.classList.contains('v')) ? anc.concat(n) : anc);
        }
      });
    })(root, []);
    root.classList.add('tw-run');
    return units;
  }
  function type(root, units, o) {
    o = o || {};
    var i = 0, speed = o.speed || 45, t = 0, fin = false, cur = null;
    function reveal(u) { u.el.classList.remove('tw-h'); u.anc.forEach(function (a) { a.classList.add('tw-on'); }); }
    function end() {
      fin = true; if (cur) cur.classList.remove('tw-cur');
      root.classList.remove('tw-run'); if (o.onDone) o.onDone();
    }
    function step() {
      if (i >= units.length) return end();
      var u = units[i++];
      if (cur) cur.classList.remove('tw-cur');
      reveal(u); u.el.classList.add('tw-cur'); cur = u.el;
      var last = u.el.textContent.slice(-1);
      t = setTimeout(step, /[。、！？]/.test(last) ? speed * 4 : speed);
    }
    step();
    return {
      finish: function () { if (fin) return; clearTimeout(t); while (i < units.length) reveal(units[i++]); end(); },
      stop: function () { clearTimeout(t); fin = true; },
      done: function () { return fin; }
    };
  }
  window.DJ_TW = { prepare: prepare, type: type };
})();
