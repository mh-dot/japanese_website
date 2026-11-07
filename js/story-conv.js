/* extracted from grammar-1.js */
(function(){
/* কানা → রোমাজি + বাংলা উচ্চারণ */
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


window.DJ_CONV=conv;
})();
