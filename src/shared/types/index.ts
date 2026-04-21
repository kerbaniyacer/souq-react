// ===== AUTH TYPES =====
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  is_staff: boolean;
  date_joined: string;
  role: 'customer' | 'seller' | 'admin';
  provider?: 'local' | 'google' | 'facebook';
  is_onboarded?: boolean;
  photo?: string | null;
}

export interface Profile {
  id: number;
  user_id?: number;
  is_seller: boolean;
  phone: string;
  address: string;
  wilaya: string;
  baladia: string;
  bio: string;
  photo: string | null;
  store_name: string;
  store_description: string;
  store_category: string;
  store_logo: string | null;
  commercial_register: string;
  ccp_number: string;
  ccp_name: string;
  baridimob_id: string;
  seller_rating?: number;
  seller_reviews_count?: number;
  buyer_rating?: number;
  buyer_reviews_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface UserIP {
  id: number;
  user: number;
  ip_address: string;
  last_login: string;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  profile: Profile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password2: string;
  is_seller: boolean;
}

// ===== STORE TYPES =====
export interface Category {
  id: number;
  name: string;
  parent: number | null;
  slug: string;
  logo: string | null;
  is_active: boolean;
  created_at: string;
  products_count?: number;
  subcategories?: Category[];
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  category: number;
  description: string;
  website: string;
  country: string;
  created_at: string;
  updated_at: string;
  products_count?: number;
}

export interface ProductAttribute {
  id: number;
  product: number;
  name: string;
  value: string;
}

export interface VariantImage {
  id: number;
  product: number;
  image: string;
  alt_text: string;
  variants: number[];
  is_main: boolean;
  created_at: string;
}

export interface ProductVariant {
  id: number;
  product_id?: number;
  product_name?: string;
  product_slug?: string;
  product: number;
  name: string;
  sku: string;
  price: number;
  old_price: number | null;
  discount: number;
  stock: number;
  is_active: boolean;
  attributes: Record<string, string>;
  created_at: string;
  is_main: boolean;
  is_in_stock: boolean;
  stock_status: 'high' | 'medium' | 'low' | 'out_of_stock';
  images?: VariantImage[];
}

export interface Product {
  id: number;
  category: Category;
  seller: User;
  name: string;
  slug: string;
  description: string;
  sku: string;
  brand: Brand | null;
  is_active: boolean;
  is_featured: boolean;
  rating: number;
  reviews_count: number;
  sold_count: number;
  created_at: string;
  updated_at: string;
  variants: ProductVariant[];
  attributes: ProductAttribute[];
  images: VariantImage[];
  total_stock: number;
  stock_status: 'high' | 'medium' | 'low' | 'out_of_stock';
  main_image?: string;
}

export interface Review {
  id: number;
  product: number;
  user: number;
  user_name: string;
  user_photo: string | null;
  rating: number;
  comment: string;
  verified: boolean;
  is_visible: boolean;
  official_reply?: {
    user_name: string;
    content: string;
    created_at: string;
  };
  created_at: string;
}

// ===== CART TYPES =====
export interface CartItem {
  id: number;
  cart: number;
  variant: ProductVariant;
  quantity: number;
  created_at: string;
  updated_at: string;
  subtotal: number;
}

export interface Cart {
  id: number;
  user: number | null;
  session_key: string | null;
  created_at: string;
  updated_at: string;
  items: CartItem[];
  total: number;
  items_count: number;
}

// ===== ORDER TYPES =====
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | 'returned';
export type PaymentMethod = 'cod' | 'card' | 'ccp' | 'baridimob' | 'apple_pay';
export type PaymentStatus = 'pending' | 'proof_uploaded' | 'paid' | 'rejected' | 'failed' | 'refunded' | 'cancelled';

export interface PaymentProof {
  id: number;
  seller: number;
  image: string;
  transaction_id: string;
  amount: number | null;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  variant_name: string;
  variant_attributes: Record<string, string>;
  product_price: number;
  quantity: number;
  subtotal: number;
  seller_id: number;
  seller_name: string;
}

export interface Order {
  id: number;
  order_number: string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  // Shipping info — matches OrderSerializer aliases
  full_name: string;
  phone: string;
  address: string;
  wilaya: string;
  baladia: string;
  notes: string;
  subtotal: number;
  shipping_cost: number;
  discount: number;
  total_amount: number;
  tracking_number: string;
  user: number | User;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  proofs: PaymentProof[];
}

export interface CheckoutData {
  full_name: string;
  phone: string;
  email: string;
  address: string;
  wilaya: string;
  baladia: string;
  postal_code: string;
  notes: string;
  payment_method: PaymentMethod;
}

// ===== WISHLIST TYPES =====
/** Matches WishlistItemSerializer: { id, product, created_at } */
export interface WishlistItem {
  id: number;
  product: Product;
  created_at: string;
}

// ===== MISC TYPES =====
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ProductFilters {
  category?: string;
  brand?: string;
  min_price?: number;
  max_price?: number;
  search?: string;
  ordering?: string;
  page?: number;
}

export const WILAYA_CHOICES = [
  'أدرار', 'الشلف', 'الأغواط', 'أم البواقي', 'باتنة', 'بجاية', 'بسكرة', 'بشار',
  'البليدة', 'البويرة', 'تمنراست', 'تبسة', 'تلمسان', 'تيارت', 'تيزي وزو', 'الجزائر',
  'الجلفة', 'جيجل', 'سطيف', 'سعيدة', 'سكيكدة', 'سيدي بلعباس', 'عنابة', 'قالمة',
  'قسنطينة', 'المدية', 'مستغانم', 'المسيلة', 'معسكر', 'ورقلة', 'وهران', 'البيض',
  'إليزي', 'برج بوعريريج', 'بومرداس', 'الطارف', 'تندوف', 'تيسمسيلت', 'الوادي',
  'خنشلة', 'سوق أهراس', 'تيبازة', 'ميلة', 'عين الدفلى', 'النعامة', 'عين تموشنت',
  'غرداية', 'غليزان', 'تيميمون', 'برج باجي مختار', 'أولاد جلال', 'بني عباس',
  'عين صالح', 'عين قزام', 'توقرت', 'جانت', 'المغير', 'المنيعة',
];

export interface Appeal {
  id: number;
  appeal_id: string;
  user_id: number;
  target_type: 'account' | 'product';
  target_id: number;
  target_name?: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_response?: string;
  created_at: string;
  reviewed_at?: string;
}

export interface MerchantStats {
  revenue: number;
  orders_count: number;
  products_count: number;
  pending_orders: number;
  sales_history: { date: string; revenue: number; orders: number }[];
  top_products: { id: number; name: string; sales: number; revenue: number }[];
}
