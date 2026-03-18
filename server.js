const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

const data = {
  "224": {
    "world": "Świat 224",
    "players": 314,
    "villages": 0,
    "points": 0,
    "tribes": 8,
    "od": 0,
    "oda": 0,
    "rank": 1,
    "created": "2026-03-01"
  }
};

app.use(express.static("public"));

app.get("/", (req, res) => res.redirect("/staty/224"));

app.get("/staty/:id", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "staty.html"));
});

app.get("/api/stats/:id", (req, res) => {
  const stats = data[req.params.id];
  if (!stats) return res.status(404).json({ error: "Brak danych" });
  res.json(stats);
});

app.listen(PORT, () => console.log("Server działa na porcie " + PORT));
