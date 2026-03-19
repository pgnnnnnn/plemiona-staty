fetch("/api/players")
    .then(res => res.json())
    .then(data => {

        // sortowanie
        data.sort((a, b) => b.points - a.points);

        const tbody = document.querySelector("#table tbody");

        data.slice(0, 50).forEach((p, i) => {
            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td>${i + 1}</td>
                <td>${p.name}</td>
                <td>${p.points.toLocaleString()}</td>
                <td>${p.villages}</td>
            `;

            tbody.appendChild(tr);
        });
    });
