/* Dream Japan — স্টাডি টাইমার মোড
   • সাইট খুললে একটা পপআপ: "টাইমার সহ পড়ব" নাকি "র‍্যান্ডম"
   • টাইমার মোডে দুটি ট্র্যাক: রিভিশন ও নতুন লেসন — প্রতিটা ধাপের একটা ন্যূনতম সময় আছে
   • টাইমার শুরু করলে ন্যূনতম সময় শেষ না হওয়া পর্যন্ত অন্য পেজে যাওয়া যায় না
   • ন্যূনতম সময় শেষ হলে পরের ধাপ খুলে যায় (শুরু করা বাধ্যতামূলক নয়)
   • সময় ও অগ্রগতি localStorage-এ থাকে — ব্রাউজার বন্ধ করে আবার এলেও একই জায়গা থেকে চলবে
   ধাপ ও সময় বদলাতে নিচের TRACKS অংশটাই বদলান (m = ন্যূনতম মিনিট, p = ধাপের পেজ). */
(function () {
  'use strict';

  var KEY = 'dj_study_v1', ASK = 'dj_study_asked', LEASE = 'dj_study_lease', MSG = 'dj_study_msg', SPD = 'dj_study_speed';
  var MAX_MIN = 60;                       // একটি ধাপে সর্বোচ্চ গণনার সময় (মিনিট)
  var MAXMS = MAX_MIN * 60000;
  var TAB = Math.random().toString(36).slice(2);
  var AWAY_MIN = 3000;        // এর চেয়ে কম সময়ের "বাইরে যাওয়া" গণনা হয় না (যেমন ঠিকানা-বারে ক্লিক)
  var LEAVE_WARN = 3;         // এক ধাপে এতবার পেজ ছাড়লে কড়া সতর্কতা
  var DAILY_KEEP = 45;        // কত দিনের হিসাব রাখা হবে
  function idleMs() {         // ৭ মিনিট নিষ্ক্রিয় থাকলে সতর্কতা
    try { var v = parseFloat(localStorage.getItem('dj_study_idle_s')); if (v > 0) return v * 1000; } catch (e) {}
    return 7 * 60000;
  }

  var TRACKS = {
    rev: {
      name: 'রিভিশন', icon: '🔁', desc: 'আগে পড়া অংশ ঝালিয়ে নিন — সময় আপনার ইচ্ছামতো',
      steps: [
        { id: 'gr', t: 'গ্রামার রিভিশন',          m: 20, p: ['grammar-revision'] },
        { id: 'vf', t: 'ক্রিয়া ও বিশেষণ',         m: 20, p: ['verb-forms'] },
        { id: 'pt', t: 'পার্টিকল ও ক্রিয়ারূপ',    m: 20, p: ['particles', 'particle-notes'] },
        { id: 'nm', t: 'সংখ্যা, সময় ও তারিখ',     m: 20, p: ['numbers'] },
        { id: 'kt', t: 'কাতাকানা',                m: 20, p: ['katakana', 'katakana-flash', 'katakana-letter-flash'] },
        { id: 'vd', t: 'ক্রিয়ার প্রয়োগ ড্রিল',    m: 20, p: ['verb-context-drill'] },
        { id: 'st', t: 'গল্প',                    m: 20, p: ['story'] },
        { id: 'se', t: 'বাক্য',                   m: 20, p: ['sentence'] },
        // নতুন লেসনের টপিকগুলোও রিভিশনে (আগের ধাপগুলো যেমন ছিল তেমনই আছে)
        { id: 'gc', t: 'গ্রামার',                  m: 20, p: ['grammar'] },
        { id: 'kj', t: 'কানজি কার্ড',              m: 20, p: ['kanji'] },
        { id: 'kf', t: 'জোড়া কানজি ফ্ল্যাশকার্ড',   m: 20, p: ['kanji-flash'] },
        { id: 'vo', t: 'শব্দভান্ডার',               m: 20, p: ['vocab'] },
        { id: 'vr', t: 'শব্দ রিভিশন (কানজিসহ)',     m: 20, p: ['vocab-revision'] }
      ]
    },
    'new': {
      name: 'নতুন লেসন', icon: '🌱', desc: 'নতুন কিছু শিখুন, ধাপে ধাপে',
      steps: [
        { id: 'gr', t: 'গ্রামার',                  m: 30, p: ['grammar'] },
        { id: 'kj', t: 'কানজি কার্ড',              m: 30, p: ['kanji'] },
        { id: 'se', t: 'বাক্য',                    m: 30, p: ['sentence'] },
        { id: 'kf', t: 'জোড়া কানজি ফ্ল্যাশকার্ড',   m: 30, p: ['kanji-flash'] },
        { id: 'vo', t: 'শব্দভান্ডার',               m: 30, p: ['vocab'] },
        { id: 'vr', t: 'শব্দ রিভিশন (কানজিসহ)',     m: 30, p: ['vocab-revision'] }
      ]
    },
    custom: {
      name: 'কাস্টম', icon: '🎯', desc: 'নিজের পছন্দের লেসন বেছে নিয়ে পড়ুন — ক্রম আপনার',
      get steps() { return customSteps(); }
    }
  };
  var TRACK_ORDER = ['rev', 'new', 'custom'];
  var CUSTOM_KEY = 'dj_custom_sel', AUTO_FREE_MS = 30 * 60000;
  function customSel() {
    try { var v = JSON.parse(localStorage.getItem(CUSTOM_KEY) || 'null'); if (v && Array.isArray(v.lessons)) return v; } catch (e) {}
    return { lessons: [], sort: 'pick' };
  }
  /* কাস্টম: প্রতিটি বাছাই করা লেসনের জন্য নতুন লেসনের মতো ৬টি ধাপ, সেই ক্রমে */
  function customSteps() {
    var out = [];
    customSel().lessons.forEach(function (n) {
      TRACKS['new'].steps.forEach(function (x) {
        out.push({ id: 'L' + n + '-' + x.id, t: 'লেসন ' + n + ' · ' + x.t, m: 30, p: x.p });
      });
    });
    return out;
  }
  function autoFree(t, r) { return t === 'custom' && r && r.ms >= AUTO_FREE_MS; }

  /* ---------- helpers ---------- */
  var BN = '০১২৩৪৫৬৭৮৯';
  function bn(s) { return String(s).replace(/\d/g, function (d) { return BN[+d]; }); }
  function p2(n) { return n < 10 ? '0' + n : '' + n; }
  function clock(sec) {
    sec = Math.max(0, sec);
    var h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), x = sec % 60;
    return bn((h ? h + ':' : '') + p2(m) + ':' + p2(x));
  }
  function remain(ms) { return clock(Math.ceil(ms / 1000)); }
  function elapsed(ms) { return clock(Math.floor(ms / 1000)); }
  /* স্টপওয়াচের মতো: মিনিট:সেকেন্ড.শতাংশ সেকেন্ড (এক ঘণ্টার বেশি হলে ঘণ্টাও) */
  function stopFmt(ms) {
    ms = Math.max(0, ms);
    var s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = s % 60;
    return bn((h ? h + ':' : '') + p2(m) + ':' + p2(x));
  }

  function pageName() {
    var p = location.pathname.split('/').pop() || 'index';
    return p.replace(/\.html$/, '');
  }
  function nameOf(href) {
    try {
      var u = new URL(href, location.href);
      if (u.origin !== location.origin) return null;
      var p = u.pathname.split('/').pop() || 'index';
      return p.replace(/\.html$/, '');
    } catch (e) { return null; }
  }
  function speed() {
    try { var v = parseFloat(localStorage.getItem(SPD)); return v > 0 ? v : 1; } catch (e) { return 1; }
  }

  /* ---------- state ---------- */
  function load() {
    var s = null;
    try { s = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
    if (!s || typeof s !== 'object') s = {};
    s.mode = s.mode || null;      // 'timer' | 'free'
    s.track = s.track || null;    // 'rev' | 'new'
    s.steps = s.steps || {};
    s.active = s.active || null;  // "track:id" যেটার টাইমার শুরু হয়েছে
    s.custom = s.custom || {};    // রিভিশনের নিজের সেট করা মিনিট
    s.order = s.order || 'seq';   // 'seq' = নিয়মমতো (ডিফল্ট) · 'free' = যেকোনো ধাপ আগে পড়া যাবে
    s.daily = s.daily || {};      // দিনভিত্তিক মোট পড়ার সময় (ms)
    if (maybeReset(s)) save(s);
    return s;
  }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }

  var DAY_START_H = 4;        // "নতুন দিন" শুরু হয় ভোর ৪টায় (রাত জেগে পড়লে মাঝপথে রিসেট এড়াতে)
  function dayKey(d) { return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); }
  function studyDate() { return new Date(Date.now() - DAY_START_H * 3600000); }
  function todayKey() { return dayKey(studyDate()); }
  function studyDay() { return todayKey(); }
  /* রিভিশন: প্রতিদিন নতুন করে শুরু (চলমান ধাপ থাকলে সেটা বাদ).
     নতুন লেসন: মাঝপথের অগ্রগতি স্থায়ী; শুধু সব ধাপ শেষ হওয়ার পরের দিন আবার লক হয়.
     দৈনিক মোট সময় / চার্ট / মনোযোগ-রিপোর্ট কখনও মোছে না. */
  function maybeReset(s) {
    var d = studyDay(), ch = false, notes = [];
    if (!s.revDay) { s.revDay = d; ch = true; }
    else if (s.revDay !== d) {
      var keep = (s.active && s.active.indexOf('rev:') === 0) ? s.active : null, kr = keep && s.steps[keep];
      if (!(kr && kr.started && !kr.done)) keep = null;
      TRACKS.rev.steps.forEach(function (x) { var k = 'rev:' + x.id; if (k !== keep) delete s.steps[k]; });
      if (!keep && s.active && s.active.indexOf('rev:') === 0) s.active = null;
      s.revDay = d; ch = true; notes.push('rev');
    }
    if (s.newDoneDay && s.newDoneDay !== d) {
      var all = TRACKS['new'].steps.every(function (x) { var r = s.steps['new:' + x.id]; return r && r.done; });
      if (all) {
        TRACKS['new'].steps.forEach(function (x) { delete s.steps['new:' + x.id]; });
        if (s.active && s.active.indexOf('new:') === 0) s.active = null;
        notes.push('new');
      }
      s.newDoneDay = null; ch = true;
    }
    if (notes.length) { try { sessionStorage.setItem('dj_study_note', notes.join(',')); } catch (e) {} }
    return ch;
  }
  function durText(ms) {
    var m = Math.floor(ms / 60000), h = Math.floor(m / 60);
    if (h) return bn(h) + ' ঘণ্টা' + (m % 60 ? ' ' + bn(m % 60) + ' মিনিট' : '');
    if (m) return bn(m) + ' মিনিট';
    return bn(Math.floor(ms / 1000)) + ' সেকেন্ড';
  }
  function addDaily(st, ms) {
    if (!(ms > 0)) return;
    var k = todayKey();
    st.daily[k] = (st.daily[k] || 0) + ms;
    var ks = Object.keys(st.daily);
    if (ks.length > DAILY_KEEP) { ks.sort(); ks.slice(0, ks.length - DAILY_KEEP).forEach(function (x) { delete st.daily[x]; }); }
  }
  function stepsOf(t) { return TRACKS[t].steps; }
  // রিভিশনে সময় ব্যবহারকারী নিজে ঠিক করে (st.custom); নতুন লেসনে নির্দিষ্ট
  function minOf(st, t, s) {
    var v = st.custom && st.custom[t + ':' + s.id];
    if (v >= 1 && v <= MAX_MIN) return v;
    return s.m;
  }
  function skey(t, s) { return t + ':' + s.id; }
  function recOf(st, t, s) { return st.steps[skey(t, s)]; }
  function ensure(st, t, s) {
    var k = skey(t, s);
    return st.steps[k] || (st.steps[k] = { ms: 0, started: false, paused: false, done: false });
  }
  function isDone(st, t, s) { var r = recOf(st, t, s); return !!(r && r.done); }
  function unlockedAt(st, t, i) {
    return st.order === 'free' || i === 0 || isDone(st, t, stepsOf(t)[i - 1]) || autoFree(t, recOf(st, t, stepsOf(t)[i - 1]));
  }
  function firstOpen(st, t) {
    var a = stepsOf(t);
    for (var i = 0; i < a.length; i++) if (!isDone(st, t, a[i])) return i;
    return -1;
  }
  /* পরের ধাপ: নিয়মমতো হলে পরেরটি; যেকোনো ক্রমে হলে প্রথম যেটি এখনো বাকি */
  function nextOf(st, t, i) {
    var a = stepsOf(t);
    if (st.order !== 'free') return a[i + 1] || null;
    for (var j = 0; j < a.length; j++) if (j !== i && !isDone(st, t, a[j])) return a[j];
    return null;
  }
  function doneCount(st, t) {
    var n = 0; stepsOf(t).forEach(function (s) { if (isDone(st, t, s)) n++; });
    return n;
  }
  function curStep(st) {
    if (st.mode !== 'timer' || !st.track) return null;
    var a = stepsOf(st.track), here = pageName();
    for (var i = 0; i < a.length; i++) if (a[i].p.indexOf(here) >= 0) return { t: st.track, i: i, s: a[i] };
    return null;
  }
  function lockInfo(st) {
    if (st.mode !== 'timer' || !st.active) return null;
    var parts = st.active.split(':'), t = parts[0];
    if (!TRACKS[t]) return null;
    var a = stepsOf(t);
    for (var i = 0; i < a.length; i++) {
      if (a[i].id === parts[1]) {
        var r = st.steps[st.active];
        if (r && r.started && !r.done && !autoFree(t, r)) return { t: t, i: i, s: a[i], r: r };
      }
    }
    return null;
  }
  function resetTrack(st, t) {
    stepsOf(t).forEach(function (s) { delete st.steps[skey(t, s)]; });
    if (t === 'new') st.newDoneDay = null;
    if (st.active && st.active.indexOf(t + ':') === 0) st.active = null;
  }

  /* ---------- navigation guard (runs immediately, before the page paints) ---------- */
  function go(name, replace) {
    document.documentElement.style.visibility = 'hidden';
    if (replace) location.replace(name + '.html'); else location.assign(name + '.html');
  }
  function guard() {
    var st = load();
    if (st.mode !== 'timer') return false;
    var here = pageName(), L = lockInfo(st);
    if (L) {
      if (L.s.p.indexOf(here) < 0) {
        try { sessionStorage.setItem(MSG, 'lock'); } catch (e) {}
        go(L.s.p[0], true);
        return true;
      }
      return false;
    }
    var c = curStep(st);
    if (c && !unlockedAt(st, c.t, c.i)) {
      var j = firstOpen(st, c.t);
      if (j >= 0) {
        try { sessionStorage.setItem(MSG, 'serial'); } catch (e) {}
        go(stepsOf(c.t)[j].p[0], true);
        return true;
      }
    }
    return false;
  }
  if (guard()) return;

  /* ---------- timer engine ---------- */
  var run = { last: 0, over: false };
  var ui = {};              // dom refs
  var completedNow = null;  // step completed in this page view

  function holdLease() {
    var now = Date.now(), l = null;
    try { l = JSON.parse(localStorage.getItem(LEASE) || 'null'); } catch (e) {}
    if (l && l.id !== TAB && now - l.t < 2500) return false;
    try { localStorage.setItem(LEASE, JSON.stringify({ id: TAB, t: now })); } catch (e) {}
    return true;
  }

  var away = { since: 0 }, idle = { last: Date.now() }, origTitle = null;
  function isAway() { return document.hidden || !document.hasFocus(); }
  function setTitleAway(on) {
    if (on) { if (origTitle === null) origTitle = document.title; document.title = '⏸\uFE0F টাইমার থেমে আছে — ফিরে আসুন'; }
    else if (origTitle !== null) { document.title = origTitle; origTitle = null; }
  }
  function bump() { idle.last = Date.now(); }
  ['mousemove', 'mousedown', 'keydown', 'wheel', 'scroll', 'touchstart', 'touchmove', 'click', 'pointermove'].forEach(function (ev) {
    document.addEventListener(ev, bump, { passive: true, capture: true });
  });

  function trackAway(st, r) {
    var now = Date.now();
    if (isAway()) { if (!away.since) { away.since = now; setTitleAway(true); } return; }
    if (away.since) {
      var dur = now - away.since;
      away.since = 0; setTitleAway(false); idle.last = now;
      if (dur >= AWAY_MIN) {
        r.lv = (r.lv || 0) + 1; r.aw = (r.aw || 0) + dur;
        save(st);
        if (r.lv >= LEAVE_WARN) toast('⚠️ এই ধাপে আপনি ' + bn(r.lv) + ' বার পেজ ছেড়ে গেছেন (মোট ' + durText(r.aw) + ')। মনোযোগ ধরে রাখুন 🙏', 6500);
        else toast('👀 আপনি ' + durText(dur) + ' অন্য জায়গায় ছিলেন — টাইমার থেমে ছিল। এই ধাপে এটা ' + bn(r.lv) + ' বার হলো।', 5500);
      }
    }
  }

  function tick(force) {
    var st = load(), c = curStep(st);
    if (!c) { run.last = 0; return; }
    var r = recOf(st, c.t, c.s);
    if (!r || !r.started || r.paused) { run.last = 0; render(st); return; }
    if (r.done && !run.over) { run.last = 0; render(st); return; }
    if (!force) trackAway(st, r);
    if ((isAway() && !force) || !holdLease()) { run.last = 0; render(st); return; }
    if (!force && Date.now() - idle.last >= idleMs()) { goIdle(st, r); return; }

    var now = Date.now();
    var d = run.last ? Math.min(now - run.last, 2000) : 0;
    run.last = now;
    var inc = Math.min(d * speed(), MAXMS - r.ms);
    r.ms += inc;
    addDaily(st, inc);

    var justDue = false;
    if (!r.done && !r.due && r.ms >= minOf(st, c.t, c.s) * 60000) { r.due = true; justDue = true; }
    if (r.ms >= MAXMS) run.over = false;
    save(st);
    render(st);
    if (r.due && !r.done && (justDue || !run.dueShown) && !ov) { run.dueShown = true; showTimeUp(st, c); }
  }

  function goIdle(st, r) {
    r.paused = true; r.idle = true; r.iw = (r.iw || 0) + 1;
    save(st); run.last = 0; render(st); idleModal();
  }
  function showModal(html) {
    if (!ov) {
      ov = document.createElement('div');
      ov.className = 'djs-ov';
      ov.setAttribute('role', 'alertdialog');
      ov.setAttribute('aria-modal', 'true');
      ov.addEventListener('click', onModalClick);
      document.body.appendChild(ov);
    }
    ov.innerHTML = '<div class="djs-card">' + html + '</div>';
    var cd = ov.querySelector('.djs-card'); cd.setAttribute('tabindex', '-1'); cd.style.outline = 'none'; cd.focus({ preventScroll: true });
  }
  function idleModal() {
    var mins = Math.max(1, Math.round(idleMs() / 60000));
    showModal('<h2>⚠️ আপনি কি অমনোযোগী?</h2>' +
      '<p class="sub">' + bn(mins) + ' মিনিটের বেশি সময় ধরে মাউস নড়াচড়া, স্ক্রল বা কিবোর্ডের কোনো সাড়া পাওয়া যায়নি। অমনোযোগী অবস্থায় পড়া মনে থাকে না — তাই টাইমার থামিয়ে রাখা হয়েছে।</p>' +
      '<div class="djs-opts"><button class="djs-opt" data-a="idleok"><span class="big">🙋</span><span><b>আমি আছি — চালিয়ে যাই</b><span class="d">টাইমার আবার চালু হবে</span></span></button></div>');
  }

  function startTimer() {
    var st = load(), c = curStep(st);
    if (!c) return;
    var r = ensure(st, c.t, c.s);
    if (r.done) return;
    r.started = true; r.paused = false;
    st.active = skey(c.t, c.s);
    save(st);
    run.last = Date.now();
    render(st);
  }
  function togglePause() {
    var st = load(), c = curStep(st);
    if (!c) return;
    var r = recOf(st, c.t, c.s);
    if (!r || !r.started || r.done) return;
    r.paused = !r.paused;
    if (!r.paused) { r.idle = false; idle.last = Date.now(); }
    save(st);
    run.last = r.paused ? 0 : Date.now();
    render(st);
  }

  function onStepDone(st, c) {
    completedNow = c.s.id;
    if (c.t === 'new' && doneCount(st, 'new') >= stepsOf('new').length) { st.newDoneDay = studyDay(); save(st); }
    var next = nextOf(st, c.t, c.i);
    if (next) toast('✅ “' + c.s.t + '” সম্পন্ন! পরের ধাপ “' + next.t + '” খুলে গেছে।', 5200);
    else { toast('🎉 “' + TRACKS[c.t].name + '” এর সব ধাপ সম্পন্ন!', 5200); setTimeout(function () { chooser('done'); }, 900); }
    dimLinks();
  }

  function finishStep(st, c, r) {
    r.done = true; r.due = false; r.paused = false;
    run.over = false; run.last = 0; run.dueShown = false;
    save(st); render(st); onStepDone(st, c);
  }
  function showTimeUp(st, c) {
    var r = recOf(st, c.t, c.s), over = Math.max(0, Math.round(r.ms / 60000) - minOf(st, c.t, c.s));
    showModal('<h2>⏰ সময় শেষ</h2>' +
      '<p class="sub">“' + c.s.t + '” — নির্ধারিত সময় শেষ, তাই পরের ধাপ এখনো খোলেনি।' + (over ? ' আপনি ' + bn(over) + ' মিনিট বেশি পড়েছেন।' : '') + ' এবার কী করবেন?</p>' +
      '<div class="djs-opts">' +
        '<button class="djs-opt" data-a="extend"><span class="big">⏱️</span><span><b>আরও সময় বাড়াই</b><span class="d">৫ থেকে ৩০ মিনিটের একটি বেছে নিন</span></span></button>' +
        '<button class="djs-opt" data-a="finishnow"><span class="big">✅</span><span><b>লেসন শেষ · পরের ধাপ খুলুন</b><span class="d">এই ধাপ এখানেই সম্পন্ন</span></span></button>' +
        '<button class="djs-opt" data-a="stay"><span class="big">🙋</span><span><b>চালিয়ে যাই</b><span class="d">সময় না বাড়িয়ে বেশি পড়তে থাকব (সর্বোচ্চ ' + bn(MAX_MIN) + ' মিনিট)</span></span></button>' +
      '</div>');
  }

  /* ---------- styles ---------- */
  var CSS =
    '#djs,#djs *,.djs-ov,.djs-ov *{box-sizing:border-box}' +
    '#djs{position:fixed;left:14px;bottom:14px;z-index:400;font-family:"Hind Siliguri",system-ui,sans-serif;color:#111827;line-height:1.3}' +
    '.djs-pill{display:flex;align-items:center;gap:10px;background:#fff;border:1px solid #e6e5ee;border-radius:999px;padding:4px 6px 4px 4px;box-shadow:0 14px 34px -12px rgba(43,35,90,.5);max-width:calc(100vw - 28px)}' +
    '.djs-ring{position:relative;width:36px;height:36px;border:0;background:none;padding:0;flex:none;cursor:pointer;color:inherit}' +
    '.djs-ring svg{width:36px;height:36px;transform:rotate(-90deg)}' +
    '.djs-ring .bg{fill:none;stroke:#e9e8f3;stroke-width:5}' +
    '.djs-ring .fg{fill:none;stroke:#9943ee;stroke-width:5;stroke-linecap:round;transition:stroke-dashoffset .4s linear}' +
    '.djs-ring i{position:absolute;inset:0;display:grid;place-items:center;font-style:normal;font-size:15px}' +
    '.djs-txt{min-width:0;width:128px;flex:none;padding-right:2px}' +
    '.djs-lb{font-size:11.5px;color:#554f7b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:150px}' +
    '.djs-tm{font-size:16px;font-weight:700;font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:clip}' +
    '.djs-act{border:0;border-radius:999px;background:#2b235a;color:#fff;padding:8px 14px;font-weight:600;font-size:13px;white-space:nowrap;cursor:pointer;font-family:inherit;transition:filter .2s}' +
    '.djs-act:hover{filter:brightness(1.15)}' +
    '#djs[data-v=start] .djs-act{background:#9943ee;animation:djsPulse 1.8s ease-in-out infinite}' +
    '#djs[data-v=done] .djs-act,#djs[data-v=max] .djs-act{background:#1f9d62}' +
    '#djs[data-v=done] .djs-ring .fg,#djs[data-v=max] .djs-ring .fg{stroke:#1f9d62}' +
    '#djs[data-v=pause] .djs-ring .fg{stroke:#ffa726}' +
    '@keyframes djsPulse{0%,100%{box-shadow:0 0 0 0 rgba(153,67,238,.55)}50%{box-shadow:0 0 0 9px rgba(153,67,238,0)}}' +
    '@media (prefers-reduced-motion:reduce){#djs[data-v=start] .djs-act{animation:none}}' +
    '#djs[data-v=free] .djs-pill{padding:4px;gap:0}' +
    '#djs[data-v=free] .djs-txt,#djs[data-v=free] .djs-act{display:none}' +
    '#djs[data-v=free] .djs-ring{width:40px;height:40px}#djs[data-v=free] .djs-ring svg{display:none}' +
    '#djs[data-v=idle] .djs-act{display:none}' +
    '.djs-panel{display:none;position:absolute;left:0;bottom:64px;width:min(360px,calc(100vw - 28px));max-height:min(78vh,640px);overflow:auto;background:#fff;border:1px solid #e6e5ee;border-radius:20px;padding:16px;box-shadow:0 24px 50px -16px rgba(21,0,66,.5)}' +
    '#djs.open .djs-panel{display:block}' +
    '.djs-ph{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}' +
    '.djs-ph b{font-size:17px;font-family:"Anek Bangla","Hind Siliguri",sans-serif}' +
    '.djs-ph span{font-size:12.5px;color:#554f7b;background:#f1effa;border-radius:999px;padding:2px 10px;white-space:nowrap}' +
    '.djs-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}' +
    '.djs-row{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:12px;background:#f8f8fb;border:1px solid transparent;color:inherit;text-decoration:none;font-size:14.5px}' +
    'a.djs-row:hover{border-color:#9943ee}' +
    '.djs-row.cur{border-color:#9943ee;background:#f4ecff}' +
    '.djs-row.lock{opacity:.5}' +
    '.djs-row .ic{width:22px;text-align:center;flex:none}' +
    '.djs-row .nm{flex:1;min-width:0}' +
    '.djs-row .nm small{display:block;color:#554f7b;font-size:11.5px}' +
    '.djs-mini{height:4px;border-radius:4px;background:#e4e2f0;margin-top:5px;overflow:hidden}' +
    '.djs-mini i{display:block;height:100%;width:0;background:#9943ee;border-radius:4px}' +
    '.djs-row.ok .djs-mini i{background:#1f9d62}' +
    '.djs-pf{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}' +
    '.djs-btn{flex:1;min-width:120px;border:0;border-radius:999px;padding:10px 14px;font-weight:600;font-size:14px;cursor:pointer;font-family:inherit;background:#2b235a;color:#fff}' +
    '.djs-btn.ghost{background:#efedf8;color:#2b235a}' +
    '.djs-btn:disabled{opacity:.45;cursor:not-allowed}' +
    '.djs-ov{position:fixed;inset:0;z-index:1000;background:rgba(14,11,32,.66);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;padding:16px;font-family:"Hind Siliguri",system-ui,sans-serif;color:#111827}' +
    '.djs-card{background:#fff;border-radius:26px;width:100%;max-width:540px;max-height:92vh;overflow:auto;padding:26px;box-shadow:0 30px 70px -20px rgba(0,0,0,.6)}' +
    '.djs-card h2{font-family:"Anek Bangla","Hind Siliguri",sans-serif;font-size:24px;margin:0 0 4px;line-height:1.25}' +
    '.djs-card .sub{color:#554f7b;font-size:14.5px;margin:0 0 18px}' +
    '.djs-opts{display:flex;flex-direction:column;gap:12px}' +
    '.djs-opt{display:flex;gap:14px;align-items:flex-start;text-align:left;width:100%;border:2px solid #e6e5ee;background:#fff;border-radius:20px;padding:16px;cursor:pointer;font-family:inherit;color:inherit;transition:border-color .15s,transform .15s}' +
    '.djs-opt:hover:not(:disabled){border-color:#9943ee;transform:translateY(-1px)}' +
    '.djs-opt:disabled{opacity:.5;cursor:not-allowed}' +
    '.djs-opt .big{font-size:30px;line-height:1;flex:none}' +
    '.djs-opt b{display:block;font-size:17px;margin-bottom:2px}' +
    '.djs-opt span.d{display:block;font-size:13.5px;color:#554f7b}' +
    '.djs-chips{display:flex;flex-wrap:wrap;gap:5px;margin-top:9px}' +
    '.djs-chips em{font-style:normal;font-size:11.5px;padding:2px 8px;border-radius:999px;background:#f1effa;color:#554f7b}' +
    '.djs-chips em.d{background:#dcf5e8;color:#157a4c}' +
    '.djs-reset{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;justify-content:center}' +
    '.djs-reset .djs-back{margin-top:4px;text-decoration:none;border:1px solid #d6d2ea;border-radius:999px;padding:6px 12px}' +
    '.djs-back:disabled{opacity:.4;cursor:not-allowed}' +
    '.djs-back{margin-top:14px;background:none;border:0;color:#554f7b;font-family:inherit;font-size:14px;cursor:pointer;text-decoration:underline}' +
    '.djs-note{font-size:13px;color:#8a5a00;background:#fff4dc;border-radius:12px;padding:9px 12px;margin-top:12px}' +
    '#djs{left:10px;bottom:10px}' +
    '.djs-pill{padding:3px 5px 3px 3px;gap:7px}' +
    '.djs-ring{width:34px;height:34px}' +
    '.djs-tm{font-size:14px;letter-spacing:.02em;font-family:ui-monospace,"SFMono-Regular",Menlo,Consolas,monospace}' +
    '.djs-lb{font-size:10.5px;max-width:120px}' +
    '.djs-act{padding:6px 11px;font-size:12.5px}' +
    'aside.side{margin-bottom:72px!important;padding-bottom:12px!important}' +
    '#djs-toast{position:fixed;left:50%;bottom:92px;transform:translate(-50%,12px);opacity:0;pointer-events:none;z-index:1100;background:#150042;color:#fff;padding:12px 18px;border-radius:14px;max-width:min(92vw,440px);font-family:"Hind Siliguri",system-ui,sans-serif;font-size:14.5px;line-height:1.45;box-shadow:0 14px 34px -10px rgba(0,0,0,.55);transition:opacity .25s,transform .25s}' +
    '#djs-toast.on{opacity:1;transform:translate(-50%,0);pointer-events:auto;cursor:pointer}' +
    'html.dj-locked a.dj-off{opacity:.38;cursor:not-allowed}' +
    '#djs-steps{max-width:1140px;margin:6px auto 0;padding:0 20px;font-family:"Hind Siliguri",system-ui,sans-serif;color:#111827}' +
    '#djs-steps *{box-sizing:border-box}' +
    'html[data-theme=dark] #djs-steps{color:#f3f2fa}' +
    '@media (max-width:480px){#djs-steps{padding:0 12px}}' +
    '.djs-presets{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}' +
    '.djs-pre{border:2px solid #e6e5ee;background:#fff;border-radius:999px;padding:9px 16px;font-family:inherit;font-size:15px;font-weight:600;color:inherit;cursor:pointer}' +
    '.djs-pre:hover{border-color:#9943ee}.djs-pre.on{background:#9943ee;border-color:#9943ee;color:#fff}' +
    '.djs-cu{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:14.5px;color:#554f7b}' +
    '.djs-cu input{width:84px;border:2px solid #e6e5ee;border-radius:12px;padding:8px 10px;font:inherit;font-size:16px;font-weight:700;color:#111827;background:#fff;text-align:center}' +
    '.djs-cu input:focus{outline:none;border-color:#9943ee}' +
    'html[data-theme=dark] .djs-pre{background:#1f1948;border-color:#2e2850}' +
    'html[data-theme=dark] .djs-pre.on{background:#b98bff;border-color:#b98bff;color:#150042}' +
    'html[data-theme=dark] .djs-cu{color:#b3aed6}' +
    'html[data-theme=dark] .djs-cu input{background:#1f1948;border-color:#2e2850;color:#f3f2fa}' +
    '.djss-day{flex:none;font-size:12px;font-weight:600;color:#6a2fb8;background:#f4ecff;border-radius:999px;padding:2px 11px;white-space:nowrap}' +
    '.djs-day{font-size:13.5px;color:#554f7b;background:#f4ecff;border-radius:12px;padding:8px 12px;margin-bottom:10px}.djs-day b{color:#6a2fb8}' +
    '.djs-rep{margin-top:10px;font-size:13px;background:#fff4dc;color:#7a4e00;border-radius:12px;padding:9px 12px;display:flex;flex-direction:column;gap:2px}' +
    '.djs-rep.ok{background:#dcf5e8;color:#157a4c;display:block}' +
    '.djs-wk{margin-top:12px;padding-top:10px;border-top:1px dashed #e0deef}' +
    '.djs-wt{font-size:12.5px;color:#554f7b;margin-bottom:6px}' +
    '.djs-bars{display:flex;gap:6px;align-items:flex-end;height:84px}' +
    '.djs-bc{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:2px;min-width:0}' +
    '.djs-bc i{display:block;width:100%;max-width:26px;border-radius:6px 6px 3px 3px;background:#cdbdf0}.djs-bc i.t{background:#9943ee}' +
    '.djs-bc em{font-style:normal;font-size:10.5px;color:#554f7b}.djs-bc small{font-size:10.5px;color:#554f7b}' +
    'html[data-theme=dark] .djss-day,html[data-theme=dark] .djs-day{background:#2a2455;color:#d9c8ff}' +
    'html[data-theme=dark] .djs-day b{color:#ccfd56}' +
    'html[data-theme=dark] .djs-rep{background:#3b2f10;color:#ffd98a}' +
    'html[data-theme=dark] .djs-rep.ok{background:#14412c;color:#7ff0b4}' +
    'html[data-theme=dark] .djs-wk{border-color:#2e2850}' +
    'html[data-theme=dark] .djs-wt,html[data-theme=dark] .djs-bc em,html[data-theme=dark] .djs-bc small{color:#b3aed6}' +
    'html[data-theme=dark] .djs-bc i{background:#4a3f8a}html[data-theme=dark] .djs-bc i.t{background:#ccfd56}' +
    '.djss-bar{display:flex;align-items:center;gap:8px;width:100%;border:1px solid #e6e5ee;background:#fff;border-radius:999px;padding:4px 6px 4px 10px;font-family:inherit;font-size:12.5px;color:#554f7b;cursor:pointer;text-align:left;box-shadow:0 6px 16px -12px rgba(43,35,90,.45)}' +
    '.djss-bar:hover{border-color:#9943ee}' +
    '.djss-ic{flex:none;font-size:14px;line-height:1}' +
    '.djss-pg{flex:none;font-weight:700;color:#6a2fb8;font-variant-numeric:tabular-nums}' +
    '.djss-tx{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.djss-tx b{color:#111827;font-weight:700}.djss-tx i.ar{font-style:normal;opacity:.6;padding:0 2px}' +
    'html[data-theme=dark] .djss-bar{background:#1b1640;border-color:#2e2850;color:#b3aed6}' +
    'html[data-theme=dark] .djss-pg{color:#ccfd56}html[data-theme=dark] .djss-tx b{color:#f3f2fa}' +
    /* dark theme */
    'html[data-theme=dark] #djs{color:#f3f2fa}' +
    'html[data-theme=dark] .djs-pill,html[data-theme=dark] .djs-panel{background:#1b1640;border-color:#2e2850}' +
    'html[data-theme=dark] .djs-lb,html[data-theme=dark] .djs-ph span,html[data-theme=dark] .djs-row .nm small{color:#b3aed6}' +
    'html[data-theme=dark] .djs-ring .bg{stroke:#2e2850}' +
    'html[data-theme=dark] .djs-act,html[data-theme=dark] .djs-btn{background:#ccfd56;color:#150042}' +
    'html[data-theme=dark] #djs[data-v=start] .djs-act{background:#b98bff;color:#150042}' +
    'html[data-theme=dark] #djs[data-v=done] .djs-act,html[data-theme=dark] #djs[data-v=max] .djs-act{background:#4ade9c;color:#06281a}' +
    'html[data-theme=dark] .djs-btn.ghost{background:#2a2455;color:#e8e5ff}' +
    'html[data-theme=dark] .djs-ph span{background:#2a2455}' +
    'html[data-theme=dark] .djs-row{background:#231d4b}' +
    'html[data-theme=dark] .djs-row.cur{background:#33236b;border-color:#b98bff}' +
    'html[data-theme=dark] .djs-mini{background:#2e2850}' +
    'html[data-theme=dark] .djs-ov{color:#f3f2fa}' +
    'html[data-theme=dark] .djs-card{background:#17123a;border:1px solid #2e2850}' +
    'html[data-theme=dark] .djs-card .sub,html[data-theme=dark] .djs-opt span.d,html[data-theme=dark] .djs-back{color:#b3aed6}' +
    'html[data-theme=dark] .djs-opt{background:#1f1948;border-color:#2e2850}' +
    'html[data-theme=dark] .djs-opt:hover:not(:disabled){border-color:#b98bff}' +
    'html[data-theme=dark] .djs-chips em{background:#2a2455;color:#b3aed6}' +
    'html[data-theme=dark] .djs-chips em.d{background:#14412c;color:#7ff0b4}' +
    'html[data-theme=dark] .djs-note{background:#3b2f10;color:#ffd98a}' +
    'html[data-theme=dark] #djs-toast{background:#ccfd56;color:#150042}' +
    '@media (max-width:480px){#djs{left:10px;bottom:10px}.djs-lb{max-width:110px}.djs-act{padding:10px 13px}.djs-card{padding:20px}}';

  /* ---------- toast ---------- */
  var toastTimer = 0;
  var toastLeft = 0, toastAt = 0, toastBack = null;
  function toastRun(t, ms) {
    clearTimeout(toastTimer);
    t.classList.add('on');
    toastLeft = ms; toastAt = Date.now();
    toastTimer = setTimeout(function () { t.classList.remove('on'); }, ms);
  }
  function toast(msg, ms) {
    var t = document.getElementById('djs-toast');
    if (!t) {
      t = document.createElement('div'); t.id = 'djs-toast'; t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite');
      /* tap/click: move it away for 2 seconds, then bring it back for the rest of its time */
      t.addEventListener('click', function () {
        if (!t.classList.contains('on') || toastBack) return;
        var left = Math.max(0, toastLeft - (Date.now() - toastAt));
        clearTimeout(toastTimer);
        t.classList.remove('on');
        toastBack = setTimeout(function () {
          toastBack = null;
          if (left > 300) toastRun(t, left);
        }, 2000);
      });
      document.body.appendChild(t);
    }
    if (toastBack) { clearTimeout(toastBack); toastBack = null; }
    t.textContent = msg;
    void t.offsetWidth;
    toastRun(t, ms || 3600);
  }

  /* ---------- modal chooser ---------- */
  var ov = null;
  function closeModal() { if (ov && ov.parentNode) ov.parentNode.removeChild(ov); ov = null; }
  function markAsked() { try { sessionStorage.setItem(ASK, '1'); } catch (e) {} }

  function trackChips(st, t) {
    return '<div class="djs-chips">' + stepsOf(t).map(function (s) {
      return '<em class="' + (isDone(st, t, s) ? 'd' : '') + '">' + (isDone(st, t, s) ? '✓ ' : '') + s.t + '</em>';
    }).join('') + '</div>';
  }

  function chooser(screen) {
    var st = load(), L = lockInfo(st), html = '';
    if (L && screen !== 'done') screen = 'locked';

    if (screen === 'locked') {
      var left = minOf(st, L.t, L.s) * 60000 - L.r.ms;
      html = '<h2>⏱️ আপনি “' + L.s.t + '” ধাপে আছেন</h2>' +
        '<p class="sub">' + TRACKS[L.t].name + ' · ন্যূনতম সময় পূর্ণ হতে আর ' + remain(left) + ' বাকি। চাইলে সেশন বন্ধ করে যেকোনো সময় বেরোতে পারবেন।</p>' +
        '<div class="djs-opts">' +
        '<button class="djs-opt" data-a="continue"><span class="big">▶️</span><span><b>চালিয়ে যান</b><span class="d">যেখানে ছিলেন সেখান থেকে টাইমার চালু রাখুন</span></span></button>' +
        '<button class="djs-opt" data-a="end"><span class="big">⏹</span><span><b>সেশন বন্ধ করুন</b><span class="d">এখনই বন্ধ হবে, সময় জমা থাকবে — তারপর মোড বা অংশ বদলাতে পারবেন</span></span></button>' +
        '</div>';
    } else if (screen === 'track') {
      html = '<h2>কোন অংশ পড়বেন?</h2><p class="sub">একটা বেছে নিন — প্রতিটা ধাপে ন্যূনতম সময় পূর্ণ হলে পরের ধাপ খুলবে।</p><div class="djs-opts">' +
        TRACK_ORDER.map(function (t) {
          var n = stepsOf(t).length, d = doneCount(st, t), tr = TRACKS[t];
          var title = d >= n ? 'নতুন রাউন্ড শুরু করুন' : (d > 0 ? tr.name + ' — চালিয়ে যান' : tr.name);
          return '<button class="djs-opt" data-a="track:' + t + '"><span class="big">' + tr.icon + '</span><span><b>' + title + '</b>' +
            '<span class="d">' + tr.desc + ' · ' + bn(n) + 'টি ধাপ' + (d ? ' · ' + bn(d) + '/' + bn(n) + ' সম্পন্ন' : '') + '</span>' + trackChips(st, t) + '</span></button>';
        }).join('') + '</div>' +
          '<div class="djs-reset">' + TRACK_ORDER.map(function (t) {
            var has = doneCount(st, t) > 0 || (st.track === t && st.mode === 'timer');
            return '<button class="djs-back" data-a="reset:' + t + '"' + (has ? '' : ' disabled') + '>🔄 ' + TRACKS[t].name + ' রিসেট</button>';
          }).join(' ') + '</div>' +
          '<button class="djs-back" data-a="mode">← পেছনে</button>';
    } else if (screen === 'done') {
      var tr0 = TRACKS[st.track] || TRACKS.rev;
      var isRev = st.track === 'rev';
      html = '<h2>🎉 ' + tr0.name + ' সম্পন্ন!</h2><p class="sub">সবগুলো ধাপের ন্যূনতম সময় আপনি পূর্ণ করেছেন। দারুণ কাজ!</p><div class="djs-opts">' +
        (isRev
          ? '<button class="djs-opt" data-a="track:new"><span class="big">🌱</span><span><b>এবার নতুন লেসন শুরু করুন</b><span class="d">নতুন লেসন এখন আনলক</span></span></button>'
          : '<button class="djs-opt" data-a="restart:' + st.track + '"><span class="big">🔄</span><span><b>নতুন রাউন্ড শুরু করুন</b><span class="d">এই অংশের অগ্রগতি রিসেট হবে</span></span></button>') +
        '<button class="djs-opt" data-a="close"><span class="big">📖</span><span><b>এখানেই থাকি</b><span class="d">পরে রোডম্যাপ থেকে ফিরতে পারবেন</span></span></button></div>';
    } else {
      var hasProg = st.mode === 'timer' && st.track;
      html = '<h2>আজ কীভাবে পড়বেন?</h2><p class="sub">নিজের মতো করে বেছে নিন।</p><div class="djs-opts">' +
        '<button class="djs-opt" data-a="timer"><span class="big">⏱️</span><span><b>টাইমার সহ পড়ব</b><span class="d">রিভিশন ও নতুন লেসন — ধাপে ধাপে, নির্দিষ্ট সময় ধরে' + (hasProg ? ' · আগের অগ্রগতি থাকবে' : '') + '</span></span></button>' +
        '<button class="djs-opt" data-a="free"><span class="big">🔀</span><span><b>র‍্যান্ডম</b><span class="d">সাইট যেমন চলে — যেটা ইচ্ছা, যখন ইচ্ছা</span></span></button></div>';
    }

    if (!ov) {
      ov = document.createElement('div');
      ov.className = 'djs-ov';
      ov.setAttribute('role', 'dialog');
      ov.setAttribute('aria-modal', 'true');
      ov.addEventListener('click', onModalClick);
      document.body.appendChild(ov);
    }
    ov.innerHTML = '<div class="djs-card">' + html + '</div>';
    var cd = ov.querySelector('.djs-card'); if (cd) { cd.setAttribute('tabindex', '-1'); cd.style.outline = 'none'; cd.focus({ preventScroll: true }); }
  }


  /* ---------- রিভিশনে নিজের সময় ঠিক করা ---------- */
  var PRESETS = [5, 10, 15, 20, 25, 30];
  function durModal(st, c) {
    var cur = due ? 0 : minOf(st, c.t, c.s);
    var rr = recOf(st, c.t, c.s), running = !!(rr && rr.started && !rr.done), due = !!(rr && rr.due);
    var html = '<h2>⏱\uFE0F ' + (due ? 'আরও কত মিনিট পড়বেন?' : 'কত মিনিট পড়বেন?') + '</h2>' +
      '<p class="sub">“' + c.s.t + '” — ৫ থেকে ' + bn(30) + ' মিনিটের একটি বেছে নিন। টাইমার চলার সময়ও এখানে সময় বদলাতে পারবেন।</p>' +
      '<div class="djs-presets">' + PRESETS.map(function (m) {
        return '<button type="button" class="djs-pre' + (m === cur ? ' on' : '') + '" data-a="pre:' + m + '">' + bn(m) + ' মি.</button>';
      }).join('') + '</div>' +
      '<label class="djs-cu">অথবা নিজে লিখুন <input id="djsDur" type="number" min="1" max="' + MAX_MIN + '" step="1" inputmode="numeric" value="' + (due ? '' : cur) + '"> মিনিট</label>' +
      '<div class="djs-pf" style="margin-top:16px"><button class="djs-btn" data-a="durgo">' + (due ? '⏱ বাড়িয়ে চালু করুন' : (running ? '✔ সময় ঠিক করুন' : '▶ শুরু করুন')) + '</button><button class="djs-btn ghost" data-a="close">বাতিল</button></div>';
    if (!ov) {
      ov = document.createElement('div');
      ov.className = 'djs-ov';
      ov.setAttribute('role', 'dialog');
      ov.setAttribute('aria-modal', 'true');
      ov.addEventListener('click', onModalClick);
      document.body.appendChild(ov);
    }
    ov.innerHTML = '<div class="djs-card">' + html + '</div>';
    var inp = ov.querySelector('#djsDur');
    inp.addEventListener('input', function () { ov.querySelectorAll('.djs-pre').forEach(function (b) { b.classList.remove('on'); }); });
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') applyDur(); });
  }
  function applyDur() {
    var inp = ov && ov.querySelector('#djsDur');
    var v = inp ? Math.round(parseFloat(inp.value)) : NaN;
    if (!(v >= 1 && v <= MAX_MIN)) { toast('১ থেকে ' + bn(MAX_MIN) + ' এর মধ্যে মিনিট লিখুন।', 2800); if (inp) inp.focus(); return; }
    var st = load(), c = curStep(st);
    if (!c) { closeModal(); return; }
    var r = recOf(st, c.t, c.s);
    if (r && r.due) {                       /* সময় শেষ হয়ে গিয়েছিল: যতটা পড়েছেন তার সাথে নতুন সময় যোগ */
      var base = Math.max(minOf(st, c.t, c.s), Math.ceil(r.ms / 60000));
      st.custom[skey(c.t, c.s)] = Math.min(MAX_MIN, base + v);
      r.due = false; r.paused = false; run.over = false; run.dueShown = false; run.last = Date.now();
      save(st); closeModal(); render(load());
      return;
    }
    st.custom[skey(c.t, c.s)] = v;
    if (r && r.started) {
      if (r.done && r.ms < v * 60000) { r.done = false; r.paused = false; run.over = false; }   /* বাড়ালে আবার চলবে */
      else if (!r.done && r.ms >= v * 60000) { r.done = true; run.over = false; }              /* কমালে এখনই শেষ */
      save(st);
      closeModal();
      run.last = r.paused ? 0 : Date.now();
      render(load());
      return;
    }
    save(st);
    closeModal();
    startTimer();
  }

  /* সেশন বন্ধ: চলমান টাইমার থেমে যাবে, সময় ও অগ্রগতি জমা থাকবে, পেজ/মোড যেকোনো সময় বদলানো যাবে */
  function endSession() {
    var st = load(), c = curStep(st);
    if (c) { var r = recOf(st, c.t, c.s); if (r && r.started && !r.done) { r.paused = true; r.idle = false; } }
    st.mode = 'free'; st.active = null;
    save(st); run.last = 0; ui.sig = ''; closeModal();
    toast('⏹ সেশন বন্ধ — সময় ও অগ্রগতি জমা আছে। এখন যেকোনো পেজে যেতে পারবেন।', 4200);
    render(st); dimLinks();
  }

  function onModalClick(e) {
    var b = e.target.closest && e.target.closest('[data-a]');
    if (!b || b.disabled) return;
    var a = b.getAttribute('data-a'), st = load();
    if (a.indexOf('pre:') === 0) {
      var di = ov.querySelector('#djsDur'); if (di) di.value = a.slice(4);
      ov.querySelectorAll('.djs-pre').forEach(function (x) { x.classList.toggle('on', x === b); });
      return;
    }
    if (a === 'durgo') return applyDur();
    if (a === 'idleok') {
      var c9 = curStep(st), r9 = c9 && recOf(st, c9.t, c9.s);
      if (r9) { r9.paused = false; r9.idle = false; save(st); }
      idle.last = Date.now(); run.last = Date.now(); closeModal(); render(load());
      return;
    }
    if (a === 'extend') { var c10 = curStep(st); closeModal(); if (c10) durModal(st, c10); return; }
    if (a === 'finishnow') { var c11 = curStep(st), r11 = c11 && recOf(st, c11.t, c11.s); closeModal(); if (c11 && r11 && !r11.done) finishStep(st, c11, r11); return; }
    if (a === 'stay') { run.dueShown = true; closeModal(); render(load()); return; }
    if (a === 'timer') return chooser('track');
    if (a === 'mode') return chooser('mode');
    if (a === 'close') { markAsked(); closeModal(); return; }
    if (a === 'end') return endSession();
    if (a === 'free') {
      st.mode = 'free'; save(st); markAsked(); closeModal(); render(st); dimLinks();
      return;
    }
    if (a === 'continue') {
      markAsked(); closeModal();
      var L = lockInfo(st);
      if (L && L.s.p.indexOf(pageName()) < 0) go(L.s.p[0]);
      return;
    }
    if (a.indexOf('reset:') === 0) {
      var rt = a.slice(6);
      resetTrack(st, rt); save(st);
      toast(TRACKS[rt].name + ' রিসেট হয়েছে — গ্রামার থেকে আবার শুরু করুন', 3200);
      render(load()); dimLinks();
      return chooser('track');
    }
    if (a.indexOf('restart:') === 0) { resetTrack(st, a.slice(8)); save(st); return pickTrack(a.slice(8)); }
    if (a.indexOf('track:') === 0) return pickTrack(a.slice(6));
  }

  function pickTrack(t) {
    if (t === 'custom' && !stepsOf('custom').length) { closeModal(); go('custom-study'); return; }
    var st = load();
    st.mode = 'timer'; st.track = t;
    var j = firstOpen(st, t);
    if (j < 0) { resetTrack(st, t); j = 0; }
    save(st); markAsked(); closeModal();
    var step = stepsOf(t)[j];
    run.over = false;
    if (step.p.indexOf(pageName()) >= 0) { render(load()); dimLinks(); } else go(step.p[0]);
  }

  /* ---------- widget (pill + panel) ---------- */
  var C = 2 * Math.PI * 19;
  function buildWidget() {
    var root = document.createElement('div');
    root.id = 'djs';
    root.setAttribute('data-v', 'free');
    root.innerHTML =
      '<div class="djs-panel" id="djsPanel" role="region" aria-label="স্টাডি রোডম্যাপ"></div>' +
      '<div class="djs-pill">' +
        '<button class="djs-ring" type="button" aria-label="রোডম্যাপ খুলুন" data-w="panel">' +
          '<svg viewBox="0 0 46 46" aria-hidden="true"><circle class="bg" cx="23" cy="23" r="19"/><circle class="fg" cx="23" cy="23" r="19" stroke-dasharray="' + C.toFixed(2) + '" stroke-dashoffset="' + C.toFixed(2) + '"/></svg>' +
          '<i class="djs-ic">⏱️</i>' +
        '</button>' +
        '<div class="djs-txt"><div class="djs-lb"></div><div class="djs-tm"></div></div>' +
        '<button class="djs-act" type="button" data-w="act"></button>' +
      '</div>';
    document.body.appendChild(root);
    ui.root = root;
    ui.panel = root.querySelector('#djsPanel');
    ui.fg = root.querySelector('.fg');
    ui.icon = root.querySelector('.djs-ic');
    ui.lb = root.querySelector('.djs-lb');
    ui.tm = root.querySelector('.djs-tm');
    ui.act = root.querySelector('[data-w=act]');
    ui.sig = '';

    root.addEventListener('click', function (e) {
      var w = e.target.closest && e.target.closest('[data-w],[data-p]');
      if (!w) return;
      var k = w.getAttribute('data-w');
      if (k === 'panel') {
        var st = load();
        if (st.mode !== 'timer') return chooser('mode');
        root.classList.toggle('open');
        ui.sig = '';
        render(st);
      } else if (k === 'act') {
        var s2 = load(), c = curStep(s2), r = c && recOf(s2, c.t, c.s);
        if (!c) return;
        if (r && r.done) goNext(s2, c);
        else if (!r || !r.started) { durModal(s2, c); }
        else if (r.due) durModal(s2, c);
        else togglePause();
      } else if (w.getAttribute('data-p') === 'change') {
        chooser('mode');
      } else if (w.getAttribute('data-p') === 'end') {
        endSession();
      } else if (w.getAttribute('data-p') === 'restart') {
        var s4 = load();
        if (!s4.track || lockInfo(s4)) return;
        if (!window.confirm('“' + TRACKS[s4.track].name + '” এর সব ধাপ আবার লক হয়ে প্রথম থেকে শুরু হবে।\n(আজকের মোট সময়, চার্ট ও রিপোর্ট মুছবে না।) চালিয়ে যাবেন?')) return;
        resetTrack(s4, s4.track); save(s4);
        go(stepsOf(s4.track)[0].p[0]);
      } else if (w.getAttribute('data-p') === 'finish') {
        var s5 = load(), c5 = curStep(s5), r5 = c5 && recOf(s5, c5.t, c5.s);
        if (!c5 || !r5 || !r5.started || r5.done) return;
        if (!window.confirm('এই ধাপ এখনই শেষ ধরা হবে — সময় তখনই বন্ধ হবে, পরের ধাপ খুলে যাবে। ঠিক আছে?')) return;
        finishStep(s5, c5, r5);
      } else if (w.getAttribute('data-p') === 'order') {
        var s7 = load();
        s7.order = s7.order === 'free' ? 'seq' : 'free';
        save(s7); ui.sig = ''; render(s7);
      } else if (w.getAttribute('data-p') === 'retime') {
        var s6 = load(), c6 = curStep(s6);
        if (c6) durModal(s6, c6);
      } else if (w.getAttribute('data-p') === 'continue') {
        var s3 = load(), j = firstOpen(s3, s3.track);
        if (j >= 0) go(stepsOf(s3.track)[j].p[0]);
      }
    });
    document.addEventListener('click', function (e) {
      if (!e.target.isConnected) return;   /* বাটনটি নিজেই প্যানেল আবার আঁকলে (টার্গেট আর DOM-এ নেই) প্যানেল বন্ধ হবে না */
      if (ui.root.classList.contains('open') && !ui.root.contains(e.target) && !(e.target.closest && e.target.closest('.djss-bar'))) ui.root.classList.remove('open');
    });
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.djss-bar');
    if (!b || !ui.root) return;
    var rg = ui.root.querySelector('.djs-ring'); if (rg) rg.click();
  });

  function goNext(st, c) {
    var next = nextOf(st, c.t, c.i);
    if (next) go(next.p[0]); else chooser('done');
  }


  function attentionHtml(st) {
    var c = curStep(st), r = c && recOf(st, c.t, c.s);
    if (!r || !r.started) return '';
    if (!r.lv && !r.iw) return '<div class="djs-rep ok">✅ এই ধাপে মনোযোগ ঠিক আছে — একবারও পেজ ছাড়েননি।</div>';
    return '<div class="djs-rep">👀 <b>এই ধাপে মনোযোগ</b>' +
      (r.lv ? '<span>পেজ ছেড়েছেন: ' + bn(r.lv) + ' বার (মোট ' + durText(r.aw || 0) + ')</span>' : '') +
      (r.iw ? '<span>নিষ্ক্রিয়তার সতর্কতা: ' + bn(r.iw) + ' বার</span>' : '') + '</div>';
  }
  function weekHtml(st) {
    var names = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি'], days = [], mx = 1, i;
    for (i = 6; i >= 0; i--) {
      var d = studyDate(); d.setDate(d.getDate() - i);
      var v = st.daily[dayKey(d)] || 0; if (v > mx) mx = v;
      days.push({ n: names[d.getDay()], v: v, t: i === 0 });
    }
    return '<div class="djs-wk"><div class="djs-wt">গত ৭ দিন (মিনিটে)</div><div class="djs-bars">' + days.map(function (x) {
      return '<div class="djs-bc" title="' + durText(x.v) + '"><em>' + bn(Math.round(x.v / 60000)) + '</em><i class="' + (x.t ? 't' : '') + '" style="height:' + Math.max(4, Math.round(x.v / mx * 44)) + 'px"></i><small>' + x.n + '</small></div>';
    }).join('') + '</div></div>';
  }

  function panelHtml(st) {
    var t = st.track, tr = TRACKS[t], L = lockInfo(st), here = pageName();
    var a = stepsOf(t), n = a.length, d = doneCount(st, t);
    var h = '<div class="djs-ph"><b>' + tr.icon + ' ' + tr.name + '</b><span>' + bn(d) + '/' + bn(n) + ' সম্পন্ন</span></div>' +
      '<div class="djs-day">📊 আজ মোট পড়েছেন: <b class="djs-dayv">' + durText(st.daily[todayKey()] || 0) + '</b></div><ul class="djs-list">';
    a.forEach(function (s, i) {
      var r = recOf(st, t, s), done = !!(r && r.done), open = unlockedAt(st, t, i), cur = s.p.indexOf(here) >= 0;
      var mm = minOf(st, t, s), ms = r ? r.ms : 0, pct = Math.min(100, Math.round(ms / (mm * 600)));
      var ic = done ? '✅' : (open ? (r && r.started ? '⏳' : '▶️') : '🔒');
      var sub = bn(mm) + ' মিনিট' + (done ? ' · সম্পন্ন' : (r && r.started ? ' · ' + elapsed(ms) + ' হয়েছে' : (open ? '' : ' · আগের ধাপ বাকি')));
      var inner = '<span class="ic">' + ic + '</span><span class="nm">' + s.t + '<small>' + sub + '</small><div class="djs-mini"><i data-k="' + skey(t, s) + '" style="width:' + pct + '%"></i></div></span>';
      var cls = 'djs-row' + (cur ? ' cur' : '') + (done ? ' ok' : '') + (open ? '' : ' lock');
      if (open) h += '<li><a class="' + cls + '" href="' + s.p[0] + '.html">' + inner + '</a></li>';
      else h += '<li><div class="' + cls + '">' + inner + '</div></li>';
    });
    h += '</ul>' + attentionHtml(st) + weekHtml(st) + '<div class="djs-pf">';
    var cs = curStep(st), cr = cs && recOf(st, cs.t, cs.s);
    if (cs && !(cr && cr.done)) {
      if (cr && cr.due) h += '<div class="djs-note">⏰ সময় শেষ — আরও সময় বাড়ান, অথবা লেসন শেষ করুন। পরের ধাপ তখনই খুলবে।</div>';
      h += '<button class="djs-btn" data-p="finish">✓ লেসন শেষ · এই ধাপ এখনই সম্পন্ন</button>';
      h += '<button class="djs-btn ghost" data-p="retime">⏱ সময় বদলান</button>';
    }
    if (!curStep(st) && firstOpen(st, t) >= 0) h += '<button class="djs-btn" data-p="continue">চালিয়ে যান →</button>';
    h += '<button class="djs-btn ghost" data-p="order">' + (st.order === 'free' ? '🔀 ক্রম: যেকোনো (আগে যেটা ইচ্ছা) — নিয়মমতোয় ফিরুন' : '📋 ক্রম: নিয়মমতো — যেকোনো ধাপ আগে পড়তে চাই') + '</button>';
    h += '<button class="djs-btn ghost" data-p="change">মোড / অংশ বদলান</button>';
    if (st.mode === 'timer') h += '<button class="djs-btn ghost" data-p="end">⏹ সেশন বন্ধ করুন</button>';
    if (!L) h += '<button class="djs-btn ghost" data-p="restart">🔄 নতুন রাউন্ড (আবার লক)</button>';
    h += '</div>';
    if (L) h += '<div class="djs-note">টাইমার চলছে — লেসন শেষ করুন অথবা সময় শেষ হলে পরের ধাপ খুলবে। সময় শেষ হওয়ার আগে অন্য পেজে যাওয়া যাবে না — চাইলে “সেশন বন্ধ” করুন।</div>';
    return h;
  }

  function render(st) {
    if (!ui.root) return;
    st = st || load();
    var v, label = '', time = '', act = '', icon = '⏱️', frac = 0;
    if (st.mode !== 'timer') {
      v = 'free'; icon = '⏱️';
      ui.root.classList.remove('open');
    } else {
      var c = curStep(st), r = c && recOf(st, c.t, c.s);
      if (!st.track) { v = 'idle'; label = 'টাইমার মোড'; time = 'অংশ বাছুন'; }
      else if (!c) { v = 'idle'; label = TRACKS[st.track].name; time = bn(doneCount(st, st.track)) + '/' + bn(stepsOf(st.track).length) + ' ধাপ'; icon = TRACKS[st.track].icon; }
      else {
        var mn = minOf(st, c.t, c.s), tot = mn * 60000;
        label = c.s.t;
        if (r && r.done) {
          var isMax = r.ms >= MAXMS;
          v = isMax ? 'max' : 'done'; icon = '✓'; frac = 1;
          time = isMax ? 'সর্বোচ্চ ১ ঘণ্টা' : '✓ সম্পন্ন · ' + elapsed(r.ms);
          var last = c.i >= stepsOf(c.t).length - 1;
          act = last ? 'সমাপ্তি 🎉' : 'পরের ধাপ →';
        } else if (r && r.started) {
          v = r.paused ? 'pause' : 'run'; icon = r.paused ? '⏸️' : (r.due ? '⏰' : '⏱️');
          frac = Math.min(1, r.ms / tot);
          if (r.due) { time = 'সময় শেষ · +' + stopFmt(r.ms - tot); act = 'বাড়ান'; }
          else { time = (r.paused ? 'পজ · ' : 'বাকি ') + stopFmt(tot - r.ms); act = r.paused ? 'চালু' : 'পজ'; }
        } else {
          v = 'start'; icon = '⏱️'; frac = 0;
          time = bn(mn) + ' মিনিট'; act = 'শুরু';
        }
      }
    }
    ui.root.setAttribute('data-v', v);
    ui.lb.textContent = label; ui.tm.textContent = time;
    ui.act.textContent = act;
    ui.icon.textContent = icon;
    ui.fg.setAttribute('stroke-dashoffset', (C * (1 - Math.min(1, Math.max(0, frac)))).toFixed(2));
    var lockedNow = !!lockInfo(st);
    document.documentElement.classList.toggle('dj-locked', lockedNow);
    renderSteps(st);

    if (st.mode === 'timer' && st.track && ui.root.classList.contains('open')) {
      var cr = curStep(st), rr0 = cr && recOf(st, cr.t, cr.s);
      var sig = JSON.stringify([st.track, st.custom, lockedNow, rr0 ? [rr0.lv || 0, rr0.iw || 0, rr0.started ? 1 : 0] : 0, Math.floor((st.daily[todayKey()] || 0) / 60000), stepsOf(st.track).map(function (s) { var r2 = recOf(st, st.track, s); return r2 ? (r2.done ? 2 : (r2.started ? 1 : 0)) : 0; }), pageName()]);
      if (sig !== ui.sig) { ui.sig = sig; ui.panel.innerHTML = panelHtml(st); }
      else {
        var dv = ui.panel.querySelector('.djs-dayv'); if (dv) dv.textContent = durText(st.daily[todayKey()] || 0);
        stepsOf(st.track).forEach(function (s) {
          var k = skey(st.track, s), el = ui.panel.querySelector('[data-k="' + k + '"]'), r3 = recOf(st, st.track, s);
          if (el && r3) {
            el.style.width = Math.min(100, Math.round(r3.ms / (minOf(st, st.track, s) * 600))) + '%';
            var sm = el.closest('.nm').querySelector('small');
            if (sm && r3.started && !r3.done) sm.textContent = bn(minOf(st, st.track, s)) + ' মিনিট · ' + elapsed(r3.ms) + ' হয়েছে';
          }
        });
      }
    }
  }


  /* ---------- ক্রমের স্ট্রিপ: কোনটার পরে কোনটা — সবসময় চোখের সামনে ---------- */
  function buildSteps() {
    var el = document.createElement('div');
    el.id = 'djs-steps';
    el.hidden = true;
    var nw = document.querySelector('.nav-wrap');
    if (nw && nw.parentNode) nw.parentNode.insertBefore(el, nw.nextSibling);
    else document.body.insertBefore(el, document.body.firstChild);
    ui.steps = el; ui.ssig = '';
  }
  function renderSteps(st) {
    var el = ui.steps; if (!el) return;
    if (st.mode !== 'timer' || !st.track) { el.hidden = true; return; }
    el.hidden = false;
    var t = st.track, a = stepsOf(t), here = pageName(), n = a.length, d = doneCount(st, t);
    var c = curStep(st), fo = firstOpen(st, t), curI = c ? c.i : fo;
    var sig = JSON.stringify([t, here, d, curI, c ? isDone(st, t, a[curI]) : 0]);
    if (sig !== ui.ssig) {
      ui.ssig = sig;
      var line;
      if (fo < 0) line = '<b>সব ধাপ সম্পন্ন</b> 🎉';
      else {
        var now = a[curI], nx = a[curI + 1];
        if (c && isDone(st, t, now)) line = '✅ <b>' + now.t + '</b>' + (nx ? ' · এরপর: <b>' + nx.t + '</b>' : '');
        else line = (c ? 'এখন: ' : 'এরপর: ') + '<b>' + now.t + '</b>' + (nx ? ' <i class="ar">→</i> ' + nx.t : '');
      }
      el.innerHTML = '<button type="button" class="djss-bar" aria-label="স্টাডি রোডম্যাপ খুলুন">' +
        '<span class="djss-ic">' + TRACKS[t].icon + '</span><span class="djss-pg">' + bn(d) + '/' + bn(n) + '</span>' +
        '<span class="djss-tx">' + line + '</span><span class="djss-day"></span></button>';
    }
    var dd = el.querySelector('.djss-day'); if (dd) dd.textContent = '📊 ' + durText(st.daily[todayKey()] || 0);
  }

  /* ---------- locked-state link handling ---------- */
  function dimLinks() {
    var st = load(), L = lockInfo(st);
    document.querySelectorAll('.nav-wrap a[href], footer a[href]').forEach(function (a) {
      var off = false;
      if (L) {
        var h = a.getAttribute('href') || '';
        if (h.charAt(0) !== '#') { var n = nameOf(a.href); off = !(n !== null && L.s.p.indexOf(n) >= 0); }
      }
      a.classList.toggle('dj-off', off);
    });
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var st = load(), L = lockInfo(st);
    if (!L) return;
    var h = a.getAttribute('href') || '';
    if (!h || h.charAt(0) === '#' || /^javascript:/i.test(h)) return;
    var n = nameOf(a.href);
    if (n !== null && L.s.p.indexOf(n) >= 0) return;
    e.preventDefault(); e.stopPropagation();
    var left = minOf(st, L.t, L.s) * 60000 - L.r.ms;
    toast('⏳ ন্যূনতম সময় পূর্ণ হতে আর ' + remain(left) + ' বাকি — তার আগে অন্য পেজে যাওয়া যাবে না। সেশন বন্ধ করতে রোডম্যাপ থেকে “⏹ সেশন বন্ধ” চাপুন।' + (L.r.paused ? ' (টাইমার এখন পজ করা আছে)' : ''), 4200);
  }, true);

  /* ---------- boot ---------- */
  function boot() {
    var s = document.createElement('style');
    s.textContent = CSS;
    document.head.appendChild(s);
    buildWidget();
    buildSteps();
    var st = load(), asked = false;
    try { asked = !!sessionStorage.getItem(ASK); } catch (e) {}
    render(st);
    dimLinks();
    var c0 = curStep(st), r0 = c0 && recOf(st, c0.t, c0.s);
    if (r0 && r0.idle && r0.paused) { markAsked(); idleModal(); }
    else if (!asked) chooser('mode');
    else {
      try {
        var m = sessionStorage.getItem(MSG);
        if (m) {
          sessionStorage.removeItem(MSG);
          if (m === 'lock') toast('⏳ আগে এই ধাপের ন্যূনতম সময় শেষ করুন — তারপর অন্য পেজে যেতে পারবেন।', 4200);
          if (m === 'serial') toast('🔒 ধাপগুলো ক্রমানুসারে খোলে — আগের ধাপ শেষ করে আসুন।', 4200);
        }
      } catch (e) {}
    }
    try {
      var note = sessionStorage.getItem('dj_study_note');
      if (note) {
        sessionStorage.removeItem('dj_study_note');
        var parts = [];
        if (note.indexOf('rev') >= 0) parts.push('🌅 নতুন দিন — আজকের রিভিশন নতুন করে সাজানো হয়েছে।');
        if (note.indexOf('new') >= 0) parts.push('🌱 আগের লেসন শেষ — নতুন লেসনের ধাপগুলো আবার নতুন করে লক হয়েছে।');
        setTimeout(function () { toast(parts.join(' '), 6500); }, 400);
      }
    } catch (e) {}
    setInterval(function () { tick(false); }, 1000);
    /* মিলিসেকেন্ড দেখানোর জন্য দ্রুত রিফ্রেশ (শুধু লেখা বদলায়, হিসাব tick-এই হয়) */
    setInterval(function () {
      if (!ui.tm || !ui.root || ui.root.getAttribute('data-v') !== 'run') return;
      var st = load(), c = curStep(st), r = c && recOf(st, c.t, c.s);
      if (!r || !r.started || r.done || r.paused) return;
      var live = r.ms + (run.last ? Math.min(Date.now() - run.last, 2000) : 0);
      var tot = minOf(st, c.t, c.s) * 60000;
      ui.tm.textContent = r.due ? 'সময় শেষ · +' + stopFmt(live - tot) : 'বাকি ' + stopFmt(tot - live);
    }, 50);
    tick(false);
  }

  function onAwayEvent() {
    var st = load(), c = curStep(st), r = c && recOf(st, c.t, c.s);
    if (r && r.started && !r.paused && (!r.done || run.over) && isAway() && run.last) tick(true);
    run.last = 0;
    tick(false);
  }
  document.addEventListener('visibilitychange', onAwayEvent);
  window.addEventListener('blur', onAwayEvent);
  window.addEventListener('focus', onAwayEvent);
  window.addEventListener('pagehide', function () { tick(true); });
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) { run.last = 0; away.since = 0; idle.last = Date.now(); if (!guard()) { render(load()); dimLinks(); } }
  });
  window.addEventListener('storage', function (e) {
    if (e.key === KEY && ui.root) { render(load()); dimLinks(); }
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

/* sidebar উচ্চতা: টাইমার পিলের উপর পর্যন্ত যতটা জায়গা আছে, ততটা দখল করবে (ভেতরে স্ক্রল) */
(function () {
  function fit() {
    var s = document.querySelector('.side'), p = document.querySelector('#djs .djs-pill');
    if (!s) return;
    if (!p || getComputedStyle(s).position !== 'sticky') { s.style.maxHeight = ''; return; }
    var top = s.getBoundingClientRect().top, lim = p.getBoundingClientRect().top - 14;
    s.style.maxHeight = Math.max(220, Math.floor(lim - top)) + 'px';
  }
  var raf = 0;
  function queue() { if (!raf) raf = requestAnimationFrame(function () { raf = 0; fit(); }); }
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fit); else fit();
  setTimeout(fit, 300);
})();
