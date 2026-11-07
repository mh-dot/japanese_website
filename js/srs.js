/* কাঞ্জি SRS (Anki-ধাঁচের): ডেক তালিকা → Study Now → কার্ড (প্রশ্ন, বিভাজক রেখা, উত্তর) → রেটিং।
   রেটিং: আবার / কঠিন / ভালো / সহজ, প্রতিটি বাটনের নিচে পরের ইন্টারভাল। Z = আনডু। অগ্রগতি localStorage-এ। */
(function () {
  'use strict';

  var KEY = 'dj_srs_kanji_v1', SET_KEY = 'dj_srs_set_v1';
  var MIN = 60 * 1000, DAY = 24 * 60 * 60 * 1000;
  var BD = '০১২৩৪৫৬৭৮৯';
  var bnNum = function (n) { return String(n).replace(/\d/g, function (d) { return BD[+d]; }); };
  var $ = function (s) { return document.querySelector(s); };

  var state = { cards: {}, day: '', newToday: 0, newPerDay: 10, cat: 'all' };
  var Q = [];              // এই সেশনের কিউ, প্রথমটি এখন দেখানো কার্ড
  var UNDO = [];           // আনডু স্ট্যাক
  var showAns = false, studying = false, doneThisRun = 0;

  function load() {
    try { var v = JSON.parse(localStorage.getItem(KEY) || '{}'); state.cards = v.cards || {}; state.day = v.day || ''; state.newToday = v.newToday || 0; } catch (e) {}
    try { var s = JSON.parse(localStorage.getItem(SET_KEY) || '{}'); if (s.newPerDay) state.newPerDay = s.newPerDay; if (s.cat) state.cat = s.cat; } catch (e) {}
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify({ cards: state.cards, day: state.day, newToday: state.newToday })); } catch (e) {} }
  function saveSet() { try { localStorage.setItem(SET_KEY, JSON.stringify({ newPerDay: state.newPerDay, cat: state.cat })); } catch (e) {} }
  function todayStr() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function rollDay() { var t = todayStr(); if (state.day !== t) { state.day = t; state.newToday = 0; save(); } }

  function pool() { return K.filter(function (c) { return state.cat === 'all' || c.c === state.cat; }); }
  function kindOf(c) { var s = state.cards[c.k]; return !s ? 'new' : (s.st === 'learn' ? 'learn' : 'review'); }

  var FRESH = function () { return { ef: 2.5, ivl: 0, reps: 0, lapses: 0, due: 0, st: 'learn' }; };

  /* পরের অবস্থা: শেখার ধাপ (new/learn) আর রিভিউ (review) আলাদা নিয়মে */
  function nextState(s, r, now) {
    var n = { ef: s.ef, ivl: s.ivl, reps: s.reps, lapses: s.lapses, due: s.due, st: s.st };
    if (s.st !== 'review') {
      if (r === 1) { n.st = 'learn'; n.reps = 0; n.due = now + 1 * MIN; }
      else if (r === 2) { n.st = 'learn'; n.reps = 0; n.due = now + 6 * MIN; }
      else { n.st = 'review'; n.ivl = r === 4 ? 4 : 1; n.reps = s.reps + 1; n.due = now + n.ivl * DAY; if (r === 4) n.ef = Math.min(3, s.ef + 0.15); }
    } else {
      if (r === 1) { n.lapses = s.lapses + 1; n.st = 'learn'; n.reps = 0; n.ef = Math.max(1.3, s.ef - 0.2); n.due = now + 10 * MIN; }
      else if (r === 2) { n.ivl = Math.max(1, Math.round(s.ivl * 1.2)); n.ef = Math.max(1.3, s.ef - 0.15); n.reps = s.reps + 1; n.due = now + n.ivl * DAY; }
      else if (r === 3) { n.ivl = Math.max(1, Math.round(s.ivl * s.ef)); n.reps = s.reps + 1; n.due = now + n.ivl * DAY; }
      else { n.ef = s.ef + 0.15; n.ivl = Math.max(2, Math.round(s.ivl * s.ef * 1.3)); n.reps = s.reps + 1; n.due = now + n.ivl * DAY; }
    }
    return n;
  }

  function label(ms) {
    if (ms < 60 * MIN) return bnNum(Math.max(1, Math.round(ms / MIN))) + ' মিনিট';
    if (ms < DAY) return bnNum(Math.round(ms / (60 * MIN))) + ' ঘণ্টা';
    return bnNum(Math.round(ms / DAY)) + ' দিন';
  }
  function preview(c, r) {
    var n = nextState(state.cards[c.k] || FRESH(), r, Date.now());
    return label(n.due - Date.now());
  }

  function buildQueue() {
    var now = Date.now(), fresh = [], learn = [], due = [];
    pool().forEach(function (c) {
      var s = state.cards[c.k];
      if (!s) fresh.push(c);
      else if (s.due <= now) (s.st === 'learn' ? learn : due).push(c);
    });
    var byDue = function (a, b) { return state.cards[a.k].due - state.cards[b.k].due; };
    learn.sort(byDue); due.sort(byDue);
    var room = Math.max(0, state.newPerDay - state.newToday);
    Q = learn.concat(due, fresh.slice(0, room));
    showAns = false; UNDO = [];
  }

  function counts() {
    var now = Date.now(), c = { fresh: 0, learn: 0, review: 0, due: 0, total: 0 };
    pool().forEach(function (k) {
      c.total++;
      var s = state.cards[k.k];
      if (!s) { c.fresh++; return; }
      if (s.st === 'learn') c.learn++; else c.review++;
      if (s.due <= now) c.due++;
    });
    return c;
  }
  function queueCounts() {
    var q = { new: 0, learn: 0, review: 0 };
    Q.forEach(function (c) { q[kindOf(c)]++; });
    return q;
  }
  function nextDueAt() {
    var t = 0;
    pool().forEach(function (c) { var s = state.cards[c.k]; if (s && s.due > Date.now() && (!t || s.due < t)) t = s.due; });
    return t;
  }

  function rate(r) {
    if (!Q.length || !showAns) return;
    var c = Q[0], now = Date.now();
    var prev = state.cards[c.k] ? JSON.parse(JSON.stringify(state.cards[c.k])) : null;
    UNDO.push({ k: c.k, prev: prev, Q: Q.slice(), newToday: state.newToday, doneThisRun: doneThisRun });
    if (UNDO.length > 30) UNDO.shift();
    var s = state.cards[c.k];
    if (!s) { s = FRESH(); state.newToday++; }
    var p = nextState(s, r, now);
    state.cards[c.k] = p;
    Q.shift();
    doneThisRun++;
    // ১ ঘণ্টার মধ্যে আবার আসা শেখার কার্ড এই সেশনেই ফিরে আসবে
    if (p.st !== 'review' && p.due - now < 60 * MIN) Q.splice(Math.min(3, Q.length), 0, c);
    showAns = false;
    save();
    render();
  }

  function undo() {
    var u = UNDO.pop();
    if (!u) return;
    if (u.prev === null) delete state.cards[u.k]; else state.cards[u.k] = u.prev;
    Q = u.Q; state.newToday = u.newToday; doneThisRun = u.doneThisRun;
    showAns = false;
    save();
    render();
  }

  function sayJa(t) {
    if (!('speechSynthesis' in window) || !t) return;
    var s = window.speechSynthesis; s.cancel();
    var u = new SpeechSynthesisUtterance(String(t).replace(/\s/g, ''));
    u.lang = 'ja-JP'; u.rate = 0.85;
    var v = (s.getVoices() || []).filter(function (x) { return /^ja/i.test(x.lang); })[0];
    if (v) u.voice = v;
    s.speak(u);
  }
  function jaVoiceInfo() {
    var s = window.speechSynthesis; if (!s) return 'এই ব্রাউজারে শব্দ নেই';
    var v = (s.getVoices() || []).filter(function (x) { return /^ja/i.test(x.lang); })[0];
    return v ? 'জাপানি ভয়েস: ' + v.name : '⚠️ জাপানি ভয়েস পাওয়া যায়নি';
  }

  function sound(t) { return '<button type="button" class="srs-sp" data-say="' + t + '" aria-label="শুনুন">🔊</button>'; }
  function readingChips(list) {
    return list.length ? list.map(function (r) {
      return '<span class="srs-rd"><b lang="ja">' + kanaOnly(r) + '</b> <i>' + conv(kanaOnly(r))[0] + '</i> ' + sound(kanaOnly(r)) + '</span>';
    }).join('') : '<span class="srs-none">—</span>';
  }
  function answerHTML(c) {
    var words = c.w.map(function (x) {
      return '<li><span class="jp" lang="ja">' + x.w + '</span> <span class="rd">' + x.r + '</span> <i>' + conv(x.r)[0] + '</i> — ' + x.bn + ' ' + sound(x.r) + '</li>';
    }).join('');
    var sents = c.s.slice(0, 4).map(function (s) {
      return '<div class="srs-ex"><div class="jp" lang="ja">' + rubyH(s.j, true) + ' ' + sound(sKana(s.j)) + '</div>' +
        '<div class="ro">' + conv(sKana(s.j))[0] + '</div>' +
        '<div class="bn">' + s.bn + ' ' + (window.DJ_BN ? DJ_BN.html(s.bn, 'শুনুন') : '') + '</div></div>';
    }).join('');
    return '<div class="srs-answer">' +
      '<div class="srs-mean">' + c.bn + ' ' + (window.DJ_BN ? DJ_BN.html(c.bn, 'শুনুন') : '') + '</div>' +
      '<div class="srs-en">' + c.en + '</div>' +
      '<div class="srs-rds"><div><small>音読み (On)</small>' + readingChips(c.on) + '</div><div><small>訓読み (Kun)</small>' + readingChips(c.kun) + '</div></div>' +
      '<div class="srs-mn">💡 ' + c.mn + '</div>' +
      (words ? '<h4 class="srs-h">শব্দ</h4><ul class="srs-words">' + words + '</ul>' : '') +
      (sents ? '<h4 class="srs-h">উদাহরণ</h4>' + sents : '') +
      '</div>';
  }

  function renderDeck() {
    var c = counts(), name = state.cat === 'all' ? 'সব কানজি (N5)' : (CAT[state.cat][1] + ' ' + CAT[state.cat][0]);
    var nxt = nextDueAt();
    $('#srsDeck').innerHTML =
      '<div class="srs-deckcard">' +
        '<div class="srs-deckname">' + name + '</div>' +
        '<div class="srs-deckcounts">' +
          '<span class="cn-new">নতুন <b>' + bnNum(c.fresh) + '</b></span>' +
          '<span class="cn-learn">শেখা <b>' + bnNum(c.learn) + '</b></span>' +
          '<span class="cn-rev">রিভিউ <b>' + bnNum(c.review) + '</b></span>' +
        '</div>' +
        '<div class="srs-deckmeta">আজ বাকি: ' + bnNum(c.due) + (nxt && !c.due ? ' · পরের কার্ড: ' + new Date(nxt).toLocaleString('bn-BD') : '') + '</div>' +
        '<button type="button" class="btn pri srs-study" id="srsStart">এখন পড়ুন</button>' +
      '</div>' +
      '<div class="srs-bar"><i style="width:' + (c.total ? (c.review + c.learn) / c.total * 100 : 0) + '%"></i></div>' +
      '<div class="srs-bartxt">' + bnNum(c.review + c.learn) + ' / ' + bnNum(c.total) + ' কার্ড শুরু হয়েছে</div>';
  }

  function renderStudy() {
    var q = queueCounts();
    $('#srsTop').innerHTML =
      '<span class="cn-new">নতুন <b>' + bnNum(q.new) + '</b></span>' +
      '<span class="cn-learn">শেখা <b>' + bnNum(q.learn) + '</b></span>' +
      '<span class="cn-rev">রিভিউ <b>' + bnNum(q.review) + '</b></span>' +
      '<span class="srs-spacer"></span><span class="srs-count">' + bnNum(doneThisRun) + ' করা</span>';
    var view = $('#srsView');
    if (!Q.length) {
      var nxt = nextDueAt();
      view.innerHTML = '<div class="srs-done">' +
        (doneThisRun ? '<h2>🎉 সেশন শেষ</h2><p>এই সেশনে ' + bnNum(doneThisRun) + 'টি কার্ড রিভিউ হয়েছে।</p>' : '<h2>এখন কিছু বাকি নেই</h2>') +
        (nxt ? '<p>পরের কার্ড: ' + new Date(nxt).toLocaleString('bn-BD') + '</p>' : '<p>নতুন কার্ডের দৈনিক সীমা শেষ হলে কাল আবার আসবে। সীমা বাড়াতে ⚙ অপশন খুলুন।</p>') +
        '<button type="button" class="btn" id="srsBackDeck">ডেকে ফিরুন</button></div>';
      return;
    }
    var c = Q[0];
    var front = '<div class="srs-face"><div class="srs-kanji" lang="ja">' + c.k + '</div></div>';
    var body = showAns
      ? '<hr class="srs-sep">' + answerHTML(c) + ratingBar(c)
      : '<div class="srs-showwrap"><button type="button" class="btn pri srs-show" id="srsShow">উত্তর দেখুন <kbd>Space</kbd></button></div>';
    view.innerHTML = '<article class="srs-card"><div class="srs-cat">' + CAT[c.c][1] + ' ' + CAT[c.c][0] + '</div>' + front + body + '</article>';
  }

  function ratingBar(c) {
    var names = ['', 'আবার', 'কঠিন', 'ভালো', 'সহজ'];
    var cls = ['', 'r1', 'r2', 'r3', 'r4'];
    return '<div class="srs-rate">' + [1, 2, 3, 4].map(function (r) {
      return '<button type="button" class="srs-r ' + cls[r] + '" data-r="' + r + '"><b>' + names[r] + '</b><small>' + preview(c, r) + '</small></button>';
    }).join('') + '</div>';
  }

  function render() {
    $('#srsDeckWrap').hidden = studying;
    $('#srsStudy').hidden = !studying;
    if (studying) renderStudy(); else renderDeck();
    $('#srsUndoBtn').disabled = !UNDO.length;
    $('#srsVoice').textContent = jaVoiceInfo();
  }

  function start() { buildQueue(); doneThisRun = 0; studying = true; render(); window.scrollTo(0, 0); }
  function leave() { studying = false; render(); }

  function bind() {
    $('#srsCat').innerHTML = '<option value="all">সব কানজি</option>' + Object.keys(CAT).map(function (k) {
      return '<option value="' + k + '">' + CAT[k][1] + ' ' + CAT[k][0] + '</option>';
    }).join('');
    $('#srsCat').value = state.cat;
    $('#srsCat').addEventListener('change', function () { state.cat = this.value; saveSet(); studying = false; render(); });
    $('#srsNew').value = state.newPerDay;
    $('#srsNew').addEventListener('change', function () {
      var v = Math.max(1, Math.min(50, parseInt(this.value, 10) || 10));
      this.value = v; state.newPerDay = v; saveSet(); render();
    });
    $('#srsReset').addEventListener('click', function () {
      if (!confirm('সব SRS অগ্রগতি মুছে যাবে। নিশ্চিত?')) return;
      state.cards = {}; state.newToday = 0; save(); studying = false; render();
    });
    $('#srsUndoBtn').addEventListener('click', undo);
    $('#srsBackBtn').addEventListener('click', leave);
    $('#srsDeckWrap').addEventListener('click', function (e) { if (e.target.closest('#srsStart')) start(); });
    $('#srsView').addEventListener('click', function (e) {
      if (e.target.closest('#srsShow')) { showAns = true; render(); return; }
      var r = e.target.closest('.srs-r');
      if (r) { rate(+r.dataset.r); return; }
      if (e.target.closest('#srsBackDeck')) leave();
    });
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-say]');
      if (b) sayJa(b.getAttribute('data-say'));
    });
    document.addEventListener('keydown', function (e) {
      if (e.target.matches && e.target.matches('input,select,textarea')) return;
      if (!studying) return;
      if ((e.key === ' ' || e.key === 'Enter') && !showAns && Q.length) { e.preventDefault(); showAns = true; render(); return; }
      if (e.key === 'z' || e.key === 'Z') { undo(); return; }
      if (showAns && /^[1-4]$/.test(e.key)) rate(+e.key);
    });
    if (window.speechSynthesis) { speechSynthesis.getVoices(); speechSynthesis.onvoiceschanged = function () { $('#srsVoice').textContent = jaVoiceInfo(); }; }
  }

  function init() { load(); rollDay(); bind(); render(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
