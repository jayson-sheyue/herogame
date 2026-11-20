const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function setup() {
  const window = {};
  const document = {
    documentElement: {}, querySelectorAll: () => [], getElementById: () => null,
    createElement() {
      const canvas = { width: 0, height: 0, ink: [], turns: [] };
      const ctx = {
        save() {}, restore() {},
        setTransform() {}, translate() {}, rotate(angle) { canvas.turns.push(angle); }, scale() {},
        beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, putImageData() {},
        measureText: ch => ({ width: ch === 'I' ? 12 : 38 }),
        fillText(ch, x) { canvas.ink.push({ ch, x, font: this.font, alpha: this.globalAlpha }); },
        // Pixel appearance is checked in the real browser, not this rendering substitute.
        getImageData: () => ({ data: new Uint8ClampedArray(0) }),
      };
      canvas.getContext = () => ctx;
      return canvas;
    },
  };
  const context = { window, document, localStorage: { getItem() {}, setItem() {} },
    Phaser: { Scene: class {}, Textures: { FilterMode: { LINEAR: 1 } } } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/i18n.js'), 'utf8'), context);
  const source = fs.readFileSync(path.join(__dirname, '../src/game.js'), 'utf8');
  vm.runInNewContext(source.slice(0, source.indexOf('  const game = new Phaser.Game')) +
    'window.testFx = { makeSekiroBrushKanji, SUPER_TITLES };})();', context);
  const textures = new Map();
  function node() {
    return { children: [], callbacks: {}, texture: { setFilter() {} },
      setScrollFactor() { return this; }, setOrigin() { return this; },
      setDisplaySize(w, h) { this.width = w; this.height = h; return this; },
      once(event, fn) { this.callbacks[event] = fn; return this; },
      add(child) { this.children.push(child); },
      removeAll() { this.children.forEach(child => child.destroy()); this.children = []; },
      destroy() { this.removeAll(); this.callbacks.destroy?.(); },
    };
  }
  const scene = {
    scale: { width: 1344 },
    textures: { exists: key => textures.has(key), remove: key => textures.delete(key),
      addCanvas: (key, canvas) => textures.set(key, canvas) },
    add: { container: node, image(x, y, key) { const image = node(); image.key = key; return image; } },
  };
  return { ...window.testFx, i18n: window.HeroI18n, scene, textures };
}

test('every built-in super repaints actual effect glyphs in both languages and releases textures', () => {
  const { makeSekiroBrushKanji, SUPER_TITLES, i18n, scene, textures } = setup();
  for (const source of ['奥义', ...Object.values(SUPER_TITLES)]) for (const rot of [-0.24, 0.19]) {
    i18n.setLanguage('zh-CN');
    const root = makeSekiroBrushKanji(scene, source, 64, { rot });
    const rendered = expected => {
      assert.equal(textures.size, 1);
      const image = root.children[0], canvas = textures.get(image.key);
      const highlights = canvas.ink.filter(item => item.alpha === 0.6);
      const normalize = text => text.replace(/\s/g, '').toLowerCase();
      assert.equal(normalize(highlights.map(item => item.ch).join('')), normalize(expected));
      assert.ok(new Set(highlights.map(item => item.font)).size > 1, 'impact glyphs must vary in size');
      assert.ok(new Set(canvas.turns).size > 2, 'glyphs need independent angles');
      assert.ok(image.width <= scene.scale.width * 0.54 + 1);
      assert.ok(image.height <= 370, 'oversized glyphs stay inside the cut-in height');
      assert.ok(image.width <= canvas.width / 3, '3x texture must render at logical size');
    };
    rendered(source);
    i18n.setLanguage('en');
    const english = i18n.t(source).toUpperCase();
    assert.equal(/\p{Script=Han}/u.test(english), false);
    rendered(english);
    i18n.setLanguage('zh-CN');
    rendered(source);
    root.destroy();
    assert.equal(textures.size, 0);
    i18n.setLanguage('en');
    assert.equal(textures.size, 0, 'destroyed effects must unsubscribe from language changes');
  }
});

test('selection and combat-ready labels follow the chosen language', () => {
  const { i18n } = setup();
  for (const key of ['CHARACTER SELECT', 'STAGE SELECT', 'SELECT YOUR FIGHTER', 'GET READY', 'READY', 'SELECT']) {
    assert.ok(/\p{Script=Han}/u.test(i18n.t(key)), key);
    i18n.setLanguage('en');
    assert.equal(i18n.t(key), key);
    i18n.setLanguage('zh-CN');
  }
});
