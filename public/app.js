let currentWorld="pl224";
let villagesData=[];
let historyFiles=[];
let replayIndex=0;

let tribeChart, growthChart;
let lastMap={};

const tribeColors={};

function getColor(t){
    if(!tribeColors[t]){
        tribeColors[t]=`hsl(${Math.random()*360},70%,50%)`;
    }
    return tribeColors[t];
}

// LOAD WORLD
document.getElementById("worldSelect").onchange=e=>{
    currentWorld=e.target.value;
    loadWorld();
};

async function loadWorld(){
    const data=await fetch(`/api/world/${currentWorld}`).then(r=>r.json());
    villagesData=data.villages;

    loadHistory();
}

// HISTORY
async function loadHistory(){
    historyFiles=await fetch(`/api/history/${currentWorld}`).then(r=>r.json());
    historyFiles.sort();

    const grid=document.getElementById("dateGrid");
    grid.innerHTML="";

    historyFiles.forEach((d,i)=>{
        const btn=document.createElement("div");
        btn.className="date-btn";
        btn.textContent=d;

        btn.onclick=()=>{
            replayIndex=i;
            loadReplay();
        };

        grid.appendChild(btn);
    });

    loadReplay();
}

// REPLAY
async function loadReplay(){
    if(!historyFiles.length) return;

    const date=historyFiles[replayIndex];
    document.getElementById("dateLabel").textContent=date;

    const players=await fetch(`/api/history/${currentWorld}/${date}`).then(r=>r.json());

    const tribes={};

    players.forEach(p=>{
        if(!tribes[p.tribe]){
            tribes[p.tribe]={points:0,members:0};
        }
        tribes[p.tribe].points+=p.points;
        tribes[p.tribe].members++;
    });

    drawMap(players);
    loadTribeTable(tribes);
    loadCharts();

    document.querySelectorAll(".date-btn").forEach((b,i)=>{
        b.classList.toggle("active", i==replayIndex);
    });
}

// MAPA (ANIMACJA)
function drawMap(players){

    const gridSize=20;
    const newMap={};
    const grid={};

    players.forEach(p=>{
        villagesData
            .filter(v=>v.player==p.id)
            .forEach(v=>{
                const gx=Math.floor(v.x/gridSize);
                const gy=Math.floor(v.y/gridSize);
                const key=gx+"_"+gy;

                if(!grid[key]) grid[key]={};
                if(!grid[key][p.tribe]) grid[key][p.tribe]=0;
                grid[key][p.tribe]++;
            });
    });

    Object.keys(grid).forEach(key=>{
        let maxT=null,max=0;

        for(let t in grid[key]){
            if(grid[key][t]>max){
                max=grid[key][t];
                maxT=t;
            }
        }

        newMap[key]=maxT;
    });

    const canvas=document.getElementById("map");
    const ctx=canvas.getContext("2d");

    canvas.width=800;
    canvas.height=800;

    ctx.fillStyle="black";
    ctx.fillRect(0,0,800,800);

    Object.keys(newMap).forEach(key=>{
        const [gx,gy]=key.split("_");

        const oldT=lastMap[key];
        const newT=newMap[key];

        ctx.fillStyle=(oldT && oldT!==newT) ? "yellow" : getColor(newT);

        ctx.fillRect(gx*20,gy*20,20,20);
    });

    lastMap=newMap;
}

// TABELA
function loadTribeTable(tribes){
    const sorted=Object.entries(tribes)
        .sort((a,b)=>b[1].points-a[1].points);

    const tbody=document.querySelector("#tribeTable tbody");
    tbody.innerHTML="";

    sorted.slice(0,15).forEach(([t,d],i)=>{
        const tr=document.createElement("tr");

        tr.innerHTML=`
            <td>${i+1}</td>
            <td style="color:${getColor(t)}">${t}</td>
            <td>${d.points.toLocaleString()}</td>
            <td>${d.members}</td>
        `;

        tbody.appendChild(tr);
    });
}

// 📊 WYKRESY REALNE
async function loadCharts(){

    const files=historyFiles;

    const tribeSeries={};
    const growthSeries={};

    for(let f of files){
        const data=await fetch(`/api/history/${currentWorld}/${f}`).then(r=>r.json());

        const tribes={};

        data.forEach(p=>{
            if(!tribes[p.tribe]) tribes[p.tribe]=0;
            tribes[p.tribe]+=p.points;
        });

        Object.entries(tribes).forEach(([t,points])=>{
            if(!tribeSeries[t]) tribeSeries[t]=[];
            tribeSeries[t].push(points);
        });
    }

    const topTribes=Object.entries(tribeSeries)
        .sort((a,b)=>b[1].slice(-1)[0]-a[1].slice(-1)[0])
        .slice(0,5);

    const datasets=topTribes.map(([t,data])=>({
        label:t,
        data,
        borderColor:getColor(t)
    }));

    if(tribeChart) tribeChart.destroy();

    tribeChart=new Chart(document.getElementById("tribeChart"),{
        type:"line",
        data:{labels:files,datasets}
    });

    // delta
    const growthDatasets=topTribes.map(([t,data])=>{
        const diff=data.map((v,i)=> i? v-data[i-1]:0);
        return {label:t,data:diff,borderColor:getColor(t)};
    });

    if(growthChart) growthChart.destroy();

    growthChart=new Chart(document.getElementById("growthChart"),{
        type:"line",
        data:{labels:files,datasets:growthDatasets}
    });
}

// START
loadWorld();
