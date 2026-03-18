const id = window.location.pathname.split("/")[2];

fetch("/api/stats/" + id)
  .then(res => res.json())
  .then(data => {
    document.getElementById("worldName").innerText = data.world;
    document.getElementById("players").innerText = data.players;
    document.getElementById("villages").innerText = data.villages;
    document.getElementById("points").innerText = data.points;
    document.getElementById("tribes").innerText = data.tribes;
    document.getElementById("od").innerText = data.od;
    document.getElementById("oda").innerText = data.oda;
    document.getElementById("worldId").innerText = id;
    document.getElementById("created").innerText = data.created;
  })
  .catch(() => {
    document.getElementById("worldName").innerText = "Brak danych";
  });
