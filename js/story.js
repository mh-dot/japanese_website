(function () {
  'use strict';
  var CUR, S = STORY, KEY = 'dj_story', BD = '০১২৩৪৫৬৭৮৯', st = { cur: 0, fs: 0, done: {}, tw: null };
  var spy = null, reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches, Q = [], busy = null, io = null;
  var RB = /([一-龥々]+)\[([^\]]+)\]/g;
  function bn(n) { return String(n).replace(/\d/g, function (d) { return BD[d]; }); }
  function $(id) { return document.getElementById(id); }
  try { var sv = JSON.parse(localStorage.getItem(KEY) || '{}'); st.fs = sv.fs || 0; st.done = sv.done || {}; if (typeof sv.tw === 'boolean') st.tw = sv.tw; } catch (e) {}
  if (st.tw === null) st.tw = !reduce;
  if (!st.fs) st.fs = window.matchMedia('(max-width:560px)').matches ? 21 : 24;
  function save() { try { localStorage.setItem(KEY, JSON.stringify({ fs: st.fs, done: st.done, tw: st.tw })); } catch (e) {} }
  function plain(s) { return s.replace(/«\d+\|/g, '').replace(/»/g, '').replace(/\{\d+\|/g, '').replace(/\}/g, ''); }
  function kana(s) { return plain(s).replace(RB, '$2'); }
  function html(s, G) {
    return s.replace(RB, '<ruby>$1<rt>$2</rt></ruby>')
      .replace(/«(\d+)\|/g, function (m, g) { return '<mark class="g g' + g + '" title="' + G[g - 1][0] + '">'; })
      .replace(/»/g, '</mark>')
      .replace(/\{(\d+)\|/g, '<span class="v" data-v="$1">').replace(/\}/g, '</span>');
  }
  function parse(l) {
    var paras = l.story.trim().split(/\n\s*\n/).map(function (p) {
      return p.split('\n').filter(Boolean).map(function (x) { var i = x.lastIndexOf('|'); return [x.slice(0, i), x.slice(i + 1)]; });
    });
    var gs = {}, vs = {}, all = [].concat.apply([], paras);
    all.forEach(function (s) {
      (s[0].match(/«\d+\|/g) || []).forEach(function (m) { var k = parseInt(m.slice(1)); gs[k] = (gs[k] || 0) + 1; });
      (s[0].match(/\{\d+\|/g) || []).forEach(function (m) { var k = parseInt(m.slice(1)); vs[k] = (vs[k] || 0) + 1; });
    });
    return { paras: paras, gs: gs, vs: vs, all: all, words: l.vocab.trim().split('\n').map(function (x) { return x.split('|'); }) };
  }
  function ro(s) { return window.DJ_CONV ? DJ_CONV(kana(s).replace(/\s+/g, ' ').trim()) : ['', '']; }

  function tabs() {
    $('tabs').innerHTML = S.map(function (l, i) {
      return '<button type="button" role="tab" aria-selected="' + (i === st.cur) + '" data-i="' + i + '">Lesson ' + l.n + ' · ' + l.title + (st.done[l.n] ? ' ✓' : '') + '</button>';
    }).join('');
  }
  function render() {
    var l = S[st.cur], P = parse(l), G = l.grammar, h = ''; CUR = P;
    var gc = Object.keys(P.gs).length, vc = Object.keys(P.vs).length, vt = P.words.length;
    h += '<div class="rd-card"><div class="rd-head"><div><h2>Lesson ' + l.n + ': <span class="jp">' + l.title + '</span></h2><small>' + l.subtitle + '</small></div><span class="rd-tag">গল্প</span></div>';
    h += '<div class="st-cov">✅ এই গল্পে Grammar <b>' + bn(gc) + '/' + bn(G.length) + '</b> · শব্দ <b>' + bn(vc) + '/' + bn(vt) + '</b> কভার হয়েছে</div>';
    h += '<div class="st-legend">' + G.map(function (g, i) {
      return '<div class="st-gl"><mark class="g g' + (i + 1) + '">' + bn(i + 1) + '. ' + g[0] + '</mark><small>' + g[1] + ' · ' + bn(P.gs[i + 1] || 0) + ' বার</small></div>';
    }).join('') + '</div>';
    h += '<div class="rd-tools"><button type="button" class="rd-pill" data-a="fs" data-d="-2">A−</button><button type="button" class="rd-pill" data-a="fs" data-d="2">A+</button><button type="button" class="rd-pill" data-a="say">🔊 পুরো গল্প</button><button type="button" class="rd-pill' + (st.tw ? ' on' : '') + '" data-a="tw" aria-pressed="' + st.tw + '">⌨️ টাইপিং</button><button type="button" class="rd-pill" data-a="replay">↻ আবার</button><button type="button" class="rd-pill on" data-a="furi" aria-pressed="true">ふりがな</button><button type="button" class="rd-pill on" data-a="hl" aria-pressed="true">হাইলাইট</button><button type="button" class="rd-pill" data-a="ro" aria-pressed="false">রোমাজি</button><button type="button" class="rd-pill" data-a="bn" aria-pressed="false">বাংলা অনুবাদ</button></div>';
    h += '<div class="st-bar" id="stBar"><span class="st-bar-l">গ্রামার:</span>' + G.map(function (g, i) { return '<i class="st-ch g' + (i + 1) + '" data-n="' + (i + 1) + '" title="' + g[0] + '">' + bn(i + 1) + '</i>'; }).join('') + '<span class="st-now" id="stNow"></span></div>';
    h += '<div class="rd-passage" id="stBox" style="--fs:' + st.fs + 'px">';
    var k = 0;
    P.paras.forEach(function (p) {
      h += '<div class="st-p">' + p.map(function (s) {
        var r = ro(s[0]);
        var gl = {}; (s[0].match(/«\d+\|/g) || []).forEach(function (m) { gl[parseInt(m.slice(1))] = 1; });
        return '<div class="st-s" data-k="' + (k++) + '" data-gs="' + Object.keys(gl).join(',') + '"><div class="st-jp" data-a="s">' + html(s[0], G) + '</div><div class="st-ro">' + r[0] + '<br>' + r[1] + '</div><div class="st-bn">' + s[1] + '</div></div>';
      }).join('') + '</div>';
    });
    h += '</div></div>';
    h += '<div class="rd-card"><h3 class="rd-h3">📚 শব্দভান্ডার (' + bn(vt) + ' টি)</h3><div class="rd-vg">' + P.words.map(function (w, i) {
      return '<div class="rd-v" data-a="w" data-t="' + w[0].replace(/\[.*\]/, '').replace('を', 'を') + '"><div class="rd-w">' + w[0] + '</div><small>' + w[1] + '</small><b>' + w[2] + (P.vs[i + 1] ? '' : ' ⚠️') + '</b></div>';
    }).join('') + '</div></div>';
    h += '<div class="rd-card"><h3 class="rd-h3">✍️ প্রশ্ন (MCQ)</h3>' + l.questions.map(function (q, i) {
      return '<div class="rd-q" id="q' + i + '"><p>' + bn(i + 1) + '. <span class="jp">' + q[0] + '</span></p>' + q.slice(1, 4).map(function (a, j) {
        return '<label class="rd-opt"><input type="radio" name="q' + i + '" value="' + j + '"><span>' + 'ABC'[j] + '. ' + a + '</span></label>';
      }).join('') + '<div class="rd-fb"></div></div>';
    }).join('') + '<div class="rd-act"><button type="button" class="rd-go" data-a="check">উত্তর মেলাও</button><button type="button" class="rd-go sec" data-a="reset">আবার চেষ্টা</button></div><div class="rd-res" id="rdRes" hidden></div></div>';
    $('view').innerHTML = h;
    startTyping(); startSpy();
  }
  function startSpy() {
    if (spy) spy.disconnect(); spy = null;
    if (!('IntersectionObserver' in window)) return;
    var G = S[st.cur].grammar, chips = [].slice.call(document.querySelectorAll('#stBar .st-ch')), now = $('stNow');
    spy = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var set = (e.target.dataset.gs || '').split(',').filter(Boolean);
        chips.forEach(function (c) { c.classList.toggle('act', set.indexOf(c.dataset.n) > -1); });
        now.textContent = set.length ? set.map(function (n) { return bn(n) + '. ' + G[n - 1][0]; }).join(' · ') : 'এই বাক্যে নতুন গ্রামার হাইলাইট নেই';
      });
    }, { rootMargin: '-38% 0px -52% 0px' });
    [].forEach.call(document.querySelectorAll('#stBox .st-s'), function (el) { spy.observe(el); });
  }
  function stopTyping() { if (io) io.disconnect(); io = null; if (busy) busy.stop(); busy = null; Q = []; }
  function pump() {
    if (busy || !Q.length) return;
    var el = Q.shift();
    busy = el._c = DJ_TW.type(el, el._u, { speed: Q.length > 2 ? 10 : 40, onDone: function () { busy = null; pump(); } });
  }
  function startTyping() {
    stopTyping();
    if (!st.tw || !window.DJ_TW || !('IntersectionObserver' in window)) return;
    var els = [].slice.call(document.querySelectorAll('#stBox .st-jp'));
    els.forEach(function (el) { el._u = DJ_TW.prepare(el); });
    io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); Q.push(e.target); } });
      pump();
    }, { threshold: 0.6 });
    els.forEach(function (el) { io.observe(el); });
  }
  function speak(t) {
    try { speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(t.replace(/\s+/g, '')); u.lang = 'ja-JP'; u.rate = 0.8; speechSynthesis.speak(u); } catch (e) {}
  }
  function check() {
    var qs = S[st.cur].questions, sc = 0;
    qs.forEach(function (x, i) {
      var box = $('q' + i), fb = box.querySelector('.rd-fb'), sel = box.querySelector('input:checked'), o = box.querySelectorAll('.rd-opt');
      o.forEach(function (e) { e.classList.remove('ok', 'bad'); });
      if (!sel) { fb.textContent = 'উত্তর নির্বাচন করা হয়নি'; fb.className = 'rd-fb bad'; return; }
      var v = +sel.value;
      if (v === x[4]) { sc++; o[v].classList.add('ok'); fb.textContent = '✓ সঠিক উত্তর'; fb.className = 'rd-fb ok'; }
      else { o[v].classList.add('bad'); o[x[4]].classList.add('ok'); fb.textContent = '✗ ভুল। সঠিক উত্তর: ' + x[x[4] + 1]; fb.className = 'rd-fb bad'; }
    });
    var r = $('rdRes'); r.hidden = false;
    r.innerHTML = '<b>ফলাফল: ' + bn(sc) + ' / ' + bn(qs.length) + '</b><br>' + (sc === qs.length ? 'চমৎকার! সবগুলো সঠিক।' : 'আবার গল্প পড়ে চেষ্টা করো।');
    if (sc === qs.length && !st.done[S[st.cur].n]) { st.done[S[st.cur].n] = 1; save(); tabs(); }
  }
  $('tabs').addEventListener('click', function (e) { var b = e.target.closest('button[data-i]'); if (b) { st.cur = +b.dataset.i; tabs(); render(); } });
  $('view').addEventListener('click', function (e) {
    var b = e.target.closest('[data-a]'); if (!b) return;
    var a = b.dataset.a, box = $('stBox');
    if (a === 'fs') { st.fs = Math.max(16, Math.min(40, st.fs + +b.dataset.d)); box.style.setProperty('--fs', st.fs + 'px'); save(); }
    else if (a === 'furi' || a === 'hl' || a === 'ro' || a === 'bn') {
      var cls = { furi: 'nofuri', hl: 'hl-off', ro: 'show-ro', bn: 'show-bn' }[a], on = box.classList.toggle(cls);
      var pressed = (a === 'furi' || a === 'hl') ? !on : on;
      b.classList.toggle('on', pressed); b.setAttribute('aria-pressed', String(pressed));
    }
    else if (a === 's') { if (b._c && !b._c.done()) b._c.finish(); speak(kana(CUR.all[+b.closest('.st-s').dataset.k][0])); }
    else if (a === 'say') speak(CUR.all.map(function (x) { return kana(x[0]); }).join(''));
    else if (a === 'w') speak(b.dataset.t.replace(/[～\s]/g, '').replace(/\[.*$/, ''));
    else if (a === 'tw') { st.tw = !st.tw; save(); render(); }
    else if (a === 'replay') render();
    else if (a === 'check') check();
    else if (a === 'reset') { document.querySelectorAll('#view input[type=radio]').forEach(function (x) { x.checked = false; }); document.querySelectorAll('.rd-opt').forEach(function (x) { x.classList.remove('ok', 'bad'); }); document.querySelectorAll('.rd-fb').forEach(function (x) { x.textContent = ''; x.className = 'rd-fb'; }); $('rdRes').hidden = true; }
  });
  tabs(); render();
})();
