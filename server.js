const express = require("express");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// cache danych (jak mikamait)
let tribes = [];
let players = [];

// 🔥 POBIERANIE DANYCH Z MAPY (STABILNE)
async function updateData() {
  try {
    console.log("Aktualizacja danych...");

    // PLEMIONA
    const ally = await axios.get("https://pl224.plemiona.pl/map/ally.txt");
    tribes = ally.data.split("\n").map(line => {
      const [id, name, tag, members, villages, points] = line.split(",");
      return {
        id,
        name,
        tag,
        members: Number(members),
        villages: Number(villages),
        points: Number(points)
      };
    });

    // GRACZE
    const player = await axios.get("https://pl224.plemiona.pl/map/player.txt");
    players = player.data.split("\n").map(line => {
      const [id, name, tribe, villages, points] = line.split(",");
      return {
        id,
        name,
        tribe,
        villages: Number(villages),
        points: Number(points)
      };
    });

    console.log("OK update");
  } catch (e) {
    console.log("Błąd update:", e.message);
  }
}

// pierwsze odpalenie
updateData();

// co 5 minut
setInterval(updateData, 1000 * 60 * 5);

// STATIC
app.use(express.static(path.join(__dirname, "public")));

// API
app.get("/api/tribes", (req, res) => {
  const sorted = tribes.sort((a, b) => b.points - a.points);
  res.json(sorted.slice(0, 100));
});

app.get("/api/players", (req, res) => {
  const sorted = players.sort((a, b) => b.points - a.points);
  res.json(sorted.slice(0, 100));
});

// START
app.listen(PORT, () => console.log("Server działa"));
