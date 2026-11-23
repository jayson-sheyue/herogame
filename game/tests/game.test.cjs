const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../src/game.js'), 'utf8');
const context = {
  window: {},
  Phaser: { Scene: class {}, Math: { Clamp: (n, a, b) => Math.min(b, Math.max(a, n)) } },
  document: { getElementById: () => null, querySelector: () => null },
  location: { search: '' },
  localStorage: { getItem() {}, setItem() {} },
  URL,
  URLSearchParams,
  history: { replaceState() {} },
  console,
  setTimeout,
  clearTimeout,
  AbortController,
};
vm.runInNewContext(
  source.slice(0, source.indexOf('  const game = new Phaser.Game')) +
    'window.testGame = {Select,Load,Fight,scanFrameCached,compactStagePreview,fetchRoster,loadRosterHeroTextures};})();',
  context,
);
const { Select, Load, Fight, scanFrameCached, compactStagePreview } = context.window.testGame;

test('published catalog needs no JSON requests and excludes incomplete fighters', async () => {
  const sprites = Object.fromEntries(['idle', 'walk', 'jump', 'attack', 'air_attack', 'attack_down',
    'attack_up', 'hurt', 'guard', 'skill', 'super'].map((id) => [id, { file: `${id}.png` }]));
  const web = {catalog: {heroes: ['a', 'broken'], stages: ['arena']},
    fighters: {a: {sprites}, broken: {sprites: {idle: {file: 'idle.png'}}}}, stages: {arena: {file: 'arena.webp'}}};
  context.window.HeroWeb = web;
  try {
    const roster = await context.window.testGame.fetchRoster();
    assert.deepEqual(Array.from(roster.playable), ['a']);
    assert.equal(roster.fighters, web.fighters);
    assert.equal(roster.stages, web.stages);
  } finally { delete context.window.HeroWeb; }
});

test('published selection loads one-frame previews through subdirectory-safe paths', () => {
  const calls = [];
  const loader = {image: (key, url) => calls.push({key, url}),
    spritesheet: (key, url, spec) => calls.push({key, url, spec})};
  const scene = {textures: {exists: () => false}};
  const fighter = {sprites: {idle: {file: 'idle.png', frames: 6}},
    previewSprites: {idle: {file: 'previews/idle.webp', frames: 1, frameWidth: 280, frameHeight: 672}}};
  context.window.testGame.loadRosterHeroTextures(scene, loader, 'a', fighter);
  assert.equal(calls[0].url, 'assets/game/heroes/a/previews/idle.webp');
  assert.equal(calls[0].spec.endFrame, 0);
  assert.equal(fighter.sprites.idle.frames, 6);
  assert.equal(fighter.sprites.idle.file, 'idle.png');
});

test('selection uses arena preview while leaving full arena metadata intact', () => {
  const scene = new Select(), images = [];
  const stage = {file: 'arena.webp', preview: 'small.webp'};
  scene.registry = {get: () => ({playable: [], stageIds: ['arena'], stages: {arena: stage}})};
  scene.textures = {exists: () => false};
  scene.cache = {audio: {exists: () => true}};
  scene.load = {on() {}, image: (key, url) => images.push({key, url})};
  scene.preload();
  assert.equal(images[0].url, 'assets/game/stages/arena/small.webp');
  assert.equal(stage.file, 'arena.webp');
});

