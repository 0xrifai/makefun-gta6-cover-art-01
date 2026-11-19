// Procedural sample scene: a fully canvas-drawn Vice City sunset portrait.
// No photo, no external asset — every pixel is drawn by this file so the app
// can be demoed and screenshotted without any real person's picture.
(function () {
  'use strict';

  // Deterministic pseudo-random generator so the sample looks the same
  // on every load and every export.
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function drawPalm(ctx, x, baseY, height, lean, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = Math.max(6, height * 0.045);
    ctx.lineCap = 'round';
    // Curved trunk.
    ctx.beginPath();
    ctx.moveTo(x, baseY);
    ctx.quadraticCurveTo(x + lean * 0.4, baseY - height * 0.6, x + lean, baseY - height);
    ctx.stroke();
    const topX = x + lean;
    const topY = baseY - height;
    // Seven drooping fronds.
    for (let i = 0; i < 7; i++) {
      const ang = Math.PI * (0.08 + (i / 6) * 0.84);
      const len = height * (0.42 + (i % 2) * 0.08);
      const ex = topX + Math.cos(ang) * len;
      const ey = topY + Math.sin(ang) * len * 0.55 + height * 0.10;
      ctx.lineWidth = Math.max(4, height * 0.022);
      ctx.beginPath();
      ctx.moveTo(topX, topY);
      ctx.quadraticCurveTo(topX + Math.cos(ang) * len * 0.5, topY - height * 0.06, ex, ey);
      ctx.stroke();
    }
    // Coconuts.
    ctx.beginPath();
    ctx.arc(topX - 8, topY + 10, 7, 0, Math.PI * 2);
    ctx.arc(topX + 9, topY + 12, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawSkyline(ctx, rand, w, h, horizonY, color, minH, maxH) {
    ctx.fillStyle = color;
    let x = 0;
    while (x < w) {
      const bw = 40 + rand() * 90;
      const bh = minH + rand() * (maxH - minH);
      ctx.fillRect(x, horizonY - bh, bw, bh);
      // Rooftop antenna on some towers.
      if (rand() > 0.6) {
        ctx.fillRect(x + bw / 2 - 2, horizonY - bh - 26, 4, 26);
        ctx.beginPath();
        ctx.arc(x + bw / 2, horizonY - bh - 30, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      // Lit windows.
      ctx.save();
      ctx.fillStyle = 'rgba(255, 209, 102, 0.85)';
      const cols = Math.floor(bw / 18);
      const rows = Math.floor(bh / 24);
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          if (rand() > 0.55) ctx.fillRect(x + 6 + c * 18, horizonY - bh + 8 + r * 24, 7, 9);
        }
      }
      ctx.restore();
      ctx.fillStyle = color;
      x += bw + 4 + rand() * 22;
    }
  }

  function drawRetroSun(ctx, cx, cy, r) {
    const grad = ctx.createLinearGradient(0, cy - r, 0, cy + r);
    grad.addColorStop(0, '#ffe29a');
    grad.addColorStop(0.55, '#ffb347');
    grad.addColorStop(1, '#ff5e62');
    ctx.save();
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    // Horizontal slits across the lower half, clipped to the disc so no
    // bar ever leaks into the sky beside the sun.
    ctx.clip();
    const sky = ctx.createLinearGradient(0, cy - r, 0, cy + r);
    sky.addColorStop(0, '#7b2d8b');
    sky.addColorStop(1, '#ff8c5a');
    ctx.fillStyle = sky;
    let y = cy + r * 0.05;
    let gap = 5;
    while (y < cy + r) {
      ctx.fillRect(cx - r - 2, y, r * 2 + 4, gap);
      y += gap + 16;
      gap += 3;
    }
    ctx.restore();
  }

  function drawPerson(ctx, cx, baseY, scale) {
    const s = scale;
    ctx.save();
    ctx.translate(cx, baseY);
    ctx.scale(s, s);
    const skin = '#241533'; // stylised silhouette, not a skin tone
    const rim = '#ff9a3d';
    // Shoulders / jacket.
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.moveTo(-190, 60);
    ctx.quadraticCurveTo(-180, -70, -95, -95);
    ctx.lineTo(95, -95);
    ctx.quadraticCurveTo(180, -70, 190, 60);
    ctx.closePath();
    ctx.fill();
    // Jacket collar + open shirt V.
    ctx.fillStyle = '#12081f';
    ctx.beginPath();
    ctx.moveTo(-52, -92);
    ctx.lineTo(0, -18);
    ctx.lineTo(52, -92);
    ctx.lineTo(30, -95);
    ctx.lineTo(0, -48);
    ctx.lineTo(-30, -95);
    ctx.closePath();
    ctx.fill();
    // Gold chain.
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(0, -88, 62, Math.PI * 0.18, Math.PI * 0.82);
    ctx.stroke();
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(0, -28, 9, 0, Math.PI * 2);
    ctx.fill();
    // Neck.
    ctx.fillStyle = skin;
    ctx.fillRect(-34, -160, 68, 75);
    // Head.
    ctx.beginPath();
    ctx.arc(0, -218, 92, 0, Math.PI * 2);
    ctx.fill();
    // Hair: swept pompadour sitting on top of the head.
    ctx.fillStyle = '#12081f';
    ctx.beginPath();
    ctx.moveTo(-92, -228);
    ctx.quadraticCurveTo(-96, -318, -10, -322);
    ctx.quadraticCurveTo(84, -322, 90, -238);
    ctx.quadraticCurveTo(60, -286, 10, -282);
    ctx.quadraticCurveTo(-52, -280, -92, -228);
    ctx.closePath();
    ctx.fill();
    // Sunglasses.
    ctx.fillStyle = '#0a0512';
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 4;
    roundRect(ctx, -78, -240, 66, 34, 12);
    ctx.fill(); ctx.stroke();
    roundRect(ctx, 12, -240, 66, 34, 12);
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-12, -226);
    ctx.lineTo(12, -226);
    ctx.stroke();
    // Lens shine.
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-66, -214);
    ctx.lineTo(-44, -232);
    ctx.moveTo(24, -214);
    ctx.lineTo(46, -232);
    ctx.stroke();
    // Smile.
    ctx.strokeStyle = '#ffb347';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, -178, 26, Math.PI * 0.2, Math.PI * 0.8);
    ctx.stroke();
    // Warm rim light on the sun side: a short arc hugging the head's edge.
    ctx.strokeStyle = rim;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, -218, 92, -Math.PI * 0.35, Math.PI * 0.15);
    ctx.stroke();
    ctx.restore();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // Draws the sample scene into ctx at size W x H. Deterministic.
  function drawSampleScene(ctx, W, H) {
    const rand = mulberry32(1337);
    // Sunset sky.
    const sky = ctx.createLinearGradient(0, 0, 0, H * 0.72);
    sky.addColorStop(0, '#1a0b2e');
    sky.addColorStop(0.38, '#7b2d8b');
    sky.addColorStop(0.68, '#ff5e62');
    sky.addColorStop(1, '#ffb347');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    // Retro sun, left of centre so the middle panel stays the portrait.
    drawRetroSun(ctx, W * 0.28, H * 0.34, H * 0.19);
    // Far skyline, then near skyline.
    const horizon = H * 0.72;
    drawSkyline(ctx, rand, W, H, horizon, '#4a1e63', H * 0.08, H * 0.20);
    drawSkyline(ctx, rand, W, H, horizon, '#1a0b2e', H * 0.12, H * 0.30);
    // Ground / street.
    const ground = ctx.createLinearGradient(0, horizon, 0, H);
    ground.addColorStop(0, '#241533');
    ground.addColorStop(1, '#0c0616');
    ctx.fillStyle = ground;
    ctx.fillRect(0, horizon, W, H - horizon);
    // Faint sun reflection on the street.
    const refl = ctx.createLinearGradient(0, horizon, 0, H);
    refl.addColorStop(0, 'rgba(255, 179, 71, 0.18)');
    refl.addColorStop(1, 'rgba(255, 179, 71, 0)');
    ctx.fillStyle = refl;
    ctx.fillRect(W * 0.16, horizon, W * 0.24, H - horizon);
    // Palms framing the scene.
    drawPalm(ctx, W * 0.10, H * 0.98, H * 0.52, -W * 0.05, '#12081f');
    drawPalm(ctx, W * 0.90, H * 0.98, H * 0.46, W * 0.04, '#12081f');
    // The person, dead centre: every panel layout keeps the portrait in
    // the middle panel, in wide, square and portrait exports.
    drawPerson(ctx, W * 0.50, H * 0.99, H / 780);
  }

  // Builds the sample scene once on an offscreen canvas and returns it,
  // so panels can draw from it like any other photo.
  function buildSampleImage(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width || 1600;
    canvas.height = height || 1000;
    drawSampleScene(canvas.getContext('2d'), canvas.width, canvas.height);
    return canvas;
  }

  window.ViceSample = { drawSampleScene: drawSampleScene, buildSampleImage: buildSampleImage };
})();
