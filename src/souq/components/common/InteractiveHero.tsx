import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Star, Gift, ChevronLeft, Sparkles, TrendingUp, Users } from 'lucide-react';

/* ================================================================
   InteractiveHero — Canvas API particle system + carousel content
   ================================================================ */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  color: string;
  pulse: number;
  pulseSpeed: number;
  baseX: number;
  baseY: number;
}

interface FloatingOrb {
  x: number;
  y: number;
  radius: number;
  color: string;
  opacity: number;
  speedX: number;
  speedY: number;
  pulsePhase: number;
  pulseSpeed: number;
}

interface GeoShape {
  x: number;
  y: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  color: string;
  type: 'triangle' | 'diamond' | 'ring' | 'cross' | 'hexagon';
  speedX: number;
  speedY: number;
  floatPhase: number;
}

interface SlideData {
  id: number;
  badge: string;
  title: string;
  description: string;
  btnText: string;
  btnLink: string;
  btnSecondaryText: string;
  btnSecondaryLink: string;
  stats: { value: string; label: string; icon: React.ReactNode }[];
  image: string;
}

const SLIDES: SlideData[] = [
  {
    id: 1,
    badge: 'عروض حصرية',
    title: 'تسوّق بأسلوب مختلف',
    description:
      'اكتشف تجربة تسوق فريدة مع منتجات عالية الجودة من أفضل التجار في الجزائر. خصومات تصل إلى 50% على آلاف المنتجات المختارة.',
    btnText: 'تسوق الآن',
    btnLink: '/products',
    btnSecondaryText: 'عرض العروض',
    btnSecondaryLink: '/products?discount=true',
    image: '/images/banners/sale-banner.png',
    stats: [
      { value: '+1,200', label: 'عميل سعيد', icon: <Users className="w-4 h-4" /> },
      { value: '+350', label: 'منتج بخصم', icon: <Sparkles className="w-4 h-4" /> },
      { value: '+48', label: 'تاجر مشارك', icon: <TrendingUp className="w-4 h-4" /> },
    ],
  },
  {
    id: 2,
    badge: 'وصل حديثاً',
    title: 'أحدث الساعات الذكية',
    description:
      'اكتشف أحدث الساعات الذكية من أشهر الماركات العالمية. تصميم أنيق وميزات متقدمة ترافقك كل يوم.',
    btnText: 'اكتشف الآن',
    btnLink: '/products?category=electronics',
    btnSecondaryText: 'عرض المزيد',
    btnSecondaryLink: '/products',
    image: '/images/products/smartwatches.png',
    stats: [
      { value: '+500', label: 'منتج جديد', icon: <Sparkles className="w-4 h-4" /> },
      { value: '+50', label: 'ماركة عالمية', icon: <TrendingUp className="w-4 h-4" /> },
      { value: '4.8', label: 'تقييم متوسط', icon: <Star className="w-4 h-4" /> },
    ],
  },
];

const SAGE_COLORS = ['#5C8A6E', '#7AA88C', '#4A7059', '#8CC5A0'];
const ACCENT_COLORS = ['#C9897A', '#D9A99D', '#E94B5C', '#D4A853'];

