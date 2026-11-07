/* বাংলা ভয়েস: জাপানি উচ্চারণের পাশে বাংলা অর্থ পড়ে শোনানো।
   ব্যবহার: DJ_BN.html(text, label) → একটি 🔊 বাংলা বাটনের HTML
            DJ_BN.btn(text, label)  → একটি বাটন এলিমেন্ট
   যে কোনো এলিমেন্টে data-bn-say="টেক্সট" থাকলে ক্লিক করলে বাংলা পড়বে। */
(function () {
  var synth = window.speechSynthesis || null;
  var NO_VOICE_MSG = 'এই ব্রাউজারে বাংলা ভয়েস নেই, তাই ডিফল্ট ভয়েসে পড়া হচ্ছে। Microsoft Edge-এ চেষ্টা করুন, অথবা Windows সেটিংসে Bengali ভয়েস যোগ করুন।';

  /* অ্যালার্টের বদলে পেজের নিচে ছোট বার্তা, কয়েক সেকেন্ড পর নিজে থেকে সরে যায় */
  function note(msg) {
    var n = document.getElementById('dj-bn-note');
    if (!n) {
      n = document.createElement('div');
      n.id = 'dj-bn-note';
      n.setAttribute('role', 'status');
      n.style.cssText = 'position:fixed;left:50%;bottom:16px;transform:translateX(-50%);width:max-content;max-width:90vw;' +
        'padding:10px 14px;border-radius:12px;background:#2b235a;color:#fff;font:14px/1.5 system-ui,sans-serif;' +
        'z-index:9999;box-shadow:0 6px 20px rgba(0,0,0,.3);text-align:center';
      document.body.appendChild(n);
    }
    n.textContent = msg;
    n.hidden = false;
    clearTimeout(n._t);
    n._t = setTimeout(function () { n.hidden = true; }, 6000);
  }

  function voices() { return synth ? synth.getVoices() : []; }

  function bnVoice() {
    var bn = voices().filter(function (v) {
      return /^bn/i.test(v.lang) || /bangla|bengali|বাংলা/i.test(v.name);
    });
    return bn.find(function (v) { return /^bn[-_]BD/i.test(v.lang); }) || bn[0] || null;
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function say(text, btn) {
    if (!synth) { alert('এই ব্রাউজারে শব্দ সাপোর্ট নেই। Chrome বা Edge ব্যবহার করুন।'); return; }
    var t = String(text || '').replace(/\s+/g, ' ').trim();
    if (!t) return;
    var v = bnVoice();
    if (!v) note(NO_VOICE_MSG);
    synth.cancel();
    document.querySelectorAll('.bn-on').forEach(function (e) { e.classList.remove('bn-on'); });
    /* লম্বা অনুচ্ছেদ হলে বাক্য ধরে ভাগ করে একের পর এক পড়ে, যাতে মাঝপথে থেমে না যায় */
    var parts = t.split(/[।?!]+\s*/).filter(Boolean);
    if (!parts.length) parts = [t];
    if (btn) btn.classList.add('bn-on');
    parts.forEach(function (p, i) {
      var u = new SpeechSynthesisUtterance(p);
      u.lang = v ? v.lang : 'bn-BD';
      u.rate = 0.95;
      if (v) u.voice = v;
      if (btn && i === parts.length - 1) u.onend = u.onerror = function () { btn.classList.remove('bn-on'); };
      synth.speak(u);
    });
  }

  function html(text, label) {
    return '<button type="button" class="dj-bnb" data-bn-say="' + esc(text) + '">🔊 ' + (label || 'বাংলা') + '</button>';
  }

  function btn(text, label) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'dj-bnb';
    b.setAttribute('data-bn-say', text);
    b.textContent = '🔊 ' + (label || 'বাংলা');
    return b;
  }

  /* capture phase: বাংলা বাটন চাপলে কার্ডের অন্য ক্লিক (ফ্লিপ, জাপানি উচ্চারণ ইত্যাদি) চালু হবে না */
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('[data-bn-say]') : null;
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();
    say(b.getAttribute('data-bn-say'), b);
  }, true);

  var css = '.dj-bnb{display:inline-flex;align-items:center;gap:.3em;margin:.25em .3em .25em 0;padding:.3em .85em;' +
    'border:1px solid currentColor;border-radius:999px;background:transparent;color:inherit;font:inherit;' +
    'font-size:.82em;line-height:1.2;cursor:pointer;opacity:.85;vertical-align:middle}' +
    '.dj-bnb:hover{opacity:1}.dj-bnb:focus-visible{outline:2px solid #9943ee;outline-offset:2px}' +
    '.dj-bnb.bn-on{background:#9943ee;border-color:#9943ee;color:#fff;opacity:1}' +
    '[data-bn-say]:not(button){cursor:pointer;text-decoration:underline dotted;white-space:nowrap}';
  var st = document.createElement('style');
  st.textContent = css;
  (document.head || document.documentElement).appendChild(st);

  window.DJ_BN = { say: say, html: html, btn: btn, voice: bnVoice, esc: esc };
  if (synth) { synth.getVoices(); synth.addEventListener && synth.addEventListener('voiceschanged', function () {}); }
})();
