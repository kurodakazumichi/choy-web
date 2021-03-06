/*******************************************************************************
* iframeクラス
*******************************************************************************/
class cIFrame
{
  /*
  * コンストラクタ
  * param id: iframe要素のidを指定すること。
  */
  constructor(id, mode)
  {
    var me = this;

    this.id = id;
    this.mode = mode;
    this.items = this.createItems();
    this.setMode(mode);

    this.tmp = {}; // 一時保存領域、iframeのonload時に参照する。

    // iframeの読み込みが完了してからコードを挿入する。
    this.obj.on('load', function(){
      me.html = (me.tmp.html)? me.tmp.html : "";
      me.css  = (me.tmp.css)? me.tmp.css : "";
      me.js   = (me.tmp.js)? me.tmp.js : "";
    });
  }

  /**
  * iframe要素を返す
  */
  get obj(){
    return $(this.id);
  }

  /**
  *
  */
  get doc(){
    return this.obj[0].contentWindow.document;
  }

  /*
  * iframeのhead要素(jquery object)を返す。
  */
  get head() {
    return $('head', this.doc);
  }

  /*
  * iframeのbody要素(jquery object)を返す。
  */
  get body() {
    return $('body', this.doc);
  }

  /**
  * iframeをリロードする
  */
  reload(){
    this.doc.location.reload(true);
    this.setMode(this.mode);
  }

  /*
  * body要素の中身(html)を書き換える。
  */
  set html(text){
    this.body.html(text);
  }

  /*
  * 指定されてcssを適用する。
  */
  set css(text)
  {
    this.head.find('#style').remove();
    $('<style>').attr({id:'style'}).html(text).appendTo(this.head);
  }

  /**
  * 指定されたscriptを適用する。(scriptが実行される)
  */
  set js(text)
  {
    this.body.find('#script').remove();
    $('<script>').attr({id:'script'}).html(text).appendTo(this.body);
  }

  /**
  * 初期化
  * param data: html,css,jsを含んだJSON
  */
  init(data)
  {
    data = (!data)? {} : data;
    this.tmp = data;
    this.reload();
    // this.html = (data.html)? data.html : "";
    // this.css  = (data.css)? data.css : "";
    // this.js   = (data.js)? data.js : "";
  }

  createItems()
  {
    return {
      jQuery : this.script('https://code.jquery.com/jquery-3.2.1.min.js'),
      ace    : this.script('https://cdnjs.cloudflare.com/ajax/libs/ace/1.2.0/ace.js'),
      pixi   : this.script('https://cdnjs.cloudflare.com/ajax/libs/pixi.js/4.7.0/pixi.min.js'),
      three  : this.script('https://cdnjs.cloudflare.com/ajax/libs/three.js/90/three.min.js')
    };
  }

  /** jQuery package */
  get pack_jQuery(){
    return this.items.jQuery;
  }

  /** Ace package */
  get pack_ace(){
    return this.items.jQuery + this.items.ace;
  }

  /** Pixi package */
  get pack_pixi(){
    return this.items.pixi;
  }

  /** Three package */
  get pack_three(){
    return this.items.three;
  }

  /**
  * modeに対応したパッケージを取得する。(読み込むjavascriptのscriptタグリスト)
  */
  getPackage(mode)
  {
    var packName = 'pack_' + mode;
    return (this[packName])? this[packName] : "";
  }

  /**
  * iframeのモードを設定する。(使えるjavascript libraryが変化する)
  */
  setMode(mode)
  {
    var pack = this.getPackage(mode);

    if(!pack) return;

    // iframeの内容を書き換える。
    var html = '<head>' + pack + '</head>';
    this.doc.open();
    this.doc.write(html);
    this.doc.close();
  }

  /**
  * scriptタグ文字列を生成
  */
  script(src){
    return '<script src="' + src + '"></script>';
  }
}

/*******************************************************************************
* Editorsクラス
*******************************************************************************/
class cEditors
{
  /*
  * コンストラクタ
  */
  constructor(){
    this.e = {};
    this.status;
  }

  /**
  * 初期化、html,css,jsの3つのエディターを作成する。
  */
  init(id)
  {
    this.e.h = this.create(id.html, "html");
    this.e.c = this.create(id.css , "css");
    this.e.j = this.create(id.js  , "javascript");
    this.status  = $('#editors-status');
  }

  /**
  * エディターを生成。
  * param id: エディタ可する要素のID
  * param mode: エディタのモード(html,css,javascriptなど)
  */
  create(id, mode)
  {
    var e = ace.edit(id);
    e.getSession().setMode('ace/mode/'+mode);
    e.getSession().setTabSize(2);
    e.$blockScrolling = Infinity;
    return e;
  }

