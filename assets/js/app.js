/* app.js part 1 — 基础设施：IIFE/工具/localStorage/导航 */
(function(){
"use strict";
var CFG = window.WB_CONFIG || {};
var CT = window.WB_CONTENT || {};

/* ============ 通用工具 ============ */
function pad(n){return n<10?"0"+n:""+n;}
function todayKey(d){d=d||new Date();return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());}
function parseTime(s){var p=s.split(":");return parseInt(p[0],10)*60+parseInt(p[1]||"0",10);}
function fmtTime(m){m=((m%1440)+1440)%1440;return pad(Math.floor(m/60))+":"+pad(m%60);}
function seedFromDate(d){return d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate();}
function seededShuffle(arr,seed){var a=arr.slice(),r=(seed%2147483647)||1;for(var i=a.length-1;i>0;i--){r=(r*16807)%2147483647;var j=r%(i+1);var t=a[i];a[i]=a[j];a[j]=t;}return a;}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c];});}
function el(tag,attrs,html){var e=document.createElement(tag);if(attrs)for(var k in attrs){if(k==="class")e.className=attrs[k];else if(k==="html")e.innerHTML=attrs[k];else e.setAttribute(k,attrs[k]);}if(html!=null)e.innerHTML=html;return e;}
function isWorkday(d){d=d||new Date();var k=todayKey(d);if((CFG.workdays||[]).indexOf(k)>=0)return true;if((CFG.holidays||[]).indexOf(k)>=0)return false;var w=d.getDay();return w>=1&&w<=5;}
function fmtDate(d){return d.getFullYear()+"年"+(d.getMonth()+1)+"月"+d.getDate()+"日";}
function shortDate(d){return (d.getMonth()+1)+"/"+d.getDate();}
function startOfDay(d){return new Date(d.getFullYear(),d.getMonth(),d.getDate());}
function uid(){return "id"+Date.now()+""+Math.floor(Math.random()*1e6);}
function pick(arr){return arr[Math.floor(Math.random()*arr.length)];}

/* ============ localStorage 层 ============ */
function ls(k){try{return localStorage.getItem(k);}catch(e){return null;}}
function lsSet(k,v){try{localStorage.setItem(k,v);}catch(e){}}
function lsJSON(k,d){try{var v=ls(k);return v?JSON.parse(v):d;}catch(e){return d;}}
function lsSetJSON(k,v){lsSet(k,JSON.stringify(v));}

/* 健康（沿用旧逻辑，跨14天回退） */
function healthKey(d){return "wb_health_"+todayKey(d);}
function getHealth(d){var k=healthKey(d);var v=lsJSON(k,null);if(v)return v;var cur=new Date();for(var i=1;i<=14;i++){var dd=new Date(cur.getFullYear(),cur.getMonth(),cur.getDate()-i);var v2=lsJSON(healthKey(dd),null);if(v2){v2._carried=true;v2._daysAgo=i;return v2;}}return {sleepHours:6.5,fatigue:2,sleepQuality:4,thighCm:CFG.goals.currentThighCm||58,_carried:true,_daysAgo:0};}
function setHealth(d,o){lsSetJSON(healthKey(d),o);}

/* 任务(每日工作内容) */
function worktaskKey(d){return "wb_worktasks_"+todayKey(d);}
function getWorkTasks(d){return lsJSON(worktaskKey(d),[]);}
function setWorkTasks(d,arr){lsSetJSON(worktaskKey(d),arr);}

/* 阅读已完成（书名+章节号 稳定键） */
function getReadDone(){return new Set(lsJSON("wb_read_done",[]));}
function getReadLog(){return lsJSON("wb_read_log",[]);}
function setReadDone(k,done){
  var s=getReadDone();if(done)s.add(k);else s.delete(k);
  lsSetJSON("wb_read_done",Array.from(s));
  var log=getReadLog();
  if(done){ if(!log.some(function(e){return e.key===k;})) log.push({date:todayKey(new Date()),key:k}); }
  else { log=log.filter(function(e){return e.key!==k;}); }
  lsSetJSON("wb_read_log",log);
}

/* 便签 */
function noteKey(d){return "wb_note_"+todayKey(d);}
function getNote(d){return ls(noteKey(d))||"";}
function setNote(d,t){lsSet(noteKey(d),t);}

/* 心情 */
function moodKey(d){return "wb_mood_"+todayKey(d);}
function getMood(d){return lsJSON(moodKey(d),null);}
function setMood(d,o){lsSetJSON(moodKey(d),o);}
function moodHistory(){var out=[];for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k&&k.indexOf("wb_mood_")===0){var d=k.replace("wb_mood_","");out.push({date:d,data:lsJSON(k,null)});}}return out.sort(function(a,b){return b.date.localeCompare(a.date);});}

/* 影视 */
function getMoviesWatched(){return lsJSON("wb_movies_watched",[]);}
function setMoviesWatched(a){lsSetJSON("wb_movies_watched",a);}
function getMoviesWant(){return lsJSON("wb_movies_want",[]);}
function setMoviesWant(a){lsSetJSON("wb_movies_want",a);}

/* 运动打卡 */
function exerciseLogKey(d){return "wb_exercise_log_"+todayKey(d);}
function getExerciseLog(d){return lsJSON(exerciseLogKey(d),null);}
function setExerciseLog(d,o){lsSetJSON(exerciseLogKey(d),o);}
function exerciseLogMonth(year,month){var prefix="wb_exercise_log_"+year+"-"+pad(month+1);var out={};for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k&&k.indexOf(prefix)===0){var day=parseInt(k.replace(prefix,""),10);if(!isNaN(day))out[day]=lsJSON(k,null);}}return out;}

/* 记账 */
function getMoney(){return lsJSON("wb_money",[]);}
function setMoney(a){lsSetJSON("wb_money",a);}

/* 存钱 */
function getSavings(){var s=lsJSON("wb_savings",null);if(s==null){s=(CFG.defaultSavings||[]).slice();setSavings(s);}return s;}
function setSavings(a){lsSetJSON("wb_savings",a);}

/* 树洞 */
function getTree(){return lsJSON("wb_tree",[]);}
function setTree(a){lsSetJSON("wb_tree",a);}

/* 提醒 */
function remindKey(d,k){return "wb_remind_"+k+"_"+todayKey(d);}

/* ============ 侧栏导航 ============ */
function setupNav(){
var btns=document.querySelectorAll("#taskbar .nav-item");
for(var i=0;i<btns.length;i++){
  btns[i].addEventListener("click",function(){
    var t=this.getAttribute("data-target");
    document.querySelectorAll(".nav-item").forEach(function(b){b.classList.toggle("active",b===this);}.bind(this));
    document.querySelectorAll(".panel").forEach(function(p){p.classList.toggle("active",p.id===t);});
    try{location.hash="#"+t;}catch(e){}
    closeSidebar();
  });
}
if(location.hash){
  var h=location.hash.replace("#","");
  var btn=document.querySelector('.nav-item[data-target="'+h+'"]');
  if(btn)btn.click();
}
}

/* ============ 提醒 toast ============ */
let toastTimer=null;
function showToast(r){
var t=document.getElementById("toast");
if(!t){t=document.createElement("div");t.id="toast";t.className="toast";document.body.appendChild(t);}
t.innerHTML='<div class="toast-card"><div class="toast-t">'+esc(r.title)+'</div><div class="toast-x">'+esc(r.text)+'</div><button class="toast-ok" id="toastOk">知道了</button></div>';
t.classList.add("show");
var ok=document.getElementById("toastOk");if(ok)ok.onclick=function(){t.classList.remove("show");};
clearTimeout(t._h);t._h=setTimeout(function(){t.classList.remove("show");},15000);
var nav=document.querySelector('.nav-item[data-target="'+r.panel+'"]');
if(nav){nav.classList.add("pulse");setTimeout(function(){nav.classList.remove("pulse");},6000);}
try{if(window.Notification&&Notification.permission==="granted")new Notification(r.title,{body:r.text});}catch(e){}
}/* app.js part 2 — renderHeader + renderPlan + 心情 + 读书 */
const REMINDERS = [
  { key: "en", time: CFG.reminders.english, panel: "m-articles",
    title: "英语时间到啦 🔋", text: "今天 3 篇三电 / 英语文章，点开读一读～" },
  { key: "rd", time: CFG.reminders.reading, panel: "m-reading",
    title: "阅读时间到啦 📖", text: "今天「阅读第 X / 30 天」的章节，翻开读几页吧～" }
];
function checkReminders(){
  var d=new Date(),now=pad(d.getHours())+":"+pad(d.getMinutes());
  for(var i=0;i<REMINDERS.length;i++){
    var r=REMINDERS[i];
    if(now===r.time&&!ls(remindKey(d,r.key))){lsSet(remindKey(d,r.key),"1");showToast(r);}
  }
}
let remindTimer=null;
function scheduleReminders(){
  if(remindTimer)clearInterval(remindTimer);
  checkReminders();
  remindTimer=setInterval(checkReminders,30000);
}
function requestRemindPerm(){
  try{
    if(!window.Notification){alert("当前浏览器不支持桌面通知，已用页内提醒代替。");return;}
    if(Notification.permission==="granted"){alert("已开启桌面通知 ✅");return;}
    Notification.requestPermission().then(function(p){if(p==="granted")alert("已开启桌面通知，到点会弹系统提醒 ✅");});
  }catch(e){}
}

