import { useEffect, useState } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Store } from 'lucide-react';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';

export default function AuthPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  
  // Determine mode from query param or pathname
  const getInitialMode = () => {
    const modeParam = searchParams.get('mode');
    if (modeParam) return modeParam;
    return location.pathname.includes('register') ? 'register' : 'login';
  };

  const [mode, setMode] = useState(getInitialMode());

  useEffect(() => {
    setMode(getInitialMode());
  }, [location.pathname, searchParams]);

  const isLogin = mode === 'login';

  const toggleMode = () => {
    setSearchParams({ mode: isLogin ? 'register' : 'login' });
  };

  // Variants for the animation
  const containerVariants = {
    initial: { opacity: 0, x: isLogin ? 20 : -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: isLogin ? -20 : 20 },
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0F0F0F] flex items-center justify-center px-4 py-10 overflow-hidden">
      <div className="w-full max-w-md md:max-w-xl">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-12 h-12 bg-primary-400 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-400/30">
              <Store className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-primary-400 font-arabic">سوق</span>
          </Link>
        </div>

        {/* Animated Container */}
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            variants={containerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="w-full"
          >
            {isLogin ? (
              <LoginForm onToggleMode={toggleMode} />
            ) : (
              <RegisterForm onToggleMode={toggleMode} />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Premium Tab Indicator */}
        <div className="mt-12 flex justify-center">
          <div className="bg-white dark:bg-[#1A1A1A] p-1.5 rounded-2xl border border-gray-100 dark:border-[#2E2E2E] shadow-lg flex items-center gap-1 relative overflow-hidden">
            <button 
              onClick={() => setSearchParams({ mode: 'login' })}
              className={`relative px-6 py-2.5 rounded-xl text-sm font-arabic font-bold transition-colors z-10 ${
                isLogin ? 'text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              تسجيل الدخول
              {isLogin && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary-400 rounded-xl -z-10 shadow-md shadow-primary-400/30"
                />
              )}
              {isLogin && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
                  <motion.span 
                    animate={{ y: [0, -2, 0], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: 0 }}
                    className="w-1 h-1 bg-white rounded-full"
                  />
                  <motion.span 
                    animate={{ y: [0, -2, 0], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
                    className="w-1 h-1 bg-white rounded-full"
                  />
                </div>
              )}
            </button>
            
            <button 
              onClick={() => setSearchParams({ mode: 'register' })}
              className={`relative px-6 py-2.5 rounded-xl text-sm font-arabic font-bold transition-colors z-10 ${
                !isLogin ? 'text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              إنشاء حساب
              {!isLogin && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary-400 rounded-xl -z-10 shadow-md shadow-primary-400/30"
                />
              )}
              {!isLogin && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
                  <motion.span 
                    animate={{ y: [0, -2, 0], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: 0 }}
                    className="w-1 h-1 bg-white rounded-full"
                  />
                  <motion.span 
                    animate={{ y: [0, -2, 0], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
                    className="w-1 h-1 bg-white rounded-full"
                  />
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
