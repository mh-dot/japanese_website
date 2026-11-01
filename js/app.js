(function(){
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  var burger = document.getElementById('burger'), menu = document.getElementById('menu');
  if (burger && menu) {
    burger.addEventListener('click', function(){ burger.classList.toggle('open'); menu.classList.toggle('open'); });
    document.querySelectorAll('.menu a').forEach(function(a){
      a.addEventListener('click', function(){ burger.classList.remove('open'); menu.classList.remove('open'); });
    });
  }

  var root = document.documentElement, tb = document.getElementById('themeBtn');
  function applyTheme(t){
    if (t === 'dark') root.setAttribute('data-theme', 'dark'); else root.removeAttribute('data-theme');
    if (tb) tb.setAttribute('aria-label', t === 'dark' ? 'লাইট মোড' : 'ডার্ক মোড');
  }
  applyTheme(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
  if (tb) tb.addEventListener('click', function(){
    var t = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('dj_theme', t); } catch(e) {}
    applyTheme(t);
  });

  var last = window.pageYOffset || 0, lastDir = '';
  window.addEventListener('scroll', function(){
    var y = window.pageYOffset || 0, d = y - last;
    last = y;
    var nd = y <= 8 ? 'top' : (d > 4 ? 'down' : (d < -4 ? 'up' : ''));
    if (!nd || nd === lastDir) return;
    lastDir = nd;
    document.body.classList.toggle('nav-hide', nd === 'down');
  }, { passive: true });
})();
