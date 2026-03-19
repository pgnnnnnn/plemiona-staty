<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8">
<title>Gracze</title>
<link rel="stylesheet" href="style.css">

<style>
table{
  width:100%;
  border-collapse:collapse;
  table-layout:fixed;
}

th, td{
  padding:10px;
  border-bottom:1px solid #1a1a1a;
  text-align:center;
}

th{
  background:#1f1f1f;
  cursor:pointer;
}

/* 📐 KOLUMNY */
th:nth-child(1), td:nth-child(1){ width:60px; }
th:nth-child(2), td:nth-child(2){ width:40%; text-align:left; }
th:nth-child(3), td:nth-child(3){ width:20%; }
th:nth-child(4), td:nth-child(4){ width:15%; }
th:nth-child(5), td:nth-child(5){ width:20%; }

/* nick padding */
td:nth-child(2){
  padding-left:15px;
}

/* hover */
tr:hover{
  background:#1a1a1a;
}

/* top3 */
tr:nth-child(1){ background:rgba(255,215,0,0.1); }
tr:nth-child(2){ background:rgba(192,192,192,0.1); }
tr:nth-child(3){ background:rgba(205,127,50,0.1); }
</style>

</head>
<body>

<div class="layout">

<div class="sidebar" id="sidebar">
  <div class="toggle" onclick="toggle()">☰</div>
  <div class="logo">STATY</div>

  <div class="menu">
    <a href="/">🏠 <span class="text">Dashboard</span></a>
    <a href="/players.html" class="active">👤 <span class="text">Gracze</span></a>
    <a href="/tribes.html">⚔️ <span class="text">Plemiona</span></a>
  </div>
</div>

<div class="content">

<div class="panel">

<div class="back" onclick="history.back()">← Powrót</div>

<h1>Gracze</h1>

<div id="timer" class="timer"></div>
<div class="refresh" onclick="manualRefresh()">↻ Odśwież teraz</div>

<input id="search" placeholder="Szukaj...">

<table>
<thead>
<tr>
<th>#</th>
<th onclick="sortBy('name')">Nick</th>
<th onclick="sortBy('points')">Punkty</th>
<th onclick="sortBy('villages')">Wioski</th>
<th onclick="sortBy('tribe')">Plemie</th>
</tr>
</thead>
<tbody id="t"></tbody>
</table>

</div>

</div>

</div>

<script>
function toggle(){
  const s=document.getElementById("sidebar");
  s.classList.toggle("collapsed");
  localStorage.setItem("sidebar", s.classList.contains("collapsed"));
}

window.onload=()=>{
  if(localStorage.getItem("sidebar")==="true"){
    document.getElementById("sidebar").classList.add("collapsed");
  }
};

let data=[];
let sortKey="points";
let asc=false;

async function init(){
  const res=await fetch("/api/players");
  data=await res.json();
  render();
}

function sortBy(k){
  if(sortKey===k){asc=!asc;} else {sortKey=k;asc=false;}
  render();
}

document.getElementById("search").addEventListener("input", render);

function render(){
  const q=document.getElementById("search").value.toLowerCase();

  let list=[...data]
  .filter(x=>x.name.toLowerCase().includes(q)||(x.tribe||"").toLowerCase().includes(q))
  .sort((a,b)=>{
    if(sortKey==="name"||sortKey==="tribe"){
      return asc?a[sortKey].localeCompare(b[sortKey]):b[sortKey].localeCompare(a[sortKey]);
    }
    return asc?a[sortKey]-b[sortKey]:b[sortKey]-a[sortKey];
  });

  let i=1;

  document.getElementById("t").innerHTML=
  list.slice(0,300).map(x=>`
    <tr>
      <td>${i++}</td>
      <td>${x.name}</td>
      <td>${x.points.toLocaleString()}</td>
      <td>${x.villages}</td>
      <td onclick="go(${x.tribeId})" style="color:${x.color};cursor:pointer">${x.tribe}</td>
    </tr>
  `).join("");
}

function go(id){
  location.href="/tribe.html?id="+id;
}

let refreshTime=300;
let current=refreshTime;

function startTimer(){
  setInterval(()=>{
    current--;
    document.getElementById("timer").innerText="Odświeżanie za: "+current+"s";

    if(current<=0){
      current=refreshTime;
      init();
    }
  },1000);
}

function manualRefresh(){
  current=refreshTime;
  init();
}

init();
startTimer();
</script>

</body>
</html>
