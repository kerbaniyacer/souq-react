import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@souq/components/layout/Layout';

// Eager-loaded (core user paths)
import Home from '@souq/pages/Home';
import Products from '@souq/pages/Products';
import ProductDetail from '@souq/pages/ProductDetail';
import Cart from '@souq/pages/Cart';
import Checkout from '@souq/pages/Checkout';
import Orders from '@souq/pages/Orders';
import OrderDetail from '@souq/pages/OrderDetail';
import Wishlist from '@souq/pages/Wishlist';
import TrackOrder from '@souq/pages/TrackOrder';
import Login from '@souq/pages/auth/Login';
import Register from '@souq/pages/auth/Register';
import Profile from '@souq/pages/auth/Profile';
import CompleteProfile from '@souq/pages/auth/CompleteProfile';
import ForgotPassword from '@souq/pages/auth/ForgotPassword';
import RegistrationSuccess from '@souq/pages/auth/RegistrationSuccess';

// Lazy-loaded (merchant section)
const MerchantDashboard = lazy(() => import('@souq/pages/merchant/MerchantDashboard'));
const MerchantProducts = lazy(() => import('@souq/pages/merchant/MerchantProducts'));
const MerchantProductForm = lazy(() => import('@souq/pages/merchant/MerchantProductForm'));
const MerchantOrders = lazy(() => import('@souq/pages/merchant/MerchantOrders'));

// Lazy-loaded (admin section)
const AdminDashboard = lazy(() => import('@souq/pages/admin/AdminDashboard'));
const AdminUserDetail = lazy(() => import('@souq/pages/admin/AdminUserDetail'));
const EmailGallery = lazy(() => import('@souq/pages/admin/emails/EmailGallery'));
const WelcomeEmail = lazy(() => import('@souq/pages/admin/emails/WelcomeEmail'));
const OtpEmail = lazy(() => import('@souq/pages/admin/emails/OtpEmail'));
const PasswordResetEmail = lazy(() => import('@souq/pages/admin/emails/PasswordResetEmail'));
const PasswordChangedEmail = lazy(() => import('@souq/pages/admin/emails/PasswordChangedEmail'));
const PasswordResetSuccessEmail = lazy(() => import('@souq/pages/admin/emails/PasswordResetSuccessEmail'));
const MerchantOrderEmail = lazy(() => import('@souq/pages/admin/emails/MerchantOrderEmail'));
const SecurityAlertEmail = lazy(() => import('@souq/pages/admin/emails/SecurityAlertEmail'));
const NewsletterEmail = lazy(() => import('@souq/pages/admin/emails/NewsletterEmail'));
const SupportEmail = lazy(() => import('@souq/pages/admin/emails/SupportEmail'));
const BuyerOrderEmail = lazy(() => import('@souq/pages/admin/emails/BuyerOrderEmail'));
const ProductDeletedEmail = lazy(() => import('@souq/pages/admin/emails/ProductDeletedEmail'));
const AccountDeletedEmail = lazy(() => import('@souq/pages/admin/emails/AccountDeletedEmail'));
const ReportNotificationEmail = lazy(() => import('@souq/pages/admin/emails/ReportNotificationEmail'));

import { useAuthStore } from '@souq/stores/authStore';
import { useEffect } from 'react';
import { useCartStore } from '@souq/stores/cartStore';
import { useWishlistStore } from '@souq/stores/wishlistStore';
import ToastContainer from '@souq/components/common/Toast';

function RouteLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-page-bg dark:bg-gray-950">
      <span className="w-10 h-10 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function MerchantRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, profile, profileLoading } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (profileLoading) return <RouteLoader />;
  if (!profile?.is_seller) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, profileLoading } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (profileLoading) return <RouteLoader />;
  if (!user?.is_staff) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  const { isAuthenticated, fetchProfile } = useAuthStore();
  const { fetchCart, resetCart } = useCartStore();
  const { fetchWishlist, resetWishlist } = useWishlistStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
      fetchCart();
      fetchWishlist();
    } else {
      resetCart();
      resetWishlist();
    }
  }, [isAuthenticated, fetchProfile, fetchCart, fetchWishlist, resetCart, resetWishlist]);

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ToastContainer />
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          {/* Auth pages (no layout) */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/complete-profile" element={
            <PrivateRoute><CompleteProfile /></PrivateRoute>
          } />

          {/* Email previews (lazy — admin only) */}
          <Route path="/admin/emails" element={<AdminRoute><EmailGallery /></AdminRoute>} />
          <Route path="/admin/emails/welcome" element={<AdminRoute><WelcomeEmail /></AdminRoute>} />
          <Route path="/admin/emails/otp" element={<AdminRoute><OtpEmail /></AdminRoute>} />
          <Route path="/admin/emails/password-reset" element={<AdminRoute><PasswordResetEmail /></AdminRoute>} />
          <Route path="/admin/emails/password-changed" element={<AdminRoute><PasswordChangedEmail /></AdminRoute>} />
          <Route path="/admin/emails/password-reset-success" element={<AdminRoute><PasswordResetSuccessEmail /></AdminRoute>} />
          <Route path="/admin/emails/merchant-order" element={<AdminRoute><MerchantOrderEmail /></AdminRoute>} />
          <Route path="/admin/emails/security-alert" element={<AdminRoute><SecurityAlertEmail /></AdminRoute>} />
          <Route path="/admin/emails/newsletter" element={<AdminRoute><NewsletterEmail /></AdminRoute>} />
          <Route path="/admin/emails/support" element={<AdminRoute><SupportEmail /></AdminRoute>} />
          <Route path="/admin/emails/buyer-order" element={<AdminRoute><BuyerOrderEmail /></AdminRoute>} />
          <Route path="/admin/emails/product-deleted" element={<AdminRoute><ProductDeletedEmail /></AdminRoute>} />
          <Route path="/admin/emails/account-deleted" element={<AdminRoute><AccountDeletedEmail /></AdminRoute>} />
          <Route path="/admin/emails/report-notification" element={<AdminRoute><ReportNotificationEmail /></AdminRoute>} />

          {/* Main layout */}
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:slug" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/track-order" element={<TrackOrder />} />

            {/* Protected */}
            <Route path="/checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />
            <Route path="/orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
            <Route path="/orders/:id" element={<PrivateRoute><OrderDetail /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/registration-success" element={<PrivateRoute><RegistrationSuccess /></PrivateRoute>} />

            {/* Merchant (lazy) */}
            <Route path="/merchant/dashboard" element={<MerchantRoute><MerchantDashboard /></MerchantRoute>} />
            <Route path="/merchant/products" element={<MerchantRoute><MerchantProducts /></MerchantRoute>} />
            <Route path="/merchant/products/add" element={<MerchantRoute><MerchantProductForm /></MerchantRoute>} />
            <Route path="/merchant/products/:id/edit" element={<MerchantRoute><MerchantProductForm /></MerchantRoute>} />
            <Route path="/merchant/orders" element={<MerchantRoute><MerchantOrders /></MerchantRoute>} />
            <Route path="/merchant/orders/:id" element={<MerchantRoute><OrderDetail /></MerchantRoute>} />

            {/* Admin (lazy) */}
            <Route path="/admin-panel" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/users/:id" element={<AdminRoute><AdminUserDetail /></AdminRoute>} />
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
    </BrowserRouter>
  );
}
