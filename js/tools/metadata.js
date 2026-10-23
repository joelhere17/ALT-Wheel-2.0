/* Alt Wheel - js/tools/metadata.js
   Metadata tool (view and strip EXIF). */
"use strict";

/* ---- Metadata ---- */
async function toolMeta(f, cv) {
  var M = modal("Metadata"), rows = [["Name", f.base + "." + f.ext], ["Type", f.ext.toUpperCase()], ["Size", fmtBytes(f.blob.size)], ["Dimensions", cv.width + " × " + cv.height + " px"]], ex = null;
  if (/^jpe?g$/.test(f.ext)) ex = readExif(await f.blob.arrayBuffer());
  if (ex) rows = rows.concat(ex.rows);
  M.body.innerHTML = '<dl class="kv">' + rows.map(function (r) { return "<dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd>"; }).join("") + "</dl>" +
    (ex && ex.gps ? '<div class="warn">This photo contains location data (GPS).</div>' : "") +
    '<div class="note">' + (ex ? "Camera details were found in this file." : "No camera details were found in this file.") + ' A clean copy is re-saved from the pixels only, so every hidden tag is removed.</div>' +
    '<div class="foot"><button class="btn2" id="cl" type="button">Close</button><button class="redbtn" id="apply" type="button">Save clean copy</button></div>';
  $("#cl", M.body).addEventListener("click", closeModal);
  $("#apply", M.body).addEventListener("click", async function () { closeModal(); try { await addResult(f, cv, "Clean"); } catch (e) { toast(e.message, true); } });
}
