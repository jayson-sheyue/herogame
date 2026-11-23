const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function setup(inkBox = null) {
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
        getImageData() {
          const data = new Uint8ClampedArray(inkBox ? canvas.width * canvas.height * 4 : 0);
          if (inkBox) for (const [x,y] of [[inkBox.left,inkBox.top], [inkBox.right,inkBox.bottom]])
            data[(y * canvas.width + x) * 4 + 3] = 255;
          return { data };
        },
        drawImage(source, sx, sy, sw, sh, dx, dy, dw, dh) {
          canvas.crop = { sx, sy, sw, sh, dx, dy, dw, dh };
        },
      };
      canvas.getContext = () => ctx;
      return canvas;
    },
  };
  const context = { window, document, navigator: {language: 'zh-CN'}, localStorage: { getItem() {}, setItem() {} },
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

test('every built-in super repaints Chinese, English and Japanese effect glyphs and releases textures', () => {
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
      const maxW = scene.scale.width * (source === '奥义' ? 0.64 : 0.78);
      const maxH = 768 * (source === '奥义' ? 0.40 : 0.80);
      assert.ok(image.width <= maxW + 0.01 && image.height <= maxH + 0.01);
      assert.ok(Math.max(image.width / maxW, image.height / maxH) > 0.99,
        'lettering must fill its screen-sized envelope, even when the source font is small');
    };
    rendered(source);
    i18n.setLanguage('en');
    const english = i18n.t(source).toUpperCase();
    assert.equal(/\p{Script=Han}/u.test(english), false);
    rendered(english);
    i18n.setLanguage('ja');
    rendered(i18n.t(source));
    assert.ok(textures.values().next().value.ink.every(item => item.font.includes('BrushJP')));
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

test('transparent font margins cannot shrink the visible super lettering', () => {
  const { makeSekiroBrushKanji, scene, textures } = setup({ left: 40, top: 80, right: 100, bottom: 260 });
  const root = makeSekiroBrushKanji(scene, '赤兔战争践踏', 64);
  const image = root.children[0], ink = textures.get(image.key);
  assert.equal(ink.crop.sx, 40);
  assert.equal(ink.crop.sy, 80);
  assert.equal(ink.crop.sw, 61);
  assert.equal(ink.crop.sh, 181);
  assert.ok(Math.abs(image.height - 768 * 0.80) < 0.01);
  assert.ok(Math.abs(image.width / image.height - ink.width / ink.height) < 0.0001);
  root.destroy();
  assert.equal(textures.size, 0);
});
