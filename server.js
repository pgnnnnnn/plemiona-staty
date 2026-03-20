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

        // 🏰 plemiona (ID → TAG)
        const allyMap = {};
        allyRes.data.split("\n").filter(l=>l).forEach(l=>{
            const [id,name,tag]=l.split(",");
            allyMap[id] = decodeURIComponent(tag);
        });

        // 👤 gracze
        const players = playersRes.data.split("\n").filter(l=>l).map(l=>{
            const [id,name,tribe,villages,points]=l.split(",");
            return {
                id,
                name: decodeURIComponent(name),
                tribe,
                tribeTag: allyMap[tribe] || "-",
                villages:+villages,
                points:+points
            };
        });

        // 🗺️ wioski
        const villages = villagesRes.data.split("\n").filter(l=>l).map(l=>{
            const [id,name,x,y,player]=l.split(",");
            return {id,x:+x,y:+y,player};
        });

        // ⚔️ wojny
        const conquers = conquerRes.data.split("\n").filter(l=>l).map(l=>{
            const [village,timestamp,newPlayer,oldPlayer]=l.split(",");
            return {village,newPlayer,oldPlayer};
        });

        res.json({players, villages, conquers});

    } catch (e) {
        res.json({players:[], villages:[], conquers:[]});
    }
});

app.use(express.static("public"));
app.listen(PORT, () => console.log("🚀 działa"));
