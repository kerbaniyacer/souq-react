import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import FloatingHelpButton from '@/components/common/FloatingHelpButton';
import { useAuthStore } from '@/stores/authStore';

export default function Layout() {
  const location = useLocation();
  const { isAuthenticated, profile } = useAuthStore();
  // إذا كان التاجر في صفحات المرتجر يضاف ارتفاع شريط التاجر (40px)
  const isMerchantBar = isAuthenticated && profile?.is_seller && location.pathname.startsWith('/merchant');

  return (
    <div className="min-h-screen font-arabic bg-gray-50 dark:bg-[#0F0F0F]">
      <Navbar />
      <main className={isMerchantBar ? 'pt-[104px]' : 'pt-16'}>
        <Outlet />
      </main>
      <Footer />
      <FloatingHelpButton />
    </div>
  );
}
