const express = require("express");
const axios = require("axios");
const fs = require("fs");

const app = express();
const PORT = 3000;
const WORLD = "pl224";

// init
if (!fs.existsSync("data.json")) fs.writeFileSync("data.json", "[]");
if (!fs.existsSync("villages.json")) fs.writeFileSync("villages.json", "[]");
if (!fs.existsSync("history")) fs.mkdirSync("history");

// zapis historii
function saveHistory(players) {
    const date = new Date().toISOString().slice(0, 10);
    fs.writeFileSync(`history/${date}.json`, JSON.stringify(players));
}

// fetch
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

        const playersMap = {};
        players.forEach(p => playersMap[p.id] = p.tribe);

        const villages = villagesRes.data
            .split("\n")
            .filter(l => l)
            .map(l => {
                const [id, name, x, y, player] = l.split(",");
                return {
                    id,
                    x: +x,
                    y: +y,
                    player,
                    tribe: playersMap[player] || "0"
                };
            });

        fs.writeFileSync("data.json", JSON.stringify(players, null, 2));
        fs.writeFileSync("villages.json", JSON.stringify(villages));

        saveHistory(players);

        console.log("🔥 update + historia");
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

app.get("/api/history", (req, res) => {
    const files = fs.readdirSync("history");
    res.json(files);
});

app.get("/api/history/:date", (req, res) => {
    try {
        const data = fs.readFileSync(`history/${req.params.date}`);
        res.json(JSON.parse(data));
    } catch {
        res.json([]);
    }
});

app.use(express.static("public"));

app.listen(PORT, () => {
    console.log(`🚀 http://localhost:${PORT}`);
});
