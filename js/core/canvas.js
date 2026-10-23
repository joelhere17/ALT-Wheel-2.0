/* Alt Wheel - js/core/canvas.js
   Canvas helpers and lazy CDN script loading (pdf.js, heic2any). */
"use strict";

/* ================= canvas + encoding helpers ================= */
function mkCanvas(w, h) { var c = document.createElement("canvas"); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }
function tb(cv, type, q) {
  return new Promise(function (res, rej) { cv.toBlob(function (b) { b ? res(b) : rej(new Error("Couldn't encode that image.")); }, type, q); });
}
function flat(cv) {
  var f = mkCanvas(cv.width, cv.height), x = f.getContext("2d");
  x.fillStyle = "#fff"; x.fillRect(0, 0, f.width, f.height); x.drawImage(cv, 0, 0); return f;
}
function u8(blob) { return blob.arrayBuffer().then(function (b) { return new Uint8Array(b); }); }
var loaded = {};
function loadScript(url) {
  if (!loaded[url]) loaded[url] = new Promise(function (res, rej) {
    var s = document.createElement("script"); s.src = url; s.onload = res;
    s.onerror = function () { delete loaded[url]; rej(new Error("Couldn't load a helper library. Check your connection.")); };
    document.head.appendChild(s);
  });
  return loaded[url];
}

/* ---- BMP, TIFF, PDF, ZIP, DOCX writers (no libraries) ---- */
