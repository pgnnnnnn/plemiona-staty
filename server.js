const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const db = new sqlite3.Database("./stats.db");

db.run(`CREATE TABLE IF NOT EXISTS tribes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rank INTEGER,
  name TEXT UNIQUE,
  points INTEGER,
  villages INTEGER,
  members INTEGER,
  last_update TEXT
)`);

db.run(`CREATE TABLE IF NOT EXISTS players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rank INTEGER,
  name TEXT UNIQUE,
  points INTEGER,
  villages INTEGER,
  tribe TEXT,
  last_update TEXT
)`);

// FETCH SAFE
async function fetchTribes() {
  try {
    const { data } = await axios.get("https://pl.twstats.com/pl224/index.php?page=ally", { timeout: 10000 });
    const $ = cheerio.load(data);
    const now = new Date().toISOString();

    $("table.players tr").each((i, el) => {
      const tds = $(el).find("td");
      if (tds.length) {
        db.run(`
          INSERT OR REPLACE INTO tribes (rank,name,points,villages,members,last_update)
          VALUES (?, ?, ?, ?, ?, ?)`,
          [
            parseInt($(tds[0]).text()) || 0,
            $(tds[1]).text().trim(),
            parseInt($(tds[2]).text().replace(/\D/g,"")) || 0,
            parseInt($(tds[3]).text().replace(/\D/g,"")) || 0,
            parseInt($(tds[4]).text().replace(/\D/g,"")) || 0,
            now
          ]);
      }
    });

    console.log("Tribes OK");
  } catch(e) {
    console.log("Tribes error:", e.message);
  }
}

async function fetchPlayers() {
  try {
    const { data } = await axios.get("https://pl.twstats.com/pl224/index.php?page=player", { timeout: 10000 });
    const $ = cheerio.load(data);
    const now = new Date().toISOString();

    $("table.players tr").each((i, el) => {
      const tds = $(el).find("td");
      if (tds.length) {
        db.run(`
          INSERT OR REPLACE INTO players (rank,name,points,villages,tribe,last_update)
          VALUES (?, ?, ?, ?, ?, ?)`,
          [
            parseInt($(tds[0]).text()) || 0,
            $(tds[1]).text().trim(),
            parseInt($(tds[2]).text().replace(/\D/g,"")) || 0,
            parseInt($(tds[3]).text().replace(/\D/g,"")) || 0,
            $(tds[4]).text().trim(),
            now
          ]);
      }
    });

    console.log("Players OK");
  } catch(e) {
    console.log("Players error:", e.message);
  }
}

// STATIC
app.use(express.static(path.join(__dirname,"public")));

app.get("/", (req,res)=>{
  res.sendFile(path.join(__dirname,"public","index.html"));
});

// API
app.get("/api/tribes",(req,res)=>{
  db.all("SELECT * FROM tribes ORDER BY rank ASC",[],(e,r)=>res.json(r));
});

app.get("/api/players",(req,res)=>{
  db.all("SELECT * FROM players ORDER BY rank ASC",[],(e,r)=>res.json(r));
});

// UPDATE
app.get("/update", async (req,res)=>{
  await fetchTribes();
  await fetchPlayers();
  res.json({ok:true});
});

// AUTO UPDATE 5 MIN
setInterval(()=>{
  fetchTribes();
  fetchPlayers();
}, 1000 * 60 * 5);

app.listen(PORT,()=>console.log("Server działa"));
