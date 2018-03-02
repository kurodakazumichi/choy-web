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

    // URL末尾に'?admin'がついていたら管理者モードにする。
    this.isAdmin = (location.search == '?admin');
  }

  addEventEditors()
  {
    var me = this;
    this.editors.h.on('change',function(){
      me.preview.html = me.data.html = me.editors.html;
    });

    this.editors.c.on('change', function(){
      me.preview.css = me.data.css = me.editors.css;
    });

    this.editors.j.on('change', function(){
      me.data.js = me.editors.js;
    });

  }

  addEventTabs(){
    this.tabs.tabs({
      activate:function(e, ui){
        var id = '#' + ui.newPanel[0].id;
        this.editors.focus($(id).data('type'));;

      }.bind(this)
    });
  }

  addEventChangeEditorMode(){
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
  * 管理者モードの場合のみ行う初期化処理。
  * 管理者モードでは、このページで読み込むための問題ファイルの作成が行える。
  * そのための入力フォーム(タイトルや概要、説明)および出力ボタンなどを生成する。
  */
  initAdmin()
  {
    if(!this.isAdmin) return;

    var me = this;

    $('.admin').show();

    $('input[name=title]').on('keyup', function(){
      me.setTitle($(this).val());
    });
    $('textarea[name=description]').on('keyup', function(){
      me.setDesc($(this).val());
    });
    $('textarea[name=reference]').on('keyup', function(){
      me.setRefer($(this).val());
    });

    $('#download').on('click', function(){
      var data = "";
      var br   = '\n';

      // titleを追加
      data += ":title" + br;
      data += $('input[name=title]').val() + br;

      // desc
      data += ":desc" + br;
      data += $('textarea[name=description]').val() + br;

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
      data += $('textarea[name=reference]').val() + br;

      var blob = new Blob([data], { "type" : "text/plain" });
      $(this).attr({href:window.URL.createObjectURL(blob),download:"question.md"});
    });
  }

  init(){
    var me = this;

    this.initAdmin();

    this.initTab();
    this.addEventTabs();
    this.editors.init();

    this.addEventEditors();
    this.setQuestion(this.data.Q);

    this.editors.reset(this.data.E);
    this.editors.focus('h');

    $('#apply-js').on('click', function(){
      me.preview.js = me.editors.js;
    });

    this.initLoader();
    this.addEventChangeEditorMode();
    this.addEventChangeAnswerMode();

    $('#reference h2').on('click', function(){
      $('#reference div').slideToggle();
      $('#reference h2').toggleClass('close');
    });

  }

  initTab(){
    this.tabs = $("#editors").tabs();
  }
  initLoader(){
    var me = this;
    var loader = $('#loader');
    loader.on('dragenter', function(e){
      e.stopPropagation();
      e.preventDefault();
      $(this).toggleClass('active');
    });
    loader.on('dragleave', function(e){
      e.stopPropagation();
      e.preventDefault();
      $(this).toggleClass('active');
    });
    loader.on('dragover', function(e){
      e.stopPropagation();
      e.preventDefault();
    });
    loader.on('drop', function(e){
      e.stopPropagation();
      e.preventDefault();
      var f = e.originalEvent.dataTransfer.files[0];


      var reader = new FileReader();

      reader.onload = function(e){
        var data = me.data.loadQuestion(e.target.result);
        me.setQuestion(data);
      };
      reader.readAsText(f);


      $(this).toggleClass('active');
    });
  }
  setTitle(text){
    this.title.text(text);
  }
  setDesc(markdown){
    this.desc.html(marked(markdown));
  }
  setRefer(markdown){
    this.ref.html(marked(markdown));
  }
  setQuestion(data)
  {
    this.setTitle(data.title);
    this.setDesc(data.desc);
    this.setRefer(data.ref);
    this.answer.init(data);
    this.editors.reset();
  }

}

$(function(){
  (new cApp).init();
});
