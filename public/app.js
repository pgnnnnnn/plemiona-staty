let currentWorld="pl224";
let villagesData=[];
let playersData=[];
let historyFiles=[];
let replayIndex=0;
let heatmapWar=false;

const tribeColors={};

function getColor(t){
    if(!tribeColors[t]){
        tribeColors[t]=`hsl(${Math.random()*360},70%,50%)`;
    }
    return tribeColors[t];
}

document.getElementById("worldSelect").onchange=e=>{
    currentWorld=e.target.value;
    loadWorld();
};

async function loadWorld(){
    const data=await fetch(`/api/world/${currentWorld}`).then(r=>r.json());
    villagesData=data.villages;
    playersData=data.players;

    loadHistory();
}

async function loadHistory(){
    historyFiles=await fetch(`/api/history/${currentWorld}`).then(r=>r.json());
    historyFiles.sort();

    const grid=document.getElementById("dateGrid");
    grid.innerHTML="";

    historyFiles.forEach((d,i)=>{
        const btn=document.createElement("button");
        btn.innerText=d;
        btn.onclick=()=>{replayIndex=i;loadReplay();};
        grid.appendChild(btn);
    });

    loadReplay();
}

async function loadReplay(){
    const date=historyFiles[replayIndex];
    document.getElementById("dateLabel").innerText=date;

    const players=await fetch(`/api/history/${currentWorld}/${date}`).then(r=>r.json());
    const worldData=await fetch(`/api/world/${currentWorld}`).then(r=>r.json());

    drawMap(players, worldData.conquers);
    loadTable(players, worldData.conquers);
    loadChart(players);
}

function drawMap(players, conquers){

    const canvas=document.getElementById("map");
    const ctx=canvas.getContext("2d");

    canvas.width=800;
    canvas.height=800;

    ctx.fillStyle="black";
    ctx.fillRect(0,0,800,800);

    const gridSize=20;
    const grid={}, war={};

    players.forEach(p=>{
        villagesData.filter(v=>v.player==p.id).forEach(v=>{
            const k=Math.floor(v.x/gridSize)+"_"+Math.floor(v.y/gridSize);
            if(!grid[k]) grid[k]={};
            grid[k][p.tribe]=(grid[k][p.tribe]||0)+1;
        });
    });

    conquers.forEach(c=>{
        const v=villagesData.find(v=>v.id==c.village);
        if(!v) return;
        const k=Math.floor(v.x/gridSize)+"_"+Math.floor(v.y/gridSize);
        war[k]=(war[k]||0)+1;
    });

    Object.keys(grid).forEach(k=>{
        const [gx,gy]=k.split("_");

        let maxT=null,max=0;
        for(let t in grid[k]){
            if(grid[k][t]>max){
                max=grid[k][t];
                maxT=t;
            }
        }

        if(heatmapWar && war[k]){
            ctx.fillStyle=`rgba(255,0,0,${Math.min(war[k]/5,1)})`;
        } else {
            ctx.fillStyle=getColor(maxT);
        }

        ctx.fillRect(gx*20,gy*20,20,20);
    });
}

function loadTable(players, conquers){

    const stats={};

    conquers.forEach(c=>{
        if(!stats[c.newPlayer]) stats[c.newPlayer]={a:0,d:0};
        if(!stats[c.oldPlayer]) stats[c.oldPlayer]={a:0,d:0};

        stats[c.newPlayer].a++;
        stats[c.oldPlayer].d++;
    });

    const tribes={};

    players.forEach(p=>{
        if(!tribes[p.tribe]) tribes[p.tribe]={points:0,members:0,a:0,d:0};
        tribes[p.tribe].points+=p.points;
        tribes[p.tribe].members++;

        if(stats[p.id]){
            tribes[p.tribe].a+=stats[p.id].a;
            tribes[p.tribe].d+=stats[p.id].d;
        }
    });

    const tbody=document.querySelector("#tribeTable tbody");
    tbody.innerHTML="";

    Object.entries(tribes)
        .sort((a,b)=>b[1].points-a[1].points)
        .slice(0,15)
        .forEach(([t,d],i)=>{

            const ratio=d.d? (d.a/d.d).toFixed(2):d.a;

            const tr=document.createElement("tr");

            tr.innerHTML=`
            <td>${i+1}</td>
            <td style="color:${getColor(t)}">${t}</td>
            <td>${d.points.toLocaleString()}</td>
            <td>${d.members}</td>
            <td style="color:red">${d.a}</td>
            <td style="color:blue">${d.d}</td>
            <td>${ratio}</td>
            `;

            tbody.appendChild(tr);
        });
}

function loadChart(players){

    const tribes={};

    players.forEach(p=>{
        if(!tribes[p.tribe]) tribes[p.tribe]=0;
        tribes[p.tribe]+=p.points;
    });

    const sorted=Object.entries(tribes)
        .sort((a,b)=>b[1]-a[1])
        .slice(0,5);

    new Chart(document.getElementById("tribeChart"),{
        type:"bar",
        data:{
            labels:sorted.map(x=>x[0]),
            datasets:[{
                data:sorted.map(x=>x[1]),
                backgroundColor:sorted.map(x=>getColor(x[0]))
            }]
        }
    });
}

document.getElementById("warHeatmapBtn").onclick=()=>{
    heatmapWar=!heatmapWar;
    loadReplay();
};

loadWorld();
