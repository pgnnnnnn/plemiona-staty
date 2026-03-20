const table = document.querySelector("#table tbody");
const tribeTable = document.querySelector("#tribes tbody");

const canvas = document.getElementById("map");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 800;

let warMode = false;
let scale = 1;
let offsetX = 0;
let offsetY = 0;
let isDragging = false;
let startX, startY;

const tribeColors = {};

function getColor(t){
    if(!tribeColors[t]){
        tribeColors[t] = `hsl(${Math.random()*360},70%,50%)`;
    }
    return tribeColors[t];
}

document.getElementById("world").onchange = load;
document.getElementById("warBtn").onclick = ()=>{warMode=!warMode;load();};

// 🔥 ZOOM
canvas.addEventListener("wheel", e=>{
    e.preventDefault();

    const zoom = e.deltaY > 0 ? 0.9 : 1.1;
    scale *= zoom;

    draw();
});

// 🔥 DRAG
canvas.addEventListener("mousedown", e=>{
    isDragging = true;
    startX = e.clientX - offsetX;
    startY = e.clientY - offsetY;
    canvas.style.cursor = "grabbing";
});

canvas.addEventListener("mouseup", ()=>{
    isDragging = false;
    canvas.style.cursor = "grab";
});

canvas.addEventListener("mousemove", e=>{
    if(isDragging){
        offsetX = e.clientX - startX;
        offsetY = e.clientY - startY;
        draw();
    }
});

let currentData = null;

// 🧠 MAPA
function draw(){

    if(!currentData) return;

    const data = currentData;

    const gridSize = 10;
    const mapSize = 1000;

    const playerMap={};
    data.players.forEach(p=>playerMap[p.id]=p.tribe);

    const grid={}, warGrid={};

    data.villages.forEach(v=>{
        const t=playerMap[v.player]||"0";
        const gx=Math.floor(v.x/gridSize);
        const gy=Math.floor(v.y/gridSize);
        const key=gx+"_"+gy;

        if(!grid[key]) grid[key]={};
        grid[key][t]=(grid[key][t]||0)+1;
    });

    data.conquers.forEach(c=>{
        const v=data.villages.find(v=>v.id==c.village);
        if(!v) return;

        const gx=Math.floor(v.x/gridSize);
        const gy=Math.floor(v.y/gridSize);
        const key=gx+"_"+gy;

        warGrid[key]=(warGrid[key]||0)+1;
    });

    ctx.setTransform(scale,0,0,scale,offsetX,offsetY);

    ctx.fillStyle="black";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    Object.keys(grid).forEach(k=>{
        const [gx,gy]=k.split("_");

        let maxT=null,max=0;
        for(let t in grid[k]){
            if(grid[k][t]>max){
                max=grid[k][t];
                maxT=t;
            }
        }

        if(warMode && warGrid[k]){
            ctx.fillStyle=`rgba(255,0,0,${Math.min(warGrid[k]/5,1)})`;
        } else {
            ctx.fillStyle=getColor(maxT);
        }

        ctx.fillRect(gx*10,gy*10,10,10);
    });

    ctx.setTransform(1,0,0,1,0,0);
}

// 🚀 LOAD
async function load(){

    const world=document.getElementById("world").value;
    const data=await fetch(`/api/data/${world}`).then(r=>r.json());

    currentData = data;

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
    const tribes={};

    data.players.forEach(p=>{
        if(!tribes[p.tribe]){
            tribes[p.tribe]={points:0,members:0,villages:0};
        }

        tribes[p.tribe].points+=p.points;
        tribes[p.tribe].members++;
        tribes[p.tribe].villages+=p.villages;
    });

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
                <td>-</td>
                <td>-</td>
            `;
            tribeTable.appendChild(tr);
        });

    draw();
}

load();
