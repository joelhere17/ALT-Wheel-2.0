/* Alt Wheel - js/core/encoders.js
   Hand-written encoders: BMP, TIFF, PDF, DOCX and ZIP (no dependencies). */
"use strict";

function makeBMP(cv) {
  var f = flat(cv), w = f.width, h = f.height, d = f.getContext("2d").getImageData(0, 0, w, h).data;
  var row = Math.ceil(w * 3 / 4) * 4, size = 54 + row * h, buf = new ArrayBuffer(size), dv = new DataView(buf), u = new Uint8Array(buf);
  dv.setUint8(0, 66); dv.setUint8(1, 77); dv.setUint32(2, size, true); dv.setUint32(10, 54, true);
  dv.setUint32(14, 40, true); dv.setInt32(18, w, true); dv.setInt32(22, h, true); dv.setUint16(26, 1, true); dv.setUint16(28, 24, true);
  dv.setUint32(34, row * h, true); dv.setUint32(38, 2835, true); dv.setUint32(42, 2835, true);
  for (var y = 0; y < h; y++) {
    var o = 54 + (h - 1 - y) * row, s = y * w * 4;
    for (var x = 0; x < w; x++, o += 3, s += 4) { u[o] = d[s + 2]; u[o + 1] = d[s + 1]; u[o + 2] = d[s]; }
  }
  return new Blob([buf], { type: "image/bmp" });
}
function makeTIFF(cv) {
  var f = flat(cv), w = f.width, h = f.height, d = f.getContext("2d").getImageData(0, 0, w, h).data;
  var data = w * h * 3, off = 180, buf = new ArrayBuffer(off + data), dv = new DataView(buf), u = new Uint8Array(buf);
  dv.setUint16(0, 0x4949); dv.setUint16(0, 0x4949, false); dv.setUint16(2, 42, true); dv.setUint32(4, 8, true);
  dv.setUint16(8, 12, true);
  var tags = [[256, 4, 1, w], [257, 4, 1, h], [258, 3, 3, 158], [259, 3, 1, 1], [262, 3, 1, 2], [273, 4, 1, off], [277, 3, 1, 3],
    [278, 4, 1, h], [279, 4, 1, data], [282, 5, 1, 164], [283, 5, 1, 172], [296, 3, 1, 2]];
  tags.forEach(function (t, i) {
    var e = 10 + i * 12; dv.setUint16(e, t[0], true); dv.setUint16(e + 2, t[1], true); dv.setUint32(e + 4, t[2], true);
    if (t[1] === 3 && t[2] === 1) dv.setUint16(e + 8, t[3], true); else dv.setUint32(e + 8, t[3], true);
  });
  dv.setUint32(154, 0, true);
  dv.setUint16(158, 8, true); dv.setUint16(160, 8, true); dv.setUint16(162, 8, true);
  dv.setUint32(164, 72, true); dv.setUint32(168, 1, true); dv.setUint32(172, 72, true); dv.setUint32(176, 1, true);
  var o = off;
  for (var s = 0, n = w * h; s < n * 4; s += 4) { u[o++] = d[s]; u[o++] = d[s + 1]; u[o++] = d[s + 2]; }
  return new Blob([buf], { type: "image/tiff" });
}
function makePDF(jpg, w, h) {
  var enc = new TextEncoder(), parts = [], len = 0, offs = [];
  function push(x) { var u = typeof x === "string" ? enc.encode(x) : x; parts.push(u); len += u.length; }
  var pw = (w * 0.75).toFixed(2), ph = (h * 0.75).toFixed(2);
  var content = "q " + pw + " 0 0 " + ph + " 0 0 cm /Im0 Do Q";
  push("%PDF-1.4\n");
  function obj(n, pieces) { offs[n] = len; push(n + " 0 obj\n"); pieces.forEach(push); push("\nendobj\n"); }
  obj(1, ["<< /Type /Catalog /Pages 2 0 R >>"]);
  obj(2, ["<< /Type /Pages /Kids [3 0 R] /Count 1 >>"]);
  obj(3, ["<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + pw + " " + ph + "] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>"]);
  obj(4, ["<< /Type /XObject /Subtype /Image /Width " + w + " /Height " + h + " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + jpg.length + " >>\nstream\n", jpg, "\nendstream"]);
  obj(5, ["<< /Length " + content.length + " >>\nstream\n" + content + "\nendstream"]);
  var xref = len; push("xref\n0 6\n0000000000 65535 f \n");
  for (var i = 1; i <= 5; i++) push(("0000000000" + offs[i]).slice(-10) + " 00000 n \n");
  push("trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n" + xref + "\n%%EOF\n");
  return new Blob(parts, { type: "application/pdf" });
}
var CRCT = (function () { var t = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(u) { var c = 0xFFFFFFFF; for (var i = 0; i < u.length; i++) c = CRCT[(c ^ u[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function zipStore(entries, type) {
  var enc = new TextEncoder(), chunks = [], central = [], off = 0, i;
  entries.forEach(function (e) {
    var nm = enc.encode(e.name), crc = crc32(e.data), sz = e.data.length;
    var lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(12, 0x21, true);
    lh.setUint32(14, crc, true); lh.setUint32(18, sz, true); lh.setUint32(22, sz, true); lh.setUint16(26, nm.length, true);
    chunks.push(new Uint8Array(lh.buffer), nm, e.data);
    var ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(14, 0x21, true);
    ch.setUint32(16, crc, true); ch.setUint32(20, sz, true); ch.setUint32(24, sz, true); ch.setUint16(28, nm.length, true); ch.setUint32(42, off, true);
    central.push(new Uint8Array(ch.buffer), nm);
    off += 30 + nm.length + sz;
  });
  var cdSize = 0; central.forEach(function (c) { cdSize += c.length; });
  var end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, entries.length, true); end.setUint16(10, entries.length, true);
  end.setUint32(12, cdSize, true); end.setUint32(16, off, true);
  return new Blob(chunks.concat(central, [new Uint8Array(end.buffer)]), { type: type });
}
function xmlText(s) { return String(s).replace(/[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD]/g, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function makeDOCX(blocks) {
  var body = "", rels = "", media = [], n = 0, enc = new TextEncoder();
  blocks.forEach(function (b) {
    if (b.t === "p") body += '<w:p><w:r><w:t xml:space="preserve">' + xmlText(b.text) + "</w:t></w:r></w:p>";
    else if (b.t === "pb") body += '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
    else {
      n++;
      var ar = b.w / b.h, cx = 6400800, cy = Math.round(cx / ar);
      if (cy > 8686800) { cy = 8686800; cx = Math.round(cy * ar); }
      media.push({ name: "word/media/image" + n + ".jpg", data: b.bytes });
      rels += '<Relationship Id="rId' + n + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image' + n + '.jpg"/>';
      body += '<w:p><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="' + cx + '" cy="' + cy + '"/><wp:docPr id="' + n + '" name="Picture ' + n + '"/>' +
        '<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="' + n + '" name="image' + n + '.jpg"/><pic:cNvPicPr/></pic:nvPicPr>' +
        '<pic:blipFill><a:blip r:embed="rId' + n + '"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + cx + '" cy="' + cy + '"/></a:xfrm>' +
        '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>';
    }
  });
  var doc = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>' +
    body + '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr></w:body></w:document>';
  var entries = [
    { name: "[Content_Types].xml", data: enc.encode('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="jpg" ContentType="image/jpeg"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>') },
    { name: "_rels/.rels", data: enc.encode('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>') },
    { name: "word/document.xml", data: enc.encode(doc) },
    { name: "word/_rels/document.xml.rels", data: enc.encode('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + rels + "</Relationships>") }
  ].concat(media);
  return zipStore(entries, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
}

/* ---- tiny EXIF reader (JPEG) ---- */
