"use client";

import { useEffect, useRef } from "react";
import type { Facility, Particle, Position } from "@echo/inference-core";

export function LabField({ world, particles, truth, likelihood }: { world: Facility; particles: Particle[]; truth: Position; likelihood?: number[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, rect.width * ratio);
    canvas.height = Math.max(1, rect.height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = "#030708";
    ctx.fillRect(0, 0, rect.width, rect.height);
    const scale = Math.min(rect.width / world.width, rect.height / world.height) * 0.9;
    const ox = (rect.width - world.width * scale) / 2;
    const oy = (rect.height - world.height * scale) / 2;
    for (let y = 0; y < world.height; y += 1) for (let x = 0; x < world.width; x += 1) {
      const index = y * world.width + x;
      if (world.cells[index] !== 1) continue;
      const heat = likelihood?.[index] ?? 0;
      ctx.fillStyle = heat > 0 ? `rgba(99,194,177,${0.12 + heat * 0.55})` : "rgba(79,115,109,.24)";
      ctx.fillRect(ox + x * scale, oy + y * scale, Math.max(1, scale), Math.max(1, scale));
    }
    const stride = Math.max(1, Math.floor(particles.length / 900));
    particles.forEach((particle, index) => {
      if (index % stride !== 0) return;
      ctx.fillStyle = `rgba(126,232,211,${Math.min(0.78, 0.16 + particle.weight * particles.length * 0.08)})`;
      ctx.fillRect(ox + (particle.x + 0.5) * scale, oy + (particle.y + 0.5) * scale, 1.5, 1.5);
    });
    ctx.fillStyle = "#f2fff9";
    ctx.beginPath();
    ctx.arc(ox + (truth.x + 0.5) * scale, oy + (truth.y + 0.5) * scale, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(242,255,249,.5)";
    ctx.beginPath();
    ctx.arc(ox + (truth.x + 0.5) * scale, oy + (truth.y + 0.5) * scale, 9, 0, Math.PI * 2);
    ctx.stroke();
  }, [world, particles, truth, likelihood]);
  return <canvas ref={canvasRef} className="pointer-events-none size-full" aria-label="Particle filter probability field" />;
}
