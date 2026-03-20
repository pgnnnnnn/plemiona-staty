const express = require("express");
const axios = require("axios");

const app = express();
const PORT = 3000;

app.get("/api/data/:world", async (req, res) => {
    try {
        const world = req.params.world;

        const [playersRes, villagesRes, conquerRes, allyRes] = await Promise.all([
            axios.get(`https://${world}.plemiona.pl/map/player.txt`),
            axios.get(`https://${world}.plemiona.pl/map/village.txt`),
            axios.get(`https://${world}.plemiona.pl/map/conquer.txt`),
            axios.get(`https://${world}.plemiona.pl/map/ally.txt`)
        ]);

        const players = playersRes.data.split("\n").filter(l=>l).map(l=>{
            const [id,name,tribe,villages,points]=l.split(",");
            return {id,name,tribe,villages:+villages,points:+points};
        });

        const villages = villagesRes.data.split("\n").filter(l=>l).map(l=>{
            const [id,name,x,y,player]=l.split(",");
            return {id,x:+x,y:+y,player};
        });

        const conquers = conquerRes.data.split("\n").filter(l=>l).map(l=>{
            const [village,timestamp,newPlayer,oldPlayer]=l.split(",");
            return {village,newPlayer,oldPlayer};
        });

        const allies = allyRes.data.split("\n").filter(l=>l).map(l=>{
            const [id,name,tag,members,villages,points]=l.split(",");
            return {id,name,tag,members:+members,villages:+villages,points:+points};
        });

        res.json({players, villages, conquers, allies});

    } catch {
        res.json({players:[], villages:[], conquers:[], allies:[]});
    }
});

app.use(express.static("public"));

app.listen(PORT, () => console.log("🚀 działa"));
