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
    'window.testGame = {Select,Load,Fight,scanFrameCached,compactStagePreview};})();',
  context,
);
const { Select, Load, Fight, scanFrameCached, compactStagePreview } = context.window.testGame;

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
