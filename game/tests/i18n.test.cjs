const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../src/i18n.js'), 'utf8');
function setup(stored = new Map(), elements = [], browser = { languages: ['zh-CN'], language: 'zh-CN' }) {
  const select = { value: '' }, events = {};
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
    getElementById: (id) => id === 'languageSelect' ? select : null,
  };
  const window = { addEventListener: (type, fn) => { events[type] = fn; } };
  vm.runInNewContext(source.replace('const heroes = {', 'window.testLocales = {zh,en,ja}; const heroes = {'), {
    window,
    document,
    navigator: browser,
    localStorage: { getItem: (k) => stored.get(k), setItem: (k, v) => stored.set(k, v) },
  });
  return { i18n: window.HeroI18n, document, stored, select, events, locales: window.testLocales };
}
test('first visit matches browser language variants without saving an implicit choice', () => {
  for (const [locale, expected] of [['zh', 'zh-CN'], ['zh-CN', 'zh-CN'], ['zh-TW', 'zh-CN'],
    ['zh-Hant-HK', 'zh-CN'], ['ZH_hans_CN', 'zh-CN'], ['en-US', 'en'], ['en-GB', 'en'], ['ja-JP', 'ja'], ['ja', 'ja'], ['fr-FR', 'en']]) {
    const env = setup(new Map(), [], { languages: [locale], language: locale });
    assert.equal(env.i18n.language, expected, locale);
    assert.equal(env.i18n.preference, 'auto');
    assert.equal(env.document.documentElement.lang, expected);
    assert.equal(env.select.value, 'auto');
    assert.equal(env.stored.has('herogame-language'), false);
  }
});
test('browser preference order wins, with language-only and unsupported-language fallbacks', () => {
  for (const [browser, expected] of [
    [{ languages: ['en-GB', 'zh-CN'], language: 'en-GB' }, 'en'],
    [{ languages: ['ja-JP', 'zh-Hant', 'en'], language: 'ja-JP' }, 'ja'],
    [{ languages: ['fr-FR', 'ja-JP', 'en'], language: 'fr-FR' }, 'ja'],
    [{ languages: ['fr-FR', 'en', 'zh'], language: 'fr-FR' }, 'en'],
    [{ languages: [], language: 'zh-SG' }, 'zh-CN'],
    [{ language: 'en-AU' }, 'en'], [{}, 'en'], [null, 'en'],
  ]) assert.equal(setup(new Map(), [], browser).i18n.language, expected);
});
test('both saved manual choices override the browser and survive reopening', () => {
  for (const [saved, browser] of [['en', { language: 'zh-CN' }], ['zh-CN', { language: 'ja-JP' }], ['ja', {language: 'en-US'}]]) {
    const env = setup(new Map([['herogame-language', saved]]), [], browser);
    assert.equal(env.i18n.language, saved);
    assert.equal(env.select.value, saved);
    env.i18n.setLanguage(saved);
    assert.equal(setup(env.stored, [], browser).i18n.language, saved);
    assert.equal(env.i18n.setLanguage('fr'), false);
    assert.equal(env.i18n.preference, saved);
  }
  assert.equal(setup(new Map([['herogame-language', 'invalid']]), [], {language: 'en'}).i18n.language, 'en');
});
test('automatic mode can be restored and follows languagechange without overwriting manual choices', () => {
  const browser = { languages: ['en-US'], language: 'en-US' }, env = setup(new Map(), [], browser);
  let changes = 0;
  env.i18n.onChange(() => { changes++; });
  browser.languages = ['zh-CN'];
  env.events.languagechange();
  assert.equal(env.i18n.language, 'zh-CN');
  assert.equal(changes, 1);
  env.events.languagechange();
  assert.equal(changes, 1);
  env.i18n.setLanguage('en');
  env.events.languagechange();
  assert.equal(env.i18n.language, 'en');
  assert.equal(changes, 2);
  assert.equal(env.i18n.setLanguage('auto'), true);
  assert.equal(env.i18n.language, 'zh-CN');
  assert.equal(env.stored.get('herogame-language'), 'auto');
  assert.equal(env.select.value, 'auto');
  assert.equal(setup(env.stored, [], {language: 'en-GB'}).i18n.language, 'en');
});
test('language setting still works for the session when browser storage is blocked', () => {
  const document = { documentElement: {}, querySelectorAll: () => [], getElementById: () => null },
    window = {};
  vm.runInNewContext(source, {
    window,
    document,
    navigator: {language: 'en-US'},
    localStorage: {
      getItem() {
        throw Error('blocked');
      },
      setItem() {
        throw Error('blocked');
      },
    },
  });
  assert.equal(window.HeroI18n.language, 'en');
  assert.equal(window.HeroI18n.setLanguage('zh-CN'), true);
  assert.equal(window.HeroI18n.t('出招表'), '出招表');
  assert.equal(window.HeroI18n.setLanguage('auto'), true);
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

test('Japanese covers every registered message and localizes built-in names and supers', () => {
  const {i18n, locales, document} = setup(new Map([['herogame-language', 'ja']]));
  for (const key of Object.keys(locales.zh)) {
    assert.ok(Object.hasOwn(locales.ja, key), `Missing Japanese translation: ${key}`);
    assert.equal(i18n.t(key), locales.ja[key]);
    assert.equal(i18n.t(key).startsWith('help.'), false);
  }
  assert.equal(document.documentElement.lang, 'ja');
  assert.equal(document.title, '英霊大乱闘 · PVE');
  assert.equal(i18n.heroName('id_1787793997', {displayName:'吕布'}), '呂布');
  assert.equal(i18n.heroName('id_1787634312', {}, true), 'ホーキング');
  assert.equal(i18n.stageName('baimen_bronze_sparrow', {}), '白門・銅雀台');
  assert.equal(i18n.t('赤兔战争践踏'), '赤兎戦陣蹂躙');
  assert.equal(i18n.t('YOU WIN'), '勝利');
  assert.equal(i18n.t('help.skill').includes('奥義'), true);
});

test('Japanese import metadata is preferred without changing the authored names', () => {
  const {i18n} = setup(new Map([['herogame-language', 'ja']]));
  const hero = {displayName: '原名', displayNameJa: '独自キャラ', i18n: {ja: {displayName:'翻訳名'}}};
  const original = JSON.stringify(hero);
  assert.equal(i18n.heroName('custom', hero), '翻訳名');
  assert.equal(i18n.stageName('custom', {displayNameJa:'独自ステージ'}), '独自ステージ');
  assert.equal(i18n.heroName('custom', {displayName:'作者原名'}), '作者原名');
  assert.equal(i18n.stageName('constructor', {displayName:'Custom Stage'}), 'Custom Stage');
  assert.equal(JSON.stringify(hero), original);
});

test('Auto switches live to Japanese while manual language selection keeps priority', () => {
  const browser = {languages:['en-US']}, env = setup(new Map(), [], browser);
  browser.languages = ['ja-JP'];
  env.events.languagechange();
  assert.equal(env.i18n.language, 'ja');
  env.i18n.setLanguage('zh-CN');
  env.events.languagechange();
  assert.equal(env.i18n.language, 'zh-CN');
  env.i18n.setLanguage('auto');
  assert.equal(env.i18n.language, 'ja');
});
