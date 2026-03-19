const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

let tribes = [];
let players = [];

// 🔄 LOAD + SAVE JSON
async function loadMap(){
  try{
    const ally = await axios.get("https://pl224.plemiona.pl/map/ally.txt");

    tribes = ally.data.split("\n").map(line=>{
      const [id,name,tag,members,villages,points] = line.split(",");

      return {
        id,
        name,
        tag,
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
        name,
        tribe,
        villages: +villages || 0,
        points: +points || 0
      };
    });

    // 🔥 zapis do pliku jak mikamait
    fs.writeFileSync("public/tribes.json", JSON.stringify(tribes));
    fs.writeFileSync("public/players.json", JSON.stringify(players));

    console.log("ZAPIS OK");
  }catch(e){
    console.log("ERR:", e.message);
  }
}

loadMap();
setInterval(loadMap, 1000 * 60 * 5);

// STATIC
app.use(express.static(path.join(__dirname,"public")));

app.listen(PORT,()=>console.log("Server działa"));
