const express = require("express");
const axios = require("axios");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// --- BAZA ---
const db = new sqlite3.Database("./stats.db");

// Tabele
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
    villages INTEGER,
    tribe TEXT
  )`);
});

// --- POBIERANIE PLEMION ---
async function fetchTribes() {
  const res = await axios.get("https://pl224.plemiona.pl/map/ally.txt");
  const lines = res.data.split("\n");

  db.run("DELETE FROM tribes");

  let rank = 1;

  lines.forEach(line => {
    if (!line) return;

    const [id, name, tag, members, villages, points] = line.split(",");

    db.run(
      `INSERT INTO tribes (rank,name,points,villages,members)
       VALUES (?, ?, ?, ?, ?)`,
      [rank, tag, points, villages, members]
    );

    rank++;
  });
}

// --- POBIERANIE GRACZY ---
async function fetchPlayers() {
  const res = await axios.get("https://pl224.plemiona.pl/map/player.txt");
  const lines = res.data.split("\n");

  db.run("DELETE FROM players");

  let rank = 1;

  lines.forEach(line => {
    if (!line) return;

    const [id, name, tribe, villages, points] = line.split(",");

    db.run(
      `INSERT INTO players (rank,name,points,villages,tribe)
       VALUES (?, ?, ?, ?, ?)`,
      [rank, name, points, villages, tribe]
    );

    rank++;
  });
}

// --- STATIC ---
app.use(express.static(path.join(__dirname, "public")));

// --- API ---
app.get("/api/tribes", (req, res) => {
  db.all("SELECT * FROM tribes ORDER BY points DESC", (err, rows) => {
    res.json(rows);
  });
});

app.get("/api/players", (req, res) => {
  db.all("SELECT * FROM players ORDER BY points DESC", (err, rows) => {
    res.json(rows);
  });
});

// --- UPDATE ---
app.get("/update", async (req, res) => {
  await fetchTribes();
  await fetchPlayers();
  res.json({ message: "OK" });
});

// --- START ---
app.listen(PORT, () => {
  console.log("Server działa");
});
