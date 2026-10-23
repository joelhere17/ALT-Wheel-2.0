/* Alt Wheel - js/tools/modal.js
   Shared modal window and control builders used by every tool. */
"use strict";

/* ================= tool windows ================= */
function closeModal() { mroot.innerHTML = ""; }
function modal(title) {
  mroot.innerHTML = '<div class="mback"><div class="modal" role="dialog" aria-label="' + esc(title) + '"><button class="mx" type="button" aria-label="Close">×</button><h2>' + esc(title) + '</h2><div class="mbody"></div></div></div>';
  $(".mx", mroot).addEventListener("click", closeModal);
  $(".mback", mroot).addEventListener("pointerdown", function (e) { if (e.target === this) closeModal(); });
  return { el: $(".modal", mroot), body: $(".mbody", mroot) };
}
function rng(label, id, min, max, val, unit) {
  return '<div class="row"><span class="lb">' + label + '</span><input type="range" id="' + id + '" min="' + min + '" max="' + max + '" value="' + val + '"><output id="' + id + 'o">' + val + (unit || "") + "</output></div>";
}
function chips(label, arr, on) {
  return '<div class="row"><span class="lb">' + label + '</span><div class="chips">' + arr.map(function (a) { return '<button type="button" class="chip' + (a[0] === on ? " on" : "") + '" data-v="' + a[0] + '">' + a[1] + "</button>"; }).join("") + "</div></div>";
}
function bindChips(root, fn) {
  root.addEventListener("click", function (e) {
    var c = e.target.closest(".chip"); if (!c || !root.contains(c)) return;
    Array.prototype.forEach.call(c.parentNode.children, function (x) { x.classList.toggle("on", x === c); }); fn(c.dataset.v);
  });
}
function dragOn(el, down, move, up) {
  el.addEventListener("pointerdown", function (e) {
    if (e.button > 0) return; e.preventDefault(); e.stopPropagation(); try { el.setPointerCapture(e.pointerId); } catch (x) { }
    var ctx = down(e) || {};
    function mv(ev) { move(ev, ctx); }
    function fin(ev) { el.removeEventListener("pointermove", mv); el.removeEventListener("pointerup", fin); el.removeEventListener("pointercancel", fin); if (up) up(ev, ctx); }
    el.addEventListener("pointermove", mv); el.addEventListener("pointerup", fin); el.addEventListener("pointercancel", fin);
  });
}
function fitBox(W, H, maxW, maxH) { var s = Math.min(maxW / W, maxH / H, 1); return { s: s, w: Math.max(1, Math.round(W * s)), h: Math.max(1, Math.round(H * s)) }; }
function boxSize() { return [Math.min(330, innerWidth - 72), Math.min(260, innerHeight * 0.36)]; }

async function openTool(f, id) {
  try {
    toast("Opening…"); var cv = await getCanvas(f); toastEl.classList.remove("on");
    ({ crop: toolCrop, addbg: toolBG, compress: toolCompress, metadata: toolMeta, edit: toolEdit, annotate: toolAnnotate, redact: toolRedact })[id](f, cv);
  } catch (e) { toast(e.message || "Couldn't open that tool.", true); }
}
