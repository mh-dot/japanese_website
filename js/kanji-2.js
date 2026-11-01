
document.addEventListener('click', function(e){
  var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
  if(!a) return;
  e.preventDefault();
  var id = a.getAttribute('href').slice(1);
  try{ history.replaceState(null, '', id ? '#' + id : location.href.split('#')[0]); }catch(err){}
  if(typeof route === 'function') route();
}, true);
