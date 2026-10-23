/* Alt Wheel - js/app/files.js
   The desk: file records, decoding, icons, selection and saving. */
"use strict";

/* ================= files ================= */
function kindOf(ext) { return ext === "pdf" ? "pdf" : RASTER.indexOf(ext) >= 0 ? "image" : "doc"; }
function splitName(name) { var m = name.match(/^(.*?)(?:\.([^.]+))?$/); return { base: m[1] || "File", ext: (m[2] || "").toLowerCase() }; }
function uniq(base, ext) {
  var b = base, n = 1;
  while (files.some(function (f) { return f.base === b && f.ext === ext; })) { n++; b = base + " " + n; }
  return b;
}
async function decodeToCanvas(blob, ext) {
  var bmp;
  try { bmp = await createImageBitmap(blob); }
  catch (e) {
    if (/^(heic|heif)$/.test(ext)) {
      await loadScript(HEIC_URL);
      var out = await window.heic2any({ blob: blob, toType: "image/jpeg", quality: 0.95 });
      bmp = await createImageBitmap(Array.isArray(out) ? out[0] : out);
    } else throw new Error("This browser can't open ." + ext + " images.");
  }
  var sc = Math.min(1, Math.sqrt(MAXPX / (bmp.width * bmp.height))), cv = mkCanvas(bmp.width * sc, bmp.height * sc);
  cv.getContext("2d").drawImage(bmp, 0, 0, cv.width, cv.height); if (bmp.close) bmp.close();
  return cv;
}
async function loadPdfLib() {
  await loadScript(PDFJS_URL);
  try { await loadScript(PDFJS_WORKER); } catch (e) { }
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
}
async function getPdf(f) {
  if (!f.pdf) { await loadPdfLib(); f.pdf = await window.pdfjsLib.getDocument({ data: await f.blob.arrayBuffer() }).promise; }
  return f.pdf;
}
async function renderPdfPage(pdf, n, maxSide) {
  var page = await pdf.getPage(n), v0 = page.getViewport({ scale: 1 }), sc = Math.min(3, maxSide / Math.max(v0.width, v0.height)), vp = page.getViewport({ scale: sc });
  var cv = mkCanvas(vp.width, vp.height), x = cv.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, cv.width, cv.height);
  await page.render({ canvasContext: x, viewport: vp }).promise; return cv;
}
async function getCanvas(f) {
  if (f.canvas) return f.canvas;
  if (f.kind === "pdf") f.canvas = await renderPdfPage(await getPdf(f), 1, 2400);
  else if (f.kind === "image") f.canvas = await decodeToCanvas(f.blob, f.ext);
  else throw new Error("That file type can't be converted.");
  return f.canvas;
}
function thumbOf(cv) {
  var s = 150 / Math.max(cv.width, cv.height), t = mkCanvas(cv.width * s, cv.height * s), x = t.getContext("2d");
  x.fillStyle = "#fff"; x.fillRect(0, 0, t.width, t.height); x.drawImage(cv, 0, 0, t.width, t.height); return t.toDataURL("image/jpeg", 0.8);
}
function freeSpot(x, y) {
  var w = desk.clientWidth, h = desk.clientHeight, step = 112, tries = 0;
  function busy(px, py) { return files.some(function (f) { return Math.abs(f.x - px) < 100 && Math.abs(f.y - py) < 110; }); }
  while (tries++ < 400 && (busy(x, y) || x > w - 100)) { x += step; if (x > w - 100) { x = 24; y += 120; } }
  return [x, y];
}
function addRecord(o, near) {
  var f = { id: nextId++, base: o.base, ext: o.ext, blob: o.blob, kind: kindOf(o.ext), canvas: o.canvas || null, thumb: o.canvas ? thumbOf(o.canvas) : null, pdf: null, x: 0, y: 0 };
  f.base = uniq(f.base, f.ext);
  var pos = near ? freeSpot(near.x + 112, near.y) : freeSpot(24, 72);
  f.x = pos[0]; f.y = pos[1]; files.push(f); renderIcon(f); updateButtons(); return f;
}
async function addBlob(blob, name) {
  var p = splitName(name), kind = kindOf(p.ext);
  if (kind === "doc") throw new Error("Can't open ." + (p.ext || "that") + " files. Images and PDFs work.");
  var cv = null;
  if (kind === "image") cv = await decodeToCanvas(blob, p.ext);
  else {
    var tmp = { blob: blob, pdf: null }; var pdf = await getPdf(tmp); cv = await renderPdfPage(pdf, 1, 400);
    var f = addRecord({ base: p.base, ext: p.ext, blob: blob, canvas: cv }); f.pdf = pdf; f.canvas = null; f.pages = pdf.numPages; return f;
  }
  return addRecord({ base: p.base, ext: p.ext, blob: blob, canvas: cv });
}
function iconHTML(f) {
  return '<div class="doc">' + (f.thumb ? '<img alt="" draggable="false" src="' + f.thumb + '">' : '<span class="ext">' + esc(f.ext) + "</span>") + '</div>';
}
function renderIcon(f) {
  var d = document.createElement("div");
  d.className = "fi"; d.dataset.id = f.id; d.style.left = f.x + "px"; d.style.top = f.y + "px";
  d.innerHTML = iconHTML(f) + '<div class="nm">' + esc(midTrunc(f.base + "." + f.ext)) + "</div>";
  iconsEl.appendChild(d); f.el = d; return d;
}
function byId(id) { for (var i = 0; i < files.length; i++) if (files[i].id === +id) return files[i]; return null; }
function select(f) {
  selId = f ? f.id : null;
  files.forEach(function (x) { x.el.classList.toggle("sel", x.id === selId); });
  updateButtons();
}
function updateButtons() {
  $("#saveBtn").disabled = selId === null; $("#delBtn").disabled = selId === null; $("#zipBtn").disabled = files.length < 2;
}
function removeSel() {
  var f = byId(selId); if (!f) return;
  f.el.remove(); files = files.filter(function (x) { return x !== f; }); selId = null; updateButtons();
}
async function saveBlob(name, blob) {
  if (dl) {
    try { await dl.save({ filename: name, data: blob }); toast("Saved " + name); }
    catch (e) {
      var c = e && e.code;
      if (c === "declined") return;
      if (c === "rejected_extension") toast("This view can't save ." + name.split(".").pop() + " files. Open the standalone page to save them.", true);
      else toast("Couldn't save " + name + " here.", true);
    }
    return;
  }
  var a = document.createElement("a"), u = URL.createObjectURL(blob);
  a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function () { URL.revokeObjectURL(u); }, 5000); toast("Downloaded " + name);
}
function saveFile(f) { if (f) saveBlob(f.base + "." + f.ext, f.blob); }
