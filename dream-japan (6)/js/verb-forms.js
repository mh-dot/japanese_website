(function(){
  var I_MAP={'う':'い','く':'き','ぐ':'ぎ','す':'し','つ':'ち','ぬ':'に','ぶ':'び','む':'み','る':'り'};
  var A_MAP={'う':'わ','く':'か','ぐ':'が','す':'さ','つ':'た','ぬ':'な','ぶ':'ば','む':'ま','る':'ら'};
  var TA_MAP={'う':'った','つ':'った','る':'った','ぬ':'んだ','ぶ':'んだ','む':'んだ','く':'いた','ぐ':'いだ','す':'した'};
  var TE_MAP={'う':'って','つ':'って','る':'って','ぬ':'んで','ぶ':'んで','む':'んで','く':'いて','ぐ':'いで','す':'して'};

  var VERBS=[
    {k:'書く',r:'かく',g:1,bn:'লেখা'},{k:'聞く',r:'きく',g:1,bn:'শোনা / জিজ্ঞাসা'},
    {k:'行く',r:'いく',g:1,bn:'যাওয়া'},{k:'泳ぐ',r:'およぐ',g:1,bn:'সাঁতার কাটা'},
    {k:'話す',r:'はなす',g:1,bn:'কথা বলা'},{k:'待つ',r:'まつ',g:1,bn:'অপেক্ষা করা'},
    {k:'持つ',r:'もつ',g:1,bn:'ধরা / সাথে রাখা'},{k:'買う',r:'かう',g:1,bn:'কেনা'},
    {k:'会う',r:'あう',g:1,bn:'দেখা করা'},{k:'作る',r:'つくる',g:1,bn:'বানানো'},
    {k:'撮る',r:'とる',g:1,bn:'ছবি তোলা'},{k:'遊ぶ',r:'あそぶ',g:1,bn:'খেলা করা'},
    {k:'読む',r:'よむ',g:1,bn:'পড়া'},{k:'死ぬ',r:'しぬ',g:1,bn:'মরা'},
    {k:'飲む',r:'のむ',g:1,bn:'পান করা'},{k:'呼ぶ',r:'よぶ',g:1,bn:'ডাকা'},
    {k:'歩く',r:'あるく',g:1,bn:'হাঁটা'},{k:'乗る',r:'のる',g:1,bn:'চড়া'},
    {k:'使う',r:'つかう',g:1,bn:'ব্যবহার করা'},{k:'手伝う',r:'てつだう',g:1,bn:'সাহায্য করা'},
    {k:'帰る',r:'かえる',g:1,bn:'ফেরা'},{k:'入る',r:'はいる',g:1,bn:'ঢোকা'},
    {k:'切る',r:'きる',g:1,bn:'কাটা'},{k:'走る',r:'はしる',g:1,bn:'দৌড়ানো'},
    {k:'知る',r:'しる',g:1,bn:'জানা'},
    {k:'食べる',r:'たべる',g:2,bn:'খাওয়া'},{k:'見る',r:'みる',g:2,bn:'দেখা'},
    {k:'起きる',r:'おきる',g:2,bn:'ঘুম থেকে ওঠা'},{k:'寝る',r:'ねる',g:2,bn:'ঘুমানো'},
    {k:'教える',r:'おしえる',g:2,bn:'শেখানো'},{k:'開ける',r:'あける',g:2,bn:'খোলা'},
    {k:'閉める',r:'しめる',g:2,bn:'বন্ধ করা'},{k:'出かける',r:'でかける',g:2,bn:'বের হওয়া'},
    {k:'着る',r:'きる',g:2,bn:'পরা'},{k:'出る',r:'でる',g:2,bn:'বের হওয়া / বের হয়ে যাওয়া'},
    {k:'忘れる',r:'わすれる',g:2,bn:'ভুলে যাওয়া'},{k:'借りる',r:'かりる',g:2,bn:'ধার নেওয়া'},
    {k:'始める',r:'はじめる',g:2,bn:'শুরু করা'},
    {k:'する',r:'する',g:3,bn:'করা',forms:{
      P:{now:['します','します'],neg:['しません','しません'],past:['しました','しました'],pastneg:['しませんでした','しませんでした']},
      N:{now:['する','する'],neg:['しない','しない'],past:['した','した'],pastneg:['しなかった','しなかった'],te:['して','して']}}},
    {k:'来る',r:'くる',g:3,bn:'আসা',forms:{
      P:{now:['来ます','きます'],neg:['来ません','きません'],past:['来ました','きました'],pastneg:['来ませんでした','きませんでした']},
      N:{now:['来る','くる'],neg:['来ない','こない'],past:['来た','きた'],pastneg:['来なかった','こなかった'],te:['来て','きて']}}}
  ];

  var IADJ=[
    {k:'高い',r:'たかい',bn:'উঁচু / দামি'},{k:'安い',r:'やすい',bn:'সস্তা'},
    {k:'大きい',r:'おおきい',bn:'বড়'},{k:'小さい',r:'ちいさい',bn:'ছোট'},
    {k:'新しい',r:'あたらしい',bn:'নতুন'},{k:'古い',r:'ふるい',bn:'পুরনো'},
    {k:'暑い',r:'あつい',bn:'গরম (আবহাওয়া)'},{k:'寒い',r:'さむい',bn:'ঠান্ডা'},
    {k:'多い',r:'おおい',bn:'বেশি'},{k:'少ない',r:'すくない',bn:'কম'},
    {k:'面白い',r:'おもしろい',bn:'মজার'},{k:'忙しい',r:'いそがしい',bn:'ব্যস্ত'},
    {k:'楽しい',r:'たのしい',bn:'আনন্দদায়ক'},{k:'美味しい',r:'おいしい',bn:'সুস্বাদু'},
    {k:'良い',r:'いい',bn:'ভালো'},{k:'難しい',r:'むずかしい',bn:'কঠিন'},
    {k:'易しい',r:'やさしい',bn:'সহজ'},{k:'早い',r:'はやい',bn:'তাড়াতাড়ি'},
    {k:'遅い',r:'おそい',bn:'দেরি'},{k:'近い',r:'ちかい',bn:'কাছে'},
    {k:'遠い',r:'とおい',bn:'দূরে'},{k:'明るい',r:'あかるい',bn:'উজ্জ্বল'},
    {k:'暗い',r:'くらい',bn:'অন্ধকার'},{k:'白い',r:'しろい',bn:'সাদা'},
    {k:'赤い',r:'あかい',bn:'লাল'},{k:'悪い',r:'わるい',bn:'খারাপ'}
  ];

  var NAADJ=[
    {k:'静か',r:'しずか',bn:'শান্ত'},{k:'元気',r:'げんき',bn:'সুস্থ / প্রাণবন্ত'},
    {k:'好き',r:'すき',bn:'পছন্দ'},{k:'嫌い',r:'きらい',bn:'অপছন্দ'},
    {k:'綺麗',r:'きれい',bn:'সুন্দর / পরিষ্কার'},{k:'便利',r:'べんり',bn:'সুবিধাজনক'},
    {k:'有名',r:'ゆうめい',bn:'বিখ্যাত'},{k:'親切',r:'しんせつ',bn:'সদয়'},
    {k:'上手',r:'じょうず',bn:'দক্ষ'},{k:'下手',r:'へた',bn:'অদক্ষ'},
    {k:'大切',r:'たいせつ',bn:'গুরুত্বপূর্ণ'},{k:'簡単',r:'かんたん',bn:'সহজ'},
    {k:'丈夫',r:'じょうぶ',bn:'মজবুত / সুস্থ'},{k:'賑やか',r:'にぎやか',bn:'প্রাণবন্ত / জমজমাট'},
    {k:'暇',r:'ひま',bn:'অবসর'},{k:'必要',r:'ひつよう',bn:'প্রয়োজনীয়'}
  ];

  function verbForms(v){
    if (v.forms) return v.forms;
    var ks = v.k.slice(0,-1), rs = v.r.slice(0,-1), end = v.r.slice(-1);
    var P = {}, N = {};
    if (v.g === 1) {
      var ii = I_MAP[end], ai = A_MAP[end];
      var ta = TA_MAP[end], te = TE_MAP[end];
      if (v.r === 'いく') { ta = 'った'; te = 'って'; }
      P.now = [ks+ii+'ます', rs+ii+'ます'];
      P.neg = [ks+ii+'ません', rs+ii+'ません'];
      P.past = [ks+ii+'ました', rs+ii+'ました'];
      P.pastneg = [ks+ii+'ませんでした', rs+ii+'ませんでした'];
      N.now = [v.k, v.r];
      N.neg = [ks+ai+'ない', rs+ai+'ない'];
      N.past = [ks+ta, rs+ta];
      N.pastneg = [ks+ai+'なかった', rs+ai+'なかった'];
      N.te = [ks+te, rs+te];
    } else {
      P.now = [ks+'ます', rs+'ます'];
      P.neg = [ks+'ません', rs+'ません'];
      P.past = [ks+'ました', rs+'ました'];
      P.pastneg = [ks+'ませんでした', rs+'ませんでした'];
      N.now = [v.k, v.r];
      N.neg = [ks+'ない', rs+'ない'];
      N.past = [ks+'た', rs+'た'];
      N.pastneg = [ks+'なかった', rs+'なかった'];
      N.te = [ks+'て', rs+'て'];
    }
    return {P:P, N:N};
  }

  function iAdjForms(a){
    var ks = a.k === '良い' ? '良' : a.k.slice(0,-1);
    var rs = a.r === 'いい' ? 'よ' : a.r.slice(0,-1);
    var N = {now:[a.k,a.r], neg:[ks+'くない',rs+'くない'], past:[ks+'かった',rs+'かった'], pastneg:[ks+'くなかった',rs+'くなかった']};
    var P = {now:[a.k+'です',a.r+'です'], neg:[ks+'くないです',rs+'くないです'], past:[ks+'かったです',rs+'かったです'], pastneg:[ks+'くなかったです',rs+'くなかったです']};
    return {P:P, N:N};
  }

  function naAdjForms(a){
    var N = {now:[a.k+'だ',a.r+'だ'], neg:[a.k+'じゃない',a.r+'じゃない'], past:[a.k+'だった',a.r+'だった'], pastneg:[a.k+'じゃなかった',a.r+'じゃなかった']};
    var P = {now:[a.k+'です',a.r+'です'], neg:[a.k+'じゃないです',a.r+'じゃないです'], past:[a.k+'でした',a.r+'でした'], pastneg:[a.k+'じゃありませんでした',a.r+'じゃありませんでした']};
    return {P:P, N:N};
  }

  function cell(pair){
    if (!pair) return '<span class="dash">—</span>';
    var k = pair[0], r = pair[1];
    return '<span class="f"><b>'+k+'</b>'+(k!==r?'<small>'+r+'</small>':'')+'</span>';
  }

  var ROWS=[['now','বর্তমান · হ্যাঁ'],['neg','বর্তমান · না'],['past','অতীত · হ্যাঁ'],['pastneg','অতীত · না'],['te','তে-রূপ']];
  var BADGE={1:'গ্রুপ ১',2:'গ্রুপ ২',3:'গ্রুপ ৩',i:'い-বিশেষণ',na:'な-বিশেষণ'};

  function card(item, type, forms){
    var hasTe = type === 'v';
    var rows = ROWS.filter(function(x){ return hasTe || x[0] !== 'te'; });
    var html = '<article class="vf-card" data-type="'+(type==='v'?'g'+item.g:type)+'" data-search="'+(item.k+' '+item.r+' '+item.bn).toLowerCase()+'">';
    html += '<div class="vf-h"><div><div class="vf-k">'+item.k+'</div>'+(item.k!==item.r?'<div class="vf-r">'+item.r+'</div>':'')+'</div>';
    html += '<div><span class="vf-badge">'+BADGE[type==='v'?item.g:type]+'</span><div class="vf-m">'+item.bn+'</div></div></div>';
    html += '<table class="vf-t"><thead><tr><th></th><th>ভদ্র (ます / です)</th><th>সাধারণ (Plain)</th></tr></thead><tbody>';
    rows.forEach(function(row){
      var key = row[0];
      var p = forms.P[key] || null;
      var n = forms.N[key] || null;
      html += '<tr><td class="lab">'+row[1]+'</td>';
      html += '<td>'+(key==='te' ? '<span class="dash">—</span>' : cell(p))+'</td>';
      html += '<td>'+cell(n)+'</td></tr>';
    });
    html += '</tbody></table></article>';
    return html;
  }

  var grid = document.getElementById('vf-grid');
  var cards = [];
  VERBS.forEach(function(v){ cards.push(card(v,'v',verbForms(v))); });
  IADJ.forEach(function(a){ cards.push(card(a,'i',iAdjForms(a))); });
  NAADJ.forEach(function(a){ cards.push(card(a,'na',naAdjForms(a))); });
  grid.innerHTML = cards.join('');

  var filter = 'all', q = '';
  var buttons = document.querySelectorAll('.vf-chip');
  var count = document.getElementById('vf-count');
  var search = document.getElementById('vf-search');
  function apply(){
    var shown = 0;
    document.querySelectorAll('.vf-card').forEach(function(c){
      var t = c.getAttribute('data-type');
      var okType = filter === 'all' || t === filter;
      var okQ = !q || c.getAttribute('data-search').indexOf(q) !== -1;
      var on = okType && okQ;
      c.hidden = !on;
      if (on) shown++;
    });
    count.textContent = shown + 'টি দেখানো হচ্ছে';
  }
  buttons.forEach(function(b){
    b.addEventListener('click', function(){
      filter = b.getAttribute('data-f');
      buttons.forEach(function(x){ x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      apply();
    });
  });
  search.addEventListener('input', function(){ q = search.value.trim().toLowerCase(); apply(); });
  apply();
})();
