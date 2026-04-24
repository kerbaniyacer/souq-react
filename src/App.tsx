import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { refreshAccessToken } from '@features/auth/services/authService';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import Layout from '@shared/components/layout/Layout';

/** Scrolls to top on every route change */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [pathname]);
  return null;
}

// Eager-loaded (core user paths)
import Home from '@features/products/pages/Home';
import Products from '@features/products/pages/Products';
import ProductDetail from '@features/products/pages/ProductDetail';
import Cart from '@features/cart/pages/Cart';
import Checkout from '@features/cart/pages/Checkout';
import Orders from '@features/orders/pages/Orders';
import OrderDetail from '@features/orders/pages/OrderDetail';
import OrderReview from '@features/orders/pages/OrderReview';
import Wishlist from '@features/products/pages/Wishlist';
import TrackOrder from '@features/orders/pages/TrackOrder';
import AuthPage from '@features/auth/pages/AuthPage';
import Profile from '@features/auth/pages/Profile';
import CompleteProfile from '@features/auth/pages/CompleteProfile';
import ForgotPassword from '@features/auth/pages/ForgotPassword';
import ResetPassword from '@features/auth/pages/ResetPassword';
import AccountSuspended from '@features/auth/pages/AccountSuspended';
import RegistrationSuccess from '@features/auth/pages/RegistrationSuccess';
import AppealForm from '@features/auth/pages/AppealForm';
import MyAppeals from '@features/auth/pages/MyAppeals';
import UserProfile from '@features/accounts/pages/UserProfile';
import PrivacyPolicy from '@features/legal/pages/PrivacyPolicy';
import TermsOfService from '@features/legal/pages/TermsOfService';

// Lazy-loaded (merchant section)
const MerchantDashboard = lazy(() => import('@features/merchant/pages/MerchantDashboard'));
const MerchantProducts = lazy(() => import('@features/merchant/pages/MerchantProducts'));
const MerchantProductForm = lazy(() => import('@features/merchant/pages/MerchantProductForm'));
const MerchantOrders = lazy(() => import('@features/merchant/pages/MerchantOrders'));
const MerchantOrderDetail = lazy(() => import('@features/merchant/pages/MerchantOrderDetail'));
const MerchantSuspendedProducts = lazy(() => import('@features/merchant/pages/MerchantSuspendedProducts'));
const Chat = lazy(() => import('@features/chat/pages/Chat'));

// Lazy-loaded (admin section)
const AdminDashboard = lazy(() => import('@features/admin/pages/AdminDashboard'));
const AdminUserDetail = lazy(() => import('@features/admin/pages/AdminUserDetail'));
const AdminAppeals = lazy(() => import('@features/admin/pages/AdminAppeals'));
const EmailGallery = lazy(() => import('@features/admin/pages/emails/EmailGallery'));
const WelcomeEmail = lazy(() => import('@features/admin/pages/emails/WelcomeEmail'));
const OtpEmail = lazy(() => import('@features/admin/pages/emails/OtpEmail'));
const PasswordResetEmail = lazy(() => import('@features/admin/pages/emails/PasswordResetEmail'));
const PasswordChangedEmail = lazy(() => import('@features/admin/pages/emails/PasswordChangedEmail'));
const PasswordResetSuccessEmail = lazy(() => import('@features/admin/pages/emails/PasswordResetSuccessEmail'));
const MerchantOrderEmail = lazy(() => import('@features/admin/pages/emails/MerchantOrderEmail'));
const SecurityAlertEmail = lazy(() => import('@features/admin/pages/emails/SecurityAlertEmail'));
const NewsletterEmail = lazy(() => import('@features/admin/pages/emails/NewsletterEmail'));
const SupportEmail = lazy(() => import('@features/admin/pages/emails/SupportEmail'));
const BuyerOrderEmail = lazy(() => import('@features/admin/pages/emails/BuyerOrderEmail'));
const ProductDeletedEmail = lazy(() => import('@features/admin/pages/emails/ProductDeletedEmail'));
const AccountDeletedEmail = lazy(() => import('./features/admin/pages/emails/AccountDeletedEmail'));
const ReportNotificationEmail = lazy(() => import('./features/admin/pages/emails/ReportNotificationEmail'));
const AppealDecisionEmail = lazy(() => import('./features/admin/pages/emails/AppealDecisionEmail'));
const VisibilityChangeEmail = lazy(() => import('./features/admin/pages/emails/VisibilityChangeEmail'));
const AdminActionEmail = lazy(() => import('./features/admin/pages/emails/AdminActionEmail'));

import { useAuthStore } from '@features/auth/stores/authStore';
import { useCartStore } from '@shared/stores/cartStore';
import { useWishlistStore } from '@shared/stores/wishlistStore';
import ToastContainer from '@shared/components/common/Toast';
import OnboardingGuard from '@features/auth/components/OnboardingGuard';
import { useHeartbeat } from '@shared/hooks/useHeartbeat';

function RouteLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-page-bg dark:bg-gray-950">
      <span className="w-10 h-10 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function PrivateRoute({ children, authReady }: { children: React.ReactNode; authReady: boolean }) {
  const { isAuthenticated } = useAuthStore();
  if (!authReady) return <RouteLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function MerchantRoute({ children, authReady }: { children: React.ReactNode; authReady: boolean }) {
  const { isAuthenticated, profile, profileLoading } = useAuthStore();
  if (!authReady) return <RouteLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (profileLoading) return <RouteLoader />;
  if (!profile?.is_seller) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AdminRoute({ children, authReady }: { children: React.ReactNode; authReady: boolean }) {
  const { isAuthenticated, user, profileLoading } = useAuthStore();
  if (!authReady) return <RouteLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (profileLoading) return <RouteLoader />;
  if (!user?.is_staff) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const logout = useAuthStore((s) => s.logout);
  const { fetchCart, resetCart } = useCartStore();
  const { fetchWishlist, resetWishlist } = useWishlistStore();
  const hasBootstrappedAuth = useRef(false);
  const [authReady, setAuthReady] = useState(false);
  useHeartbeat();

  // 1. Boot effect: hydrate auth once before protected bootstrap fetches.
  useEffect(() => {
    let isMounted = true;

    const bootAuth = async () => {
      // Use persisted user data (not isAuthenticated) to decide if a silent refresh is needed.
      // isAuthenticated is always false on page reload since accessToken is memory-only.
      const storedUser = useAuthStore.getState().user;

      if (!storedUser) {
        // No stored session — user is genuinely logged out.
        hasBootstrappedAuth.current = true;
        if (isMounted) setAuthReady(true);
        return;
      }

      if (!hasBootstrappedAuth.current) {
        if (isMounted) setAuthReady(false);
        console.log('[AuthBoot] Stored user found — attempting silent refresh...');
        try {
          await refreshAccessToken();
          console.log('[AuthBoot] Silent refresh successful.');
        } catch (err) {
          console.error('[AuthBoot] Silent refresh failed — logging out:', err);
          if (isMounted) {
            await logout();
          }
        } finally {
          hasBootstrappedAuth.current = true;
          if (isMounted) setAuthReady(true);
        }
        return;
      }

      if (isMounted) setAuthReady(true);
    };

    void bootAuth();
    return () => { isMounted = false; };
  }, [isAuthenticated, logout]);

  // 2. Data fetching effect: only after auth bootstrap completes.
  useEffect(() => {
    if (!authReady) return;

    if (isAuthenticated && accessToken) {
      fetchProfile();
      fetchCart();
      fetchWishlist();
    } else if (!isAuthenticated) {
      resetCart();
      resetWishlist();
    }
  }, [authReady, isAuthenticated, accessToken, fetchProfile, fetchCart, fetchWishlist, resetCart, resetWishlist]);

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ScrollToTop />
      <ToastContainer />
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          {/* Auth pages (no layout) */}
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/account-suspended" element={<AccountSuspended />} />
          <Route path="/complete-profile" element={<CompleteProfile />} />

          {/* Legal pages (no layout) */}
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />

          {/* Email previews (lazy — admin only) */}
          <Route path="/admin/emails" element={<AdminRoute authReady={authReady}><EmailGallery /></AdminRoute>} />
          <Route path="/admin/emails/welcome" element={<AdminRoute authReady={authReady}><WelcomeEmail /></AdminRoute>} />
          <Route path="/admin/emails/otp" element={<AdminRoute authReady={authReady}><OtpEmail /></AdminRoute>} />
          <Route path="/admin/emails/password-reset" element={<AdminRoute authReady={authReady}><PasswordResetEmail /></AdminRoute>} />
          <Route path="/admin/emails/password-changed" element={<AdminRoute authReady={authReady}><PasswordChangedEmail /></AdminRoute>} />
          <Route path="/admin/emails/password-reset-success" element={<AdminRoute authReady={authReady}><PasswordResetSuccessEmail /></AdminRoute>} />
          <Route path="/admin/emails/merchant-order" element={<AdminRoute authReady={authReady}><MerchantOrderEmail /></AdminRoute>} />
          <Route path="/admin/emails/security-alert" element={<AdminRoute authReady={authReady}><SecurityAlertEmail /></AdminRoute>} />
          <Route path="/admin/emails/newsletter" element={<AdminRoute authReady={authReady}><NewsletterEmail /></AdminRoute>} />
          <Route path="/admin/emails/support" element={<AdminRoute authReady={authReady}><SupportEmail /></AdminRoute>} />
          <Route path="/admin/emails/buyer-order" element={<AdminRoute authReady={authReady}><BuyerOrderEmail /></AdminRoute>} />
          <Route path="/admin/emails/product-deleted" element={<AdminRoute authReady={authReady}><ProductDeletedEmail /></AdminRoute>} />
          <Route path="/admin/emails/account-deleted" element={<AdminRoute authReady={authReady}><AccountDeletedEmail /></AdminRoute>} />
          <Route path="/admin/emails/report-notification" element={<AdminRoute authReady={authReady}><ReportNotificationEmail /></AdminRoute>} />
          <Route path="/admin/emails/appeal-decision" element={<AdminRoute authReady={authReady}><AppealDecisionEmail /></AdminRoute>} />
          <Route path="/admin/emails/visibility-change" element={<AdminRoute authReady={authReady}><VisibilityChangeEmail /></AdminRoute>} />
          <Route path="/admin/emails/admin-action" element={<AdminRoute authReady={authReady}><AdminActionEmail /></AdminRoute>} />

          {/* Main layout */}
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:slug" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/track-order" element={<TrackOrder />} />

            {/* Protected */}
            <Route path="/checkout" element={<PrivateRoute authReady={authReady}><OnboardingGuard><Checkout /></OnboardingGuard></PrivateRoute>} />
            <Route path="/orders" element={<PrivateRoute authReady={authReady}><OnboardingGuard><Orders /></OnboardingGuard></PrivateRoute>} />
            <Route path="/orders/:id" element={<PrivateRoute authReady={authReady}><OnboardingGuard><OrderDetail /></OnboardingGuard></PrivateRoute>} />
            <Route path="/orders/:id/review" element={<PrivateRoute authReady={authReady}><OnboardingGuard><OrderReview /></OnboardingGuard></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute authReady={authReady}><OnboardingGuard><Profile /></OnboardingGuard></PrivateRoute>} />
            <Route path="/profile/:username" element={<UserProfile />} />
            <Route path="/chat" element={<PrivateRoute authReady={authReady}><OnboardingGuard><Chat /></OnboardingGuard></PrivateRoute>} />
            <Route path="/registration-success" element={<PrivateRoute authReady={authReady}><RegistrationSuccess /></PrivateRoute>} />

            {/* Appeals */}
            <Route path="/appeals/new" element={<PrivateRoute authReady={authReady}><OnboardingGuard><AppealForm /></OnboardingGuard></PrivateRoute>} />
            <Route path="/appeals/list" element={<PrivateRoute authReady={authReady}><OnboardingGuard><MyAppeals /></OnboardingGuard></PrivateRoute>} />

            {/* Merchant (lazy) */}
            <Route path="/merchant/dashboard" element={<MerchantRoute authReady={authReady}><OnboardingGuard><MerchantDashboard /></OnboardingGuard></MerchantRoute>} />
            <Route path="/merchant/products" element={<MerchantRoute authReady={authReady}><OnboardingGuard><MerchantProducts /></OnboardingGuard></MerchantRoute>} />
            <Route path="/merchant/products/add" element={<MerchantRoute authReady={authReady}><OnboardingGuard><MerchantProductForm /></OnboardingGuard></MerchantRoute>} />
            <Route path="/merchant/products/:id/edit" element={<MerchantRoute authReady={authReady}><OnboardingGuard><MerchantProductForm /></OnboardingGuard></MerchantRoute>} />
            <Route path="/merchant/orders" element={<MerchantRoute authReady={authReady}><OnboardingGuard><MerchantOrders /></OnboardingGuard></MerchantRoute>} />
            <Route path="/merchant/orders/:id" element={<MerchantRoute authReady={authReady}><OnboardingGuard><MerchantOrderDetail /></OnboardingGuard></MerchantRoute>} />
            <Route path="/merchant/products/suspended" element={<MerchantRoute authReady={authReady}><OnboardingGuard><MerchantSuspendedProducts /></OnboardingGuard></MerchantRoute>} />

            {/* Admin (lazy) */}
            <Route path="/admin-panel" element={<AdminRoute authReady={authReady}><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/users/:id" element={<AdminRoute authReady={authReady}><AdminUserDetail /></AdminRoute>} />
            <Route path="/admin/appeals" element={<AdminRoute authReady={authReady}><AdminAppeals /></AdminRoute>} />
          </Route>

          {/* 404 */}
          <Route path="*" element={
            <div className="min-h-screen bg-page-bg dark:bg-gray-950 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-200 dark:text-gray-700 mb-4">404</h1>
                <p className="text-xl text-gray-600 dark:text-gray-400 font-arabic mb-6">الصفحة غير موجودة</p>
                <a href="/" className="px-6 py-3 bg-primary-400 text-white rounded-xl font-arabic hover:bg-primary-500 transition-colors">
                  العودة للرئيسية
                </a>
              </div>
            </div>
          } />
        </Routes>
      </Suspense>
      {user?.is_staff && <ReactQueryDevtools initialIsOpen={false} />}
    </BrowserRouter>
  );
}
