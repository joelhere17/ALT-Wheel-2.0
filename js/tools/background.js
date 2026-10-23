/* Alt Wheel - js/tools/background.js
   Add Background tool (solid colors, gradients, images). */
"use strict";

/* ---- Add background ---- */
var GRADS = [
  ["#ff5a3c", "#ffb13b", "#8a5bd6"], ["#2b6cff", "#3ad6d0", "#b5f0ff"], ["#ff9a9e", "#fad0c4", "#fbc2eb"], ["#11998e", "#38ef7d", "#d4fc79"],
  ["#614385", "#516395", "#a1c4fd"], ["#232526", "#414345", "#8e9eab"], ["#f12711", "#f5af19", "#fff3b0"], ["#0f0c29", "#302b63", "#24c6dc"]
];
var SOLIDS = ["#ffffff", "#f6c244", "#f58a2e", "#8bd23f", "#2fa866", "#2fc1d8", "#2f66d8", "#23243a", "#7b4fd6"];
function bgCanvas(w, h, bg) {
  var c = mkCanvas(w, h), x = c.getContext("2d");
  if (bg.t === "grad") {
    var g = x.createLinearGradient(0, 0, w, h), a = bg.c; g.addColorStop(0, a[0]); g.addColorStop(0.55, a[1]); g.addColorStop(1, a[2]); x.fillStyle = g; x.fillRect(0, 0, w, h);
    var r = x.createRadialGradient(w * 0.85, h * 0.1, 0, w * 0.85, h * 0.1, Math.max(w, h) * 0.6); r.addColorStop(0, a[1] + "cc"); r.addColorStop(1, a[1] + "00"); x.fillStyle = r; x.fillRect(0, 0, w, h);
  } else if (bg.t === "img" && bg.img) {
    var s = Math.max(w / bg.img.width, h / bg.img.height), iw = bg.img.width * s, ih = bg.img.height * s; x.drawImage(bg.img, (w - iw) / 2, (h - ih) / 2, iw, ih);
  } else { x.fillStyle = bg.c || "#fff"; x.fillRect(0, 0, w, h); }
  return c;
}
function composeBG(src, o, maxSide) {
  var p = o.pad, W0 = src.width + 2 * p, H0 = src.height + 2 * p, Wc = W0, Hc = H0;
  if (o.ratio) { Wc = Math.max(W0, H0 * o.ratio); Hc = Wc / o.ratio; if (Hc < H0) { Hc = H0; Wc = Hc * o.ratio; } }
  var k = Math.min(1, maxSide / Math.max(Wc, Hc)), out = bgCanvas(Wc * k, Hc * k, o.bg), x = out.getContext("2d");
  var iw = src.width * k, ih = src.height * k, ix = (out.width - iw) / 2, iy = (out.height - ih) / 2, rad = Math.min(o.rad * k, iw / 2, ih / 2);
  function rr() { x.beginPath(); if (x.roundRect) x.roundRect(ix, iy, iw, ih, rad); else x.rect(ix, iy, iw, ih); }
  x.save(); x.shadowColor = "rgba(0,0,0,.38)"; x.shadowBlur = o.sh * k; x.shadowOffsetY = o.sh * k / 3; x.fillStyle = "#fff"; rr(); x.fill(); x.restore();
  x.save(); rr(); x.clip(); x.drawImage(src, ix, iy, iw, ih); x.restore(); return out;
}
function toolBG(f, cv) {
  var M = modal("Add BG"), m = Math.min(cv.width, cv.height), mx = Math.max(cv.width, cv.height);
  var o = { bg: { t: "grad", c: GRADS[0] }, pad: clamp(Math.round(m * 0.08), 16, 200), rad: Math.round(m * 0.02), sh: Math.round(m * 0.02), ratio: 0 };
  var bs = boxSize();
  M.body.innerHTML = '<div class="stagebox" id="pbox"><canvas id="pv"></canvas></div><div class="row"><span class="lb">Background</span><div class="swatches" id="sws"></div></div>' +
    rng("Padding", "pad", 0, Math.round(mx * 0.4), o.pad, " px") + rng("Corners", "rad", 0, Math.round(m / 3), o.rad, " px") + rng("Shadow", "sh", 0, Math.round(m * 0.12), o.sh, " px") +
    chips("Ratio", [["0", "Auto"], ["1", "1:1"], ["1.7778", "16:9"], ["1.25", "5:4"], ["0.8", "4:5"]], "0") +
    '<div class="foot"><button class="btn2" id="reset" type="button">Reset</button><button class="redbtn" id="apply" type="button">Save with Background</button></div>';
  var sws = $("#sws", M.body), pv = $("#pv", M.body);
  GRADS.forEach(function (g, i) {
    var b = document.createElement("button"); b.type = "button"; b.className = "sw" + (i === 0 ? " on" : ""); b.setAttribute("aria-label", "Gradient " + (i + 1));
    b.style.background = "linear-gradient(135deg," + g[0] + "," + g[1] + "," + g[2] + ")"; b.addEventListener("click", function () { o.bg = { t: "grad", c: g }; mark(b); draw(); }); sws.appendChild(b);
  });
  var ib = document.createElement("button"); ib.type = "button"; ib.className = "sw"; ib.setAttribute("aria-label", "Use a picture"); ib.textContent = "▣"; ib.style.background = "rgba(255,255,255,.55)"; sws.appendChild(ib);
  var inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*"; inp.className = "sr"; inp.tabIndex = -1; M.body.appendChild(inp);
  ib.addEventListener("click", function () { inp.click(); });
  inp.addEventListener("change", async function () {
    if (!inp.files[0]) return; try { var bm = await createImageBitmap(inp.files[0]); o.bg = { t: "img", img: bm }; mark(ib); draw(); } catch (e) { toast("Couldn't open that picture.", true); }
  });
  var br = document.createElement("i"); br.className = "brk"; sws.appendChild(br);
  SOLIDS.forEach(function (c) {
    var b = document.createElement("button"); b.type = "button"; b.className = "sw"; b.style.background = c; b.setAttribute("aria-label", c);
    b.addEventListener("click", function () { o.bg = { t: "solid", c: c }; mark(b); draw(); }); sws.appendChild(b);
  });
  var cb = document.createElement("label"); cb.className = "sw custom"; cb.innerHTML = '<input type="color" value="#2f66d8" aria-label="Custom color">'; sws.appendChild(cb);
  $("input", cb).addEventListener("input", function (e) { o.bg = { t: "solid", c: e.target.value }; cb.style.background = e.target.value; mark(cb); draw(); });
  function mark(el) { Array.prototype.forEach.call(sws.children, function (x) { x.classList.toggle("on", x === el); }); }
  function draw() {
    var out = composeBG(cv, o, 900), b = fitBox(out.width, out.height, bs[0], bs[1]);
    pv.width = b.w; pv.height = b.h; $("#pbox", M.body).style.width = b.w + "px"; pv.getContext("2d").drawImage(out, 0, 0, b.w, b.h);
  }
  ["pad", "rad", "sh"].forEach(function (id) {
    $("#" + id, M.body).addEventListener("input", function (e) { o[id === "rad" ? "rad" : id] = +e.target.value; $("#" + id + "o", M.body).textContent = e.target.value + " px"; draw(); });
  });
  bindChips(M.body, function (v) { o.ratio = +v; draw(); });
  $("#reset", M.body).addEventListener("click", function () { closeModal(); toolBG(f, cv); });
  $("#apply", M.body).addEventListener("click", async function () {
    var b = this; b.disabled = true; b.textContent = "Saving…"; await sleep(30);
    try { var out = composeBG(cv, o, 6000); closeModal(); await addResult(f, out, "With Background", "png"); } catch (e) { toast(e.message, true); b.disabled = false; }
  });
  draw();
}
