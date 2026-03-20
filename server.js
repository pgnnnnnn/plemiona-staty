const express = require("express");
const axios = require("axios");

const app = express();
const PORT = 3000;

// bezpieczne dekodowanie
function decode(str){
    try {
        return decodeURIComponent(str);
    } catch {
        return str;
    }
}

app.get("/api/data/:world", async (req, res) => {
    try {
        const world = req.params.world;

        const playersTxt = await axios.get(`https://${world}.plemiona.pl/map/player.txt`);
        const villagesTxt = await axios.get(`https://${world}.plemiona.pl/map/village.txt`);
        const allyTxt = await axios.get(`https://${world}.plemiona.pl/map/ally.txt`);

        // 🏰 plemiona
        const allyMap = {};

        allyTxt.data.split("\n").forEach(line => {
            if(!line) return;

            const parts = line.split(",");
            const id = parts[0];
            const tag = parts[2]; // 🔥 NAJWAŻNIEJSZE

            allyMap[id] = decode(tag);
        });

        // 👤 gracze
        const players = playersTxt.data.split("\n").map(line => {
            if(!line) return null;

            const parts = line.split(",");

            return {
                id: parts[0],
                name: decode(parts[1]),
                tribeTag: allyMap[parts[2]] || "-",
                villages: Number(parts[3]),
                points: Number(parts[4])
            };
        }).filter(Boolean);

        // 🗺️ wioski
        const villages = villagesTxt.data.split("\n").map(line => {
            if(!line) return null;

            const parts = line.split(",");

            return {
                id: parts[0],
                x: Number(parts[2]),
                y: Number(parts[3]),
                player: parts[4]
            };
        }).filter(Boolean);

        res.json({ players, villages });

    } catch (e) {
        console.log("ERROR:", e.message);
        res.json({ players: [], villages: [] });
    }
});

app.use(express.static("public"));

app.listen(PORT, () => console.log("🚀 działa"));
