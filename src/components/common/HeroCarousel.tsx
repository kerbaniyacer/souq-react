import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft, ShoppingBag, Star, Gift } from 'lucide-react';
import ParticleCanvas from './ParticleCanvas';

interface Slide {
  id: number;
  image: string;
  title: string;
  subtitle: string;
  description: string;
  btnText: string;
  btnLink: string;
  btnSecondaryText: string;
  btnSecondaryLink: string;
  stats: { value: string; label: string }[];
}

const slides: Slide[] = [
  {
    id: 1,
    image: '/images/banners/sale-banner.png',
    title: 'استفد من عروضنا المميزة',
    subtitle: 'تسوق الآن وتمتع بعروض لا مثيل لها',
    description: 'خصومات تصل إلى 50% على آلاف المنتجات المختارة. عروض محدودة لفترة قصيرة، لا تفوّت الفرصة!',
    btnText: 'تسوق الآن',
    btnLink: '/products',
    btnSecondaryText: 'عرض العروض',
    btnSecondaryLink: '/products?discount=true',
    stats: [
      { value: '+1,200', label: 'عميل سعيد' },
      { value: '+350', label: 'منتج بخصم' },
      { value: '+48', label: 'تاجر مشارك' },
    ],
  },
  {
    id: 2,
    image: '/images/products/smartwatches.png',
    title: 'أحدث الساعات الذكية',
    subtitle: 'تكنولوجيا في معصمك',
    description: 'اكتشف أحدث الساعات الذكية من أشهر الماركات العالمية. تصميم أنيق وميزات متقدمة ترافقك كل يوم.',
    btnText: 'اكتشف الآن',
    btnLink: '/products?category=electronics',
    btnSecondaryText: 'عرض المزيد',
    btnSecondaryLink: '/products',
    stats: [
      { value: '+500', label: 'منتج جديد' },
      { value: '+50', label: 'ماركة عالمية' },
      { value: '4.8', label: 'تقييم متوسط' },
    ],
  },
];

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [key, setKey] = useState(0);

  const goTo = useCallback(
    (index: number) => {
      if (isAnimating) return;
      setIsAnimating(true);
      setCurrent(index);
      setKey((k) => k + 1);
      setTimeout(() => setIsAnimating(false), 600);
    },
    [isAnimating]
  );

  const next = useCallback(() => {
    goTo((current + 1) % slides.length);
  }, [current, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + slides.length) % slides.length);
  }, [current, goTo]);

  useEffect(() => {
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <section className="relative overflow-hidden">
      {/* Particle canvas — shared across slides, always visible */}
      <div className="absolute inset-0 min-h-[500px] sm:min-h-[550px] lg:min-h-[600px] z-[5]">
        <ParticleCanvas />
      </div>

      {/* Slides container */}
      <div className="relative min-h-[500px] sm:min-h-[550px] lg:min-h-[600px]">
        {slides.map((s, index) => (
          <div
            key={s.id}
            className={`absolute inset-0 transition-all duration-700 ease-in-out ${
              index === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <div
              className="min-h-[500px] sm:min-h-[550px] lg:min-h-[600px] flex items-center bg-white dark:bg-[#0A0A0A]"
            >
              {/* Subtle background gradient (no opaque orbs — particles handle the ambiance) */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                  className="absolute w-[600px] h-[600px] rounded-full blur-3xl"
                  style={{ background: 'radial-gradient(circle, rgba(92,138,110,0.06) 0%, transparent 65%)', top: '-20%', right: '-10%' }}
                />
                <div
                  className="absolute w-[400px] h-[400px] rounded-full blur-3xl"
                  style={{ background: 'radial-gradient(circle, rgba(201,137,122,0.04) 0%, transparent 65%)', bottom: '0%', left: '5%' }}
                />
              </div>

              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  {/* Text */}
                  <div
                    className="text-center lg:text-right"
                    style={{
                      opacity: index === current ? 1 : 0,
                      transform: index === current ? 'translateX(0)' : 'translateX(2rem)',
                      transition: 'all 0.7s ease-out',
                    }}
                  >
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-full font-arabic mb-6 bg-primary-400/10 text-primary-600 dark:text-primary-300 border border-primary-400/20">
                      <Star className="w-3.5 h-3.5" />
                      {s.subtitle}
                    </span>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-arabic leading-tight mb-6 text-gray-900 dark:text-white">
                      {s.title}
                    </h2>
                    <p className="text-base md:text-lg font-arabic leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0 text-gray-500 dark:text-gray-400">
                      {s.description}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-end mb-8">
                      <Link
                        to={s.btnLink}
                        className="inline-flex items-center gap-2 px-8 py-4 bg-primary-400 text-white rounded-2xl hover:bg-primary-500 transition-all font-arabic text-lg"
                        style={{ boxShadow: '0 8px 24px rgba(92,138,110,0.35)' }}
                      >
                        <ShoppingBag className="w-5 h-5" />
                        {s.btnText}
                        <ChevronLeft className="w-5 h-5" />
                      </Link>
                      <Link
                        to={s.btnSecondaryLink}
                        className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl transition-all font-arabic text-lg bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-white border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10"
                      >
                        <Gift className="w-5 h-5" />
                        {s.btnSecondaryText}
                      </Link>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-8 justify-center lg:justify-end">
                      {s.stats.map((stat) => (
                        <div key={stat.label} className="text-center">
                          <div className="text-2xl font-bold font-mono text-primary-500 dark:text-primary-300">
                            {stat.value}
                          </div>
                          <div className="text-sm font-arabic text-gray-500 dark:text-gray-500">
                            {stat.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Image */}
                  <div className="hidden lg:block">
                    <div
                      style={{
                        opacity: index === current ? 1 : 0,
                        transform: index === current ? 'translateX(0)' : 'translateX(2rem)',
                        transition: 'all 0.7s ease-out 0.15s',
                      }}
                    >
                      <div className="relative w-full aspect-square max-w-lg mx-auto">
                        <div
                          className="absolute inset-0 rounded-3xl blur-2xl opacity-20"
                          style={{ background: 'radial-gradient(circle, rgba(92,138,110,0.4) 0%, transparent 70%)' }}
                        />
                        <img
                          src={s.image}
                          alt={s.title}
                          className="relative w-full h-full object-contain drop-shadow-2xl mix-blend-multiply dark:mix-blend-normal"
                          style={{ filter: 'brightness(1.0) contrast(1.02)' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation arrows */}
      <button
        onClick={prev}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-gray-200/80 dark:bg-white/10 backdrop-blur-sm text-gray-700 dark:text-white flex items-center justify-center hover:bg-gray-300/80 dark:hover:bg-white/20 transition-all border border-gray-300/50 dark:border-white/10"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
      <button
        onClick={next}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-gray-200/80 dark:bg-white/10 backdrop-blur-sm text-gray-700 dark:text-white flex items-center justify-center hover:bg-gray-300/80 dark:hover:bg-white/20 transition-all border border-gray-300/50 dark:border-white/10"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {slides.map((s, index) => (
          <button
            key={s.id}
            onClick={() => goTo(index)}
            className={`transition-all duration-300 rounded-full ${
              index === current
                ? 'w-8 h-2.5 bg-primary-400'
                : 'w-2.5 h-2.5 bg-gray-400/40 dark:bg-white/20 hover:bg-gray-400/60 dark:hover:bg-white/40'
            }`}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20 h-0.5 bg-gray-200/50 dark:bg-white/5">
        <div
          key={key}
          className="h-full bg-primary-400"
          style={{ animation: 'progressBar 6s linear' }}
        />
      </div>

      <style>{`
        @keyframes progressBar {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </section>
  );
}
