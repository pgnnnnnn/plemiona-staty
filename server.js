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
    res.json(fs.readdirSync("history"));
});

app.get("/api/history/:date", (req, res) => {
    try {
        res.json(JSON.parse(fs.readFileSync(`history/${req.params.date}`)));
    } catch {
        res.json([]);
    }
});

app.get("/api/tribes", (req, res) => {
    const players = JSON.parse(fs.readFileSync("data.json"));

    const tribes = {};

    players.forEach(p => {
        if (!tribes[p.tribe]) {
            tribes[p.tribe] = { tribe: p.tribe, points: 0, members: 0 };
        }
        tribes[p.tribe].points += p.points;
        tribes[p.tribe].members++;
    });

    res.json(Object.values(tribes));
});

app.use(express.static("public"));

app.listen(PORT, () => {
    console.log(`🚀 http://localhost:${PORT}`);
});
