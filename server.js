const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

let tribes = [];
let tribeStats = {};

// 🔥 UTF FIX
async function getUTF(url){
  const res = await axios.get(url,{responseType:"arraybuffer"});
  return Buffer.from(res.data,"binary").toString("utf8");
}

// 🔥 MAPA
async function loadMap(){
  try{
    const raw = await getUTF("https://pl224.plemiona.pl/map/ally.txt");

    tribes = raw.split("\n").map(line=>{
      const [id,name,tag,members,villages,points] = line.split(",");

      const cleanTag = decodeURIComponent((tag||"").replace(/\+/g," "))
        .replace(/[^A-Z]/g,"");

      return {
        id,
        tag: cleanTag,
        members:+members||0,
        villages:+villages||0,
        points:+points||0,
        color:"#888"
      };
    });

    console.log("MAP OK");
  }catch(e){
    console.log("MAP ERR:", e.message);
  }
}

// 🔥 TWSTATS (ODA)
async function loadTW(){
  try{
    const res = await axios.get(
      "https://pl.twstats.com/pl224/index.php?page=ranking&type=oda",
      {
        headers:{
          "User-Agent":"Mozilla/5.0",
          "Accept-Language":"pl-PL"
        }
      }
    );

    const $ = cheerio.load(res.data);

    tribeStats = {};

    $("table tr").each((i,row)=>{
      const cols = $(row).find("td");

      if(cols.length > 3){
        let tag = $(cols[1]).text().trim();

        tag = tag.replace(/[^A-Z]/g,"");

        const oda = $(cols[2]).text().replace(/\./g,"");

        tribeStats[tag] = {
          oda: parseInt(oda) || 0
        };
      }
    });

    console.log("TWSTATS OK");
  }catch(e){
    console.log("TWSTATS ERR:", e.message);
  }
}

// START
loadMap();
loadTW();

setInterval(loadMap,1000*60*5);
setInterval(loadTW,1000*60*5);

// STATIC
app.use(express.static(path.join(__dirname,"public")));

// API
app.get("/api/tribes",(req,res)=>{
  const merged = tribes.map(t=>{
    const stat = tribeStats[t.tag] || {};
    return {
      ...t,
      oda: stat.oda || 0
    };
  });

  res.json(merged.sort((a,b)=>b.points-a.points));
});

app.listen(PORT,()=>console.log("Server działa"));
