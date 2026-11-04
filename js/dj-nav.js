/* Browser Back / Forward for in-page steps (tabs, lesson and kanji cards).
   A page calls DJNav.push() before each step and DJNav.init() once at load.
   Every history entry remembers the page's scroll position, so Back returns to the
   same spot instead of jumping to the previous page. */
(function () {
  var cfg = null, tracked = false, timer = 0, restoring = false;

  function saveY() {
    if (restoring) return;
    try {
      var s = history.state || {};
      history.replaceState(Object.assign({}, s, { dj: 1, y: window.pageYOffset || 0 }), '');
    } catch (e) {}
  }
  function scrollBack(y) {
    restoring = true;
    window.scrollTo(0, y || 0);
    requestAnimationFrame(function () { restoring = false; });
  }
  function track() {
    if (tracked) return;
    tracked = true;
    window.addEventListener('scroll', function () {
      if (restoring) return;
      clearTimeout(timer);
      timer = setTimeout(saveY, 150);
    }, { passive: true });
    // "#..." links create history entries: remember the position before they navigate
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (a) saveY();
    }, true);
  }
  function push(s) {
    saveY();
    try { history.pushState({ dj: 1, s: s, y: 0 }, ''); } catch (e) {}
  }
  function replace(s) {
    try { history.replaceState({ dj: 1, s: s, y: 0 }, ''); } catch (e) {}
  }
  function state() {
    var h = history.state;
    return h && h.dj ? (h.s || null) : null;
  }
  function restoreY() {
    var y = history.state && history.state.y;
    if (typeof y === 'number') scrollBack(y);
  }
  // c.snapshot() -> state of the page as it is now; c.apply(state) -> show that state (no history push)
  function init(c) {
    cfg = c;
    track();
    try { history.replaceState({ dj: 1, s: c.snapshot(), y: window.pageYOffset || 0 }, ''); } catch (e) {}
    window.addEventListener('popstate', function (e) {
      var st = e.state;
      if (!cfg || !st || !st.dj) return;
      clearTimeout(timer);
      restoring = true;
      try { cfg.apply(st.s || null); } catch (err) {}
      window.scrollTo(0, st.y || 0);
      requestAnimationFrame(function () { restoring = false; });
    });
  }

  window.DJNav = { init: init, track: track, push: push, replace: replace, state: state, restoreY: restoreY, saveY: saveY };
})();
