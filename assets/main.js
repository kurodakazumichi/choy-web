/*******************************************************************************
* iframeクラス
*******************************************************************************/
class cIFrame
{
  /*
  * コンストラクタ
  * param id: iframe要素のidを指定すること。
  */
  constructor(id)
  {
    this.obj = $(id);
    this.doc = this.obj[0].contentWindow.document;

    // iframe内でjqueryを使えるようにする。(とりあえず動いたがちゃんと理解してない。)
    var html = '<head><script src="https://code.jquery.com/jquery-3.2.1.min.js"><\/script><\/head>';
    this.doc.open();
    this.doc.write(html);
    this.doc.close();
  }

  /*
  * iframeのhead要素(jquery object)を返す。
  */
  get head() {
    return $(this.doc.head);
  }

  /*
  * iframeのbody要素(jquery object)を返す。
  */
  get body() {
    return $(this.doc.body);
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
    this.html = (data.html)? data.html : "";
    this.css  = (data.css)? data.css : "";
    this.js   = (data.js)? data.js : "";
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
  init()
  {
    this.e.h = this.create("html-editor", "html");
    this.e.c = this.create("css-editor" , "css");
    this.e.j = this.create("js-editor"  , "javascript");
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
}

/*******************************************************************************
* Dataクラス、設問やエディタの内容を永続的に保持する。
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
    this.QuestionParams = ['title', 'desc', 'html', 'css', 'js', 'ref'];
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

  loadQuestion(f){
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
    return data;
  }

  /**
  * 保存したエディターデータを取得する。
  */
  get E(){
    return {
      html:this.html,
      css :this.css,
      js  :this.js
    }
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
    this.tabs;
    this.editors = new cEditors();
    this.preview = new cIFrame('#preview');
    this.answer  = new cIFrame('#answer');
    this.data    = new cData();
    this.title   = $('#title');
    this.desc    = $('#description');
    this.ref     = $('#reference-text');

    this.admin   = {};

    // URL末尾に'?admin'がついていたら管理者モードにする。
    this.isAdmin = (location.search == '?admin');
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
    this.initLoader();
    this.initMixed();

    // 設問やエディタの状態を整える。(sessionデータがあればそこから復元される)
    this.setQuestion(this.data.Q);
    this.editors.reset(this.data.E);
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
    this.tabs = $("#editors").tabs();
    this.tabs.tabs({
      activate:this.onActivateTabs.bind(this)
    });
  }

  /**
  * タブがアクティブになった時の処理
  */
  onActivateTabs(e, ui)
  {
    // アクティブになったタブに含まれるエディターにfocusする。
    var id = '#' + ui.newPanel[0].id;
    this.editors.focus($(id).data('type'));;
  }

  /**
  * エディタの初期化(エディター化とイベントの設定)
  */
  initEditors()
  {
    this.editors.init();
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
      .on('drop'     , function(e){ cfn(e, this); me.loadfile(e); });
  }

  /**
  * 問題ファイルのロード処理
  */
  loadfile(e)
  {
    var me = this;
    var f = e.originalEvent.dataTransfer.files[0];
    var reader = new FileReader();

    reader.onload = function(e){
      var data = me.data.loadQuestion(e.target.result);
      me.setQuestion(data);
      // 管理者モードの場合のみ
      if(me.isAdmin){
        me.admin.title.val(data.title);
        me.admin.desc.val(data.desc);
        me.admin.ref.val(data.ref);
        me.editors.reset(data);
      }
    };

    reader.readAsText(f);
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
      me.preview.js = me.editors.js;
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

      if($(this).data('mode') == "answer") {
        me.editors.reset(me.data.E);
        me.editors.readonly = false;
        me.data.unlock();
        $(this).data('mode', '').text('See the Answer.');

      } else {

        // データは変更しないようにロックする。
        me.data.lock();
        me.editors.reset(me.data.Q);
        me.editors.readonly = true;
        $(this).data('mode', 'answer').text('Return to Question.');
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
    this.setTitle(data.title);
    this.setDesc(data.desc);
    this.setRefer(data.ref);
    this.answer.init(data);
    this.editors.reset();
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
    this.setQuestion(this.data.Q);
    this.editors.readonly = false;
  }
}
$(function(){
  (new cApp).init();
});
