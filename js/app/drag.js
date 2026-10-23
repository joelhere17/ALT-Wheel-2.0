/* Alt Wheel - js/app/drag.js
   Pointer dragging, wheel spawning, mode switching and drop handling. */
"use strict";

/* ================= dragging files ================= */
iconsEl.addEventListener("pointerdown", function (e) {
  var el = e.target.closest(".fi"); if (!el || e.button > 0) return;
  var f = byId(el.dataset.id); select(f);
  var r = el.getBoundingClientRect();
  drag = { f: f, el: el, sx: e.clientX, sy: e.clientY, dx: e.clientX - r.left, dy: e.clientY - r.top, on: false, spawned: false, pid: e.pointerId };
  try { el.setPointerCapture(e.pointerId); } catch (x) { }
  e.preventDefault();
});
function startDrag() {
  var f = drag.f; drag.on = true;
  $("#gdoc").innerHTML = iconHTML(f).replace('<div class="doc">', "").replace(/<\/div>$/, "");
  $("#gname").textContent = midTrunc(f.base + "." + f.ext); ghost.hidden = false; ghost.classList.remove("ok");
  drag.can = convertTargets(f).length > 0 || f.kind === "image";
}
window.addEventListener("pointermove", function (e) {
  if (!drag) return;
  var dist = Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy);
  if (!drag.on) { if (dist < 6) return; startDrag(); }
  ghost.style.transform = "translate(" + (e.clientX - 48) + "px," + (e.clientY - 34) + "px)";
  if (!wheel && !drag.spawned && drag.can && dist >= 90) { drag.spawned = true; showWheel(drag.f, modeFor(drag.f), e.clientX, e.clientY); }
  if (wheel) {
    if (wheel.both) {
      Array.prototype.forEach.call(document.querySelectorAll("#modebar span"), function (s) {
        var r = s.getBoundingClientRect();
        if (e.clientX > r.left - 6 && e.clientX < r.right + 6 && e.clientY > r.top - 10 && e.clientY < r.bottom + 10 && s.dataset.m !== wheel.mode) setMode(s.dataset.m);
      });
    }
    setHot(pickAt(e.clientX, e.clientY));
  }
});
window.addEventListener("pointerup", function (e) {
  if (!drag) return;
  var d = drag; drag = null;
  if (!d.on) return;
  var hot = wheel ? wheel.hot : -1, mode = wheel ? wheel.mode : "", item = hot >= 0 ? wheel.items[hot] : null;
  ghost.hidden = true; ghost.classList.remove("ok"); if (wheel) hideWheel();
  if (item) { if (mode === "convert") runConvert(d.f, item[0]); else openTool(d.f, item[0]); return; }
  d.f.x = clamp(e.clientX - d.dx, 8, Math.max(8, desk.clientWidth - 104)); d.f.y = clamp(e.clientY - d.dy, 56, Math.max(56, desk.clientHeight - 110));
  d.el.style.left = d.f.x + "px"; d.el.style.top = d.f.y + "px";
});
window.addEventListener("pointercancel", function () {
  if (!drag) return; drag = null; ghost.hidden = true; if (wheel) hideWheel();
});
window.addEventListener("keydown", function (e) {
  if (drag && drag.on && wheel && wheel.both && (e.key === " " || e.key === "Tab" || e.key === "Shift")) { e.preventDefault(); setMode(wheel.mode === "convert" ? "tools" : "convert"); return; }
  if (e.key === "Escape" && drag) { drag = null; ghost.hidden = true; if (wheel) hideWheel(); return; }
  if (mroot.firstChild) { if (e.key === "Escape") closeModal(); return; }
  if ((e.key === "Delete" || e.key === "Backspace") && selId !== null && !/input|textarea/i.test(e.target.tagName)) removeSel();
});
iconsEl.addEventListener("dblclick", function (e) { var el = e.target.closest(".fi"); if (el) saveFile(byId(el.dataset.id)); });
desk.addEventListener("pointerdown", function (e) { if (!e.target.closest(".fi") && !e.target.closest(".bar")) select(null); });
