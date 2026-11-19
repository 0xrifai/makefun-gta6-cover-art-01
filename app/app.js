// Vice Cover Studio — editor wiring: state, panel controls, drag/zoom,
// sample scene, and PNG export. Photos are read with FileReader and kept
// in memory only; nothing is ever uploaded.
(function () {
  'use strict';

  var SIZES = {
    '1080x1080': [1080, 1080],
    '1080x1350': [1080, 1350],
    '1920x1080': [1920, 1080]
  };

  // Default crop offsets per panel count: the sample scene's portrait sits
  // dead centre, so the middle panel frames the face and the outer panels
  // show the sun (left) and the palms / skyline (right). The zoom for each
  // panel is computed by sampleCropScale, not fixed here.
  var SAMPLE_CROPS = {
    2: [{ dx: -0.18 }, { dx: 0.18 }],
    3: [{ dx: -0.30 }, { dx: 0 }, { dx: 0.30 }],
    4: [{ dx: -0.33 }, { dx: -0.11 }, { dx: 0.11 }, { dx: 0.33 }]
  };

  var state = {
    panels: 3,
    photos: [null, null, null, null],
    crops: [
      { scale: 1, dx: 0, dy: 0 },
      { scale: 1, dx: 0, dy: 0 },
      { scale: 1, dx: 0, dy: 0 },
      { scale: 1, dx: 0, dy: 0 }
    ],
    onePhoto: true,
    caption: 'VICE CITY',
    captionSize: 110,
    captionPos: 'bottom',
    grade: 'sunset',
    sizeKey: '1080x1080',
    selected: 0,
    sampleLoaded: false
  };

  var preview = document.getElementById('preview');
  var pctx = preview.getContext('2d');
  var statusEl = document.getElementById('status');

  function setStatus(msg) {
    statusEl.textContent = msg;
  }

  function currentSize() {
    return SIZES[state.sizeKey] || SIZES['1080x1080'];
  }

  // Redraw the preview canvas at a display resolution that keeps the
  // export aspect ratio (long side capped at 900 px for the screen).
  function renderPreview() {
    var size = currentSize();
    var W = size[0];
    var H = size[1];
    var scale = Math.min(1, 900 / Math.max(W, H));
    var dw = Math.max(2, Math.round(W * scale));
    var dh = Math.max(2, Math.round(H * scale));
    if (preview.width !== dw || preview.height !== dh) {
      preview.width = dw;
      preview.height = dh;
    }
    pctx.clearRect(0, 0, dw, dh);
    var view = {
      panels: state.panels,
      photos: state.photos.slice(0, state.panels),
      crops: state.crops.slice(0, state.panels),
      caption: state.caption,
      captionSize: state.captionSize,
      captionPos: state.captionPos,
      grade: state.grade
    };
    window.ViceCover.drawCover(pctx, view, dw, dh);
    // Highlight the selected panel.
    var rects = window.ViceCover.panelRects(dw, dh, state.panels);
    var r = rects[state.selected];
    if (r) {
      pctx.save();
      pctx.strokeStyle = '#2de2e6';
      pctx.lineWidth = 3;
      pctx.setLineDash([10, 6]);
      pctx.strokeRect(r.x, r.y, r.w, r.h);
      pctx.restore();
    }
  }

  function syncControlValues() {
    var crop = state.crops[state.selected];
    document.getElementById('rng-zoom').value = crop.scale;
    document.getElementById('rng-x').value = crop.dx;
    document.getElementById('rng-y').value = crop.dy;
    document.getElementById('inp-caption').value = state.caption;
    document.getElementById('rng-cap-size').value = state.captionSize;
    document.getElementById('sel-cap-pos').value = state.captionPos;
    document.getElementById('sel-grade').value = state.grade;
    document.getElementById('sel-panels').value = String(state.panels);
    document.getElementById('sel-size').value = state.sizeKey;
    document.getElementById('chk-one-photo').checked = state.onePhoto;
    var tabs = document.getElementById('panel-tabs');
    tabs.innerHTML = '';
    for (var i = 0; i < state.panels; i++) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = 'Panel ' + (i + 1) + (state.photos[i] ? ' ✓' : '');
      btn.setAttribute('aria-selected', i === state.selected ? 'true' : 'false');
      btn.dataset.panel = String(i);
      btn.addEventListener('click', function (ev) {
        selectPanel(Number(ev.currentTarget.dataset.panel));
      });
      tabs.appendChild(btn);
    }
  }

  function selectPanel(i) {
    state.selected = i;
    syncControlValues();
    renderPreview();
  }

  // Sample framing adapts to the export size: tall portrait panels show a
  // much narrower slice of the scene than wide ones, so the sample zoom is
  // picked to keep each panel's window near 30% of the scene width. The
  // zoom never drops below 1, which is cover-fit: below that the photo
  // would stop covering the panel and leave empty bands.
  function sampleCropScaleFor(W, H, panels) {
    var gap = Math.max(4, Math.round(W * 0.012));
    var pw = (W - gap * (panels + 1)) / panels;
    var ph = H - gap * 2;
    var aspect = ph / pw; // panel height / width
    var scale = (1 / aspect) * 0.625 / 0.30; // scene is 1600x1000
    return Math.max(1.0, Math.min(1.25, scale));
  }

  function sampleCropScale() {
    var size = currentSize();
    return sampleCropScaleFor(size[0], size[1], state.panels);
  }

  function applySampleCropsFor(W, H) {
    var offsets = SAMPLE_CROPS[state.panels] || SAMPLE_CROPS[3];
    var scale = sampleCropScaleFor(W, H, state.panels);
    for (var i = 0; i < 4; i++) {
      state.crops[i] = {
        scale: scale,
        dx: (offsets[i] || { dx: 0 }).dx,
        dy: 0
      };
    }
  }

  function applySampleCrops() {
    var size = currentSize();
    applySampleCropsFor(size[0], size[1]);
  }

  function loadSample() {
    var scene = window.ViceSample.buildSampleImage(1600, 1000);
    for (var i = 0; i < 4; i++) state.photos[i] = scene;
    applySampleCrops();
    state.onePhoto = true;
    state.sampleLoaded = true;
    syncControlValues();
    renderPreview();
    setStatus('Sample scene loaded — one sunset portrait spread across ' + state.panels + ' panels. Edit the caption, then export.');
  }

  function applyPhotoToPanels(img) {
    state.sampleLoaded = false;
    if (state.onePhoto) {
      for (var i = 0; i < 4; i++) {
        state.photos[i] = img;
        state.crops[i] = { scale: 1, dx: 0, dy: 0 };
      }
    } else {
      state.photos[state.selected] = img;
      state.crops[state.selected] = { scale: 1, dx: 0, dy: 0 };
    }
    syncControlValues();
    renderPreview();
    setStatus('Photo loaded' + (state.onePhoto ? ' into every panel.' : ' into panel ' + (state.selected + 1) + '.'));
  }

  function readPhotoFile(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () { applyPhotoToPanels(img); };
      img.onerror = function () { setStatus('Could not read that image file. Try a JPG or PNG.'); };
      img.src = String(reader.result);
    };
    reader.onerror = function () { setStatus('Could not read that file.'); };
    reader.readAsDataURL(file);
  }

  // Render the cover at full export size and return a PNG data URL.
  // When the sample scene is loaded, the crops are re-framed for the
  // exported aspect first (a portrait export frames the same face the
  // wide one does), then restored so the editor is untouched.
  function exportPNG(width, height) {
    var savedCrops = null;
    if (state.sampleLoaded) {
      savedCrops = state.crops.map(function (c) {
        return { scale: c.scale, dx: c.dx, dy: c.dy };
      });
      applySampleCropsFor(width, height);
    }
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext('2d');
    var view = {
      panels: state.panels,
      photos: state.photos.slice(0, state.panels),
      crops: state.crops.slice(0, state.panels),
      caption: state.caption,
      captionSize: state.captionSize,
      captionPos: state.captionPos,
      grade: state.grade
    };
    window.ViceCover.drawCover(ctx, view, width, height);
    if (savedCrops) state.crops = savedCrops;
    return canvas.toDataURL('image/png');
  }

  function downloadExport() {
    var size = currentSize();
    var url = exportPNG(size[0], size[1]);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'vice-cover-' + size[0] + 'x' + size[1] + '.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setStatus('Exported ' + size[0] + ' × ' + size[1] + ' PNG — check your downloads.');
  }

  // --- Controls -----------------------------------------------------------

  document.getElementById('sel-panels').addEventListener('change', function (ev) {
    state.panels = Number(ev.target.value);
    if (state.selected >= state.panels) state.selected = state.panels - 1;
    if (state.sampleLoaded) applySampleCrops();
    syncControlValues();
    renderPreview();
  });

  document.getElementById('sel-size').addEventListener('change', function (ev) {
    state.sizeKey = ev.target.value;
    if (state.sampleLoaded) applySampleCrops();
    renderPreview();
  });

  document.getElementById('sel-grade').addEventListener('change', function (ev) {
    state.grade = ev.target.value;
    renderPreview();
  });

  document.getElementById('chk-one-photo').addEventListener('change', function (ev) {
    state.onePhoto = ev.target.checked;
  });

  document.getElementById('file-photo').addEventListener('change', function (ev) {
    readPhotoFile(ev.target.files && ev.target.files[0]);
    ev.target.value = '';
  });

  document.getElementById('btn-clear-photo').addEventListener('click', function () {
    state.sampleLoaded = false;
    if (state.onePhoto) {
      for (var i = 0; i < 4; i++) state.photos[i] = null;
    } else {
      state.photos[state.selected] = null;
    }
    syncControlValues();
    renderPreview();
    setStatus('Photo cleared.');
  });

  document.getElementById('rng-zoom').addEventListener('input', function (ev) {
    state.crops[state.selected].scale = Number(ev.target.value);
    renderPreview();
  });

  document.getElementById('rng-x').addEventListener('input', function (ev) {
    state.crops[state.selected].dx = Number(ev.target.value);
    renderPreview();
  });

  document.getElementById('rng-y').addEventListener('input', function (ev) {
    state.crops[state.selected].dy = Number(ev.target.value);
    renderPreview();
  });

  document.getElementById('inp-caption').addEventListener('input', function (ev) {
    state.caption = ev.target.value;
    renderPreview();
  });

  document.getElementById('rng-cap-size').addEventListener('input', function (ev) {
    state.captionSize = Number(ev.target.value);
    renderPreview();
  });

  document.getElementById('sel-cap-pos').addEventListener('change', function (ev) {
    state.captionPos = ev.target.value;
    renderPreview();
  });

  document.getElementById('btn-sample').addEventListener('click', loadSample);
  document.getElementById('btn-export').addEventListener('click', downloadExport);

  // --- Direct canvas interaction: click selects a panel, drag pans the
  // photo inside it, wheel zooms it. --------------------------------------

  var drag = null;

  function panelAt(clientX, clientY) {
    var box = preview.getBoundingClientRect();
    var x = (clientX - box.left) * (preview.width / box.width);
    var y = (clientY - box.top) * (preview.height / box.height);
    var rects = window.ViceCover.panelRects(preview.width, preview.height, state.panels);
    for (var i = 0; i < rects.length; i++) {
      var r = rects[i];
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return i;
    }
    return -1;
  }

  preview.addEventListener('pointerdown', function (ev) {
    var i = panelAt(ev.clientX, ev.clientY);
    if (i < 0) return;
    selectPanel(i);
    drag = { x: ev.clientX, y: ev.clientY, panel: i };
    preview.setPointerCapture(ev.pointerId);
  });

  preview.addEventListener('pointermove', function (ev) {
    if (!drag) return;
    var box = preview.getBoundingClientRect();
    var crop = state.crops[drag.panel];
    crop.dx += (ev.clientX - drag.x) / box.width;
    crop.dy += (ev.clientY - drag.y) / box.height;
    crop.dx = Math.max(-0.5, Math.min(0.5, crop.dx));
    crop.dy = Math.max(-0.5, Math.min(0.5, crop.dy));
    drag.x = ev.clientX;
    drag.y = ev.clientY;
    syncControlValues();
    renderPreview();
  });

  preview.addEventListener('pointerup', function () { drag = null; });
  preview.addEventListener('pointercancel', function () { drag = null; });

  preview.addEventListener('wheel', function (ev) {
    ev.preventDefault();
    var crop = state.crops[state.selected];
    var factor = ev.deltaY < 0 ? 1.08 : 1 / 1.08;
    crop.scale = Math.max(0.6, Math.min(3, crop.scale * factor));
    syncControlValues();
    renderPreview();
  }, { passive: false });

  // --- Automation hooks (used by the maker's own headless checks) --------
  window.coverApp = {
    state: state,
    loadSample: loadSample,
    exportPNG: exportPNG,
    renderPreview: renderPreview,
    selectPanel: selectPanel,
    setCaption: function (t) { state.caption = t; syncControlValues(); renderPreview(); },
    setGrade: function (g) { state.grade = g; syncControlValues(); renderPreview(); },
    setPanels: function (n) { state.panels = n; syncControlValues(); renderPreview(); }
  };

  // Deep link for demos and screenshots: ?sample=1 loads the sample scene.
  syncControlValues();
  renderPreview();
  if (new URLSearchParams(window.location.search).get('sample') === '1') {
    loadSample();
  }
})();
