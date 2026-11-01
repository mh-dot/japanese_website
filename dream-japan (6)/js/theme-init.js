try{if(localStorage.getItem('dj_theme')==='dark')document.documentElement.setAttribute('data-theme','dark')}catch(e){}
(function(){var g=Storage.prototype.getItem;Storage.prototype.getItem=function(k){
  if(/theme$/.test(k)){var t='light';try{t=localStorage.getItem('dj_theme')==='dark'?'dark':'light'}catch(e){}return /^g5_/.test(k)?JSON.stringify(t):t}
  return g.call(this,k)}})();
