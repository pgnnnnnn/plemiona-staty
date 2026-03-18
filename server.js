const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// baza SQLite
const db = new sqlite3.Database("./stats.db");

// Tworzenie tabel
db.run(`
CREATE TABLE IF NOT EXISTS tribes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rank INTEGER,
  name TEXT UNIQUE,
  points INTEGER,
  villages INTEGER,
  members INTEGER,
  last_update TEXT
);
`);

db.run(`
CREATE TABLE IF NOT EXISTS players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rank INTEGER,
  name TEXT UNIQUE,
  points INTEGER,
  villages INTEGER,
  tribe TEXT,
  last_update TEXT
);
`);

// Funkcje fetch
async function fetchTribes() {
  const url = "https://pl.twstats.com/pl224/index.php?page=ally";
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);
  const now = new Date().toISOString();

  $("table.players tr").each((i, el) => {
    const tds = $(el).find("td");
    if (tds.length) {
      const rank = parseInt($(tds[0]).text().trim());
      const name = $(tds[1]).text().trim();
      const points = parseInt($(tds[2]).text().replace(/\D/g,""));
      const villages = parseInt($(tds[3]).text().replace(/\D/g,""));
      const members = parseInt($(tds[4]).text().replace(/\D/g,""));
      db.run(`
        INSERT OR REPLACE INTO tribes (rank,name,points,villages,members,last_update)
        VALUES (?, ?, ?, ?, ?, ?)`, [rank,name,points,villages,members,now]);
    }
  });
}

async function fetchPlayers() {
  const url = "https://pl.twstats.com/pl224/index.php?page=player";
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);
  const now = new Date().toISOString();

  $("table.players tr").each((i, el) => {
    const tds = $(el).find("td");
    if (tds.length) {
      const rank = parseInt($(tds[0]).text().trim());
      const name = $(tds[1]).text().trim();
      const points = parseInt($(tds[2]).text().replace(/\D/g,""));
      const villages = parseInt($(tds[3]).text().replace(/\D/g,""));
      const tribe = $(tds[4]).text().trim();
      db.run(`
        INSERT OR REPLACE INTO players (rank,name,points,villages,tribe,last_update)
        VALUES (?, ?, ?, ?, ?, ?)`, [rank,name,points,villages,tribe,now]);
    }
  });
}

// statyczne pliki public
app.use(express.static(path.join(__dirname,"public")));

// Strona główna
app.get("/", (req,res)=>{
  res.sendFile(path.join(__dirname,"public","index.html"));
});

// API
app.get("/api/tribes", (req,res)=>{
  db.all("SELECT * FROM tribes ORDER BY rank ASC",[],(err,rows)=>{
    if(err) return res.status(500).json({error:err.message});
    res.json(rows);
  });
});

app.get("/api/players", (req,res)=>{
  db.all("SELECT * FROM players ORDER BY rank ASC",[],(err,rows)=>{
    if(err) return res.status(500).json({error:err.message});
    res.json(rows);
  });
});

// Ręczna aktualizacja
app.get("/update", async (req,res)=>{
  await fetchTribes();
  await fetchPlayers();
  res.json({message:"Zaktualizowano dane"});
});

app.listen(PORT,()=>console.log(`Server działa na porcie ${PORT}`));