/* ============ renderHeader ============ */
function renderHeader(){
  var d=new Date();
  var h=document.getElementById("header");
  var dow=["日","一","二","三","四","五","六"][d.getDay()];
  h.innerHTML='<div class="hd-wrap"><button class="hamburger" id="hamburger" aria-label="菜单">☰</button><span class="hd-row">我 的今日工作台 · '+fmtDate(d)+' · 周'+dow+'</span></div>';
}

/* 抽屉式侧栏：移动端收起/展开 */
function closeSidebar(){
  var t=document.getElementById("taskbar"); if(t) t.classList.remove("open");
  var bd=document.getElementById("backdrop"); if(bd) bd.classList.remove("show");
}
function toggleSidebar(){
  var t=document.getElementById("taskbar"); if(!t) return;
  var open=t.classList.toggle("open");
  var bd=document.getElementById("backdrop"); if(bd) bd.classList.toggle("show", open);
}

/* ============ buildPlan / renderPlan ============ */
function buildPlan(d){
  var health=getHealth(d);
  var todos=getWorkTasks(d);
  var dones=todos.filter(function(t){return t.done;});
  var pends=todos.filter(function(t){return !t.done;});
  var quoteSeed=seedFromDate(d);
  var qs=CT.QUOTES||[];
  var quote=qs.length?seededShuffle(qs,quoteSeed)[0]:"今天也要加油鸭～";
  var exLog=getExerciseLog(d)||{done:false,note:""};
  return {health:todos,quote:quote,exLog:exLog,dones:dones,pends:pends};
}

/* 倒计时 */
let countdownTimer=null;
function tickCountdown(){
  var el=document.getElementById("countdown");
  if(!el)return;
  var d=new Date();
  var now=d.getHours()*60+d.getMinutes();
  var end=parseTime(CFG.profile.workEnd);
  var rem=end-now;
  if(rem<=0){el.textContent="🎉 已下班，好好休息~";return;}
  el.textContent="⏳ 下班倒计时 "+pad(Math.floor(rem/60))+":"+pad(rem%60);
}

function renderPlan(){
  var d=new Date();
  var b=buildPlan(d);
  var wrap=document.getElementById("m-plan");
  var wd=isWorkday(d);
  var countdownHtml=wd?'<div id="countdown" class="countdown"></div>':"";
  wrap.innerHTML=
    '<h2 class="panel-title">📅 每日计划</h2>'+
    '<div class="panel-sub">今日金句 · 运动打卡 · 待办 & 已完成</div>'+
    countdownHtml+
    '<div class="quote-card plan-section">🌼 <b>今日金句</b><br>'+esc(b.quote)+'</div>'+
    '<div class="plan-section"><div class="sub-block-hd">🏃 运动打卡</div>'+
    '<div class="exercise-check"><label><input type="checkbox" id="exTodayDone" '+(b.exLog.done?'checked':'')+'>今日已运动</label>'+
    '<input type="text" id="exTodayNote" placeholder="运动内容（如：深蹲100 / 跑步3km）" value="'+esc(b.exLog.note||'')+'" maxlength="60" style="flex:1;border:1px solid var(--line);border-radius:8px;padding:6px 8px;font-size:12.5px;"></div></div>'+
    '<div class="plan-section"><div class="sub-block-hd">📋 今日待完成</div>'+
    '<div class="wt-add"><input id="wtInput" type="text" placeholder="输入今日任务，回车添加" maxlength="80">'+
    '<button type="button" id="wtAdd" class="btn-primary">添加</button></div>'+
    '<div id="wtPending"></div></div>'+
    '<div class="plan-section"><div class="sub-block-hd">✅ 今日已完成</div><div id="wtDone"></div></div>';
  // 渲染待办/已完成
  var pendEl=document.getElementById("wtPending");
  if(b.pends.length===0){pendEl.innerHTML='<div class="empty-tip">还没有待办任务</div>';}
  else{pendEl.innerHTML=b.pends.map(function(t){return '<label class="li" data-wti="'+t.id+'"><input type="checkbox" data-wt="'+t.id+'"><span class="li-body">'+esc(t.text)+'</span><button class="btn-del" data-wtdel="'+t.id+'">✕</button></label>';}).join("");}
  var doneEl=document.getElementById("wtDone");
  if(b.dones.length===0){doneEl.innerHTML='<div class="empty-tip">还没已完成的任务</div>';}
  else{doneEl.innerHTML=b.dones.map(function(t){return '<label class="li done" data-wti="'+t.id+'"><input type="checkbox" data-wt="'+t.id+'" checked><span class="li-body">'+esc(t.text)+'</span></label>';}).join("");}
  bindPlan();
  if(wd){if(countdownTimer)clearInterval(countdownTimer);tickCountdown();countdownTimer=setInterval(tickCountdown,1000);}
}

function bindPlan(){
  var d=new Date();
  var add=function(){
    var inp=document.getElementById("wtInput");if(!inp)return;
    var v=inp.value.trim();if(!v)return;
    var arr=getWorkTasks(d);arr.push({id:"wt"+Date.now()+Math.floor(Math.random()*1e3),text:v,done:false});
    setWorkTasks(d,arr);renderPlan();
  };
  var btn=document.getElementById("wtAdd");if(btn)btn.onclick=add;
  var inp=document.getElementById("wtInput");if(inp)inp.onkeydown=function(e){if(e.key==="Enter")add();};
  document.querySelectorAll("#m-plan input[data-wt]").forEach(function(cb){
    cb.onchange=function(){
      var id=cb.getAttribute("data-wt");
      var arr=getWorkTasks(d);var t=arr.find(function(x){return x.id===id;});
      if(t){t.done=cb.checked;setWorkTasks(d,arr);}
      renderPlan();
    };
  });
  document.querySelectorAll("#m-plan .btn-del[data-wtdel]").forEach(function(b){
    b.onclick=function(){
      var id=b.getAttribute("data-wtdel");
      var arr=getWorkTasks(d).filter(function(x){return x.id!==id;});
      setWorkTasks(d,arr);renderPlan();
    };
  });
  // 运动打卡
  var ecb=document.getElementById("exTodayDone");
  var einf=document.getElementById("exTodayNote");
  var saveEx=function(){setExerciseLog(d,{done:ecb&&ecb.checked,note:einf?einf.value:""});};
  if(ecb)ecb.onchange=saveEx;if(einf)einf.onblur=saveEx;
}

/* ============ 心情 build/render/bind ============ */
function buildMood(d){return {today:getMood(d),history:moodHistory()};}

