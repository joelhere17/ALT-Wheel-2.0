/* Alt Wheel - js/tools/compress.js
   Compress tool. */
"use strict";

/* ---- Compress ---- */
function toolCompress(f, cv) {
  var M = modal("Compress"), lossy = ["jpg", "jpeg", "webp"].indexOf(f.ext) >= 0, fmt = lossy ? (f.ext === "webp" ? "webp" : "jpg") : "jpg";
  M.body.innerHTML = '<dl class="kv"><dt>Original</dt><dd>' + fmtBytes(f.blob.size) + " · " + cv.width + " × " + cv.height + '</dd><dt>Result</dt><dd id="res">Working…</dd></dl>' +
    chips("Format", [["jpg", "JPG"], ["webp", "WEBP"], ["png", "PNG"]], fmt) + rng("Quality", "q", 10, 100, 75, "%") + rng("Scale", "sc", 10, 100, 100, "%") +
    '<div class="note" id="qn">PNG is lossless, so Scale is what makes it smaller.</div><div class="foot"><button class="btn2" id="reset" type="button">Reset</button><button class="redbtn" id="apply" type="button">Apply</button></div>';
  var q = $("#q", M.body), sc = $("#sc", M.body), res = $("#res", M.body), t = null, last = null, seq = 0;
  async function calc() {
    var my = ++seq, k = +sc.value / 100, c = k < 1 ? mkCanvas(cv.width * k, cv.height * k) : cv; if (k < 1) c.getContext("2d").drawImage(cv, 0, 0, c.width, c.height);
    var e = fmt === "jpg" ? "jpg" : fmt, blob;
    try { blob = e === "png" ? await tb(c, "image/png") : await tb(e === "webp" ? c : flat(c), MIME[e], +q.value / 100); } catch (x) { res.textContent = "Can't create ." + e; return; }
    if (my !== seq) return; last = { blob: blob, ext: e, canvas: c };
    var pc = Math.round((1 - blob.size / f.blob.size) * 100);
    res.textContent = fmtBytes(blob.size) + " · " + c.width + " × " + c.height + (pc >= 0 ? " (" + pc + "% smaller)" : " (" + -pc + "% larger)");
  }
  function sched() { res.textContent = "Working…"; clearTimeout(t); t = setTimeout(calc, 160); q.disabled = fmt === "png"; }
  bindChips(M.body, function (v) { fmt = v; sched(); });
  [q, sc].forEach(function (el) { el.addEventListener("input", function () { $("#" + el.id + "o", M.body).textContent = el.value + "%"; sched(); }); });
  $("#reset", M.body).addEventListener("click", function () { closeModal(); toolCompress(f, cv); });
  $("#apply", M.body).addEventListener("click", async function () {
    await calc(); if (!last) return; closeModal();
    select(addRecord({ base: f.base + " Compressed", ext: last.ext, blob: last.blob, canvas: last.canvas }, f)); toast("Compressed copy saved to your desk.");
  });
  sched();
}