export default function InteractiveHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, isInside: false });
  const animFrameRef = useRef<number>(0);
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [visible, setVisible] = useState(false);

  // ── Particle system ──────────────────────────────────────────
  const { particles, orbs, shapes } = useMemo(() => {
    const pts: Particle[] = [];
    const obs: FloatingOrb[] = [];
    const shps: GeoShape[] = [];

    for (let i = 0; i < 120; i++) {
      const isSage = Math.random() > 0.3;
      const colors = isSage ? SAGE_COLORS : ACCENT_COLORS;
      pts.push({
        x: Math.random() * 2000,
        y: Math.random() * 1200,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2.2 + 0.5,
        opacity: Math.random() * 0.5 + 0.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        pulse: 0,
        pulseSpeed: Math.random() * 0.02 + 0.005,
        baseX: 0,
        baseY: 0,
      });
      pts[i].baseX = pts[i].x;
      pts[i].baseY = pts[i].y;
    }

    for (let i = 0; i < 5; i++) {
      obs.push({
        x: Math.random() * 2000,
        y: Math.random() * 1200,
        radius: Math.random() * 120 + 60,
        color: i < 3 ? SAGE_COLORS[i] : ACCENT_COLORS[i - 3],
        opacity: Math.random() * 0.06 + 0.03,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.01 + 0.005,
      });
    }

    const shapeTypes: GeoShape['type'][] = ['triangle', 'diamond', 'ring', 'cross', 'hexagon'];
    for (let i = 0; i < 8; i++) {
      shps.push({
        x: Math.random() * 2000,
        y: Math.random() * 1200,
        size: Math.random() * 20 + 10,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.008,
        opacity: Math.random() * 0.15 + 0.05,
        color: Math.random() > 0.5 ? SAGE_COLORS[Math.floor(Math.random() * SAGE_COLORS.length)] : ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)],
        type: shapeTypes[Math.floor(Math.random() * shapeTypes.length)],
        speedX: (Math.random() - 0.5) * 0.2,
        speedY: (Math.random() - 0.5) * 0.2,
        floatPhase: Math.random() * Math.PI * 2,
      });
    }

    return { particles: pts, orbs: obs, shapes: shps };
  }, []);

  // ── Draw helpers ─────────────────────────────────────────────
  const drawShape = useCallback((ctx: CanvasRenderingContext2D, shape: GeoShape) => {
    ctx.save();
    ctx.translate(shape.x, shape.y + Math.sin(shape.floatPhase) * 15);
    ctx.rotate(shape.rotation);
    ctx.strokeStyle = shape.color;
    ctx.globalAlpha = shape.opacity;
    ctx.lineWidth = 1.5;

    const s = shape.size;
    ctx.beginPath();

    switch (shape.type) {
      case 'triangle':
        ctx.moveTo(0, -s);
        ctx.lineTo(-s * 0.866, s * 0.5);
        ctx.lineTo(s * 0.866, s * 0.5);
        ctx.closePath();
        ctx.stroke();
        break;
      case 'diamond':
        ctx.moveTo(0, -s);
        ctx.lineTo(s * 0.6, 0);
        ctx.lineTo(0, s);
        ctx.lineTo(-s * 0.6, 0);
        ctx.closePath();
        ctx.stroke();
        break;
      case 'ring':
        ctx.arc(0, 0, s, 0, Math.PI * 2);
        ctx.stroke();
        break;
      case 'cross':
        ctx.moveTo(-s, 0); ctx.lineTo(s, 0);
        ctx.moveTo(0, -s); ctx.lineTo(0, s);
        ctx.stroke();
        break;
      case 'hexagon':
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 6;
          const px = Math.cos(angle) * s;
          const py = Math.sin(angle) * s;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
        break;
    }
    ctx.restore();
  }, []);

  // ── Animation loop ───────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);
    setVisible(true);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top, isInside: true };
    };
    const handleMouseLeave = () => {
      mouseRef.current.isInside = false;
    };
    const handleTouchMove = (e: TouchEvent) => {
      const rect = container.getBoundingClientRect();
      const touch = e.touches[0];
      mouseRef.current = { x: touch.clientX - rect.left, y: touch.clientY - rect.top, isInside: true };
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('touchmove', handleTouchMove);

    let time = 0;

    const animate = () => {
      const rect = container.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      time += 0.016;

      ctx.clearRect(0, 0, w, h);

      // ── Draw orbs (glowing background blobs) ──
      for (const orb of orbs) {
        orb.x += orb.speedX;
        orb.y += orb.speedY;
        orb.pulsePhase += orb.pulseSpeed;

        if (orb.x < -orb.radius) orb.x = w + orb.radius;
        if (orb.x > w + orb.radius) orb.x = -orb.radius;
        if (orb.y < -orb.radius) orb.y = h + orb.radius;
        if (orb.y > h + orb.radius) orb.y = -orb.radius;

        const pulseR = orb.radius + Math.sin(orb.pulsePhase) * 20;
        const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, pulseR);
        grad.addColorStop(0, orb.color + '18');
        grad.addColorStop(0.5, orb.color + '08');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(orb.x - pulseR, orb.y - pulseR, pulseR * 2, pulseR * 2);
      }

      // ── Mouse glow ──
      if (mouseRef.current.isInside) {
        const mx = mouseRef.current.x;
        const my = mouseRef.current.y;
        const glowR = 180;
        const mouseGrad = ctx.createRadialGradient(mx, my, 0, mx, my, glowR);
        mouseGrad.addColorStop(0, 'rgba(92,138,110,0.12)');
        mouseGrad.addColorStop(0.4, 'rgba(92,138,110,0.04)');
        mouseGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = mouseGrad;
        ctx.fillRect(mx - glowR, my - glowR, glowR * 2, glowR * 2);
      }

      // ── Draw connection lines ──
      const connectionDist = 140;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectionDist) {
            const alpha = (1 - dist / connectionDist) * 0.12;
            ctx.strokeStyle = `rgba(92,138,110,${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // ── Draw particles ──
      for (const p of particles) {
        p.pulse += p.pulseSpeed;
        const pulseFactor = 1 + Math.sin(p.pulse) * 0.4;

        // Mouse repulsion
        if (mouseRef.current.isInside) {
          const dx = p.x - mouseRef.current.x;
          const dy = p.y - mouseRef.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150 && dist > 0) {
            const force = (150 - dist) / 150;
            p.vx += (dx / dist) * force * 0.3;
            p.vy += (dy / dist) * force * 0.3;
          }
        }

        // Gravity back to base
        p.vx += (p.baseX - p.x) * 0.001;
        p.vy += (p.baseY - p.y) * 0.001;

        // Damping
        p.vx *= 0.98;
        p.vy *= 0.98;

        p.x += p.vx;
        p.y += p.vy;

        // Wrap around
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        const r = Math.max(0.3, p.radius * pulseFactor);
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity * pulseFactor;
        ctx.fill();

        // Glow on larger particles
        if (p.radius > 1.5) {
          const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 4);
          glow.addColorStop(0, p.color + '30');
          glow.addColorStop(1, 'transparent');
          ctx.fillStyle = glow;
          ctx.globalAlpha = p.opacity * 0.5;
          ctx.fillRect(p.x - r * 4, p.y - r * 4, r * 8, r * 8);
        }
        ctx.globalAlpha = 1;
      }

      // ── Draw geometric shapes ──
      for (const shape of shapes) {
        shape.x += shape.speedX;
        shape.y += shape.speedY;
        shape.rotation += shape.rotationSpeed;
        shape.floatPhase += 0.008;

        if (shape.x < -50) shape.x = w + 50;
        if (shape.x > w + 50) shape.x = -50;
        if (shape.y < -50) shape.y = h + 50;
        if (shape.y > h + 50) shape.y = -50;

        // Mouse attraction for shapes
        if (mouseRef.current.isInside) {
          const dx = mouseRef.current.x - shape.x;
          const dy = mouseRef.current.y - shape.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 250 && dist > 0) {
            const force = (250 - dist) / 250 * 0.05;
            shape.speedX += (dx / dist) * force;
            shape.speedY += (dy / dist) * force;
            shape.rotationSpeed += force * 0.001;
          }
        }

        // Damping
        shape.speedX *= 0.995;
        shape.speedY *= 0.995;
        shape.rotationSpeed *= 0.999;

        drawShape(ctx, shape);
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resize);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('touchmove', handleTouchMove);
    };
  }, [particles, orbs, shapes, drawShape]);

  // ── Slide carousel logic ─────────────────────────────────────
  const goTo = useCallback(
    (index: number) => {
      if (isAnimating) return;
      setIsAnimating(true);
      setCurrent(index);
      setTimeout(() => setIsAnimating(false), 700);
    },
    [isAnimating]
  );

  const next = useCallback(() => goTo((current + 1) % SLIDES.length), [current, goTo]);
  const prev = useCallback(() => goTo((current - 1 + SLIDES.length) % SLIDES.length), [current, goTo]);

  useEffect(() => {
    const timer = setInterval(next, 7000);
    return () => clearInterval(timer);
  }, [next]);

  const slide = SLIDES[current];

  return (
    <section ref={containerRef} className="relative overflow-hidden min-h-[600px] sm:min-h-[650px] lg:min-h-[700px]">
      {/* Canvas layer */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 1 }}
      />

      {/* Gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          zIndex: 0,
          background: 'linear-gradient(135deg, #0F0F0F 0%, #1a2a1f 30%, #0F0F0F 60%, #1f1a2a 100%)',
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 2,
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)',
        }}
      />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          zIndex: 2,
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Content */}
      <div className="relative z-10 min-h-[600px] sm:min-h-[650px] lg:min-h-[700px] flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text content */}
            <div
              className={`text-center lg:text-right transition-all duration-700 ${
                visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
              }`}
            >
              {/* Badge */}
              <span
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm rounded-full font-arabic mb-6 border transition-all duration-500 ${
                  visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
                style={{
                  background: 'rgba(92,138,110,0.1)',
                  borderColor: 'rgba(92,138,110,0.2)',
                  color: '#7AA88C',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                {slide.badge}
              </span>

              {/* Title */}
              <h2
                className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold font-arabic leading-tight mb-6 transition-all duration-700 delay-100"
                style={{
                  background: 'linear-gradient(135deg, #F5F5F5 0%, #7AA88C 50%, #D9A99D 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {slide.title}
              </h2>

              {/* Description */}
              <p
                className="text-base md:text-lg font-arabic leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0 transition-all duration-700 delay-200"
                style={{ color: '#A0A0A0' }}
              >
                {slide.description}
              </p>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-end mb-10 transition-all duration-700 delay-300">
                <Link
                  to={slide.btnLink}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-arabic text-lg transition-all duration-300 group no-theme-transition"
                  style={{
                    background: 'linear-gradient(135deg, #5C8A6E, #7AA88C)',
                    color: '#fff',
                    boxShadow: '0 8px 30px rgba(92,138,110,0.35)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(92,138,110,0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 30px rgba(92,138,110,0.35)';
                  }}
                >
                  <ShoppingBag className="w-5 h-5" />
                  {slide.btnText}
                  <ChevronLeft className="w-5 h-5" />
                </Link>
                <Link
                  to={slide.btnSecondaryLink}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-arabic text-lg transition-all duration-300 no-theme-transition"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1.5px solid rgba(255,255,255,0.1)',
                    color: '#F5F5F5',
                    backdropFilter: 'blur(8px)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.borderColor = 'rgba(92,138,110,0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  }}
                >
                  <Gift className="w-5 h-5" />
                  {slide.btnSecondaryText}
                </Link>
              </div>

              {/* Stats */}
              <div className="flex gap-8 justify-center lg:justify-end transition-all duration-700 delay-400">
                {slide.stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="text-center group cursor-default"
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                    }}
                  >
                    <div className="flex items-center justify-center gap-1.5 mb-1" style={{ color: '#7AA88C' }}>
                      {stat.icon}
                      <span className="text-2xl font-bold font-mono">{stat.value}</span>
                    </div>
                    <div className="text-xs font-arabic" style={{ color: '#666' }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Image */}
            <div className="hidden lg:block">
              <div
                className={`relative transition-all duration-700 ${
                  visible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                }`}
                style={{ transitionDelay: '0.3s' }}
              >
                <div className="relative w-full aspect-square max-w-lg mx-auto">
                  {/* Glow behind image */}
                  <div
                    className="absolute inset-0 rounded-3xl blur-3xl opacity-40"
                    style={{
                      background: 'radial-gradient(circle, rgba(92,138,110,0.35) 0%, rgba(201,137,122,0.15) 50%, transparent 70%)',
                    }}
                  />
                  {/* Image container */}
                  <div
                    className="relative rounded-3xl overflow-hidden border"
                    style={{
                      borderColor: 'rgba(255,255,255,0.05)',
                      boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(92,138,110,0.1)',
                    }}
                  >
                    <img
                      src={slide.image}
                      alt={slide.title}
                      className="w-full h-full object-cover"
                      style={{ filter: 'brightness(1.1) contrast(1.05)' }}
                      draggable={false}
                    />
                    {/* Overlay gradient */}
                    <div
                      className="absolute inset-0"
                      style={{
                        background: 'linear-gradient(180deg, transparent 50%, rgba(15,15,15,0.5) 100%)',
                      }}
                    />
                    {/* Floating badge on image */}
                    <div
                      className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold font-arabic"
                      style={{
                        background: 'rgba(233,75,92,0.9)',
                        color: '#fff',
                        backdropFilter: 'blur(8px)',
                        boxShadow: '0 4px 15px rgba(233,75,92,0.3)',
                      }}
                    >
                      <Star className="w-3 h-3" fill="currentColor" />
                      خصم حتى 50%
                    </div>
                  </div>
                  {/* Orbiting ring */}
                  <div
                    className="absolute inset-[-20px] rounded-3xl border pointer-events-none"
                    style={{
                      borderColor: 'rgba(92,138,110,0.15)',
                      animation: 'spinSlow 20s linear infinite',
                    }}
                  />
                  <div
                    className="absolute inset-[-40px] rounded-3xl border pointer-events-none"
                    style={{
                      borderColor: 'rgba(201,137,122,0.08)',
                      animation: 'spinSlow 30s linear infinite reverse',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation arrows */}
      <button
        onClick={prev}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 no-theme-transition"
        style={{
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: '#fff',
          backdropFilter: 'blur(8px)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(92,138,110,0.2)';
          e.currentTarget.style.borderColor = 'rgba(92,138,110,0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
        }}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={next}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 no-theme-transition"
        style={{
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: '#fff',
          backdropFilter: 'blur(8px)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(92,138,110,0.2)';
          e.currentTarget.style.borderColor = 'rgba(92,138,110,0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
        }}
      >
        <ChevronLeft className="w-5 h-5 rotate-180" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
        {SLIDES.map((s, index) => (
          <button
            key={s.id}
            onClick={() => goTo(index)}
            className="transition-all duration-500 rounded-full no-theme-transition"
            style={{
              width: index === current ? 32 : 10,
              height: 10,
              background: index === current
                ? 'linear-gradient(135deg, #5C8A6E, #7AA88C)'
                : 'rgba(255,255,255,0.2)',
              boxShadow: index === current ? '0 0 15px rgba(92,138,110,0.4)' : 'none',
            }}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20 h-0.5" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <div
          className="h-full"
          style={{
            background: 'linear-gradient(90deg, #5C8A6E, #7AA88C, #C9897A)',
            animation: 'heroProgress 7s linear',
          }}
        />
      </div>

      {/* Inline keyframes */}
      <style>{`
        @keyframes heroProgress {
          from { width: 0%; }
          to { width: 100%; }
        }
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  );
}
