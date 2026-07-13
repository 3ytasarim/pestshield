"use client";

import { useEffect, useRef } from "react";

const CHARS = "アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン0123456789ABCDEF<>{}[]|/\\";

export function MatrixRain({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let cols: number[] = [];
    let rafId: number;

    function resize() {
      if (!canvas || !ctx) return;
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      const colCount = Math.floor(canvas.width / 18);
      cols = Array.from({ length: colCount }, () => Math.random() * -canvas!.height);
    }

    function draw() {
      if (!canvas || !ctx) return;
      // Fade trail
      ctx.fillStyle = "rgba(0,0,0,0.04)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const fontSize = 14;
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < cols.length; i++) {
        // Vary brightness — some cols bright, most dim
        const brightness = Math.random() > 0.98 ? 1 : 0.25 + Math.random() * 0.18;
        ctx.fillStyle = `rgba(0, ${Math.floor(140 * brightness + 60)}, ${Math.floor(30 * brightness)}, ${brightness})`;

        const char = CHARS[Math.floor(Math.random() * CHARS.length)];
        const x = i * 18;
        const y = cols[i];

        // Lead character slightly brighter
        if (Math.random() > 0.85) {
          ctx.fillStyle = `rgba(80, 220, 80, ${brightness * 1.4})`;
        }

        ctx.fillText(char, x, y);

        cols[i] += fontSize + 2;
        if (cols[i] > canvas.height && Math.random() > 0.975) {
          cols[i] = Math.random() * -200;
        }
      }

      rafId = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize);
    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: "block", touchAction: "none" }}
    />
  );
}
