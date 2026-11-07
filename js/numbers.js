/* Numbers page: tap a tile to hear it, "test yourself" mode, and the counter picker. */
(function () {
  var synth = window.speechSynthesis, voice = null, quiz = false, timer = 0;

  function pickVoice() {
    if (!synth) return;
    var v = synth.getVoices();
    voice = null;
    for (var i = 0; i < v.length; i++) if (/^ja/i.test(v[i].lang)) { voice = v[i]; break; }
  }
  if (synth) {
    pickVoice();
    if (synth.addEventListener) synth.addEventListener('voiceschanged', pickVoice);
  }
  /* প্রতিটি টাইলের বাংলা অংশে একটি 🔈 বাংলা উচ্চারণ বাটন যোগ করা (টাইল চাপলে জাপানি শোনা যায়) */
  if (window.DJ_BN) {
    document.querySelectorAll('.nm-tile').forEach(function (t) {
      var sub = t.querySelector('.nm-sub');
      var m = sub && sub.textContent.match(/[ঀ-৿].*$/);
      if (!m) return;
      var s = document.createElement('span');
      s.className = 'nm-bnsp';
      s.setAttribute('data-bn-say', m[0].trim());
      s.title = 'বাংলা শুনুন';
      s.textContent = ' 🔈';
      sub.appendChild(s);
    });
  }

  function say(t) {
    if (!synth || !t) return;
    try {
      synth.cancel();
      var u = new SpeechSynthesisUtterance(t);
      u.lang = 'ja-JP'; u.rate = 0.8;
      if (voice) u.voice = voice;
      synth.speak(u);
    } catch (e) {}
  }

  function setQuiz(on) {
    quiz = on;
    document.body.classList.toggle('nm-quiz', on);
    document.querySelectorAll('.nm-tile.shown').forEach(function (t) { t.classList.remove('shown'); });
    document.querySelectorAll('.nm-quizbtn').forEach(function (b) {
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.textContent = on ? '🙈 পরীক্ষা মোড: চালু' : '👀 পরীক্ষা মোড: বন্ধ';
    });
    document.querySelectorAll('.nm-qhint').forEach(function (h) { h.hidden = !on; });
  }

  // a small toolbar (legend + test switch) under the intro line of every panel that has tiles
  document.querySelectorAll('section.panel').forEach(function (p) {
    if (!p.querySelector('.nm-tile')) return;
    var hot = p.querySelector('.nm-tile.hot');
    var bar = document.createElement('div');
    bar.className = 'nm-tools';
    bar.innerHTML =
      (hot ? '<span class="nm-legend"><i></i>রঙিন ঘর = ফাঁদ / ব্যতিক্রম, আগে এগুলো মুখস্থ করুন</span>' : '') +
      '<button type="button" class="nm-quizbtn" aria-pressed="false">👀 পরীক্ষা মোড: বন্ধ</button>' +
      '<span class="nm-qhint" hidden>উত্তর ঝাপসা থাকবে। মনে করার চেষ্টা করুন, তারপর ঘরে ট্যাপ করলে উত্তর দেখা ও শোনা যাবে।</span>';
    var anchor = p.querySelector('p.note') || p.querySelector('h2');
    anchor.insertAdjacentElement('afterend', bar);
  });

  document.addEventListener('click', function (e) {
    var q = e.target.closest && e.target.closest('.nm-quizbtn');
    if (q) { setQuiz(!quiz); return; }

    var c = e.target.closest && e.target.closest('.nm-chip');
    if (c) {
      var box = c.closest('.nm-counter'), id = c.getAttribute('data-c');
      box.querySelectorAll('.nm-chip').forEach(function (b) { b.setAttribute('aria-pressed', b === c ? 'true' : 'false'); });
      box.querySelectorAll('.nm-cpanel').forEach(function (p) { p.hidden = p.getAttribute('data-c') !== id; });
      box.querySelectorAll('.nm-tile.shown').forEach(function (t) { t.classList.remove('shown'); });
      return;
    }

    var t = e.target.closest && e.target.closest('.nm-tile');
    if (!t) return;
    if (quiz) {
      var on = !t.classList.contains('shown');
      t.classList.toggle('shown', on);
      if (on) say(t.getAttribute('data-say'));
    } else {
      say(t.getAttribute('data-say'));
    }
  });
})();
