const table = document.querySelector("#table tbody");
const tribeTable = document.querySelector("#tribes tbody");

const canvas = document.getElementById("map");
const ctx = canvas.getContext("2d");

canvas.width = 1000;
canvas.height = 1000;

let scale = 1;
let offsetX = 0;
let offsetY = 0;
let isDragging = false;
let startX, startY;

let currentData = null;

// 🔥 stabilne kolory (hash zamiast random)
function getColor(str){
    let hash = 0;
    for(let i=0;i<str.length;i++){
        hash = str.charCodeAt(i) + ((hash<<5)-hash);
    }
    return `hsl(${hash % 360},70%,50%)`;
}

// zoom
canvas.addEventListener("wheel", e=>{
    e.preventDefault();
    scale *= e.deltaY > 0 ? 0.9 : 1.1;
    draw();
});

// drag
canvas.addEventListener("mousedown", e=>{
    isDragging=true;
    startX=e.clientX-offsetX;
    startY=e.clientY-offsetY;
});
canvas.addEventListener("mouseup", ()=>isDragging=false);
canvas.addEventListener("mousemove", e=>{
    if(isDragging){
        offsetX=e.clientX-startX;
        offsetY=e.clientY-startY;
        draw();
    }
});

function draw(){

    if(!currentData) return;

    const data = currentData;

    const gridSize = 5;
    const grid = {};

    const playerMap = {};
    data.players.forEach(p=>playerMap[p.id]=p.tribeTag);

    data.villages.forEach(v=>{
        const tribe = playerMap[v.player] || "-";

        const gx = Math.floor(v.x/gridSize);
        const gy = Math.floor(v.y/gridSize);
        const key = gx+"_"+gy;

        if(!grid[key]) grid[key]={};
        grid[key][tribe]=(grid[key][tribe]||0)+1;
    });

    ctx.setTransform(scale,0,0,scale,offsetX,offsetY);

    ctx.fillStyle="black";
    ctx.fillRect(0,0,1000,1000);

    Object.keys(grid).forEach(k=>{
        const [gx,gy]=k.split("_");

        let maxT=null,max=0;

        for(let t in grid[k]){
            if(grid[k][t]>max){
                max=grid[k][t];
                maxT=t;
            }
        }

        ctx.fillStyle=getColor(maxT);

        ctx.fillRect(
            gx*gridSize,
            gy*gridSize,
            gridSize,
            gridSize
        );
    });

    ctx.setTransform(1,0,0,1,0,0);
}

// LOAD
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
            <td style="color:${getColor(p.tribeTag)}">${p.name}</td>
            <td>${p.points.toLocaleString()}</td>
        `;
        table.appendChild(tr);
    });

    // plemiona
    const tribes={};

    data.players.forEach(p=>{
        if(!tribes[p.tribeTag]){
            tribes[p.tribeTag]={points:0,members:0};
        }

        tribes[p.tribeTag].points+=p.points;
        tribes[p.tribeTag].members++;
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
            `;
            tribeTable.appendChild(tr);
        });

    draw();
}

load();
