# Architecture

Alt Wheel is a static site: HTML, CSS and plain JavaScript. There is no bundler. The scripts in `index.html` are classic scripts loaded in order and share one global scope, which keeps the app working when `index.html` is opened straight from disk.

## Folder map

```
index.html            Page markup and the ordered list of scripts
css/
  base.css            Tokens (colors, fonts), wallpaper, toolbar, file icons
  wheel.css           Drag ghost, wheel, mode switch, toast, drop veil
  modals.css          Tool windows and form controls
  responsive.css      Small screens, reduced motion
js/
  core/
    config.js         Constants, DOM handles, shared state, helpers
    canvas.js         Canvas helpers, lazy script loader (pdf.js, heic2any)
    encoders.js       BMP, TIFF, PDF, DOCX and ZIP writers (no dependencies)
    exif.js           Small EXIF reader
  app/
    files.js          File records, decoding, icons, selection, saving
    convert.js        Which targets a file has, and the conversion itself
    wheel.js          Wheel drawing, petals, hit-testing
    drag.js           Pointer drag, spawning the wheel, dropping
    input.js          Add-files button, OS drag-and-drop, Save all
  tools/
    modal.js          Shared window and control builders, openTool()
    crop.js  background.js  compress.js  metadata.js  edit.js  markup.js
  main.js             Starts the app
assets/               Favicon and README screenshots
tests/e2e.py          Playwright test that drives every conversion and tool
```

Script order matters: `core` first, then `app`, then `tools`, then `main.js`.

## How a drag works

1. `drag.js` listens for `pointerdown` on a file icon, then `pointermove` on the window.
2. After the pointer travels about 90 px, `showWheel()` (in `wheel.js`) opens the wheel centered on the pointer, clamped to the screen.
3. `pickAt()` turns the pointer position into a petal index using angle and distance from the wheel center.
4. On `pointerup`, a Convert petal calls `runConvert()` and a Tools petal calls `openTool()`.

## Add a convert format

1. Add the id to `IMG_OUT` (images) or the PDF branch in `convertTargets()` in `js/app/convert.js`.
2. Add a branch in `encodeAs()` in the same file that returns `{ blob, ext }`.
3. If it needs a hand-written encoder, put it in `js/core/encoders.js`.

## Add a tool

1. Create `js/tools/mytool.js` with a function `toolMyTool(f, cv)` that builds a window with `modal("My tool")`.
2. Add `<script src="js/tools/mytool.js"></script>` to `index.html` before `main.js`.
3. Register it in the `openTool()` map in `js/tools/modal.js`.
4. Add `["mytool", "MY TOOL"]` to `TOOLS` and a line icon to `ICONS` in `js/app/wheel.js`.

## External libraries

Loaded from a CDN only when needed: pdf.js (to open PDFs) and heic2any (to open HEIC photos). Everything else is in this repository.
