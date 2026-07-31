/* app.js part 1 — 基础设施：IIFE/工具/localStorage/导航 */
(function(){
"use strict";
var CFG = window.WB_CONFIG || {};
var CT = window.WB_CONTENT || {};

/* ============ 通用工具 ============ */
function pad(n){return n<10?"0"+n:""+n;}
function todayKey(d){d=d||new Date();return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());}
function yesterdayDate(d){d=d||new Date();return new Date(d.getFullYear(),d.getMonth(),d.getDate()-1);}
function parseTime(s){var p=s.split(":");return parseInt(p[0],10)*60+parseInt(p[1]||"0",10);}
function fmtTime(m){m=((m%1440)+1440)%1440;return pad(Math.floor(m/60))+":"+pad(m%60);}
function seedFromDate(d){return d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate();}
function seededShuffle(arr,seed){var a=arr.slice(),r=(seed%2147483647)||1;for(var i=a.length-1;i>0;i--){r=(r*16807)%2147483647;var j=r%(i+1);var t=a[i];a[i]=a[j];a[j]=t;}return a;}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c];});}
function el(tag,attrs,html){var e=document.createElement(tag);if(attrs)for(var k in attrs){if(k==="class")e.className=attrs[k];else if(k==="html")e.innerHTML=attrs[k];else e.setAttribute(k,attrs[k]);}if(html!=null)e.innerHTML=html;return e;}
function isWorkday(d){d=d||new Date();var k=todayKey(d);if((CFG.workdays||[]).indexOf(k)>=0)return true;if((CFG.holidays||[]).indexOf(k)>=0)return false;var w=d.getDay();return w>=1&&w<=5;}
function fmtDate(d){return d.getFullYear()+"年"+(d.getMonth()+1)+"月"+d.getDate()+"日";}
function shortDate(d){return (d.getMonth()+1)+"/"+d.getDate();}
function fmtH(h){var hh=Math.floor(h);var mm=Math.round((h-hh)*60);return hh+"小时"+(mm?mm+"分":"");}
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
function sleepSelfKey(d){return "wb_sleep_self_"+todayKey(d);}
function getSleepSelf(d){return lsJSON(sleepSelfKey(d),null);}
function setSleepSelf(d,o){lsSetJSON(sleepSelfKey(d),o);}

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
/* 把日志键 "书名#章节号" 解析成可读的「《书名》第n章《章节标题》」 */
function resolveReadKey(key){
  if(!key || key.indexOf("#")<0) return null;
  var idx = key.lastIndexOf("#");
  var title = key.substring(0, idx);
  var n = parseInt(key.substring(idx+1), 10);
  var books = (CFG.reading && CFG.reading.books) || [];
  for(var i=0;i<books.length;i++){
    if(books[i].title===title){
      var chs = books[i].chapters||[];
      for(var j=0;j<chs.length;j++){ if(chs[j].n===n){ return {book:title, chapter:"第 "+n+" 章《"+esc(chs[j].title)+"》"}; } }
      return {book:title, chapter:"第 "+n+" 章"};
    }
  }
  return {book:title, chapter:"第 "+n+" 章"};
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

/* 每周训练计划（按天保存每个动作的完成状态） */
function planKeyStr(s){return "wb_exercise_plan_"+s;}
function getPlanDoneByKey(s){return lsJSON(planKeyStr(s),{});}
function setPlanDoneByKey(s,id,done){var o=getPlanDoneByKey(s);if(done)o[id]=true;else delete o[id];lsSetJSON(planKeyStr(s),o);}
function syncPlanToLog(d){
  var pd=getPlanDoneByKey(todayKey(d));
  var cnt=0; for(var k in pd){ if(pd[k]) cnt++; }
  var ex=getExerciseLog(d)||{done:false,note:""};
  if(cnt>0) ex.done=true;          // 计划里有勾选 → 当天视为已运动；不覆盖已有备注
  setExerciseLog(d,ex);
}
function buildWorkoutPlan(){
  var plan=CFG.workoutPlan||[];
  var now=new Date();
  var dow=now.getDay(); // 0=周日..6=周六
  var mondayOffset=(dow===0?-6:1-dow);
  var monday=new Date(now.getFullYear(),now.getMonth(),now.getDate()+mondayOffset);
  return plan.map(function(tpl,i){
    var dt=new Date(monday.getFullYear(),monday.getMonth(),monday.getDate()+i);
    var isToday=(dt.getFullYear()===now.getFullYear()&&dt.getMonth()===now.getMonth()&&dt.getDate()===now.getDate());
    var done=getPlanDoneByKey(todayKey(dt));
    var exs=(tpl.exercises||[]).map(function(e){return {e:e,checked:!!done[e.id]};});
    var doneCount=0; exs.forEach(function(x){if(x.checked)doneCount++;});
    return {tpl:tpl,date:dt,dateKey:todayKey(dt),isToday:isToday,exs:exs,doneCount:doneCount,total:exs.length};
  });
}
function workoutPlanHtml(){
  var wk=buildWorkoutPlan();
  var cards=wk.map(function(w){
    var exItems=w.exs.map(function(x){
      return '<label class="wk-ex'+(x.checked?' done':'')+'">'+
        '<input type="checkbox" data-plan-date="'+w.dateKey+'" data-plan-id="'+x.e.id+'" '+(x.checked?'checked':'')+'>'+
        '<span class="wk-ex-name">'+esc(x.e.name)+'</span>'+
        '<span class="wk-ex-rep">'+x.e.sets+' 组 × '+esc(x.e.reps)+'</span></label>';
    }).join("");
    return '<div class="wk-day'+(w.isToday?' today':'')+'">'+
      '<div class="wk-day-hd"><span class="wk-emo">'+w.tpl.emoji+'</span>'+
      '<span class="wk-name">'+w.tpl.day+' · '+esc(w.tpl.focus)+'</span>'+
      (w.isToday?'<span class="wk-today">今天</span>':'')+
      '<span class="wk-count">'+w.doneCount+'/'+w.total+'</span></div>'+
      (w.tpl.tag?'<div class="wk-tag">'+esc(w.tpl.tag)+'</div>':'')+
      '<div class="wk-ex-list">'+exItems+'</div></div>';
  }).join("");
  return '<div class="sub-block-hd" style="margin-top:14px;">🏋️ 本周训练计划（做了哪个勾哪个）</div><div class="wk-plan">'+cards+'</div>';
}

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
  var endMin=parseTime(CFG.profile.workEnd);
  var endDt=new Date(d.getFullYear(),d.getMonth(),d.getDate(),Math.floor(endMin/60),endMin%60,0,0);
  var remMs=endDt-d.getTime();
  if(remMs<=0){el.innerHTML="🎉 已下班，好好休息~";return;}
  var ms=remMs%1000;
  var totalSec=Math.floor(remMs/1000);
  var ss=totalSec%60;
  var mm=Math.floor(totalSec/60)%60;
  var hh=Math.floor(totalSec/3600);
  var ms3=("00"+ms).slice(-3);
  var t=(hh>0?pad(hh)+":":"")+pad(mm)+":"+pad(ss)+'<span class="cd-ms">.'+ms3+'</span>';
  el.innerHTML="⏳ 下班倒计时 <b>"+t+"</b>";
}