  /**
  * 指定したエディタにfocusする。
  * param type: エディタのタイプ(h=html,c=css,j=js)
  */
  focus(type){
    (this.e[type]) && this.e[type].focus();
  }

  /**
  * リセット
  * param data: 指定したデータでエディタの内容をリセットする
  */
  reset(data)
  {
    data = (!data)? {} : data;
    this.html = data.html? data.html : "";
    this.css  = data.css? data.css : "";
    this.js   = data.js? data.js : "";
  }

  /**
  * リードオンリー状態を設定。
  */
  set readonly(enable)
  {
    var c = "readonly";

    // 全エディターに適用
    $.each(this.e, function(key, e){
      e.setReadOnly(enable);
      (enable)? e.setStyle(c) : e.unsetStyle(c);
    });

    (enable)? this.status.addClass(c) : this.status.removeClass(c);
  }

  // HTMLエディタの内容へのアクセッサ
  set html(text){
    this.e.h.setValue(text);
  }
  get html() {
    return this.e.h.getValue();
  }

  // CSSエディタの内容へのアクセッサ
  set css(text){
    this.e.c.setValue(text);
  }
  get css(){
    return this.e.c.getValue();
  }

  // JSエディタの内容へのアクセッサ
  set js(text){
    this.e.j.setValue(text);
  }
  get js(){
    return this.e.j.getValue();
  }

  // HTML,CSS,JSの各エディターのゲッター
  get h(){
    return this.e.h;
  }
  get c(){
    return this.e.c;
  }
  get j(){
    return this.e.j;
  }

  /**
  * リフレッシュ(内容が更新されないことがあるので強制的に更新する)
  */
  refresh(type){
    if(!this.e[type]) return;
    this.e[type].setValue(this.e[type].getValue());
  }

  /**
  * 全てのエディタデータを取得
  */
  get data(){
    return {
      html:this.html,
      css :this.css,
      js  :this.js
    };
  }
}

/*******************************************************************************
* Dataクラス
* 1.設問やエディタの内容を永続的に保持する。
*******************************************************************************/
class cData
{
  /**
  * コンストラクタ
  */
  constructor()
  {
    // データのロック状態
    this.isLock = false;

    // 設問に含まれるパラメータリスト
    this.QuestionParams = ['title', 'desc', 'html', 'css', 'js', 'ref', 'mode'];
  }

  /**
  * データをロックする。
  */
  lock(){
    this.isLock = true;
  }

  /**
  * データをアンロックする。
  */
  unlock(){
    this.isLock = false;
  }

  /**
  * SessionStorageに保存する。
  */
  set(k, v)
  {
    if(this.isLock) return;
    sessionStorage.setItem(k, (v === undefined)? "" : v);
  }

  /**
  * SessionStorageから取得する。
  */
  get(k)
  {
    var item = sessionStorage.getItem(k);
    return (!item)? "" : item;
  }

  /**
  * 情報をクリアする。
  */
  clear(){
    sessionStorage.clear();
  }

  /**
  * 設問ファイルをロード。
  */
  loadQuestion(f)
  {
    this.clear();

    var text = f.split(/\r\n|\r|\n/);
    var data = {};
    var section = null;
    $.each(text, function(i, line){

      if(line.indexOf(':') === 0) {
        section = line.slice(1);
        return;
      }

      if(!data[section]) data[section] = "";

      if(data[section] === ""){
        data[section] += line;
      } else {
        data[section] += '\n' + line;
      }
    });

    this.Q = data;
    return this.Q;
  }

  /**
  * 設問データを保存する。
  */
  set Q(data)
  {
    $.each(this.QuestionParams, function(i, val){
      this.set('question.' + val, data[val]);
    }.bind(this));
  }

  /**
  * 設問データを取得する。
  */
  get Q()
  {
    var data = {};
    $.each(this.QuestionParams, function(i, val){
      data[val] = this.get('question.' + val);
    }.bind(this));

    // 整形
    data.title = data.title.replace(/\r?\n/g,"");
    data.mode  = data.mode.replace(/\r?\n/g,"");

    return data;
  }

  /**
  * 保存したエディターデータを取得する。
  */
  get E()
  {
    var data = {};

    $.each(this.QuestionParams, function(i, val){
      data[val] = this[val];
    }.bind(this));

    return data;
  }

  /**
  * HTMLエディタの内容を保存、取得するアクセッサ
  */
  set html(text){
    this.set('html', text);
  }
  get html(){
    return this.get('html');
  }

