/* Alt Wheel - js/main.js
   Starts the desk: sample files and the downloads capability. */
"use strict";

/* ================= starting desk ================= */
async function seed() {
  var pg = mkCanvas(1275, 1650), x = pg.getContext("2d"), i;
  x.fillStyle = "#fff"; x.fillRect(0, 0, 1275, 1650); x.fillStyle = "#222"; x.font = "700 40px Georgia, serif"; x.fillText("Quarterly Notes: Retention of the Staff", 110, 150);
  var seedv = 7; function rnd() { seedv = (seedv * 9301 + 49297) % 233280; return seedv / 233280; }
  x.font = "400 26px Georgia, serif";
  for (i = 0; i < 34; i++) { x.fillStyle = "#555"; var w = 700 + rnd() * 450; x.fillRect(110, 220 + i * 38, w, 12); }
  x.fillStyle = "#222"; x.fillRect(110, 190, 380, 3);
  var ph = mkCanvas(1600, 1066), p = ph.getContext("2d"), g = p.createLinearGradient(0, 0, 0, 1066);
  g.addColorStop(0, "#ffb25c"); g.addColorStop(0.5, "#ff6a5c"); g.addColorStop(1, "#5a3a8c"); p.fillStyle = g; p.fillRect(0, 0, 1600, 1066);
  p.fillStyle = "#ffe29a"; p.beginPath(); p.arc(1120, 520, 150, 0, 7); p.fill();
  p.fillStyle = "#3a2a6a"; p.beginPath(); p.moveTo(0, 1066); p.lineTo(0, 760); p.lineTo(330, 560); p.lineTo(640, 780); p.lineTo(930, 600); p.lineTo(1250, 800); p.lineTo(1600, 650); p.lineTo(1600, 1066); p.fill();
  var jpg = await tb(flat(pg), "image/jpeg", 0.9), png = await tb(ph, "image/png");
  addRecord({ base: "Sample Page", ext: "jpg", blob: jpg, canvas: pg }); addRecord({ base: "Sample Photo", ext: "png", blob: png, canvas: ph });
}
seed();
if (window.claude && window.claude.use) window.claude.use("downloads").then(function (d) { dl = d; }).catch(function () { dl = null; });
