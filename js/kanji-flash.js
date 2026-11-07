/* জোড়া কানজি ফ্ল্যাশকার্ড: Leitner পদ্ধতিতে (বক্সে বক্সে) মুখস্থ করার জন্য */
(function(){
  "use strict";
  var KF=window.KF,$=function(i){return document.getElementById(i)};
  var BX="০১২৩৪৫৬৭৮৯",bn=function(n){return String(n).replace(/\d/g,function(d){return BX[+d]})};
  function ls(k,d){try{var v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}}
  function lset(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
  var conv=(function(){/* কানা → রোমাজি + বাংলা উচ্চারণ */
const ROWS=[['','','あいうえお'],['k','ক','かきくけこ'],['s','স','さしすせそ'],['t','ত','たちつてと'],['n','ন','なにぬねの'],['h','হ','はひふへほ'],['m','ম','まみむめも'],['r','র','らりるれろ'],['g','গ','がぎぐげご'],['z','জ','ざじずぜぞ'],['d','দ','だぢづでど'],['b','ব','ばびぶべぼ'],['p','প','ぱぴぷぺぽ']];
const V='aiueo',BV='আইউএও',BS=['া','ি','ু','ে','ো'],M={},Y={'ゃ':0,'ゅ':2,'ょ':4};
ROWS.forEach(([c,b,s])=>[...s].forEach((k,i)=>M[k]=c?[c+V[i],b+BS[i]]:[V[i],BV[i]]));
Object.assign(M,{し:['shi','শি'],ち:['chi','চি'],つ:['tsu','তসু'],ふ:['fu','ফু'],じ:['ji','জি'],ぢ:['ji','জি'],づ:['zu','জু'],や:['ya','ইয়া'],ゆ:['yu','ইউ'],よ:['yo','ইয়ো'],わ:['wa','ওয়া'],を:['o','ও'],ん:['n','ন']});
const PART={'は':['wa','ওয়া'],'へ':['e','এ'],'を':['o','ও']},PUN={'。':'.','、':',','・':' '};
const hira=c=>{const k=c.charCodeAt(0);return k>=0x30A1&&k<=0x30F6?String.fromCharCode(k-0x60):c};
function conv(txt){
  const R=[],B=[];
  txt.split(' ').forEach(w=>{
    if(PART[w]){R.push(PART[w][0]);B.push(PART[w][1]);return}
    let rr='',bb='',prev=null,sm=false;
    for(let ch of w){
      ch=hira(ch);
      if(ch==='っ'){sm=true;continue}
      if(ch==='ー'){rr+=rr.slice(-1);continue}
      if(PUN[ch]){rr+=PUN[ch];bb+=PUN[ch];continue}
      if(ch in Y&&prev){
        const [r,b]=prev,v=Y[ch],sh=/^(sh|ch|j)/.test(r);
        rr=rr.slice(0,-r.length);bb=bb.slice(0,-b.length);
        const nr=r.slice(0,-1)+(sh?'':'y')+V[v],nb=b.slice(0,-1)+(sh?'':'্য')+BS[v];
        rr+=nr;bb+=nb;prev=[nr,nb];continue}
      const m=M[ch];
      if(!m){rr+=ch;bb+=ch;continue}
      let [r,b]=m;const lv=rr.slice(-1);
      if(r.length===1&&V.includes(r)&&(r===lv||(r==='u'&&lv==='o')||(r==='i'&&lv==='e'))){rr+=r;continue}
      if(sm){r=(r[0]==='c'?'t':r[0])+r;b=b[0]+'্'+b;sm=false}
      rr+=r;bb+=b;prev=[r,b];
    }
    R.push(rr);B.push(bb);
  });
  return [R.join(' '),B.join(' ')];
}

;return conv})();
  var DAY=Math.floor(Date.now()/864e5),IV=[0,1,2,4,8,16],NEWLIM=15;
  var ST=ls("kf_srs",{}),MODE=ls("kf_mode","k2m"),AUTO=ls("kf_auto",true),FURI=ls("g5_furi",true),DECK="today";
  var cards=KF.d.map(function(x,i){return{i:i,w:x[0],r:x[1],m:x[2],s:x[3],say:x[4],tr:x[5]}});
  var Q=[],pos=0,flipped=false,extra=0;
  function st(c){return ST[c.w]||(ST[c.w]={b:0,d:0,x:0})}
  function save(){lset("kf_srs",ST)}
  function say(t){try{if(!("speechSynthesis" in window)||!t)return;speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(t);u.lang="ja-JP";u.rate=.85;speechSynthesis.speak(u)}catch(e){}}
  function newToday(){var o=ls("kf_new",{d:DAY,n:0});return o.d===DAY?o.n:0}
  function bumpNew(){lset("kf_new",{d:DAY,n:newToday()+1})}
  function stats(){
    var n=0,l=0,k=0;cards.forEach(function(c){var b=st(c).b;if(!b)n++;else if(b<4)l++;else k++});
    $("sN").textContent=bn(n);$("sL").textContent=bn(l);$("sK").textContent=bn(k);$("sT").textContent=bn(cards.length);
    $("pfill").style.width=(k/cards.length*100)+"%";
  }
  function shuf(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
  function build(){
    var q=($("kfq").value||"").trim().toLowerCase(),L;
    if(DECK==="today"){
      var due=cards.filter(function(c){var s=st(c);return s.b>0&&s.d<=DAY}),left=Math.max(0,NEWLIM+extra-newToday());
      L=shuf(due).concat(cards.filter(function(c){return !st(c).b}).slice(0,left));
    }else if(DECK==="hard")L=shuf(cards.filter(function(c){var s=st(c);return s.x>0&&s.b<4}));
    else if(DECK==="known")L=shuf(cards.filter(function(c){return st(c).b>=4}));
    else L=cards.slice();
    if(q)L=cards.filter(function(c){return(c.w+c.r+c.m).toLowerCase().indexOf(q)>=0});
    Q=L;pos=0;show();
  }
  function pr(r){var c=conv(r);return esc(c[0])+" · "+esc(c[1])}
  function sb(t){return'<button type="button" class="say" data-say="'+esc(t)+'" aria-label="শুনুন">🔊</button>'}
  function parts(w){return(w.match(/[一-龥々]/g)||[]).map(function(c){return'<span class="kc"><b lang="ja">'+c+"</b>"+esc(KF.k[c]||"")+"</span>"}).join('<i>+</i>')}
  function front(c){
    if(MODE==="m2k")return'<div class="kf-hint">এর কানজি কী?</div><div class="kf-mean">'+esc(c.m)+"</div>";
    if(MODE==="a2k")return'<div class="kf-hint">শুনুন, তারপর কানজি মনে করুন</div><button type="button" class="kf-play say" data-say="'+esc(c.r)+'">🔊</button>';
    return'<div class="kf-big" lang="ja">'+esc(c.w)+'</div><div class="kf-hint">পড়া ও অর্থ মনে করুন</div>';
  }
  function back(c){
    var h='<div class="kf-big'+(MODE==="k2m"?" sm":"")+'" lang="ja">'+esc(c.w)+'</div>';
    h+='<div class="kf-read" lang="ja">'+esc(c.r)+sb(c.r)+'</div><div class="kf-pr">'+pr(c.r)+'</div><div class="kf-mean">'+esc(c.m)+"</div>";
    h+='<div class="kf-parts">'+parts(c.w)+"</div>";
    if(c.s)h+='<div class="kf-sen"><div class="s" lang="ja">'+c.s+sb(c.say)+'</div><div class="sr" lang="ja">'+esc(c.say)+'</div><div class="st">'+esc(c.tr)+"</div></div>";
    return h;
  }
  function show(){
    var c=Q[pos],box=$("kfBox");stats();$("kfCnt").textContent=Q.length?bn(Math.min(pos+1,Q.length))+" / "+bn(Q.length):"";$("kfPrev").disabled=pos<=0;$("kfNext").disabled=pos>=Q.length;
    if(!c){
      var t=DECK==="today"?"🎉 আজকের রিভিউ শেষ!":"এই ডেকে কোনো কার্ড নেই।";
      box.innerHTML='<div class="kf-done"><h2>'+t+'</h2><p>'+(DECK==="today"?"কাল আবার আসুন — যেগুলো কঠিন লেগেছে সেগুলো আগে আসবে।":"অন্য ডেক বা খোঁজা বদলে দেখুন।")+'</p>'+(DECK==="today"?'<button class="btn" id="moreNew" type="button">➕ আরও ১০টি নতুন কার্ড</button>':"")+"</div>";
      $("kfAct").hidden=true;var m=$("moreNew");if(m)m.onclick=function(){extra+=10;build()};return;
    }
    flipped=false;$("kfAct").hidden=false;$("kfGrade").hidden=true;$("kfFlip").hidden=false;
    box.innerHTML='<div class="kf-face" id="kfFace">'+front(c)+"</div>";
    if(MODE==="a2k")say(c.r);
  }
  function flip(){
    var c=Q[pos];if(!c||flipped)return;flipped=true;
    $("kfFace").innerHTML=back(c);$("kfFace").classList.add("back");$("kfFlip").hidden=true;$("kfGrade").hidden=false;
    if(AUTO&&MODE!=="a2k")say(c.r);
  }
  function grade(g){
    var c=Q[pos];if(!c||!flipped)return;var s=st(c),first=!s.b;
    if(g==="again"){s.b=1;s.d=DAY;s.x++;var cp=Q.splice(pos,1)[0];Q.splice(Math.min(pos+4,Q.length),0,cp);}
    else{ if(g==="hard"){s.b=Math.max(1,s.b);s.d=DAY+Math.max(1,IV[s.b]>>1||1);if(first){s.b=1}}
      else{s.b=Math.min(5,s.b+1);s.d=DAY+IV[s.b]}
      if(first&&DECK==="today")bumpNew();pos++}
    if(g==="again"&&first&&DECK==="today")bumpNew();
    save();show();
  }
  function setMode(m){MODE=m;lset("kf_mode",m);[].forEach.call(document.querySelectorAll("[data-m]"),function(b){b.setAttribute("aria-pressed",b.getAttribute("data-m")===m?"true":"false")});if(Q.length)show()}
  function setDeck(d){DECK=d;[].forEach.call(document.querySelectorAll("[data-deck]"),function(b){b.setAttribute("aria-selected",b.getAttribute("data-deck")===d?"true":"false")});$("kfDeck").value=d;build()}
  document.addEventListener("click",function(e){
    var b=e.target.closest&&e.target.closest(".say");if(b){say(b.getAttribute("data-say"));return}
    var m=e.target.closest&&e.target.closest("[data-m]");if(m)return setMode(m.getAttribute("data-m"));
    var d=e.target.closest&&e.target.closest("[data-deck]");if(d)return setDeck(d.getAttribute("data-deck"));
    var f=e.target.closest&&e.target.closest("[data-f]");if(f){FURI=f.getAttribute("data-f")==="1";lset("g5_furi",FURI);af()}
  });
  function af(){document.body.classList.toggle("nofuri",!FURI);[].forEach.call(document.querySelectorAll("[data-f]"),function(b){b.setAttribute("aria-pressed",(b.getAttribute("data-f")==="1")===FURI?"true":"false")})}
  function go(d){if(!Q.length)return;pos=Math.max(0,Math.min(Q.length,pos+d));show()}
  $("kfPrev").onclick=function(){go(-1)};$("kfNext").onclick=function(){go(1)};
  $("kfFlip").onclick=flip;$("kfBox").addEventListener("click",function(e){if(!e.target.closest("button"))flip()});
  [].forEach.call(document.querySelectorAll("[data-g]"),function(b){b.onclick=function(){grade(b.getAttribute("data-g"))}});
  $("kfDeck").onchange=function(){setDeck(this.value)};$("kfq").oninput=build;
  $("kfAuto").checked=AUTO;$("kfAuto").onchange=function(){AUTO=this.checked;lset("kf_auto",AUTO)};
  $("kfReset").onclick=function(){if(confirm("সব অগ্রগতি মুছে ফেলবেন?")){ST={};save();lset("kf_new",{d:DAY,n:0});extra=0;build()}};
  document.addEventListener("keydown",function(e){
    if(/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName))return;
    if(e.key==="ArrowRight"){go(1);return}if(e.key==="ArrowLeft"){go(-1);return}
    if(e.key===" "||e.key==="Enter"){if(!flipped){e.preventDefault();flip()}}
    else if(flipped&&e.key==="1")grade("again");else if(flipped&&e.key==="2")grade("hard");else if(flipped&&e.key==="3")grade("good");
  });
  af();setMode(MODE);setDeck("today");
})();
