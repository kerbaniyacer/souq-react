import { useEffect, useState, useRef } from 'react';
import { useThemeStore } from '@stores/themeStore';

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useThemeStore();
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleToggle = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    toggleTheme();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsAnimating(false), 500);
  };

  return (
    <button
      onClick={handleToggle}
      className="relative w-16 h-9 rounded-full p-1 transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-primary-400/30"
      style={{
        background: isDark
          ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
          : 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
        boxShadow: isDark
          ? 'inset 0 2px 4px rgba(0,0,0,0.6), 0 1px 2px rgba(0,0,0,0.3), 0 0 20px rgba(138,180,248,0.15)'
          : 'inset 0 2px 4px rgba(255,255,255,0.4), 0 2px 4px rgba(0,0,0,0.15), 0 0 20px rgba(253,160,133,0.2)',
      }}
      aria-label={isDark ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن'}
    >
      {/* Stars (visible in dark mode) */}
      <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
        <span
          className="absolute w-1 h-1 bg-white rounded-full transition-opacity duration-500"
          style={{ top: '8px', left: '12px', opacity: isDark ? 1 : 0 }}
        />
        <span
          className="absolute w-0.5 h-0.5 bg-white rounded-full transition-opacity duration-700"
          style={{ top: '16px', left: '8px', opacity: isDark ? 0.7 : 0 }}
        />
        <span
          className="absolute w-0.5 h-0.5 bg-white rounded-full transition-opacity duration-600"
          style={{ top: '10px', left: '42px', opacity: isDark ? 0.5 : 0 }}
        />
        <span
          className="absolute w-1 h-1 bg-white rounded-full transition-opacity duration-800"
          style={{ top: '22px', left: '14px', opacity: isDark ? 0.6 : 0 }}
        />
      </div>

      {/* Slider knob */}
      <div
        className="relative w-7 h-7 rounded-full transition-all duration-500 ease-in-out flex items-center justify-center"
        style={{
          transform: isAnimating
            ? isDark
              ? 'translateX(-28px) rotate(360deg) scale(0.9)'
              : 'translateX(0px) rotate(-360deg) scale(1.1)'
            : isDark
              ? 'translateX(-28px) rotate(0deg)'
              : 'translateX(0px) rotate(0deg)',
          background: isDark
            ? 'linear-gradient(135deg, #e0e7ff, #c7d2fe)'
            : 'linear-gradient(135deg, #fff, #fef3c7)',
          boxShadow: isDark
            ? '0 2px 8px rgba(0,0,0,0.4), inset 0 -2px 4px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.5)'
            : '0 2px 8px rgba(253,160,133,0.4), inset 0 -2px 4px rgba(0,0,0,0.05), inset 0 2px 4px rgba(255,255,255,0.8)',
        }}
      >
        {isDark ? (
          /* Moon icon with 3D effect */
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}>
            <path
              d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
              fill="#6366f1"
              stroke="#4f46e5"
              strokeWidth="1"
            />
            <path
              d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
              fill="url(#moonGradient)"
            />
            <defs>
              <linearGradient id="moonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </linearGradient>
            </defs>
          </svg>
        ) : (
          /* Sun icon with 3D effect */
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }}>
            <circle cx="12" cy="12" r="5" fill="#f59e0b" stroke="#d97706" strokeWidth="1" />
            <circle cx="12" cy="12" r="5" fill="url(#sunGradient)" />
            {/* Rays */}
            <g stroke="#f59e0b" strokeWidth="2" strokeLinecap="round">
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </g>
            <defs>
              <linearGradient id="sunGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </linearGradient>
            </defs>
          </svg>
        )}
      </div>

      {/* Cloud decorations (visible in light mode) */}
      {!isDark && (
        <>
          <div
            className="absolute w-3 h-1.5 rounded-full bg-white/40"
            style={{ top: '12px', right: '10px' }}
          />
          <div
            className="absolute w-2 h-1 rounded-full bg-white/30"
            style={{ top: '20px', right: '18px' }}
          />
        </>
      )}
    </button>
  );
}
