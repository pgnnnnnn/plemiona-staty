const table = document.querySelector("#table tbody");
const tribeTable = document.querySelector("#tribes tbody");
const guestTable = document.querySelector("#guest tbody");

const canvas = document.getElementById("map");
const ctx = canvas.getContext("2d");

let warMode = false;

const tribeColors = {};

function getColor(tribe){
    if(!tribeColors[tribe]){
        tribeColors[tribe] = `hsl(${Math.random()*360},70%,50%)`;
    }
    return tribeColors[tribe];
}

document.getElementById("world").onchange = load;

document.getElementById("warBtn").onclick = () => {
    warMode = !warMode;
    load();
};

function calculateWar(conquers){

    const stats = {};

    conquers.forEach(c=>{
        if(!stats[c.newPlayer]) stats[c.newPlayer]={attack:0,def:0};
        if(!stats[c.oldPlayer]) stats[c.oldPlayer]={attack:0,def:0};

        stats[c.newPlayer].attack++;
        stats[c.oldPlayer].def++;
    });

    return stats;
}

async function load(){

    const world = document.getElementById("world").value;

    const data = await fetch(`/api/data/${world}`).then(r=>r.json());
    const guest = await fetch(`/api/guest/${world}`).then(r=>r.json());

    const warStats = calculateWar(data.conquers);

    const playerMap = {};
    data.players.forEach(p => playerMap[p.id] = p.tribe);

    // 👤 GRACZE
    table.innerHTML = "";

    data.players
        .sort((a,b)=>b.points-a.points)
        .slice(0,20)
        .forEach((p,i)=>{
            const tr=document.createElement("tr");
            tr.innerHTML = `
                <td>${i+1}</td>
                <td style="color:${getColor(p.tribe)}">${p.name}</td>
                <td>${p.points.toLocaleString()}</td>
            `;
            table.appendChild(tr);
        });

    // 🏰 PLEMIONA (Twoje)
    const tribes = {};

    data.players.forEach(p=>{
        if(!tribes[p.tribe]){
            tribes[p.tribe] = { points:0, members:0, a:0, d:0 };
        }

        tribes[p.tribe].points += p.points;
        tribes[p.tribe].members++;

        if(warStats[p.id]){
            tribes[p.tribe].a += warStats[p.id].attack;
            tribes[p.tribe].d += warStats[p.id].def;
        }
    });

    tribeTable.innerHTML = "";

    Object.entries(tribes)
        .sort((a,b)=>b[1].points - a[1].points)
        .slice(0,15)
        .forEach(([t,data],i)=>{

            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td>${i+1}</td>
                <td style="color:${getColor(t)}">${t}</td>
                <td>${data.points.toLocaleString()}</td>
                <td>${data.members}</td>
                <td style="color:red">${data.a}</td>
                <td style="color:blue">${data.d}</td>
            `;

            tribeTable.appendChild(tr);
        });

    // 📋 GUEST (oficjalne)
    guestTable.innerHTML = "";

    guest.tribes.slice(0,15).forEach((t,i)=>{
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${i+1}</td>
            <td>${t.name}</td>
            <td>${t.points}</td>
            <td>${t.members}</td>
        `;

        guestTable.appendChild(tr);
    });

    // 🗺️ MAPA
    ctx.fillStyle="black";
    ctx.fillRect(0,0,500,500);

    data.villages.forEach(v=>{

        const tribe = playerMap[v.player] || "0";

        if(warMode){
            const count = data.conquers.filter(c=>c.village == v.id).length;
            ctx.fillStyle = `rgba(255,0,0,${Math.min(count/5,1)})`;
        } else {
            ctx.fillStyle = getColor(tribe);
        }

        ctx.fillRect(v.x/2, v.y/2, 1, 1);
    });
}

load();
