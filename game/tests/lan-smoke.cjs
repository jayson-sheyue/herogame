// Integration check against a running serve.py, with isolated temporary rooms.
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.HEROGAME_URL || 'http://127.0.0.1:8788';
const url = new URL(base);
const context={window:{},location:{protocol:url.protocol,hostname:url.hostname,port:url.port},
  WebSocket,fetch:(target,options)=>fetch(new URL(target,base),options),setTimeout,clearTimeout,AbortController,console};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/net.js'),'utf8'),context);
const Room=context.window.HeroNet.NetRoom;
const rooms=[new Room(),new Room(),new Room(),new Room()];
function receive(net,type,predicate=()=>true) {
  return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{net.on(type,null);reject(Error('timeout: '+type));},3000);
    net.on(type,msg=>{if(predicate(msg)){clearTimeout(timer);net.on(type,null);resolve(msg);}});
  });
}
(async()=>{
  try {
    const host=await rooms[0].create(); assert.match(host.room,/^[A-Z0-9]{4}$/);
    const [first,second]=await Promise.all([rooms[1].join(host.room),rooms[2].join(host.room)]);
    assert.equal(new Set([first.seat,second.seat]).size,2);
    const full=await rooms[3].join(host.room).then(()=>null,e=>e);
    assert.ok(full?.message.includes('满')); assert.equal(rooms[3].connected,false);
    const ready=receive(rooms[0],'ready'); rooms[1].send({type:'ready',ready:true}); assert.equal((await ready).ready,true);
    const input=receive(rooms[0],'input'); rooms[1].send({type:'input',left:true,justK:true});
    const packet=await input; assert.equal(packet.left,true);assert.equal(packet.justK,true);
    const state=receive(rooms[1],'state');rooms[0].send({type:'state',p1:{clock:1000,hp:299}});assert.equal((await state).p1.hp,299);
    const leave=receive(rooms[0],'peer',m=>m.event==='left');rooms[2].close();assert.equal((await leave).event,'left');
    const retry=await rooms[3].join(host.room);assert.ok(retry.seat);
    console.log('PASS: three-player room, full-room rejection, ready/input/state relay, disconnect, retry');
  } finally { rooms.forEach(room=>room.close()); }
})().catch(error=>{console.error(error.message);process.exitCode=1;});