function renderMood(){
  var d=new Date();
  var b=buildMood(d);
  var ml=CFG.moodList||[];
  var cards=ml.map(function(m,i){
    var sel=b.today&&b.today.mood===m.id;
    var w=(i===4)?' wide':''; // 兴奋 居中独占
    return '<div class="mood-card'+w+(sel?' active':'')+'" data-mood="'+m.id+'"><div class="emo">'+m.emo+'</div><div class="name">'+m.label+'</div></div>';
  }).join("");
  var today=b.today||{mood:"",text:""};
  var historyHtml=b.history.length?'<div class="sub-block-hd">📜 历史心情</div>'+b.history.map(function(h){
    if(!h.data)return "";
    var m=ml.find(function(x){return x.id===h.data.mood;})||{};
    return '<label class="note-item" data-mhk="'+h.date+'"><input type="checkbox" data-mhdone="'+h.date+'" '+(h.data.reviewed?'checked':'')+'> '+(m.emo||"🙂")+' · '+h.date+' · '+(h.data.text||"(无文字)")+'</label>';
  }).join(""):'<div class="empty-tip">还没有心情记录</div>';
  document.getElementById("m-mood").innerHTML=
    '<h2 class="panel-title">💗 心情记录</h2>'+
    '<div class="panel-sub">你今天感觉怎么样?</div>'+
    '<div class="mood-grid">'+cards+'</div>'+
    '<div class="quote-card plan-section"><b>📓 心情日记</b><br><textarea id="moodText" placeholder="今天还没有记录心情哦~" style="width:100%;margin-top:8px;min-height:70px;border:1px solid var(--line);border-radius:10px;padding:8px;font-size:13px;">'+esc(today.text||"")+'</textarea>'+
    '<div style="text-align:right;margin-top:6px;"><button class="btn-primary" id="moodSave">保存今日心情</button></div></div>'+
    historyHtml;
  bindMood();
}

function bindMood(){
  var d=new Date();
  document.querySelectorAll("#m-mood .mood-card").forEach(function(c){
    c.onclick=function(){
      var id=c.getAttribute("data-mood");
      var cur=getMood(d)||{mood:"",text:""};
      cur.mood=id;
      setMood(d,cur);
      renderMood();
    };
  });
  var sv=document.getElementById("moodSave");
  if(sv)sv.onclick=function(){
    var cur=getMood(d)||{mood:"",text:""};
    cur.text=(document.getElementById("moodText")||{}).value||"";
    setMood(d,cur);alert("已保存 ✅");
  };
  document.querySelectorAll("#m-mood input[data-mhdone]").forEach(function(cb){
    cb.onchange=function(){
      var k="wb_mood_"+cb.getAttribute("data-mhdone");
      var o=lsJSON(k,null);if(o){o.reviewed=cb.checked;lsSetJSON(k,o);}
    };
  });
}/* app.js part 3 — 阅读(buildReading / renderReading / 章节勾选) */
var READING_ANCHOR = new Date(2026, 6, 27); // 2026-07-27
var READING_WIN = 30;

function getMonthBooks(d){
  var books = CFG.reading.books.slice(0, CFG.reading.booksPerMonth);
  var first = CFG.reading.firstBook;
  if(first) books.sort(function(a,b){return (a.title===first?-1:b.title===first?1:0);});
  return books;
}

function dayWeight(d){
  var w = d.getDay();
  // 周末多读,工作日少读;周一三五中等,周二四少
  if(w===0||w===6) return 3;
  if(w===1||w===3||w===5) return 1;
  return 0;
}

function buildReading(d){
  var a = startOfDay(d);
  var off = Math.round((a - READING_ANCHOR)/86400000);
  var dayOfWindow = Math.max(1, Math.min(READING_WIN, off+1));
  var books = getMonthBooks(d);
  var flat = [];
  books.forEach(function(b){ b.chapters.forEach(function(c){ flat.push({book:b, ch:c}); }); });
  var total = flat.length;
  var counts = [];
  for(var i=0;i<READING_WIN;i++){
    var dd = new Date(READING_ANCHOR.getFullYear(), READING_ANCHOR.getMonth(), READING_ANCHOR.getDate()+i);
    counts.push(dayWeight(dd));
  }
  var cnt = counts[dayOfWindow-1] || 0;
  var done = getReadDone();
  var keyOf = function(i){ return flat[i].book.title+"#"+flat[i].ch.n; };
  var start = 0;
  while(start<total && done.has(keyOf(start))) start++;
  var todayChapters = [];
  for(var j=start;j<total && todayChapters.length<cnt;j++){
    var gi = keyOf(j);
    if(!done.has(gi)) todayChapters.push({book:flat[j].book, ch:flat[j].ch, gi:gi});
  }
  return {dayOfWindow:dayOfWindow, daysInWindow:READING_WIN, books:books, todayChapters:todayChapters, done:done.size, total:total, isLast:dayOfWindow>=READING_WIN};
}

function renderReading(){
  var d = new Date();
  var rd = buildReading(d);
  var wrap = document.getElementById("m-reading");
  var chapters = "";
  if(rd.todayChapters.length===0){
    chapters = '<div class="rest">前面的章节都读完啦，享受休息日吧 🌿</div>';
  } else {
    rd.todayChapters.forEach(function(item){
      chapters += '<div class="chapter" data-readk="'+item.gi+'">'+
        '<label class="rcheck"><input type="checkbox" data-read="'+item.gi+'" data-total="'+rd.total+'"></label>'+
        '<div class="rc-body">'+
        '<div class="rc-t">《'+esc(item.book.title)+'》第 '+item.ch.n+' 章 · '+esc(item.ch.title)+'</div>'+
        '<div class="rc-sum">'+esc(item.ch.summary||"")+'</div>'+
        '<div class="rc-thought">❓ 思考：'+esc(item.ch.thought||"")+'</div>'+
        '</div></div>';
    });
  }
  var pct = rd.total?Math.round(rd.done/rd.total*100):0;
  wrap.innerHTML =
    '<h2 class="panel-title">📖 读书记录</h2>'+
    '<div class="panel-sub">本月书单 · 未读完次日顺延 · '+CFG.reminders.reading+' 提醒 <button type="button" class="btn-ghost" id="rdRemindBtn">开启桌面提醒</button></div>'+
    '<div class="sub-block-hd">📚 本月书单：'+rd.books.map(function(b){return '《'+esc(b.title)+'》';}).join("、")+'</div>'+
    '<div class="quote-card" style="margin-bottom:12px;">📖 阅读第 <b>'+rd.dayOfWindow+'</b> / '+rd.daysInWindow+' 天</div>'+
    '<div class="quote-card plan-section" style="margin-bottom:12px;">📊 最近7天小计：阅读 <b>'+sum7read()+'</b> 章</div>'+
    chapters+
    '<div class="goal"><div class="bar"><div class="bar-fill" style="width:'+pct+'%"></div></div>'+
    '<div class="goal-sub">已完成 '+rd.done+' / '+rd.total+' 章 · '+pct+'%</div></div>';
  // 绑定章节勾选 + 提醒按钮
  document.querySelectorAll('#m-reading input[data-read]').forEach(function(cb){
    cb.onchange = function(){
      var gi = cb.getAttribute('data-read');
      setReadDone(gi, cb.checked);
      var total = parseInt(cb.getAttribute('data-total')||'0', 10);
      var done = getReadDone().size;
      var pct = total?Math.round(done/total*100):0;
      var wr = document.getElementById('m-reading');
      var bf = wr.querySelector('.bar-fill'); if(bf) bf.style.width = pct+'%';
      var gs = wr.querySelector('.goal-sub'); if(gs) gs.textContent = '已完成 '+done+' / '+total+' 章 · '+pct+'%';
      var ch = cb.closest('.chapter'); if(ch) ch.classList.toggle('done', cb.checked);
    };
  });
  var rb = document.getElementById('rdRemindBtn'); if(rb) rb.onclick = requestRemindPerm;
}/* app.js part 4 — 观影记录(完整版：统计卡 + 筛选 + 已看/想看 双列表 + 增删改) */
var movieFilter = "all";

function buildMovies(){
  var watched = getMoviesWatched();
  var want = getMoviesWant();
  var cur = new Date();
  var thisMonth = watched.filter(function(m){return m.date && m.date.indexOf(cur.getFullYear()+"-"+pad(cur.getMonth()+1))===0;}).length;
  return {watched:watched, want:want, stats:{watched:watched.length, want:want.length, month:thisMonth}};
}

function movieTypeLabel(id){
  var t = (CFG.movieTypes||[]).find(function(x){return x.id===id;}); return t?t.label:"其他";
}
function movieTypeIcon(id){
  var t = (CFG.movieTypes||[]).find(function(x){return x.id===id;}); return t?t.icon:"🎬";
}

