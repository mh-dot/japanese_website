/* Shows one panel at a time for pages whose sidebar buttons carry data-tab="x" and panels have id="tab-x". */
(function () {
  function show(k) {
    var ok = false;
    document.querySelectorAll('[data-tab]').forEach(function (b) {
      var on = b.getAttribute('data-tab') === k;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      if (on) ok = true;
    });
    if (!ok) return false;
    document.querySelectorAll('section.panel[id^="tab-"]').forEach(function (p) { p.hidden = p.id !== 'tab-' + k; });
    try { sessionStorage.setItem('dj_sub_' + location.pathname, k); } catch (e) {}
    return true;
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-tab]');
    if (!b) return;
    show(b.getAttribute('data-tab'));
    if (window.scrollY > 120) window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  var k = null;
  try { k = location.hash.slice(1) || sessionStorage.getItem('dj_sub_' + location.pathname); } catch (e) {}
  if (k) show(k);
})();
