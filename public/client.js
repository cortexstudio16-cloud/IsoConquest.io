const socket = io();
const c = document.getElementById('c');
const ctx = c.getContext('2d');
const SIZE = 30, W = 25, H = 18;
const HEX_NEI = [[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]];
c.width = SIZE*(W+2); c.height = SIZE*(H+1);
let cells = {}, players = {}, myId = null;
socket.on('state', data => { cells = data.cells; players = data.players; draw(); });
function hexToPixel(q,r){
  const x = SIZE*(q + (r&1)*0.5 + 1);
  const y = SIZE*(r*0.75 + 1);
  return {x,y};
}
function draw(){
  ctx.clearRect(0,0,c.width,c.height);
  let myUnits=0, myCases=0;
  for(let k in cells){
    const cc = cells[k];
    const [q,r] = k.split(',').map(Number);
    const {x,y} = hexToPixel(q,r);
    ctx.beginPath();
    for(let i=0;i<6;i++){
      const angle = Math.PI/3*i;
      ctx.lineTo(x+SIZE*0.45*Math.cos(angle), y+SIZE*0.45*Math.sin(angle));
    }
    ctx.closePath();
    ctx.fillStyle = cc.owner ? players[cc.owner]?.color || '#888' : '#222';
    ctx.fill();
    ctx.strokeStyle='#000'; ctx.stroke();
    if(cc.units>0){
      ctx.fillStyle='#fff'; ctx.font='12px sans-serif'; ctx.textAlign='center';
      ctx.fillText(cc.units, x, y+4);
    }
    if(cc.owner === socket.id){ myUnits+=cc.units; myCases++; }
  }
  document.getElementById('units').textContent = myUnits;
  document.getElementById('cases').textContent = myCases;
}
let selected = null;
c.addEventListener('click', e => {
  const rect = c.getBoundingClientRect();
  const px = e.clientX - rect.left, py = e.clientY - rect.top;
  for(let k in cells){
    const [q,r] = k.split(',').map(Number);
    const {x,y} = hexToPixel(q,r);
    if(Math.hypot(px-x, py-y) < SIZE*0.4){
      if(!selected){ selected=k; }
      else if(selected !== k){
        socket.emit('move',{from:selected, to:k, send:0.5});
        selected=null;
      }
      break;
    }
  }
});
