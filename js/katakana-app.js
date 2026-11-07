(function(){
  var K = window.KATA || [];
  function $(s, r){ return (r || document).querySelector(s); }
  function $$(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function getJ(k, d){ try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch(e){ return d; } }
  function setJ(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} }
  function esc(s){ return String(s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function shuffle(a){ a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  var HUE = {seion: 200, daku: 30, yoon: 300};
  var CAT = {seion: 'মূল (清音)', daku: 'ডাকুটেন (濁音)', yoon: 'যুক্ত (拗音)'};
  var DONE = getJ('kata_done', []);   // glyphs marked as learned
  var MIS = getJ('kata_mis', {});     // glyph -> wrong count ('w:'+word for drill)
  var RATE = +getJ('kata_rate', 0.8) || 0.8;
  var catF = 'all', flt = 'all', vis = [], cur = -1;
  var synth = window.speechSynthesis || null;
  var POOL = K.filter(function(c){ return c.r !== 'wo'; });
  var WORDS = POOL.filter(function(c){ return c.ex && c.ex.charAt(0) !== '（'; });

  function jaVoice(){
    if (!synth) return null;
    var vs = synth.getVoices ? synth.getVoices() : [];
    for (var i = 0; i < vs.length; i++) { if (/^ja/i.test(vs[i].lang)) return vs[i]; }
    return null;
  }
  function vinfo(){
    var v = jaVoice();
    $('#vinfo').textContent = synth ? (v ? 'ভয়েস: ' + v.name : '⚠️ জাপানি ভয়েস পাওয়া যায়নি') : '';
  }
  function say(t, btn){
    if (!synth) return;
    try {
      synth.cancel();
      var u = new SpeechSynthesisUtterance(String(t).replace(/\s/g, ''));
      u.lang = 'ja-JP'; u.rate = RATE;
      var v = jaVoice(); if (v) u.voice = v;
      if (btn) { btn.classList.add('on'); u.onend = u.onerror = function(){ btn.classList.remove('on'); }; }
      synth.speak(u);
    } catch(e){}
  }
  if (synth) { synth.onvoiceschanged = vinfo; }

  /* ---------- theme / burger (this page does not load app.js) ---------- */
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

  /* ---------- tabs ---------- */
  var tabBtns = $$('nav.tabs button[data-tab]');
  var started = {};
  function goTab(t){
    tabBtns.forEach(function(b){ b.setAttribute('aria-selected', String(b.dataset.tab === t)); });
    $$('main > section.panel').forEach(function(p){ p.hidden = p.id !== 'tab-' + t; });
    if (!started[t]) { started[t] = true; if (t === 'drill') drillNext(); if (t === 'quiz') quizNext(); }
  }
  tabBtns.forEach(function(b){ b.addEventListener('click', function(){ goTab(b.dataset.tab); }); });

  /* ---------- cards grid ---------- */
  function buildChips(){
    var html = '<button class="chipc" data-c="all" aria-pressed="true">সব (' + K.length + ')</button>';
    ['seion', 'daku', 'yoon'].forEach(function(k){
      var n = K.filter(function(c){ return c.t === k; }).length;
      html += '<button class="chipc cat" style="--h:' + HUE[k] + '" data-c="' + k + '" aria-pressed="false">' + CAT[k] + ' (' + n + ')</button>';
    });
    $('#catf').innerHTML = html;
    $$('#catf button').forEach(function(b){
      b.addEventListener('click', function(){
        catF = b.dataset.c;
        $$('#catf button').forEach(function(x){ x.setAttribute('aria-pressed', String(x === b)); });
        applyFilter();
      });
    });
  }
  function buildTiles(){
    $('#grid').innerHTML = K.map(function(c, i){
      return '<button class="tile cat" style="--h:' + HUE[c.t] + '" data-i="' + i + '" aria-label="' + esc(c.g + ' ' + c.bn) + '">' +
        '<span class="mk"></span><span class="bk">' + c.g + '</span><span class="tm">' + esc(c.bn) + '</span><span class="tr">' + esc(c.r) + '</span></button>';
    }).join('');
    $$('#grid .tile').forEach(function(t){ t.addEventListener('click', function(){ openDetail(+t.dataset.i); }); });
  }
  function paintTiles(){
    $$('#grid .tile').forEach(function(t){
      var c = K[+t.dataset.i];
      var done = DONE.indexOf(c.g) >= 0, mis = (MIS[c.g] || 0) > 0;
      t.classList.toggle('fin', done);
      $('.mk', t).innerHTML = (done ? '<span class="d">✓</span>' : '') + (mis ? '<span class="mis">⚠</span>' : '');
    });
  }
  function applyFilter(){
    var q = ($('#q').value || '').trim().toLowerCase();
    vis = [];
    $$('#grid .tile').forEach(function(t){
      var i = +t.dataset.i, c = K[i];
      var done = DONE.indexOf(c.g) >= 0, mis = (MIS[c.g] || 0) > 0;
      var ok = (catF === 'all' || c.t === catF) &&
        (!q || (c.g + ' ' + c.r + ' ' + c.bn + ' ' + c.ex + ' ' + c.exbn).toLowerCase().indexOf(q) >= 0) &&
        (flt === 'all' || (flt === 'todo' && !done) || (flt === 'done' && done) || (flt === 'mis' && mis));
      t.hidden = !ok;
      if (ok) vis.push(i);
    });
    $('#cnt').textContent = vis.length + 'টি অক্ষর';
  }
  function stats(){
    var glyphMis = Object.keys(MIS).filter(function(k){ return k.indexOf('w:') !== 0 && MIS[k] > 0; }).length;
    $('#sDone').textContent = DONE.length;
    $('#sTot').textContent = K.length;
    $('#sMis').textContent = glyphMis;
    $('#pfill').style.width = Math.round(DONE.length / K.length * 100) + '%';
  }

  /* ---------- detail sheet ---------- */
  function openDetail(i){
    cur = i;
    var c = K[i];
    var idx = vis.indexOf(i);
    $('#mpos').textContent = idx >= 0 ? (idx + 1) + ' / ' + vis.length : '';
    var done = DONE.indexOf(c.g) >= 0, m = MIS[c.g] || 0;
    var sh = $('#sheet');
    sh.className = 'sheet cat';
    sh.style.setProperty('--h', HUE[c.t]);
    sh.innerHTML =
      '<div class="hero">' +
        '<div><div class="kstage" id="kstage"><div class="kbig">' + c.g + '</div><canvas class="kpad" id="kpad"></canvas></div>' +
        '<div class="acts"><button class="btn" id="kTrace" aria-pressed="false">✏️ ছায়া দেখুন</button><button class="btn" id="kClear">মুছুন</button></div></div>' +
        '<div class="heroR"><h2>' + c.g + ' · ' + esc(c.r) + '</h2>' +
          '<div class="en">বাংলা উচ্চারণ: <b>' + esc(c.bn) + '</b><br>ধরন: ' + CAT[c.t] + (m ? ' · ভুল হয়েছে ' + m + ' বার' : '') + '</div>' +
          '<div class="acts"><button class="btn pri" id="kSay">🔊 অক্ষর শুনুন</button><button class="btn" id="kDone" aria-pressed="' + done + '">' + (done ? '✓ দেখা হয়েছে' : '✓ দেখা হয়েছে বলে চিহ্ন দিন') + '</button></div>' +
          '<div class="exbox"><div><span class="exj">' + esc(c.ex) + '</span></div><div class="exb">' + esc(c.exbn) + ' ' + (window.DJ_BN ? DJ_BN.html(c.exbn, 'শুনুন') : '') + '</div>' +
          '<div class="acts"><button class="btn" id="kSayEx">🔊 শব্দটি শুনুন</button></div></div>' +
        '</div>' +
      '</div>';
    $('#modal').hidden = false;
    document.body.classList.add('in-detail');
    window.scrollTo(0, 0);
    $('#kSay').addEventListener('click', function(){ say(c.g, this); });
    $('#kSayEx').addEventListener('click', function(){ say(c.ex, this); });
    $('#kDone').addEventListener('click', function(){ toggleDone(c.g, this); });
    $('#kTrace').addEventListener('click', function(){
      var s = $('#kstage'); s.classList.toggle('trace');
      this.setAttribute('aria-pressed', String(s.classList.contains('trace')));
    });
    $('#kClear').addEventListener('click', clearPad);
    setupPad();
  }
  function toggleDone(g, btn){
    var k = DONE.indexOf(g);
    if (k >= 0) DONE.splice(k, 1); else DONE.push(g);
    setJ('kata_done', DONE);
    btn.setAttribute('aria-pressed', String(k < 0));
    btn.textContent = k < 0 ? '✓ দেখা হয়েছে' : '✓ দেখা হয়েছে বলে চিহ্ন দিন';
    paintTiles(); stats(); applyFilter();
  }
  function closeDetail(){
    $('#modal').hidden = true;
    document.body.classList.remove('in-detail');
    paintTiles(); stats();
  }
  function step(d){
    var idx = vis.indexOf(cur);
    if (idx < 0 || !vis.length) return;
    var n = idx + d;
    if (n >= 0 && n < vis.length) openDetail(vis[n]);
  }
  function setupPad(){
    var cv = $('#kpad');
    var r = cv.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    cv.width = Math.max(10, r.width * dpr);
    cv.height = Math.max(10, r.height * dpr);
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 9;
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#2b2f31';
    var drawing = false, lx = 0, ly = 0;
    function pos(e){ var b = cv.getBoundingClientRect(); return {x: e.clientX - b.left, y: e.clientY - b.top}; }
    cv.onpointerdown = function(e){ drawing = true; var p = pos(e); lx = p.x; ly = p.y; cv.setPointerCapture(e.pointerId); };
    cv.onpointermove = function(e){
      if (!drawing) return;
      var p = pos(e);
      ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(p.x, p.y); ctx.stroke();
      lx = p.x; ly = p.y;
    };
    cv.onpointerup = cv.onpointercancel = function(){ drawing = false; };
  }
  function clearPad(){
    var cv = $('#kpad'); if (!cv) return;
    var ctx = cv.getContext('2d'), dpr = window.devicePixelRatio || 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* ---------- word drill: read the word, pick meaning ---------- */
  var drill = {n: 0, ok: 0, c: null, answered: false};
  function drillNext(){
    var c = WORDS[Math.floor(Math.random() * WORDS.length)];
    var others = shuffle(WORDS.filter(function(x){ return x.exbn !== c.exbn; })).slice(0, 3);
    var opts = shuffle([c].concat(others));
    drill.c = c; drill.answered = false;
    $('#drillRoot').innerHTML =
      '<div class="qcard">' +
        '<div class="qhead"><span>শব্দ অনুশীলন</span><span class="kq-count">' + drill.ok + ' / ' + drill.n + ' সঠিক</span></div>' +
        '<div class="qtype">এই শব্দের বাংলা অর্থ কী?</div>' +
        '<div class="kq-big">' + esc(c.ex) + '</div>' +
        '<div class="kq-sub"><button class="btn" id="dSay">🔊 শব্দটি শুনুন</button></div>' +
        '<div class="qopts">' + opts.map(function(o){ return '<button class="qo" data-v="' + esc(o.exbn) + '">' + esc(o.exbn) + '</button>'; }).join('') + '</div>' +
        '<div class="qfb" id="dFb" hidden><div class="res" id="dRes"></div><div class="acts"><button class="btn pri" id="dNext">পরের শব্দ →</button></div></div>' +
      '</div>';
    $('#dSay').addEventListener('click', function(){ say(c.ex, this); });
    $$('#drillRoot .qo').forEach(function(b){
      b.addEventListener('click', function(){
        if (drill.answered) return;
        drill.answered = true; drill.n++;
        var ok = b.dataset.v === c.exbn;
        if (ok) drill.ok++;
        $$('#drillRoot .qo').forEach(function(x){
          if (x.dataset.v === c.exbn) x.classList.add('right');
          else if (x === b) x.classList.add('wrong');
        });
        var key = 'w:' + c.ex;
        if (!ok) MIS[key] = (MIS[key] || 0) + 1;
        else if (MIS[key]) MIS[key] = Math.max(0, MIS[key] - 1);
        setJ('kata_mis', MIS);
        $('#dRes').textContent = ok ? '✔ সঠিক! ' + c.ex + ' = ' + c.exbn : '✘ ভুল। সঠিক উত্তর: ' + c.exbn;
        $('#dRes').className = 'res ' + (ok ? 'ok' : 'bad');
        $('#dFb').hidden = false;
        say(c.ex);
        $('.kq-count', $('#drillRoot')).textContent = drill.ok + ' / ' + drill.n + ' সঠিক';
      });
    });
    $('#dNext').addEventListener('click', drillNext);
  }

  /* ---------- quiz: glyph -> romaji, romaji -> glyph ---------- */
  var quiz = {mode: 'read', n: 0, ok: 0, c: null, answered: false};
  function quizNext(){
    var c = POOL[Math.floor(Math.random() * POOL.length)];
    var isRead = quiz.mode === 'read';
    var labelOf = function(x){ return isRead ? x.r : x.g; };
    var seen = {}; seen[labelOf(c)] = true;
    var wrong = [];
    shuffle(POOL).forEach(function(x){
      var l = labelOf(x);
      if (!seen[l] && wrong.length < 3) { seen[l] = true; wrong.push(x); }
    });
    var opts = shuffle([c].concat(wrong));
    quiz.c = c; quiz.answered = false;
    var stem = isRead
      ? '<div class="kq-big">' + c.g + '</div><div class="kq-sub">এই অক্ষরের উচ্চারণ কী?</div>'
      : '<div class="kq-big rom">' + esc(c.r) + '</div><div class="kq-sub">এই উচ্চারণের অক্ষর কোনটি?</div>';
    $('#quizRoot').innerHTML =
      '<div class="qcard">' +
        '<div class="qhead"><span>কুইজ</span><span class="kq-count">' + quiz.ok + ' / ' + quiz.n + ' সঠিক</span></div>' +
        '<div class="kq-modes">' +
          '<button class="chipc" data-m="read" aria-pressed="' + isRead + '">অক্ষর → উচ্চারণ</button>' +
          '<button class="chipc" data-m="write" aria-pressed="' + !isRead + '">উচ্চারণ → অক্ষর</button>' +
        '</div>' + stem +
        '<div class="qopts">' + opts.map(function(o){
          return '<button class="qo' + (isRead ? '' : ' kj') + '" data-v="' + esc(labelOf(o)) + '">' + esc(labelOf(o)) + '</button>';
        }).join('') + '</div>' +
        '<div class="qfb" id="qFb" hidden><div class="res" id="qRes"></div><div class="acts"><button class="btn pri" id="qNext">পরেরটি →</button></div></div>' +
      '</div>';
    $$('#quizRoot [data-m]').forEach(function(b){
      b.addEventListener('click', function(){ quiz.mode = b.dataset.m; quizNext(); });
    });
    $$('#quizRoot .qo').forEach(function(b){
      b.addEventListener('click', function(){
        if (quiz.answered) return;
        quiz.answered = true; quiz.n++;
        var ok = b.dataset.v === labelOf(c);
        if (ok) quiz.ok++;
        $$('#quizRoot .qo').forEach(function(x){
          if (x.dataset.v === labelOf(c)) x.classList.add('right');
          else if (x === b) x.classList.add('wrong');
        });
        if (!ok) MIS[c.g] = (MIS[c.g] || 0) + 1;
        else if (MIS[c.g]) MIS[c.g] = Math.max(0, MIS[c.g] - 1);
        setJ('kata_mis', MIS);
        $('#qRes').textContent = ok ? '✔ সঠিক! ' + c.g + ' = ' + c.r + ' (' + c.bn + ')' : '✘ ভুল। ' + c.g + ' = ' + c.r + ' (' + c.bn + ')';
        $('#qRes').className = 'res ' + (ok ? 'ok' : 'bad');
        $('#qFb').hidden = false;
        say(c.g);
        $('.kq-count', $('#quizRoot')).textContent = quiz.ok + ' / ' + quiz.n + ' সঠিক';
      });
    });
    $('#qNext').addEventListener('click', quizNext);
  }

  /* ---------- keyboard in detail ---------- */
  document.addEventListener('keydown', function(e){
    if ($('#modal').hidden) return;
    if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
    else if (e.key === 'Escape') closeDetail();
  });

  /* ---------- init ---------- */
  $('#mback').addEventListener('click', function(e){ e.preventDefault(); closeDetail(); });
  $('#mprev').addEventListener('click', function(){ step(-1); });
  $('#mnext').addEventListener('click', function(){ step(1); });
  $('#q').addEventListener('input', applyFilter);
  $('#flt').addEventListener('change', function(){ flt = this.value; applyFilter(); });
  $('#rate').value = String(RATE);
  $('#rate').addEventListener('change', function(){ RATE = +this.value; setJ('kata_rate', RATE); });
  buildChips(); buildTiles(); paintTiles(); stats(); applyFilter(); vinfo();
})();
