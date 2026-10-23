/* Alt Wheel - js/tools/edit.js
   Edit tool (brightness, contrast, saturation and more). */
"use strict";

/* ---- Edit ---- */
function toolEdit(f, cv) {
  var M = modal("Edit Image"), S = { rot: 0, fx: false, fy: false, br: 0, ct: 0, sa: 0 }, bs = boxSize();
  M.body.innerHTML = '<div class="stagebox" id="pbox"><canvas id="pv"></canvas></div><div class="tools"><button class="chip" data-a="rl" type="button">Rotate left</button><button class="chip" data-a="rr" type="button">Rotate right</button><button class="chip" data-a="fx" type="button">Flip horizontal</button><button class="chip" data-a="fy" type="button">Flip vertical</button></div>' +
    rng("Brightness", "br", -100, 100, 0, "") + rng("Contrast", "ct", -100, 100, 0, "") + rng("Saturation", "sa", -100, 100, 0, "") +
    '<div class="foot"><button class="btn2" id="reset" type="button">Reset</button><button class="redbtn" id="apply" type="button">Apply</button></div>';
  function render(src, maxSide) {
    var k = Math.min(1, maxSide / Math.max(src.width, src.height)), w = src.width * k, h = src.height * k, sw = S.rot % 180 ? h : w, sh = S.rot % 180 ? w : h, c = mkCanvas(sw, sh), x = c.getContext("2d");
    x.translate(c.width / 2, c.height / 2); x.rotate(S.rot * Math.PI / 180); x.scale(S.fx ? -1 : 1, S.fy ? -1 : 1); x.drawImage(src, -w / 2, -h / 2, w, h); x.setTransform(1, 0, 0, 1, 0, 0);
    if (S.br || S.ct || S.sa) {
      var id = x.getImageData(0, 0, c.width, c.height), d = id.data, cf = (259 * (S.ct * 2.55 + 255)) / (255 * (259 - S.ct * 2.55)), sv = 1 + S.sa / 100, bo = S.br * 2.55;
      for (var i = 0; i < d.length; i += 4) {
        var r = d[i], g = d[i + 1], b = d[i + 2], l = 0.299 * r + 0.587 * g + 0.114 * b;
        r = l + (r - l) * sv; g = l + (g - l) * sv; b = l + (b - l) * sv;
        d[i] = clamp(cf * (r + bo - 128) + 128, 0, 255); d[i + 1] = clamp(cf * (g + bo - 128) + 128, 0, 255); d[i + 2] = clamp(cf * (b + bo - 128) + 128, 0, 255);
      }
      x.putImageData(id, 0, 0);
    }
    return c;
  }
  var pv = $("#pv", M.body);
  function draw() { var c = render(cv, 700), b = fitBox(c.width, c.height, bs[0], bs[1]); pv.width = b.w; pv.height = b.h; $("#pbox", M.body).style.width = b.w + "px"; pv.getContext("2d").drawImage(c, 0, 0, b.w, b.h); }
  M.body.addEventListener("click", function (e) {
    var a = e.target.dataset && e.target.dataset.a; if (!a) return;
    if (a === "rl") S.rot = (S.rot + 270) % 360; if (a === "rr") S.rot = (S.rot + 90) % 360; if (a === "fx") S.fx = !S.fx; if (a === "fy") S.fy = !S.fy; draw();
  });
  ["br", "ct", "sa"].forEach(function (id) { $("#" + id, M.body).addEventListener("input", function (e) { S[id] = +e.target.value; $("#" + id + "o", M.body).textContent = e.target.value; draw(); }); });
  $("#reset", M.body).addEventListener("click", function () { closeModal(); toolEdit(f, cv); });
  $("#apply", M.body).addEventListener("click", async function () { var c = render(cv, 1e9); closeModal(); try { await addResult(f, c, "Edited"); } catch (e) { toast(e.message, true); } });
  draw();
}
