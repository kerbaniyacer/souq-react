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
    <footer className="bg-gray-900 text-gray-300 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-primary-400 rounded-xl flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white font-arabic">سوق</span>
            </div>
            <p className="text-sm leading-relaxed font-arabic">
              متجر إلكتروني يضم أفضل المنتجات من مختلف التجار. نضمن لك تجربة تسوق آمنة وسهلة.
            </p>
            <div className="flex gap-3 mt-4">
              <a href="#" className="p-2 bg-white/10 rounded-lg hover:bg-primary-400 transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 bg-white/10 rounded-lg hover:bg-primary-400 transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 bg-white/10 rounded-lg hover:bg-primary-400 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 font-arabic">روابط سريعة</h4>
            <ul className="space-y-2">
              {[
                { to: '/products', label: 'المنتجات' },
                { to: '/cart', label: 'السلة' },
                { to: '/wishlist', label: 'المفضلة' },
                { to: '/orders', label: 'طلباتي' },
                { to: '/track-order', label: 'تتبع الطلب' },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm hover:text-primary-400 transition-colors font-arabic"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4 font-arabic">تواصل معنا</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm font-arabic">
                <Mail className="w-4 h-4 text-primary-400 shrink-0" />
                <span>contact@souq.dz</span>
              </li>
              <li className="flex items-center gap-2 text-sm font-arabic">
                <Phone className="w-4 h-4 text-primary-400 shrink-0" />
                <span>+213 555 000 000</span>
              </li>
              <li className="flex items-center gap-2 text-sm font-arabic">
                <MapPin className="w-4 h-4 text-primary-400 shrink-0" />
                <span>الجزائر العاصمة، الجزائر</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-white font-semibold mb-4 font-arabic">النشرة البريدية</h4>
            <p className="text-sm mb-4 font-arabic">اشترك للحصول على آخر العروض والمنتجات الجديدة</p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="بريدك الإلكتروني"
                className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400/30 font-arabic placeholder-gray-500"
              />
              <button
                type="submit"
                disabled={subscribing}
                className="px-4 py-2 bg-primary-400 text-white rounded-xl text-sm hover:bg-primary-500 transition-colors disabled:opacity-50 font-arabic"
              >
                {subscribing ? '...' : 'اشتراك'}
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-6 text-center text-sm font-arabic">
          <p>© {new Date().getFullYear()} سوق - جميع الحقوق محفوظة</p>
        </div>
      </div>
    </footer>
  );
}
