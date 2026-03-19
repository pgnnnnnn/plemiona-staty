const express = require("express");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

let tribes = [];
let players = [];

// 🔥 UTF + poprawne kodowanie
async function getUTF(url){
  const res = await axios.get(url, {
    responseType: "arraybuffer"
  });

  return Buffer.from(res.data, "binary").toString("utf8");
}

// 🔄 LOAD MAP
async function loadMap(){
  try{
    const allyData = await getUTF("https://pl224.plemiona.pl/map/ally.txt");

    tribes = allyData.split("\n").map(line=>{
      const [id,name,tag,members,villages,points] = line.split(",");

      return {
        id,
        name: decodeURIComponent((name || "").replace(/\+/g," ")),
        tag: decodeURIComponent((tag || "").replace(/\+/g," ")),
        members: +members || 0,
        villages: +villages || 0,
        points: +points || 0
      };
    });

    const playerData = await getUTF("https://pl224.plemiona.pl/map/player.txt");

    players = playerData.split("\n").map(line=>{
      const [id,name,tribe,villages,points] = line.split(",");

      const tribeObj = tribes.find(t => t.id == tribe);

      return {
        id,
        name: decodeURIComponent((name || "").replace(/\+/g," ")),
        tribe: tribeObj ? tribeObj.tag : "",
        villages: +villages || 0,
        points: +points || 0
      };
    });

    console.log("MAP OK");
  }catch(e){
    console.log("MAP ERR:", e.message);
  }
}

// START
loadMap();
setInterval(loadMap, 1000 * 60 * 5);

// STATIC
app.use(express.static(path.join(__dirname,"public")));

// API
app.get("/api/tribes",(req,res)=>{
  res.json(tribes.sort((a,b)=>b.points-a.points));
});

app.get("/api/players",(req,res)=>{
  res.json(players.sort((a,b)=>b.points-a.points));
});

app.listen(PORT,()=>console.log("Server działa"));
