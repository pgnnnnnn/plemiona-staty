const tribeColors = {};
let villagesData = [];
let playersMap = {};
let historyFiles = [];
let replayIndex = 0;
let playing = false;

function getColor(t) {
    if (!tribeColors[t]) {
        tribeColors[t] = `hsl(${Math.random()*360},70%,50%)`;
    }
    return tribeColors[t];
}

// PLAYERS
fetch("/api/players").then(r=>r.json()).then(players=>{
    players.forEach(p=>playersMap[p.id]=p);
});

// TRIBES
fetch("/api/tribes").then(r=>r.json()).then(data=>{
    data.sort((a,b)=>b.points-a.points);

    const tbody=document.querySelector("#tribeTable tbody");

    data.slice(0,15).forEach((t,i)=>{
        const tr=document.createElement("tr");
        tr.innerHTML=`
            <td>${i+1}</td>
            <td style="color:${getColor(t.tribe)}">${t.tribe}</td>
            <td>${t.points.toLocaleString()}</td>
            <td>${t.members}</td>
        `;
        tbody.appendChild(tr);
    });
});

// HISTORY
fetch("/api/history").then(r=>r.json()).then(files=>{
    historyFiles = files.sort();

    const slider = document.getElementById("slider");
    slider.max = historyFiles.length - 1;

    loadReplay();

    slider.addEventListener("input",()=>{
        replayIndex = slider.value;
        loadReplay();
    });
});

async function loadReplay() {
    const date = historyFiles[replayIndex];
    document.getElementById("dateLabel").textContent = date;

    const players = await fetch(`/api/history/${date}`).then(r=>r.json());

    players.sort((a,b)=>b.points-a.points);

    const topTribes = {};
    players.slice(0,15).forEach(p=>topTribes[p.tribe]=true);

    drawMap(topTribes);
}

// MAPA
const canvas = document.getElementById("map");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 800;

let scale = 2;
let offsetX = 0;
let offsetY = 0;
let isDragging = false;
let lastX, lastY;

fetch("/api/villages").then(r=>r.json()).then(v=>{
    villagesData = v;
});

// DRAW
function drawMap(topTribes) {
    ctx.fillStyle="black";
    ctx.fillRect(0,0,800,800);

    villagesData.forEach(v=>{
        if (!topTribes[v.tribe]) return;

        ctx.fillStyle = getColor(v.tribe);

        ctx.fillRect(
            v.x/scale + offsetX,
            v.y/scale + offsetY,
            2,2
        );
    });
}

// DRAG
canvas.addEventListener("mousedown", e=>{
    isDragging=true;
    lastX=e.clientX;
    lastY=e.clientY;
});

canvas.addEventListener("mouseup", ()=>isDragging=false);

canvas.addEventListener("mousemove", e=>{
    if (isDragging) {
        offsetX += e.clientX-lastX;
        offsetY += e.clientY-lastY;
        lastX=e.clientX;
        lastY=e.clientY;
        loadReplay();
    }
});

// ZOOM
canvas.addEventListener("wheel", e=>{
    e.preventDefault();
    scale *= e.deltaY > 0 ? 1.1 : 0.9;
    loadReplay();
});

// PLAY
document.getElementById("playBtn").addEventListener("click", ()=>{
    playing = !playing;
    if (playing) play();
});

function play() {
    if (!playing) return;

    replayIndex++;
    if (replayIndex >= historyFiles.length) replayIndex = 0;

    document.getElementById("slider").value = replayIndex;

    loadReplay();

    setTimeout(play, 800);
}
