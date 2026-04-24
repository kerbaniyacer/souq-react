import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import BottomNavbar from './BottomNavbar';
import Footer from './Footer';
import ToastContainer from '@shared/components/common/Toast';
import FloatingHelpButton from '@shared/components/common/FloatingHelpButton';
import ScrollToTop from '@shared/components/common/ScrollToTop';
import { useAuthStore } from '@features/auth/stores/authStore';

export default function Layout() {
  const location = useLocation();
  const { isAuthenticated, profile } = useAuthStore();
  const isMerchantBar = isAuthenticated && profile?.is_seller && location.pathname.startsWith('/merchant');

  return (
    <div className="min-h-screen bg-page-bg dark:bg-gray-950 font-arabic transition-colors duration-300">
      <Navbar />
      <main className={`${isMerchantBar ? 'pt-[104px]' : 'pt-16'} pb-20 md:pb-0`}>
        <Outlet />
      </main>
      <Footer />
      <BottomNavbar />
      <ToastContainer />
      <FloatingHelpButton />
      <ScrollToTop />
    </div>
  );
}
