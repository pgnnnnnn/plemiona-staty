let currentWorld="pl224";
let villagesData=[];
let playersData=[];
let historyFiles=[];
let replayIndex=0;
let playing=false;

let chart, tribeChart;

const tribeColors={};

function getColor(t){
    if(!tribeColors[t]){
        tribeColors[t]=`hsl(${Math.random()*360},70%,50%)`;
    }
    return tribeColors[t];
}

// WORLD
document.getElementById("worldSelect").onchange=e=>{
    currentWorld=e.target.value;
    loadWorld();
};

async function loadWorld(){
    const data=await fetch(`/api/world/${currentWorld}`).then(r=>r.json());
    playersData=data.players;
    villagesData=data.villages;

    loadHistory();
    loadChart();
    loadTribeChart();
}

// HISTORY
async function loadHistory(){
    historyFiles=await fetch(`/api/history/${currentWorld}`).then(r=>r.json());
    historyFiles.sort();

    const slider=document.getElementById("slider");
    slider.max=historyFiles.length-1;

    slider.oninput=()=>{
        replayIndex=slider.value;
        loadReplay();
    };

    loadReplay();
}

// REPLAY
async function loadReplay(){
    if(!historyFiles.length) return;

    const date=historyFiles[replayIndex];
    document.getElementById("dateLabel").textContent=date;

    const players=await fetch(`/api/history/${currentWorld}/${date}`).then(r=>r.json());

    players.sort((a,b)=>b.points-a.points);

    const topTribes={};
    players.slice(0,15).forEach(p=>topTribes[p.tribe]=true);

    drawMap(topTribes);
}

// MAPA
const canvas=document.getElementById("map");
const ctx=canvas.getContext("2d");

canvas.width=800;
canvas.height=800;

let scale=2, offsetX=0, offsetY=0;

function drawMap(topTribes){
    ctx.fillStyle="black";
    ctx.fillRect(0,0,800,800);

    villagesData.forEach(v=>{
        if(!topTribes[v.tribe]) return;

        ctx.fillStyle=getColor(v.tribe);
        ctx.fillRect(v.x/scale+offsetX,v.y/scale+offsetY,2,2);
    });
}

// PLAY
document.getElementById("playBtn").onclick=()=>{
    playing=!playing;
    if(playing) play();
};

function play(){
    if(!playing) return;
    replayIndex=(replayIndex+1)%historyFiles.length;
    document.getElementById("slider").value=replayIndex;
    loadReplay();
    setTimeout(play,800);
}

// EXPORT
document.getElementById("exportBtn").onclick=()=>{
    const link=document.createElement("a");
    link.download="map.png";
    link.href=canvas.toDataURL();
    link.click();
};

// WYKRES ŚWIATA
async function loadChart(){
    const files=await fetch(`/api/history/${currentWorld}`).then(r=>r.json());

    const labels=[],values=[];

    for(let f of files){
        const data=await fetch(`/api/history/${currentWorld}/${f}`).then(r=>r.json());
        const sum=data.reduce((s,p)=>s+p.points,0);
        labels.push(f);
        values.push(sum);
    }

    if(chart) chart.destroy();

    chart=new Chart(document.getElementById("chart"),{
        type:"line",
        data:{labels,datasets:[{label:"Punkty świata",data:values}]}
    });
}

// WYKRES PLEMION 🔥
async function loadTribeChart(){
    const files=await fetch(`/api/history/${currentWorld}`).then(r=>r.json());

    const tribeData={};

    for(let f of files){
        const data=await fetch(`/api/history/${currentWorld}/${f}`).then(r=>r.json());

        const tribes={};

        data.forEach(p=>{
            if(!tribes[p.tribe]) tribes[p.tribe]=0;
            tribes[p.tribe]+=p.points;
        });

        Object.entries(tribes)
            .sort((a,b)=>b[1]-a[1])
            .slice(0,5)
            .forEach(([t,points])=>{
                if(!tribeData[t]) tribeData[t]=[];
                tribeData[t].push(points);
            });
    }

    const datasets=Object.keys(tribeData).map(t=>({
        label:t,
        data:tribeData[t],
        borderColor:getColor(t),
        fill:false
    }));

    if(tribeChart) tribeChart.destroy();

    tribeChart=new Chart(document.getElementById("tribeChart"),{
        type:"line",
        data:{labels:files,datasets}
    });
}

// START
loadWorld();
