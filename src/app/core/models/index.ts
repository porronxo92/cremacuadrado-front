// Product interfaces
export interface Product {
  id: number;
  sku: string | null;
  slug: string;
  name: string;
  short_description: string | null;
  description: string | null;
  price: number;
  compare_price: number | null;
  stock: number;
  weight: number | null;
  is_active: boolean;
  is_featured: boolean;
  is_in_stock: boolean;
  is_low_stock: boolean;
  category: Category | null;
  images: ProductImage[];
  nutrition: ProductNutrition | null;
  average_rating: number | null;
  review_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProductListItem {
  id: number;
  sku: string | null;
  slug: string;
  name: string;
  short_description: string | null;
  price: number;
  compare_price: number | null;
  is_in_stock: boolean;
  is_low_stock: boolean;
  is_featured: boolean;
  primary_image: string | null;
  category_slug: string | null;
  average_rating: number | null;
  review_count: number;
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  parent_id: number | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface ProductImage {
  id: number;
  url: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
}

export interface ProductNutrition {
  energy_kcal: number | null;
  energy_kj: number | null;
  fat: number | null;
  saturated_fat: number | null;
  carbohydrates: number | null;
  sugars: number | null;
  fiber: number | null;
  proteins: number | null;
  salt: number | null;
}

export interface Review {
  id: number;
  rating: number;
  title: string | null;
  comment: string | null;
  user_id: number | null;
  user_name: string | null;
  is_verified_purchase: boolean;
  status: string;
  created_at: string;
}

// User interfaces
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  role: 'customer' | 'admin';
  is_active: boolean;
  email_verified: boolean;
  marketing_opt_in: boolean;
  created_at: string;
}

export interface Address {
  id: number;
  label: string | null;
  first_name: string;
  last_name: string;
  street: string;
  street_2: string | null;
  city: string;
  province: string;
  postal_code: string;
  country: string;
  phone: string;
  is_default: boolean;
  created_at: string;
}

export interface AddressInput {
  first_name: string;
  last_name: string;
  street: string;
  street_2?: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
  phone: string;
}

// Cart interfaces
export interface Cart {
  id: number;
  item_count: number;
  items: CartItem[];
  subtotal: number;
  coupon: CouponInfo | null;
  discount: number;
  shipping_cost: number;
  shipping_message: string | null;
  total: number;
  updated_at: string;
}

export interface CartItem {
  id: number;
  product_id: number;
  product_name: string;
  product_slug: string;
  product_image: string | null;
  product_price: number;
  quantity: number;
  price_at_add: number;
  total: number;
  is_available: boolean;
  stock_available: number;
}

export interface CouponInfo {
  code: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  discount_amount: number;
}

// Order interfaces
export interface Order {
  id: number;
  order_number: string;
  status: OrderStatus;
  subtotal: number;
  shipping_cost: number;
  discount: number;
  coupon_code: string | null;
  tax: number;
  total: number;
  shipping_address: AddressInput;
  billing_address: AddressInput | null;
  payment_method: string | null;
  tracking_number: string | null;
  customer_notes: string | null;
  items: OrderItem[];
  item_count: number;
  created_at: string;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
}

export interface OrderItem {
  id: number;
  product_id: number | null;
  product_name: string;
  product_sku: string | null;
  product_image_url: string | null;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface OrderListItem {
  id: number;
  order_number: string;
  status: OrderStatus;
  total: number;
  item_count: number;
  created_at: string;
}

export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

// Checkout interfaces
export interface CheckoutData {
  shipping_address: AddressInput;
  billing_address?: AddressInput;
  same_billing_address: boolean;
  guest_email?: string;
  customer_notes?: string;
  save_address: boolean;
  coupon_code?: string;
}

export interface CheckoutValidation {
  is_valid: boolean;
  errors: string[];
  subtotal: number;
  shipping_cost: number;
  discount: number;
  tax: number;
  total: number;
}

export interface PaymentIntent {
  payment_intent_id: string;
  client_secret: string;
  amount: number;
  currency: string;
}

// Blog interfaces
export interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  author_name: string | null;
  featured_image_url: string | null;
  status: string;
  categories: BlogCategory[];
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BlogPostListItem {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  featured_image_url: string | null;
  categories: BlogCategory[];
  published_at: string | null;
}

export interface BlogCategory {
  id: number;
  slug: string;
  name: string;
  description: string | null;
}

// Auth interfaces
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// API response interfaces
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ApiMessage {
  message: string;
}

// Admin interfaces
export interface DashboardStats {
  orders_today: number;
  revenue_today: number;
  orders_period: number;
  revenue_period: number;
  average_order_value: number;
  top_products: TopProduct[];
  orders_by_status: Record<string, number>;
  orders_growth: number | null;
  revenue_growth: number | null;
}

export interface TopProduct {
  product_name: string;
  quantity_sold: number;
  revenue: number;
}
