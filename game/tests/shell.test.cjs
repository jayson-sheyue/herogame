const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function setup() {
  class Element {
    constructor() {
      this.hidden = false;
      this.open = false;
      this.listeners = {};
      this.attributes = {};
    }
    addEventListener(type, fn) {
      (this.listeners[type] ||= []).push(fn);
    }
    emit(type, event = {}) {
      this.listeners[type]?.forEach((fn) => fn(event));
    }
    showModal() {
      this.open = true;
    }
    close() {
      this.open = false;
      this.emit('close');
    }
    setAttribute(key, value) {
      this.attributes[key] = value;
    }
    removeAttribute(key) {
      delete this.attributes[key];
    }
    blur() {}
    focus() {}
  }
  const elements = new Map();
  const get = (id) => {
    if (!elements.has(id)) elements.set(id, new Element());
    return elements.get(id);
  };
  const document = new Element();
  document.getElementById = get;
  const window = new Element();
  const stored = new Map();
  let reloaded = 0;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/shell.js'), 'utf8'), {
    document,
    window,
    localStorage: { getItem: (k) => stored.get(k), setItem: (k, v) => stored.set(k, v) },
    location: {
      reload() {
        reloaded++;
      },
    },
  });
  const scenes = {};
  let soundPaused = 0,
    soundResumed = 0;
  const game = {
    scene: { getScene: (k) => scenes[k], isActive: (k) => !!scenes[k]?.active },
    events: { once: (_type, fn) => fn() },
    canvas: new Element(),
    sound: {
      mute: false,
      pauseAll() {
        soundPaused++;
      },
      resumeAll() {
        soundResumed++;
      },
    },
  };
  window.HeroShell.bind(game);
  const scene = (pvp) => {
    const record = {
      active: true,
      pvp,
      cleared: 0,
      sent: [],
      input: {
        keyboard: {
          enabled: true,
          resetKeys() {
            record.cleared++;
          },
        },
      },
      keys: { J: { reset() {} } },
      hostBuf: { pendingJAt: 1 },
      pendingJAt: 1,
      net: { send: (packet) => record.sent.push(packet) },
      isHost: false,
    };
    record.scene = {
      pause() {
        record.active = false;
      },
      resume() {
        record.active = true;
      },
    };
    return record;
  };
  return {
    window,
    document,
    get,
    game,
    scenes,
    scene,
    shell: window.HeroShell,
    stored,
    sound: () => ({ paused: soundPaused, resumed: soundResumed }),
    reloaded: () => reloaded,
  };
}
test('help disables selection keyboard and Escape restores it without leaking a game key', () => {
  const env = setup();
  const select = env.scene(false);
  env.scenes.select = select;
  env.get('helpButton').onclick();
  assert.equal(select.input.keyboard.enabled, false);
  let stopped = false,
    prevented = false;
  env.window.emit('keydown', {
    code: 'Escape',
    preventDefault() {
      prevented = true;
    },
    stopImmediatePropagation() {
      stopped = true;
    },
  });
  assert.equal(env.get('helpDialog').open, false);
  assert.equal(select.input.keyboard.enabled, true);
  assert.equal(stopped, true);
  assert.equal(prevented, true);
});
test('local pause freezes scene and clears buffered actions before resume', () => {
  const env = setup();
  const fight = env.scene(false);
  env.scenes.fight = fight;
  env.get('pauseButton').onclick();
  assert.equal(fight.active, false);
  assert.equal(env.get('pauseDialog').open, true);
  assert.equal(fight.pendingJAt, 0);
  env.get('resumeButton').onclick();
  assert.equal(fight.active, true);
  assert.equal(env.get('pauseDialog').open, false);
  assert.deepEqual(env.sound(), { paused: 1, resumed: 1 });
});
test('blur pauses only local play and repeated visibility events do not double-pause', () => {
  const env = setup();
  const fight = env.scene(false);
  env.scenes.fight = fight;
  env.window.emit('blur');
  env.document.hidden = true;
  env.document.emit('visibilitychange');
  assert.equal(fight.active, false);
  assert.equal(env.sound().paused, 1);
});
test('mute preference updates both sound manager and accessible button state', () => {
  const env = setup();
  env.get('muteButton').onclick();
  assert.equal(env.game.sound.mute, true);
  assert.equal(env.stored.get('herogame-muted'), 'true');
  assert.equal(env.get('muteButton').attributes['aria-pressed'], 'true');
});
test('asset failure return uses supplied recovery and subsequent boot failure reloads', () => {
  const env = setup();
  let returned = 0;
  env.shell.fail('资源失败', '请换人', () => returned++);
  env.get('retryButton').onclick();
  assert.equal(returned, 1);
  assert.equal(env.reloaded(), 0);
  assert.equal(env.get('retryButton').textContent, '返回英灵选择');
  env.shell.fail('无法启动', '请重试');
  env.get('retryButton').onclick();
  assert.equal(env.reloaded(), 1);
});

test('mute preference remains selectable when the browser has a no-audio manager', () => {
  const env = setup();
  Object.defineProperty(env.game.sound, 'mute', { get: () => false, set() {} });
  env.get('muteButton').onclick();
  assert.equal(env.get('muteButton').textContent, '声音：关');
  assert.equal(env.stored.get('herogame-muted'), 'true');
  env.get('muteButton').onclick();
  assert.equal(env.get('muteButton').textContent, '声音：开');
});

test('keyboard navigation on native controls does not leak Enter into the game', () => {
  const env = setup();
  const fight = env.scene(false);
  env.scenes.fight = fight;
  let stopped = false,
    prevented = false;
  env.window.emit('keydown', {
    code: 'Enter',
    target: { closest: () => ({ tagName: 'BUTTON' }) },
    preventDefault() {
      prevented = true;
    },
    stopImmediatePropagation() {
      stopped = true;
    },
  });
  assert.equal(stopped, true);
  assert.equal(prevented, false);
  assert.equal(fight.pendingJAt, 0);
});

test('result offers rematch with the same pack and the next fight hides it', () => {
  const env = setup(), fight = env.scene(false), pack = {p1Id:'a',p2Id:'b',stageId:'city',cpuDiff:'fair'};
  let next;
  Object.assign(fight,{pack,resultShown:true});fight.scene.start=(key,data)=>{next={key,data};};
  env.scenes.fight=fight;
  env.shell.mode('pve');assert.equal(env.get('rematchButton').hidden,true);
  env.shell.result();assert.equal(env.get('rematchButton').hidden,false);
  env.get('rematchButton').onclick();assert.equal(next.key,'loader');assert.equal(next.data,pack);
  env.shell.mode('pve');assert.equal(env.get('rematchButton').hidden,true);
});

test('help during a fight pauses and Escape closes help without returning to selection', () => {
  const env=setup(),fight=env.scene(false);env.scenes.fight=fight;
  env.get('helpButton').onclick();assert.equal(fight.active,false);
  let stopped=false;
  env.window.emit('keydown',{code:'Escape',preventDefault(){},stopImmediatePropagation(){stopped=true;}});
  assert.equal(stopped,true);assert.equal(env.get('helpDialog').open,false);assert.equal(fight.active,true);
  assert.deepEqual(env.sound(),{paused:1,resumed:1});
});
