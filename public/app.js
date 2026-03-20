const table = document.querySelector("#table tbody");
const tribeTable = document.querySelector("#tribes tbody");

const canvas = document.getElementById("map");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 800;

let warMode = false;
let selectedTribe = null;
let lastGrid = {};
let cellSize = 5;

const tribeColors = {};

function getColor(t){
    if(!tribeColors[t]){
        tribeColors[t] = `hsl(${Math.random()*360},70%,50%)`;
    }
    return tribeColors[t];
}

// 🔥 TOOLTIP
const tooltip = document.createElement("div");
tooltip.style.position = "absolute";
tooltip.style.background = "black";
tooltip.style.color = "white";
tooltip.style.padding = "4px 6px";
tooltip.style.fontSize = "12px";
tooltip.style.display = "none";
tooltip.style.pointerEvents = "none";

document.body.appendChild(tooltip);

// controls
document.getElementById("world").onchange = load;
document.getElementById("warBtn").onclick = ()=>{
    warMode = !warMode;
    load();
};

// 🧠 STATY
function buildTribes(data){

    const war = {};

    data.conquers.forEach(c=>{
        if(!war[c.newPlayer]) war[c.newPlayer]={a:0,d:0};
        if(!war[c.oldPlayer]) war[c.oldPlayer]={a:0,d:0};

        war[c.newPlayer].a++;
        war[c.oldPlayer].d++;
    });

    const tribes = {};

    data.players.forEach(p=>{
        if(!tribes[p.tribe]){
            tribes[p.tribe]={points:0,members:0,villages:0,a:0,d:0};
        }

        tribes[p.tribe].points += p.points;
        tribes[p.tribe].members++;
        tribes[p.tribe].villages += p.villages;

        if(war[p.id]){
            tribes[p.tribe].a += war[p.id].a;
            tribes[p.tribe].d += war[p.id].d;
        }
    });

    return tribes;
}

// 🗺️ MAPA PRO
function drawMap(data){

    const gridSize=10;
    const grid={}, warGrid={};

    const playerMap={};
    data.players.forEach(p=>playerMap[p.id]=p.tribe);

    data.villages.forEach(v=>{
        const t=playerMap[v.player]||"0";
        const k=Math.floor(v.x/gridSize)+"_"+Math.floor(v.y/gridSize);

        if(!grid[k]) grid[k]={};
        grid[k][t]=(grid[k][t]||0)+1;
    });

    data.conquers.forEach(c=>{
        const v=data.villages.find(v=>v.id==c.village);
        if(!v) return;

        const k=Math.floor(v.x/gridSize)+"_"+Math.floor(v.y/gridSize);
        warGrid[k]=(warGrid[k]||0)+1;
    });

    ctx.fillStyle="black";
    ctx.fillRect(0,0,800,800);

    lastGrid = grid;

    Object.keys(grid).forEach(k=>{
        const [gx,gy]=k.split("_");

        let maxT=null,max=0;
        for(let t in grid[k]){
            if(grid[k][t]>max){
                max=grid[k][t];
                maxT=t;
            }
        }

        if(selectedTribe && maxT !== selectedTribe){
            ctx.fillStyle="rgba(50,50,50,0.2)";
        } else if(warMode && warGrid[k]){
            ctx.fillStyle=`rgba(255,0,0,${Math.min(warGrid[k]/5,1)})`;
        } else {
            ctx.fillStyle=getColor(maxT);
        }

        ctx.fillRect(gx*cellSize,gy*cellSize,cellSize,cellSize);
    });
}

// 🖱️ HOVER
canvas.addEventListener("mousemove", e=>{
    const rect = canvas.getBoundingClientRect();

    const x = Math.floor((e.clientX - rect.left) / cellSize);
    const y = Math.floor((e.clientY - rect.top) / cellSize);

    const key = x + "_" + y;

    if(lastGrid[key]){
        let maxT=null,max=0;

        for(let t in lastGrid[key]){
            if(lastGrid[key][t]>max){
                max=lastGrid[key][t];
                maxT=t;
            }
        }

        tooltip.style.display="block";
        tooltip.style.left = e.clientX + 10 + "px";
        tooltip.style.top = e.clientY + 10 + "px";
        tooltip.innerHTML = `Plemię: ${maxT}`;
    } else {
        tooltip.style.display="none";
    }
});

// 🎯 KLIK
canvas.addEventListener("click", e=>{
    const rect = canvas.getBoundingClientRect();

    const x = Math.floor((e.clientX - rect.left) / cellSize);
    const y = Math.floor((e.clientY - rect.top) / cellSize);

    const key = x + "_" + y;

    if(lastGrid[key]){
        let maxT=null,max=0;

        for(let t in lastGrid[key]){
            if(lastGrid[key][t]>max){
                max=lastGrid[key][t];
                maxT=t;
            }
        }

        selectedTribe = (selectedTribe === maxT) ? null : maxT;
        load();
    }
});

// 🚀 LOAD
async function load(){

    const world=document.getElementById("world").value;
    const data=await fetch(`/api/data/${world}`).then(r=>r.json());

    // gracze
    table.innerHTML="";
    data.players.sort((a,b)=>b.points-a.points).slice(0,20).forEach((p,i)=>{
        const tr=document.createElement("tr");
        tr.innerHTML=`
            <td>${i+1}</td>
            <td style="color:${getColor(p.tribe)}">${p.name}</td>
            <td>${p.points.toLocaleString()}</td>
        `;
        table.appendChild(tr);
    });

    // plemiona
    const tribes=buildTribes(data);

    tribeTable.innerHTML="";
    Object.entries(tribes)
        .sort((a,b)=>b[1].points-a[1].points)
        .slice(0,20)
        .forEach(([t,d],i)=>{
            const tr=document.createElement("tr");
            tr.innerHTML=`
                <td>${i+1}</td>
                <td style="color:${getColor(t)}">${t}</td>
                <td>${d.points.toLocaleString()}</td>
                <td>${d.members}</td>
                <td>${d.villages}</td>
                <td style="color:red">${d.a}</td>
                <td style="color:blue">${d.d}</td>
            `;
            tribeTable.appendChild(tr);
        });

    drawMap(data);
}

load();
