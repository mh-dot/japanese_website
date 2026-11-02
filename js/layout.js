/* Wraps each page's tab area in a collapsible left sidebar and moves the rest of the content beside it. */
(function () {
  var KEY = 'dj_side';
  var ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true">' +
             '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16"/></svg>';

  function readOpen() {
    try {
      var v = localStorage.getItem(KEY);
      if (v === '0') return false;
      if (v === '1') return true;
    } catch (e) {}
    return !window.matchMedia('(max-width:860px)').matches; // open on desktop, closed on phones
  }
  function saveOpen(open) { try { localStorage.setItem(KEY, open ? '1' : '0'); } catch (e) {} }

  function init() {
    // the page's tab bar, or its category filter bar (katakana / verb-forms)
    var tabsBox = document.querySelector('section.tabbox') || document.querySelector('nav.tabs') || document.querySelector('.vf-bar');
    if (!tabsBox || tabsBox.closest('.app-shell')) return;

    var footer = document.querySelector('footer');
    var shell = document.createElement('div');
    shell.className = 'app-shell';
    var side = document.createElement('aside');
    side.className = 'side';
    side.setAttribute('aria-label', 'নির্বাচন');
    var content = document.createElement('div');
    content.className = 'content';

    tabsBox.parentNode.insertBefore(shell, tabsBox);
    side.appendChild(tabsBox);
    var catf = document.getElementById('catf'); // filled later by the page script, so move it while empty
    if (catf) side.appendChild(catf);
    shell.appendChild(side);
    shell.appendChild(content);

    // everything after the tab area (until footer / scripts / modal) moves into the content column
    var n = shell.nextSibling;
    while (n && n !== footer) {
      if (n.nodeType === 1 && (n.tagName === 'SCRIPT' || n.tagName === 'FOOTER' || n.classList.contains('modal'))) break;
      var nx = n.nextSibling;
      content.appendChild(n);
      n = nx;
    }

    var bar = document.createElement('div');
    bar.className = 'content-top';
    bar.innerHTML = '<button type="button" class="side-toggle" aria-label="সাইডবার চালু/বন্ধ" title="সাইডবার">' + ICON + '</button>';
    content.insertBefore(bar, content.firstChild);
    var btn = bar.firstChild;

    // move the page title (h1 + paragraph) beside the toggle, so it sits at the top-left of the content
    var h1 = document.querySelector('header h1');
    if (h1) {
      var titleBox = document.createElement('div');
      titleBox.className = 'page-title';
      var brand = h1.closest('.brand');
      var head = brand || h1;
      var header = h1.closest('header');
      var items = [head];
      if (!brand && h1.nextElementSibling && h1.nextElementSibling.tagName === 'P') items.push(h1.nextElementSibling);
      items.forEach(function (node) { titleBox.appendChild(node); });
      bar.appendChild(titleBox);
      // drop the header wrapper once nothing visible is left in it
      if (header) {
        var left = Array.prototype.some.call(header.children, function (c) {
          return getComputedStyle(c).display !== 'none' && c.textContent.trim() !== '';
        });
        if (!left) header.style.display = 'none';
      }
    }

    function apply(open) {
      shell.classList.toggle('is-closed', !open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    apply(readOpen());
    btn.addEventListener('click', function () {
      var open = shell.classList.contains('is-closed');
      apply(open);
      saveOpen(open);
    });
  }

  // this file is loaded before the page's own scripts, so the DOM is still in its static layout here
  init();
})();
