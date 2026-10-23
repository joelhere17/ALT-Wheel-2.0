/* Alt Wheel - js/app/convert.js
   Which formats a file can become, and the conversion itself. */
"use strict";

/* ================= converting ================= */
var IMG_OUT = ["png", "webp", "heic", "tiff", "avif", "bmp", "pdf", "docx", "jpg"];
function convertTargets(f) {
  if (f.kind === "pdf") return ["docx", "jpg", "png", "txt"];
  if (f.kind !== "image") return [];
  var own = f.ext === "jpeg" ? "jpg" : f.ext === "tif" ? "tiff" : f.ext === "heif" ? "heic" : f.ext;
  return IMG_OUT.filter(function (x) { return x !== own; });
}
async function pdfText(f) {
  var pdf = await getPdf(f), pages = [];
  for (var i = 1; i <= pdf.numPages; i++) {
    var tc = await (await pdf.getPage(i)).getTextContent(), s = "";
    tc.items.forEach(function (it) { s += it.str + (it.hasEOL ? "\n" : ""); });
    pages.push(s.replace(/[ \t]+\n/g, "\n").trim());
  }
  return pages;
}
async function encodeAs(f, id) {
  if (id === "txt") {
    var pages = await pdfText(f), txt = pages.join("\n\n");
    if (txt.replace(/\s/g, "").length < 3) throw new Error("This PDF has no selectable text (it may be a scan).");
    return { blob: new Blob([txt], { type: "text/plain" }), ext: "txt" };
  }
  if (id === "docx" && f.kind === "pdf") {
    var pg = await pdfText(f), has = pg.join("").replace(/\s/g, "").length > 20, blocks = [], pdf = await getPdf(f), i;
    if (has) {
      pg.forEach(function (t, k) { if (k) blocks.push({ t: "pb" }); t.split(/\n+/).forEach(function (line) { blocks.push({ t: "p", text: line }); }); });
    } else {
      for (i = 1; i <= Math.min(pdf.numPages, 30); i++) {
        var c = await renderPdfPage(pdf, i, 1800); if (i > 1) blocks.push({ t: "pb" });
        blocks.push({ t: "img", bytes: await u8(await tb(flat(c), "image/jpeg", 0.9)), w: c.width, h: c.height });
      }
    }
    return { blob: makeDOCX(blocks), ext: "docx" };
  }
  var cv = await getCanvas(f);
  if (id === "png") return { blob: await tb(cv, "image/png"), ext: "png", canvas: cv };
  if (id === "jpg") return { blob: await tb(flat(cv), "image/jpeg", 0.95), ext: "jpg", canvas: cv };
  if (id === "webp" || id === "avif") {
    var b = await tb(cv, MIME[id], 0.95);
    if (b.type !== MIME[id]) throw new Error("This browser can't create ." + id.toUpperCase() + " files. Try another browser.");
    return { blob: b, ext: id, canvas: cv };
  }
  if (id === "heic") throw new Error("HEIC can't be created in a web browser. Pick another format.");
  if (id === "bmp") return { blob: makeBMP(cv), ext: "bmp", canvas: cv };
  if (id === "tiff") return { blob: makeTIFF(cv), ext: "tiff", canvas: cv };
  if (id === "pdf") { var jb = await u8(await tb(flat(cv), "image/jpeg", 0.95)); return { blob: makePDF(jb, cv.width, cv.height), ext: "pdf", canvas: cv }; }
  if (id === "docx") { var jd = await u8(await tb(flat(cv), "image/jpeg", 0.95)); return { blob: makeDOCX([{ t: "img", bytes: jd, w: cv.width, h: cv.height }]), ext: "docx", canvas: cv }; }
  throw new Error("That format isn't available.");
}
var busy = false;
async function runConvert(f, id) {
  if (busy) return; busy = true; toast("Converting to " + id.toUpperCase() + "…");
  try {
    await sleep(40);
    var r = await encodeAs(f, id);
    select(addRecord({ base: f.base, ext: r.ext, blob: r.blob, canvas: r.canvas || null }, f));
    toast("Converted to " + r.ext.toUpperCase() + ". Double-click it to save.");
  } catch (e) { toast(e.message || "Conversion failed.", true); }
  busy = false;
}
function outExt(f) { return ["jpg", "jpeg", "png", "webp"].indexOf(f.ext) >= 0 ? f.ext : "png"; }
async function canvasBlob(cv, ext, q) { return ext === "png" ? tb(cv, "image/png") : tb(ext === "webp" ? cv : flat(cv), MIME[ext], q || 0.95); }
async function addResult(f, cv, suffix, ext, q) {
  var e = ext || outExt(f), blob = await canvasBlob(cv, e, q);
  select(addRecord({ base: f.base + " " + suffix, ext: e, blob: blob, canvas: cv }, f));
  toast(suffix + " saved to your desk. Double-click it to download.");
}
