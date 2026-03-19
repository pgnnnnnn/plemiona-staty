const express = require("express");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

let tribes = [];
let players = [];

// 🔥 FUNKCJA DEKODOWANIA (naprawia polskie znaki)
function decode(text){
  try{
    return decodeURIComponent(escape(text));
  }catch{
    return text;
  }
}

// 🔄 LOAD MAP
async function loadMap(){
  try{
    // PLEMIONA
    const ally = await axios.get("https://pl224.plemiona.pl/map/ally.txt");

    tribes = ally.data.split("\n").map(line=>{
      const [id,name,tag,members,villages,points] = line.split(",");

      return {
        id,
        name: decode(name || ""),
        tag: decode(tag || ""),
        members: +members || 0,
        villages: +villages || 0,
        points: +points || 0
      };
    });

    // GRACZE (NAPRAWIONE)
    const player = await axios.get("https://pl224.plemiona.pl/map/player.txt");

    players = player.data.split("\n").map(line=>{
      const [id,name,tribe,villages,points] = line.split(",");

      return {
        id,
        name: decode(name || ""),
        tribe,
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

// STATIC + UTF-8
app.use(express.static(path.join(__dirname,"public")));

app.use((req,res,next)=>{
  res.setHeader("Content-Type","text/html; charset=utf-8");
  next();
});

// API
app.get("/api/tribes",(req,res)=>{
  res.json(tribes.sort((a,b)=>b.points-a.points));
});

app.get("/api/players",(req,res)=>{
  res.json(players.sort((a,b)=>b.points-a.points));
});

app.listen(PORT,()=>console.log("Server działa"));
