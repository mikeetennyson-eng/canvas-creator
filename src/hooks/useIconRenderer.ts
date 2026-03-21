import { useEffect, useRef, useState } from 'react';

/**
 * Simple SVG rendering helper — generates a colored shape based on icon name.
 * Replace with actual SVG loading when backend serves real SVG files.
 */
const CATEGORY_COLORS: Record<string, string> = {
  Cells: '#e74c3c',
  Molecular: '#3498db',
  Organs: '#e67e22',
  'Lab Equipment': '#2ecc71',
  Pathways: '#9b59b6',
};

const SHAPES: Record<string, (ctx: CanvasRenderingContext2D, w: number, h: number, color: string) => void> = {
  Cells: (ctx, w, h, c) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.ellipse(w / 2, h / 2, w * 0.4, h * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    // nucleus
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.ellipse(w * 0.45, h * 0.45, w * 0.12, h * 0.1, 0.3, 0, Math.PI * 2);
    ctx.fill();
  },
  Molecular: (ctx, w, h, c) => {
    ctx.strokeStyle = c;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    // double helix suggestion
    for (let i = 0; i < 5; i++) {
      const y = h * 0.15 + (h * 0.7 * i) / 4;
      ctx.beginPath();
      ctx.moveTo(w * 0.25, y);
      ctx.lineTo(w * 0.75, y);
      ctx.stroke();
    }
    ctx.fillStyle = c;
    for (let i = 0; i < 5; i++) {
      const y = h * 0.15 + (h * 0.7 * i) / 4;
      ctx.beginPath(); ctx.arc(w * 0.25, y, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(w * 0.75, y, 4, 0, Math.PI * 2); ctx.fill();
    }
  },
  Organs: (ctx, w, h, c) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(w * 0.5, h * 0.8);
    ctx.bezierCurveTo(w * 0.15, h * 0.6, w * 0.2, h * 0.15, w * 0.5, h * 0.3);
    ctx.bezierCurveTo(w * 0.8, h * 0.15, w * 0.85, h * 0.6, w * 0.5, h * 0.8);
    ctx.fill();
  },
  'Lab Equipment': (ctx, w, h, c) => {
    ctx.strokeStyle = c;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    // flask shape
    ctx.beginPath();
    ctx.moveTo(w * 0.35, h * 0.15);
    ctx.lineTo(w * 0.35, h * 0.5);
    ctx.lineTo(w * 0.15, h * 0.85);
    ctx.lineTo(w * 0.85, h * 0.85);
    ctx.lineTo(w * 0.65, h * 0.5);
    ctx.lineTo(w * 0.65, h * 0.15);
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = c + '40';
    ctx.fill();
  },
  Pathways: (ctx, w, h, c) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.roundRect(w * 0.2, h * 0.2, w * 0.6, h * 0.6, 8);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.roundRect(w * 0.3, h * 0.35, w * 0.15, h * 0.3, 3);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(w * 0.55, h * 0.35, w * 0.15, h * 0.3, 3);
    ctx.fill();
  },
};

export function useIconRenderer(category: string, name: string, size = 64) {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, size, size);
    const color = CATEGORY_COLORS[category] || '#888';
    const drawFn = SHAPES[category] || SHAPES.Pathways;
    drawFn(ctx, size, size, color);

    // Add first letter
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${size * 0.18}px DM Sans, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name.slice(0, 2).toUpperCase(), size / 2, size * 0.85);

    setDataUrl(canvas.toDataURL());
  }, [category, name, size]);

  return dataUrl;
}

export function generateIconDataUrl(category: string, name: string, size = 64): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const color = CATEGORY_COLORS[category] || '#888';
  const drawFn = SHAPES[category] || SHAPES.Pathways;
  drawFn(ctx, size, size, color);

  ctx.fillStyle = '#fff';
  ctx.font = `bold ${size * 0.18}px DM Sans, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name.slice(0, 2).toUpperCase(), size / 2, size * 0.85);

  return canvas.toDataURL();
}
