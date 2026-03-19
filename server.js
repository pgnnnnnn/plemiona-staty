const express = require("express");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

let tribes = [];
let players = [];
let gains = [];

// 🔄 MAP DATA
async function loadMap(){
  try{
    const ally = await axios.get("https://pl224.plemiona.pl/map/ally.txt");
    tribes = ally.data.split("\n").map(line=>{
      const [id,name,tag,members,villages,points] = line.split(",");
      return {
        id,
        tag: tag || "",
        members: +members || 0,
        villages: +villages || 0,
        points: +points || 0
      };
    });

    const player = await axios.get("https://pl224.plemiona.pl/map/player.txt");
    players = player.data.split("\n").map(line=>{
      const [id,name,tribe,villages,points] = line.split(",");
      return {
        id,
        name: name || "",
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

// 🔥 TWSTATS GAIN (LEKKI SCRAP)
async function loadGain(){
  try{
    const {data} = await axios.get("https://pl.twstats.com/pl224/index.php?page=ally", {timeout:8000});

    const rows = data.split("<tr>").slice(1);

    gains = rows.map(r=>{
      const cols = r.split("<td>");

      const tag = (cols[2] || "").replace(/<[^>]+>/g,"").trim();
      const gain = (cols[6] || "").replace(/<[^>]+>/g,"").trim();

      return {
        tag,
        gain: parseInt(gain.replace(/\D/g,"")) || 0
      };
    }).filter(x=>x.tag);

    console.log("GAIN OK");
  }catch(e){
    console.log("GAIN ERR:", e.message);
  }
}

// INIT
loadMap();
loadGain();

setInterval(loadMap, 1000 * 60 * 5);
setInterval(loadGain, 1000 * 60 * 10);

// STATIC
app.use(express.static(path.join(__dirname,"public")));

// API
app.get("/api/tribes",(req,res)=>{
  res.json(tribes.sort((a,b)=>b.points-a.points));
});

app.get("/api/players",(req,res)=>{
  res.json(players.sort((a,b)=>b.points-a.points));
});

app.get("/api/gain",(req,res)=>{
  res.json(gains);
});

app.listen(PORT,()=>console.log("Server działa"));
