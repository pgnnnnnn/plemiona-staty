const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();
const PORT = 3000;

// 🔥 GŁÓWNE DANE
app.get("/api/data/:world", async (req, res) => {
    try {
        const world = req.params.world;

        const [playersRes, villagesRes, conquerRes] = await Promise.all([
            axios.get(`https://${world}.plemiona.pl/map/player.txt`),
            axios.get(`https://${world}.plemiona.pl/map/village.txt`),
            axios.get(`https://${world}.plemiona.pl/map/conquer.txt`)
        ]);

        const players = playersRes.data.split("\n").filter(l=>l).map(l=>{
            const [id,name,tribe,villages,points]=l.split(",");
            return {id,name,tribe,villages:+villages,points:+points};
        });

        const villages = villagesRes.data.split("\n").filter(l=>l).map(l=>{
            const [id,name,x,y,player]=l.split(",");
            return {id,x:+x,y:+y,player};
        });

        const conquers = conquerRes.data.split("\n").filter(l=>l).map(l=>{
            const [village,timestamp,newPlayer,oldPlayer]=l.split(",");
            return {village,newPlayer,oldPlayer};
        });

        res.json({players, villages, conquers});

    } catch {
        res.json({players:[], villages:[], conquers:[]});
    }
});


// 🔥 GUEST (oficjalny ranking)
app.get("/api/guest/:world", async (req,res)=>{
    try{
        const world = req.params.world;

        const html = await axios.get(`https://${world}.plemiona.pl/guest.php`);
        const $ = cheerio.load(html.data);

        const tribes = [];

        $("table tr").each((i,row)=>{
            const cols = $(row).find("td");

            if(cols.length >= 4){
                tribes.push({
                    name: $(cols[1]).text().trim(),
                    points: $(cols[2]).text().trim(),
                    members: $(cols[3]).text().trim()
                });
            }
        });

        res.json({tribes});

    }catch{
        res.json({tribes:[]});
    }
});

app.use(express.static("public"));

app.listen(PORT, () => console.log("🚀 działa"));
