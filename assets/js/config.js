/* =====================================================================
 *  个人工作台 · 配置文件 (config.js)
 *  ---------------------------------------------------------------------
 *  如何调整？
 *   1) 把需求直接告诉 WorkBuddy（例如"把午休改到 12:30""书单换成XXX"），由我帮你改这个文件；
 *   2) 你也可以自己改下面的值，保存后刷新页面即可生效。
 *
 *  说明：
 *    - 所有"硬参数"（时间、目标、书单、节假日）都集中在此；
 *    - 手环/睡眠等"每日动态数据"通过页面里的「同步今日手环数据」面板输入，
 *      数据来源：手机上的「小米运动健康」App（睡眠/静息心率/疲劳度等），由你每日同步一次；存在你本机浏览器（localStorage），不离开设备。
 * ===================================================================== */

window.WB_CONFIG = {
  /* ---------- 个人基础信息 ---------- */
  profile: {
    name: "我",
    wakeTime: "08:00",
    workStart: "08:30",
    workEnd: "17:30",
    lunchStart: "12:00",
    lunchEnd: "13:00",
    lunchMinutes: 60,
    commuteMinutes: 30,
    pomodoroFocus: 90,
    pomodoroBreak: 15
  },

  /* ---------- 运动目标 ---------- */
  goals: {
    thighStartCm: 58,
    thighTargetCm: 50,
    currentThighCm: 58,
    measureDate: "2026-07-27"
  },

  /* ---------- 运动安排 ---------- */
  exercise: {
    weekdayTime: { start: "19:00", end: "20:00" },
    weekendTime: { start: "19:00", end: "20:00" },
    stretchMinutes: 15,
    goodMinSleepHours: 6.5,
    goodMaxFatigue: 2,
    goodMinSleepQuality: 4
  },

  /* ---------- 每周训练计划（做了哪个勾哪个，按天保存） ---------- */
  workoutPlan: [
    { day: "周一", emoji: "🍑", focus: "臀腿", tag: "瘦腿直腿 · 改善假胯宽",
      exercises: [
        { id: "mon-1", name: "徒手深蹲", sets: 4, reps: "15 次" },
        { id: "mon-2", name: "臀桥", sets: 4, reps: "20 次" },
        { id: "mon-3", name: "侧卧抬腿", sets: 3, reps: "20 次/侧" },
        { id: "mon-4", name: "向后箭步蹲", sets: 3, reps: "12 次/侧" },
        { id: "mon-5", name: "蚌式开合", sets: 3, reps: "20 次/侧" }
      ] },
    { day: "周二", emoji: "💪", focus: "肩背", tag: "薄背 · 改善圆肩",
      exercises: [
        { id: "tue-1", name: "弹力带划船", sets: 4, reps: "15 次" },
        { id: "tue-2", name: "俯卧挺身（超人式）", sets: 3, reps: "15 次" },
        { id: "tue-3", name: "招财猫（肩外旋）", sets: 3, reps: "15 次" },
        { id: "tue-4", name: "靠墙天使", sets: 3, reps: "12 次" },
        { id: "tue-5", name: "猫牛式拉伸", sets: 2, reps: "10 次" }
      ] },
    { day: "周三", emoji: "🔥", focus: "核心 + 有氧", tag: "燃脂 · 收紧腰腹",
      exercises: [
        { id: "wed-1", name: "卷腹", sets: 3, reps: "20 次" },
        { id: "wed-2", name: "平板支撑", sets: 3, reps: "45 秒" },
        { id: "wed-3", name: "俄罗斯转体", sets: 3, reps: "20 次" },
        { id: "wed-4", name: "登山跑", sets: 3, reps: "30 秒" },
        { id: "wed-5", name: "开合跳", sets: 3, reps: "40 次" }
      ] },
    { day: "周四", emoji: "✨", focus: "手臂（拜拜肉）", tag: "紧致手臂线条",
      exercises: [
        { id: "thu-1", name: "颈后臂屈伸", sets: 3, reps: "15 次" },
        { id: "thu-2", name: "俯身臂屈伸", sets: 3, reps: "15 次/侧" },
        { id: "thu-3", name: "二头弯举", sets: 3, reps: "15 次" },
        { id: "thu-4", name: "墙壁俯卧撑", sets: 3, reps: "12 次" },
        { id: "thu-5", name: "招财猫", sets: 3, reps: "15 次" }
      ] },
    { day: "周五", emoji: "🍑", focus: "臀腿强化", tag: "翘臀 · 提臀线",
      exercises: [
        { id: "fri-1", name: "保加利亚分腿蹲", sets: 3, reps: "12 次/侧" },
        { id: "fri-2", name: "跪姿后踢腿", sets: 3, reps: "20 次/侧" },
        { id: "fri-3", name: "单腿臀桥", sets: 3, reps: "15 次/侧" },
        { id: "fri-4", name: "螃蟹步（弹力带）", sets: 3, reps: "20 步" },
        { id: "fri-5", name: "深蹲跳", sets: 3, reps: "12 次" }
      ] },
    { day: "周六", emoji: "🌟", focus: "全身 + 有氧", tag: "代谢 · 整体塑形",
      exercises: [
        { id: "sat-1", name: "开合跳", sets: 3, reps: "40 次" },
        { id: "sat-2", name: "高抬腿", sets: 3, reps: "30 秒" },
        { id: "sat-3", name: "波比跳", sets: 3, reps: "10 次" },
        { id: "sat-4", name: "平板支撑", sets: 3, reps: "60 秒" },
        { id: "sat-5", name: "徒手深蹲", sets: 3, reps: "20 次" }
      ] },
    { day: "周日", emoji: "🧘", focus: "休息 / 拉伸", tag: "放松恢复",
      exercises: [
        { id: "sun-1", name: "全身拉伸", sets: 2, reps: "5 分钟" },
        { id: "sun-2", name: "婴儿式", sets: 1, reps: "2 分钟" },
        { id: "sun-3", name: "猫牛式", sets: 2, reps: "10 次" }
      ] }
  ],

  /* ---------- 睡眠管理 ---------- */
  sleep: {
    defaultBedtime: "22:30",
    highFatigueBedtime: "22:00",
    goodBedtime: "23:00",
    sleepCycleMinutes: 90,
    windDownMinutes: 30
  },

  /* ---------- 护肤提醒 ---------- */
  skincare: {
    morningTime: "07:50",
    nightTime: "20:00",
    weekendMorningTime: "09:00",
    weekendNightTime: "21:30"
  },
  /* ---------- 阅读计划 ---------- */
  reading: {
    booksPerMonth: 2,
    firstBook: "她对此感到厌烦",
    books: [
      {
        title: "克林索尔的最后一个夏天",
        author: "赫尔曼·黑塞",
        totalChapters: 12,
        totalPages: 180,
        category: "文学 / 小说",
        chapters: [
          { n: 1, title: "落下的夏天", summary: "一战后的南方小镇，画家克林索尔在酒与画中释放被压抑的天性。", thought: "若预感时间无多，你会如何安排眼前的每一天？" },
          { n: 2, title: "自称李白", summary: "他以李白自居，在酒与诗里解放被规训的自己。", thought: "人为何常需要另一个自己，才敢释放真实？" },
          { n: 3, title: "与杜甫漫游", summary: "与友人杜甫登山饮酒，在争论与迷醉里确认友谊。", thought: "真正的知己，是在分歧中仍能确认彼此的人吗？" },
          { n: 4, title: "画家之路", summary: "以特别笔触画下南方光影，映照内心的自由与焦灼。", thought: "面对后来者，你最想传承的是什么？" },
          { n: 5, title: "亚美尼亚少女", summary: "短暂情遇带来新的生命与温柔，映照对美的贪恋。", thought: "面对美好，你更贪恋瞬间还是永恒？" },
          { n: 6, title: "南方炽热", summary: "烈日与色彩让创作燃烧到极致。", thought: "「及时行乐」与「长远意义」之间，你如何安放？" },
          { n: 7, title: "眼疾与创作", summary: "身体损耗、眼疾加剧，创作冲动与生命极限激烈冲突。", thought: "当身体开始背叛，你靠什么继续前行？" },
          { n: 8, title: "情欲与爱", summary: "短暂情事提醒他仍热烈地爱，也知一切终将逝去。", thought: "最美的事物为何总带着「即将失去」的预感？" },
          { n: 9, title: "创作狂热", summary: "预感时日无多，他把全部生命压进画面，进入近乎癫狂。", thought: "你可有过「燃烧殆尽」的时刻？它值得吗？" },
          { n: 10, title: "夏日终至", summary: "凉意与落叶宣告夏天将尽，克林索尔归于沉静。", thought: "你能像迎接春天一样，坦然接受结束吗？" },
          { n: 11, title: "最后的创作", summary: "用尽生命最后颜料，他完成那幅超越死亡的最终之作。", thought: "一件「完成」的作品，能否真正战胜死亡？" },
          { n: 12, title: "告别之夏", summary: "夏天落幕，克林索尔归于沉眠；黑塞借自己的告别机告诉自己。", thought: "若这是你「最后一个夏天」，你最想留下什么？" }
        ]
      },
      {
        title: "她对此感到厌烦",
        author: "易小荷",
        totalChapters: 47,
        totalPages: 392,
        category: "文学 / 女性觉知（女性视角）",
        chapters: [
          { n: 1, title: "登录", summary: "玩家误入《女神录》成为女主，被迫走女主套路模板。", thought: "若人生是被写好的游戏，你最想先反抗哪条规则？" },
          { n: 2, title: "疑问", summary: "游戏之神问询她的身份与动机，她首次意识到自己困在循环。", thought: "当被要求解释「你为何不满」，你会如何作答？" },
          { n: 3, title: "改变", summary: "她不再扮演原定脚本，按自己意志行事，打破系统预设。", thought: "摆脱他人期待的第一步，为何最难？" },
          { n: 4, title: "权利", summary: "在战斗路线与安全感之间权衡，她看清系统对女性的规训。", thought: "在「符合期待」与「掌握权利」之间，你曾如何取舍？" },
          { n: 5, title: "勇气", summary: "她拒绝被保护的角色，第一次主动选择险路。", thought: "真正的勇气，是从何时开始为你自己冒险？" },
          { n: 6, title: "聚会", summary: "盛宴中新晋主角出尽风头，她观察并暗自计划改变格局。", thought: "当他人目光都聚焦别处，你是否在悄悄积蓄力量？" },
          { n: 7, title: "规则之下", summary: "她发现每个「好结局」都要求女性自我牺牲。", thought: "哪些「圆满」，本质是对你的妥协？" },
          { n: 8, title: "第一次坏结局", summary: "选错选项换来惨痛后果，却让她更清楚想要什么。", thought: "一次失败，如何反而让你看清方向？" },
          { n: 9, title: "重复", summary: "新一周开始，她带着记忆重来，把一切再走一遍。", thought: "若记忆被保留，哪件事你绝不再重蹈？" },
          { n: 10, title: "策略", summary: "她不再正面硬刚，转而用系统规则反制系统。", thought: "改变现状，硬碰硬与借力打力哪个更聪明？" },
          { n: 11, title: "镜像", summary: "与另一被囚的女性相遇，彼此照见处境。", thought: "女性之间的联结，为何如此重要？" },
          { n: 12, title: "系统之外", summary: "她试探边界，发现系统之外仍有未曾被讲述的空间。", thought: "你曾在哪里，撞见规则之外的可能？" },
          { n: 13, title: "命名", summary: "她为自己取名，不再接受系统赋予的身份标签。", thought: "你给自己取过怎样的名字，来找回自己？" },
          { n: 14, title: "同盟", summary: "她拉拢其他女性角色，建立松散的同盟。", thought: "孤身反抗太难时，你如何找到同伴？" },
          { n: 15, title: "表演", summary: "她学会在系统面前表演顺从，暗中积蓄反制力量。", thought: "必要的伪装，是软弱还是智慧？" },
          { n: 16, title: "代价", summary: "每一步反抗都付出代价，她开始衡量值得与否。", thought: "你为做自己，付出过什么代价？" },
          { n: 17, title: "旧结局", summary: "她重走旧路线，看清所谓「幸福结局」的空洞。", thought: "社会许诺的幸福，真的是你想要的吗？" },
          { n: 18, title: "裂缝", summary: "系统在她反复试探下出现裂缝。", thought: "看似坚固的规则，哪里最先松动？" },
          { n: 19, title: "对话", summary: "她与游戏之神持续争辩，逼问设定的意义。", thought: "你敢向「设定者」追问为何吗？" },
          { n: 20, title: "温柔", summary: "在反抗之外，她也对同伴展露温柔。", thought: "坚硬之外，你如何安放柔软？" },
          { n: 21, title: "选择", summary: "她面临关键分支，选择忠于自己而非系统奖励。", thought: "当奖励与心意相反，你选哪边？" },
          { n: 22, title: "出走", summary: "她尝试离开既定地图，走向未被书写的区域。", thought: "你可有过「走出地图」的冲动？" },
          { n: 23, title: "回望", summary: "回望来路，她看清自己如何从顺从走到反抗。", thought: "你记得自己觉醒的那一刻吗？" },
          { n: 24, title: "代价显形", summary: "系统开始反扑，代价清晰可见。", thought: "当反抗的账单一一到来，你还撑得住吗？" },
          { n: 25, title: "共谋", summary: "更多角色被卷入她的计划。", thought: "改变，是否总需要把别人也卷进来？" },
          { n: 26, title: "谎言", summary: "她戳破系统讲述的「女性神话」。", thought: "哪些关于女性的故事，其实只是话术？" },
          { n: 27, title: "重构", summary: "她尝试在系统内重写部分规则。", thought: "在旧框架里修修补补，够吗？" },
          { n: 28, title: "旧友", summary: "昔日顺从的朋友不理解她，关系出现裂痕。", thought: "觉醒是否注定带来孤独？" },
          { n: 29, title: "怒火", summary: "她终于为长久的不公感到愤怒。", thought: "愤怒，是坏事还是力量？" },
          { n: 30, title: "同盟扩大", summary: "她的同盟从几人扩大到一群。", thought: "当少数人变成多数，会改变什么？" },
          { n: 31, title: "系统震动", summary: "规则因她被动摇，旁人也开始怀疑。", thought: "一个人的坚持，如何引发连锁？" },
          { n: 32, title: "牺牲", summary: "有人为同盟付出巨大代价。", thought: "你愿为共同的自由，让步什么？" },
          { n: 33, title: "真相", summary: "她逼近游戏背后的真相。", thought: "你害怕真相，还是害怕真相太轻？" },
          { n: 34, title: "抉择", summary: "她必须在「安稳结局」与「真实自由」间抉择。", thought: "安稳与自由，你更怕失去哪个？" },
          { n: 35, title: "裂开", summary: "系统的外壳终于裂开一道缝。", thought: "裂缝里透出的光，照亮了什么？" },
          { n: 36, title: "出逃准备", summary: "她为真正的出走做最后准备。", thought: "你为「离开」做过哪些准备？" },
          { n: 37, title: "告别旧我", summary: "她与曾经顺从的自己告别。", thought: "告别旧我，哪一步最痛？" },
          { n: 38, title: "黎明", summary: "长久的暗夜后，出现改变的契机。", thought: "你相信「迟到的黎明」吗？" },
          { n: 39, title: "并肩", summary: "她不再孤身，有人与她并肩。", thought: "有人并肩时，你还害怕吗？" },
          { n: 40, title: "重写", summary: "她亲手改写属于自己的章节。", thought: "若人生可重写下，你最想改哪一段？" },
          { n: 41, title: "代价清算", summary: "旧账被逐一清算，痛苦却也释然。", thought: "清算过去，是为了放下还是记住？" },
          { n: 42, title: "新生", summary: "在废墟之上，她尝试建立新的可能。", thought: "推倒之后，你打算建什么？" },
          { n: 43, title: "回望来路", summary: "她确认这一路并非徒劳。", thought: "你如何确认自己的坚持没有白费？" },
          { n: 44, title: "余波", summary: "改变的余波扩散到更多角落。", thought: "你做过的事，是否也波及了旁人？" },
          { n: 45, title: "平静", summary: "风暴暂歇，她第一次感到平静。", thought: "平静，是终点还是新的起点？" },
          { n: 46, title: "未完", summary: "她知道故事不会真正终结，只是换一种继续。", thought: "你相信「结束」只是换一种开始吗？" },
          { n: 47, title: "她对此感到厌烦（终）", summary: "夏天落幕，她不再厌烦，因为她已亲手改写命运。", thought: "若这是你「最后一次厌烦」，你想如何收尾？" }
        ]
      }
    ]
  },
  reminders: { english: "21:00", reading: "22:30" },
  holidays: [
    "2026-09-25", "2026-09-26", "2026-09-27",
    "2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04",
    "2026-10-05", "2026-10-06", "2026-10-07",
    "2027-01-01", "2027-01-02", "2027-01-03"
  ],
  workdays: [
    "2026-09-20",
    "2026-10-10"
  ],
  moneyCategories: [
    { id: "food",    label: "餐饮",   icon: "🍱" },
    { id: "trans",   label: "交通",   icon: "🚗" },
    { id: "shop",    label: "购物",   icon: "🛍️" },
    { id: "home",    label: "居家",   icon: "🏠" },
    { id: "fun",     label: "娱乐",   icon: "🎮" },
    { id: "medical", label: "医疗",   icon: "💊" },
    { id: "study",   label: "学习",   icon: "📚" },
    { id: "other",   label: "其他",   icon: "✨" }
  ],
  movieTypes: [
    { id: "variety", label: "综艺",   icon: "🎤" },
    { id: "movie",   label: "电影",   icon: "🎬" },
    { id: "tv",      label: "电视剧", icon: "📺" },
    { id: "anime",   label: "动漫",   icon: "🌸" }
  ],
  defaultSavings: [
    { id: "s1", name: "应急基金", target: 10000, saved: 0, deadline: "2026-12-31" },
    { id: "s2", name: "旅行基金", target: 5000,  saved: 0, deadline: "2027-06-30" }
  ],
  moodList: [
    { id: "happy",   emo: "😊", label: "开心" },
    { id: "meh",     emo: "😐", label: "一般" },
    { id: "sad",     emo: "😢", label: "难过" },
    { id: "angry",   emo: "😠", label: "生气" },
    { id: "excited", emo: "🤩", label: "兴奋" }
  ],
  themes: [    { id: "zimeng", name: "梦紫", vars: { "--bg1":"#f4ecff", "--bg2":"#e7dbff", "--ink":"#443a5e", "--muted":"#9b86c4", "--line":"#ece3ff", "--brand":"#9b6cff", "--brand2":"#c3a0ff", "--brand-soft":"#f5f0ff", "--focus":"#9b6cff", "--wrap":"#b98cff" } },
    { id: "wuai", name: "雾霭蓝", vars: { "--bg1":"#e8eef1", "--bg2":"#dbe4ea", "--ink":"#3e4a52", "--muted":"#8499a6", "--line":"#dfe6eb", "--brand":"#7e9caf", "--brand2":"#a9c0cf", "--brand-soft":"#eef3f6", "--focus":"#7e9caf", "--wrap":"#9bb3c4" } },
    { id: "sage", name: "鼠尾草绿", vars: { "--bg1":"#eef1e8", "--bg2":"#e0e6d6", "--ink":"#42493c", "--muted":"#8b957c", "--line":"#e2e7d8", "--brand":"#8a9a7b", "--brand2":"#b3c0a3", "--brand-soft":"#f1f4ec", "--focus":"#8a9a7b", "--wrap":"#a4b393" } },
    { id: "rose", name: "豆沙粉", vars: { "--bg1":"#f5edec", "--bg2":"#ecdedd", "--ink":"#5a4646", "--muted":"#b08a8a", "--line":"#f0e4e3", "--brand":"#c89a9a", "--brand2":"#ddb8b8", "--brand-soft":"#faf2f1", "--focus":"#c89a9a", "--wrap":"#d6adad" } },
    { id: "oat", name: "燕麦灰", vars: { "--bg1":"#f1ede4", "--bg2":"#e6e0d2", "--ink":"#4f4a3f", "--muted":"#9c927c", "--line":"#e8e2d4", "--brand":"#b0a48c", "--brand2":"#c9bfa8", "--brand-soft":"#f7f4ec", "--focus":"#b0a48c", "--wrap":"#c3b89f" } },
    { id: "clay", name: "陶土棕", vars: { "--bg1":"#f3ebe4", "--bg2":"#e9dccf", "--ink":"#5a4639", "--muted":"#a9816c", "--line":"#efe3d8", "--brand":"#c08a72", "--brand2":"#d6a98f", "--brand-soft":"#f9f2ec", "--focus":"#c08a72", "--wrap":"#cf9c84" } },
    { id: "mauve", name: "雾紫灰", vars: { "--bg1":"#eeeaef", "--bg2":"#e3dde6", "--ink":"#4a4450", "--muted":"#9183a0", "--line":"#e7e0ea", "--brand":"#9a8aa0", "--brand2":"#bcafc2", "--brand-soft":"#f6f2f7", "--focus":"#9a8aa0", "--wrap":"#ab9db1" } },
    { id: "slate", name: "暮山灰蓝", vars: { "--bg1":"#e9ebef", "--bg2":"#dde1e8", "--ink":"#40454f", "--muted":"#83909e", "--line":"#e1e5ea", "--brand":"#7c8a9c", "--brand2":"#a2aebd", "--brand-soft":"#f1f3f6", "--focus":"#7c8a9c", "--wrap":"#95a2b3" } }
  ]
};
