/* Alt Wheel - js/core/config.js
   Constants, DOM handles, shared state and tiny helpers. */
"use strict";


var VERSION = "2.0.0";
var HEIC_URL = "https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js";
var PDFJS_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
var PDFJS_WORKER = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
var MAXPX = 24000000;

var $ = function (s, r) { return (r || document).querySelector(s); };
var desk = $("#desk"), iconsEl = $("#icons"), ghost = $("#ghost"), wl = $("#wl"), wheelEl = $("#wheel"), toastEl = $("#toast"), mroot = $("#mroot");
var files = [], nextId = 1, selId = null, dl = null, drag = null, wheel = null, toastT = null;

var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
var fmtBytes = function (n) { return n < 1024 ? n + " B" : n < 1048576 ? (n / 1024).toFixed(0) + " KB" : (n / 1048576).toFixed(1) + " MB"; };
var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
var RASTER = ["jpg", "jpeg", "png", "webp", "gif", "bmp", "avif", "tiff", "tif", "heic", "heif"];
var MIME = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", avif: "image/avif" };

function toast(msg, err) {
  toastEl.textContent = msg; toastEl.className = "toast on" + (err ? " err" : "");
  clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove("on"); }, err ? 5200 : 2600);
}
function midTrunc(s) { return s.length <= 30 ? s : s.slice(0, 24) + "..." + s.slice(-8); }
