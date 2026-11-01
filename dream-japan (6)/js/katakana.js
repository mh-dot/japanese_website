(function(){
  var SEION = [
    ['ア','a','アイス','আইসক্রিম'],['イ','i','イタリア','ইতালি'],['ウ','u','ウイルス','ভাইরাস'],['エ','e','エアコン','এসি'],['オ','o','オレンジ','কমলা'],
    ['カ','ka','カメラ','ক্যামেরা'],['キ','ki','キッチン','রান্নাঘর'],['ク','ku','クラス','ক্লাস'],['ケ','ke','ケーキ','কেক'],['コ','ko','コーヒー','কফি'],
    ['サ','sa','サラダ','সালাদ'],['シ','shi','シーズン','সিজন'],['ス','su','スーパー','সুপারমার্কেট'],['セ','se','セーター','সোয়েটার'],['ソ','so','ソファ','সোফা'],
    ['タ','ta','タクシー','ট্যাক্সি'],['チ','chi','チーズ','পনির'],['ツ','tsu','ツアー','ট্যুর'],['テ','te','テレビ','টেলিভিশন'],['ト','to','トマト','টমেটো'],
    ['ナ','na','ナイフ','ছুরি'],['ニ','ni','ニュース','সংবাদ'],['ヌ','nu','ヌードル','নুডলস'],['ネ','ne','ネクタイ','টাই'],['ノ','no','ノート','খাতা'],
    ['ハ','ha','ハンバーガー','বার্গার'],['ヒ','hi','ヒーター','হিটার'],['フ','fu','フルーツ','ফল'],['ヘ','he','ヘリコプター','হেলিকপ্টার'],['ホ','ho','ホテル','হোটেল'],
    ['マ','ma','マイク','মাইক'],['ミ','mi','ミルク','দুধ'],['ム','mu','ムービー','সিনেমা'],['メ','me','メニュー','মেনু'],['モ','mo','モデル','মডেল'],
    ['ヤ','ya','ヤギ','ছাগল'],['ユ','yu','ユニフォーム','ইউনিফর্ম'],['ヨ','yo','ヨーグルト','দই'],
    ['ラ','ra','ラーメン','রামেন'],['リ','ri','リモコン','রিমোট'],['ル','ru','ルール','নিয়ম'],['レ','re','レモン','লেবু'],['ロ','ro','ロボット','রোবট'],
    ['ワ','wa','ワイン','ওয়াইন'],['ヲ','wo','（কণা: を）','—'],['ン','n','パン','রুটি']
  ];
  var DAKU = [
    ['ガ','ga','ガム','গাম'],['ギ','gi','ギター','গিটার'],['グ','gu','グループ','গ্রুপ'],['ゲ','ge','ゲーム','গেম'],['ゴ','go','ゴリラ','গরিলা'],
    ['ザ','za','ザリガニ','ক্রেফিশ'],['ジ','ji','ジュース','জুস'],['ズ','zu','ズボン','প্যান্ট'],['ゼ','ze','ゼロ','জিরো'],['ゾ','zo','ゾウ','হাতি'],
    ['ダ','da','ダンス','নাচ'],['デ','de','デパート','ডিপার্টমেন্ট স্টোর'],['ド','do','ドア','দরজা'],
    ['バ','ba','バス','বাস'],['ビ','bi','ビール','বিয়ার'],['ブ','bu','ブラシ','ব্রাশ'],['ベ','be','ベッド','বিছানা'],['ボ','bo','ボール','বল'],
    ['パ','pa','パソコン','ল্যাপটপ'],['ピ','pi','ピアノ','পিয়ানো'],['プ','pu','プール','সুইমিং পুল'],['ペ','pe','ペン','কলম'],['ポ','po','ポスト','চিঠির বাক্স']
  ];
  var YOON = [
    ['キャ','kya','キャンプ','ক্যাম্প'],['キュ','kyu','キュー','লাইন/সারি'],['キョ','kyo','キョロキョロ','এদিক-ওদিক তাকানো'],
    ['シャ','sha','シャツ','শার্ট'],['シュ','shu','シュート','শট'],['ショ','sho','ショッピング','কেনাকাটা'],
    ['チャ','cha','チャンス','সুযোগ'],['チュ','chu','チューリップ','টিউলিপ'],['チョ','cho','チョコ','চকলেট'],
    ['ニャ','nya','ニャー','মিয়াও'],['ニュ','nyu','ニュース','সংবাদ'],['ニョ','nyo','ニョッキ','নিওকি'],
    ['ヒャ','hya','ヒャク','একশো'],['ヒュ','hyu','ヒューマン','মানুষ'],['ヒョ','hyo','ヒョウ','চিতাবাঘ'],
    ['ミャ','mya','ミャンマー','মায়ানমার'],['ミュ','myu','ミュージック','সংগীত'],['ミョ','myo','ミョウガ','মিওগা'],
    ['リャ','rya','リャク','সংক্ষেপ'],['リュ','ryu','リュック','ব্যাগ'],['リョ','ryo','リョコウ','ভ্রমণ'],
    ['ギャ','gya','ギャグ','মজা/গ্যাগ'],['ギュ','gyu','ギュウニュウ','গরুর দুধ'],['ギョ','gyo','ギョーザ','গ্যোয়েজা'],
    ['ジャ','ja','ジャケット','জ্যাকেট'],['ジュ','ju','ジュース','জুস'],['ジョ','jo','ジョギング','জগিং'],
    ['ビャ','bya','ビャクヤ','রাতের বেলা (বিরল)'],['ビュ','byu','ビュッフェ','বুফে'],['ビョ','byo','ビョウイン','হাসপাতাল'],
    ['ピャ','pya','ピャッ','ঝটপট'],['ピュ','pyu','ピューレ','পিউরি'],['ピョ','pyo','ピョン','লাফ']
  ];
  var VOW = {a:'া',i:'ি',u:'ু',e:'ে',o:'ো'};
  var VOWALONE = {a:'আ',i:'ই',u:'উ',e:'এ',o:'ও'};
  var CONS = {k:'ক',g:'গ',s:'স',sh:'শ',z:'জ',j:'জ',t:'ট',ch:'চ',ts:'ৎস',d:'দ',n:'ন',h:'হ',f:'ফ',b:'ব',p:'প',m:'ম',r:'র',w:'ওয়'};
  function bn(r){
    if (r === 'n') return 'ন্';
    if (r === 'wo') return 'ও';
    var v = r.slice(-1), c = r.slice(0,-1);
    if (c === '') return VOWALONE[v];
    if (c.slice(-1) === 'y') { return CONS[c.slice(0,-1)] + '্য' + VOW[v]; }
    return CONS[c] + VOW[v];
  }
  var ALL = [];
  SEION.forEach(function(x){ ALL.push({g:x[0], r:x[1], ex:x[2], exbn:x[3], t:'seion', bn:bn(x[1])}); });
  DAKU.forEach(function(x){ ALL.push({g:x[0], r:x[1], ex:x[2], exbn:x[3], t:'daku', bn:bn(x[1])}); });
  YOON.forEach(function(x){ ALL.push({g:x[0], r:x[1], ex:x[2], exbn:x[3], t:'yoon', bn:bn(x[1])}); });
  // fix a few common Bangla sounds by hand
  var FIX = {'shi':'শি','chi':'চি','tsu':'ৎসু','fu':'ফু','ji':'জি','ja':'জ্যা','ju':'জু','jo':'জো','ch':'চ'};
  ALL.forEach(function(x){ if (FIX[x.r]) x.bn = FIX[x.r]; });

  function say(ch){
    try { var u = new SpeechSynthesisUtterance(ch); u.lang = 'ja-JP'; u.rate = 0.8; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch(e) {}
  }

  var grid = document.getElementById('kn-grid');
  var filter = 'all';
  function render(){
    var list = ALL.filter(function(x){ return filter === 'all' || x.t === filter; });
    grid.innerHTML = list.map(function(x){
      return '<article class="kn-card kn-'+x.t+'">' +
        '<button class="kn-glyph" aria-label="'+x.g+' শুনুন" data-g="'+x.g+'">'+x.g+'</button>' +
        '<div class="kn-rom">'+x.r+'</div><div class="kn-bn">'+x.bn+'</div>' +
        '<div class="kn-ex"><b>'+x.ex+'</b> <span>'+x.exbn+'</span></div></article>';
    }).join('');
    grid.querySelectorAll('.kn-glyph').forEach(function(b){
      b.addEventListener('click', function(){ say(b.getAttribute('data-g')); });
    });
    document.getElementById('kn-count').textContent = list.length + 'টি অক্ষর';
  }
  document.querySelectorAll('.vf-chip[data-kf]').forEach(function(b){
    b.addEventListener('click', function(){
      filter = b.getAttribute('data-kf');
      document.querySelectorAll('.vf-chip[data-kf]').forEach(function(x){ x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      render();
    });
  });
  render();

  // quiz
  var qScore = 0, qTotal = 0, cur = null;
  var qGlyph = document.getElementById('kq-glyph'), qOpts = document.getElementById('kq-opts'), qMsg = document.getElementById('kq-msg'), qStat = document.getElementById('kq-stat');
  function shuffle(a){ for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random()*(i+1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function nextQ(){
    var pool = ALL.filter(function(x){ return x.r !== 'wo'; });
    cur = pool[Math.floor(Math.random()*pool.length)];
    var wrong = shuffle(pool.filter(function(x){ return x.r !== cur.r; })).slice(0,3).map(function(x){ return x.r; });
    var opts = shuffle([cur.r].concat(wrong));
    qGlyph.textContent = cur.g;
    qOpts.innerHTML = opts.map(function(o){ return '<button class="vf-chip kq-opt" data-o="'+o+'">'+o+'</button>'; }).join('');
    qMsg.textContent = '';
    qOpts.querySelectorAll('.kq-opt').forEach(function(b){
      b.addEventListener('click', function(){
        if (qMsg.getAttribute('data-done')) return;
        qMsg.setAttribute('data-done','1');
        qTotal++;
        var ok = b.getAttribute('data-o') === cur.r;
        if (ok) qScore++;
        qMsg.textContent = ok ? '✔ সঠিক! ('+cur.g+' = '+cur.r+' · '+cur.bn+')' : '✘ ভুল। সঠিক উত্তর: '+cur.r+' ('+cur.bn+')';
        qMsg.className = 'kq-msg ' + (ok ? 'ok' : 'bad');
        qStat.textContent = 'স্কোর: '+qScore+' / '+qTotal;
        say(cur.g);
      });
    });
    qMsg.removeAttribute('data-done');
  }
  document.getElementById('kq-next').addEventListener('click', function(){ qMsg.removeAttribute('data-done'); nextQ(); });
  document.getElementById('kq-say').addEventListener('click', function(){ if (cur) say(cur.g); });
  nextQ();
})();
