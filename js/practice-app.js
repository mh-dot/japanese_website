(function(){
  var P = window.PRACTICE || {};
  function $(s, r){ return (r || document).querySelector(s); }
  function $$(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function getJ(k, d){ try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch(e){ return d; } }
  function setJ(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} }
  function esc(s){ return String(s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function shuffle(a){ a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function norm(s){ return String(s).replace(/[\s、。！？!?「」・]/g, '').toLowerCase(); }

  var LABEL = {kanji:'কানজি উচ্চারণ', split:'বাক্য ভাঙা', form:'রূপ বাছাই', prod:'বাংলা → জাপানি', mis:'ভুলের বাক্স'};
  var MKEY = 'dj_practice_mis';
  var MIS = getJ(MKEY, []);   // list of 'type:index' that were answered wrong and not yet fixed
  var synth = window.speechSynthesis || null;
  var RATE = 0.8;
  var S = {mode: 'kanji', queue: [], pos: 0, ok: 0, n: 0, cur: null, answered: false};

  function say(t){
    if (!synth) return;
    try {
      synth.cancel();
      var u = new SpeechSynthesisUtterance(String(t).replace(/\s/g, ''));
      u.lang = 'ja-JP'; u.rate = RATE;
      var vs = synth.getVoices ? synth.getVoices() : [];
      for (var i = 0; i < vs.length; i++) { if (/^ja/i.test(vs[i].lang)) { u.voice = vs[i]; break; } }
      synth.speak(u);
    } catch(e){}
  }

  /* ---------- question builders ---------- */
  function buildKanji(i){
    var it = P.kanji[i];
    var others = shuffle(P.kanji.filter(function(x){ return x.r !== it.r; })).slice(0, 3).map(function(x){ return x.r; });
    var opts = shuffle([{t: it.r, ok: true}].concat(others.map(function(r){ return {t: r, ok: false}; })));
    return {
      html: '<div class="qstem"><span class="qk">' + esc(it.k) + '</span></div><div class="kq-sub">এই শব্দের উচ্চারণ কী? (' + esc(it.bn) + ')</div>',
      opts: opts,
      feedback: '<b>' + esc(it.k) + '</b> = ' + esc(it.r) + ' (' + esc(it.bn) + ')',
      say: it.k
    };
  }
  function buildSplit(i){
    var it = P.split[i];
    var opts = shuffle([{t: it.ok, ok: true}].concat(it.bad.map(function(b){ return {t: b, ok: false}; })));
    return {
      html: '<div class="qstem"><span class="kq-big2">' + esc(it.s) + '</span></div><div class="kq-sub">শব্দে ভাগ করে সঠিক ভাগটি বেছে নাও (' + esc(it.bn) + ')</div>',
      opts: opts,
      feedback: '<b>সঠিক ভাগ:</b> ' + esc(it.ok) + '<br>' + esc(it.why),
      say: it.s
    };
  }
  function buildForm(i){
    var it = P.form[i];
    var opts = shuffle([{t: it.ok, ok: true}].concat(it.bad.map(function(b){ return {t: b, ok: false}; })));
    return {
      html: '<div class="qtype">' + esc(it.cue) + '</div><div class="qstem"><span class="kq-big2">' + esc(it.stem) + '</span></div>',
      opts: opts,
      feedback: '<b>সঠিক:</b> ' + esc(it.ok) + '<br>' + esc(it.why),
      say: it.stem.replace('＿＿', it.ok)
    };
  }
  function buildProd(i){
    var it = P.prod[i];
    return {
      html: '<div class="qtype">এই বাক্যটি জাপানিতে লেখো</div><div class="qstem"><span class="kq-big2">' + esc(it.bn) + '</span></div>' +
        '<div class="prodrow"><input class="inp" id="pIn" type="text" autocomplete="off" placeholder="জাপানিতে লেখো (হিরাগানা বা কানজি)" aria-label="উত্তর"><button class="btn pri" id="pCheck">যাচাই করো</button></div>',
      prod: true,
      accept: it.ok.map(norm),
      feedback: '<b>সঠিক উত্তর:</b> ' + esc(it.show),
      say: it.show
    };
  }
  var BUILD = {kanji: buildKanji, split: buildSplit, form: buildForm, prod: buildProd};
  var COUNT = {kanji: function(){ return P.kanji.length; }, split: function(){ return P.split.length; }, form: function(){ return P.form.length; }, prod: function(){ return P.prod.length; }};

  /* ---------- session ---------- */
  function queueFor(mode){
    if (mode === 'mis') {
      return shuffle(MIS.filter(function(k){ var t = k.split(':')[0]; return !!BUILD[t]; }).map(function(k){
        var p = k.split(':'); return {type: p[0], i: +p[1]};
      }));
    }
    var n = COUNT[mode](), arr = [];
    for (var i = 0; i < n; i++) arr.push({type: mode, i: i});
    return shuffle(arr);
  }
  function start(mode){
    S = {mode: mode, queue: queueFor(mode), pos: 0, ok: 0, n: 0, cur: null, answered: false};
    $$('nav.tabs button[data-mode]').forEach(function(b){ b.setAttribute('aria-selected', String(b.dataset.mode === mode)); });
    stats();
    show();
  }
  function stats(){
    $('#mCnt').textContent = MIS.length;
    $('#sOk').textContent = S.ok;
    $('#sN').textContent = S.n;
    $('#misTab').textContent = '🔁 ভুলের বাক্স (' + MIS.length + ')';
  }
  function updateMis(t, ok){
    var key = t.type + ':' + t.i, k = MIS.indexOf(key);
    if (!ok && k < 0) MIS.push(key);
    if (ok && k >= 0) MIS.splice(k, 1);
    setJ(MKEY, MIS);
  }

  function show(){
    var root = $('#root');
    if (!S.queue.length) {
      root.innerHTML = S.mode === 'mis'
        ? '<div class="qcard"><div class="qtype">ভুলের বাক্স খালি</div><p class="kq-sub">এখন কোনো ভুল জমা নেই। অন্য অনুশীলনগুলো করো, ভুল হলে এখানে জমবে।</p></div>'
        : '<div class="qcard"><p>কোনো প্রশ্ন নেই।</p></div>';
      return;
    }
    if (S.pos >= S.queue.length) {
      root.innerHTML = '<div class="qcard"><div class="qtype">সেশন শেষ</div>' +
        '<p class="kq-big2" style="font-size:44px">' + S.ok + ' / ' + S.n + '</p><p class="kq-sub">সঠিক উত্তর</p>' +
        '<div class="acts"><button class="btn pri" id="again">আবার শুরু করো</button></div></div>';
      $('#again').addEventListener('click', function(){ start(S.mode); });
      return;
    }
    var t = S.queue[S.pos];
    var q = BUILD[t.type](t.i);
    S.cur = {type: t.type, i: t.i, q: q};
    S.answered = false;
    var optsHtml = '';
    if (q.opts) {
      optsHtml = '<div class="qopts">' + q.opts.map(function(o, j){
        return '<button class="qo' + (t.type === 'kanji' ? ' kj' : (t.type === 'split' || t.type === 'form' ? ' sp' : '')) + '" data-j="' + j + '">' + esc(o.t) + '</button>';
      }).join('') + '</div>';
    }
    root.innerHTML = '<div class="qcard">' +
      '<div class="qhead"><span class="qtype">' + LABEL[t.type] + '</span><span class="kq-count">' + (S.pos + 1) + ' / ' + S.queue.length + ' · সঠিক ' + S.ok + '</span></div>' +
      q.html + optsHtml +
      '<div class="qfb" id="fb" hidden><div class="res" id="res"></div><div class="why" id="why"></div>' +
        '<div class="acts"><button class="btn" id="sayBtn">🔊 শুনুন</button><button class="btn pri" id="nx">পরেরটি →</button></div></div>' +
      '</div>';
    if (q.opts) {
      $$('#root .qo').forEach(function(b){
        b.addEventListener('click', function(){
          if (S.answered) return;
          var o = q.opts[+b.dataset.j];
          answer(o.ok, o.ok ? '✔ সঠিক!' : '✘ ভুল', b);
          $$('#root .qo').forEach(function(x){
            if (q.opts[+x.dataset.j].ok) x.classList.add('right');
            else if (x === b) x.classList.add('wrong');
          });
        });
      });
    } else {
      var go = function(){
        if (S.answered) return;
        var v = norm($('#pIn').value);
        if (!v) return;
        var ok = q.accept.indexOf(v) >= 0;
        answer(ok, ok ? '✔ সঠিক!' : '✘ ভুল', null);
        $('#pIn').disabled = true;
        $('#pCheck').disabled = true;
      };
      $('#pCheck').addEventListener('click', go);
      $('#pIn').addEventListener('keydown', function(e){ if (e.key === 'Enter') go(); });
      setTimeout(function(){ var el = $('#pIn'); if (el) el.focus(); }, 0);
    }
    $('#nx').addEventListener('click', function(){ S.pos++; show(); });
    $('#sayBtn').addEventListener('click', function(){ say(q.say); });
  }

  function answer(ok, text, btn){
    S.answered = true;
    S.n++;
    if (ok) S.ok++;
    var cur = S.cur;
    updateMis(cur, ok);
    var fb = $('#fb');
    fb.hidden = false;
    $('#res').textContent = text;
    $('#res').className = 'res ' + (ok ? 'ok' : 'bad');
    $('#why').innerHTML = cur.q.feedback;
    $('.kq-count', $('#root')).textContent = (S.pos + 1) + ' / ' + S.queue.length + ' · সঠিক ' + S.ok;
    if (cur.q.prod) {
      var inp = $('#pIn');
      if (!ok) inp.value = inp.value;
    }
    stats();
    say(cur.q.say);
  }

  /* ---------- nav, theme, init ---------- */
  var tabBtns = $$('nav.tabs button[data-mode]');
  tabBtns.forEach(function(b){ b.addEventListener('click', function(){ start(b.dataset.mode); }); });
  function setTheme(t){
    if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
    $$('[data-t]').forEach(function(b){ b.setAttribute('aria-pressed', String(b.dataset.t === t)); });
    try { localStorage.setItem('dj_theme', t); } catch(e){}
  }
  $$('[data-t]').forEach(function(b){ b.addEventListener('click', function(){ setTheme(b.dataset.t); }); });
  var tb = $('#themeBtn');
  if (tb) tb.addEventListener('click', function(){ setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'); });
  var burger = $('#burger'), menu = $('#menu');
  if (burger && menu) burger.addEventListener('click', function(){ burger.classList.toggle('open'); menu.classList.toggle('open'); });
  setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');

  start('kanji');
})();
