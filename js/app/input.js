/* Alt Wheel - js/app/input.js
   Adding files by button, drag-and-drop from the OS, and Save all (zip). */
"use strict";

/* ================= adding files ================= */
async function ingest(list) {
  var arr = Array.prototype.slice.call(list);
  for (var i = 0; i < arr.length; i++) {
    try { toast("Adding " + arr[i].name + "…"); var f = await addBlob(arr[i], arr[i].name); select(f); toast("Added " + arr[i].name); }
    catch (e) { toast(e.message || "Couldn't add that file.", true); }
  }
}
$("#addBtn").addEventListener("click", function () { $("#picker").click(); });
$("#picker").addEventListener("change", function (e) { if (e.target.files.length) ingest(e.target.files); e.target.value = ""; });
$("#saveBtn").addEventListener("click", function () { saveFile(byId(selId)); });
$("#delBtn").addEventListener("click", removeSel);
$("#zipBtn").addEventListener("click", async function () {
  var ents = []; for (var i = 0; i < files.length; i++) ents.push({ name: files[i].base + "." + files[i].ext, data: await u8(files[i].blob) });
  saveBlob("Alt Wheel files.zip", zipStore(ents, "application/zip"));
});
var veil = $("#veil"), depth = 0;
function hasFiles(e) { return e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types || [], "Files") >= 0; }
window.addEventListener("dragenter", function (e) { if (hasFiles(e)) { depth++; veil.classList.add("on"); } });
window.addEventListener("dragleave", function (e) { if (hasFiles(e) && --depth <= 0) { depth = 0; veil.classList.remove("on"); } });
window.addEventListener("dragover", function (e) { if (hasFiles(e)) e.preventDefault(); });
window.addEventListener("drop", function (e) { if (!hasFiles(e)) return; e.preventDefault(); depth = 0; veil.classList.remove("on"); ingest(e.dataTransfer.files); });
window.addEventListener("paste", function (e) { var fs = e.clipboardData && e.clipboardData.files; if (fs && fs.length) ingest(fs); });
