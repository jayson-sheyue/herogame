const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

function setup(fetchOverride) {
  const sockets = [];
  class Socket {
    static OPEN = 1; static CONNECTING = 0;
    constructor(url) { this.url = url; this.readyState = 0; this.sent = []; sockets.push(this); }
    open() { this.readyState = 1; this.onopen?.(); }
    close() { this.readyState = 3; this.onclose?.(); }
    message(data) { this.onmessage?.({ data: JSON.stringify(data) }); }
    send(data) { if (this.readyState !== 1) throw Error('not open'); this.sent.push(JSON.parse(data)); }
  }
  const context = { window: {}, location: { protocol: 'http:', hostname: 'localhost', port: '8788' },
    WebSocket: Socket, fetch: fetchOverride || (async () => ({ json: async () => ({ wsPort: 8789 }) })),
    setTimeout, clearTimeout, AbortController, console };
  vm.runInNewContext(fs.readFileSync(process.env.NET_SOURCE || path.join(__dirname, '../src/net.js'), 'utf8'), context);
  return { net: new context.window.HeroNet.NetRoom(), sockets, context };
}
const tick = () => new Promise(resolve => setImmediate(resolve));

test('concurrent connect waits for one open socket', async () => {
  const { net, sockets } = setup();
  const a = net.connect(); const b = net.connect();
  await tick();
  const count = sockets.length;
  sockets.forEach(s => s.open()); await Promise.all([a, b]); net.close();
  assert.equal(count, 1);
});
test('connect during handshake does not resolve prematurely', async () => {
  const { net, sockets } = setup();
  const a = net.connect(); await tick();
  let ready = false; const b = net.connect().then(() => { ready = true; });
  await tick(); const premature = ready;
  sockets[0].open(); await Promise.all([a, b]); net.close();
  assert.equal(premature, false);
});
test('cancel during discovery never opens a late socket', async () => {
  let release; const { net, sockets } = setup(() => new Promise(r => { release = r; }));
  const pending = net.connect().catch(e => e);
  net.close(); release({ json: async () => ({ wsPort: 8789 }) }); await tick();
  const count = sockets.length; sockets.forEach(s => s.open()); await pending; net.close();
  assert.equal(count, 0);
});
test('late close from old socket cannot disconnect replacement', async () => {
  const { net, sockets } = setup();
  const first = net.connect(); await tick(); sockets[0].open(); await first;
  const oldClose = sockets[0].onclose; net.close();
  const second = net.connect(); await tick(); sockets[1].open(); await second;
  oldClose(); const connected = net.connected; net.close(); assert.equal(connected, true);
});
test('close clears room identity and queued scene messages', async () => {
  const { net, sockets } = setup(); const c = net.connect(); await tick(); sockets[0].open(); await c;
  sockets[0].message({type:'joined',seat:'guest',room:'ABCD'}); sockets[0].message({type:'start'});
  net.close(); assert.equal(net.room, ''); assert.equal(net.seat, ''); assert.equal(net._inbox.length, 0);
});
test('room request completes and releases temporary handlers', async () => {
  const { net, sockets } = setup(); const request = net.create(); await tick(); sockets[0].open(); await tick();
  assert.equal(sockets[0].sent[0].type, 'create'); sockets[0].message({type:'created',room:'ABCD',seat:'host'});
  assert.equal((await request).room, 'ABCD'); assert.equal(net.handlers.created, null); net.close();
});
test('failed join closes connection and can be retried', async () => {
  const { net, sockets } = setup(); const request = net.join('ABCD').catch(e => e); await tick(); sockets[0].open(); await tick();
  sockets[0].message({type:'error',message:'房间不存在'}); const error = await request;
  const connected = net.connected; net.close(); assert.equal(error.message, '房间不存在'); assert.equal(connected, false);
});
