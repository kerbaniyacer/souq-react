import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import ToastContainer from '@shared/components/common/Toast';
import FloatingHelpButton from '@shared/components/common/FloatingHelpButton';
import ScrollToTop from '@shared/components/common/ScrollToTop';
import { useAuthStore } from '@features/auth/stores/authStore';
import { hasStore } from '@shared/types';

export default function Layout() {
  const location = useLocation();
  const { isAuthenticated, user } = useAuthStore();
  const isMerchantBar = isAuthenticated && hasStore(user) && location.pathname.startsWith('/merchant');

  return (
    <div className="min-h-screen bg-page-bg dark:bg-gray-950 font-arabic transition-colors duration-300">
      <Navbar />
      <main className={isMerchantBar ? 'pt-[104px]' : 'pt-16'}>
        <Outlet />
      </main>
      <Footer />
      <ToastContainer />
      <FloatingHelpButton />
      <ScrollToTop />
    </div>
  );
}
