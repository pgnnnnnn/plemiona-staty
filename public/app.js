// kolory plemion
const tribeColors = {};

// tabela
fetch("/api/players")
    .then(res => res.json())
    .then(data => {
        data.sort((a, b) => b.points - a.points);

        const tbody = document.querySelector("#table tbody");

        data.slice(0, 100).forEach((p, i) => {

            if (!tribeColors[p.tribe]) {
                tribeColors[p.tribe] = `hsl(${Math.random()*360},70%,50%)`;
            }

            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td>${i + 1}</td>
                <td style="color:${tribeColors[p.tribe]}">${p.name}</td>
                <td>${p.points.toLocaleString()}</td>
                <td>${p.villages}</td>
            `;

            tbody.appendChild(tr);
        });
    });

// MAPA
fetch("/api/villages")
    .then(res => res.json())
    .then(villages => {
        const canvas = document.getElementById("map");
        const ctx = canvas.getContext("2d");

        canvas.width = 600;
        canvas.height = 600;

        villages.forEach(v => {
            ctx.fillStyle = "white";
            ctx.fillRect(v.x / 2, v.y / 2, 1, 1);
        });
    });
