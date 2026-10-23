/* Alt Wheel - js/tools/markup.js
   Annotate and Redact tools (shared drawing surface). */
"use strict";

/* ---- Annotate and Redact share one drawing surface ---- */
function drawSurface(M, cv, bs) {
  var b = fitBox(cv.width, cv.height, bs[0], bs[1]), s = b.s, items = [];
  var box = $("#pbox", M.body); box.style.width = b.w + "px"; box.style.height = b.h + "px"; box.style.position = "relative";
  var c = $("#pv", M.body); c.width = b.w; c.height = b.h;
  return { s: s, items: items, c: c, box: box, pt: function (e) { var r = c.getBoundingClientRect(); return [(e.clientX - r.left) / s, (e.clientY - r.top) / s]; } };
}
function paintItems(x, items, k, W, H, src) {
  items.forEach(function (it) {
    x.save(); x.lineCap = "round"; x.lineJoin = "round"; x.strokeStyle = it.color; x.fillStyle = it.color; x.lineWidth = it.w * k;
    if (it.t === "pen") { x.beginPath(); it.pts.forEach(function (p, i) { i ? x.lineTo(p[0] * k, p[1] * k) : x.moveTo(p[0] * k, p[1] * k); }); if (it.pts.length === 1) x.lineTo(it.pts[0][0] * k + 0.1, it.pts[0][1] * k); x.stroke(); }
    else if (it.t === "box") x.strokeRect(it.a[0] * k, it.a[1] * k, (it.b[0] - it.a[0]) * k, (it.b[1] - it.a[1]) * k);
    else if (it.t === "arrow") {
      var a = it.a, bb = it.b, ang = Math.atan2(bb[1] - a[1], bb[0] - a[0]), hl = Math.max(14, it.w * 4) * k;
      x.beginPath(); x.moveTo(a[0] * k, a[1] * k); x.lineTo(bb[0] * k, bb[1] * k); x.stroke();
      x.beginPath(); x.moveTo(bb[0] * k, bb[1] * k); x.lineTo(bb[0] * k - hl * Math.cos(ang - 0.45), bb[1] * k - hl * Math.sin(ang - 0.45)); x.lineTo(bb[0] * k - hl * Math.cos(ang + 0.45), bb[1] * k - hl * Math.sin(ang + 0.45)); x.closePath(); x.fill();
    } else if (it.t === "text") { x.font = "700 " + it.size * k + "px Inter, system-ui, sans-serif"; x.textBaseline = "top"; x.fillText(it.text, it.a[0] * k, it.a[1] * k); }
    else if (it.t === "redact") {
      var rx = Math.min(it.a[0], it.b[0]) * k, ry = Math.min(it.a[1], it.b[1]) * k, rw = Math.abs(it.b[0] - it.a[0]) * k, rh = Math.abs(it.b[1] - it.a[1]) * k;
      if (it.mode === "black") { x.fillStyle = "#000"; x.fillRect(rx, ry, rw, rh); }
      else if (rw > 1 && rh > 1) {
        var t = mkCanvas(Math.max(1, rw / Math.max(6, 14 * k)), Math.max(1, rh / Math.max(6, 14 * k)));
        t.getContext("2d").drawImage(src, rx / k, ry / k, rw / k, rh / k, 0, 0, t.width, t.height); x.imageSmoothingEnabled = false; x.drawImage(t, 0, 0, t.width, t.height, rx, ry, rw, rh);
      }
    }
    x.restore();
  });
}
function toolAnnotate(f, cv) {
  var M = modal("Annotate"), bs = boxSize(), COLS = ["#e0301e", "#f5b700", "#2f6fe0", "#111111", "#ffffff"], tool = "pen", color = COLS[0];
  M.body.innerHTML = '<div class="stagebox" id="pbox" style="touch-action:none"><canvas id="pv"></canvas></div><div class="tools" id="tl"><button class="chip on" data-t="pen" type="button">Pen</button><button class="chip" data-t="arrow" type="button">Arrow</button><button class="chip" data-t="box" type="button">Box</button><button class="chip" data-t="text" type="button">Text</button><span class="colors" id="cols"></span></div>' +
    rng("Size", "sz", 2, 40, Math.max(4, Math.round(Math.min(cv.width, cv.height) / 120)), "") +
    '<div class="foot"><button class="btn2" id="undo" type="button">Undo</button><button class="redbtn" id="apply" type="button">Apply</button></div>';
  var D = drawSurface(M, cv, bs), x = D.c.getContext("2d"), sz = $("#sz", M.body), cur = null;
  $("#cols", M.body).innerHTML = COLS.map(function (c, i) { return '<button type="button" class="col' + (i === 0 ? " on" : "") + '" data-c="' + c + '" style="background:' + c + '" aria-label="Color ' + (i + 1) + '"></button>'; }).join("");
  function redraw() { x.clearRect(0, 0, D.c.width, D.c.height); x.drawImage(cv, 0, 0, D.c.width, D.c.height); paintItems(x, D.items.concat(cur ? [cur] : []), D.s, cv.width, cv.height); }
  $("#tl", M.body).addEventListener("click", function (e) {
    var t = e.target.dataset; if (t.t) { tool = t.t; Array.prototype.forEach.call($("#tl", M.body).querySelectorAll(".chip"), function (c) { c.classList.toggle("on", c === e.target); }); }
    if (t.c) { color = t.c; Array.prototype.forEach.call($("#cols", M.body).children, function (c) { c.classList.toggle("on", c === e.target); }); }
  });
  sz.addEventListener("input", function () { $("#szo", M.body).textContent = sz.value; });
  dragOn(D.c, function (e) {
    var p = D.pt(e), w = +sz.value;
    if (tool === "text") {
      var inp = document.createElement("input"); inp.className = "tin"; inp.style.left = p[0] * D.s + "px"; inp.style.top = p[1] * D.s + "px"; inp.setAttribute("aria-label", "Annotation text"); D.box.appendChild(inp);
      setTimeout(function () { inp.focus(); }, 0);
      function commit() { if (inp.value.trim()) { D.items.push({ t: "text", a: p, text: inp.value, color: color, size: Math.max(14, w * 4), w: 1 }); redraw(); } inp.remove(); }
      inp.addEventListener("keydown", function (ev) { ev.stopPropagation(); if (ev.key === "Enter") commit(); if (ev.key === "Escape") inp.remove(); }); inp.addEventListener("blur", commit); return { skip: true };
    }
    cur = tool === "pen" ? { t: "pen", pts: [p], color: color, w: w } : { t: tool, a: p, b: p, color: color, w: w }; redraw(); return {};
  }, function (e, c) { if (c.skip || !cur) return; var p = D.pt(e); if (cur.t === "pen") cur.pts.push(p); else cur.b = p; redraw(); }, function (e, c) { if (c.skip || !cur) return; D.items.push(cur); cur = null; redraw(); });
  $("#undo", M.body).addEventListener("click", function () { D.items.pop(); redraw(); });
  $("#apply", M.body).addEventListener("click", async function () {
    var out = mkCanvas(cv.width, cv.height), ox = out.getContext("2d"); ox.drawImage(cv, 0, 0); paintItems(ox, D.items, 1, cv.width, cv.height); closeModal();
    try { await addResult(f, out, "Annotated"); } catch (e) { toast(e.message, true); }
  });
  redraw();
}
function toolRedact(f, cv) {
  var M = modal("Redact"), bs = boxSize(), mode = "black";
  M.body.innerHTML = '<div class="stagebox" id="pbox" style="touch-action:none"><canvas id="pv"></canvas></div>' + chips("Style", [["black", "Black bar"], ["blur", "Pixelate"]], "black") +
    '<div class="note">Drag over anything you want to hide. The hidden parts are removed from the saved copy, not just covered.</div><div class="foot"><button class="btn2" id="undo" type="button">Undo</button><button class="redbtn" id="apply" type="button">Apply</button></div>';
  var D = drawSurface(M, cv, bs), x = D.c.getContext("2d"), cur = null;
  function redraw() { x.clearRect(0, 0, D.c.width, D.c.height); x.drawImage(cv, 0, 0, D.c.width, D.c.height); paintItems(x, D.items.concat(cur ? [cur] : []), D.s, cv.width, cv.height, cv); }
  bindChips(M.body, function (v) { mode = v; });
  dragOn(D.c, function (e) { var p = D.pt(e); cur = { t: "redact", a: p, b: p, mode: mode, color: "#000", w: 1 }; redraw(); return {}; },
    function (e) { if (cur) { cur.b = D.pt(e); redraw(); } }, function () { if (cur && Math.abs(cur.b[0] - cur.a[0]) > 3 && Math.abs(cur.b[1] - cur.a[1]) > 3) D.items.push(cur); cur = null; redraw(); });
  $("#undo", M.body).addEventListener("click", function () { D.items.pop(); redraw(); });
  $("#apply", M.body).addEventListener("click", async function () {
    if (!D.items.length) { toast("Drag over the parts you want to hide first.", true); return; }
    var out = mkCanvas(cv.width, cv.height), ox = out.getContext("2d"); ox.drawImage(cv, 0, 0); paintItems(ox, D.items, 1, cv.width, cv.height, cv); closeModal();
    try { await addResult(f, out, "Redacted"); } catch (e) { toast(e.message, true); }
  });
  redraw();
}