function renderMovies(){
  var b = buildMovies();
  var wrap = document.getElementById("m-movie");
  var cats = (CFG.movieTypes||[]).map(function(t){return '<button class="tab'+(movieFilter===t.id?' active':'')+'" data-mf="'+t.id+'">'+t.icon+' '+t.label+'</button>';}).join("");
  var tabs = '<button class="tab'+(movieFilter==='all'?' active':'')+'" data-mf="all">全部</button>'+cats;
  var list = b.watched;
  if(movieFilter!=='all') list = list.filter(function(m){return m.type===movieFilter;});
  var itemsHtml = list.length?list.map(function(m){
    return '<div class="li" data-mid="'+m.id+'">'+
      '<span style="font-size:18px;">'+movieTypeIcon(m.type)+'</span>'+
      '<div class="li-body"><div>'+esc(m.title)+' <span class="vtag bilibili" style="background:#a48cff">'+movieTypeLabel(m.type)+'</span> '+(m.rating?'⭐ '+m.rating:'')+'</div>'+
      '<div class="li-meta">'+esc(m.date||"")+(m.note?' · '+esc(m.note):'')+'</div></div>'+
      '<div class="li-actions"><button class="btn-edit" data-med="'+m.id+'">编辑</button><button class="btn-del" data-mdd="'+m.id+'">删</button></div></div>';
  }).join("") : '<div class="empty-tip">还没有已观看影片</div>';
  var wantHtml = b.want.length?b.want.map(function(m){
    return '<div class="li" data-mwid="'+m.id+'">'+
      '<span style="font-size:18px;">'+movieTypeIcon(m.type)+'</span>'+
      '<div class="li-body"><div>'+esc(m.title)+' <span class="vtag bilibili" style="background:#a48cff">'+movieTypeLabel(m.type)+'</span></div>'+
      '<div class="li-meta">'+esc(m.note||"")+'</div></div>'+
      '<div class="li-actions"><button class="btn-edit" data-mwok="'+m.id+'">已看</button><button class="btn-del" data-mwdd="'+m.id+'">删</button></div></div>';
  }).join("") : '<div class="empty-tip">暂无片单备选</div>';
  var types = (CFG.movieTypes||[]).map(function(t){return '<option value="'+t.id+'">'+t.icon+' '+t.label+'</option>';}).join("");
  wrap.innerHTML =
    '<h2 class="panel-title">🎬 影视存档本</h2>'+
    '<div class="panel-sub">值得收藏的影视作品</div>'+
    '<div class="stat-row">'+
      '<div class="stat-card c1"><div class="num">'+b.stats.watched+'</div><div class="lbl">已观看</div></div>'+
      '<div class="stat-card c2"><div class="num">'+b.stats.want+'</div><div class="lbl">想看</div></div>'+
      '<div class="stat-card c3"><div class="num">'+b.stats.month+'</div><div class="lbl">本月新增</div></div>'+
    '</div>'+
    '<div class="quote-card plan-section" style="margin-bottom:12px;">📊 最近7天小计：观影 <b>'+sum7movie()+'</b> 部</div>'+
    '<div class="form-row">'+
      '<select id="mvType" class="inp-cat">'+types+'</select>'+
      '<input id="mvTitle" class="inp-text" placeholder="影片名称" maxlength="60">'+
      '<input id="mvRating" class="inp-amt" placeholder="评分1-10" type="number" min="0" max="10" step="0.5">'+
      '<button class="btn-primary" id="mvAddWatched">+ 添加已看</button>'+
    '</div>'+
    '<div class="form-row">'+
      '<select id="mvTypeW" class="inp-cat">'+types+'</select>'+
      '<input id="mvTitleW" class="inp-text" placeholder="备选影片名称" maxlength="60">'+
      '<button class="btn-primary" id="mvAddWant">+ 加入片单</button>'+
    '</div>'+
    '<div class="tabs" id="mvTabs">'+tabs+'</div>'+
    '<div class="sub-block-hd">🎬 已观看影片</div><div id="mvList">'+itemsHtml+'</div>'+
    '<div class="sub-block-hd" style="margin-top:12px;">📝 片单备选清单</div><div id="mvWantList">'+wantHtml+'</div>';
  bindMovies();
}

function bindMovies(){
  // 添加已看
  var a1=document.getElementById("mvAddWatched");
  if(a1) a1.onclick=function(){
    var t=document.getElementById("mvTitle").value.trim();
    if(!t){alert("请输入影片名");return;}
    var arr=getMoviesWatched();
    arr.unshift({id:uid(), title:t, type:document.getElementById("mvType").value, rating:document.getElementById("mvRating").value||"", date:todayKey(new Date())});
    setMoviesWatched(arr);renderMovies();
  };
  // 加入片单
  var a2=document.getElementById("mvAddWant");
  if(a2) a2.onclick=function(){
    var t=document.getElementById("mvTitleW").value.trim();
    if(!t){alert("请输入影片名");return;}
    var arr=getMoviesWant();
    arr.unshift({id:uid(), title:t, type:document.getElementById("mvTypeW").value, note:""});
    setMoviesWant(arr);renderMovies();
  };
  // 筛选 tab
  document.querySelectorAll("#mvTabs .tab").forEach(function(b){
    b.onclick=function(){movieFilter=b.getAttribute("data-mf");renderMovies();};
  });
  // 删除已看
  document.querySelectorAll("#m-movie .btn-del[data-mdd]").forEach(function(b){
    b.onclick=function(){
      var id=b.getAttribute("data-mdd");
      setMoviesWatched(getMoviesWatched().filter(function(x){return x.id!==id;}));
      renderMovies();
    };
  });
  // 删除片单
  document.querySelectorAll("#m-movie .btn-del[data-mwdd]").forEach(function(b){
    b.onclick=function(){
      var id=b.getAttribute("data-mwdd");
      setMoviesWant(getMoviesWant().filter(function(x){return x.id!==id;}));
      renderMovies();
    };
  });
  // 编辑已看（弹窗简化：prompt 评分/备注）
  document.querySelectorAll("#m-movie .btn-edit[data-med]").forEach(function(b){
    b.onclick=function(){
      var id=b.getAttribute("data-med");
      var arr=getMoviesWatched();var m=arr.find(function(x){return x.id===id;});if(!m)return;
      var r=prompt("修改评分（1-10）:", m.rating||"");
      if(r!==null) m.rating=r;
      var n=prompt("修改备注:", m.note||"");
      if(n!==null) m.note=n;
      setMoviesWatched(arr);renderMovies();
    };
  });
  // 片单 → 已看
  document.querySelectorAll("#m-movie .btn-edit[data-mwok]").forEach(function(b){
    b.onclick=function(){
      var id=b.getAttribute("data-mwok");
      var wa=getMoviesWant();var m=wa.find(function(x){return x.id===id;});if(!m)return;
      var watched=getMoviesWatched();
      watched.unshift({id:uid(), title:m.title, type:m.type, rating:"", date:todayKey(new Date())});
      setMoviesWatched(watched);
      setMoviesWant(wa.filter(function(x){return x.id!==id;}));
      renderMovies();
    };
  });
}/* app.js part 5 — 运动锻炼(目标盒 + 日历打卡 widget + 视频跳转 + 记录列表) */
var exCalMonth = null; // 当前显示月份 {y,m}

function buildExercise(d){
  var goal = CFG.exercise || {};
  var monthLogs = exerciseLogMonth(d.getFullYear(), d.getMonth());
  return {goal:goal, monthLogs:monthLogs, today:getExerciseLog(d)||{done:false, note:""}};
}

function videoUrl(v){
  if(v.platform==="douyin") return "https://www.douyin.com/search/"+encodeURIComponent(v.kw);
  return "https://search.bilibili.com/all?keyword="+encodeURIComponent(v.kw);
}
function videoLabel(v){
  if(v.platform==="douyin") return "▶ 在抖音跟练";
  return "▶ 在B站打开";
}

