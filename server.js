const express = require("express");
const axios = require("axios");
const fs = require("fs");

const app = express();
const PORT = 3000;

// history fix
if (fs.existsSync("history") && !fs.lstatSync("history").isDirectory()) {
    fs.unlinkSync("history");
}
if (!fs.existsSync("history")) fs.mkdirSync("history");

// fetch
async function fetchWorld(world) {
    const [playersRes, villagesRes, conquerRes] = await Promise.all([
        axios.get(`https://${world}.plemiona.pl/map/player.txt`),
        axios.get(`https://${world}.plemiona.pl/map/village.txt`),
        axios.get(`https://${world}.plemiona.pl/map/conquer.txt`)
    ]);

    const players = playersRes.data.split("\n").filter(l=>l).map(l=>{
        const [id,name,tribe,villages,points]=l.split(",");
        return {id,name,tribe,villages:+villages,points:+points};
    });

    const map={};
    players.forEach(p=>map[p.id]=p.tribe);

    const villages = villagesRes.data.split("\n").filter(l=>l).map(l=>{
        const [id,name,x,y,player]=l.split(",");
        return {id,x:+x,y:+y,player,tribe:map[player]||"0"};
    });

    const conquers = conquerRes.data.split("\n").filter(l=>l).map(l=>{
        const [village,timestamp,newPlayer,oldPlayer]=l.split(",");
        return {village,timestamp:+timestamp,newPlayer,oldPlayer};
    });

    return {players,villages,conquers};
}

// history
function saveHistory(world, players){
    const dir=`history/${world}`;
    if(!fs.existsSync(dir)) fs.mkdirSync(dir,{recursive:true});
    const date=new Date().toISOString().slice(0,10);
    fs.writeFileSync(`${dir}/${date}.json`,JSON.stringify(players));
}

// auto fetch
async function fetchData(){
    try{
        const world="pl224";
        const {players}=await fetchWorld(world);
        saveHistory(world,players);
        console.log("🔥 update");
    }catch(e){
        console.log("❌",e.message);
    }
}

fetchData();
setInterval(fetchData,5*60*1000);

// API
app.get("/api/world/:world", async (req,res)=>{
    try{
        res.json(await fetchWorld(req.params.world));
    }catch{
        res.json({players:[],villages:[],conquers:[]});
    }
});

app.get("/api/history/:world", (req,res)=>{
    const dir=`history/${req.params.world}`;
    if(!fs.existsSync(dir)) return res.json([]);
    res.json(fs.readdirSync(dir));
});

app.get("/api/history/:world/:date", (req,res)=>{
    try{
        res.json(JSON.parse(fs.readFileSync(`history/${req.params.world}/${req.params.date}`)));
    }catch{
        res.json([]);
    }
});

app.use(express.static("public"));

app.listen(PORT,()=>console.log("🚀 server działa"));