function selection() {
  const scene = new Select(),
    records = new Map();
  Object.assign(scene, {
    playable: ['a', 'b'],
    fighters: { a: { displayName: '甲' }, b: { displayName: '乙' } },
    stageIds: ['forest', 'city'],
    stages: { forest: {}, city: {} },
    stageIndex: 0,
    p1Index: 0,
    p2Index: 1,
    slot: 'p1',
    cpuDiff: 'fair',
    locked: false,
    registry: { set: (k, v) => records.set(k, v) },
    scene: {
      start: (key, pack) => {
        scene.started = { key, pack };
      },
    },
    refresh() {},
  });
  scene.records = records;
  context.location.href = 'http://localhost:8790/?mode=pvp&room=OLD';
  return scene;
}
test('PVE starts one human and one CPU on the selected stage, once', () => {
  const scene = selection();
  scene.shiftStage(1);
  scene.setCpuDiff('cruel');
  scene.confirm();
  assert.equal(scene.started.key, 'loader');
  assert.equal(scene.started.pack.stageId, 'city');
  assert.equal(scene.started.pack.cpuDiff, 'cruel');
  assert.equal(scene.started.pack.p1Id, 'a');
  assert.equal(scene.started.pack.p2Id, 'b');
  const first = scene.started;
  scene.shiftStage(1);
  scene.setCpuDiff('kind');
  scene.confirm();
  assert.equal(scene.stageIndex, 1);
  assert.equal(scene.cpuDiff, 'cruel');
  assert.equal(scene.started, first);
});
test('selection persists both picks and map, and strips obsolete mode/room links', () => {
  const scene = selection();
  scene.p1Index = 1;
  scene.p2Index = 1;
  scene.stageIndex = 1;
  let url;
  context.history.replaceState = (_s, _t, value) => {
    url = value;
  };
  scene.rememberSelection();
  assert.equal(scene.records.get('selection').p1Id, 'b');
  assert.equal(scene.records.get('selection').p2Id, 'b');
  assert.equal(url.searchParams.get('stage'), 'city');
  assert.equal(url.searchParams.has('mode'), false);
  assert.equal(url.searchParams.has('room'), false);
});
test('map navigation wraps in both directions and refuses changes while starting', () => {
  const scene = selection();
  scene.shiftStage(-1);
  assert.equal(scene.stageIndex, 1);
  scene.shiftStage(1);
  assert.equal(scene.stageIndex, 0);
  scene.locked = true;
  scene.shiftStage(1);
  assert.equal(scene.stageIndex, 0);
});
test('fight loading requires both idle sheets and the selected stage; mirror shares one sheet', () => {
  const scene = new Load(),
    keys = new Set(['p1-idle']);
  scene.textures = { exists: (key) => keys.has(key) };
  scene.pack = { p1Id: 'a', p2Id: 'b', stageId: 'city' };
  assert.equal(scene.requiredFightersReady(), false);
  keys.add('p2-idle');
  assert.equal(scene.requiredFightersReady(), false);
  keys.add('stage-city');
  assert.equal(scene.requiredFightersReady(), true);
  scene.pack.p2Id = 'a';
  keys.delete('p2-idle');
  assert.equal(scene.requiredFightersReady(), true);
});
test('fresh metadata replaces last match data and mirrors share the same fighter', () => {
  const scene = new Load(),
    current = { displayName: '新英灵' };
  scene.pack = { p1Id: 'a', p2Id: 'a', p1: { displayName: '旧英灵' }, p2: { displayName: '旧对手' } };
  scene.cache = { json: { get: (key) => (key === 'fresh-p1' ? current : undefined) } };
  scene.registry = { get: () => ({ fighters: {} }) };
  scene.load = { off() {}, on() {} };
  scene.queueFightAssets = () => {};
  scene.finishLoad = () => {};
  scene.create();
  assert.equal(scene.pack.p1, current);
  assert.equal(scene.pack.p2, current);
});
test('cooldowns follow combat time independent of wall-clock pause duration', () => {
  const scene = new Fight();
  scene.combatNow = 1000;
  const actor = { mp: 100, sp: 100, moveCdUntil: {} };
  scene.spend(actor, 'skill');
  assert.equal(actor.mp, 68);
  assert.equal(scene.skillCdLeft(actor, 'skill'), 5000);
  scene.time = { now: 999999 };
  assert.equal(scene.skillCdLeft(actor, 'skill'), 5000);
  scene.combatNow += 5000;
  assert.equal(scene.skillCdLeft(actor, 'skill'), 0);
});
test('all difficulties retain distinct CPU behavior and two active combatants', () => {
  const scene = new Fight();
  scene.p1 = {};
  scene.p2 = {};
  scene.cpuDiff = 'kind';
  const easy = scene.cpuProfile();
  scene.cpuDiff = 'cruel';
  const hard = scene.cpuProfile();
  assert.ok(hard.skillP > easy.skillP);
  assert.ok(hard.superP > easy.superP);
  assert.equal(scene.fighters().length, 2);
  assert.equal(scene.myActor(), scene.p1);
});
test('result distinguishes win, loss and simultaneous KO and only announces once', () => {
  for (const [a, b, expected] of [
    [false, true, 'YOU WIN'],
    [true, false, 'YOU LOSE'],
    [true, true, 'DRAW GAME'],
  ]) {
    const scene = new Fight();
    scene.p1 = { ko: a };
    scene.p2 = { ko: b };
    scene.result = {};
    const labels = [];
    scene.paintResultTitle = (text) => labels.push(text);
    scene.resultHint = {
      setText() {
        return this;
      },
      setAlpha() {
        return this;
      },
    };
    scene.announceResult();
    scene.announceResult();
    assert.deepEqual(labels, [expected]);
  }
});
test('frame scan cache invalidates when the same key is reused for another texture', () => {
  let texture = {};
  const scene = { textures: { get: () => texture } };
  const first = scanFrameCached(scene, 'p1-idle', 0);
  assert.equal(first, scanFrameCached(scene, 'p1-idle', 0));
  texture = {};
  assert.notEqual(scanFrameCached(scene, 'p1-idle', 0), first);
});
test('stage preview caps texture dimensions preserving aspect ratio', () => {
  let size,
    removed,
    renamed,
    draws = 0;
  const scene = {
    textures: {
      exists: () => true,
      get: () => ({ getSourceImage: () => ({ width: 4096, height: 2048 }), setFilter() {} }),
      createCanvas: (key, w, h) => {
        size = [w, h];
        return {
          width: w,
          height: h,
          context: {
            drawImage() {
              draws++;
            },
          },
          refresh() {},
        };
      },
      remove: (key) => {
        removed = key;
      },
      renameTexture: (a, b) => {
        renamed = b;
      },
    },
  };
  context.Phaser.Textures = { FilterMode: { LINEAR: 1 } };
  compactStagePreview(scene, 'stage-thumb-a');
  assert.deepEqual(size, [1024, 512]);
  assert.equal(draws, 1);
  assert.equal(removed, renamed);
});

