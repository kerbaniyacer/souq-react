import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Heart, User, Menu, X, Search, Store, LayoutDashboard, LogOut, ChevronDown, Package, ClipboardList } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import ThemeToggle from '@/components/common/ThemeToggle';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, profile, isAuthenticated, logout } = useAuthStore();
  const { itemsCount } = useCartStore();
  const navigate = useNavigate();
  const location = useLocation();
  const isMerchantPage = location.pathname.startsWith('/merchant');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setIsOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setUserMenuOpen(false);
  };

  const cartCount = itemsCount();

  return (
    <nav
      className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 dark:bg-[#0F0F0F]/95 backdrop-blur-xl shadow-md shadow-gray-200/60 dark:shadow-black/40 border-b border-gray-200/60 dark:border-white/[0.04]'
          : 'bg-white/80 dark:bg-[#0F0F0F]/75 backdrop-blur-lg border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-primary-300 rounded-xl flex items-center justify-center shadow-lg shadow-primary-400/25 group-hover:shadow-primary-400/40 transition-all">
              <Store className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold font-arabic bg-gradient-to-l from-primary-300 to-primary-400 bg-clip-text text-transparent">
              سوق
            </span>
          </Link>

          {/* Search bar - desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن منتج..."
                className="w-full pr-4 pl-10 py-2.5 rounded-xl border border-gray-200 dark:border-[#2E2E2E] bg-gray-50 dark:bg-[#1E1E1E] text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-400/25 focus:border-primary-400/60 text-sm font-arabic transition-all"
              />
              <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-primary-400 transition-colors">
                <Search className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Right actions */}
          <div className="flex items-center gap-1.5">

            {/* Cart */}
            <Link to="/cart" className="relative w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/[0.04] border border-transparent hover:bg-primary-400/10 hover:border-primary-400/20 text-gray-500 dark:text-gray-400 hover:text-primary-400 dark:hover:text-primary-300 transition-all duration-200">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary-400 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>

            {/* Wishlist */}
            <Link to="/wishlist" className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/[0.04] border border-transparent hover:bg-rose-500/10 hover:border-rose-500/20 text-gray-500 dark:text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 transition-all duration-200">
              <Heart className="w-5 h-5" />
            </Link>

            {/* User menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl bg-gray-100 dark:bg-white/[0.04] border border-gray-200 dark:border-[#2E2E2E] hover:border-primary-400/30 hover:bg-primary-400/5 transition-all duration-200"
                >
                  {profile?.photo ? (
                    <img src={profile.photo} alt="" className="w-7 h-7 rounded-full object-cover ring-1 ring-primary-400/30" />
                  ) : (
                    <div className="w-7 h-7 bg-gradient-to-br from-primary-400/30 to-primary-300/20 rounded-full flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-primary-300" />
                    </div>
                  )}
                  <span className="hidden sm:block text-sm font-arabic text-gray-700 dark:text-gray-300">{user?.first_name || user?.username}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute left-0 top-full mt-2 w-56 bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-xl shadow-gray-200/70 dark:shadow-black/60 border border-gray-200 dark:border-[#2E2E2E] overflow-hidden z-50 animate-slide-down">
                    <div className="p-3.5 border-b border-gray-100 dark:border-[#2E2E2E]">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 font-arabic">{user?.username}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
                    </div>
                    <div className="p-2">
                      {[
                        { to: '/profile', icon: <User className="w-4 h-4" />, label: 'الملف الشخصي' },
                        { to: '/orders', icon: <Package className="w-4 h-4" />, label: 'طلباتي' },
                      ].map((item) => (
                        <Link key={item.to} to={item.to} onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-white/[0.06] font-arabic transition-all">
                          {item.icon}{item.label}
                        </Link>
                      ))}

                      {profile?.is_seller && (
                        <>
                          <div className="mx-2 my-1.5 border-t border-gray-100 dark:border-[#2E2E2E]" />
                          <p className="px-3 py-1 text-[11px] text-gray-400 dark:text-gray-600 font-arabic tracking-wide">لوحة التاجر</p>
                          {[
                            { to: '/merchant/dashboard', icon: <LayoutDashboard className="w-4 h-4" />, label: 'لوحة التحكم' },
                            { to: '/merchant/products', icon: <Package className="w-4 h-4" />, label: 'منتجاتي' },
                            { to: '/merchant/orders', icon: <ClipboardList className="w-4 h-4" />, label: 'إدارة الطلبات' },
                          ].map((item) => (
                            <Link key={item.to} to={item.to} onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-primary-600 dark:text-primary-300 hover:text-primary-700 dark:hover:text-primary-200 hover:bg-primary-50 dark:hover:bg-primary-400/10 font-arabic transition-all">
                              {item.icon}{item.label}
                            </Link>
                          ))}
                        </>
                      )}

                      {user?.is_staff && (
                        <Link to="/admin-panel" onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-white/[0.06] font-arabic transition-all">
                          <LayoutDashboard className="w-4 h-4" />لوحة الإدارة
                        </Link>
                      )}

                      <div className="mx-2 my-1.5 border-t border-gray-100 dark:border-[#2E2E2E]" />
                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 font-arabic transition-all">
                        <LogOut className="w-4 h-4" />تسجيل الخروج
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 font-arabic transition-colors">
                  دخول
                </Link>
                <Link to="/register"
                  className="px-4 py-2 bg-gradient-to-l from-primary-400 to-primary-300 text-white text-sm rounded-xl hover:shadow-lg hover:shadow-primary-400/25 hover:-translate-y-0.5 font-arabic transition-all duration-200">
                  تسجيل
                </Link>
              </div>
            )}

            {/* Theme toggle */}
            <ThemeToggle />

            {/* Mobile toggle */}
            <button onClick={() => setIsOpen(!isOpen)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/[0.04] border border-gray-200 dark:border-[#2E2E2E] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden pb-4 border-t border-gray-200 dark:border-[#2E2E2E] mt-2 animate-slide-down">
            <form onSubmit={handleSearch} className="mt-3 mb-3">
              <div className="relative">
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن منتج..."
                  className="w-full pr-4 pl-10 py-2.5 rounded-xl border border-gray-200 dark:border-[#2E2E2E] bg-gray-50 dark:bg-[#1E1E1E] text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-400/25 text-sm font-arabic" />
                <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"><Search className="w-4 h-4" /></button>
              </div>
            </form>
            <div className="flex flex-col gap-0.5">
              {[
                { to: '/products', label: 'المنتجات' },
                { to: '/cart', label: `السلة (${cartCount})` },
                { to: '/wishlist', label: 'المفضلة' },
              ].map((item) => (
                <Link key={item.to} to={item.to} onClick={() => setIsOpen(false)}
                  className="px-3 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-white/[0.04] rounded-xl font-arabic transition-all">
                  {item.label}
                </Link>
              ))}
              {isAuthenticated && profile?.is_seller && (
                <>
                  <div className="my-1 border-t border-gray-200 dark:border-[#2E2E2E]" />
                  <p className="px-3 py-1 text-xs text-gray-400 dark:text-gray-600 font-arabic">لوحة التاجر</p>
                  {[
                    { to: '/merchant/dashboard', icon: <LayoutDashboard className="w-4 h-4" />, label: 'لوحة التحكم' },
                    { to: '/merchant/products', icon: <Package className="w-4 h-4" />, label: 'منتجاتي' },
                    { to: '/merchant/orders', icon: <ClipboardList className="w-4 h-4" />, label: 'إدارة الطلبات' },
                  ].map((item) => (
                    <Link key={item.to} to={item.to} onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm text-primary-600 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-400/10 rounded-xl font-arabic transition-all">
                      {item.icon}{item.label}
                    </Link>
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Merchant sub-bar */}
      {isAuthenticated && profile?.is_seller && isMerchantPage && (
        <div className="bg-primary-50 dark:bg-primary-400/10 border-t border-primary-200/50 dark:border-primary-400/15 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-2">
              {[
                { to: '/merchant/dashboard', icon: <LayoutDashboard className="w-4 h-4" />, label: 'لوحة التحكم' },
                { to: '/merchant/products', icon: <Package className="w-4 h-4" />, label: 'منتجاتي' },
                { to: '/merchant/orders', icon: <ClipboardList className="w-4 h-4" />, label: 'إدارة الطلبات' },
              ].map((item) => (
                <Link key={item.to} to={item.to}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-arabic whitespace-nowrap transition-all ${
                    location.pathname === item.to || location.pathname.startsWith(item.to + '/')
                      ? 'bg-primary-400/20 text-primary-700 dark:text-primary-200 font-medium'
                      : 'text-primary-600 dark:text-primary-300/70 hover:bg-primary-400/10 hover:text-primary-700 dark:hover:text-primary-200'
                  }`}>
                  {item.icon}{item.label}
                </Link>
              ))}
              <Link to="/merchant/products/add"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-arabic whitespace-nowrap bg-primary-400/20 hover:bg-primary-400/30 text-primary-700 dark:text-primary-200 transition-all mr-auto">
                + منتج جديد
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
