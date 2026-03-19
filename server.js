const express = require("express");
const axios = require("axios");
const fs = require("fs");

const app = express();
const PORT = 3000;

const WORLD = "pl224";

// pobieranie danych
async function fetchData() {
    try {
        const players = await axios.get(`https://${WORLD}.plemiona.pl/map/player.txt`);
        const allies = await axios.get(`https://${WORLD}.plemiona.pl/map/ally.txt`);

        const parsedPlayers = players.data.split("\n").map(line => {
            const [id, name, tribe, villages, points] = line.split(",");
            return {
                id,
                name,
                tribe,
                villages: Number(villages),
                points: Number(points)
            };
        });

        fs.writeFileSync("data.json", JSON.stringify(parsedPlayers, null, 2));
        console.log("✅ Dane zapisane");
    } catch (err) {
        console.error("❌ Błąd:", err.message);
    }
}

// co 5 min
setInterval(fetchData, 5 * 60 * 1000);
fetchData();

app.use(express.static("public"));

app.get("/api/players", (req, res) => {
    const data = JSON.parse(fs.readFileSync("data.json"));
    res.json(data);
});

app.listen(PORT, () => {
    console.log(`🚀 http://localhost:${PORT}`);
});
