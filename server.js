const express = require("express");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

let tribes = [];
let players = [];

// 🎨 bardziej "mapowe" kolory
const palette = [
  "#e6194b","#3cb44b","#ffe119","#4363d8","#f58231",
  "#911eb4","#46f0f0","#f032e6","#bcf60c","#fabebe"
];

function getColor(id){
  return palette[id % palette.length];
}

async function getUTF(url){
  const res = await axios.get(url,{responseType:"arraybuffer"});
  return Buffer.from(res.data,"binary").toString("utf8");
}

async function loadMap(){
  try{
    const ally = await getUTF("https://pl224.plemiona.pl/map/ally.txt");

    tribes = ally.split("\n").map(line=>{
      const [id,name,tag,members,villages,points] = line.split(",");

      return {
        id,
        tag: decodeURIComponent((tag||"").replace(/\+/g," ")),
        members:+members||0,
        villages:+villages||0,
        points:+points||0,
        color:getColor(id)
      };
    });

    const player = await getUTF("https://pl224.plemiona.pl/map/player.txt");

    players = player.split("\n").map(line=>{
      const [id,name,tribe,villages,points] = line.split(",");

      const t = tribes.find(x=>x.id==tribe);

      return {
        id,
        name: decodeURIComponent((name||"").replace(/\+/g," ")),
        tribeId: tribe,
        tribe: t ? t.tag : "",
        color: t ? t.color : "#999",
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

app.use(express.static(path.join(__dirname,"public")));

app.get("/api/tribes",(req,res)=>{
  res.json(tribes.sort((a,b)=>b.points-a.points));
});

app.get("/api/players",(req,res)=>{
  res.json(players.sort((a,b)=>b.points-a.points));
});

app.get("/api/tribe/:id",(req,res)=>{
  res.json(players.filter(p=>p.tribeId==req.params.id));
});

app.listen(PORT,()=>console.log("Server działa"));
