
(function(){
  function ap(t){
    try{ if(typeof setTheme==='function') setTheme(t); else document.documentElement.setAttribute('data-theme',t); }
    catch(e){ document.documentElement.setAttribute('data-theme',t); }
    if(t==='light'&&document.documentElement.getAttribute('data-theme')==='dark')document.documentElement.setAttribute('data-theme','light');
  }
  window.addEventListener('message',function(e){ var d=e.data; if(d&&d.djTheme) ap(d.djTheme); });
  try{ parent.postMessage({djReady:1},'*'); }catch(e){}
})();
