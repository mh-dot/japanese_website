(function(){
var sheet=document.getElementById('sheet');if(!sheet)return;
function fold(){
  sheet.querySelectorAll('.sec').forEach(function(sec){
    var h=sec.querySelector('h3'),t=sec.querySelector('table');
    if(!h||!t||h.textContent.indexOf('এই কাঞ্জি দিয়ে শব্দ')<0)return;
    var wrap=t.closest('.tblw')||t;
    var rows=[].slice.call(t.querySelectorAll('tbody > tr'));
    var words=rows.filter(function(r){return !r.classList.contains('exr')});
    var grid=document.createElement('div');grid.className='wgrid';
    grid.innerHTML='<div class="wh">শব্দ · উচ্চারণ · অর্থ</div><div class="wh">বাক্যে ব্যবহার</div>';
    words.forEach(function(w){
      var tds=w.querySelectorAll('td');
      var L=document.createElement('div');L.className='wcell wl';
      L.innerHTML='<div class="wjp">'+tds[0].innerHTML+'</div><div class="wmeta">'+tds[1].textContent+' · '+tds[2].textContent+' · '+tds[3].textContent+'</div>';
      var sb=tds[4]&&tds[4].querySelector('button');if(sb)L.appendChild(sb);
      var R=document.createElement('div');R.className='wcell wr';
      var ex=w.nextElementSibling;
      if(ex&&ex.classList.contains('exr')){
        var etd=ex.querySelector('td');
        while(etd.firstChild)R.appendChild(etd.firstChild);
        ex.remove();
      }else{R.innerHTML='<span class="wnone">উদাহরণ নেই</span>'}
      grid.appendChild(L);grid.appendChild(R);
    });
    wrap.parentNode.insertBefore(grid,wrap);wrap.remove();
    var LIM=2,pairs=grid.querySelectorAll('.wl'),hidden=0;
    pairs.forEach(function(L,k){
      if(k<LIM)return;
      hidden++;
      L.classList.add('wfold');L.nextElementSibling.classList.add('wfold');
    });
    if(!hidden)return;
    var btn=document.createElement('button');
    btn.className='btn sm wmore';btn.textContent='আরও '+hidden+'টি শব্দ দেখুন';
    btn.onclick=function(){grid.querySelectorAll('.wfold').forEach(function(r){r.classList.remove('wfold')});btn.remove()};
    sec.appendChild(btn);
  });
}
new MutationObserver(fold).observe(sheet,{childList:true,subtree:true});
fold();
})();