test('localizing the real fight updates names, countdown and result hint without changing combat state', () => {
  context.document.documentElement = {};
  context.document.querySelectorAll = () => [];
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/i18n.js'), 'utf8'), context);
  context.window.HeroI18n.setLanguage('en');
  const scene = new Fight();
  const label = () => ({
    setText(value) {
      this.text = value;
      return this;
    },
  });
  Object.assign(scene, {
    pack: {
      p1Id: 'id_1786886794',
      p2Id: 'id_1786874191',
      stageId: 'alps_tenshukaku',
      stages: { alps_tenshukaku: { displayName: '雪境天守阁' } },
    },
    p1: { fighter: { displayName: '蒋介石' }, hp: 97 },
    p2: { fighter: { displayName: '甄嬛' }, hp: 202 },
    combatNow: 5000,
    hudNames: [label(), label()],
    countText: { ...label(), alpha: 1 },
    _countLabelPrev: '开战',
    resultShown: true,
    resultHint: label(),
  });
  scene.localize();
  assert.equal(scene.hudNames[0].text, '1P  Chiang Kai-shek');
  assert.equal(scene.countText.text, 'FIGHT!');
  assert.equal(scene.stageName(), 'Snow Castle');
  assert.equal(scene.resultHint.text, 'J / ENTER  REMATCH     ESC  SELECT');
  assert.equal(scene.p1.hp, 97);
  assert.equal(scene.p2.hp, 202);
  assert.equal(scene.combatNow, 5000);
  context.window.HeroI18n.setLanguage('ja');
  let font;
  scene.children = {list: [{setFontFamily(value) {font = value;}}]};
  scene.localize();
  assert.equal(scene.hudNames[0].text, '1P  蒋介石');
  assert.equal(scene.countText.text, '勝負開始！');
  assert.equal(scene.stageName(), 'アルプスの天守閣');
  assert.equal(font, 'GameJP, GameUI, monospace');
  assert.equal(scene.p1.hp, 97);
  assert.equal(scene.combatNow, 5000);
  context.window.HeroI18n.setLanguage('zh-CN');
  scene.localize();
  assert.equal(scene.hudNames[0].text, '1P  蒋介石');
  assert.equal(scene.p1.fighter.displayName, '蒋介石');
});

test('Japanese result lettering keeps the source label for live language changes', () => {
  context.document.documentElement = {};
  context.document.querySelectorAll = () => [];
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/i18n.js'), 'utf8'), context);
  const scene = new Fight(), draws = [];
  scene.result = {setAlpha() {return this;}, setScale() {return this;}};
  scene.resultWash = {clear() {return this;}, fillStyle() {return this;}, fillRect() {return this;}, setAlpha() {return this;}};
  scene.scale = {width: 1344, height: 768};
  scene.fitResultTitle = (label) => {draws.push(label); return {padW:600,padH:164};};
  scene.resultHint = {setText() {}};
  scene.resultShown = true;
  scene.fighters = () => [];
  scene.syncTitle = () => {};
  for (const [key, expected] of [['YOU WIN','勝利'], ['YOU LOSE','敗北'], ['DRAW GAME','引き分け']]) {
    context.window.HeroI18n.setLanguage('ja');
    scene.paintResultTitle(key, 'win');
    assert.equal(draws.at(-1), expected);
    assert.equal(scene._resultLabel, key);
    context.window.HeroI18n.setLanguage('en');
    scene.localize();
    assert.equal(draws.at(-1), key);
    context.window.HeroI18n.setLanguage('ja');
    scene.localize();
    assert.equal(draws.at(-1), expected);
  }
});
