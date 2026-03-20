const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

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

        const [playersRes, villagesRes, allyRes] = await Promise.all([
            axios.get(`https://${world}.plemiona.pl/map/player.txt`),
            axios.get(`https://${world}.plemiona.pl/map/village.txt`),
            axios.get(`https://${world}.plemiona.pl/map/ally.txt`)
        ]);

        const allyMap = {};

        allyRes.data.split("\n").forEach(line => {
            if(!line) return;

            const parts = line.split(",");
            allyMap[parts[0]] = decode(parts[2]);
        });

        const players = playersRes.data.split("\n").map(line => {
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

        const villages = villagesRes.data.split("\n").map(line => {
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

app.listen(PORT, () => {
    console.log("🚀 SERVER DZIAŁA");
});
