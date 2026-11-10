(function () {
  'use strict';
  var L = [].concat(READING_N4_1, READING_N4_2, READING_N4_3, READING_N4_4, READING_N4_5), KEY = 'dj_rd4', BD = '০১২৩৪৫৬৭৮৯', TY = { short: '短文', mail: 'メール', notice: 'お知らせ' };
  var st = { cur: 0, done: {}, fs: 0 };
  function bn(n) { return String(n).replace(/\d/g, function (d) { return BD[d]; }); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function $(id) { return document.getElementById(id); }
  try { var sv = JSON.parse(localStorage.getItem(KEY) || '{}'); st.done = sv.done || {}; st.fs = sv.fs || 0; } catch (e) {}
  if (!st.fs) st.fs = window.matchMedia('(max-width:560px)').matches ? 22 : 26;
  function save() { try { localStorage.setItem(KEY, JSON.stringify({ done: st.done, fs: st.fs })); } catch (e) {} }
  function doneN() { return L.filter(function (_, i) { return st.done[i]; }).length; }

  function tabs() {
    $('tabs').innerHTML = L.map(function (l, i) {
      return '<button type="button" role="tab" aria-selected="' + (i === st.cur) + '" data-i="' + i + '">Lesson ' + pad(i + 1) + ' · ' + l.subtitle + (st.done[i] ? ' ✓' : '') + '</button>';
    }).join('');
  }
  function prog() {
    var d = doneN();
    $('rdPT').textContent = bn(d) + ' / ' + bn(L.length) + ' সম্পন্ন';
    $('rdPB').style.width = (d / L.length * 100) + '%';
  }
  function render() {
    var l = L[st.cur], h = '';
    h += '<div class="rd-card"><div class="rd-prog-top"><span>তোমার অগ্রগতি</span><b id="rdPT"></b></div><div class="rd-bar"><i id="rdPB"></i></div></div>';
    h += '<div class="rd-chips">' + L.map(function (_, i) {
      return '<button type="button" class="rd-chip' + (i === st.cur ? ' cur' : '') + (st.done[i] ? ' done' : '') + '" data-i="' + i + '">' + bn(i + 1) + '</button>';
    }).join('') + '</div>';
    h += '<div class="rd-card"><div class="rd-head"><div><h2>Lesson ' + pad(st.cur + 1) + ': <span class="jp">' + l.title + '</span></h2><small>' + l.subtitle + '</small></div><span class="rd-tag">' + TY[l.type || 'short'] + '</span></div>';
    h += '<div class="rd-tools"><button type="button" class="rd-pill" data-a="fs" data-d="-2">A−</button><button type="button" class="rd-pill" data-a="fs" data-d="2">A+</button><button type="button" class="rd-pill" data-a="say">🔊 শুনুন</button><button type="button" class="rd-pill" data-a="bnsay">🔊 বাংলা</button><button type="button" class="rd-pill" data-a="ro" aria-pressed="false">রোমাজি</button><button type="button" class="rd-pill" data-a="tr" aria-pressed="false">বাংলা অনুবাদ</button></div>';
    h += '<div class="rd-passage"><div class="rd-jp" id="rdText" style="--fs:' + st.fs + 'px">' + l.text + '</div><div class="rd-ro" id="rdRo" hidden>' + l.romaji + '</div><div class="rd-tr" id="rdTr" hidden>' + l.translation + '</div></div></div>';
    h += '<div class="rd-card"><h3 class="rd-h3">📚 শব্দভান্ডার</h3><div class="rd-vg">' + l.vocab.map(function (v) {
      return '<div class="rd-v"><div class="rd-w">' + v[0] + '</div><small>' + v[1] + ' · ' + v[2] + '</small><b>' + v[3] + '</b>' + (window.DJ_BN ? DJ_BN.html(v[3], 'শুনুন') : '') + '</div>';
    }).join('') + '</div></div>';
    h += '<div class="rd-card"><h3 class="rd-h3">✍️ প্রশ্ন (MCQ)</h3><small style="color:var(--sub)">Passage পড়ে সঠিক উত্তর বেছে নাও।</small>' + l.questions.map(function (q, i) {
      return '<div class="rd-q" id="q' + i + '"><p>' + bn(i + 1) + '. <span class="jp">' + q[0] + '</span></p>' + q.slice(1, 4).map(function (a, j) {
        return '<label class="rd-opt"><input type="radio" name="q' + i + '" value="' + j + '"><span>' + 'ABC'[j] + '. ' + a + '</span></label>';
      }).join('') + '<div class="rd-fb"></div></div>';
    }).join('') + '<div class="rd-act"><button type="button" class="rd-go" data-a="check">উত্তর মেলাও</button><button type="button" class="rd-go sec" data-a="reset">আবার চেষ্টা</button>' + (st.cur < L.length - 1 ? '<button type="button" class="rd-go" data-a="next">পরের Lesson →</button>' : '') + '</div><div class="rd-res" id="rdRes" hidden></div></div>';
    $('view').innerHTML = h;
    prog();
  }
  function open(i) {
    st.cur = i; tabs(); render();
    try { speechSynthesis.cancel(); } catch (e) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function check() {
    var qs = L[st.cur].questions, sc = 0, an = 0;
    qs.forEach(function (x, i) {
      var box = $('q' + i), fb = box.querySelector('.rd-fb'), sel = box.querySelector('input:checked'), o = box.querySelectorAll('.rd-opt');
      o.forEach(function (e) { e.classList.remove('ok', 'bad'); });
      if (!sel) { fb.textContent = 'উত্তর নির্বাচন করা হয়নি'; fb.className = 'rd-fb bad'; return; }
      an++;
      var v = +sel.value;
      if (v === x[4]) { sc++; o[v].classList.add('ok'); fb.textContent = '✓ সঠিক উত্তর'; fb.className = 'rd-fb ok'; }
      else { o[v].classList.add('bad'); o[x[4]].classList.add('ok'); fb.textContent = '✗ ভুল। সঠিক উত্তর: ' + x[x[4] + 1]; fb.className = 'rd-fb bad'; }
    });
    var r = $('rdRes'), n = qs.length;
    r.hidden = false;
    r.innerHTML = '<b>তোমার ফলাফল: ' + bn(sc) + ' / ' + bn(n) + '</b><br>উত্তর দিয়েছ: ' + bn(an) + ' / ' + bn(n) + '<br>' + (sc === n ? 'চমৎকার! সবগুলো সঠিক।' : sc >= n - 1 ? 'খুব ভালো! Passage টা আরেকবার পড়ো।' : 'আবার Passage পড়ে চেষ্টা করো।');
    if (sc === n && !st.done[st.cur]) { st.done[st.cur] = 1; save(); tabs(); prog(); }
  }
  function reset() {
    document.querySelectorAll('#view input[type=radio]').forEach(function (x) { x.checked = false; });
    document.querySelectorAll('.rd-opt').forEach(function (x) { x.classList.remove('ok', 'bad'); });
    document.querySelectorAll('.rd-fb').forEach(function (x) { x.textContent = ''; x.className = 'rd-fb'; });
    $('rdRes').hidden = true;
  }
  function say() {
    try {
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(L[st.cur].text.replace(/\s+/g, ''));
      u.lang = 'ja-JP'; u.rate = 0.8; speechSynthesis.speak(u);
    } catch (e) {}
  }
  $('tabs').addEventListener('click', function (e) { var b = e.target.closest('button[data-i]'); if (b) open(+b.dataset.i); });
  $('view').addEventListener('click', function (e) {
    var c = e.target.closest('.rd-chip'); if (c) return open(+c.dataset.i);
    var b = e.target.closest('[data-a]'); if (!b) return;
    var a = b.dataset.a;
    if (a === 'fs') { st.fs = Math.max(18, Math.min(40, st.fs + +b.dataset.d)); $('rdText').style.setProperty('--fs', st.fs + 'px'); save(); }
    else if (a === 'ro' || a === 'tr') { var t = $(a === 'ro' ? 'rdRo' : 'rdTr'); t.hidden = !t.hidden; b.classList.toggle('on', !t.hidden); b.setAttribute('aria-pressed', String(!t.hidden)); }
    else if (a === 'say') say();
    else if (a === 'bnsay') { if (window.DJ_BN) DJ_BN.say(L[st.cur].translation, b); }
    else if (a === 'check') check();
    else if (a === 'reset') reset();
    else if (a === 'next') open(st.cur + 1);
  });
  tabs(); render();
})();
