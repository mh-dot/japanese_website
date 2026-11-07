/* v28: বাক্য পেজের তিনটি ভিউ
   - কার্ড: একবারে একটি কার্ড, স্লাইড করে বদলায়। ← → দিয়ে যাওয়া-আসা, Space/চাপ দিয়ে উল্টানো।
   - গ্রিড: ছোট টাইলের গ্রিড, ল্যাপটপে মাঝখানে একটি কন্টেইনারে।
   - বিস্তারিত: আগের (v27) সব কার্ড, যেমন ছিল।
   বাক্যের ডেটা sentence-1.js থেকেই নেওয়া; এই ফাইল শুধু দেখানোর কাজ করে। */
(function(){
  var TABS = {
    base:{d:function(){return D},w:function(){return W},s:null},
    l18:{d:function(){return L18},w:function(){return LW18},s:null},
    l23:{d:function(){return L23},w:function(){return LW},s:null},
    l24:{d:function(){return L24},w:function(){return LW24},s:null},
    l25:{d:function(){return L25},w:function(){return LW25},s:function(){return SEC25}},
    l24g:{d:function(){return L24G},w:function(){return LW24G},s:function(){return SEC24G}},
    l26:{d:function(){return L26},w:function(){return LW26},s:function(){return SEC26}},
    l27:{d:function(){return L27},w:function(){return LW27},s:function(){return SEC27}},
    l28:{d:function(){return L28},w:function(){return LW28},s:function(){return SEC28}},
    l29:{d:function(){return L29},w:function(){return LW29},s:function(){return SEC29}},
    l30:{d:function(){return L30},w:function(){return LW30},s:function(){return SEC30}}
  };

  function store(k,v){ try{ if(v===undefined) return localStorage.getItem(k); localStorage.setItem(k,v); }catch(e){ return null; } }
  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function parse(s){ try{ var v=JSON.parse(s); return v&&typeof v==='object'?v:{}; }catch(e){ return {}; } }
  function saveMarks(){ store('sxMarks', JSON.stringify(marks)); }

  var marks = parse(store('sxMarks'));   /* "tab:index" -> 'k' (জানি) বা 'a' (আবার) */
  var perm = {};                          /* শাফল করা ক্রম, tab -> index-এর তালিকা */
  var view = store('sxView');
  if(['card','grid','detail'].indexOf(view)<0) view='card';
  var form = store('sxForm') === 'pla' ? 'pla' : 'pol';
  var st = {i:0};
  var cache = {};

  var deck=document.getElementById('sxDeck'), mini=document.getElementById('sxMini'),
      body=document.getElementById('sxBody'), count=document.getElementById('sxCount'),
      menu=document.getElementById('sxMenu');
  var cbs=[].slice.call(document.querySelectorAll('.sx-cfg input[name="view"]'));

  /* প্রতিটি বাক্যকে একটি আইটেমে সাজানো */
  function items(t){
    if(!TABS[t]) return [];
    if(cache[t]) return cache[t];
    var c=TABS[t], ws=c.w(), secs=c.s?c.s():null, out=[];
    c.d().split('\n').forEach(function(line,i){
      if(!line.trim()) return;
      var p=line.split('|'), rp=conv(p[1]), rl=conv(p[2]), sec=null;
      if(secs){ var f=secs.find(function(x){return i>=x.s&&i<=x.e}); sec=f?f.k:null; }
      out.push({
        i:i, em:p[0], pol:p[1], pla:p[2], mean:p[3], pat:p[4]||'', chg:p[5]||'',
        rp:rp[0], pb:rp[1], rl:rl[0], sec:sec,
        words:(ws[i]||'').split(';').filter(Boolean).map(function(x){var a=x.split('=');return {jp:a[0],bn:a[1]||''}})
      });
    });
    return (cache[t]=out);
  }
  function sectionKey(t){
    var b=document.querySelector('.secbar[data-tab="'+t+'"] button[aria-pressed="true"]');
    return b?b.dataset.s:'all';
  }
  /* বর্তমান ট্যাব + নিয়ম-ফিল্টার অনুযায়ী কার্ডের তালিকা */
  function list(t){
    var k=sectionKey(t);
    var L=items(t).filter(function(it){return k==='all'||it.sec===k});
    var p=perm[t];
    if(p){ var pos={}; p.forEach(function(v,j){pos[v]=j}); L=L.slice().sort(function(a,b){return pos[a.i]-pos[b.i]}); }
    return L;
  }
  function curT(){ return curTab() || 'base'; }
  function shuffle(a){ for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)), x=a[i]; a[i]=a[j]; a[j]=x; } return a; }

  /* ---- কার্ড ভিউ ---- */
  function renderCard(dir){
    var t=curT(), L=list(t), total=L.length;
    menu.hidden=true;
    if(!total){ count.textContent=''; body.innerHTML='<p class="sx-empty">এই অংশে কোনো কার্ড নেই।</p>'; return; }
    if(st.i>total) st.i=total;
    if(st.i===total){
      var k=0,a=0;
      L.forEach(function(it){ var m=marks[t+':'+it.i]; if(m==='k')k++; else if(m==='a')a++; });
      count.textContent=total+'-এর মধ্যে সব দেখা হয়েছে';
      body.innerHTML='<div class="sx-done"><h3>এই অংশের সব কার্ড দেখা হয়েছে</h3>'+
        '<p>জানা: '+k+' · আবার দেখব: '+a+' · মোট: '+total+'</p>'+
        '<div class="sx-donebtns"><button type="button" data-act="restart">শুরু থেকে দেখুন</button><button type="button" data-act="grid">গ্রিডে দেখুন</button></div></div>';
      return;
    }
    var it=L[st.i], jp=form==='pla'?it.pla:it.pol, ro=form==='pla'?it.rl:it.rp;
    var m=marks[t+':'+it.i]||'';
    var mk=m==='k'?'<span class="sx-mk k">✓ জানা</span>':m==='a'?'<span class="sx-mk a">✕ আবার</span>':'';
    var words=it.words.map(function(w){
      return '<button type="button" class="sx-w" data-jp="'+esc(w.jp)+'"><span lang="ja">'+esc(w.jp)+'</span>'+
        '<small data-bn-say="'+DJ_BN.esc(w.bn)+'" title="বাংলা শুনুন">'+esc(w.bn)+' 🔊</small></button>';
    }).join('');
    var sw='<div class="sx-sw" role="group" aria-label="রূপ বাছুন"><span'+(form==='pol'?' class="sx-on"':'')+'>ভদ্র</span>'+
      '<button type="button" class="sx-tog" data-tog role="switch" aria-checked="'+(form==='pla')+'" aria-label="Polite বা Plain"><i></i></button>'+
      '<span'+(form==='pla'?' class="sx-on"':'')+'>সাধারণ</span></div>';
    body.innerHTML='<article class="sx-card" id="sxCard" tabindex="0" aria-label="কার্ড '+(st.i+1)+'">'+sw+mk+
      '<div class="sx-front"><span class="sx-tag">'+esc(it.pat)+'</span>'+
        '<div class="sx-emo" aria-hidden="true">'+it.em+'</div>'+
        '<div class="sx-jp" lang="ja">'+esc(jp)+'</div>'+
        '<div class="sx-hint">উত্তর দেখতে কার্ডে চাপুন বা Space চাপুন</div></div>'+
      '<div class="sx-back">'+
        '<p class="sx-ro"><b>Romaji:</b> '+esc(ro)+'</p>'+
        '<p class="sx-bn"><b>বাংলা:</b> '+esc(it.mean)+' '+DJ_BN.html(it.mean,'অর্থ শুনুন')+'</p>'+
        (form==='pol'?'<p class="sx-pron">উচ্চারণ: '+esc(it.pb)+'</p>':'')+
        '<div class="sx-words">'+words+'</div>'+
        '<p class="sx-gr">ব্যাকরণ: '+esc(form==='pla'?it.chg:it.pat)+'</p>'+
      '</div></article>';
    var c=document.getElementById('sxCard');
    if(dir) c.classList.add(dir==='up'?'enter-up':'enter-down');
    count.textContent=total+'-এর মধ্যে '+(st.i+1);
  }
  function go(d){
    var total=list(curT()).length;
    if(!total) return;
    st.i=Math.max(0,st.i+d);
    renderCard(d>0?'up':'down');
  }
  function flip(){ var c=document.getElementById('sxCard'); if(c) c.classList.toggle('flipped'); }
  function mark(v){
    var t=curT(), it=list(t)[st.i];
    if(!it) return;
    marks[t+':'+it.i]=v; saveMarks();
    go(1);
  }
  function speakCurrent(btn){
    var it=list(curT())[st.i];
    if(it) say([form==='pla'?it.pla:it.pol],[btn]);
  }

  /* ---- ছোট গ্রিড ভিউ ---- */
  function renderMini(){
    var t=curT(), L=list(t);
    if(!L.length){ mini.innerHTML='<p class="sx-empty">এই অংশে কোনো কার্ড নেই।</p>'; return; }
    mini.innerHTML=L.map(function(it,pos){
      var m=marks[t+':'+it.i]||'';
      return '<button type="button" class="sx-tile'+(m==='k'?' k':m==='a'?' a':'')+'" data-p="'+pos+'">'+
        '<span class="sx-n">'+(pos+1)+'</span><span class="sx-e" aria-hidden="true">'+it.em+'</span>'+
        '<span class="sx-j" lang="ja">'+esc(form==='pla'?it.pla:it.pol)+'</span>'+
        '<span class="sx-m">'+esc(it.mean)+'</span></button>';
    }).join('');
  }

  /* ---- ভিউ বদলানো ---- */
  function applyView(){
    var t=curT();
    document.querySelectorAll('main.grid').forEach(function(g){ g.hidden = !(view==='detail' && g.dataset.tab===t); });
    deck.hidden = view!=='card';
    mini.hidden = view!=='grid';
    cbs.forEach(function(c){ c.checked = c.value===view; });
    if(view==='card') renderCard(); else if(view==='grid') renderMini();
  }
  function setView(v){ view=v; store('sxView', v); applyView(); }

  /* ---- ইভেন্ট ---- */
  cbs.forEach(function(c){ c.addEventListener('change', function(){ setView(c.value); }); });

  document.getElementById('sxPrev').addEventListener('click', function(){ go(-1); });
  document.getElementById('sxNext').addEventListener('click', function(){ go(1); });
  document.getElementById('sxNo').addEventListener('click', function(){ mark('a'); });
  document.getElementById('sxYes').addEventListener('click', function(){ mark('k'); });
  document.getElementById('sxSpk').addEventListener('click', function(){ speakCurrent(this); });
  document.getElementById('sxMore').addEventListener('click', function(){ menu.hidden=!menu.hidden; });

  function doAct(act){
    var t=curT();
    if(act==='restart'){ st.i=0; renderCard(); }
    else if(act==='grid'){ setView('grid'); }
    else if(act==='shuffle'){ perm[t]=shuffle(items(t).map(function(x){return x.i})); st.i=0; renderCard(); }
    else if(act==='clear'){ items(t).forEach(function(x){ delete marks[t+':'+x.i]; }); saveMarks(); renderCard(); }
  }
  menu.addEventListener('click', function(e){ var b=e.target.closest('button'); if(b) doAct(b.dataset.act); });

  body.addEventListener('click', function(e){
    if(e.target.closest('[data-tog]')){
      var was=!!document.querySelector('#sxCard.flipped');
      form=form==='pla'?'pol':'pla'; store('sxForm',form);
      renderCard(); if(was) document.getElementById('sxCard').classList.add('flipped');
      return;
    }
    var act=e.target.closest('[data-act]');
    if(act){ doAct(act.dataset.act); return; }
    var w=e.target.closest('.sx-w');
    if(w){ say([w.dataset.jp],[w]); return; }
    if(e.target.closest('button')) return;
    flip();
  });

  /* ছোট পর্দায় আঙুল দিয়ে সোয়াইপ */
  var tx=null, ty=0;
  body.addEventListener('touchstart', function(e){ tx=e.touches[0].clientX; ty=e.touches[0].clientY; }, {passive:true});
  body.addEventListener('touchend', function(e){
    if(tx===null) return;
    var dx=e.changedTouches[0].clientX-tx, dy=e.changedTouches[0].clientY-ty;
    tx=null;
    if(Math.abs(dx)>50 && Math.abs(dx)>Math.abs(dy)*1.3) go(dx<0?1:-1);
  }, {passive:true});

  /* কীবোর্ড: ← আগের, → পরের, Space বা Enter দিয়ে উল্টানো */
  document.addEventListener('keydown', function(e){
    if(view!=='card') return;
    var tg=e.target;
    if(tg && tg.closest && tg.closest('input,select,textarea')) return;
    if(e.altKey||e.ctrlKey||e.metaKey) return;
    if(e.key==='ArrowRight'){ e.preventDefault(); go(1); }
    else if(e.key==='ArrowLeft'){ e.preventDefault(); go(-1); }
    else if((e.key===' '||e.key==='Enter') && !(tg && tg.closest && tg.closest('button,a'))){ e.preventDefault(); flip(); }
  });

  mini.addEventListener('click', function(e){
    var b=e.target.closest('.sx-tile'); if(!b) return;
    st.i=+b.dataset.p; setView('card');
  });

  /* নিয়ম-ফিল্টার বদলালে কার্ড শুরু থেকে */
  document.querySelectorAll('.secbar').forEach(function(sb){
    sb.addEventListener('click', function(){ st.i=0; applyView(); });
  });

  /* ট্যাব বদলালে (sentence-1.js-এর setTab-এর পরে) ভিউ ঠিক করা */
  var origSetTab = window.setTab;
  window.setTab = function(t){ origSetTab(t); st.i=0; applyView(); };

  applyView();
})();
