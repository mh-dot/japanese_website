/* গ্রামার রিভিশন: লেসন ফিল্টার + খোঁজা + ফুরিগানা on/off (grammar পাতার g5_furi সেটিং এর সাথে মিলিয়ে) */
(function () {
  var secs = [].slice.call(document.querySelectorAll('.rv-lesson'));
  var cards = [].slice.call(document.querySelectorAll('.rv-card'));
  var q = document.getElementById('rvq'), cnt = document.getElementById('rvc'), empty = document.getElementById('rve');
  var chips = [].slice.call(document.querySelectorAll('.vf-chip[data-l]'));
  var furiBtns = [].slice.call(document.querySelectorAll('.seg [data-f]'));
  var lesson = 'all';
  var BN = '০১২৩৪৫৬৭৮৯';
  function bn(n) { return String(n).replace(/\d/g, function (d) { return BN[+d]; }); }

  function render() {
    var v = (q.value || '').trim().toLowerCase(), shown = 0;
    secs.forEach(function (s) {
      var ok = lesson === 'all' || s.getAttribute('data-l') === lesson, any = 0;
      [].forEach.call(s.querySelectorAll('.rv-card'), function (c) {
        var hit = ok && (!v || c.textContent.toLowerCase().indexOf(v) >= 0);
        c.hidden = !hit; if (hit) any++;
      });
      s.hidden = !any; shown += any;
    });
    cnt.textContent = bn(shown) + '/' + bn(cards.length) + 'টি রুল';
    empty.hidden = shown > 0;
  }
  chips.forEach(function (b) {
    b.addEventListener('click', function () {
      lesson = b.getAttribute('data-l');
      chips.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      render();
      var top = document.querySelector('.content-top') || q;
      if (window.scrollY > 160 && top.scrollIntoView) top.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
  q.addEventListener('input', render);

  function furi(on, save) {
    document.body.classList.toggle('nofuri', !on);
    furiBtns.forEach(function (b) { b.setAttribute('aria-pressed', (b.getAttribute('data-f') === '1') === on ? 'true' : 'false'); });
    if (save) try { localStorage.setItem('g5_furi', JSON.stringify(on)); } catch (e) {}
  }
  furiBtns.forEach(function (b) { b.addEventListener('click', function () { furi(b.getAttribute('data-f') === '1', true); }); });
  var on = true;
  try { var s = localStorage.getItem('g5_furi'); if (s != null) on = JSON.parse(s) !== false; } catch (e) {}
  furi(on, false);
  render();
})();
