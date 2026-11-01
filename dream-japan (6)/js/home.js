(function () {
    var words = ['সহজ বাংলায়', 'মজার ছলে', 'ধাপে ধাপে', 'আত্মবিশ্বাসের সাথে'], n = 0, el = document.getElementById('rw');
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (el) setInterval(function () {
      el.className = 'rw out';
      setTimeout(function () { n = (n + 1) % words.length; el.textContent = words[n]; el.className = 'rw in'; }, 380);
    }, 2800);
    var gis = [].slice.call(document.querySelectorAll('.gi')), hero = document.querySelector('.hero');
    if (!gis.length || !hero) return;
    var tx = 0, ty = 0, cx = 0, cy = 0, vis = true;
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { vis = e[0].isIntersecting; }).observe(hero);
    window.addEventListener('pointermove', function (e) { tx = (e.clientX / innerWidth - .5) * 2; ty = (e.clientY / innerHeight - .5) * 2; }, { passive: true });
    (function loop() {
      if (vis) {
        cx += (tx - cx) * .07; cy += (ty - cy) * .07;
        for (var k = 0; k < gis.length; k++) { var d = +gis[k].dataset.d; gis[k].style.transform = 'translate3d(' + (-cx * d).toFixed(1) + 'px,' + (-cy * d).toFixed(1) + 'px,0)'; }
      }
      requestAnimationFrame(loop);
    })();
  })();
