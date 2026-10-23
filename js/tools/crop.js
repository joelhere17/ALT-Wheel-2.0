/* Alt Wheel - js/tools/crop.js
   Crop tool. */
"use strict";

/* ---- Crop ---- */
function toolCrop(f, cv) {
  var W = cv.width, H = cv.height, M = modal("Crop Image"), bs = boxSize(), b = fitBox(W, H, bs[0], bs[1]), s = b.s;
  M.body.innerHTML = '<div class="stagebox" style="width:' + b.w + "px;height:" + b.h + 'px"><canvas width="' + b.w + '" height="' + b.h + '"></canvas><div class="crect"><i data-h="nw" style="left:0;top:0"></i><i data-h="n" style="left:50%;top:0"></i><i data-h="ne" style="left:100%;top:0"></i><i data-h="e" style="left:100%;top:50%"></i><i data-h="se" style="left:100%;top:100%"></i><i data-h="s" style="left:50%;top:100%"></i><i data-h="sw" style="left:0;top:100%"></i><i data-h="w" style="left:0;top:50%"></i></div></div>' +
    chips("Aspect ratio", [["0", "Free"], ["1", "1:1"], ["1.7778", "16:9"], ["0.5625", "9:16"], ["1.3333", "4:3"], ["0.75", "3:4"]], "0") +
    '<div class="row"><span class="lb">Size</span>W <input type="number" id="cw" min="1"> H <input type="number" id="ch" min="1"> px</div>' +
    '<div class="foot"><button class="btn2" id="reset" type="button">Reset</button><button class="redbtn" id="apply" type="button">Apply</button></div>';
  $("canvas", M.body).getContext("2d").drawImage(cv, 0, 0, b.w, b.h);
  var rect = $(".crect", M.body), cw = $("#cw"), ch = $("#ch"), ratio = 0, MIN = Math.min(24, W / 4, H / 4), R;
  function init() { R = { x: W * 0.06, y: H * 0.06, w: W * 0.88, h: H * 0.88 }; }
  function paint() {
    rect.style.left = R.x * s + "px"; rect.style.top = R.y * s + "px"; rect.style.width = R.w * s + "px"; rect.style.height = R.h * s + "px";
    cw.value = Math.round(R.w); ch.value = Math.round(R.h);
  }
  function fitRatio() {
    if (!ratio) return; var cx = R.x + R.w / 2, cy = R.y + R.h / 2, w = Math.min(R.w, R.h * ratio), h = w / ratio;
    R = { x: clamp(cx - w / 2, 0, W - w), y: clamp(cy - h / 2, 0, H - h), w: w, h: h };
  }
  init(); paint();
  bindChips(M.body, function (v) { ratio = +v; fitRatio(); paint(); });
  $("#reset").addEventListener("click", function () { init(); ratio = 0; Array.prototype.forEach.call($(".chips", M.body).children, function (c, i) { c.classList.toggle("on", i === 0); }); paint(); });
  function sizeIn() {
    var w = clamp(+cw.value || R.w, MIN, W), h = clamp(+ch.value || R.h, MIN, H);
    if (document.activeElement === cw && ratio) h = w / ratio; else if (document.activeElement === ch && ratio) w = h * ratio;
    if (ratio) { var k = Math.min(1, W / w, H / h); w *= k; h *= k; }
    R = { x: clamp(R.x, 0, W - w), y: clamp(R.y, 0, H - h), w: w, h: h }; paint();
  }
  cw.addEventListener("change", sizeIn); ch.addEventListener("change", sizeIn);
  dragOn(rect, function (e) {
    var h = e.target.dataset && e.target.dataset.h; return { m: h || "move", R0: { x: R.x, y: R.y, w: R.w, h: R.h }, sx: e.clientX, sy: e.clientY };
  }, function (e, c) {
    var dx = (e.clientX - c.sx) / s, dy = (e.clientY - c.sy) / s, R0 = c.R0, m = c.m;
    if (m === "move") { R = { x: clamp(R0.x + dx, 0, W - R0.w), y: clamp(R0.y + dy, 0, H - R0.h), w: R0.w, h: R0.h }; paint(); return; }
    var x0 = R0.x, y0 = R0.y, x1 = R0.x + R0.w, y1 = R0.y + R0.h;
    if (m.indexOf("w") >= 0) x0 = clamp(R0.x + dx, 0, x1 - MIN); if (m.indexOf("e") >= 0) x1 = clamp(x1 + dx, x0 + MIN, W);
    if (m.indexOf("n") >= 0) y0 = clamp(R0.y + dy, 0, y1 - MIN); if (m.indexOf("s") >= 0) y1 = clamp(y1 + dy, y0 + MIN, H);
    if (ratio) {
      var w = x1 - x0, h = y1 - y0, ax = m.indexOf("w") >= 0 ? R0.x + R0.w : R0.x, ay = m.indexOf("n") >= 0 ? R0.y + R0.h : R0.y, cx = R0.x + R0.w / 2, cy = R0.y + R0.h / 2;
      if (m.length === 2) {
        var mw = m.indexOf("w") >= 0 ? ax : W - ax, mh = m.indexOf("n") >= 0 ? ay : H - ay; w = Math.max(MIN, Math.min(w, mw, mh * ratio)); h = w / ratio;
        x0 = m.indexOf("w") >= 0 ? ax - w : ax; y0 = m.indexOf("n") >= 0 ? ay - h : ay; x1 = x0 + w; y1 = y0 + h;
      } else if (m === "n" || m === "s") {
        h = Math.max(MIN / ratio, Math.min(h, (m === "n" ? R0.y + R0.h : H - R0.y), 2 * Math.min(cx, W - cx) / ratio)); w = h * ratio;
        x0 = cx - w / 2; x1 = cx + w / 2; if (m === "n") { y1 = R0.y + R0.h; y0 = y1 - h; } else { y0 = R0.y; y1 = y0 + h; }
      } else {
        w = Math.max(MIN, Math.min(w, (m === "w" ? R0.x + R0.w : W - R0.x), 2 * Math.min(cy, H - cy) * ratio)); h = w / ratio;
        y0 = cy - h / 2; y1 = cy + h / 2; if (m === "w") { x1 = R0.x + R0.w; x0 = x1 - w; } else { x0 = R0.x; x1 = x0 + w; }
      }
    }
    R = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }; paint();
  });
  $("#apply").addEventListener("click", async function () {
    var x = Math.round(R.x), y = Math.round(R.y), w = Math.round(R.w), h = Math.round(R.h), out = mkCanvas(w, h);
    out.getContext("2d").drawImage(cv, x, y, w, h, 0, 0, w, h); closeModal();
    try { await addResult(f, out, "Cropped"); } catch (e) { toast(e.message, true); }
  });
}
