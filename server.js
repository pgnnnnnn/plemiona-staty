const express = require("express");
const axios = require("axios");
const fs = require("fs");

const app = express();
const PORT = 3000;
const WORLD = "pl224";

// init plików
if (!fs.existsSync("data.json")) fs.writeFileSync("data.json", "[]");
if (!fs.existsSync("villages.json")) fs.writeFileSync("villages.json", "[]");

// pobieranie danych
async function fetchData() {
    try {
        const [playersRes, villagesRes] = await Promise.all([
            axios.get(`https://${WORLD}.plemiona.pl/map/player.txt`),
            axios.get(`https://${WORLD}.plemiona.pl/map/village.txt`)
        ]);

        const players = playersRes.data
            .split("\n")
            .filter(l => l)
            .map(l => {
                const [id, name, tribe, villages, points] = l.split(",");
                return {
                    id,
                    name,
                    tribe,
                    villages: +villages,
                    points: +points
                };
            });

        const villages = villagesRes.data
            .split("\n")
            .filter(l => l)
            .map(l => {
                const [id, name, x, y, player] = l.split(",");
                return {
                    id,
                    x: +x,
                    y: +y,
                    player
                };
            });

        fs.writeFileSync("data.json", JSON.stringify(players, null, 2));
        fs.writeFileSync("villages.json", JSON.stringify(villages));

        console.log("🔥 Dane zaktualizowane");
    } catch (err) {
        console.log("❌", err.message);
    }
}

fetchData();
setInterval(fetchData, 5 * 60 * 1000);

// API
app.get("/api/players", (req, res) => {
    res.json(JSON.parse(fs.readFileSync("data.json")));
});

app.get("/api/villages", (req, res) => {
    res.json(JSON.parse(fs.readFileSync("villages.json")));
});

app.use(express.static("public"));

app.listen(PORT, () => {
    console.log(`🚀 http://localhost:${PORT}`);
});
