const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

let tribes = [];
let players = [];
let history = {}; // historia punktów

// 🔄 UPDATE
async function updateData() {
  try {
    const ally = await axios.get("https://pl224.plemiona.pl/map/ally.txt");
    tribes = ally.data.split("\n").map(line => {
      const [id, name, tag, members, villages, points] = line.split(",");
      return {
        id,
        tag,
        members: Number(members),
        villages: Number(villages),
        points: Number(points)
      };
    });

    const now = Date.now();

    // zapis historii
    tribes.forEach(t => {
      if (!history[t.id]) history[t.id] = [];
      history[t.id].push({ time: now, points: t.points });

      // max 50 wpisów (lekka baza)
      if (history[t.id].length > 50) {
        history[t.id].shift();
      }
    });

    fs.writeFileSync("history.json", JSON.stringify(history));

    console.log("UPDATE OK");
  } catch (e) {
    console.log("ERR:", e.message);
  }
}

// wczytaj historię przy starcie
if (fs.existsSync("history.json")) {
  history = JSON.parse(fs.readFileSync("history.json"));
}

updateData();
setInterval(updateData, 1000 * 60 * 5);

// STATIC
app.use(express.static(path.join(__dirname, "public")));

// API LISTA
app.get("/api/tribes", (req, res) => {
  res.json(tribes.sort((a,b)=>b.points-a.points));
});
// 🔥 RANKING PRZYROSTÓW
app.get("/api/gain", (req, res) => {

  const gains = tribes.map(t => {
    const hist = history[t.id] || [];

    if (hist.length < 2) {
      return { ...t, gain: 0 };
    }

    const first = hist[0].points;
    const last = hist[hist.length - 1].points;

    return {
      ...t,
      gain: last - first
    };
  });

  const sorted = gains.sort((a,b)=>b.gain - a.gain);

  res.json(sorted.slice(0,100));
});

// API SZCZEGÓŁ + HISTORIA
app.get("/api/tribe/:id", (req, res) => {
  const id = req.params.id;
  const tribe = tribes.find(t => t.id == id);
  const hist = history[id] || [];

  res.json({
    tribe,
    history: hist
  });
});

app.listen(PORT, () => console.log("Server działa"));
