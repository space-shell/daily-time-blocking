import {
  currentDate, blocks, intention, currentTheme,
  THEMES, TYPE_COLORS, DAY_START, DAY_END,
  dlHref,
} from '../state/signals.js';

export function minToTime(min) {
  const h    = Math.floor(min / 60);
  const m    = min % 60;
  const ampm = h >= 12 ? 'pm' : 'am';
  const hh   = h > 12 ? h - 12 : h;
  return `${hh}:${String(m).padStart(2, '0')}${ampm}`;
}

export function renderWallpaper() {
  const canvas = document.getElementById('wallCanvas');
  if (!canvas) return;
  const ctx   = canvas.getContext('2d');
  const W = 1080, H = 1920;
  const theme = THEMES[currentTheme.value];

  // Background
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, theme.bg1);
  bg.addColorStop(1, theme.bg2);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Grain
  for (let i = 0; i < 6000; i++) {
    ctx.fillStyle = theme.isDark
      ? `rgba(255,255,255,${Math.random() * 0.012})`
      : `rgba(0,0,0,${Math.random() * 0.015})`;
    ctx.fillRect(Math.random() * W, Math.random() * H, 1.2, 1.2);
  }

  // Accent bar
  ctx.fillStyle = theme.accent;
  ctx.fillRect(80, 90, 4, 120);

  // Weekday
  ctx.fillStyle = theme.isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)';
  ctx.font = '400 34px "DM Mono", monospace';
  ctx.fillText(currentDate.value.toLocaleDateString('en-GB', { weekday: 'long' }).toUpperCase(), 100, 122);

  // Date
  ctx.fillStyle = theme.text;
  ctx.font = '300 72px Fraunces, serif';
  ctx.fillText(currentDate.value.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }), 100, 196);

  // Intention
  const intentionText = intention.value;
  if (intentionText) {
    ctx.fillStyle = theme.accent;
    ctx.font = 'italic 300 42px Fraunces, serif';
    wrapText(ctx, intentionText, 100, 270, W - 180, 54);
  }

  // Divider
  ctx.strokeStyle = theme.muted;
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 9]);
  ctx.beginPath(); ctx.moveTo(100, 340); ctx.lineTo(W - 100, 340); ctx.stroke();
  ctx.setLineDash([]);

  // Timeline layout
  const sorted   = blocks.value.slice().sort((a, b) => a.startMin - b.startMin);
  const tlTop    = 380;
  const tlH      = H - tlTop - 120;
  const totalMin = DAY_END - DAY_START;

  // Hour lines
  for (let h = 9; h <= 20; h++) {
    const y = tlTop + ((h * 60 - DAY_START) / totalMin) * tlH;
    ctx.strokeStyle = theme.muted;
    ctx.lineWidth = 0.5;
    ctx.setLineDash([2, 8]);
    ctx.beginPath(); ctx.moveTo(160, y); ctx.lineTo(W - 100, y); ctx.stroke();
    ctx.setLineDash([]);
    const label = h > 12 ? `${h - 12}pm` : h === 12 ? '12pm' : `${h}am`;
    ctx.fillStyle = theme.muted;
    ctx.font = '400 28px "DM Mono", monospace';
    ctx.fillText(label, 100, y + 10);
  }

  // Blocks
  sorted.forEach(block => {
    const by = tlTop + ((block.startMin - DAY_START) / totalMin) * tlH;
    const bh = Math.max((block.durMin / totalMin) * tlH - 6, 24);
    const bx = 165, bw = W - 265;

    roundRect(ctx, bx, by, bw, bh, 14);
    ctx.fillStyle = TYPE_COLORS[block.type] || '#444';
    ctx.fill();

    const isLight = block.type !== 'buffer';
    ctx.fillStyle = isLight ? 'rgba(0,0,0,0.75)' : (theme.isDark ? '#888' : '#666');
    ctx.font = '500 36px "DM Mono", monospace';
    ctx.fillText(block.label, bx + 20, by + Math.min(bh - 14, 46));

    if (bh > 58) {
      ctx.fillStyle = isLight ? 'rgba(0,0,0,0.45)' : '#555';
      ctx.font = '400 26px "DM Mono", monospace';
      ctx.fillText(
        `${minToTime(block.startMin)} \u2013 ${minToTime(block.startMin + block.durMin)}`,
        bx + 20, by + bh - 14
      );
    }
  });

  // Empty state
  if (sorted.length === 0) {
    ctx.fillStyle = theme.muted;
    ctx.font = 'italic 300 40px Fraunces, serif';
    ctx.textAlign = 'center';
    ctx.fillText('No blocks yet \u2014 drag to build your day', W / 2, tlTop + tlH / 2);
    ctx.textAlign = 'left';
  }

  // Footer
  ctx.fillStyle = theme.muted;
  ctx.font = '400 26px "DM Mono", monospace';
  ctx.fillText('buffer = transition time, not wasted time', 100, H - 60);

  dlHref.value = canvas.toDataURL('image/png');
}

function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, h / 2, w / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(ctx, text, x, y, maxW, lh) {
  const words = text.split(' ');
  let line = '';
  for (const word of words) {
    const test = line + word + ' ';
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line.trim(), x, y);
      line = word + ' ';
      y += lh;
    } else {
      line = test;
    }
  }
  ctx.fillText(line.trim(), x, y);
}
