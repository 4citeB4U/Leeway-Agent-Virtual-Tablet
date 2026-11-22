/*
 * LeeWay desktop wallpaper adapted from the existing IDE GalacticMeshBackground,
 * which is itself the governed port of Content Foundry's GalaxyBackground.
 */
import { useEffect, useRef } from 'react';

type Props = { tint?: string; density?: number; style?: 'all' | 'shards' | 'orbs'; speed?: number };

export function GalacticMeshBackground({ tint = '#3b82f6', density = 700, style = 'all', speed = 0.3 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let offsetX = 0;
    let frame = 0;
    let shapes: Array<{ x: number; y: number; size: number; parallax: number; type: number; rotSpeed: number; rotation: number; opacity: number }> = [];

    const initShapes = () => {
      shapes = Array.from({ length: Math.min(density, 2000) }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 3 + 1,
        parallax: Math.random() * 0.7 + 0.2,
        type: Math.random(),
        rotSpeed: (Math.random() - 0.5) * 0.02,
        rotation: Math.random() * Math.PI,
        opacity: Math.random() * 0.6 + 0.2
      }));
    };
    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      dpr = window.devicePixelRatio || 1;
      width = Math.max(1, Math.floor(rect?.width || window.innerWidth));
      height = Math.max(1, Math.floor(rect?.height || window.innerHeight));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initShapes();
    };
    const rgb = /^#[0-9a-f]{6}$/i.test(tint)
      ? `${parseInt(tint.slice(1, 3), 16)},${parseInt(tint.slice(3, 5), 16)},${parseInt(tint.slice(5, 7), 16)}`
      : '59,130,246';
    const draw = (time: number) => {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, width, height);
      offsetX += speed;
      ctx.globalCompositeOperation = 'screen';
      for (const shape of shapes) {
        const x = (shape.x + offsetX * shape.parallax) % width;
        const y = shape.y % height;
        const pulse = Math.sin(time * 0.001 + shape.x) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(${rgb},${shape.opacity * pulse})`;
        ctx.strokeStyle = `rgba(${rgb},${shape.opacity * 0.4})`;
        const mode = style === 'all' ? (shape.type > 0.5 ? 'shards' : 'orbs') : style;
        if (mode === 'orbs') {
          ctx.beginPath(); ctx.arc(x, y, shape.size * 6 * pulse, 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.save(); ctx.translate(x, y); ctx.rotate(shape.rotation + time * shape.rotSpeed);
          ctx.beginPath(); ctx.moveTo(-shape.size * 3, -shape.size * 2); ctx.lineTo(shape.size * 4, 0); ctx.lineTo(0, shape.size * 5); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
        }
      }
      ctx.globalCompositeOperation = 'source-over';
      frame = requestAnimationFrame(draw);
    };
    window.addEventListener('resize', resize);
    resize();
    frame = requestAnimationFrame(draw);
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(frame); };
  }, [density, speed, style, tint]);

  return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full bg-black" />;
}
