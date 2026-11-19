const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../src/game.js'), 'utf8');
const context = { window:{}, Phaser:{Scene:class {}, Math:{Clamp:(n,a,b)=>Math.min(b,Math.max(a,n))}},
  document:{getElementById:()=>null,querySelector:()=>null}, location:{search:''},
  URL, URLSearchParams, history:{replaceState(){}}, console, setTimeout, clearTimeout, AbortController };
vm.runInNewContext(source.slice(0, source.indexOf('  const game = new Phaser.Game')) +
  'window.testGame = {Select,Load,Fight,scanFrameCached,compactStagePreview};})();', context);
const {Select, Load, Fight, scanFrameCached, compactStagePreview} = context.window.testGame;

function select(mode='raid',seat='guest') {
  const scene = new Select();
  Object.assign(scene, {mode,pvpSeat:seat,stageIds:['a','b'],stageIndex:0,locked:false,drawingMap:false,
    refreshStageDeck(){},refresh(){},broadcastStage(){this.broadcasts=(this.broadcasts||0)+1;}});
  return scene;
}
test('cooperative guest cannot change or lock the host map', () => {
  const scene = select(); scene.shiftStage(1); scene.confirmStage();
  assert.equal(scene.stageIndex,0); assert.equal(scene.stageConfirmed,undefined); assert.equal(scene.broadcasts,undefined);
});
test('cooperative host changes map and broadcasts it', () => {
  const scene = select('raid','host'); scene.shiftStage(1);
  assert.equal(scene.stageIndex,1); assert.equal(scene.stageConfirmed,false); assert.equal(scene.broadcasts,1);
});
test('locked transitions reject map changes and mode switches', () => {
  const scene = select('dummy',''); scene.locked=true; scene.shiftStage(1); scene.setMode('raid');
  assert.equal(scene.stageIndex,0); assert.equal(scene.mode,'dummy');
});
test('raid room confirm toggles ready instead of starting a local match', () => {
  const scene = select(); let ready;
  scene.ensureProfile=()=>({ready:false}); scene.setReady=value=>{ready=value;}; scene.confirm();
  assert.equal(ready,true);
});
test('single-player raid uses its selected hero, never cached previous duel metadata', () => {
  const scene = new Load(); const hero = {displayName:'本局英灵'};
  scene.pack={raid:true,p1Id:'new',p2Id:'new',p1:hero,p2:hero};
  scene.cache={json:{get:()=>({displayName:'旧角色'})}};
  scene.registry={get:()=>({fighters:{},playable:[]})}; scene.load={off(){},on(){}};
  scene.queueFightAssets=()=>{}; scene.finishLoad=()=>{}; scene.create();
  assert.equal(scene.pack.p1,hero); assert.equal(scene.pack.p2,hero);
});
test('loading checks every opponent, including the raid boss', () => {
  const scene = new Load(); const keys = new Set(['p1-idle']); scene.textures={exists:key=>keys.has(key)};
  scene.pack={p1Id:'a',p2Id:'b'}; assert.equal(scene.requiredFightersReady(),false);
  keys.add('p2-idle'); assert.equal(scene.requiredFightersReady(),true);
  scene.pack.raid=true; scene.pack.bossId='c'; assert.equal(scene.requiredFightersReady(),false);
  keys.add('boss-idle'); assert.equal(scene.requiredFightersReady(),true);
});
test('cooldowns follow combat time, independent of wall-clock pause duration', () => {
  const scene = new Fight(); scene.combatNow=1000;
  const actor={mp:100,sp:100,moveCdUntil:{}};
  scene.spend(actor,'skill'); assert.equal(actor.mp,68);
  assert.equal(scene.skillCdLeft(actor,'skill'),5000);
  scene.time={now:999999}; // A resumed Phaser clock advances to the frame timestamp.
  assert.equal(scene.skillCdLeft(actor,'skill'),5000);
  scene.combatNow+=5000; assert.equal(scene.skillCdLeft(actor,'skill'),0);
});
test('unchanged held input is throttled but every attack edge is sent immediately', () => {
  const scene = new Fight(); let count=0; let pad={left:true};
  Object.assign(scene,{isHost:false,combatNow:1000,net:{connected:true,send(){count++;}},readLocalPad:()=>pad});
  scene.sendLocalInput(); scene.combatNow+=2; scene.sendLocalInput(); assert.equal(count,1);
  pad={left:true,justK:true}; scene.sendLocalInput(); assert.equal(count,2);
  pad={left:false}; scene.sendLocalInput(); assert.equal(count,3);
});
test('actor status deadlines translate between different peer clocks', () => {
  const scene = new Fight(); scene.combatNow=100000;
  const actor={sprite:{setVelocity(){}},syncFacingVisual(){},plantFrame(){},move:'idle'};
  scene.applyActor(actor,{clock:5000,x:1,y:2,hp:100,move:'idle',stunUntil:5300,downedUntil:0,invulnUntil:5500,cd:{skill:1200}});
  assert.equal(actor.stunUntil,100300); assert.equal(actor.invulnUntil,100500);
  assert.equal(actor.downedUntil,0); assert.equal(actor.moveCdUntil.skill,101200);
});
test('frame scan cache invalidates when the same key is reused for another texture', () => {
  let texture={}; const scene={textures:{get:()=>texture}};
  const first=scanFrameCached(scene,'p1-idle',0); const cached=scanFrameCached(scene,'p1-idle',0);
  assert.equal(first,cached); texture={}; assert.notEqual(scanFrameCached(scene,'p1-idle',0),first);
});
test('stage preview caps texture dimensions while preserving aspect ratio', () => {
  let size, removed, renamed, draws=0;
  const scene={textures:{exists:()=>true,get:()=>({getSourceImage:()=>({width:4096,height:2048}),setFilter(){}}),
    createCanvas:(key,w,h)=>{size=[w,h];return {width:w,height:h,context:{drawImage(){draws++;}},refresh(){}};},
    remove:key=>{removed=key;},renameTexture:(a,b)=>{renamed=b;}}};
  context.Phaser.Textures={FilterMode:{LINEAR:1}};
  compactStagePreview(scene,'stage-thumb-a');
  assert.deepEqual(size,[1024,512]); assert.equal(draws,1); assert.equal(removed,renamed);
});

test('leaving selection preserves the map drawn for the match in its share URL', () => {
  const scene=select('pve','');
  Object.assign(scene,{locked:true,playable:['hero-a','hero-b'],p1Index:0,p2Index:1,cpuDiff:'fair',
    registry:{get:()=>({p1Id:'hero-a',p2Id:'hero-b',stageId:'b'})}});
  context.location.href='http://localhost:8788/?stage=a';
  let result;context.history.replaceState=(_state,_title,url)=>{result=url;};
  scene.rememberSelection();assert.equal(result.searchParams.get('stage'),'b');
});

test('solo raid HUD contains only the active player, with no phantom opponent portrait', () => {
  const scene = new Fight();const player={prefix:'p1'},hidden={prefix:'p2'};
  Object.assign(scene,{raid:true,pack:{raidSolo:true},p1:player,p2:hidden,textures:{exists:()=>true}});
  const fluent=()=>({setScrollFactor(){return this;},setDepth(){return this;},setDisplaySize(){return this;},setOrigin(){return this;}});
  scene.add={sprite:fluent,text:fluent};scene.buildHudChrome();
  assert.equal(scene.hudFaces.length,1);assert.equal(scene.hudFaces[0].actor,player);
  assert.equal(scene.hudCdTexts.length,1);
});