function renderCalendar(y, m, monthLogs, onClick){
  var first = new Date(y, m, 1);
  var lastDay = new Date(y, m+1, 0).getDate();
  var startW = first.getDay();
  var dows = ["日","一","二","三","四","五","六"];
  var grid = '<div class="cal-dow">'+dows.map(function(x){return '<div>'+x+'</div>';}).join("")+'</div>';
  grid += '<div class="cal-grid">';
  for(var i=0;i<startW;i++) grid += '<div class="cal-day out"></div>';
  var today = new Date();
  for(var d=1; d<=lastDay; d++){
    var isToday = (d===today.getDate() && m===today.getMonth() && y===today.getFullYear());
    var done = monthLogs[d] && monthLogs[d].done;
    var cls = "cal-day"+(isToday?" today":"")+(done?" done":"");
    grid += '<div class="'+cls+'" data-day="'+d+'" title="'+(done?'已打卡':'未打卡')+'">'+d+'</div>';
  }
  grid += '</div>';
  return '<div class="cal-box"><div class="cal-hd"><div class="cal-title">'+y+'年'+(m+1)+'月</div>'+
    '<div class="cal-nav"><button data-calnav="-1">‹</button><button data-calnav="0">今天</button><button data-calnav="1">›</button></div></div>'+grid+'</div>';
}

function renderExercise(){
  var d = new Date();
  var b = buildExercise(d);
  if(!exCalMonth) exCalMonth = {y:d.getFullYear(), m:d.getMonth()};
  // 目标盒
  var goalBox = '<div class="goal-box"><div class="gt">🎯 当前目标：'+esc(b.goal.goalTitle||'塑形改善腿型 + 拯救胯宽拜拜肉')+'</div>'+
    '<div class="goal-tags">'+(b.goal.goalTags||['瘦腿直腿','改善假胯宽','手臂紧致','核心塑形']).map(function(t){return '<span class="goal-tag">'+esc(t)+'</span>';}).join("")+'</div></div>';
  // 最近7天小计
  var ex7 = sum7exercise();
  var sum7html = '<div class="quote-card plan-section" style="margin-bottom:14px;">📊 最近7天小计：运动打卡 <b>'+ex7.done+'</b> 天 · 记录 '+ex7.rec+' 条</div>';
  // 日历
  var cal = renderCalendar(exCalMonth.y, exCalMonth.m, b.monthLogs||{});
  // 视频
  var vs = CT.VIDEOS || [];
  var v = vs.length?vs[Math.abs(seedFromDate(d))%vs.length]:null;
  var videoHtml = v?'<div class="sub-block-hd">🎥 今日推荐跟练</div><div class="quote-card"><div style="font-weight:700;margin-bottom:6px;">'+esc(v.title||"")+'</div><div style="font-size:12px;color:var(--muted);">强度：'+esc(v.intensity||"")+' · '+esc(v.duration||"")+'</div><a class="vjump" href="'+videoUrl(v)+'" target="_blank" rel="noopener">'+videoLabel(v)+'</a></div>':"";
  // 记录列表（本月）
  var recs = [];
  Object.keys(b.monthLogs||{}).forEach(function(day){
    var lg = b.monthLogs[day];
    if(lg && (lg.note||lg.done)) recs.push({day:day, log:lg});
  });
  recs.sort(function(a,b){return parseInt(b.day,10)-parseInt(a.day,10);});
  var recsHtml = recs.length?'<div class="sub-block-hd" style="margin-top:12px;">📓 运动记录</div>'+recs.map(function(r){
    return '<label class="record-card" data-exd="'+exCalMonth.y+'-'+pad(exCalMonth.m+1)+'-'+r.day+'">'+
      '<input type="checkbox" data-exdone="'+exCalMonth.y+'-'+pad(exCalMonth.m+1)+'-'+r.day+'" '+(r.log.reviewed?'checked':'')+'>'+
      '<div class="rb"><div>'+esc(r.log.note||'(无备注)')+'</div><div class="rm">'+exCalMonth.y+'-'+pad(exCalMonth.m+1)+'-'+r.day+(r.log.done?' · ✅':'')+'</div></div></label>';
  }).join(""):'<div class="empty-tip">本月暂无运动记录</div>';

  document.getElementById("m-exercise").innerHTML =
    '<h2 class="panel-title">🧘 运动锻炼</h2>'+
    '<div class="panel-sub">每日打卡 · 塑形跟练 · 19:00 开始</div>'+
    goalBox+
    sum7html+
    cal+
    '<div class="sub-block-hd" style="margin-top:14px;">📝 记录今日运动</div>'+
    '<div class="form-row"><input id="exNote" class="inp-text" placeholder="今天练了什么? 例如: 欧阳春晓30分钟" maxlength="60">'+
    '<button class="btn-primary" id="exSubmit">打卡 ✓</button></div>'+
    videoHtml+
    recsHtml;
  bindExercise();
}

function bindExercise(){
  var d = new Date();
  // 打卡
  var sb = document.getElementById("exSubmit");
  if(sb) sb.onclick = function(){
    var note = (document.getElementById("exNote")||{}).value||"";
    setExerciseLog(d, {done:true, note:note, reviewed:false});
    if(!exCalMonth || exCalMonth.y!==d.getFullYear() || exCalMonth.m!==d.getMonth()) exCalMonth={y:d.getFullYear(),m:d.getMonth()};
    renderExercise();
  };
  // 日历翻页
  document.querySelectorAll("#m-exercise [data-calnav]").forEach(function(b){
    b.onclick = function(){
      var dir = parseInt(b.getAttribute("data-calnav"),10);
      if(dir===0){exCalMonth={y:d.getFullYear(),m:d.getMonth()};}
      else{
        var nm = exCalMonth.m+dir;
        if(nm<0){exCalMonth={y:exCalMonth.y-1, m:11};}
        else if(nm>11){exCalMonth={y:exCalMonth.y+1, m:0};}
        else{exCalMonth={y:exCalMonth.y, m:nm};}
      }
      renderExercise();
    };
  });
  // 点击某天 → 切换打卡状态
  document.querySelectorAll("#m-exercise .cal-day[data-day]").forEach(function(el){
    el.onclick = function(){
      var day = parseInt(el.getAttribute("data-day"),10);
      var key = exerciseLogKey(new Date(exCalMonth.y, exCalMonth.m, day));
      var cur = lsJSON(key, null);
      if(cur && cur.done){
        lsSet(key,"");
      } else {
        var note = prompt("为 "+exCalMonth.y+"-"+pad(exCalMonth.m+1)+"-"+day+" 添加运动备注(可空):", cur?cur.note||"":"");
        if(note===null) return;
        lsSetJSON(key, {done:true, note:note||"", reviewed:false});
      }
      renderExercise();
    };
  });
  // 记录回顾勾选
  document.querySelectorAll("#m-exercise input[data-exdone]").forEach(function(cb){
    cb.onchange = function(){
      var k = exerciseLogKey(new Date(0))?null:null; // placeholder
      var dateKey = cb.getAttribute("data-exdone");
      var o = lsJSON("wb_exercise_log_"+dateKey, null);
      if(o){ o.reviewed = cb.checked; lsSetJSON("wb_exercise_log_"+dateKey, o); }
    };
  });
}/* app.js part 6 — 日常记账(完整版：统计 + 分类 + 列表 + 筛选) + 存钱 + 树洞 */
var moneyFilter = "all";

function buildMoney(d){
  var list = getMoney();
  var today = todayKey(d);
  var month = d.getFullYear()+"-"+pad(d.getMonth()+1);
  var todaySum = list.filter(function(x){return x.date===today;}).reduce(function(s,x){return s+(+x.amount||0);},0);
  var monthSum = list.filter(function(x){return x.date&&x.date.indexOf(month)===0;}).reduce(function(s,x){return s+(+x.amount||0);},0);
  var monthCount = list.filter(function(x){return x.date&&x.date.indexOf(month)===0;}).length;
  return {list:list, stats:{today:todaySum.toFixed(2), month:monthSum.toFixed(2), count:monthCount}};
}

function moneyCatLabel(id){
  var c = (CFG.moneyCategories||[]).find(function(x){return x.id===id;}); return c?c.label:"其他";
}
function moneyCatIcon(id){
  var c = (CFG.moneyCategories||[]).find(function(x){return x.id===id;}); return c?c.icon:"✨";
}

