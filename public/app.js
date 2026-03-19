const canvas = document.getElementById("map");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 800;

// 🔥 MAPA OBSZARÓW
function drawMap(data, players, warStats){

    const gridSize = 10;
    const grid = {};
    const warGrid = {};

    const playerMap = {};
    players.forEach(p => playerMap[p.id] = p.tribe);

    // dominacja
    data.villages.forEach(v=>{
        const tribe = playerMap[v.player] || "0";

        const gx = Math.floor(v.x / gridSize);
        const gy = Math.floor(v.y / gridSize);
        const key = gx + "_" + gy;

        if(!grid[key]) grid[key] = {};
        grid[key][tribe] = (grid[key][tribe] || 0) + 1;
    });

    // wojny
    data.conquers.forEach(c=>{
        const v = data.villages.find(v=>v.id == c.village);
        if(!v) return;

        const gx = Math.floor(v.x / gridSize);
        const gy = Math.floor(v.y / gridSize);
        const key = gx + "_" + gy;

        warGrid[key] = (warGrid[key] || 0) + 1;
    });

    ctx.fillStyle="black";
    ctx.fillRect(0,0,800,800);

    Object.keys(grid).forEach(key=>{
        const [gx,gy] = key.split("_");

        const tribes = grid[key];

        let maxT=null,max=0;

        for(let t in tribes){
            if(tribes[t] > max){
                max = tribes[t];
                maxT = t;
            }
        }

        if(warMode && warGrid[key]){
            const intensity = Math.min(warGrid[key]/5,1);
            ctx.fillStyle = `rgba(255,0,0,${intensity})`;
        } else {
            ctx.fillStyle = getColor(maxT);
        }

        ctx.fillRect(
            gx * gridSize / 2,
            gy * gridSize / 2,
            gridSize / 2,
            gridSize / 2
        );
    });
}
