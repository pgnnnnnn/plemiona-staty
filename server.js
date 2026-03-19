const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

let tribes = [];
let players = [];
let tribeAggro = {};

// 🎨 KOLORY
const tribeColors = {
  "AMA":"#ff8000","AMA!":"#ff8000","AMA$":"#ff8000","AMA.":"#ff8000",
  "FF":"#00e5ff","FF.":"#00e5ff","FF..":"#00e5ff","FF:":"#00e5ff",
  "AK":"#0033ff","AK!":"#0033ff","AK!!":"#0033ff","AK!!!":"#0033ff",
  "OB!":"#ff0000","OB":"#ff0000","OB?":"#ff0000",
};

// UTF
async function getUTF(url){
  const res = await axios.get(url,{responseType:"arraybuffer"});
  return Buffer.from(res.data,"binary").toString("utf8");
}

// 🔥 MAPA
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

// 🔥 AGRESOR (TWSTATS PLAYERS OD)
async function loadAggro(){
  try{
    const res = await axios.get(
      "https://pl.twstats.com/pl224/index.php?page=rankings&mode=playersod",
      {
        headers:{
          "User-Agent":"Mozilla/5.0"
        }
      }
    );

    const $ = cheerio.load(res.data);

    tribeAggro = {};

    $("table tr").each((i,row)=>{
      const tds = $(row).find("td");

      if(tds.length > 5){
        let tribe = $(tds[2]).text().trim();
        let points = $(tds[4]).text().replace(/\./g,"");

        tribe = tribe.replace(/[^A-Z]/g,"");

        if(!tribeAggro[tribe]){
          tribeAggro[tribe] = 0;
        }

        tribeAggro[tribe] += parseInt(points)||0;
      }
    });

    console.log("AGGRO OK");
  }catch(e){
    console.log("AGGRO ERR:",e.message);
  }
}

// START
loadMap();
loadAggro();

setInterval(loadMap,1000*60*5);
setInterval(loadAggro,1000*60*5);

// STATIC
app.use(express.static(path.join(__dirname,"public")));

// API
app.get("/api/tribes",(req,res)=>{
  const merged = tribes.map(t=>{
    return {
      ...t,
      aggro: tribeAggro[t.tag] || 0
    };
  });

  res.json(merged);
});

app.get("/api/players",(req,res)=>{
  res.json(players);
});

app.get("/api/tribe/:id",(req,res)=>{
  res.json(players.filter(p=>p.tribeId==req.params.id));
});

app.listen(PORT,()=>console.log("Server działa"));
