const express = require("express");
const axios = require("axios");

const app = express();
const PORT = 3000;

// bezpieczne dekodowanie
function safeDecode(str){
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

        // 🏰 plemiona (POPRAWNE)
        const allyMap = {};

        allyRes.data
            .split("\n")
            .filter(l => l)
            .forEach(l => {
                const parts = l.split(",");

                const id = parts[0];
                const tag = parts[2]; // 🔥 TO JEST KLUCZ

                allyMap[id] = safeDecode(tag);
            });

        // 👤 gracze
        const players = playersRes.data
            .split("\n")
            .filter(l => l)
            .map(l => {
                const parts = l.split(",");

                const id = parts[0];
                const name = parts[1];
                const tribe = parts[2];
                const villages = parts[3];
                const points = parts[4];

                return {
                    id,
                    name: safeDecode(name),
                    tribeTag: allyMap[tribe] || "-",
                    villages: +villages,
                    points: +points
                };
            });

        // 🗺️ wioski
        const villages = villagesRes.data
            .split("\n")
            .filter(l => l)
            .map(l => {
                const parts = l.split(",");

                return {
                    id: parts[0],
                    x: +parts[2],
                    y: +parts[3],
                    player: parts[4]
                };
            });

        res.json({ players, villages });

    } catch (e) {
        console.log("ERROR:", e.message);
        res.json({ players: [], villages: [] });
    }
});

app.use(express.static("public"));

app.listen(PORT, () => {
    console.log("🚀 działa");
});
