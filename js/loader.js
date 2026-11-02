/* Full-page loader: a ring that runs while the page loads and counts elapsed seconds. */
(function () {
  var BN = '০১২৩৪৫৬৭৮৯';
  function bn(s) { return String(s).replace(/\d/g, function (d) { return BN[+d]; }); }
  var LABEL = 'সেকেন্ড';
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var R = 92, C = 2 * Math.PI * R, CX = 110, CY = 110;
  var rafId = 0, done = false, loader, numEl, arcEl, knobEl;

  function el(name, attrs, parent) {
    var n = document.createElementNS(SVG_NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  function build() {
    loader = document.createElement('div');
    loader.className = 'dj-loader';
    loader.setAttribute('role', 'status');
    loader.setAttribute('aria-live', 'polite');
    loader.innerHTML =
      '<div class="dj-ring-wrap">' +
        '<svg viewBox="0 0 220 220" class="dj-ring" aria-hidden="true">' +
          '<defs><linearGradient id="djGrad" x1="0" y1="0" x2="1" y2="1">' +
            '<stop offset="0" stop-color="#9943ee"/><stop offset="1" stop-color="#2b235a"/>' +
          '</linearGradient></defs>' +
        '</svg>' +
        '<div class="dj-center"><b class="dj-num">' + bn('0.0') + '</b><span class="dj-unit">' + LABEL + '</span></div>' +
      '</div>';
    var svg = loader.querySelector('svg');
    for (var i = 0; i < 16; i++) {
      var a = (i / 16) * 2 * Math.PI, x = CX + 112 * Math.cos(a), y = CY + 112 * Math.sin(a);
      el('circle', { cx: x.toFixed(2), cy: y.toFixed(2), r: 1.6, class: 'dj-dot' }, svg);
    }
    el('circle', { cx: CX, cy: CY, r: R, fill: 'none', class: 'dj-track', 'stroke-width': 22 }, svg);
    arcEl = el('circle', {
      cx: CX, cy: CY, r: R, fill: 'none', stroke: 'url(#djGrad)', 'stroke-width': 22,
      'stroke-dasharray': C.toFixed(2), 'stroke-dashoffset': C.toFixed(2),
      transform: 'rotate(-90 ' + CX + ' ' + CY + ')', class: 'dj-arc'
    }, svg);
    knobEl = el('circle', { cx: CX, cy: CY - R, r: 12, class: 'dj-knob' }, svg);
    numEl = loader.querySelector('.dj-num');
    // runs while <head> is still parsing, so attach to <html> if <body> does not exist yet
    (document.body || document.documentElement).appendChild(loader);
  }

  function frame() {
    var secs = performance.now() / 1000;
    // the ring sweeps once every 10 seconds, so it keeps moving on long loads
    var p = (secs % 10) / 10;
    arcEl.setAttribute('stroke-dashoffset', (C * (1 - p)).toFixed(2));
    var t = -Math.PI / 2 + 2 * Math.PI * p;
    knobEl.setAttribute('cx', (CX + R * Math.cos(t)).toFixed(2));
    knobEl.setAttribute('cy', (CY + R * Math.sin(t)).toFixed(2));
    numEl.textContent = bn(secs.toFixed(1));
  }

  function finish() {
    if (done) return;
    done = true;
    clearInterval(rafId);
    if (!loader) return;
    numEl.textContent = bn((performance.now() / 1000).toFixed(1));
    arcEl.setAttribute('stroke-dashoffset', '0');
    setTimeout(function () { loader.classList.add('is-done'); }, 150);
    setTimeout(function () { if (loader && loader.parentNode) loader.parentNode.removeChild(loader); }, 800);
  }

  function start() {
    build();
    // setInterval, not rAF: browsers skip rAF while render is blocked by a pending stylesheet
    rafId = setInterval(frame, 33);
    frame();
    if (document.readyState === 'complete') finish();
    else window.addEventListener('load', finish);
  }

  var css = document.createElement('style');
  css.textContent =
    '.dj-loader{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;' +
    'background:radial-gradient(circle at 50% 45%,var(--card,#fff) 0%,var(--sky-mid,#f8f8f9) 70%);' +
    'transition:opacity .6s ease,visibility .6s ease}' +
    '.dj-loader.is-done{opacity:0;visibility:hidden}' +
    '.dj-ring-wrap{position:relative;width:min(230px,60vw);aspect-ratio:1}' +
    '.dj-ring{width:100%;height:100%;display:block;overflow:visible;' +
    'filter:drop-shadow(0 18px 28px rgba(43,35,90,.12))}' +
    '.dj-track{stroke:#ececf2}' +
    'html[data-theme=dark] .dj-track{stroke:#2e2850}' +
    '.dj-dot{fill:#c8c6d6}' +
    'html[data-theme=dark] .dj-dot{fill:#4a4470}' +
    '.dj-arc{transition:none}' +
    '.dj-knob{fill:#fff;filter:drop-shadow(0 4px 8px rgba(0,0,0,.25))}' +
    '.dj-center{position:absolute;inset:50% auto auto 50%;transform:translate(-50%,-50%);' +
    'width:58%;aspect-ratio:1;border-radius:50%;background:var(--card,#fff);' +
    'display:flex;flex-direction:column;align-items:center;justify-content:center;' +
    'box-shadow:0 14px 30px -12px rgba(43,35,90,.35),inset 0 -4px 10px rgba(43,35,90,.05)}' +
    '.dj-num{font-family:Inter,"Hind Siliguri",sans-serif;font-weight:800;font-size:clamp(34px,8vw,46px);' +
    'line-height:1;color:var(--ink,#111827);letter-spacing:-.02em;font-variant-numeric:tabular-nums}' +
    '.dj-unit{margin-top:4px;font-family:Inter,"Hind Siliguri",sans-serif;font-size:13px;font-weight:600;' +
    'color:var(--sub,#554f7b)}' +
    '@media (prefers-reduced-motion:reduce){.dj-loader{transition:none}}';
  (document.head || document.documentElement).appendChild(css);

  start();
})();
