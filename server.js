const express = require("express");
const axios = require("axios");
const iconv = require("iconv-lite");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// --- BAZA ---
const db = new sqlite3.Database("./stats.db");

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS tribes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rank INTEGER,
    name TEXT,
    points INTEGER,
    villages INTEGER,
    members INTEGER
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rank INTEGER,
    name TEXT,
    points INTEGER,
    villages INTEGER
  )`);
});

// --- FETCH PLEMION ---
async function fetchTribes() {
  const res = await axios.get("https://pl224.plemiona.pl/map/ally.txt", { responseType: "arraybuffer" });
  const data = iconv.decode(Buffer.from(res.data), 'windows-1250');
  const lines = data.split("\n");
  db.run("DELETE FROM tribes");
  let rank = 1;
  lines.forEach(line => {
    if(!line) return;
    const [id, name, tag, members, villages, points] = line.split(",");
    db.run(`INSERT INTO tribes (rank,name,points,villages,members) VALUES (?,?,?,?,?)`,
      [rank, tag.replace(/%/g,""), points.replace(/%/g,""), villages.replace(/%/g,""), members.replace(/%/g,"")]
    );
    rank++;
  });
}

// --- FETCH GRACZY ---
async function fetchPlayers() {
  const res = await axios.get("https://pl224.plemiona.pl/map/player.txt", { responseType: "arraybuffer" });
  const data = iconv.decode(Buffer.from(res.data), 'windows-1250');
  const lines = data.split("\n");
  db.run("DELETE FROM players");
  let rank = 1;
  lines.forEach(line => {
    if(!line) return;
    const [id, name, tribe, villages, points] = line.split(",");
    db.run(`INSERT INTO players (rank,name,points,villages) VALUES (?,?,?,?)`,
      [rank, name.replace(/%/g,""), points.replace(/%/g,""), villages.replace(/%/g,"")]
    );
    rank++;
  });
}

// --- STATIC ---
app.use(express.static(path.join(__dirname, "public")));

// --- API ---
app.get("/api/tribes", (req, res) => {
  db.all("SELECT rank,name,points,villages,members FROM tribes ORDER BY points DESC LIMIT 25", (err, rows) => {
    if(err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get("/api/players", (req, res) => {
  db.all("SELECT rank,name,points,villages FROM players ORDER BY points DESC LIMIT 25", (err, rows) => {
    if(err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// --- API MAPA ---
app.get("/api/map", async (req, res) => {
  try {
    const resPlayers = await axios.get("https://pl224.plemiona.pl/map/player.txt", { responseType: "arraybuffer" });
    const resAllies = await axios.get("https://pl224.plemiona.pl/map/ally.txt", { responseType: "arraybuffer" });
    const playersData = iconv.decode(Buffer.from(resPlayers.data), "windows-1250");
    const alliesData = iconv.decode(Buffer.from(resAllies.data), "windows-1250");
    res.json({ players: playersData, allies: alliesData });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// --- UPDATE ---
app.get("/update", async (req, res) => {
  await fetchTribes();
  await fetchPlayers();
  res.json({ message: "Zaktualizowano dane" });
});

// --- START ---
app.listen(PORT, () => {
  console.log("Server działa na porcie " + PORT);
});
