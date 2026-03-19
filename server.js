const express = require("express");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

let tribes = [];
let players = [];

// 🔥 RĘCZNE KOLORY (jak mapa — możesz zmieniać)
const tribeColors = {
  "VIP":"#ff0000",
  "VIP2":"#ff3333",
  "ZD":"#00ff22",
  "KMIC":"#1100ff",
  "R":"#ff6a00",
  "FER":"#55499c"
};

// UTF
async function getUTF(url){
  const res = await axios.get(url,{responseType:"arraybuffer"});
  return Buffer.from(res.data,"binary").toString("utf8");
}

// LOAD
async function loadMap(){
  try{
    const ally = await getUTF("https://pl224.plemiona.pl/map/ally.txt");

    tribes = ally.split("\n").map(line=>{
      const [id,name,tag,members,villages,points] = line.split(",");

      const cleanTag = decodeURIComponent((tag||"").replace(/\+/g," "));

      return {
        id,
        tag: cleanTag,
        members:+members||0,
        villages:+villages||0,
        points:+points||0,
        color: tribeColors[cleanTag] || "#888"
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

// 🔥 członkowie plemienia
app.get("/api/tribe/:id",(req,res)=>{
  res.json(players.filter(p=>p.tribeId==req.params.id));
});

app.listen(PORT,()=>console.log("Server działa"));
