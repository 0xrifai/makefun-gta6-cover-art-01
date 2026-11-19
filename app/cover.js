// Cover renderer: draws the multi-panel GTA-style cover onto any canvas.
// Pure canvas drawing — gradients, vignette, panel gaps and bold lettering
// are all drawn here, with no external assets.
(function () {
  'use strict';

  var GRADES = {
    sunset: {
      top: 'rgba(255, 122, 40, 0.16)',
      bottom: 'rgba(181, 55, 242, 0.30)',
      blend: 'overlay',
      warm: 0.10
    },
    neon: {
      top: 'rgba(45, 226, 230, 0.22)',
      bottom: 'rgba(255, 46, 164, 0.30)',
      blend: 'overlay',
      warm: 0.0
    },
    dusk: {
      top: 'rgba(122, 92, 255, 0.20)',
      bottom: 'rgba(26, 11, 46, 0.34)',
      blend: 'soft-light',
      warm: 0.04
    }
  };

  // Panel rectangles for a cover of W x H split into n vertical panels
  // with thin gaps that let the sunset background show through.
  function panelRects(W, H, n) {
    var gap = Math.max(4, Math.round(W * 0.012));
    var totalGap = gap * (n + 1);
    var pw = (W - totalGap) / n;
    var rects = [];
    for (var i = 0; i < n; i++) {
      rects.push({ x: gap + i * (pw + gap), y: gap, w: pw, h: H - gap * 2 });
    }
    return rects;
  }

  // Draw one photo (or canvas) cover-fit into a panel rect, honouring the
  // panel's crop: scale multiplies the cover-fit size, dx/dy shift it by a
  // fraction of the panel size.
  function drawPhotoInto(ctx, img, rect, crop) {
    var iw = img.naturalWidth || img.width;
    var ih = img.naturalHeight || img.height;
    if (!iw || !ih) return;
    var base = Math.max(rect.w / iw, rect.h / ih);
    var scale = base * (crop.scale || 1);
    var dw = iw * scale;
    var dh = ih * scale;
    var x = rect.x + (rect.w - dw) / 2 + (crop.dx || 0) * rect.w;
    var y = rect.y + (rect.h - dh) / 2 + (crop.dy || 0) * rect.h;
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    ctx.drawImage(img, x, y, dw, dh);
    ctx.restore();
  }

  // Sunset / neon colour grade + vignette, drawn over one panel.
  function applyGrade(ctx, rect, gradeName) {
    var g = GRADES[gradeName] || GRADES.sunset;
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    var grad = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    grad.addColorStop(0, g.top);
    grad.addColorStop(1, g.bottom);
    ctx.globalCompositeOperation = g.blend;
    ctx.fillStyle = grad;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.globalCompositeOperation = 'source-over';
    if (g.warm > 0) {
      ctx.fillStyle = 'rgba(255, 140, 60, ' + g.warm + ')';
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    }
    // Vignette: darkened corners so the panels read like poster art.
    var vig = ctx.createRadialGradient(
      rect.x + rect.w / 2, rect.y + rect.h / 2, Math.min(rect.w, rect.h) * 0.35,
      rect.x + rect.w / 2, rect.y + rect.h / 2, Math.max(rect.w, rect.h) * 0.75
    );
    vig.addColorStop(0, 'rgba(10, 4, 20, 0)');
    vig.addColorStop(1, 'rgba(10, 4, 20, 0.38)');
    ctx.fillStyle = vig;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    // Thin inner frame on each panel.
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = Math.max(2, rect.w * 0.006);
    ctx.strokeRect(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2);
    ctx.restore();
  }

  function emptyPanel(ctx, rect, i) {
    var grad = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    grad.addColorStop(0, '#3d2560');
    grad.addColorStop(1, '#1a0b2e');
    ctx.fillStyle = grad;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = 'rgba(245, 238, 252, 0.55)';
    ctx.font = '700 ' + Math.round(rect.w * 0.09) + 'px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PANEL ' + (i + 1), rect.x + rect.w / 2, rect.y + rect.h / 2 - 10);
    ctx.font = '400 ' + Math.round(rect.w * 0.055) + 'px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(245, 238, 252, 0.35)';
    ctx.fillText('add a photo', rect.x + rect.w / 2, rect.y + rect.h / 2 + 22);
  }

  // Bold poster caption with a heavy outline and a small kicker line.
  function drawCaption(ctx, W, H, text, sizePx, position) {
    if (!text) return;
    var size = sizePx * (H / 1080);
    var margin = H * 0.055;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    var kickerSize = Math.round(size * 0.24);
    var kicker = '★ VICE CITY ★';
    var cx = W / 2;
    var cy = position === 'top' ? margin + size * 0.9 : H - margin;
    ctx.translate(cx, cy);
    ctx.rotate(-0.045); // slight poster tilt
    ctx.translate(-cx, -cy);
    // Kicker above (or below, when the caption sits at the top).
    ctx.font = '800 ' + kickerSize + 'px "Arial Black", Impact, sans-serif';
    try { ctx.letterSpacing = Math.round(kickerSize * 0.35) + 'px'; } catch (e) { /* older canvas */ }
    ctx.fillStyle = '#ffd166';
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = size * 0.08;
    ctx.shadowOffsetY = size * 0.03;
    var kickerY = position === 'top' ? cy + size * 0.55 : cy - size * 1.05;
    ctx.fillText(kicker, cx, kickerY);
    // Main caption.
    ctx.font = '900 ' + Math.round(size) + 'px "Arial Black", Impact, sans-serif';
    try { ctx.letterSpacing = Math.round(size * 0.02) + 'px'; } catch (e) { /* older canvas */ }
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1a0b2e';
    ctx.lineWidth = size * 0.16;
    ctx.fillStyle = '#ffffff';
    ctx.strokeText(text.toUpperCase(), cx, cy);
    ctx.fillText(text.toUpperCase(), cx, cy);
    ctx.restore();
  }

  // Main entry: render the whole cover for the given state onto ctx at W x H.
  // state: { panels, photos[], crops[], caption, captionSize, captionPos, grade }
  function drawCover(ctx, state, W, H) {
    // Sunset backdrop: shows through the panel gaps and the outer frame.
    var bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#2b1055');
    bg.addColorStop(0.5, '#ff5e62');
    bg.addColorStop(1, '#ffb347');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    var rects = panelRects(W, H, state.panels);
    for (var i = 0; i < rects.length; i++) {
      var photo = state.photos[i];
      if (photo) {
        drawPhotoInto(ctx, photo, rects[i], state.crops[i] || { scale: 1, dx: 0, dy: 0 });
      } else {
        emptyPanel(ctx, rects[i], i);
      }
      applyGrade(ctx, rects[i], state.grade);
    }

    // Outer white frame, poster style.
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = Math.max(3, W * 0.004);
    ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, W - ctx.lineWidth, H - ctx.lineWidth);

    drawCaption(ctx, W, H, state.caption, state.captionSize, state.captionPos);
  }

  window.ViceCover = {
    drawCover: drawCover,
    panelRects: panelRects,
    grades: Object.keys(GRADES)
  };
})();
