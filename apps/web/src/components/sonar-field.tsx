"use client";

import { useEffect, useRef } from "react";

export function SonarField({ dense = false }: { dense?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    let raf = 0;
    let running = false;
    let visible = true;
    let lastDraw = -Infinity;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const particles = Array.from({ length: dense ? 170 : 90 }, (_, index) => ({
      angle: index * 2.399,
      radius: 0.12 + ((index * 37) % 100) / 120,
      drift: ((index % 9) - 4) * 0.00008,
      alpha: 0.18 + ((index * 17) % 50) / 100,
    }));
    const draw = (elapsed: number) => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width * ratio || canvas.height !== rect.height * ratio) {
        canvas.width = rect.width * ratio;
        canvas.height = rect.height * ratio;
      }
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, rect.width, rect.height);
      const cx = rect.width * 0.53;
      const cy = rect.height * 0.48;
      const radius = Math.min(rect.width, rect.height) * 0.43;
      context.strokeStyle = "rgba(121,221,203,.11)";
      context.lineWidth = 1;
      for (let ring = 1; ring <= 5; ring += 1) {
        context.beginPath();
        context.arc(cx, cy, (radius * ring) / 5, 0, Math.PI * 2);
        context.stroke();
      }
      context.beginPath();
      context.moveTo(cx - radius, cy);
      context.lineTo(cx + radius, cy);
      context.moveTo(cx, cy - radius);
      context.lineTo(cx, cy + radius);
      context.stroke();
      const sweep = ((elapsed % 6000) / 6000) * Math.PI * 2;
      const gradient = context.createRadialGradient(cx, cy, 0, cx, cy, radius);
      gradient.addColorStop(0, "rgba(121,221,203,.13)");
      gradient.addColorStop(1, "rgba(121,221,203,0)");
      context.fillStyle = gradient;
      context.beginPath();
      context.moveTo(cx, cy);
      context.arc(cx, cy, radius, sweep - 0.36, sweep);
      context.closePath();
      context.fill();
      for (const particle of particles) {
        const angle = particle.angle + particle.drift * (elapsed / 16.67);
        const wobble = Math.sin(elapsed * 0.00072 + angle * 3) * 8;
        const x = cx + Math.cos(angle) * (particle.radius * radius + wobble);
        const y = cy + Math.sin(angle) * (particle.radius * radius * 0.72 + wobble);
        context.fillStyle = `rgba(127,231,211,${particle.alpha})`;
        context.fillRect(x, y, dense ? 1.4 : 1, dense ? 1.4 : 1);
      }
      context.fillStyle = "rgba(224,255,248,.88)";
      context.beginPath();
      context.arc(cx, cy, 2.2, 0, Math.PI * 2);
      context.fill();
    };
    const loop = (elapsed: number) => {
      if (elapsed - lastDraw >= 1000 / 30) {
        draw(elapsed);
        lastDraw = elapsed;
      }
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    const start = () => {
      if (running || reducedMotion || !visible || document.hidden) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };
    const syncActivity = () => {
      if (visible && !document.hidden) start();
      else stop();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
      syncActivity();
    }, { rootMargin: "120px" });
    const resizeObserver = new ResizeObserver(() => {
      if (reducedMotion || !running) draw(0);
    });
    observer.observe(canvas);
    resizeObserver.observe(canvas);
    document.addEventListener("visibilitychange", syncActivity);
    draw(0);
    start();
    return () => {
      stop();
      observer.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", syncActivity);
    };
  }, [dense]);
  return <canvas ref={canvasRef} className="size-full" aria-hidden="true" />;
}
