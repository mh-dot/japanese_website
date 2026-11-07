(function () {
  'use strict';
  var sb = document.querySelector('.sb'); if (!sb) return;
  var inner = sb.querySelector('.sb-in'), card = sb.querySelector('.sb-card');
  var reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  sb.classList.add('js');

  /* tag children for staggered rise */
  [].forEach.call(inner.children[0].children, function (el, i) { el.classList.add('rv'); el.style.setProperty('--k', i + 1); });
  var btn = sb.querySelector('.sb-btn');
  if (btn && !btn.querySelector('.sb-arr')) btn.innerHTML = btn.textContent.replace(/\s*→\s*$/, '') + ' <span class="sb-arr">→</span>';

  /* reveal on scroll */
  function show() { sb.classList.add('in'); setTimeout(startPlayer, 500); }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (e) { if (e[0].isIntersecting) { show(); io.disconnect(); } }, { threshold: .25 });
    io.observe(sb);
  } else setTimeout(show, 0);

  /* floating glyphs */
  var fl = document.createElement('div'); fl.className = 'sb-fl'; fl.setAttribute('aria-hidden', 'true');
  var G = [['日', 8, 14, 54, 14], ['夢', 84, 10, 46, 22], ['あ', 24, 74, 44, 10], ['語', 70, 70, 58, 18], ['ア', 48, 6, 36, 26], ['本', 92, 52, 40, 12], ['の', 4, 46, 38, 20], ['字', 58, 86, 34, 16]];
  fl.innerHTML = G.map(function (g, i) {
    return '<b style="left:' + g[1] + '%;top:' + g[2] + '%;--d:' + g[4] + '"><i style="--s:' + g[3] + 'px;--r:' + (i % 2 ? -8 : 8) + 'deg;--du:' + (6 + i % 4) + 's;--dl:-' + i + 's">' + g[0] + '</i></b>';
  }).join('');
  inner.insertBefore(fl, inner.firstChild);
  var NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'sb-fuji'); svg.setAttribute('viewBox', '0 0 1000 140'); svg.setAttribute('preserveAspectRatio', 'none'); svg.setAttribute('aria-hidden', 'true');
  [['', 'M0 130 C120 122 200 102 300 98 C380 94 425 62 470 40 L500 24 L530 40 C575 62 620 94 700 98 C800 102 880 120 1000 128'],
   ['', 'M470 40 L483 52 L495 42 L507 54 L519 43 L530 40'],
   ['sun', 'M742 54 a24 24 0 1 0 48 0 a24 24 0 1 0 -48 0'],
   ['', 'M110 70 C140 60 170 60 200 70 M150 52 C170 44 195 44 215 52']].forEach(function (d, i) {
    var pa = document.createElementNS(NS, 'path'); pa.setAttribute('d', d[1]); pa.setAttribute('pathLength', '1');
    if (d[0]) pa.setAttribute('class', d[0]); pa.style.setProperty('--k', i); svg.appendChild(pa);
  });
  inner.insertBefore(svg, fl.nextSibling);
  /* scroll-linked depth: glyphs and card drift at different speeds */
  if (!reduce) {
    var tick = false;
    var sp = function () {
      tick = false; var r = sb.getBoundingClientRect(), vh = window.innerHeight;
      var p = ((r.top + r.height / 2) - vh / 2) / (vh / 2 + r.height / 2);
      inner.style.setProperty('--sy', Math.max(-1, Math.min(1, p)).toFixed(3));
    };
    window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(sp); } }, { passive: true });
    window.addEventListener('resize', sp); sp();
  }

  if (!reduce && window.matchMedia('(hover:hover)').matches) {
    inner.addEventListener('pointermove', function (e) {
      var r = inner.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      inner.style.setProperty('--mx', (x * 100) + '%'); inner.style.setProperty('--my', (y * 100) + '%');
      inner.style.setProperty('--px', ((x - .5) * 2).toFixed(2)); inner.style.setProperty('--py', ((y - .5) * 2).toFixed(2));
      inner.classList.add('spot');
      var c = card.getBoundingClientRect(), cx = (e.clientX - c.left) / c.width - .5, cy = (e.clientY - c.top) / c.height - .5;
      if (Math.abs(cx) < 1.2 && Math.abs(cy) < 1.2) { card.style.setProperty('--ry', (cx * 10).toFixed(1) + 'deg'); card.style.setProperty('--rx', (-cy * 8).toFixed(1) + 'deg'); }
    });
    inner.addEventListener('pointerleave', function () {
      inner.classList.remove('spot'); inner.style.setProperty('--px', 0); inner.style.setProperty('--py', 0);
      card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg');
    });
  }

  /* live story player: words rise in, grammar highlights paint, translation fades in */
  var SL = [
    ['見えます / 聞こえます', 'まど から «うみ が みえます»。', 'জানালা থেকে সমুদ্র দেখা যায়।'],
    ['Potential form + を→が', '«にほんご が» «はなせます»。', 'আমি জাপানি ভাষা বলতে পারি।'],
    ['は দিয়ে তুলনা', 'さかな «は» «たべられます» が、にく «は» «たべられません»。', 'মাছ খেতে পারি, কিন্তু মাংস পারি না।'],
    ['N しか V-ません', 'おかね は にひゃくえん «しか ありません»。', 'টাকা মাত্র ২০০ ইয়েন ছিল।'],
    ['できます (তৈরি হওয়া)', 'あたらしい みち が «できました»。', 'নতুন রাস্তা তৈরি হয়েছে।']
  ];
  var small = card.querySelector('small'), lesson = small.textContent;
  var stage = document.createElement('div'); stage.className = 'sb-stage';
  var dots = document.createElement('div'); dots.className = 'sb-dots';
  dots.innerHTML = SL.map(function () { return '<i></i>'; }).join('');
  var chips = card.querySelector('ul');
  [].slice.call(card.children).forEach(function (el) { if (el !== small && el !== chips) el.remove(); });
  card.insertBefore(stage, chips); card.insertBefore(dots, chips);

  function build(s) {
    var mi = 0, h = s[1].replace(/«([^»]*)»/g, function (m, t) { return '<mark class="m' + (mi++ % 3) + '">' + t + '</mark>'; });
    return '<span class="sb-lab">' + s[0] + '</span><p class="sb-jp">' + h + '</p><p class="sb-bn">' + s[2] + '</p>';
  }
  var cur = 0, timer = 0, ctl = null, paused = false, visible = true, HOLD = 4200;
  function play(i) {
    cur = i; clearTimeout(timer); if (ctl) ctl.stop();
    stage.classList.remove('out'); stage.innerHTML = build(SL[i]); small.textContent = lesson;
    [].forEach.call(dots.children, function (d, k) { d.className = k < i ? 'done' : ''; });
    dots.style.setProperty('--hold', (HOLD / 1000) + 's');
    var jp = stage.querySelector('.sb-jp'), bnEl = stage.querySelector('.sb-bn');
    if (reduce || !window.DJ_TW) { bnEl.classList.add('show'); dots.children[i].className = 'done'; return; }
    ctl = DJ_TW.type(jp, DJ_TW.prepare(jp), { speed: 75, onDone: function () {
      bnEl.classList.add('show'); dots.children[i].className = 'on';
      timer = setTimeout(next, HOLD);
    } });
  }
  function next() {
    if (paused || !visible) { timer = setTimeout(next, 600); return; }
    stage.classList.add('out');
    timer = setTimeout(function () { play((cur + 1) % SL.length); }, 380);
  }
  var started = false;
  function startPlayer() { if (started) return; started = true; play(0); }
  dots.addEventListener('click', function (e) { var k = [].indexOf.call(dots.children, e.target); if (k > -1) play(k); });
  card.addEventListener('pointerenter', function () { paused = true; });
  card.addEventListener('pointerleave', function () { paused = false; });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(sb);
})();
