const express = require("express");
const axios = require("axios");

const app = express();
const PORT = 3000;

app.get("/api/data/:world", async (req, res) => {
    try {
        const world = req.params.world;

        const [playersRes, villagesRes, allyRes] = await Promise.all([
            axios.get(`https://${world}.plemiona.pl/map/player.txt`),
            axios.get(`https://${world}.plemiona.pl/map/village.txt`),
            axios.get(`https://${world}.plemiona.pl/map/ally.txt`)
        ]);

        // 🏰 plemiona (mapa ID → TAG)
        const allyMap = {};

        allyRes.data
            .split("\n")
            .filter(line => line)
            .forEach(line => {
                const [id, name, tag] = line.split(",");
                allyMap[id] = decodeURIComponent(tag || "");
            });

        // 👤 gracze
        const players = playersRes.data
            .split("\n")
            .filter(line => line)
            .map(line => {
                const [id, name, tribe, villages, points] = line.split(",");

                return {
                    id,
                    name: decodeURIComponent(name),
                    tribeTag: allyMap[tribe] || "-",
                    villages: +villages,
                    points: +points
                };
            });

        // 🗺️ wioski
        const villages = villagesRes.data
            .split("\n")
            .filter(line => line)
            .map(line => {
                const [id, name, x, y, player] = line.split(",");

                return {
                    id,
                    x: +x,
                    y: +y,
                    player
                };
            });

        res.json({ players, villages });

    } catch (e) {
        console.log("❌ ERROR:", e.message);
        res.json({ players: [], villages: [] });
    }
});

app.use(express.static("public"));

app.listen(PORT, () => {
    console.log("🚀 działa na porcie 3000");
});
