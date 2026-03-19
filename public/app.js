const tribeColors = {};

function getColor(t) {
    if (!tribeColors[t]) {
        tribeColors[t] = `hsl(${Math.random()*360},70%,50%)`;
    }
    return tribeColors[t];
}

// 🔥 LOAD HISTORII
fetch("/api/history")
    .then(res => res.json())
    .then(files => {
        const select = document.getElementById("dateSelect");

        files.forEach(f => {
            const opt = document.createElement("option");
            opt.value = f;
            opt.textContent = f;
            select.appendChild(opt);
        });

        loadData(files[files.length - 1]);

        select.addEventListener("change", () => {
            loadData(select.value);
        });
    });

async function loadData(date) {
    const current = await fetch("/api/players").then(r => r.json());
    const old = await fetch(`/api/history/${date}`).then(r => r.json());

    const oldMap = {};
    old.forEach(p => oldMap[p.id] = p.points);

    current.forEach(p => {
        p.diff = p.points - (oldMap[p.id] || p.points);
    });

    current.sort((a,b)=>b.points-a.points);

    const tbody = document.querySelector("#table tbody");
    tbody.innerHTML = "";

    current.slice(0,100).forEach((p,i)=>{
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${i+1}</td>
            <td style="color:${getColor(p.tribe)}">${p.name}</td>
            <td>${p.points.toLocaleString()}</td>
            <td style="color:${p.diff>=0?'lime':'red'}">
                ${p.diff}
            </td>
        `;

        tbody.appendChild(tr);
    });

    loadMap(current);
}

// 🗺️ MAPA TOP PLEMIEN
function loadMap(players) {

    const topTribes = {};

    players.slice(0,15).forEach(p=>{
        topTribes[p.tribe]=true;
    });

    fetch("/api/villages")
        .then(r=>r.json())
        .then(villages=>{
            const canvas = document.getElementById("map");
            const ctx = canvas.getContext("2d");

            canvas.width = 800;
            canvas.height = 800;

            ctx.fillStyle="black";
            ctx.fillRect(0,0,800,800);

            villages.forEach(v=>{
                if (!topTribes[v.tribe]) return;

                ctx.fillStyle=getColor(v.tribe);
                ctx.fillRect(v.x/2, v.y/2, 2, 2);
            });
        });
}
