const express = require("express");
const axios = require("axios");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

let tribes = [];

const HISTORY_FILE = "history.json";
const REPORTS_FILE = "reports.json";

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

  console.log("MAP OK");
}

// HISTORY
function saveHistory(){
  let data = {};
  if(fs.existsSync(HISTORY_FILE)){
    data = JSON.parse(fs.readFileSync(HISTORY_FILE));
  }

  const now = new Date().toISOString();
  data[now] = tribes;

  fs.writeFileSync(HISTORY_FILE, JSON.stringify(data,null,2));
}

// 🔥 RA/RO
function calcRaro(){
  if(!fs.existsSync(REPORTS_FILE)) return {};

  const reports = JSON.parse(fs.readFileSync(REPORTS_FILE));

  let result = {};

  reports.forEach(r=>{
    const atk = r.attacker.tribe;
    const def = r.defender.tribe;

    if(!result[atk]) result[atk] = { ra:0, ro:0 };
    if(!result[def]) result[def] = { ra:0, ro:0 };

    result[atk].ra += r.attacker.killed || 0;
    result[def].ro += r.defender.lost || 0;
  });

  return result;
}

// DASHBOARD
function calc(){
  if(!fs.existsSync(HISTORY_FILE)) return [];

  const data = JSON.parse(fs.readFileSync(HISTORY_FILE));
  const keys = Object.keys(data).sort();

  if(keys.length < 2) return [];

  const cur = data[keys[keys.length-1]];
  const prev = data[keys[keys.length-2]];

  const total = cur.reduce((a,b)=>a+b.points,0);
  const raro = calcRaro();

  return cur.map(t=>{
    const p = prev.find(x=>x.tag===t.tag) || {};
    const r = raro[t.tag] || { ra:0, ro:0 };

    return {
      ...t,
      gain: t.points - (p.points||0),
      dom: total ? ((t.points / total) * 100).toFixed(2) : 0,
      ra: r.ra,
      ro: r.ro
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