  /**
  * CSSエディタの内容を保存、取得するアクセッサ
  */
  set css(text){
    this.set('css', text);
  }
  get css(){
    return this.get('css');
  }

  /**
  * JSエディタの内容を保存、取得するアクセッサ
  */
  set js(text){
    this.set('js', text);
  }
  get js(){
    return this.get('js');
  }

  /**
  * titleの内容を保存、取得するアクセッサ。(for Admin)
  */
  set title(text){
    this.set('title', text);
  }
  get title(){
    return this.get('title');
  }

  /**
  * descriptionの内容を保存、取得するアクセッサ(for Admin)
  */
  set desc(text){
    this.set('desc', text);
  }
  get desc(){
    return this.get('desc');
  }

  /**
  * referenceの内容を保存、取得するアクセッサ。(for Admin)
  */
  set ref(text){
    this.set('ref', text);
  }
  get ref(){
    return this.get('ref');
  }

  /**
  * d1とd2を結合し、データがある方を優先する。d1、d2どちらもデータがある場合はd1を優先する。
  */
  concat(d1, d2)
  {
    var ret = {};

    $.each(this.QuestionParams, function(i, val)
    {
      ret[val] = (d1[val])? d1[val] : d2[val]
    });

    return ret;
  }

  /** アクティブなタブの番号 */
  getTab(type){
    return this.get('tabs.' + type);
  }

  setTab(type, no){
    this.set('tabs.' + type, no);
  }

}

/*******************************************************************************
* Appクラス
*******************************************************************************/
class cApp
{
  /**
  * コンストラクタ
  */
  constructor()
  {
    // URLパラメータを解析
    var p = this.parseUrlParams();

    this.params  = p;
    this.tabs    = {};
    this.data    = new cData();
    this.editors = new cEditors();
    this.answers = new cEditors();
    this.preview = new cIFrame('#preview', p.mode);
    this.answer  = new cIFrame('#answer', p.mode);
    this.title   = $('#title');
    this.desc    = $('#description');
    this.ref     = $('#reference-text');

    this.isAdmin = p.admin;
    this.admin   = {};
  }

  /**
  * 初期化(各種オブジェクトの初期化やイベントの設定を行う。)
  */
  init()
  {
    var me = this;

    this.initAdmin();
    this.initTab();     // ※Editor生成より前にTab処理を済ませないとおかしくなる。
    this.initEditors();
    this.initAnswers();
    this.initLoader();
    this.initMixed();

    // 設問やエディタの状態を整える。(sessionデータがあればそこから復元される)
    this.setQuestion(this.data);

    this.editors.focus('h');
  }

  /**
  * 管理者モードの場合のみ行う初期化処理。
  * 管理者モードでは、このページで読み込むための問題ファイルの作成が行える。
  * そのための入力フォーム(タイトルや概要、説明)および出力ボタンなどを生成する。
  */
  initAdmin()
  {
    // 管理者モードじゃない時は何も処理をしない。
    if(!this.isAdmin) return;

    // 自身のエイリアス
    var me = this;

    // 管理者モードの場合は背景色を変える
    $('#menubar').css('background', '#f34');

    // 管理者モードのみの入力項目を取得
    this.admin = {
      title: $('input[name=title]'),
      desc : $('textarea[name=description]'),
      ref  : $('textarea[name=reference]')
    };

    // 管理者要素を可視化
    $('.admin').show();

    // sessionデータがあれば入力値を復元。
    this.admin.title.val(this.data.title);
    this.admin.desc.val(this.data.desc);
    this.admin.ref.val(this.data.ref);

    /********** ここから下はイベントの設定　**********/

    // keyup: タイトルの内容を反映しつつ、storageに保存。
    this.admin.title.on('keyup', function(){
      var v = $(this).val();
      me.setTitle(v);
      me.data.title = v;
    });

    // keyup: 概要の内容を反映しつつ、storageに保存。
    this.admin.desc.on('keyup', function(){
      var v = $(this).val();
      me.setDesc(v);
      me.data.desc = v;
    });

    // keyup: 解説の内容を反映しつつ、storageに保存。
    this.admin.ref.on('keyup', function(){
      var v = $(this).val();
      me.setRefer(v);
      me.data.ref = v;
    });

    // click: 入力内容をまとめて問題テキストファイルを生成、ダウンロードさせる。
    $('#download').on('click', function()
    {
      var data = "";
      var br   = '\n';

      // titleを追加
      data += ":title" + br;
      data += me.admin.title.val() + br;

      // desc
      data += ":desc" + br;
      data += me.admin.desc.val() + br;

      // HTML
      data += ":html" + br;
      data += me.editors.html + br;

      // css
      data += ":css" + br;
      data += me.editors.css + br;

      // js
      data += ":js" + br;
      data += me.editors.js + br;

      // reference
      data += ":ref" + br;
      data += me.admin.ref.val() + br;

      // mode
      data += ":mode" + br;
      data += me.params.mode;

      // href要素にオブジェクトURLを指定することでダウンロードさせられる。
      var blob = new Blob([data], { "type" : "text/plain" });
      $(this).attr({
        href     :window.URL.createObjectURL(blob),
        download :"question.md"
      });

    });
  }

