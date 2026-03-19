const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

let tribes = [];
let players = [];
let history = {};

// 🔄 LOAD MAP
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

    const now = Date.now();

    // 🔥 HISTORIA
    tribes.forEach(t=>{
      if(!history[t.id]) history[t.id]=[];

      history[t.id].push({
        time: now,
        points: t.points
      });

      // max 288 wpisów = 24h (co 5 min)
      if(history[t.id].length > 288){
        history[t.id].shift();
      }
    });

    fs.writeFileSync("history.json", JSON.stringify(history));

    console.log("MAP OK");
  }catch(e){
    console.log("MAP ERR:", e.message);
  }
}

// LOAD HISTORY
if(fs.existsSync("history.json")){
  history = JSON.parse(fs.readFileSync("history.json"));
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

// 🔥 GAIN (24H)
app.get("/api/gain",(req,res)=>{

  const result = tribes.map(t=>{
    const h = history[t.id] || [];

    if(h.length < 2){
      return {...t, gain:0};
    }

    const first = h[0].points;
    const last = h[h.length-1].points;

    return {
      ...t,
      gain: last - first
    };
  });

  res.json(result.sort((a,b)=>b.gain-a.gain).slice(0,100));
});

app.listen(PORT,()=>console.log("Server działa"));