function renderMoney(){
  var d = new Date();
  var b = buildMoney(d);
  var list = b.list.slice();
  // 筛选
  if(moneyFilter==="today") list = list.filter(function(x){return x.date===todayKey(d);});
  else if(moneyFilter==="week"){
    var wk = new Date(d.getFullYear(),d.getMonth(),d.getDate()-d.getDay());
    list = list.filter(function(x){return new Date(x.date)>=wk;});
  }
  else if(moneyFilter==="month"){
    var m = d.getFullYear()+"-"+pad(d.getMonth()+1);
    list = list.filter(function(x){return x.date&&x.date.indexOf(m)===0;});
  }
  var cats = (CFG.moneyCategories||[]).map(function(c){return '<option value="'+c.id+'">'+c.icon+' '+c.label+'</option>';}).join("");
  var tabs = '<button class="tab'+(moneyFilter==='all'?' active':'')+'" data-mf="all">全部</button>'+
    '<button class="tab'+(moneyFilter==='today'?' active':'')+'" data-mf="today">今日</button>'+
    '<button class="tab'+(moneyFilter==='week'?' active':'')+'" data-mf="week">本周</button>'+
    '<button class="tab'+(moneyFilter==='month'?' active':'')+'" data-mf="month">本月</button>';
  var itemsHtml = list.length?list.map(function(m){
    return '<label class="li'+(m.reconciled?' done':'')+'" data-mid="'+m.id+'">'+
      '<input type="checkbox" data-mreconcile="'+m.id+'" '+(m.reconciled?'checked':'')+'>'+
      '<span style="font-size:16px;">'+moneyCatIcon(m.category)+'</span>'+
      '<div class="li-body"><div>'+esc(moneyCatLabel(m.category))+' · '+esc(m.note||"(无备注)")+'</div>'+
      '<div class="li-meta">'+esc(m.date)+'</div></div>'+
      '<span class="li-amt">¥'+esc((+m.amount).toFixed(2))+'</span>'+
      '<button class="btn-del" data-mdel="'+m.id+'">✕</button></label>';
  }).join("") : '<div class="empty-tip">还没有记账</div>';
  document.getElementById("m-money").innerHTML =
    '<h2 class="panel-title">💰 日常记账</h2>'+
    '<div class="panel-sub">金额 · 分类 · 备注</div>'+
    '<div class="stat-row">'+
      '<div class="stat-card c1"><div class="num">¥'+b.stats.today+'</div><div class="lbl">今日支出</div></div>'+
      '<div class="stat-card c2"><div class="num">¥'+b.stats.month+'</div><div class="lbl">本月支出</div></div>'+
      '<div class="stat-card c3"><div class="num">'+b.stats.count+'</div><div class="lbl">本月笔数</div></div>'+
    '</div>'+
    '<div class="form-row">'+
      '<input id="moneyAmt" class="inp-amt" type="number" step="0.01" min="0" placeholder="金额">'+
      '<select id="moneyCat" class="inp-cat">'+cats+'</select>'+
      '<input id="moneyNote" class="inp-text" placeholder="备注" maxlength="40">'+
      '<button class="btn-primary" id="moneyAdd">+ 记一笔</button>'+
    '</div>'+
    '<div class="tabs" id="moneyTabs">'+tabs+'</div>'+
    '<div id="moneyList">'+itemsHtml+'</div>';
  bindMoney();
}

function bindMoney(){
  var a = document.getElementById("moneyAdd");
  if(a) a.onclick = function(){
    var amt = parseFloat(document.getElementById("moneyAmt").value||"0");
    if(!amt){alert("请输入金额");return;}
    var note = document.getElementById("moneyNote").value.trim();
    var cat = document.getElementById("moneyCat").value;
    var arr = getMoney();
    arr.unshift({id:uid(), date:todayKey(new Date()), amount:amt, category:cat, note:note, reconciled:false});
    setMoney(arr);renderMoney();
  };
  document.querySelectorAll("#moneyTabs .tab").forEach(function(b){
    b.onclick = function(){moneyFilter=b.getAttribute("data-mf");renderMoney();};
  });
  document.querySelectorAll("#m-money input[data-mreconcile]").forEach(function(cb){
    cb.onchange = function(){
      var id = cb.getAttribute("data-mreconcile");
      var arr = getMoney(); var m = arr.find(function(x){return x.id===id;}); if(m){m.reconciled=cb.checked;setMoney(arr);}
      var li = cb.closest(".li"); if(li) li.classList.toggle("done", cb.checked);
    };
  });
  document.querySelectorAll("#m-money .btn-del[data-mdel]").forEach(function(b){
    b.onclick = function(){
      var id = b.getAttribute("data-mdel");
      setMoney(getMoney().filter(function(x){return x.id!==id;})); renderMoney();
    };
  });
}

/* ============ 存钱计划 ============ */
function buildSaving(){return {list:getSavings()};}

function renderSaving(){
  var b = buildSaving();
  var totalT = b.list.reduce(function(s,x){return s+(+x.target||0);},0);
  var totalS = b.list.reduce(function(s,x){return s+(+x.saved||0);},0);
  var pct = totalT?Math.round(totalS/totalT*100):0;
  var cardsHtml = b.list.length?b.list.map(function(s){
    var sp = s.target?Math.round(((+s.saved||0)/s.target)*100):0;
    if(sp>100) sp=100;
    return '<div class="save-card" data-sid="'+s.id+'">'+
      '<div class="sh"><div class="sn">'+esc(s.name)+'</div><div class="sp">¥'+esc((+s.saved||0).toFixed(0))+' / ¥'+esc((+s.target).toFixed(0))+' · '+sp+'%</div></div>'+
      '<div class="bar"><div class="bar-fill" style="width:'+sp+'%"></div></div>'+
      '<div class="sp" style="margin-top:6px;">截止：'+esc(s.deadline||"未设")+'</div>'+
      '<div class="sl"><input type="number" min="0" step="0.01" placeholder="存一笔金额" class="inp-amt" data-saveamt="'+s.id+'"><button class="btn-primary" data-saveadd="'+s.id+'">+ 存一笔</button><button class="btn-del" data-savedel="'+s.id+'">删</button></div></div>';
  }).join(""):'<div class="empty-tip">还没有存钱目标</div>';
  document.getElementById("m-saving").innerHTML =
    '<h2 class="panel-title">🏦 存钱计划</h2>'+
    '<div class="panel-sub">为梦想存钱,一步一步来</div>'+
    '<div class="quote-card plan-section"><b>总进度</b>：¥'+totalS.toFixed(0)+' / ¥'+totalT.toFixed(0)+' · '+pct+'%<div class="bar" style="margin-top:8px;"><div class="bar-fill" style="width:'+pct+'%"></div></div></div>'+
    '<div class="sub-block-hd">🎯 我的目标</div><div id="savingList">'+cardsHtml+'</div>'+
    '<div class="sub-block-hd" style="margin-top:12px;">➕ 添加目标</div>'+
    '<div class="form-row">'+
      '<input id="svName" class="inp-text" placeholder="目标名称(如：换新手机)">'+
      '<input id="svTarget" class="inp-amt" type="number" min="0" placeholder="目标金额">'+
      '<input id="svDeadline" class="inp-text" type="date">'+
      '<button class="btn-primary" id="svAdd">+ 新建</button>'+
    '</div>';
  bindSaving();
}

function bindSaving(){
  var a = document.getElementById("svAdd");
  if(a) a.onclick = function(){
    var n = document.getElementById("svName").value.trim();
    var t = parseFloat(document.getElementById("svTarget").value||"0");
    var dl = document.getElementById("svDeadline").value;
    if(!n||!t){alert("请输入名称和目标金额");return;}
    var arr = getSavings();
    arr.push({id:uid(), name:n, target:t, saved:0, deadline:dl});
    setSavings(arr);renderSaving();
  };
  document.querySelectorAll("#m-saving [data-saveadd]").forEach(function(b){
    b.onclick = function(){
      var id = b.getAttribute("data-saveadd");
      var inp = document.querySelector('[data-saveamt="'+id+'"]');
      var v = parseFloat((inp&&inp.value)||"0");
      if(!v){alert("请输入金额");return;}
      var arr = getSavings();var s = arr.find(function(x){return x.id===id;});if(s){s.saved=(+s.saved||0)+v;setSavings(arr);renderSaving();}
    };
  });
  document.querySelectorAll("#m-saving [data-savedel]").forEach(function(b){
    b.onclick = function(){
      var id = b.getAttribute("data-savedel");
      setSavings(getSavings().filter(function(x){return x.id!==id;})); renderSaving();
    };
  });
}

