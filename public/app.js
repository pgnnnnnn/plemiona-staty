const table = document.querySelector("#table tbody");
const tribeTable = document.querySelector("#tribes tbody");

const canvas = document.getElementById("map");
const ctx = canvas.getContext("2d");

document.getElementById("world").onchange = load;

// stabilne kolory
function getColor(str){
    let hash = 0;
    for(let i=0;i<str.length;i++){
        hash = str.charCodeAt(i) + ((hash<<5)-hash);
    }
    return `hsl(${hash % 360},70%,50%)`;
}

async function load(){

    const world = document.getElementById("world").value;
    const data = await fetch(`/api/data/${world}`).then(r=>r.json());

    // 👤 gracze
    table.innerHTML = "";

    data.players
        .sort((a,b)=>b.points-a.points)
        .slice(0,20)
        .forEach((p,i)=>{
            const tr=document.createElement("tr");
            tr.innerHTML=`
                <td>${i+1}</td>
                <td style="color:${getColor(p.tribeTag)}">${p.name}</td>
                <td>${p.points.toLocaleString()}</td>
            `;
            table.appendChild(tr);
        });

    // 🏰 plemiona
    const tribes = {};

    data.players.forEach(p=>{
        if(!tribes[p.tribeTag]){
            tribes[p.tribeTag]={points:0,members:0};
        }

        tribes[p.tribeTag].points += p.points;
        tribes[p.tribeTag].members++;
    });

    tribeTable.innerHTML = "";

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

    // 🗺️ MAPA (NAPRAWIONA)
    const playerMap = {};
    data.players.forEach(p=>playerMap[p.id]=p.tribeTag);

    ctx.fillStyle="black";
    ctx.fillRect(0,0,800,800);

    data.villages.forEach(v=>{
        const tribe = playerMap[v.player] || "-";

        ctx.fillStyle = getColor(tribe);

        ctx.fillRect(
            v.x * 0.8,  // SKALA
            v.y * 0.8,
            2,
            2
        );
    });
}

load();
