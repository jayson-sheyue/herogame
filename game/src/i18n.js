(() => {
  'use strict';
  // Plain UI strings are also their Chinese fallback. Asset data is never rewritten.
  const zh = {
    'fight.button': '开战',
    'CHARACTER SELECT': '英灵选择',
    'STAGE SELECT': '战场选择',
    'SELECT YOUR FIGHTER': '请选择英灵',
    'PVE / SINGLE PLAYER': 'PVE / 单人挑战',
    'GET READY': '准备开战',
    'LOADING': '读取中',
    'READY': '就绪',
    'SELECT': '选人',

    英灵大乱斗: '英灵大乱斗',
    '英灵大乱斗 · PVE': '英灵大乱斗 · PVE',
    '英灵大乱斗 / PVE': '英灵大乱斗 / PVE',
    游戏工具: '游戏工具',
    英灵大乱斗游戏画面: '英灵大乱斗游戏画面',
    '游戏画面。操作方法见出招表。': '游戏画面。操作方法见出招表。',
    系统语言: '系统语言',
    跟随浏览器: '自动',
    '声音：开': '声音：开',
    '声音：关': '声音：关',
    全屏: '全屏',
    退出全屏: '退出全屏',
    出招表: '出招表',
    关闭: '关闭',
    选人: '选人',
    暂停: '暂停',
    再战: '再战',
    开战: '开战',
    '加载中…': '加载中…',
    '读取资源…': '读取资源…',
    '读取人物与战场…': '读取人物与战场…',
    资源加载进度: '资源加载进度',
    重新加载: '重新加载',
    返回英灵选择: '返回英灵选择',
    推荐横屏与实体键盘: '推荐横屏与实体键盘',
    '对战已暂停，关闭后继续。': '对战已暂停，关闭后继续。',
    对战暂停: '对战暂停',
    '冷却和战斗计时已停止。': '冷却和战斗计时已停止。',
    继续对战: '继续对战',
    '建议横屏游玩 · 需要实体键盘': '建议横屏游玩 · 需要实体键盘',
    正在集结英灵: '正在集结英灵',
    '读取人物与战场，首次进入可能需要稍等片刻。': '读取人物与战场，首次进入可能需要稍等片刻。',
    未能读取游戏资源: '未能读取游戏资源',
    '请检查网络连接并重新加载。若仍失败，请稍后重试。':
      '请检查网络连接并重新加载。若仍失败，请稍后重试。',
    还没有可用的英灵或战场: '还没有可用的英灵或战场',
    '请先导入完整资源包，再重新加载。': '请先导入完整资源包，再重新加载。',
    '读取英灵与战场…': '读取英灵与战场…',
    '读取本局人物动作与战场…': '读取本局人物动作与战场…',
    英灵资源加载失败: '英灵资源加载失败',
    '请确认资源包完整。返回选人后可换一名英灵重试。': '请确认资源包完整。返回选人后可换一名英灵重试。',
    游戏引擎加载失败: '游戏引擎加载失败',
    '浏览器未允许全屏，可使用浏览器的全屏菜单。': '浏览器未允许全屏，可使用浏览器的全屏菜单。',
    '正在读取资源，请稍候…': '正在读取资源，请稍候…',
    选择英灵与对手: '选择英灵与对手',
    'A D 移动 · W 跳跃 · S 防守 · J 普攻 · K 技能 · L 奥义':
      'A D 移动 · W 跳跃 · S 防守 · J 普攻 · K 技能 · L 奥义',
    '1P  选择英灵': '1P  选择英灵',
    'CPU  选择对手': 'CPU  选择对手',
    'A D 选人   W S 切换 1P / CPU   ← → 战场   F 难度': 'A D 选人   W S 切换 1P / CPU   ← → 战场   F 难度',
    'J / ENTER  开战': 'J / ENTER  开战',
    'J / ENTER  再战     ESC  选人': 'J / ENTER  再战     ESC  选人',
    初级: '初级',
    标准: '标准',
    高手: '高手',
    胜者: '胜者',
    败者: '败者',
    奥义: '奥义',
    万有引力: '万有引力',
    铁十字之辉: '铁十字之辉',
    天威难测: '天威难测',
    优势在我: '优势在我',
    逆风解意: '逆风解意',
    三河魂: '三河魂',
    去城市化: '去城市化',
    奇点演说: '奇点演说',
    赤兔战争践踏: '赤兔战争践踏',
    'help.select':
      '<kbd>A</kbd> <kbd>D</kbd> 换英灵　<kbd>W</kbd> 选 1P　<kbd>S</kbd> 选 CPU<br><kbd>←</kbd> <kbd>→</kbd> 换战场　<kbd>F</kbd> 难度　<kbd>J</kbd> / <kbd>Enter</kbd> 开战',
    移动: '移动',
    普攻: '普攻',
    技能: '技能',
    防守: '防守',
    资源: '资源',
    结束: '结束',
    'help.move': '<kbd>A</kbd> <kbd>D</kbd> 行走　<kbd>W</kbd> 跳跃 / 二段跳　<kbd>Shift</kbd> 冲刺',
    'help.attack': '<kbd>J</kbd> 普攻　<kbd>W</kbd> + <kbd>J</kbd> 对空　<kbd>S</kbd> + <kbd>J</kbd> 对地',
    'help.skill':
      '<kbd>K</kbd> 技能　<kbd>W</kbd> + <kbd>K</kbd> 对空技能　<kbd>S</kbd> + <kbd>K</kbd> 对地技能<br><kbd>L</kbd> 奥义；倒地 / 被控时按 <kbd>L</kbd> 挣脱',
    'help.guard': '<kbd>S</kbd> 防守并回复体力；受击时 <kbd>Shift</kbd> 闪避脱战',
    'help.meters':
      '<i class="swatch hp"></i>生命　<i class="swatch mp"></i>能量：技能消耗　<i class="swatch sp"></i>体力：普攻、冲刺与挣脱消耗',
    'help.result': '击倒对手获胜。<kbd>J</kbd> / <kbd>Enter</kbd> 同人同图再战　<kbd>Esc</kbd> 返回选人',
  };
  const en = {
    'fight.button': 'Start',
    'CHARACTER SELECT': 'CHARACTER SELECT',
    'STAGE SELECT': 'STAGE SELECT',
    'SELECT YOUR FIGHTER': 'SELECT YOUR FIGHTER',
    'PVE / SINGLE PLAYER': 'PVE / SINGLE PLAYER',
    'GET READY': 'GET READY',
    'LOADING': 'LOADING',
    'READY': 'READY',
    'SELECT': 'SELECT',

    英灵大乱斗: 'HERO CLASH',
    '英灵大乱斗 · PVE': 'Hero Clash · PVE',
    '英灵大乱斗 / PVE': 'HERO CLASH / PVE',
    游戏工具: 'Game controls',
    英灵大乱斗游戏画面: 'Hero Clash game screen',
    '游戏画面。操作方法见出招表。': 'Game screen. Open the Move List for keyboard controls.',
    系统语言: 'Interface language',
    跟随浏览器: 'Auto',
    '声音：开': 'Sound: On',
    '声音：关': 'Sound: Off',
    全屏: 'Fullscreen',
    退出全屏: 'Exit Fullscreen',
    出招表: 'Move List',
    关闭: 'Close',
    选人: 'Select',
    暂停: 'Pause',
    再战: 'Rematch',
    开战: 'FIGHT!',
    '加载中…': 'Loading…',
    '读取资源…': 'Loading assets…',
    '读取人物与战场…': 'Loading fighters and stages…',
    资源加载进度: 'Asset loading progress',
    重新加载: 'Reload',
    返回英灵选择: 'Back to Select',
    推荐横屏与实体键盘: 'Use a keyboard. Landscape recommended.',
    '对战已暂停，关闭后继续。': 'Fight paused. Close this guide to resume.',
    对战暂停: 'PAUSED',
    '冷却和战斗计时已停止。': 'Combat and cooldowns are paused.',
    继续对战: 'Resume Fight',
    '建议横屏游玩 · 需要实体键盘': 'Landscape recommended · Keyboard required',
    正在集结英灵: 'LOADING FIGHTERS',
    '读取人物与战场，首次进入可能需要稍等片刻。':
      'Loading fighters and stages. The first load may take a moment.',
    未能读取游戏资源: 'Could not load game assets',
    '请检查网络连接并重新加载。若仍失败，请稍后重试。':
      'Check your connection and reload. If loading still fails, try again later.',
    还没有可用的英灵或战场: 'No fighters or stages available',
    '请先导入完整资源包，再重新加载。': 'Import a complete asset pack, then reload.',
    '读取英灵与战场…': 'Loading portraits and stage previews…',
    '读取本局人物动作与战场…': 'Loading this fight’s animations and stage…',
    英灵资源加载失败: 'Fighter assets could not be loaded',
    '请确认资源包完整。返回选人后可换一名英灵重试。':
      'Check the asset pack. Return to Select to try another fighter.',
    游戏引擎加载失败: 'Game engine failed to load',
    '浏览器未允许全屏，可使用浏览器的全屏菜单。':
      'Fullscreen was blocked. Try your browser’s fullscreen menu.',
    '正在读取资源，请稍候…': 'Loading assets. Please wait…',
    选择英灵与对手: 'Choose your fighter and opponent',
    'A D 移动 · W 跳跃 · S 防守 · J 普攻 · K 技能 · L 奥义':
      'A D Move · W Jump · S Guard · J Attack · K Skill · L Super',
    '1P  选择英灵': '1P  SELECT FIGHTER',
    'CPU  选择对手': 'CPU  SELECT OPPONENT',
    'A D 选人   W S 切换 1P / CPU   ← → 战场   F 难度':
      'A D Fighter   W S 1P / CPU   ← → Stage   F Difficulty',
    'J / ENTER  开战': 'J / ENTER  FIGHT',
    'J / ENTER  再战     ESC  选人': 'J / ENTER  REMATCH     ESC  SELECT',
    初级: 'EASY',
    标准: 'NORMAL',
    高手: 'HARD',
    胜者: 'WINNER',
    败者: 'LOSER',
    奥义: 'SUPER',
    万有引力: 'Universal Gravity',
    铁十字之辉: 'Iron Cross',
    天威难测: 'Imperial Wrath',
    优势在我: 'The Upper Hand',
    逆风解意: 'Against the Wind',
    三河魂: 'Soul of Mikawa',
    去城市化: 'Year Zero',
    奇点演说: 'Singularity',
    赤兔战争践踏: 'Red Hare Rampage',
    'help.select':
      '<kbd>A</kbd> <kbd>D</kbd> Fighter · <kbd>W</kbd> Choose 1P · <kbd>S</kbd> Choose CPU<br><kbd>←</kbd> <kbd>→</kbd> Stage · <kbd>F</kbd> Difficulty · <kbd>J</kbd> / <kbd>Enter</kbd> Start',
    移动: 'Movement',
    普攻: 'Attack',
    技能: 'Skills',
    防守: 'Guard',
    资源: 'Meters',
    结束: 'Result',
    'help.move': '<kbd>A</kbd> <kbd>D</kbd> Move · <kbd>W</kbd> Jump / Double Jump · <kbd>Shift</kbd> Dash',
    'help.attack':
      '<kbd>J</kbd> Attack · <kbd>W</kbd> + <kbd>J</kbd> Up Attack · <kbd>S</kbd> + <kbd>J</kbd> Down Attack',
    'help.skill':
      '<kbd>K</kbd> Skill · <kbd>W</kbd> + <kbd>K</kbd> Up Skill · <kbd>S</kbd> + <kbd>K</kbd> Down Skill<br><kbd>L</kbd> Super; press <kbd>L</kbd> while downed or stunned to break free',
    'help.guard': '<kbd>S</kbd> Guard and recover stamina; <kbd>Shift</kbd> to escape while being hit',
    'help.meters':
      '<i class="swatch hp"></i>Health · <i class="swatch mp"></i>Energy: skills<br><i class="swatch sp"></i>Stamina: attacks, dashes and escapes',
    'help.result':
      'Knock out your opponent to win.<br><kbd>J</kbd> / <kbd>Enter</kbd> Rematch · <kbd>Esc</kbd> Return to Select',
  };
  const ja = {
    "fight.button": "対戦開始",
    "CHARACTER SELECT": "キャラクター選択",
    "STAGE SELECT": "ステージ選択",
    "SELECT YOUR FIGHTER": "キャラクターを選択",
    "PVE / SINGLE PLAYER": "PVE / ひとりプレイ",
    "GET READY": "対戦準備",
    "LOADING": "読み込み中",
    "READY": "使用可",
    "SELECT": "キャラ選択",
    "英灵大乱斗": "英霊大乱闘",
    "英灵大乱斗 · PVE": "英霊大乱闘 · PVE",
    "英灵大乱斗 / PVE": "英霊大乱闘 / PVE",
    "游戏工具": "ゲーム設定",
    "英灵大乱斗游戏画面": "英霊大乱闘のゲーム画面",
    "游戏画面。操作方法见出招表。": "ゲーム画面。操作方法は技表をご覧ください。",
    "系统语言": "表示言語",
    "跟随浏览器": "自動",
    "声音：开": "音声：オン",
    "声音：关": "音声：オフ",
    "全屏": "全画面",
    "退出全屏": "全画面を終了",
    "出招表": "技表",
    "关闭": "閉じる",
    "选人": "キャラ選択",
    "暂停": "一時停止",
    "再战": "再戦",
    "开战": "勝負開始！",
    "加载中…": "読み込み中…",
    "读取资源…": "素材を読み込み中…",
    "读取人物与战场…": "キャラクターとステージを読み込み中…",
    "资源加载进度": "素材の読み込み状況",
    "重新加载": "再読み込み",
    "返回英灵选择": "キャラ選択へ戻る",
    "推荐横屏与实体键盘": "横長の画面とキーボードを推奨",
    "对战已暂停，关闭后继续。": "対戦を一時停止中。技表を閉じると再開します。",
    "对战暂停": "一時停止",
    "冷却和战斗计时已停止。": "対戦時間とクールダウンは停止中です。",
    "继续对战": "対戦を再開",
    "建议横屏游玩 · 需要实体键盘": "横長の画面を推奨 · キーボードが必要です",
    "正在集结英灵": "英霊を招集中",
    "读取人物与战场，首次进入可能需要稍等片刻。": "キャラクターとステージを読み込んでいます。初回は少し時間がかかります。",
    "未能读取游戏资源": "ゲーム素材を読み込めませんでした",
    "请检查网络连接并重新加载。若仍失败，请稍后重试。": "接続を確認して再読み込みしてください。解決しない場合は、しばらくしてからお試しください。",
    "还没有可用的英灵或战场": "使用できるキャラクターまたはステージがありません",
    "请先导入完整资源包，再重新加载。": "完全な素材パックをインポートして、再読み込みしてください。",
    "读取英灵与战场…": "キャラクターとステージのプレビューを読み込み中…",
    "读取本局人物动作与战场…": "今回の対戦のアニメーションとステージを読み込み中…",
    "英灵资源加载失败": "キャラクター素材を読み込めませんでした",
    "请确认资源包完整。返回选人后可换一名英灵重试。": "素材パックを確認してください。キャラ選択に戻り、別のキャラクターで再試行できます。",
    "游戏引擎加载失败": "ゲームエンジンを読み込めませんでした",
    "浏览器未允许全屏，可使用浏览器的全屏菜单。": "全画面表示が許可されませんでした。ブラウザーの全画面メニューをお試しください。",
    "正在读取资源，请稍候…": "素材を読み込んでいます。少々お待ちください…",
    "选择英灵与对手": "自分と相手のキャラクターを選択",
    "A D 移动 · W 跳跃 · S 防守 · J 普攻 · K 技能 · L 奥义": "A D 移動 · W ジャンプ · S ガード · J 攻撃 · K 必殺技 · L 奥義",
    "1P  选择英灵": "1P  使用キャラクター",
    "CPU  选择对手": "CPU  対戦相手",
    "A D 选人   W S 切换 1P / CPU   ← → 战场   F 难度": "A D キャラ   W S 1P / CPU   ← → ステージ   F 難易度",
    "J / ENTER  开战": "J / ENTER  対戦開始",
    "J / ENTER  再战     ESC  选人": "J / ENTER  再戦     ESC  キャラ選択",
    "初级": "初級",
    "标准": "標準",
    "高手": "上級",
    "胜者": "勝者",
    "败者": "敗者",
    "奥义": "奥義",
    "万有引力": "万有引力",
    "铁十字之辉": "鉄十字の輝き",
    "天威难测": "天威測り難し",
    "优势在我": "優勢は我にあり",
    "逆风解意": "逆風に咲く",
    "三河魂": "三河魂",
    "去城市化": "都市なき世界",
    "奇点演说": "特異点の演説",
    "赤兔战争践踏": "赤兎戦陣蹂躙",
    "YOU WIN": "勝利",
    "YOU LOSE": "敗北",
    "DRAW GAME": "引き分け",
    "help.select": "<kbd>A</kbd> <kbd>D</kbd> キャラ変更 · <kbd>W</kbd> 1P を選択 · <kbd>S</kbd> CPU を選択<br><kbd>←</kbd> <kbd>→</kbd> ステージ · <kbd>F</kbd> 難易度 · <kbd>J</kbd> / <kbd>Enter</kbd> 対戦開始",
    "移动": "移動",
    "普攻": "通常攻撃",
    "技能": "必殺技",
    "防守": "ガード",
    "资源": "ゲージ",
    "结束": "決着",
    "help.move": "<kbd>A</kbd> <kbd>D</kbd> 移動 · <kbd>W</kbd> ジャンプ / 二段ジャンプ · <kbd>Shift</kbd> ダッシュ",
    "help.attack": "<kbd>J</kbd> 通常攻撃 · <kbd>W</kbd> + <kbd>J</kbd> 対空攻撃 · <kbd>S</kbd> + <kbd>J</kbd> 下段攻撃",
    "help.skill": "<kbd>K</kbd> 必殺技 · <kbd>W</kbd> + <kbd>K</kbd> 対空必殺技 · <kbd>S</kbd> + <kbd>K</kbd> 下段必殺技<br><kbd>L</kbd> 奥義。ダウン中・行動不能中は <kbd>L</kbd> で脱出",
    "help.guard": "<kbd>S</kbd> ガードでスタミナ回復。被弾中に <kbd>Shift</kbd> で緊急回避",
    "help.meters": "<i class=\"swatch hp\"></i>体力 · <i class=\"swatch mp\"></i>エネルギー：必殺技で消費<br><i class=\"swatch sp\"></i>スタミナ：通常攻撃・ダッシュ・脱出で消費",
    "help.result": "相手を倒すと勝利。<kbd>J</kbd> / <kbd>Enter</kbd> 同じ組み合わせで再戦 · <kbd>Esc</kbd> キャラ選択へ戻る"
  };
  const heroesJa = {
    "id_1786892372": [
      "アドルフ・ヒトラー",
      "ヒトラー"
    ],
    "id_1786886794": [
      "蒋介石",
      "蒋介石"
    ],
    "id_1786874191": [
      "甄嬛",
      "甄嬛"
    ],
    "17": [
      "アイザック・ニュートン",
      "ニュートン"
    ],
    "id_1786895186": [
      "徳川家康",
      "徳川家康"
    ],
    "id_1786960452": [
      "朱元璋",
      "朱元璋"
    ],
    "year_zero": [
      "ポル・ポト",
      "ポル・ポト"
    ],
    "id_1787634312": [
      "スティーヴン・ホーキング",
      "ホーキング"
    ],
    "id_1787793997": [
      "呂布",
      "呂布"
    ]
  };
  const stagesJa = {
    "abandoned_estate_site": "未完成の豪邸",
    "alps_tenshukaku": "アルプスの天守閣",
    "atlantis_capitol_ruins": "アトランティス議事堂",
    "baimen_bronze_sparrow": "白門・銅雀台",
    "broken_pantheon_terracotta": "崩れた神殿と兵馬俑",
    "cyberpunk_shibuya_eiffel": "サイバー渋谷・エッフェル",
    "forbidden_city_101": "紫禁城101",
    "giants_pyramid_causeway": "巨人のピラミッド参道",
    "great_wall_cologne": "万里の長城・ケルン",
    "ilios_sky_tower": "イリオス天空塔",
    "lunar_station_earth_view": "地球を望む月面基地",
    "peak_of_liberty": "自由の頂"
  };
  const heroes = {
    id_1786892372: ['Adolf Hitler', 'A. Hitler'],
    id_1786886794: ['Chiang Kai-shek', 'Chiang'],
    id_1786874191: ['Zhen Huan', 'Zhen Huan'],
    17: ['Isaac Newton', 'Newton'],
    id_1786895186: ['Tokugawa Ieyasu', 'Tokugawa'],
    id_1786960452: ['Zhu Yuanzhang', 'Zhu Yuanzhang'],
    year_zero: ['Pol Pot', 'Pol Pot'],
    id_1787634312: ['Stephen Hawking', 'Hawking'],
    id_1787793997: ['Lu Bu', 'Lu Bu'],
  };
  const stages = {
    abandoned_estate_site: 'Abandoned Estate',
    alps_tenshukaku: 'Snow Castle',
    atlantis_capitol_ruins: 'Atlantis Capitol',
    baimen_bronze_sparrow: 'Bronze Sparrow Terrace',
    broken_pantheon_terracotta: 'Fallen Pantheon',
    cyberpunk_shibuya_eiffel: 'Cyber Shibuya',
    forbidden_city_101: 'Forbidden City 101',
    giants_pyramid_causeway: 'Golden Causeway',
    great_wall_cologne: 'Cologne Great Wall',
    ilios_sky_tower: 'Ilios Sky Tower',
    lunar_station_earth_view: 'Lunar Station',
    peak_of_liberty: 'Liberty Peak',
  };
  const listeners = new Set();
  const choices = ['auto', 'zh-CN', 'en', 'ja'];
  function browserLanguage() {
    const browser = typeof navigator === 'undefined' ? null : navigator;
    const preferred = [...(Array.isArray(browser?.languages) ? browser.languages : []), browser?.language];
    for (const locale of preferred) {
      const base = typeof locale === 'string' ? locale.trim().toLowerCase().split(/[-_]/)[0] : '';
      if (base === 'zh') return 'zh-CN';
      if (base === 'en') return 'en';
      if (base === 'ja') return 'ja';
    }
    return 'en';
  }
  let preference = 'auto';
  try {
    const saved = localStorage.getItem('herogame-language');
    if (choices.includes(saved)) preference = saved;
  } catch {
    /* session only */
  }
  let language = preference === 'auto' ? browserLanguage() : preference;
  const t = (key) => {
    if (language === 'ja' && Object.hasOwn(ja, key)) return ja[key];
    if (language !== 'zh-CN' && Object.hasOwn(en, key)) return en[key];
    return Object.hasOwn(zh, key) ? zh[key] : key;
  };
  const onChange = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };
  const api = (window.HeroI18n = {
    t,
    onChange,
    get language() {
      return language;
    },
    get preference() {
      return preference;
    },
    setLanguage(next) {
      if (!choices.includes(next)) return false;
      preference = next;
      language = next === 'auto' ? browserLanguage() : next;
      try {
        localStorage.setItem('herogame-language', preference);
      } catch {
        /* keep working in memory */
      }
      api.applyDOM();
      [...listeners].forEach((listener) => listener());
      return true;
    },
    bindText(text, key) {
      if (!Object.hasOwn(zh, key)) return text;
      const paint = () => text.setText(t(key));
      paint();
      const off = onChange(paint);
      text.once('destroy', off);
      return text;
    },
    heroName(id, data, short = false) {
      if (language === 'zh-CN') return data?.displayName || id || '—';
      return (
        data?.i18n?.[language]?.displayName ||
        data?.[language === 'ja' ? 'displayNameJa' : 'displayNameEn'] ||
        (Object.hasOwn(language === 'ja' ? heroesJa : heroes, id) ?
          (language === 'ja' ? heroesJa : heroes)[id][short ? 1 : 0] : '') ||
        data?.displayName ||
        id ||
        '—'
      );
    },
    stageName(id, data) {
      if (language === 'zh-CN') return data?.displayName || id || '—';
      return (
        data?.i18n?.[language]?.displayName ||
        data?.[language === 'ja' ? 'displayNameJa' : 'displayNameEn'] ||
        (Object.hasOwn(language === 'ja' ? stagesJa : stages, id) ?
          (language === 'ja' ? stagesJa : stages)[id] : '') ||
        data?.displayName ||
        id ||
        '—'
      );
    },
    applyDOM() {
      document.documentElement.lang = language;
      document.title = t('英灵大乱斗 · PVE');
      document.querySelectorAll('[data-i18n]').forEach((el) => {
        el.textContent = t(el.dataset.i18n);
      });
      // HTML is restricted to the bundled, trusted move-list translations.
      document.querySelectorAll('[data-i18n-html]').forEach((el) => {
        el.innerHTML = t(el.dataset.i18nHtml);
      });
      document
        .querySelectorAll('[data-i18n-aria]')
        .forEach((el) => el.setAttribute('aria-label', t(el.dataset.i18nAria)));
      const select = document.getElementById('languageSelect');
      if (select) select.value = preference;
    },
  });
  api.applyDOM();
  window.addEventListener?.('languagechange', () => {
    if (preference !== 'auto') return;
    const next = browserLanguage();
    if (next === language) return;
    language = next;
    api.applyDOM();
    [...listeners].forEach((listener) => listener());
  });
})();
