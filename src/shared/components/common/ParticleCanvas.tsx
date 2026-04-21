import { useEffect, useRef, useCallback } from 'react';
import { useThemeStore } from '@shared/stores/themeStore';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  pulseSpeed: number;
  pulseOffset: number;
}

const PARTICLE_COUNT = 60;
const CONNECTION_DISTANCE = 140;
const MOUSE_REPEL_RADIUS = 120;
const MOUSE_REPEL_FORCE = 0.6;
const SPEED = 0.4;

export default function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef<number>(0);
  const { isDark } = useThemeStore();

  const initParticles = useCallback((w: number, h: number) => {
    particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = SPEED * (0.5 + Math.random());
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 1.5 + Math.random() * 2,
        opacity: 0.3 + Math.random() * 0.5,
        pulseSpeed: 0.01 + Math.random() * 0.02,
        pulseOffset: Math.random() * Math.PI * 2,
      };
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let frame = 0;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      w = rect?.width ?? window.innerWidth;
      h = rect?.height ?? window.innerHeight;
      canvas.width = w;
      canvas.height = h;
      initParticles(w, h);
    };

    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };
    const onMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);

    const draw = () => {
      frame++;
      ctx.clearRect(0, 0, w, h);

      const particles = particlesRef.current;
      const mouse = mouseRef.current;

      // Determine colors based on dark mode
      const particleColor = isDark ? '138, 180, 140' : '92, 138, 110';
      const lineColor = isDark ? '138, 180, 140' : '92, 138, 110';

      // Update + draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Mouse repulsion
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_REPEL_RADIUS && dist > 0) {
          const force = (1 - dist / MOUSE_REPEL_RADIUS) * MOUSE_REPEL_FORCE;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }

        // Speed limiting
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        const maxSpeed = SPEED * 3;
        if (speed > maxSpeed) {
          p.vx = (p.vx / speed) * maxSpeed;
          p.vy = (p.vy / speed) * maxSpeed;
        }

        // Gradual return to base speed
        const baseSpeed = SPEED;
        if (speed > baseSpeed) {
          p.vx *= 0.98;
          p.vy *= 0.98;
        }

        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Bounce off edges with padding
        const pad = p.radius + 1;
        if (p.x < pad) { p.x = pad; p.vx = Math.abs(p.vx); }
        if (p.x > w - pad) { p.x = w - pad; p.vx = -Math.abs(p.vx); }
        if (p.y < pad) { p.y = pad; p.vy = Math.abs(p.vy); }
        if (p.y > h - pad) { p.y = h - pad; p.vy = -Math.abs(p.vy); }

        // Pulsing opacity
        const pulse = Math.sin(frame * p.pulseSpeed + p.pulseOffset);
        const opacity = p.opacity * (0.7 + 0.3 * pulse);

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${particleColor}, ${opacity})`;
        ctx.fill();

        // Glow on mouse proximity
        if (dist < MOUSE_REPEL_RADIUS) {
          const glowOpacity = (1 - dist / MOUSE_REPEL_RADIUS) * 0.6;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${particleColor}, ${glowOpacity * 0.3})`;
          ctx.fill();
        }
      }

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const pi = particles[i];
          const pj = particles[j];
          const dx = pi.x - pj.x;
          const dy = pi.y - pj.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CONNECTION_DISTANCE) {
            const lineOpacity = (1 - dist / CONNECTION_DISTANCE) * 0.25;

            // Boost opacity if mouse is near either particle
            const mi = Math.sqrt((pi.x - mouse.x) ** 2 + (pi.y - mouse.y) ** 2);
            const mj = Math.sqrt((pj.x - mouse.x) ** 2 + (pj.y - mouse.y) ** 2);
            const mouseBoost = Math.max(0,
              (1 - Math.min(mi, mj) / MOUSE_REPEL_RADIUS) * 0.4
            );

            ctx.beginPath();
            ctx.moveTo(pi.x, pi.y);
            ctx.lineTo(pj.x, pj.y);
            ctx.strokeStyle = `rgba(${lineColor}, ${lineOpacity + mouseBoost})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [isDark, initParticles]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-auto"
      style={{ zIndex: 1 }}
    />
  );
}