function renderPlan(){
  var d=new Date();
  var b=buildPlan(d);
  var wrap=document.getElementById("m-plan");
  var wd=isWorkday(d);
  var countdownHtml=wd?'<div id="countdown" class="countdown"></div>':"";
  // 昨日记录：0点翻页后保留前一天的待办与运动打卡，仅在确有数据时展示
  var yd=yesterdayDate(d), ykey=todayKey(yd);
  var yTasks=getWorkTasks(yd), yEx=getExerciseLog(yd);
  var yBlocks=[];
  if(yEx&&(yEx.done||(yEx.note&&yEx.note.trim()))) yBlocks.push('<div class="yest-item">🏃 运动打卡：'+(yEx.done?'已完成 ✓':'未打卡')+(yEx.note?(' · '+esc(yEx.note)):'')+'</div>');
  if(yTasks.length){
    var yDone=yTasks.filter(function(t){return t.done;}).length;
    var yList=yTasks.map(function(t){return '<div class="yest-item"><span class="yest-ck">'+(t.done?'✅':'⬜')+'</span> '+esc(t.text)+'</div>';}).join("");
    yBlocks.push('<div class="yest-item">📋 昨日待办（'+yDone+' / '+yTasks.length+' 完成）</div>'+yList);
  }
  var yestHtmlPlan=yBlocks.length?'<div class="sub-block-hd" style="margin-top:16px;">📅 昨日记录（'+ykey+'）</div><div class="yest-box">'+yBlocks.join("")+'</div>':'';
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
    '<div class="plan-section"><div class="sub-block-hd">✅ 今日已完成</div><div id="wtDone"></div></div>'+
    yestHtmlPlan;
  // 渲染待办/已完成
  var pendEl=document.getElementById("wtPending");
  if(b.pends.length===0){pendEl.innerHTML='<div class="empty-tip">还没有待办任务</div>';}
  else{pendEl.innerHTML=b.pends.map(function(t){return '<label class="li" data-wti="'+t.id+'"><input type="checkbox" data-wt="'+t.id+'"><span class="li-body">'+esc(t.text)+'</span><button class="btn-del" data-wtdel="'+t.id+'">✕</button></label>';}).join("");}
  var doneEl=document.getElementById("wtDone");
  if(b.dones.length===0){doneEl.innerHTML='<div class="empty-tip">还没已完成的任务</div>';}
  else{doneEl.innerHTML=b.dones.map(function(t){return '<label class="li done" data-wti="'+t.id+'"><input type="checkbox" data-wt="'+t.id+'" checked><span class="li-body">'+esc(t.text)+'</span></label>';}).join("");}
  bindPlan();
  if(wd){if(countdownTimer)clearInterval(countdownTimer);tickCountdown();countdownTimer=setInterval(tickCountdown,40);}
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
  // 昨日记录：展示前一天的心情（仅确有数据时）
  var yd=yesterdayDate(d), yMood=getMood(yd), yestHtmlMood="";
  if(yMood&&(yMood.mood||(yMood.text&&yMood.text.trim()))){
    var ym=ml.find(function(x){return x.id===yMood.mood;})||{};
    yestHtmlMood='<div class="sub-block-hd" style="margin-top:16px;">📅 昨日心情（'+todayKey(yd)+'）</div><div class="yest-box"><div class="yest-item">'+(ym.emo||"🙂")+' '+(ym.label||"")+(yMood.text?(' · '+esc(yMood.text)):'')+'</div></div>';
  }
  document.getElementById("m-mood").innerHTML=
    '<h2 class="panel-title">💗 心情记录</h2>'+
    '<div class="panel-sub">你今天感觉怎么样?</div>'+
    '<div class="mood-grid">'+cards+'</div>'+
    '<div class="quote-card plan-section"><b>📓 心情日记</b><br><textarea id="moodText" placeholder="今天还没有记录心情哦~" style="width:100%;margin-top:8px;min-height:70px;border:1px solid var(--line);border-radius:10px;padding:8px;font-size:13px;">'+esc(today.text||"")+'</textarea>'+
    '<div style="text-align:right;margin-top:6px;"><button class="btn-primary" id="moodSave">保存今日心情</button></div></div>'+
    historyHtml+yestHtmlMood;
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
function getMonthBooks(d){
  var books = CFG.reading.books.slice(0, CFG.reading.booksPerMonth);
  var first = CFG.reading.firstBook;
  if(first) books.sort(function(a,b){return (a.title===first?-1:b.title===first?1:0);});
  return books;
}

var readSub = "web"; // 读书子页：web(网络文学) / physical(实体书籍) / reco(推荐)

function getReadUserBooks(){return lsJSON("wb_read_user_books",[]);}
function setReadUserBooks(a){lsSetJSON("wb_read_user_books",a);}
function getReadBookDone(){return lsJSON("wb_read_book_done",{});}
function setReadBookDone(o){lsSetJSON("wb_read_book_done",o);}

function buildReading(d, type){
  var books = (CFG.reading.books||[]).slice();
  if(type) books = books.filter(function(b){return b.type===type;});
  if(CFG.reading.firstBook) books.sort(function(a,b){return (a.title===CFG.reading.firstBook?-1:b.title===CFG.reading.firstBook?1:0);});
  var flat = [];
  books.forEach(function(b){ (b.chapters||[]).forEach(function(c){ flat.push({book:b, ch:c}); }); });
  var total = flat.length;
  var done = getReadDone();
  var keyOf = function(it){ return it.book.title+"#"+it.ch.n; };
  var all = flat.map(function(it){ return {book:it.book, ch:it.ch, gi:keyOf(it), isDone:done.has(keyOf(it))}; });
  var unread = all.filter(function(x){ return !x.isDone; });
  var read = all.filter(function(x){ return x.isDone; });
  return {books:books, all:all, unread:unread, read:read, done:done.size, total:total};
}

function renderReading(){
  var d = new Date();
  var wrap = document.getElementById("m-reading");
  var subTabs =
    '<button class="tab'+(readSub==='web'?' active':'')+'" data-rsub="web">📱 网络文学</button>'+
    '<button class="tab'+(readSub==='physical'?' active':'')+'" data-rsub="physical">📚 实体书籍</button>'+
    '<button class="tab'+(readSub==='reco'?' active':'')+'" data-rsub="reco">💡 推荐</button>';
  var head =
    '<h2 class="panel-title">📖 读书记录</h2>'+
    '<div class="panel-sub">读了就勾选，没读就不勾选 · '+CFG.reminders.reading+' 提醒 <button type="button" class="btn-ghost" id="rdRemindBtn">开启桌面提醒</button></div>'+
    '<div class="tabs" id="rdSubTabs">'+subTabs+'</div>';

  // 推荐页（书级「已读」勾选）
  if(readSub==='reco'){
    var bdone = getReadBookDone();
    var groups = (CT.readReco||[]);
    var totalN=0, totalDone=0;
    var html = head + '<div class="sub-block-hd">💡 推荐书单（勾选表示已读）</div>';
    groups.forEach(function(g){
      var items = g.items||[];
      var gd = items.filter(function(it){return bdone[it.id];}).length;
      totalN += items.length; totalDone += gd;
      var list = items.length?items.map(function(it){
        return '<div class="li reco-item'+(bdone[it.id]?' done':'')+'">'+
          '<input type="checkbox" class="rb-cb" data-rid="'+it.id+'"'+(bdone[it.id]?' checked':'')+'>'+
          '<div class="li-body"><div>《'+esc(it.title)+'》'+(it.author?' <span class="vtag bilibili" style="background:#a48cff">'+esc(it.author)+'</span>':'')+'</div>'+
          '<div class="li-meta">'+(it.note?esc(it.note):'')+'</div></div></div>';
      }).join("") : '<div class="empty-tip">暂无</div>';
      html += '<div class="reco-group"><div class="sub-block-hd">'+g.icon+' '+g.title+' <span class="reco-prog">'+gd+'/'+items.length+'</span></div><div class="reco-list">'+list+'</div></div>';
    });
    html += '<div class="quote-card plan-section" style="margin-top:12px;">📌 已读推荐 <b>'+totalDone+'</b> / '+totalN+' 本</div>';
    wrap.innerHTML = html;
    bindReading();
    return;
  }

  // 分类页（网络文学 / 实体书籍）
  var typeName = readSub==='web'?'网络文学':'实体书籍';
  var rd = buildReading(d, readSub);
  var pct = rd.total?Math.round(rd.done/rd.total*100):0;
  function chapItem(it){
    return '<div class="chapter'+(it.isDone?' done':'')+'" data-readk="'+it.gi+'">'+
      '<label class="rcheck"><input type="checkbox" data-read="'+it.gi+'" data-total="'+rd.total+'" '+(it.isDone?'checked':'')+'></label>'+
      '<div class="rc-body">'+
      '<div class="rc-t">《'+esc(it.book.title)+'》第 '+it.ch.n+' 章 · '+esc(it.ch.title)+'</div>'+
      '<div class="rc-sum">'+esc(it.ch.summary||'')+'</div>'+
      '<div class="rc-thought">❓ 思考：'+esc(it.ch.thought||'')+'</div>'+
      '</div></div>';
  }
  var unreadHtml = rd.unread.length ? rd.unread.map(chapItem).join("") : '<div class="rest">本类章节都读完啦，享受回味 🌟</div>';
  var readHtml = rd.read.length ? '<div class="sub-block-hd" style="margin-top:14px;">✅ 已读章节（'+rd.read.length+' 章 · 可取消勾选）</div>'+rd.read.map(chapItem).join("") : '';
  // 我的书架（用户添加，整本勾选）
  var userBooks = getReadUserBooks().filter(function(b){return b.type===readSub;});
  var bdone2 = getReadBookDone();
  var shelfHtml = userBooks.length ? userBooks.map(function(b){
    var dn = bdone2[b.id];
    return '<div class="li reco-item'+(dn?' done':'')+'">'+
      '<input type="checkbox" class="ub-cb" data-ubid="'+b.id+'"'+(dn?' checked':'')+'>'+
      '<div class="li-body"><div>《'+esc(b.title)+'》'+(b.author?' <span class="vtag bilibili" style="background:#a48cff">'+esc(b.author)+'</span>':'')+'</div>'+
      '<div class="li-meta">我的书架</div></div>'+
      '<div class="li-actions"><button class="btn-del" data-ubdel="'+b.id+'">删</button></div></div>';
  }).join("") : '<div class="empty-tip">书架还空，添加一本吧～</div>';
  // 昨日阅读（全类型，与「昨日记录」整体一致）
  var yd2=yesterdayDate(d), ykey2=todayKey(yd2);
  var yReads=getReadLog().filter(function(e){return e.date===ykey2;});
  var yestHtmlRead="";
  if(yReads.length){
    var ydet=yReads.map(function(e){var r=resolveReadKey(e.key);return r?('《'+esc(r.book)+'》'+r.chapter):'';}).filter(Boolean);
    yestHtmlRead='<div class="sub-block-hd" style="margin-top:16px;">📅 昨日阅读（'+ykey2+'）</div><div class="yest-box"><div class="yest-item">📖 阅读 '+yReads.length+' 章'+(ydet.length?('：'+ydet.join('、')):'')+'</div></div>';
  }
  wrap.innerHTML = head +
    '<div class="sub-block-hd">📚 '+typeName+'书单：'+rd.books.map(function(b){return '《'+esc(b.title)+'》';}).join("、")+'</div>'+
    '<div class="quote-card plan-section" style="margin-bottom:12px;">📊 最近7天小计：阅读 <b>'+sum7read()+'</b> 章</div>'+
    '<div class="sub-block-hd">📌 后续章节（待读 '+rd.unread.length+' 章）</div>'+
    unreadHtml+
    readHtml+
    '<div class="goal"><div class="bar"><div class="bar-fill" style="width:'+pct+'%"></div></div>'+
    '<div class="goal-sub">已完成 '+rd.done+' / '+rd.total+' 章 · '+pct+'%</div></div>'+
    '<div class="sub-block-hd" style="margin-top:16px;">📝 我的书架（整本勾选）</div>'+
    '<div class="form-row">'+
      '<input type="hidden" id="ubType" value="'+readSub+'">'+
      '<input id="ubTitle" class="inp-text" placeholder="书名" maxlength="60">'+
      '<input id="ubAuthor" class="inp-text" placeholder="作者（可选）" maxlength="40">'+
      '<button class="btn-primary" id="ubAdd">+ 加入书架</button>'+
    '</div>'+
    '<div id="ubList">'+shelfHtml+'</div>'+
    yestHtmlRead;
  bindReading();
}

function bindReading(){
  // 子页切换
  document.querySelectorAll("#rdSubTabs .tab").forEach(function(b){
    b.onclick=function(){readSub=b.getAttribute("data-rsub");renderReading();};
  });
  // 章节勾选（写入完成集合 + 阅读日志）
  document.querySelectorAll('#m-reading input[data-read]').forEach(function(cb){
    cb.onchange = function(){
      var gi = cb.getAttribute('data-read');
      setReadDone(gi, cb.checked);
      renderReading();
      renderHistory();
    };
  });
  // 推荐勾选（已读）
  document.querySelectorAll('#m-reading .rb-cb').forEach(function(cb){
    cb.onchange = function(){
      var rid=cb.getAttribute('data-rid');
      var o=getReadBookDone();
      if(cb.checked) o[rid]=1; else delete o[rid];
      setReadBookDone(o);
      renderReading();
    };
  });
  // 我的书架勾选
  document.querySelectorAll('#m-reading .ub-cb').forEach(function(cb){
    cb.onchange = function(){
      var id=cb.getAttribute('data-ubid');
      var o=getReadBookDone();
      if(cb.checked) o[id]=1; else delete o[id];
      setReadBookDone(o);
      renderReading();
    };
  });
  // 加入书架
  var ua=document.getElementById("ubAdd");
  if(ua) ua.onclick=function(){
    var t=document.getElementById("ubTitle").value.trim();
    if(!t){alert("请输入书名");return;}
    var arr=getReadUserBooks();
    arr.unshift({id:uid(), title:t, author:document.getElementById("ubAuthor").value.trim(), type:document.getElementById("ubType").value});
    setReadUserBooks(arr);renderReading();
  };
  // 删除书架
  document.querySelectorAll('#m-reading .btn-del[data-ubdel]').forEach(function(b){
    b.onclick=function(){
      var id=b.getAttribute('data-ubdel');
      setReadUserBooks(getReadUserBooks().filter(function(x){return x.id!==id;}));
      renderReading();
    };
  });
  // 提醒按钮
  var rb = document.getElementById('rdRemindBtn'); if(rb) rb.onclick = requestRemindPerm;
}
/* app.js part 4 — 观影记录(完整版：统计卡 + 筛选 + 已看/想看 双列表 + 增删改) */
var movieSub = "variety"; // 观影子页：variety / movie / tv / anime / reco

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

/* 推荐片单：已看勾选状态（键为 reco id） */
function getMovieRecoDone(){return lsJSON("wb_movie_reco_done",{});}
function setMovieRecoDone(o){lsSetJSON("wb_movie_reco_done",o);}

function renderMovies(){
  var d = new Date();
  var b = buildMovies();
  var wrap = document.getElementById("m-movie");
  var types = (CFG.movieTypes||[]);
  var subTabs = types.map(function(t){
    return '<button class="tab'+(movieSub===t.id?' active':'')+'" data-msub="'+t.id+'">'+t.icon+' '+t.label+'</button>';
  }).join("") + '<button class="tab'+(movieSub==='reco'?' active':'')+'" data-msub="reco">💡 推荐</button>';

  var head =
    '<h2 class="panel-title">🎬 影视存档本</h2>'+
    '<div class="panel-sub">值得收藏的影视作品</div>'+
    '<div class="stat-row">'+
      '<div class="stat-card c1"><div class="num">'+b.stats.watched+'</div><div class="lbl">已观看</div></div>'+
      '<div class="stat-card c2"><div class="num">'+b.stats.want+'</div><div class="lbl">想看</div></div>'+
      '<div class="stat-card c3"><div class="num">'+b.stats.month+'</div><div class="lbl">本月新增</div></div>'+
    '</div>'+
    '<div class="quote-card plan-section" style="margin-bottom:12px;">📊 最近7天小计：观影 <b>'+sum7movie()+'</b> 部</div>'+
    '<div class="tabs" id="mvSubTabs">'+subTabs+'</div>';

  // 推荐页
  if(movieSub==='reco'){
    var done = getMovieRecoDone();
    var groups = (CT.movieReco||[]);
    var totalN=0, totalDone=0;
    var html = head + '<div class="sub-block-hd">💡 推荐片单（勾选表示已观看）</div>';
    groups.forEach(function(g){
      var items = g.items||[];
      var gd = items.filter(function(it){return done[it.id];}).length;
      totalN += items.length; totalDone += gd;
      var list = items.length?items.map(function(it){
        return '<div class="li reco-item'+(done[it.id]?' done':'')+'" data-rid="'+it.id+'">'+
          '<input type="checkbox" class="reco-cb" data-rid="'+it.id+'"'+(done[it.id]?' checked':'')+'>'+
          '<div class="li-body"><div>'+esc(it.title)+' <span class="vtag bilibili" style="background:#a48cff">'+movieTypeLabel(it.type)+'</span> '+(it.rating?'⭐ '+it.rating:'')+'</div>'+
          '<div class="li-meta">'+(it.year?it.year+' · ':'')+esc(it.note||'')+'</div></div></div>';
      }).join("") : '<div class="empty-tip">暂无</div>';
      html += '<div class="reco-group"><div class="sub-block-hd">'+g.icon+' '+g.title+' <span class="reco-prog">'+gd+'/'+items.length+'</span></div><div class="reco-list">'+list+'</div></div>';
    });
    html += '<div class="quote-card plan-section" style="margin-top:12px;">📌 已看推荐 <b>'+totalDone+'</b> / '+totalN+' 部</div>';
    wrap.innerHTML = html;
    bindMovies();
    return;
  }

  // 分类页（综艺 / 电影 / 电视剧 / 动漫）
  var t = types.find(function(x){return x.id===movieSub;}) || types[0];
  var list = b.watched.filter(function(m){return m.type===movieSub;});
  var itemsHtml = list.length?list.map(function(m){
    return '<div class="li" data-mid="'+m.id+'">'+
      '<span style="font-size:18px;">'+movieTypeIcon(m.type)+'</span>'+
      '<div class="li-body"><div>'+esc(m.title)+' <span class="vtag bilibili" style="background:#a48cff">'+movieTypeLabel(m.type)+'</span> '+(m.rating?'⭐ '+m.rating:'')+'</div>'+
      '<div class="li-meta">'+esc(m.date||"")+(m.note?' · '+esc(m.note):'')+'</div></div>'+
      '<div class="li-actions"><button class="btn-edit" data-med="'+m.id+'">编辑</button><button class="btn-del" data-mdd="'+m.id+'">删</button></div></div>';
  }).join("") : '<div class="empty-tip">还没有已观看的'+t.label+'</div>';
  var wantList = b.want.filter(function(m){return m.type===movieSub;});
  var wantHtml = wantList.length?wantList.map(function(m){
    return '<div class="li" data-mwid="'+m.id+'">'+
      '<span style="font-size:18px;">'+movieTypeIcon(m.type)+'</span>'+
      '<div class="li-body"><div>'+esc(m.title)+' <span class="vtag bilibili" style="background:#a48cff">'+movieTypeLabel(m.type)+'</span></div>'+
      '<div class="li-meta">'+esc(m.note||"")+'</div></div>'+
      '<div class="li-actions"><button class="btn-edit" data-mwok="'+m.id+'">已看</button><button class="btn-del" data-mwdd="'+m.id+'">删</button></div></div>';
  }).join("") : '<div class="empty-tip">暂无'+t.label+'片单备选</div>';
  var ydm=yesterdayDate(d), yMovies=getMoviesWatched().filter(function(m){return m.date===todayKey(ydm);});
  var yestHtmlMovie=yMovies.length?'<div class="sub-block-hd" style="margin-top:16px;">📅 昨日观影（'+todayKey(ydm)+'）</div><div class="yest-box">'+yMovies.map(function(m){return '<div class="yest-item">🎬 '+esc(m.title)+(m.rating?(' · ⭐ '+m.rating):'')+'</div>';}).join("")+'</div>':'';
  wrap.innerHTML = head +
    '<div class="quote-card plan-section" style="margin-bottom:10px;">📂 当前板块：'+t.icon+' '+t.label+'（类型已锁定）</div>'+
    '<div class="form-row">'+
      '<input type="hidden" id="mvType" value="'+movieSub+'">'+
      '<input id="mvTitle" class="inp-text" placeholder="'+t.label+'名称" maxlength="60">'+
      '<input id="mvRating" class="inp-amt" placeholder="评分1-10" type="number" min="0" max="10" step="0.5">'+
      '<button class="btn-primary" id="mvAddWatched">+ 添加已看</button>'+
    '</div>'+
    '<div class="form-row">'+
      '<input type="hidden" id="mvTypeW" value="'+movieSub+'">'+
      '<input id="mvTitleW" class="inp-text" placeholder="备选'+t.label+'名称" maxlength="60">'+
      '<button class="btn-primary" id="mvAddWant">+ 加入片单</button>'+
    '</div>'+
    '<div class="sub-block-hd">🎬 已观看'+t.label+'</div><div id="mvList">'+itemsHtml+'</div>'+
    '<div class="sub-block-hd" style="margin-top:12px;">📝 '+t.label+'片单备选</div><div id="mvWantList">'+wantHtml+'</div>'+
    yestHtmlMovie;
  bindMovies();
}

function bindMovies(){
  // 子页切换
  document.querySelectorAll("#mvSubTabs .tab").forEach(function(b){
    b.onclick=function(){movieSub=b.getAttribute("data-msub");renderMovies();};
  });
  // 推荐勾选（已看）
  document.querySelectorAll("#m-movie .reco-cb").forEach(function(cb){
    cb.onchange=function(){
      var rid=cb.getAttribute("data-rid");
      var done=getMovieRecoDone();
      var groups=(CT.movieReco||[]), item=null, gTitle="";
      groups.forEach(function(g){ (g.items||[]).forEach(function(it){ if(it.id===rid){item=it;gTitle=g.title;} }); });
      if(!item) return;
      if(cb.checked){
        done[rid]=1;
        var arr=getMoviesWatched();
        if(!arr.some(function(m){return m.recoId===rid;})){
          arr.unshift({id:uid(), title:item.title, type:item.type, rating:item.rating||"", date:todayKey(new Date()), note:"推荐："+gTitle, recoId:rid});
          setMoviesWatched(arr);
        }
      } else {
        delete done[rid];
        setMoviesWatched(getMoviesWatched().filter(function(m){return m.recoId!==rid;}));
      }
      setMovieRecoDone(done);
      renderMovies();
    };
  });
  // 仅分类页存在以下按钮
  var a1=document.getElementById("mvAddWatched");
  if(a1) a1.onclick=function(){
    var t=document.getElementById("mvTitle").value.trim();
    if(!t){alert("请输入影片名");return;}
    var arr=getMoviesWatched();
    arr.unshift({id:uid(), title:t, type:document.getElementById("mvType").value, rating:document.getElementById("mvRating").value||"", date:todayKey(new Date())});
    setMoviesWatched(arr);renderMovies();
  };
  var a2=document.getElementById("mvAddWant");
  if(a2) a2.onclick=function(){
    var t=document.getElementById("mvTitleW").value.trim();
    if(!t){alert("请输入影片名");return;}
    var arr=getMoviesWant();
    arr.unshift({id:uid(), title:t, type:document.getElementById("mvTypeW").value, note:""});
    setMoviesWant(arr);renderMovies();
  };
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
  // 编辑已看
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
}

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
  // 本周训练计划（做了哪个勾哪个）
  var planHtml = workoutPlanHtml();
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
  }  ).join(""):'<div class="empty-tip">本月暂无运动记录</div>';

  // 昨日记录：展示前一天的运动（计划完成数 + 打卡备注，仅确有数据时）
  var yde=yesterdayDate(d), yEx2=getExerciseLog(yde);
  var yPlan=getPlanDoneByKey(todayKey(yde));
  var yPlanCount=0; for(var ypk in yPlan){ if(yPlan[ypk]) yPlanCount++; }
  var yestHtmlEx="";
  if((yEx2&&(yEx2.done||(yEx2.note&&yEx2.note.trim()))) || yPlanCount>0){
    var yparts=[];
    if(yPlanCount>0) yparts.push('完成 '+yPlanCount+' 个动作');
    if(yEx2&&yEx2.note) yparts.push(yEx2.note);
    yestHtmlEx='<div class="sub-block-hd" style="margin-top:16px;">📅 昨日运动（'+todayKey(yde)+'）</div><div class="yest-box"><div class="yest-item">🧘 '+(yparts.join(' · ')||'已打卡')+'</div></div>';
  }
  var xiaomiBlock = '<div class="sub-block-hd" style="margin-top:16px;">📲 小米运动健康</div>'+
    '<div class="quote-card plan-section" style="margin-bottom:10px;font-size:12px;color:var(--muted);">手动同步：导出今日状态可粘贴 / 分享到小米运动健康。自动双向同步需后端 + 小米开放平台授权，当前为纯前端。</div>'+
    '<div class="form-row"><button class="btn-primary" id="xiaoOpen">打开 App</button><button class="btn-ghost" id="xiaoExport">导出今日状态</button></div>';

  document.getElementById("m-exercise").innerHTML =
    '<h2 class="panel-title">🧘 运动锻炼</h2>'+
    '<div class="panel-sub">每日打卡 · 塑形跟练 · 19:00 开始</div>'+
    goalBox+
    planHtml+
    sum7html+
    cal+
    '<div class="sub-block-hd" style="margin-top:14px;">📝 记录今日运动</div>'+
    '<div class="form-row"><input id="exNote" class="inp-text" placeholder="今天练了什么? 例如: 欧阳春晓30分钟" maxlength="60">'+
    '<button class="btn-primary" id="exSubmit">打卡 ✓</button></div>'+
    videoHtml+
    recsHtml+
    yestHtmlEx+
    xiaomiBlock;
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
  // 每周训练计划：勾选某个动作 → 按天保存 + 同步当日运动打卡
  document.querySelectorAll("#m-exercise input[data-plan-id]").forEach(function(cb){
    cb.onchange = function(){
      var dt = cb.getAttribute("data-plan-date");
      var id = cb.getAttribute("data-plan-id");
      var p = dt.split("-");
      var dd = new Date(+p[0], +p[1]-1, +p[2]);
      setPlanDoneByKey(dt, id, cb.checked);
      syncPlanToLog(dd);
      renderExercise();
    };
  });
  // 小米运动健康：打开 App + 导出今日状态
  var xo = document.getElementById("xiaoOpen");
  if(xo) xo.onclick = openXiaomiHealth;
  var xe = document.getElementById("xiaoExport");
  if(xe) xe.onclick = exportDailyStatus;
}

