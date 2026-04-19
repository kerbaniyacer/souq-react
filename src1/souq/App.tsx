import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@souq/components/layout/Layout';
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
import MerchantDashboard from '@souq/pages/merchant/MerchantDashboard';
import MerchantProducts from '@souq/pages/merchant/MerchantProducts';
import MerchantProductForm from '@souq/pages/merchant/MerchantProductForm';
import MerchantOrders from '@souq/pages/merchant/MerchantOrders';
import AdminDashboard from '@souq/pages/admin/AdminDashboard';
import AdminUserDetail from '@souq/pages/admin/AdminUserDetail';
import CompleteProfile from '@souq/pages/auth/CompleteProfile';
import ForgotPassword from '@souq/pages/auth/ForgotPassword';
import RegistrationSuccess from '@souq/pages/auth/RegistrationSuccess';
import EmailGallery from '@souq/pages/admin/emails/EmailGallery';
import WelcomeEmail from '@souq/pages/admin/emails/WelcomeEmail';
import OtpEmail from '@souq/pages/admin/emails/OtpEmail';
import PasswordResetEmail from '@souq/pages/admin/emails/PasswordResetEmail';
import PasswordChangedEmail from '@souq/pages/admin/emails/PasswordChangedEmail';
import PasswordResetSuccessEmail from '@souq/pages/admin/emails/PasswordResetSuccessEmail';
import MerchantOrderEmail from '@souq/pages/admin/emails/MerchantOrderEmail';
import SecurityAlertEmail from '@souq/pages/admin/emails/SecurityAlertEmail';
import NewsletterEmail from '@souq/pages/admin/emails/NewsletterEmail';
import SupportEmail from '@souq/pages/admin/emails/SupportEmail';
import { useAuthStore } from '@souq/stores/authStore';
import { useEffect } from 'react';
import { useCartStore } from '@souq/stores/cartStore';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RouteLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-page-bg dark:bg-gray-950">
      <span className="w-10 h-10 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
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
  const { fetchCart } = useCartStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
    }
    fetchCart();
  }, [isAuthenticated, fetchProfile, fetchCart]);

  return (
    <HashRouter>
      <Routes>
        {/* Auth pages (no layout) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/complete-profile" element={
          <PrivateRoute><CompleteProfile /></PrivateRoute>
        } />

        {/* Email previews (no layout — standalone) */}
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

        {/* Main layout */}
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:slug" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/track-order" element={<TrackOrder />} />

          {/* Protected */}
          <Route path="/checkout" element={
            <PrivateRoute><Checkout /></PrivateRoute>
          } />
          <Route path="/orders" element={
            <PrivateRoute><Orders /></PrivateRoute>
          } />
          <Route path="/orders/:id" element={
            <PrivateRoute><OrderDetail /></PrivateRoute>
          } />
          <Route path="/profile" element={
            <PrivateRoute><Profile /></PrivateRoute>
          } />

          {/* Merchant */}
          <Route path="/merchant/dashboard" element={
            <MerchantRoute><MerchantDashboard /></MerchantRoute>
          } />
          <Route path="/merchant/products" element={
            <MerchantRoute><MerchantProducts /></MerchantRoute>
          } />
          <Route path="/merchant/products/add" element={
            <MerchantRoute><MerchantProductForm /></MerchantRoute>
          } />
          <Route path="/merchant/products/:id/edit" element={
            <MerchantRoute><MerchantProductForm /></MerchantRoute>
          } />
          <Route path="/merchant/orders" element={
            <MerchantRoute><MerchantOrders /></MerchantRoute>
          } />
          <Route path="/merchant/orders/:id" element={
            <MerchantRoute><OrderDetail /></MerchantRoute>
          } />

          {/* Admin */}
          <Route path="/admin-panel" element={
            <AdminRoute><AdminDashboard /></AdminRoute>
          } />
          <Route path="/admin/users/:id" element={
            <AdminRoute><AdminUserDetail /></AdminRoute>
          } />

          {/* Registration success */}
          <Route path="/registration-success" element={
            <PrivateRoute><RegistrationSuccess /></PrivateRoute>
          } />
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
    </HashRouter>
  );
}
