const express = require("express");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

let tribes = [];
let players = [];

// 🎨 kolory plemion (losowe ale stałe)
const tribeColors = {};

function getColor(id){
  if(!tribeColors[id]){
    const colors = ["#ff4d4d","#4da6ff","#4dff88","#ffd24d","#b84dff","#ff884d"];
    tribeColors[id] = colors[id % colors.length];
  }
  return tribeColors[id];
}

// UTF
async function getUTF(url){
  const res = await axios.get(url, { responseType:"arraybuffer" });
  return Buffer.from(res.data,"binary").toString("utf8");
}

// LOAD
async function loadMap(){
  try{
    const allyData = await getUTF("https://pl224.plemiona.pl/map/ally.txt");

    tribes = allyData.split("\n").map(line=>{
      const [id,name,tag,members,villages,points] = line.split(",");

      return {
        id,
        name: decodeURIComponent((name||"").replace(/\+/g," ")),
        tag: decodeURIComponent((tag||"").replace(/\+/g," ")),
        members:+members||0,
        villages:+villages||0,
        points:+points||0,
        color:getColor(id)
      };
    });

    const playerData = await getUTF("https://pl224.plemiona.pl/map/player.txt");

    players = playerData.split("\n").map(line=>{
      const [id,name,tribe,villages,points] = line.split(",");

      const t = tribes.find(x=>x.id==tribe);

      return {
        id,
        name: decodeURIComponent((name||"").replace(/\+/g," ")),
        tribeId: tribe,
        tribe: t ? t.tag : "",
        color: t ? t.color : "#888",
        villages:+villages||0,
        points:+points||0
      };
    });

    console.log("MAP OK");
  }catch(e){
    console.log("ERR:",e.message);
  }
}

loadMap();
setInterval(loadMap,1000*60*5);

// STATIC
app.use(express.static(path.join(__dirname,"public")));

// API
app.get("/api/tribes",(req,res)=>{
  res.json(tribes.sort((a,b)=>b.points-a.points));
});

app.get("/api/players",(req,res)=>{
  res.json(players.sort((a,b)=>b.points-a.points));
});

// 🔥 gracze plemienia
app.get("/api/tribe/:id",(req,res)=>{
  const id = req.params.id;
  res.json(players.filter(p=>p.tribeId==id));
});

app.listen(PORT,()=>console.log("Server działa"));
