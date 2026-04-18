import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import Home from '@/pages/Home';
import Products from '@/pages/Products';
import ProductDetail from '@/pages/ProductDetail';
import Cart from '@/pages/Cart';
import Checkout from '@/pages/Checkout';
import Orders from '@/pages/Orders';
import OrderDetail from '@/pages/OrderDetail';
import Wishlist from '@/pages/Wishlist';
import TrackOrder from '@/pages/TrackOrder';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import Profile from '@/pages/auth/Profile';
import MerchantDashboard from '@/pages/merchant/MerchantDashboard';
import MerchantProducts from '@/pages/merchant/MerchantProducts';
import MerchantProductForm from '@/pages/merchant/MerchantProductForm';
import MerchantOrders from '@/pages/merchant/MerchantOrders';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import { useAuthStore } from '@/stores/authStore';
import { useEffect } from 'react';
import { useCartStore } from '@/stores/cartStore';

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
    <BrowserRouter>
      <Routes>
        {/* Auth pages (no layout) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

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

          {/* Admin */}
          <Route path="/admin-panel" element={
            <AdminRoute><AdminDashboard /></AdminRoute>
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
    </BrowserRouter>
  );
}
