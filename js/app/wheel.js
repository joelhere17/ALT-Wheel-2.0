/* Alt Wheel - js/app/wheel.js
   The radial wheel: geometry, petals, icons, hover and hit-testing. */
"use strict";

/* ================= the wheel ================= */
var C = 200, RIN = 84, ROUT = 190, GAP = 6, RC = 12, lastMode = "convert";
var TOOLS = [["compress", "COMPRESS"], ["metadata", "METADATA"], ["edit", "EDIT"], ["annotate", "ANNOTATE"], ["addbg", "ADD BG"], ["crop", "CROP"], ["redact", "REDACT"]];
var ICONS = {
  compress: "M4 4l5 5M9 5v4H5M16 16l-5-5M11 15v-4h4", metadata: "M3 3h7l7 7-7 7-7-7zM7 7h.01", edit: "M3 6h14M3 14h14M7 3.5v5M13 11.5v5",
  annotate: "M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM6.5 13.5l7-7", addbg: "M3 4h14v12H3zM3 14l4-4 3 3 3-3 4 4M13.5 7.5h.01",
  crop: "M6 2v12h12M2 6h12v12", redact: "M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6zM4 4l12 12M10 8a2 2 0 0 1 2 2"
};
function pol(r, a) { a = a * Math.PI / 180; return [C + r * Math.sin(a), C - r * Math.cos(a)]; }
function petalPath(i, n) {
  var c = i * 360 / n, half = 180 / n, ro = ROUT - RC, ri = RIN + RC;
  var insO = (GAP / 2 + RC) / ro * 180 / Math.PI, insI = (GAP / 2 + RC) / ri * 180 / Math.PI, pts = [], k, steps = Math.max(6, Math.round(half / 3));
  for (k = 0; k <= steps; k++) pts.push(pol(ro, c - half + insO + (2 * (half - insO)) * k / steps));
  for (k = 0; k <= steps; k++) pts.push(pol(ri, c + half - insI - (2 * (half - insI)) * k / steps));
  return "M" + pts.map(function (p) { return p[0].toFixed(1) + " " + p[1].toFixed(1); }).join("L") + "Z";
}
function buildWheel(items, centerText, icons) {
  var n = items.length, h = '<defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fcd5b3"/><stop offset="1" stop-color="#f2a983"/></linearGradient>' +
    '<linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f24a2c"/><stop offset="1" stop-color="#c41e10"/></linearGradient></defs>';
  items.forEach(function (it, i) { h += '<path class="pt" data-i="' + i + '" stroke-width="' + (RC * 2) + '" d="' + petalPath(i, n) + '"/>'; });
  items.forEach(function (it, i) {
    var p = pol((RIN + ROUT) / 2 + 3, i * 360 / n);
    if (icons && ICONS[it[0]]) {
      h += '<g class="ic" data-ic="' + i + '" transform="translate(' + (p[0] - 10).toFixed(1) + " " + (p[1] - 23).toFixed(1) + ')"><path d="' + ICONS[it[0]] + '"/></g>';
      h += '<text class="pl" data-l="' + i + '" x="' + p[0].toFixed(1) + '" y="' + (p[1] + 13).toFixed(1) + '">' + esc(it[1]) + "</text>";
    } else h += '<text class="pl' + (n <= 4 ? " big" : "") + '" data-l="' + i + '" x="' + p[0].toFixed(1) + '" y="' + p[1].toFixed(1) + '">' + esc(it[1]) + "</text>";
  });
  h += '<circle class="cring" cx="200" cy="200" r="72"/><circle class="cin" cx="200" cy="200" r="58"/><rect class="cpill" x="152" y="184" width="96" height="32" rx="16"/><text class="ctext" id="ctext" x="200" y="200.5">' + esc(centerText) + "</text>";
  wheelEl.innerHTML = h;
}
function modeFor(f) {
  var conv = convertTargets(f).length > 0, tools = f.kind === "image";
  return !conv ? "tools" : !tools ? "convert" : lastMode;
}
function showWheel(f, mode, px, py) {
  var conv = convertTargets(f), tools = f.kind === "image", box = $("#wbox");
  wheel = { f: f, mode: mode, hot: -1, items: [], both: conv.length > 0 && tools };
  var ws = Math.min(innerWidth * 0.76, innerHeight * 0.72, 430), half = ws / 2;
  wheel.ws = ws; wheel.cx = clamp(px, half + 8, innerWidth - half - 8); wheel.cy = clamp(py, half + 56, innerHeight - half - 8);
  box.style.width = box.style.height = ws + "px"; box.style.left = wheel.cx + "px"; box.style.top = wheel.cy + "px"; box.style.marginLeft = box.style.marginTop = -half + "px";
  $("#modebar").hidden = !wheel.both; $("#modehint").hidden = !wheel.both;
  setMode(mode);
  document.body.classList.add("wheeling"); wl.hidden = false; requestAnimationFrame(function () { requestAnimationFrame(function () { wl.classList.add("on"); }); });
}
function setMode(mode) {
  var f = wheel.f; wheel.mode = mode; wheel.hot = -1; lastMode = mode;
  wheel.items = mode === "convert" ? convertTargets(f).map(function (x) { return [x, x.toUpperCase()]; }) : TOOLS;
  wheel.size = f.blob ? fmtBytes(f.blob.size) : "";
  buildWheel(wheel.items, wheel.size, mode === "tools");
  Array.prototype.forEach.call(document.querySelectorAll("#modebar span"), function (s) { s.classList.toggle("on", s.dataset.m === mode); });
}
function hideWheel() { document.body.classList.remove("wheeling"); wl.classList.remove("on"); setTimeout(function () { if (!wl.classList.contains("on")) wl.hidden = true; }, 220); wheel = null; }
function setHot(i) {
  if (!wheel || wheel.hot === i) return;
  wheel.hot = i;
  Array.prototype.forEach.call(wheelEl.querySelectorAll(".pt"), function (p, k) { p.classList.toggle("hot", k === i); });
  Array.prototype.forEach.call(wheelEl.querySelectorAll(".pl"), function (p, k) { p.classList.toggle("hot", k === i); });
  Array.prototype.forEach.call(wheelEl.querySelectorAll(".ic"), function (p, k) { p.classList.toggle("hot", k === i); });
  var ct = $("#ctext"); if (ct) ct.textContent = i >= 0 ? wheel.items[i][1] : wheel.size;
  ghost.classList.toggle("ok", i >= 0);
}
function pickAt(x, y) {
  var k = 420 / wheel.ws, dx = (x - wheel.cx) * k, dy = (y - wheel.cy) * k, d = Math.hypot(dx, dy);
  if (d < RIN - 6 || d > ROUT + 16) return -1;
  var a = (Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360, n = wheel.items.length, w = 360 / n;
  return Math.floor(((a + w / 2) % 360) / w);
}
