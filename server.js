const express = require("express");
const axios = require("axios");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

let tribes = [];
let players = [];

// plik historii
const FILE = "history.json";

// kolory
const tribeColors = {
  "AMA":"#ff8000",
  "FF":"#00e5ff",
  "AK":"#0033ff",
  "OB":"#ff0000"
};

// UTF
async function getUTF(url){
  const res = await axios.get(url,{responseType:"arraybuffer"});
  return Buffer.from(res.data,"binary").toString("utf8");
}

// 🔥 LOAD MAP
async function loadMap(){
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

  console.log("MAP OK");
}

// 🔥 ZAPIS HISTORII
function saveHistory(){
  let data = {};

  if(fs.existsSync(FILE)){
    data = JSON.parse(fs.readFileSync(FILE));
  }

  const today = new Date().toISOString().slice(0,10);

  data[today] = tribes;

  fs.writeFileSync(FILE, JSON.stringify(data,null,2));
}

// 🔥 OBLICZ PRZYROST
function getGains(){
  if(!fs.existsSync(FILE)) return {};

  const data = JSON.parse(fs.readFileSync(FILE));
  const days = Object.keys(data).sort();

  if(days.length < 2) return {};

  const today = data[days[days.length-1]];
  const prev = data[days[days.length-2]];

  let gains = {};

  today.forEach(t=>{
    const p = prev.find(x=>x.tag===t.tag);

    gains[t.tag] = {
      points: p ? t.points - p.points : 0,
      villages: p ? t.villages - p.villages : 0,
      members: p ? t.members - p.members : 0
    };
  });

  return gains;
}

// START
async function start(){
  await loadMap();
  saveHistory();
}
start();

setInterval(async ()=>{
  await loadMap();
  saveHistory();
},1000*60*5);

// STATIC
app.use(express.static(path.join(__dirname,"public")));

// API
app.get("/api/dashboard",(req,res)=>{
  const gains = getGains();

  const merged = tribes.map(t=>{
    return {
      ...t,
      gain: gains[t.tag] || {points:0,villages:0,members:0}
    };
  });

  res.json(merged.sort((a,b)=>b.points-a.points));
});

app.listen(PORT,()=>console.log("Server działa"));
