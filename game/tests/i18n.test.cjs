const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../src/i18n.js'), 'utf8');
function setup(stored = new Map(), elements = []) {
  const document = {
    documentElement: {},
    querySelectorAll: (selector) =>
      elements.filter((el) => {
        return selector === '[data-i18n]'
          ? el.dataset.i18n
          : selector === '[data-i18n-html]'
            ? el.dataset.i18nHtml
            : el.dataset.i18nAria;
      }),
    getElementById: () => null,
  };
  const window = {};
  vm.runInNewContext(source, {
    window,
    document,
    navigator: { language: 'en-US' },
    localStorage: { getItem: (k) => stored.get(k), setItem: (k, v) => stored.set(k, v) },
  });
  return { i18n: window.HeroI18n, document, stored };
}
test('Chinese remains the default; only a saved explicit English choice changes startup', () => {
  const first = setup();
  assert.equal(first.i18n.language, 'zh-CN');
  assert.equal(first.document.documentElement.lang, 'zh-CN');
  first.i18n.setLanguage('en');
  assert.equal(first.stored.get('herogame-language'), 'en');
  const reopened = setup(first.stored);
  assert.equal(reopened.i18n.language, 'en');
  assert.equal(reopened.document.title, 'Hero Clash · PVE');
  assert.equal(reopened.i18n.setLanguage('fr'), false);
  assert.equal(reopened.i18n.language, 'en');
});
test('language setting still works for the session when browser storage is blocked', () => {
  const document = { documentElement: {}, querySelectorAll: () => [], getElementById: () => null },
    window = {};
  vm.runInNewContext(source, {
    window,
    document,
    localStorage: {
      getItem() {
        throw Error('blocked');
      },
      setItem() {
        throw Error('blocked');
      },
    },
  });
  assert.equal(window.HeroI18n.language, 'zh-CN');
  assert.equal(window.HeroI18n.setLanguage('en'), true);
  assert.equal(window.HeroI18n.t('出招表'), 'Move List');
});
test('English translates all registered HTML copy and accessible labels; Chinese restores them', () => {
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  const elements = [...html.matchAll(/data-i18n(?:-html|-aria)?="([^"]+)"/g)].map((match) => ({
    dataset: match[0].startsWith('data-i18n-html')
      ? { i18nHtml: match[1] }
      : match[0].startsWith('data-i18n-aria')
        ? { i18nAria: match[1] }
        : { i18n: match[1] },
    setAttribute(key, value) {
      this[key] = value;
    },
  }));
  const { i18n } = setup(new Map(), elements);
  i18n.setLanguage('en');
  for (const el of elements) {
    const value = el.textContent || el.innerHTML || el['aria-label'];
    assert.equal(typeof value, 'string');
    assert.equal(/\p{Script=Han}/u.test(value), false, value);
    assert.equal(value.startsWith('help.'), false, value);
  }
  i18n.setLanguage('zh-CN');
  assert.equal(i18n.t('help.move').includes('二段跳'), true);
});
test('live text bindings switch both ways and unsubscribe when their object is destroyed', () => {
  const { i18n } = setup();
  let destroyed;
  const text = {
    setText(v) {
      this.value = v;
      return this;
    },
    once(event, callback) {
      assert.equal(event, 'destroy');
      destroyed = callback;
    },
  };
  i18n.bindText(text, '初级');
  assert.equal(text.value, '初级');
  i18n.setLanguage('en');
  assert.equal(text.value, 'EASY');
  i18n.setLanguage('zh-CN');
  assert.equal(text.value, '初级');
  destroyed();
  i18n.setLanguage('en');
  assert.equal(text.value, '初级');
});
test('asset names use English metadata or built-in labels while preserving authored source data', () => {
  const { i18n } = setup(),
    hero = { displayName: '蒋介石' },
    custom = { displayName: '自定义', displayNameEn: 'Custom Hero' };
  i18n.setLanguage('en');
  assert.equal(i18n.heroName('id_1786886794', hero), 'Chiang Kai-shek');
  assert.equal(i18n.heroName('id_1786886794', hero, true), 'Chiang');
  assert.equal(i18n.heroName('custom', custom), 'Custom Hero');
  assert.equal(hero.displayName, '蒋介石');
  assert.equal(i18n.heroName('unknown', { displayName: '原作者名称' }), '原作者名称');
  assert.equal(i18n.t('constructor'), 'constructor');
  assert.equal(i18n.stageName('constructor', { displayName: 'Custom Stage' }), 'Custom Stage');
  assert.equal(i18n.stageName('lunar_station_earth_view', { displayName: '月球空间站' }), 'Lunar Station');
  i18n.setLanguage('zh-CN');
  assert.equal(i18n.heroName('id_1786886794', hero), '蒋介石');
});
