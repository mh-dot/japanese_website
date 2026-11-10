/* N5 শব্দ রিভিশন: লেসন অনুযায়ী শব্দ + কানজি। ডেটা: VR (vocab-1.js থেকে), কানজির অর্থ: KF.k */
(function () {
  'use strict';
  var BN = '০১২৩৪৫৬৭৮৯', KJ = window.KF.k, KEY = 'dj_vrev', furiKey = 'g5_furi';
  function bn(n) { return String(n).replace(/\d/g, function (d) { return BN[+d]; }); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var isK = function (c) { return c >= '\u4e00' && c <= '\u9fff'; };
  var known = {}; try { known = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) {}
  var st = { l: 'all', s: 'n5', m: '', q: '' };

  /* শব্দ → ruby (শুরু/শেষের কানা বাদ দিয়ে) */
  function ruby(k, r) {
    var m = /^([^\u4e00-\u9fff]*)(.*?)([^\u4e00-\u9fff]*)$/.exec(k), h = m[1], t = m[3], core = m[2];
    if (!/[\u4e00-\u9fff]/.test(core)) return esc(k);
    if (h && r.indexOf(h) !== 0) { h = ''; core = k.slice(0); t = ''; }
    var rr = r; if (h) rr = rr.slice(h.length);
    if (t && rr.slice(-t.length) !== t) { core = core + t; t = ''; } else if (t) rr = rr.slice(0, -t.length);
    if (h && !/^[^\u4e00-\u9fff]*$/.test(h)) h = '';
    return esc(h) + '<ruby>' + esc(core) + '<rt>' + esc(rr) + '</rt></ruby>' + esc(t);
  }
  /* flag: 0 = কানজি নেই, 1 = শুধু N5 কানজি, 2 = N5-এর বাইরের কানজিও আছে */
  function flag(k) {
    var ks = Array.from(k).filter(isK); if (!ks.length) return 0;
    return ks.every(function (c) { return KJ[c]; }) ? 1 : 2;
  }
  var items = [];
  VR.forEach(function (L) {
    L.w.forEach(function (w, i) { items.push({ id: L.n + '-' + i, l: L.n, k: w[0], r: w[1], b: w[2], s: w[3], sb: w[4], f: flag(w[0]) }); });
  });

  function card(it) {
    var ks = Array.from(new Set(Array.from(it.k).filter(isK)));
    var chips = ks.map(function (c) {
      return KJ[c] ? '<span class="vr-c in"><b lang="ja">' + c + '</b><small>' + esc(KJ[c]) + '</small></span>'
                   : '<span class="vr-c out" title="N5 কানজি তালিকার বাইরে"><b lang="ja">' + c + '</b><small>N5-এর বাইরে</small></span>';
    }).join('');
    var word = it.f ? ruby(it.k, it.r) : esc(it.k);
    var showR = it.f && it.r;
    return '<article class="rv-card vr-card' + (known[it.id] ? ' is-known' : '') + '" data-id="' + it.id + '" data-f="' + it.f + '">' +
      '<div class="vr-top"><div class="vw-k" lang="ja"><span class="kt">' + word + '</span></div>' +
      '<button type="button" class="vr-spk" data-say="' + esc(it.r || it.k) + '" aria-label="শুনুন">🔊</button>' +
      '<label class="vr-ok" title="জানি"><input type="checkbox"' + (known[it.id] ? ' checked' : '') + '><span>জানি</span></label></div>' +
      (showR ? '<div class="vw-r" lang="ja"><span class="rt">' + esc(it.r) + '</span></div>' : (it.r && it.r !== it.k ? '<div class="vw-r" lang="ja">' + esc(it.r) + '</div>' : '')) +
      '<div class="vw-b">' + esc(it.b) + '</div>' +
      (chips ? '<div class="vr-kj">' + chips + '</div>' : '') +
      (it.s ? '<div class="vr-ex"><b lang="ja">' + esc(it.s) + '</b><span>' + esc(it.sb || '') + '</span></div>' : '') + '</article>';
  }
  function build() {
    var h = '', bar = '<button class="vf-chip" data-l="all" aria-pressed="true">সব লেসন</button>';
    VR.forEach(function (L) {
      bar += '<button class="vf-chip" data-l="' + L.n + '" aria-pressed="false">' + bn(L.n) + '. ' + esc(L.t) + '</button>';
      h += '<section class="rv-lesson cat" data-l="' + L.n + '" style="--h:' + ((L.n * 47 + 200) % 360) + '"><h2><span class="rv-n">লেসন ' + bn(L.n) + '</span>' + esc(L.t) + '</h2><div class="rv-grid">' +
        items.filter(function (x) { return x.l === L.n; }).map(card).join('') + '</div></section>';
    });
    document.getElementById('vrBar').innerHTML = bar;
    document.getElementById('vrList').innerHTML = h;
  }
  build();
  var list = document.getElementById('vrList'), cnt = document.getElementById('rvc'), hint = document.getElementById('vrHint'), empty = document.getElementById('rve');
  var n5 = items.filter(function (x) { return x.f === 1; }).length, withK = items.filter(function (x) { return x.f; }).length;
  hint.textContent = 'মোট ' + bn(items.length) + 'টি শব্দ · কানজিযুক্ত ' + bn(withK) + 'টি · শুধু N5 কানজিতে লেখা ' + bn(n5) + 'টি। "শুধু N5 কানজির শব্দ" দেখায় সেই শব্দ, যার সব কানজি তোমার ১০২টি N5 কানজির মধ্যে।';

  function render() {
    var v = st.q.trim().toLowerCase(), shown = 0, total = 0, kn = 0;
    [].forEach.call(list.querySelectorAll('.rv-lesson'), function (s) {
      var okL = st.l === 'all' || s.getAttribute('data-l') === st.l, any = 0;
      [].forEach.call(s.querySelectorAll('.vr-card'), function (c) {
        var f = +c.getAttribute('data-f'), okS = st.s === 'all' || f === 1;
        var hit = okL && okS && (!v || c.textContent.toLowerCase().indexOf(v) >= 0);
        c.hidden = !hit; if (hit) { any++; if (c.classList.contains('is-known')) kn++; }
        if (okS) total++;
      });
      s.hidden = !any; shown += any;
    });
    cnt.textContent = bn(shown) + '/' + bn(total) + 'টি শব্দ · জানা ' + bn(kn);
    empty.hidden = shown > 0;
  }
  function seg(sel, attr, cb) {
    var btns = [].slice.call(document.querySelectorAll(sel));
    btns.forEach(function (b) { b.addEventListener('click', function () {
      btns.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); cb(b.getAttribute(attr));
    }); });
  }
  document.getElementById('vrBar').addEventListener('click', function (e) {
    var b = e.target.closest('.vf-chip'); if (!b) return; st.l = b.getAttribute('data-l');
    [].forEach.call(this.querySelectorAll('.vf-chip'), function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
    render(); var top = document.querySelector('.content-top');
    if (window.scrollY > 160 && top && top.scrollIntoView) top.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  document.getElementById('rvq').addEventListener('input', function () { st.q = this.value; render(); });
  seg('[data-s]', 'data-s', function (v) { st.s = v; render(); });
  seg('[data-m]', 'data-m', function (v) { st.m = v; list.classList.remove('m-k', 'm-r'); if (v) list.classList.add(v); [].forEach.call(list.querySelectorAll('.open'), function (c) { c.classList.remove('open'); }); });
  var furiBtns = [].slice.call(document.querySelectorAll('[data-f]'));
  function furi(on, save) {
    document.body.classList.toggle('nofuri', !on);
    furiBtns.forEach(function (b) { b.setAttribute('aria-pressed', (b.getAttribute('data-f') === '1') === on ? 'true' : 'false'); });
    if (save) try { localStorage.setItem(furiKey, JSON.stringify(on)); } catch (e) {}
  }
  furiBtns.forEach(function (b) { b.addEventListener('click', function () { furi(b.getAttribute('data-f') === '1', true); }); });
  var on = true; try { var sv = localStorage.getItem(furiKey); if (sv != null) on = JSON.parse(sv) !== false; } catch (e) {}
  furi(on, false);

  list.addEventListener('change', function (e) {
    var cb = e.target.closest('.vr-ok input'); if (!cb) return;
    var c = cb.closest('.vr-card'), id = c.getAttribute('data-id');
    if (cb.checked) known[id] = 1; else delete known[id];
    c.classList.toggle('is-known', cb.checked);
    try { localStorage.setItem(KEY, JSON.stringify(known)); } catch (err) {}
    render();
  });
  list.addEventListener('click', function (e) {
    var sp = e.target.closest('.vr-spk');
    if (sp) { try { speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(sp.getAttribute('data-say')); u.lang = 'ja-JP'; u.rate = .8; speechSynthesis.speak(u); } catch (err) {} return; }
    if (e.target.closest('.vr-ok')) return;
    var c = e.target.closest('.vr-card'); if (c && st.m) c.classList.toggle('open');
  });
  render();
})();
