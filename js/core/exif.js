/* Alt Wheel - js/core/exif.js
   Minimal EXIF reader used by the Metadata tool. */
"use strict";

function readExif(buf) {
  try {
    var dv = new DataView(buf); if (dv.getUint16(0) !== 0xFFD8) return null;
    var p = 2;
    while (p < dv.byteLength - 4) {
      var m = dv.getUint16(p), len = dv.getUint16(p + 2);
      if (m === 0xFFE1 && dv.getUint32(p + 4) === 0x45786966) return parseTiff(dv, p + 10);
      if ((m & 0xFF00) !== 0xFF00) break; p += 2 + len;
    }
  } catch (e) { }
  return null;
}
function parseTiff(dv, base) {
  var le = dv.getUint16(base) === 0x4949, out = { rows: [], gps: false };
  var g16 = function (o) { return dv.getUint16(base + o, le); }, g32 = function (o) { return dv.getUint32(base + o, le); };
  var names = { 0x010F: "Make", 0x0110: "Camera", 0x0131: "Software", 0x0132: "Modified", 0x9003: "Taken", 0x829A: "Exposure", 0x829D: "Aperture", 0x8827: "ISO", 0x920A: "Focal length", 0x0112: "Orientation" };
  function ascii(o, c) { var s = ""; for (var i = 0; i < c - 1; i++) { var ch = dv.getUint8(base + o + i); if (!ch) break; s += String.fromCharCode(ch); } return s.trim(); }
  function ifd(off, depth) {
    var n = g16(off);
    for (var i = 0; i < n; i++) {
      var e = off + 2 + i * 12, tag = g16(e), type = g16(e + 2), cnt = g32(e + 4), v;
      if (tag === 0x8769 && depth < 2) { ifd(g32(e + 8), depth + 1); continue; }
      if (tag === 0x8825) { out.gps = true; continue; }
      if (!names[tag]) continue;
      if (type === 2) v = ascii(cnt <= 4 ? e + 8 : g32(e + 8), cnt);
      else if (type === 3) v = g16(e + 8);
      else if (type === 4) v = g32(e + 8);
      else if (type === 5) { var o = g32(e + 8), a = g32(o), b = g32(o + 4); v = b ? a / b : 0;
        if (tag === 0x829A) v = v && v < 1 ? "1/" + Math.round(1 / v) + " s" : v + " s"; else if (tag === 0x829D) v = "f/" + v.toFixed(1); else if (tag === 0x920A) v = v.toFixed(1) + " mm"; }
      if (v !== undefined && v !== "") out.rows.push([names[tag], v]);
    }
  }
  ifd(g32(4), 0); return out;
}
