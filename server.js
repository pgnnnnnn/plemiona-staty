const express = require("express");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

let tribes = [];
let players = [];

// 🔄 UPDATE DATA
async function updateData() {
  try {
    console.log("Update...");

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

    console.log("OK");
  } catch (e) {
    console.log("ERR:", e.message);
  }
}

updateData();
setInterval(updateData, 1000 * 60 * 5);

// STATIC
app.use(express.static(path.join(__dirname, "public")));

// API LISTA
app.get("/api/tribes", (req, res) => {
  res.json(tribes.sort((a,b)=>b.points-a.points));
});

// API SZCZEGÓŁY PLEMIONA
app.get("/api/tribe/:id", (req, res) => {
  const id = req.params.id;

  const tribe = tribes.find(t => t.id == id);
  const members = players.filter(p => p.tribe == id)
    .sort((a,b)=>b.points-a.points);

  res.json({ tribe, members });
});

app.listen(PORT, () => console.log("Server działa"));
