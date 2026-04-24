import { Link, useLocation } from 'react-router-dom';
import { Home, Package, ShoppingCart, Bell, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollDirection } from '@shared/hooks/useScrollDirection';
import { useCartStore } from '@shared/stores/cartStore';
import { useNotificationStore } from '@features/notifications/store/useNotificationStore';
import { useAuthStore } from '@features/auth/stores/authStore';

export default function BottomNavbar() {
  const location = useLocation();
  const scrollDirection = useScrollDirection();
  const { itemsCount } = useCartStore();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const { isAuthenticated } = useAuthStore();

  const cartCount = itemsCount();
  const isHidden = scrollDirection === 'down';

  const navItems = [
    { label: 'الرئيسية', icon: Home, path: '/', id: 'home' },
    { label: 'المنتجات', icon: Package, path: '/products', id: 'products' },
    { label: 'السلة', icon: ShoppingCart, path: '/cart', id: 'cart', badge: cartCount },
    { label: 'الإشعارات', icon: Bell, path: isAuthenticated ? '/notifications' : '/login', id: 'notifications', badge: unreadCount },
    { label: 'حسابي', icon: User, path: isAuthenticated ? '/profile' : '/login', id: 'profile' },
  ];

  return (
    <AnimatePresence>
      <motion.nav
        initial={{ y: 0, opacity: 1 }}
        animate={{ 
          y: isHidden ? 100 : 0,
          opacity: isHidden ? 0 : 1,
          scale: isHidden ? 0.95 : 1,
          filter: isHidden ? 'blur(10px)' : 'blur(0px)'
        }}
        transition={{ 
          type: 'spring', 
          stiffness: 260, 
          damping: 20,
          opacity: { duration: 0.2 }
        }}
        className="fixed bottom-0 left-0 right-0 z-[100] md:hidden px-4 pb-6 pt-2"
      >
        <div className="max-w-md mx-auto bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 rounded-3xl shadow-2xl shadow-black/10 dark:shadow-black/40 flex items-center justify-around p-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.id}
                to={item.path}
                className="relative flex flex-col items-center gap-1 p-2 flex-1 transition-all active:scale-90"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary-100 dark:bg-primary-900/30 rounded-2xl -z-10"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                
                <div className="relative">
                  <Icon 
                    className={`w-6 h-6 transition-colors duration-300 ${
                      isActive 
                        ? 'text-primary-500 dark:text-primary-400' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`} 
                  />
                  
                  {item.badge !== undefined && item.badge > 0 && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white dark:border-gray-900"
                    >
                      {item.badge > 9 ? '9+' : item.badge}
                    </motion.span>
                  )}
                </div>
                
                <span className={`text-[10px] font-arabic font-medium transition-colors duration-300 ${
                  isActive 
                    ? 'text-primary-600 dark:text-primary-400' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </motion.nav>
    </AnimatePresence>
  );
}