  /**
  * タブ要素の初期化(タブ化とイベントの設定)
  */
  initTab()
  {
    this.tabs.editor = $("#editors").tabs({active:this.data.getTab('editor')});
    this.tabs.answer = $('#answers').tabs({active:this.data.getTab('answer')});
    this.tabs.iframe = $('#views').tabs({active:this.data.getTab('iframe')});

    this.tabs.editor.tabs({
      activate:this.onActivateTabs.bind(this)
    });

    this.tabs.answer.tabs({
      activate:function(e, ui){
        var active = $(e.target).tabs( "option", "active" );
        this.data.setTab('answer', active);
      }.bind(this)
    });

    this.tabs.iframe.tabs({
      activate:function(e, ui){
        var active = $(e.target).tabs( "option", "active" );
        this.data.setTab('iframe', active);
      }.bind(this)
    });
  }

  /**
  * タブがアクティブになった時の処理
  */
  onActivateTabs(e, ui)
  {
    // アクティブになったタブに含まれるエディターにfocusする。
    var id = '#' + ui.newPanel[0].id;

    var type = $(id).data('type');
    this.editors.refresh(type);
    this.editors.focus(type);

    // activeになったTabの番号を保存

    var active = $(e.target).tabs( "option", "active" );
    this.data.setTab('editor', active);
  }

  /**
  * エディタの初期化(エディター化とイベントの設定)
  */
  initEditors()
  {
    this.editors.init({html:"html-editor", css:"css-editor", js:"js-editor"});
    this.addEventEditors();
  }

  /**
  * エディターのイベントを設定。
  */
  addEventEditors()
  {
    var me = this;

    // エディタに変更があった際に、リアルタイムに反映しつつ、storageへ内容を保存する。
    this.editors.h.on('change',function(){
      me.preview.html = me.data.html = me.editors.html;
    });

    this.editors.c.on('change', function(){
      me.preview.css = me.data.css = me.editors.css;
    });

    // javascriptはpreviewに即時反映しない。(入力中では構文エラーが多発するため)
    this.editors.j.on('change', function(){
      me.data.js = me.editors.js;
    });
  }

  /**
  * Answersの初期化
  */
  initAnswers()
  {
    this.answers.init({html:"html-answer", css:"css-answer", js:"js-answer"});
    this.answers.readonly = true;
  }

  /**
  * ローダーの初期化
  */
  initLoader()
  {
    var me = this;

    // 共通処理(common func)
    var cfn = function(e, ui) {
      e.stopPropagation();
      e.preventDefault();
      (ui) && $(ui).toggleClass('active');
    };

    // ドラッグ＆ドロップで問題を読み込めるようにイベントを設定。
    var loader = $('#loader')
      .on('dragenter', function(e){ cfn(e, this); })
      .on('dragleave', function(e){ cfn(e, this); })
      .on('dragover' , function(e){ cfn(e, null); })
      .on('drop'     , function(e){ cfn(e, this); me.loadfile(e, "drop"); });

    // ファイル選択フォーム
    var file = $('#file').on('change', function(e){ me.loadfile(e, "input"); });
  }

  /**
  * 問題ファイルのロード処理
  */
  loadfile(e, action)
  {
    var me = this;

    // ファイルを取得
    var f;

    switch(action){
      case 'drop' : f = e.originalEvent.dataTransfer.files[0]; break;
      case 'input': f = e.target.files[0]; break;
    }

    // ファイルロード
    var reader = new FileReader();

    reader.onload = function(e)
    {
      var data = me.data.loadQuestion(e.target.result);
      location.href = me.toUrl(data);
    };

    reader.readAsText(f);
  }

  /**
  * 設問データを表示するのに適したURLに変換
  */
  toUrl(data)
  {
    // パラメータなしのURLを取得
    var idx = location.href.indexOf('?');
    var url = location.href;
    url = (idx < 0)? url : url.substr(0, idx);

    // URLパラメータを作成
    var query = [];
    if(this.isAdmin)　  query.push("admin");
    if(data.mode != "") query.push("mode=" + data.mode);
    query = query.join('&');

    // URLの返却
    url = (query)? url + "?" + query : url;
    return url;
  }