/* ============ 小米运动健康（手动同步：导出今日状态 / 打开 App） ============ */
function buildDailyStatusText(d){
  var lines = ['【若惜工作台 · 每日状态 '+todayKey(d)+'】'];
  var ex = getExerciseLog(d);
  lines.push('🧘 运动：'+(ex&&ex.done?'已打卡 ✓':'未打卡')+(ex&&ex.note?(' · '+ex.note):''));
  var reads = getReadLog().filter(function(e){return e.date===todayKey(d);}).length;
  lines.push('📖 阅读：'+reads+' 章');
  var mood = getMood(d);
  if(mood && mood.mood) lines.push('😊 心情：'+mood.mood+(mood.note?(' · '+mood.note):''));
  try{
    var sl = buildSleep(d);
    if(sl) lines.push('😴 睡眠建议：入睡 '+sl.bedtime+' · 起床 '+sl.wake);
  }catch(_){}
  return lines.join('\n');
}
function fallbackCopy(txt){
  try{
    var ta=document.createElement('textarea'); ta.value=txt; ta.style.position='fixed'; ta.style.opacity='0';
    document.body.appendChild(ta); ta.focus(); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
    alert('今日状态已复制到剪贴板，可粘贴到小米运动健康');
  }catch(_){ alert(txt); }
}
function exportDailyStatus(){
  var txt = buildDailyStatusText(new Date());
  if(navigator.share){
    navigator.share({title:'若惜工作台·每日状态', text:txt}).catch(function(){});
  } else if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(txt).then(function(){ alert('今日状态已复制到剪贴板，可粘贴到小米运动健康'); }).catch(function(){ fallbackCopy(txt); });
  } else { fallbackCopy(txt); }
}
function openXiaomiHealth(){
  var storeUrl = 'https://app.mi.com/details?id=com.xiaomi.mihealth';
  try{ window.location.href = 'mihealth://main'; }catch(_){}
  setTimeout(function(){ try{ window.open(storeUrl, '_blank'); }catch(_){} }, 1200);
}
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
  // 昨日记录：展示前一天的记账明细与合计（仅确有数据时）
  var ydm2=yesterdayDate(d), yMoney=getMoney().filter(function(x){return x.date===todayKey(ydm2);});
  var yestHtmlMoney="";
  if(yMoney.length){
    var ySum=yMoney.reduce(function(s,x){return s+(+x.amount||0);},0);
    yestHtmlMoney='<div class="sub-block-hd" style="margin-top:16px;">📅 昨日记账（'+todayKey(ydm2)+'）</div><div class="yest-box"><div class="yest-item">💰 共 '+yMoney.length+' 笔 · ¥'+ySum.toFixed(2)+'</div>'+
      yMoney.map(function(m){return '<div class="yest-item">· '+moneyCatIcon(m.category)+' '+esc(moneyCatLabel(m.category))+(m.note?(' '+esc(m.note)):'')+' · ¥'+(+m.amount).toFixed(2)+'</div>';}).join("")+
      '</div>';
  }
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
    '<div id="moneyList">'+itemsHtml+'</div>'+
    yestHtmlMoney;
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
      '<input type="checkbox" data-tdone="'+t.id+'" '+(t.done?'checked':'')+'>'+
      '<span class="nt-text">'+esc(t.text)+'</span>'+
      '<div class="nm">'+esc(t.date)+'</div></label>';
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
  function slot(d){ if(!dates[d]) dates[d]={read:0, readItems:[], movies:[], exercise:null}; return dates[d]; }
  // 阅读：按天勾选日志
  getReadLog().forEach(function(e){ if(e && e.date){ slot(e.date).read++; slot(e.date).readItems.push(e.key); } });
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
      if(dt.read>0){
        var rdet = (dt.readItems||[]).map(resolveReadKey).filter(Boolean).map(function(r){return '《'+esc(r.book)+'》'+r.chapter;}).join('、');
        lines.push('📖 阅读 '+dt.read+' 章'+(rdet?('：'+rdet):''));
      }
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
function buildSleep(d, q){
  var p = CFG.profile, s = CFG.sleep;
  var bedtime = parseTime(s.defaultBedtime);
  if(q!=null && q<60) bedtime = parseTime(s.highFatigueBedtime);
  var wake = parseTime(p.wakeTime);
  var now = d.getHours()*60+d.getMinutes();
  var sleepMins = wake>now ? wake-now+1440 : wake-now;
  sleepMins = sleepMins - s.windDownMinutes - s.sleepCycleMinutes;
  var cycles = Math.max(0, Math.floor(sleepMins/s.sleepCycleMinutes));
  return {bedtime:fmtTime(bedtime), wake:fmtTime(wake), cycles:cycles, wind:s.windDownMinutes};
}
/* 根据填入的 4 项数值，给出今日状态评分(0-100)与分项休息建议 */
function evalSleep(v){
  var dur = v.duration!=null?v.duration:7.5;
  var q = v.quality!=null?v.quality:75;
  var rhr = v.rhr!=null?v.rhr:70;
  var spo2 = v.spo2!=null?v.spo2:97;
  function durScore(d){ if(d>=7&&d<=9) return 100; if((d>=6&&d<7)||(d>9&&d<=10)) return 82; if((d>=5&&d<6)||(d>10&&d<=11)) return 60; return 35; }
  function rhrScore(r){ if(r<=60) return 100; if(r<=70) return 90; if(r<=80) return 75; if(r<=90) return 55; return 30; }
  function spo2Score(s){ if(s>=98) return 100; if(s>=96) return 85; if(s>=94) return 65; if(s>=92) return 45; return 20; }
  var sd=durScore(dur), sr=rhrScore(rhr), ss=spo2Score(spo2);
  var score=Math.round(q*0.35 + sd*0.25 + sr*0.20 + ss*0.20);
  var label, emoji;
  if(score>=85){label="优秀";emoji="🌟";}
  else if(score>=70){label="良好";emoji="🙂";}
  else if(score>=55){label="一般";emoji="😐";}
  else if(score>=40){label="偏差";emoji="😟";}
  else {label="需关注";emoji="⚠️";}
  var advice=[];
  if(dur<7) advice.push('⏱️ 睡眠时长偏短（'+fmtH(dur)+'），今晚尽量提前约 '+Math.max(10,Math.round((7-dur)*60))+' 分钟入睡，补足 7–8 小时。');
  else if(dur>9.5) advice.push('⏱️ 睡眠偏长（'+fmtH(dur)+'），留意是否夜间易醒，白天适度活动、避免久卧。');
  else advice.push('⏱️ 睡眠时长达标（'+fmtH(dur)+'），保持规律作息。');
  if(q<60) advice.push('🌙 睡眠质量偏低（'+q+'/100），睡前 1 小时远离屏幕、调暗灯光，做 5 分钟腹式呼吸放松。');
  else if(q<80) advice.push('🌙 睡眠质量中等（'+q+'/100），固定起床时间有助于提升深睡比例。');
  else advice.push('🌙 睡眠质量不错（'+q+'/100），继续维持。');
  if(rhr>80) advice.push('❤️ 静息心率偏高（'+rhr+' bpm），可能与压力 / 咖啡因有关，今天少喝咖啡、做 10 分钟有氧。');
  else if(rhr<=60) advice.push('❤️ 静息心率很棒（'+rhr+' bpm），心肺状态良好。');
  else advice.push('❤️ 静息心率正常（'+rhr+' bpm）。');
  if(spo2<94) advice.push('🩸 平均血氧偏低（'+spo2+'%），建议侧卧、保持卧室通风；若持续低于 92% 请就医排查。');
  else if(spo2<96) advice.push('🩸 血氧略低（'+spo2+'%），留意睡姿与通风。');
  else advice.push('🩸 血氧正常（'+spo2+'%）。');
  return {score:score, label:label, emoji:emoji, advice:advice};
}
function renderSleep(){
  var d = new Date();
  var self = getSleepSelf(d);
  var def = {duration:7.5, quality:75, rhr:70, spo2:97};
  var v = {
    duration: self&&self.duration!=null?self.duration:def.duration,
    quality: self&&self.quality!=null?self.quality:def.quality,
    rhr:     self&&self.rhr!=null?self.rhr:def.rhr,
    spo2:    self&&self.spo2!=null?self.spo2:def.spo2
  };
  var b = buildSleep(d, v.quality);
  // 昨日自评（若有）
  var yd = yesterdayDate(d), ySelf = getSleepSelf(yd);
  var yestHtmlSleep = "";
  if(ySelf){
    var ye = evalSleep(ySelf);
    yestHtmlSleep = '<div class="sub-block-hd" style="margin-top:14px;">📅 昨日睡眠（'+todayKey(yd)+'）</div><div class="yest-box"><div class="yest-item">😴 评分 '+ye.score+' · '+ye.emoji+' '+ye.label+'（时长 '+fmtH(ySelf.duration)+' · 质量 '+ySelf.quality+' · 心率 '+ySelf.rhr+' · 血氧 '+ySelf.spo2+'%）</div></div>';
  }
  var fields = [
    {k:"duration", label:"睡眠时长", unit:"小时", step:"0.5", min:"0", max:"24", val:v.duration},
    {k:"quality",  label:"睡眠质量", unit:"(0-100)", step:"1", min:"0", max:"100", val:v.quality},
    {k:"rhr",      label:"静息心率", unit:"bpm", step:"1", min:"0", max:"200", val:v.rhr},
    {k:"spo2",     label:"平均血氧", unit:"%", step:"1", min:"0", max:"100", val:v.spo2}
  ];
  var formHtml = fields.map(function(f){
    return '<div class="sleep-field"><label>'+f.label+' <span class="sf-unit">'+f.unit+'</span></label>'+
      '<input type="number" class="sf-inp" id="sf_'+f.k+'" data-sk="'+f.k+'" step="'+f.step+'" min="'+f.min+'" max="'+f.max+'" value="'+f.val+'"></div>';
  }).join("");
  document.getElementById("m-sleep").innerHTML =
    '<h2 class="panel-title">🌙 睡眠管理</h2>'+
    '<div class="panel-sub">填入今日手环数据，自动评估状态与休息建议</div>'+
    '<div class="quote-card plan-section"><b>🎯 建议入睡：'+b.bedtime+'</b><br>'+
    '起床 '+b.wake+' · 需 '+b.wind+'min 缓冲 + '+b.cycles+' 个睡眠周期</div>'+
    '<div class="sub-block-hd">📝 今日睡眠数据（填入即评估）</div>'+
    '<div class="sleep-form">'+formHtml+'</div>'+
    '<div id="sleepAssess"></div>'+
    '<div class="quote-card plan-section" style="margin-top:12px;"><b>🛏️ 睡前仪式</b><br>· 23:00 后远离手机<br>· 拉伸放松 5 分钟<br>· 听轻音乐入眠<br>· 早起时间：'+b.wake+'</div>'+
    yestHtmlSleep;
  bindSleep();
}
function bindSleep(){
  var d = new Date();
  function readVals(){
    function num(id, def, min, max){ var el=document.getElementById(id); var x=parseFloat(el&&el.value); if(isNaN(x)) x=def; x=Math.max(min, Math.min(max, x)); return x; }
    return {
      duration: num("sf_duration", 7.5, 0, 24),
      quality:  num("sf_quality", 75, 0, 100),
      rhr:      num("sf_rhr", 70, 0, 200),
      spo2:     num("sf_spo2", 97, 0, 100)
    };
  }
  function paint(){
    var v = readVals();
    setSleepSelf(d, v);
    var e = evalSleep(v);
    var assess = document.getElementById("sleepAssess");
    if(assess){
      assess.innerHTML =
        '<div class="sub-block-hd" style="margin-top:12px;">💡 今日状态评估</div>'+
        '<div class="quote-card plan-section"><div class="sleep-score"><span class="ss-num">'+e.score+'</span><span class="ss-emoji">'+e.emoji+' '+e.label+'</span></div>'+
        '<div class="sleep-advice">'+e.advice.map(function(a){return '<div class="sa-item">'+a+'</div>';}).join("")+'</div></div>';
    }
  }
  document.querySelectorAll("#m-sleep .sf-inp").forEach(function(inp){
    inp.addEventListener("input", paint);
  });
  paint();
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
  // 昨日记录：展示前一天便签（只读）；今日为空时可一键复制为今日
  var yd = yesterdayDate(d), yNote = getNote(yd);
  var yestHtmlNote = "";
  if(yNote && yNote.trim()){
    var canCopy = !note || !note.trim();
    yestHtmlNote = '<div class="sub-block-hd" style="margin-top:16px;">📅 昨日便签（'+todayKey(yd)+'）</div><div class="yest-box"><div class="yest-item">'+esc(yNote)+'</div>'+
      (canCopy?'<div style="text-align:right;margin-top:4px;"><button class="btn-ghost" id="noteCopyYest">复制为今日</button></div>':'')+'</div>';
  }
  document.getElementById("m-note").innerHTML =
    '<h2 class="panel-title">📝 今日便签</h2>'+
    '<div class="panel-sub">随手记 · 按天保存</div>'+
    '<div class="quote-card plan-section"><textarea id="noteArea" placeholder="今天的小灵感、小反思..." style="width:100%;min-height:200px;border:1px solid var(--line);border-radius:10px;padding:10px;font-size:13px;">'+esc(note)+'</textarea>'+
    '<div style="text-align:right;margin-top:6px;"><button class="btn-primary" id="noteSave">保存</button></div></div>'+
    yestHtmlNote;
  var sv = document.getElementById("noteSave");
  if(sv) sv.onclick = function(){setNote(d, document.getElementById("noteArea").value); alert("已保存 ✅");};
  // 自动保存 (blur)
  var ar = document.getElementById("noteArea");
  if(ar) ar.onblur = function(){setNote(d, ar.value);};
  // 复制昨日便签为今日（仅当今日为空）
  var cy = document.getElementById("noteCopyYest");
  if(cy) cy.onclick = function(){ var area=document.getElementById("noteArea"); if(area){ area.value=yNote; setNote(d, yNote); showToast({title:"已复制昨日便签", text:""}); } };
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
  initNavOrder();
  initNavDrag();
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

/* ============ 侧边栏长按排序（顺序持久化） ============ */
var navScrollEl=null, navDragEl=null, navPressTimer=null, navStartPt=null, navDragging=false, navSuppressClick=false;
function saveNavOrder(){
  if(!navScrollEl) return;
  var order = Array.prototype.slice.call(navScrollEl.querySelectorAll('.nav-item')).map(function(el){return el.getAttribute('data-target');});
  lsSetJSON('wb_nav_order', order);
}
function moveNav(item, dir){
  if(!navScrollEl || !item) return;
  var sib = dir<0 ? item.previousElementSibling : item.nextElementSibling;
  if(!sib || !sib.classList.contains('nav-item')) return;
  if(dir<0) navScrollEl.insertBefore(item, sib);
  else navScrollEl.insertBefore(sib, item);
  saveNavOrder();
}
function initNavOrder(){
  navScrollEl = document.getElementById('navScroll');
  if(!navScrollEl) return;
  var items = Array.prototype.slice.call(navScrollEl.querySelectorAll('.nav-item'));
  var saved = lsJSON('wb_nav_order', null);
  if(saved && saved.length){
    saved.forEach(function(id){
      var el = navScrollEl.querySelector('.nav-item[data-target="'+id+'"]');
      if(el) navScrollEl.appendChild(el);
    });
    items.forEach(function(el){
      if(saved.indexOf(el.getAttribute('data-target'))<0) navScrollEl.appendChild(el);
    });
  } else {
    lsSetJSON('wb_nav_order', items.map(function(el){return el.getAttribute('data-target');}));
  }
  // 添加上/下调整按钮（移动端可靠排序方式，避免触屏长按被滚动手势吞掉）
  Array.prototype.slice.call(navScrollEl.querySelectorAll('.nav-item')).forEach(function(el){
    if(el.querySelector('.nav-ud')) return;
    var ud = document.createElement('span'); ud.className='nav-ud';
    ud.innerHTML='<span class="nav-up" title="上移">▲</span><span class="nav-down" title="下移">▼</span>';
    el.appendChild(ud);
    ud.querySelector('.nav-up').addEventListener('click', function(e){ e.stopPropagation(); e.preventDefault(); moveNav(el,-1); });
    ud.querySelector('.nav-down').addEventListener('click', function(e){ e.stopPropagation(); e.preventDefault(); moveNav(el,1); });
  });
}
function onNavPointerDown(e){
  if(e.target && e.target.closest && e.target.closest('.nav-ud')) return;            // 点箭头不触发拖拽
  if(e.pointerType && e.pointerType!=='mouse' && e.pointerType!=='pen') return;      // 触屏用箭头排序，长按需拖拽留给桌面
  var item = (e.target && e.target.closest) ? e.target.closest('.nav-item') : null;
  if(!item || !navScrollEl || !navScrollEl.contains(item)) return;
  navDragEl = item;
  navStartPt = {x:e.clientX, y:e.clientY};
  navDragging = false;
  navSuppressClick = false;
  clearTimeout(navPressTimer);
  navPressTimer = setTimeout(function(){
    if(navDragEl){
      navDragging = true;
      navSuppressClick = true;
      navDragEl.classList.add('dragging');
      document.body.classList.add('nav-dragging');
      try{ navDragEl.setPointerCapture(e.pointerId); }catch(_){}
    }
  }, 450);
}
function onNavPointerMove(e){
  if(!navDragEl) return;
  if(!navDragging){
    if(navStartPt && (Math.abs(e.clientX-navStartPt.x)>8 || Math.abs(e.clientY-navStartPt.y)>8)) clearTimeout(navPressTimer);
    return;
  }
  if(e.cancelable) e.preventDefault();
  navDragEl.style.visibility = 'hidden';
  var under = document.elementFromPoint(e.clientX, e.clientY);
  navDragEl.style.visibility = '';
  var target = under ? (under.closest ? under.closest('.nav-item') : null) : null;
  if(target && target!==navDragEl && navScrollEl.contains(target)){
    var r = target.getBoundingClientRect();
    if((e.clientY - r.top) < r.height/2) navScrollEl.insertBefore(navDragEl, target);
    else navScrollEl.insertBefore(navDragEl, target.nextSibling);
  }
}
function onNavPointerUp(e){
  clearTimeout(navPressTimer);
  if(navDragEl && navDragging){
    navDragEl.classList.remove('dragging');
    document.body.classList.remove('nav-dragging');
    saveNavOrder();
  }
  if(navDragEl){ try{ navDragEl.releasePointerCapture(e.pointerId); }catch(_){} }
  if(navDragging){
    navDragging = false;
    setTimeout(function(){ navSuppressClick=false; }, 0); // 若浏览器未合成 click 则复位
  }
  navDragEl = null;
}
function onNavClickCapture(e){
  if(navSuppressClick){ e.stopPropagation(); e.preventDefault(); navSuppressClick=false; }
}
function initNavDrag(){
  if(!navScrollEl) navScrollEl = document.getElementById('navScroll');
  if(!navScrollEl) return;
  navScrollEl.addEventListener('pointerdown', onNavPointerDown);
  document.addEventListener('pointermove', onNavPointerMove, {passive:false});
  document.addEventListener('pointerup', onNavPointerUp);
  document.addEventListener('pointercancel', onNavPointerUp);
  document.addEventListener('click', onNavClickCapture, true);
}
})();