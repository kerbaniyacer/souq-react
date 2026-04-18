import { Link } from 'react-router-dom';
import { Store, Mail, Phone, MapPin, Facebook, Instagram, Twitter } from 'lucide-react';
import { useState } from 'react';
import { newsletterApi } from '@/services/api';
import { useToast } from '@/stores/toastStore';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const toast = useToast();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribing(true);
    try {
      await newsletterApi.subscribe(email);
      toast.success('تم الاشتراك في النشرة البريدية بنجاح!');
      setEmail('');
    } catch {
      toast.error('حدث خطأ، يرجى المحاولة مرة أخرى');
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <footer className="mt-0 bg-white dark:bg-[#111111] border-t border-gray-200 dark:border-[#1E1E1E]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2.5 mb-5 group w-fit">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-primary-400/20 transition-all group-hover:shadow-primary-400/35"
                style={{ background: 'linear-gradient(135deg, #5C8A6E, #7AA88C)' }}>
                <Store className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold font-arabic bg-gradient-to-l from-primary-300 to-primary-400 bg-clip-text text-transparent">
                سوق
              </span>
            </Link>
            <p className="text-sm text-gray-600 dark:text-gray-500 leading-relaxed font-arabic mb-5">
              متجر إلكتروني يضم أفضل المنتجات من مختلف التجار. نضمن لك تجربة تسوق آمنة وسهلة.
            </p>
            <div className="flex gap-2.5">
              {[Facebook, Instagram, Twitter].map((Icon, i) => (
                <a key={i} href="#"
                  className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 dark:border-[#2E2E2E] text-gray-600 dark:text-gray-500 hover:text-primary-300 hover:border-primary-400/30 hover:bg-primary-400/8 transition-all duration-200"
                  style={{ background: 'rgba(0,0,0,0.02)' }}>
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-gray-800 dark:text-gray-200 font-semibold mb-5 font-arabic text-sm tracking-wide">روابط سريعة</h4>
            <ul className="space-y-3">
              {[
                { to: '/products', label: 'المنتجات' },
                { to: '/cart', label: 'السلة' },
                { to: '/wishlist', label: 'المفضلة' },
                { to: '/orders', label: 'طلباتي' },
                { to: '/track-order', label: 'تتبع الطلب' },
              ].map((link) => (
                <li key={link.to}>
                  <Link to={link.to}
                    className="text-sm text-gray-500 dark:text-gray-600 hover:text-primary-300 font-arabic transition-colors flex items-center gap-1.5 group">
                    <span className="w-1 h-1 rounded-full bg-primary-400/30 group-hover:bg-primary-400 transition-colors" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-gray-800 dark:text-gray-200 font-semibold mb-5 font-arabic text-sm tracking-wide">تواصل معنا</h4>
            <ul className="space-y-3.5">
              {[
                { icon: <Mail className="w-4 h-4" />, text: 'contact@souq.dz' },
                { icon: <Phone className="w-4 h-4" />, text: '+213 555 000 000' },
                { icon: <MapPin className="w-4 h-4" />, text: 'الجزائر العاصمة، الجزائر' },
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-500 font-arabic">
                  <span className="text-primary-400 shrink-0">{item.icon}</span>
                  {item.text}
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-gray-800 dark:text-gray-200 font-semibold mb-2 font-arabic text-sm tracking-wide">النشرة البريدية</h4>
            <p className="text-sm text-gray-500 dark:text-gray-600 mb-4 font-arabic leading-relaxed">اشترك للحصول على آخر العروض والمنتجات الجديدة</p>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="بريدك الإلكتروني"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#2E2E2E] bg-gray-100 dark:bg-[#1A1A1A] text-gray-700 dark:text-gray-300 text-sm placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-400/25 focus:border-primary-400/50 font-arabic transition-all"
              />
              <button type="submit" disabled={subscribing}
                className="w-full py-2.5 rounded-xl text-white text-sm font-bold font-arabic transition-all hover:-translate-y-0.5 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #5C8A6E, #7AA88C)' }}>
                {subscribing ? 'جاري الاشتراك...' : 'اشتراك'}
              </button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-gray-200 dark:border-[#1E1E1E] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-gray-500 dark:text-gray-600 font-arabic">
            © {new Date().getFullYear()} سوق — جميع الحقوق محفوظة
          </p>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
            <span className="text-xs text-gray-500 dark:text-gray-600 font-arabic">متصل الآن</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