  /**
  * その他、雑多な要素の初期化
  */
  initMixed()
  {
    var me = this;

    // 答えを見る機能の設定
    this.addEventChangeEditorMode();

    // Answerの表示モード変更機能の設定
    this.addEventChangeAnswerMode();

    // リフレッシュ機能の設定
    $('#refresh').on('click', this.refresh.bind(this));

    // JS実行機能の設定
    $('#apply-js').on('click', function(){
      location.reload();
    });

    // 解説のアコーディオン機能設定
    $('#reference h2').on('click', function(){
      $('#reference div').slideToggle();
      $('#reference h2').toggleClass('close');
    });
  }

  /**
  * 答えを見る機能の設定。
  */
  addEventChangeEditorMode()
  {
    var me = this;

    // 答えを見る機能の実装
    $("#change-editor-mode").on('click', function(){

      $('#answers').toggle();

      if($(this).data('mode') == "answer") {
        $(this).data('mode', '').text('Show Answer.');
      } else {
        $(this).data('mode', 'answer').text('Hide Answer.');
      }

    });
  }

  /**
  * Answerの表示切り替え機能の設定。
  */
  addEventChangeAnswerMode()
  {
    var me = this;
    $('#change-answer-mode-1').on('click', function(){
      me.answer.init();
      me.answer.html = me.data.Q.html;
    });

    $('#change-answer-mode-2').on('click', function(){
      var Q = me.data.Q;
      me.answer.init();
      me.answer.html = Q.html;
      me.answer.css  = Q.css;
    });

    $('#change-answer-mode-3').on('click', function(){
      me.answer.init(me.data.Q);
    });
  }

  /**
  * 設問データを設定する。
  */
  setQuestion(data)
  {
    var Q = data.Q;
    var E = data.E;

    // 現在のモードと問題のモードが異なる場合は警告を出し問題をセットしない。
    if(Q.mode != "" && Q.mode != this.params.mode)
    {
      var symbol = (this.params.len == 0)? '?' : '&';
      alert("この問題は読み込むにはURLの末尾に" + symbol + "mode="+Q.mode+"と指定し、再度お試しください。");
      return;
    }

    // 編集データと設問データを結合
    var MIX = this.data.concat(E, Q);

    this.setTitle((this.isAdmin)? MIX.title : Q.title);
    this.setDesc ((this.isAdmin)? MIX.desc  : Q.desc);
    this.setRefer((this.isAdmin)? MIX.ref   : Q.ref);

    this.editors.reset((this.isAdmin)? MIX : E);
    this.answers.reset((this.isAdmin)? MIX : Q);
    this.preview.init ((this.isAdmin)? MIX : E);
    this.answer.init  ((this.isAdmin)? MIX : Q);

    // 管理者モードのみ
    if(this.isAdmin){
      this.admin.title.val(MIX.title);
      this.admin.desc.val(MIX.desc);
      this.admin.ref.val(MIX.ref);
    }
  }

  /**
  * タイトルを設定する。
  */
  setTitle(text){
    text = (text)? text : "no data";
    this.title.text(text);
  }

  /**
  * 概要を設定する。
  */
  setDesc(markdown){
    markdown = (markdown)? markdown : "no data";
    this.desc.html(marked(markdown));
  }

  /**
  * 解説を設定する。
  */
  setRefer(markdown){
    markdown = (markdown)? markdown : "no data";
    this.ref.html(marked(markdown));
  }

  /**
  * リフレッシュ(読み込んだ問題やエディタなどをクリアし綺麗にする。)
  */
  refresh()
  {
    this.data.clear();
    location.reload();
  }

  /**
  * URLパラメータをパースしたデータを取得する。
  */
  parseUrlParams()
  {
    // パラメータを初期化
    var params = {admin:false, mode:"", len:0};

    // URLパラメータがなければ終了
    if(!location.search) return params;

    var array = location.search.slice(1).split('&');

    // 指定されたパラメータ数を保存
    params.len = array.length;

    $.each(array, function(i, data)
    {
      // adminは存在したらもうtrue扱い
      if(data == "admin") {
        params.admin = true;
        return;
      }

      // '='で分割しつつ、key=valになっていないものは処理しない。
      var t = data.split('=');
      if(t.length != 2) return;

      // パラメータを保存
      var key = t[0], val = t[1];
      params[key] = val;

    });

    return params;

  }
}
$(function(){
  (new cApp).init();
});
