const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.use(express.static('public'));
const W = 25, H = 18, SIZE = 30;
const HEX_NEI = [[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]];
let cells = {};
let players = {};
const colors = ['#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6','#1abc9c'];
function key(q,r){ return `${q},${r}`; }
function initMap(){
  for(let r=0;r<H;r++){
    for(let q=0;q<W;q++){
      if(Math.abs(q - W/2) + Math.abs(r - H/2) > 10) continue;
      cells[key(q,r)] = {owner:null, units:0};
    }
  }
}
initMap();
setInterval(() => {
  let owners = {};
  for(let k in cells){
    const c = cells[k];
    if(c.owner) owners[c.owner] = (owners[c.owner]||new Set()).add(k);
  }
  for(let k in cells){
    const c = cells[k];
    if(!c.owner) continue;
    c.units += 1;
    const [q,r] = k.split(',').map(Number);
    let isolated = true;
    for(const [dq,dr] of HEX_NEI){
      const nei = cells[key(q+dq,r+dr)];
      if(nei && nei.owner === c.owner){ isolated=false; break; }
    }
    if(isolated){ c.units = Math.max(0, c.units-20); if(c.units===0) c.owner=null; }
  }
  io.emit('state',{cells,players});
}, 1000);
io.on('connection', socket => {
  const color = colors.pop() || '#'+Math.floor(Math.random()*0xFFFFFF).toString(16);
  players[socket.id] = {color, name:'Joueur'+socket.id.substr(0,4)};
  const free = Object.keys(cells).filter(k => !cells[k].owner);
  const spawn = free[Math.floor(Math.random()*free.length)];
  if(spawn) cells[spawn] = {owner:socket.id, units:20};
  socket.on('move', data => {
    const {from,to,send} = data;
    const f = cells[from], t = cells[to];
    if(!f || f.owner !== socket.id || !t) return;
    const units = Math.floor(f.units * send);
    f.units -= units;
    if(t.owner === socket.id){ t.units += units; return; }
    if(units > t.units){ t.owner = socket.id; t.units = units - t.units; }
    else t.units -= units;
  });
  socket.on('disconnect', () => {
    colors.push(players[socket.id].color);
    delete players[socket.id];
    for(let k in cells) if(cells[k].owner === socket.id){ cells[k].owner=null; cells[k].units=0; }
  });
});
const port = process.env.PORT || 3000;
server.listen(port, () => console.log('IsoConquest live on', port));
