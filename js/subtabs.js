/* Shows one panel at a time for pages whose sidebar buttons carry data-tab="x" and panels have id="tab-x".
   Each tab change is a Back/Forward step (DJNav), so Back returns to the previous tab. */
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
  function current() {
    var b = document.querySelector('[data-tab][aria-selected="true"]');
    return b ? b.getAttribute('data-tab') : null;
  }
  function hasTab(k) {
    return !!document.querySelector('[data-tab="' + k + '"]');
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-tab]');
    if (!b) return;
    var k = b.getAttribute('data-tab');
    if (!hasTab(k)) return;
    if (k !== current() && window.DJNav) DJNav.push({ tab: k });
    show(k);
    if (window.scrollY > 120) window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  var k = null;
  try { k = location.hash.slice(1) || sessionStorage.getItem('dj_sub_' + location.pathname); } catch (e) {}
  if (k) show(k);
  if (window.DJNav) DJNav.init({
    snapshot: function () { return { tab: current() }; },
    apply: function (s) { if (s && s.tab) show(s.tab); }
  });
})();
