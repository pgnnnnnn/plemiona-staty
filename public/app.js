function drawMap(topTribes) {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, 800, 800);

    const gridSize = 20;
    const grid = {};

    // 🧠 grupowanie wioski → sektory
    villagesData.forEach(v => {
        if (!topTribes[v.tribe]) return;

        const gx = Math.floor(v.x / gridSize);
        const gy = Math.floor(v.y / gridSize);
        const key = gx + "_" + gy;

        if (!grid[key]) grid[key] = {};

        if (!grid[key][v.tribe]) grid[key][v.tribe] = 0;
        grid[key][v.tribe]++;
    });

    // 🎨 rysowanie dominacji
    Object.keys(grid).forEach(key => {
        const [gx, gy] = key.split("_");

        const tribes = grid[key];

        // znajdź dominujące plemię
        let maxTribe = null;
        let max = 0;

        for (let t in tribes) {
            if (tribes[t] > max) {
                max = tribes[t];
                maxTribe = t;
            }
        }

        ctx.fillStyle = getColor(maxTribe);

        ctx.fillRect(
            gx * gridSize / scale + offsetX,
            gy * gridSize / scale + offsetY,
            gridSize / scale,
            gridSize / scale
        );
    });
}
