const express = require("express");
const axios = require("axios");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

let tribes = [];
let players = [];

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

// MAP
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
}

// SAVE HISTORY
function saveHistory(){
  let data = {};

  if(fs.existsSync(FILE)){
    data = JSON.parse(fs.readFileSync(FILE));
  }

  const now = new Date().toISOString();

  data[now] = tribes;

  fs.writeFileSync(FILE, JSON.stringify(data,null,2));
}

// CALC
function calc(){
  if(!fs.existsSync(FILE)) return [];

  const data = JSON.parse(fs.readFileSync(FILE));
  const keys = Object.keys(data).sort();

  if(keys.length < 2) return [];

  const now = data[keys[keys.length-1]];
  const prev = data[keys[keys.length-2]];

  const total = now.reduce((a,b)=>a+b.points,0);

  return now.map(t=>{
    const p = prev.find(x=>x.tag===t.tag) || {};

    const gain = t.points - (p.points||0);
    const dom = ((t.points / total) * 100).toFixed(2);

    return {
      ...t,
      gain,
      dom
    };
  }).sort((a,b)=>b.points-a.points);
}

// LOOP
async function loop(){
  await loadMap();
  saveHistory();
}
loop();
setInterval(loop,1000*60*5);

// STATIC
app.use(express.static(path.join(__dirname,"public")));

// API
app.get("/api/dashboard",(req,res)=>{
  res.json(calc());
});

app.listen(PORT,()=>console.log("Server działa"));