/* ============ 树洞 ============ */
function renderTree(){
  var list = getTree();
  var itemsHtml = list.length?list.map(function(t){
    return '<label class="note-item'+(t.done?' done':'')+'" data-tid="'+t.id+'">'+
      '<input type="checkbox" data-tdone="'+t.id+'" '+(t.done?'checked':'')+'> '+
      esc(t.text)+'<div class="nm">'+esc(t.date)+'</div></label>';
  }).join(""):'<div class="empty-tip">树洞空空,说点什么吧~</div>';
  document.getElementById("m-tree").innerHTML =
    '<h2 class="panel-title">🌳 树洞</h2>'+
    '<div class="panel-sub">不想说的话,都丢进树洞里</div>'+
    '<div class="quote-card plan-section"><textarea id="treeText" placeholder="今天想说点什么..." style="width:100%;min-height:80px;border:1px solid var(--line);border-radius:10px;padding:8px;font-size:13px;"></textarea>'+
    '<div style="text-align:right;margin-top:6px;"><button class="btn-primary" id="treeAdd">丢进树洞</button></div></div>'+
    '<div class="sub-block-hd">🍂 已埋下的心事</div><div id="treeList">'+itemsHtml+'</div>';
  bindTree();
}

function bindTree(){
  var a = document.getElementById("treeAdd");
  if(a) a.onclick = function(){
    var txt = document.getElementById("treeText").value.trim();
    if(!txt){alert("写点什么再丢进来~");return;}
    var arr = getTree();
    arr.unshift({id:uid(), text:txt, date:todayKey(new Date()), done:false});
    setTree(arr);renderTree();
  };
  document.querySelectorAll("#m-tree input[data-tdone]").forEach(function(cb){
    cb.onchange = function(){
      var id = cb.getAttribute("data-tdone");
      var arr = getTree();var t = arr.find(function(x){return x.id===id;});if(t){t.done=cb.checked;setTree(arr);}
      var li = cb.closest(".note-item");if(li)li.classList.toggle("done",cb.checked);
    };
  });
  // 删除(长按/右键简化：直接复用 m-saving 风格的删按钮？树洞条目用双击删除)
  document.querySelectorAll("#m-tree .note-item").forEach(function(li){
    li.ondblclick = function(){
      var id = li.getAttribute("data-tid");
      if(confirm("删掉这条心事?")){setTree(getTree().filter(function(x){return x.id!==id;}));renderTree();}
    };
  });
}/* ============ 历史记录（阅读/观影/运动 按天汇总） ============ */
function buildHistory(){
  var dates = {};
  function slot(d){ if(!dates[d]) dates[d]={read:0, movies:[], exercise:null}; return dates[d]; }
  // 阅读：按天勾选日志
  getReadLog().forEach(function(e){ if(e && e.date) slot(e.date).read++; });
  // 观影：已看影片的添加日期
  getMoviesWatched().forEach(function(m){ if(m && m.date) slot(m.date).movies.push(m); });
  // 运动：逐日打卡记录
  if(window.localStorage){
    for(var i=0;i<localStorage.length;i++){
      var k=localStorage.key(i);
      if(k && k.indexOf("wb_exercise_log_")===0){
        var d=k.replace("wb_exercise_log_","");
        var o=lsJSON(k,null);
        if(o && (o.done || (o.note&&o.note.trim()))){ slot(d).exercise=o; }
      }
    }
  }
  var arr=Object.keys(dates).map(function(d){return {date:d, data:dates[d]};});
  arr.sort(function(a,b){return b.date.localeCompare(a.date);});
  return arr;
}
function renderHistory(){
  var list=buildHistory();
  var html='<h2 class="panel-title">📚 历史记录</h2>'+
    '<div class="panel-sub">阅读 / 观影 / 运动的每日数据 · 越往后越完整</div>';
  if(list.length===0){
    html+='<div class="empty-tip">还没有历史记录，去打卡后这里会按天汇总 ✨</div>';
  } else {
    list.forEach(function(it){
      var d=it.date, dt=it.data;
      var lines=[];
      if(dt.read>0) lines.push('📖 阅读 '+dt.read+' 章');
      if(dt.movies.length>0) lines.push('🎬 观影 '+dt.movies.length+' 部：'+dt.movies.map(function(m){return m.title;}).join('、'));
      if(dt.exercise) lines.push('🧘 运动 '+(dt.exercise.done?'✓':'')+(dt.exercise.note?(' · '+dt.exercise.note):''));
      html+='<div class="li"><div class="li-body"><div style="font-weight:700;color:var(--ink);">'+d+'</div>'+
        '<div class="li-meta">'+(lines.length?lines.join('<br>'):'（无记录）')+'</div></div></div>';
    });
  }
  document.getElementById("m-history").innerHTML=html;
}

/* ============ 主题换肤（设置板块） ============ */
function applyTheme(id){
  var list = CFG.themes || [];
  var t = null;
  for(var i=0;i<list.length;i++){ if(list[i].id===id){t=list[i];break;} }
  if(!t) t = list[0];
  if(!t) return;
  var root = document.documentElement;
  for(var k in t.vars){ root.style.setProperty(k, t.vars[k]); }
  lsSet("wb_theme", t.id);
}
function renderSettings(){
  var list = CFG.themes || [];
  var cur = ls("wb_theme") || (CFG.themes&&CFG.themes[0]?CFG.themes[0].id:"zimeng");
  var sw = list.map(function(t){
    return '<button class="theme-sw'+(t.id===cur?' active':'')+'" data-theme="'+t.id+'" title="'+t.name+'" style="background:'+t.vars["--brand"]+';"></button>';
  }).join("");
  var curName = "梦紫";
  for(var i=0;i<list.length;i++){ if(list[i].id===cur){curName=list[i].name;break;} }
  document.getElementById("m-settings").innerHTML =
    '<h2 class="panel-title">⚙️ 设置</h2>'+
    '<div class="panel-sub">页面外观 · 莫兰迪色系一键换肤</div>'+
    '<div class="sub-block-hd">🎨 主题颜色</div>'+
    '<div class="theme-row">'+sw+'</div>'+
    '<div class="sub-block-hd" style="margin-top:12px;">ℹ️ 当前主题</div>'+
    '<div class="quote-card plan-section" id="curThemeName">'+curName+'</div>'+
    '<div class="sub-block-hd" style="margin-top:12px;">🗑️ 数据说明</div>'+
    '<div class="quote-card plan-section">所有数据均按天保存在本机浏览器(localStorage)，不会上传服务器。换主题只改颜色，不删数据。</div>';
  document.querySelectorAll("#m-settings .theme-sw").forEach(function(b){
    b.onclick = function(){
      applyTheme(b.getAttribute("data-theme"));
      renderSettings();
    };
  });
}

/* ============ 最近 N 天小计（单模块自查） ============ */
function lastNDatesKey(n){
  var out=[], base=new Date();
  for(var i=0;i<n;i++) out.push(todayKey(new Date(base.getFullYear(),base.getMonth(),base.getDate()-i)));
  return out;
}
function sum7read(){
  var k=lastNDatesKey(7);
  return getReadLog().filter(function(e){return k.indexOf(e.date)>=0;}).length;
}
function sum7movie(){
  var k=lastNDatesKey(7);
  return getMoviesWatched().filter(function(m){return m.date&&k.indexOf(m.date)>=0;}).length;
}
function sum7exercise(){
  var k=lastNDatesKey(7), done=0, rec=0;
  for(var i=0;i<localStorage.length;i++){
    var key=localStorage.key(i);
    if(key&&key.indexOf("wb_exercise_log_")===0){
      var d=key.replace("wb_exercise_log_","");
      if(k.indexOf(d)>=0){ var o=lsJSON(key,null); if(o&&o.done) done++; if(o&&(o.done||(o.note&&o.note.trim()))) rec++; }
    }
  }
  return {done:done, rec:rec};
}

