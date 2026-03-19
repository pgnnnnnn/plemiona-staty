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

// LOAD WORLD
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

    const grid = document.getElementById("dateGrid");
    grid.innerHTML="";

    historyFiles.forEach((d,i)=>{
        const btn=document.createElement("div");
        btn.className="date-btn";
        btn.textContent=d;

        btn.onclick=()=>{
            replayIndex=i;
            slider.value=i;
            loadReplay();
        };

        grid.appendChild(btn);
    });

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

    document.querySelectorAll(".date-btn").forEach((b,i)=>{
        b.classList.toggle("active", i == replayIndex);
    });
}

// MAPA PRO (cluster)
const canvas=document.getElementById("map");
const ctx=canvas.getContext("2d");

canvas.width=800;
canvas.height=800;

let scale=2, offsetX=0, offsetY=0;

function drawMap(topTribes){
    ctx.fillStyle="black";
    ctx.fillRect(0,0,800,800);

    const gridSize=20;
    const grid={};

    villagesData.forEach(v=>{
        if(!topTribes[v.tribe]) return;

        const gx=Math.floor(v.x/gridSize);
        const gy=Math.floor(v.y/gridSize);
        const key=gx+"_"+gy;

        if(!grid[key]) grid[key]={};
        if(!grid[key][v.tribe]) grid[key][v.tribe]=0;
        grid[key][v.tribe]++;
    });

    Object.keys(grid).forEach(key=>{
        const [gx,gy]=key.split("_");
        const tribes=grid[key];

        let maxT=null, max=0;

        for(let t in tribes){
            if(tribes[t]>max){
                max=tribes[t];
                maxT=t;
            }
        }

        ctx.fillStyle=getColor(maxT);

        ctx.fillRect(
            gx*gridSize/scale+offsetX,
            gy*gridSize/scale+offsetY,
            gridSize/scale,
            gridSize/scale
        );
    });

    // LEGENDA
    const legend=document.getElementById("legend");
    legend.innerHTML="";

    Object.keys(topTribes).slice(0,10).forEach(t=>{
        const el=document.createElement("span");

        el.innerHTML=`
        <span style="
            display:inline-block;
            width:10px;
            height:10px;
            background:${getColor(t)};
            margin-right:5px;"></span>${t}
        `;

        el.style.marginRight="10px";

        legend.appendChild(el);
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
        labels.push(f);
        values.push(data.reduce((s,p)=>s+p.points,0));
    }

    if(chart) chart.destroy();

    chart=new Chart(document.getElementById("chart"),{
        type:"line",
        data:{labels,datasets:[{label:"Punkty świata",data:values}]}
    });
}

// WYKRES PLEMION
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
