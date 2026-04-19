import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 z-[100] w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl active:scale-95 group"
      style={{
        background: 'linear-gradient(135deg, #5C8A6E, #4a7259)',
        boxShadow: '0 6px 20px rgba(92,138,110,0.4), 0 2px 8px rgba(0,0,0,0.2)',
      }}
      aria-label="الصعود للأعلى"
    >
      <span className="absolute inset-0 rounded-xl animate-ping bg-primary-400/30 opacity-0 group-hover:opacity-75" />
      <ArrowUp className="w-5 h-5 relative z-10" />
    </button>
  );
}