/* app.js part 7 — 旧模块移植：睡眠 / 护肤 / 三电英语 / 今日便签 */
function buildSleep(d){
  var p = CFG.profile, s = CFG.sleep, g = CFG.goals;
  var health = getHealth(d);
  var now = d.getHours()*60+d.getMinutes();
  var bedtime = parseTime(s.defaultBedtime);
  var wake = parseTime(p.wakeTime);
  if(health.fatigue>=4) bedtime = parseTime(s.highFatigueBedtime);
  var sleepMins = wake>now ? wake-now+1440 : wake-now;
  sleepMins = sleepMins - s.windDownMinutes - s.sleepCycleMinutes;
  var cycles = Math.max(0, Math.floor(sleepMins/s.sleepCycleMinutes));
  return {bedtime:fmtTime(bedtime), wake:fmtTime(wake), cycles:cycles, quality:health.sleepQuality, fatigue:health.fatigue, wind:s.windDownMinutes};
}
function renderSleep(){
  var d = new Date();
  var b = buildSleep(d);
  document.getElementById("m-sleep").innerHTML =
    '<h2 class="panel-title">🌙 睡眠管理</h2>'+
    '<div class="panel-sub">反向计算最佳入睡时间</div>'+
    '<div class="quote-card plan-section"><b>🎯 建议入睡：'+b.bedtime+'</b><br>'+
    '起床 '+b.wake+' · 需 '+b.wind+'min 缓冲 + '+b.cycles+' 个睡眠周期</div>'+
    '<div class="sub-block-hd">💤 今日状态</div>'+
    '<div class="quote-card">睡眠质量 '+b.quality+'/5 · 疲劳 '+b.fatigue+'/5</div>'+
    '<div class="quote-card" style="margin-top:10px;"><b>睡前仪式</b><br>· 23:00 后远离手机<br>· 拉伸放松 5 分钟<br>· 听轻音乐入眠<br>· 早起时间：'+b.wake+'</div>';
}

/* ============ 护肤 ============ */
function renderSkincare(){
  var d = new Date();
  var s = CFG.skincare;
  var wd = isWorkday(d);
  var m = wd?s.morningTime:s.weekendMorningTime;
  var n = wd?s.nightTime:s.weekendNightTime;
  document.getElementById("m-skincare").innerHTML =
    '<h2 class="panel-title">💧 护肤提醒</h2>'+
    '<div class="panel-sub">日护 + 夜护 · 每天两次</div>'+
    '<div class="quote-card plan-section"><b>🌅 早 '+m+'</b><br>洁面 → 爽肤水 → 精华 → 乳液 → 防晒</div>'+
    '<div class="quote-card plan-section"><b>🌙 晚 '+n+'</b><br>卸妆 → 洁面 → 面膜 → 精华 → 面霜</div>'+
    '<div class="empty-tip">坚持 28 天,皮肤真的会变好 ✨</div>';
}

/* ============ 三电英语文章 ============ */
function pickArticles(d){ return seededShuffle(CT.ARTICLES, seedFromDate(d)+11).slice(0,3); }
function renderArticles(){
  var d = new Date();
  var arts = pickArticles(d);
  var html = '<h2 class="panel-title">🔋 三电 / 英语</h2>'+
    '<div class="panel-sub">每日 3 篇 · 中英对照 · '+CFG.reminders.english+' 提醒 <button class="btn-ghost" id="enRemindBtn">开启桌面提醒</button></div>';
  arts.forEach(function(a){
    html += '<div class="quote-card plan-section"><b>'+esc(a.title)+'</b><div class="biling-toggle" style="margin:6px 0;"><button class="bt active" data-bi="en">EN</button><button class="bt" data-bi="zh">中文</button></div>'+
      '<div class="art-en" data-bilang="en">'+a.en.map(function(p){return '<p>'+esc(p)+'</p>';}).join("")+'</div>'+
      '<div class="art-zh" data-bilang="zh" style="display:none;">'+a.zh.map(function(p){return '<p>'+esc(p)+'</p>';}).join("")+'</div></div>';
  });
  document.getElementById("m-articles").innerHTML = html;
  // 绑定语言切换
  document.querySelectorAll("#m-articles .biling-toggle").forEach(function(tg){
    var btns = tg.querySelectorAll(".bt");
    btns.forEach(function(b){
      b.onclick = function(){
        var lang = b.getAttribute("data-bi");
        btns.forEach(function(x){x.classList.toggle("active", x===b);});
        tg.parentElement.querySelectorAll("[data-bilang]").forEach(function(p){p.style.display = (p.getAttribute("data-bilang")===lang)?"":"none";});
      };
    });
  });
  var rb = document.getElementById("enRemindBtn"); if(rb) rb.onclick = requestRemindPerm;
}

/* ============ 今日便签 ============ */
function renderNote(){
  var d = new Date();
  var note = getNote(d);
  document.getElementById("m-note").innerHTML =
    '<h2 class="panel-title">📝 今日便签</h2>'+
    '<div class="panel-sub">随手记 · 按天保存</div>'+
    '<div class="quote-card plan-section"><textarea id="noteArea" placeholder="今天的小灵感、小反思..." style="width:100%;min-height:200px;border:1px solid var(--line);border-radius:10px;padding:10px;font-size:13px;">'+esc(note)+'</textarea>'+
    '<div style="text-align:right;margin-top:6px;"><button class="btn-primary" id="noteSave">保存</button></div></div>';
  var sv = document.getElementById("noteSave");
  if(sv) sv.onclick = function(){setNote(d, document.getElementById("noteArea").value); alert("已保存 ✅");};
  // 自动保存 (blur)
  var ar = document.getElementById("noteArea");
  if(ar) ar.onblur = function(){setNote(d, ar.value);};
}

/* ============ 半夜 00:00 自动刷新 ============ */
let midnightTimer = null;
function scheduleMidnight(){
  if(midnightTimer) clearTimeout(midnightTimer);
  var n = new Date();
  var next = new Date(n.getFullYear(), n.getMonth(), n.getDate()+1, 0, 0, 5);
  midnightTimer = setTimeout(function(){ renderAll(); scheduleMidnight(); }, next-n);
}/* app.js part 8 — startup / renderAll / 关闭 IIFE */
function renderAll(){
  try{renderHeader();}catch(e){console.error("renderHeader",e);}
  try{renderPlan();}catch(e){console.error("renderPlan",e);}
  try{renderMood();}catch(e){console.error("renderMood",e);}
  try{renderReading();}catch(e){console.error("renderReading",e);}
  try{renderMovies();}catch(e){console.error("renderMovies",e);}
  try{renderExercise();}catch(e){console.error("renderExercise",e);}
  try{renderMoney();}catch(e){console.error("renderMoney",e);}
  try{renderSaving();}catch(e){console.error("renderSaving",e);}
  try{renderTree();}catch(e){console.error("renderTree",e);}
  try{renderHistory();}catch(e){console.error("renderHistory",e);}
  try{renderSettings();}catch(e){console.error("renderSettings",e);}
  try{renderSleep();}catch(e){console.error("renderSleep",e);}
  try{renderSkincare();}catch(e){console.error("renderSkincare",e);}
  try{renderArticles();}catch(e){console.error("renderArticles",e);}
  try{renderNote();}catch(e){console.error("renderNote",e);}
}

function startup(){
  setupNav();
  var savedTheme = ls("wb_theme");
  if(savedTheme) applyTheme(savedTheme);
  renderAll();
  var cb = document.querySelector("#modal .modal-close");
  if(cb) cb.addEventListener("click", closeModal);
  var md = document.getElementById("modal");
  if(md) md.addEventListener("click", function(e){ if(e.target.id==="modal") closeModal(); });
  document.addEventListener("visibilitychange", function(){ if(!document.hidden) renderAll(); });
  // 抽屉菜单：hamburger 点击展开/收起；背景点击收起
  var hd=document.getElementById("header");
  if(hd) hd.addEventListener("click", function(e){ if(e.target && e.target.id==="hamburger") toggleSidebar(); });
  var bd=document.getElementById("backdrop");
  if(bd) bd.addEventListener("click", closeSidebar);
  scheduleMidnight();
  scheduleReminders();
}

function closeModal(){ var m = document.getElementById("modal"); if(m) m.classList.remove("open"); }

if(document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", startup);
} else {
  startup();
}

})();