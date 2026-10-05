import { Order } from '../../../core/models';

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

// ── Orders ───────────────────────────────────────────────────────────────
export interface AdminOrder extends Order {
  user_id: number | null;
  guest_email: string | null;
  customer_name: string | null;
  admin_notes: string | null;
  payment_intent_id: string | null;
  shipping_status: string | null;
  updated_at: string | null;
  invoices?: OrderInvoiceRef[];
}

// ── Invoices ─────────────────────────────────────────────────────────────
export type InvoiceType = 'simplified' | 'full' | 'corrective';

export interface OrderInvoiceRef {
  id: number;
  invoice_number: string;
  invoice_type: InvoiceType;
  issued_at: string;
  total: number;
}

export interface AdminInvoice {
  id: number;
  invoice_number: string;
  invoice_type: InvoiceType;
  issued_at: string;
  order_id: number;
  order_number: string | null;
  user_id: number | null;
  buyer_name: string | null;
  buyer_nif: string | null;
  buyer_email: string | null;
  tax_base: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  rectifies_number: string | null;
  pdf_status: 'pending' | 'stored' | 'failed';
  sent_count: number;
  last_sent_at: string | null;
}

export interface AdminInvoiceTotals {
  count: number;
  tax_base: number;
  tax_amount: number;
  total: number;
}

export interface OrderPayments {
  payment_intents: {
    id: number; stripe_payment_intent_id: string; amount: number; currency: string;
    status: string; payment_method_type: string | null; created_at: string;
  }[];
  refunds: {
    id: number; stripe_refund_id: string; amount: number; reason: string | null;
    status: string; created_at: string;
  }[];
}

export interface OrderShipment {
  shipment: null | {
    id: number; localizador: string | null; status: string; service_code: string | null;
    weight_grams: number | null; label_url: string | null; error: string | null;
    correos_tracking_url: string | null; created_at: string; updated_at: string;
    events: { id: number; code: string | null; description: string | null; status: string | null; occurred_at: string | null }[];
  };
}

// ── Users ────────────────────────────────────────────────────────────────
export interface AdminUserRow {
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
  last_login_at: string | null;
  login_count: number;
  total_orders: number;
  total_spent: number;
  order_ids: number[];
}

export interface AdminUserDetail {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  role: 'customer' | 'admin';
  is_active: boolean;
  email_verified: boolean;
  marketing_opt_in: boolean;
  has_password: boolean;
  google_linked: boolean;
  failed_login_attempts: number;
  locked_until: string | null;
  last_login_at: string | null;
  login_count: number;
  created_at: string;
  updated_at: string | null;
  stats: {
    total_orders: number; paid_orders: number; total_spent: number; average_order_value: number;
    first_order_at: string | null; last_order_at: string | null;
    coupons_used: number; total_discount: number; reviews: number;
  };
  addresses: {
    id: number; label: string | null; is_default: boolean; first_name: string; last_name: string;
    street: string; street_2: string | null; city: string; province: string; postal_code: string;
    country: string; phone: string;
  }[];
  orders: {
    id: number; order_number: string; status: string; total: number; discount: number;
    coupon_code: string | null; item_count: number; created_at: string; paid_at: string | null;
  }[];
  coupon_redemptions: {
    id: number; coupon_id: number | null; coupon_code: string; order_id: number;
    order_number: string | null; discount_amount: number; reverted_at: string | null; created_at: string;
  }[];
  reviews: {
    id: number; product_name: string; rating: number; title: string | null; comment: string | null;
    status: string; created_at: string;
  }[];
  cart: AdminCartSummary | null;
  newsletter_lead: { source: string; coupon_code: string | null; created_at: string; converted_at: string | null } | null;
}

export interface AdminUserUpdate {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string | null;
  role?: 'customer' | 'admin';
  is_active?: boolean;
  email_verified?: boolean;
  marketing_opt_in?: boolean;
}

// ── Coupons ──────────────────────────────────────────────────────────────
export interface AdminCoupon {
  id: number;
  code: string;
  description: string | null;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  usage_limit: number | null;
  used_count: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  is_valid: boolean;
  created_at: string;
  redemptions: number;
  unique_customers: number;
  total_discount: number;
  revenue: number;
}

export interface CouponRedemption {
  id: number;
  order_id: number;
  order_number: string | null;
  order_status: string | null;
  order_total: number | null;
  user_id: number | null;
  email: string | null;
  customer_name: string | null;
  discount_amount: number;
  reverted_at: string | null;
  created_at: string;
}

// ── Carts / payments / shipments ─────────────────────────────────────────
export interface AdminCartItem {
  product_name: string;
  format: string | null;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface AdminCartSummary {
  id: number;
  coupon_code: string | null;
  item_count: number;
  subtotal: number;
  created_at: string;
  updated_at: string;
  items: AdminCartItem[];
}

export interface AdminCart extends AdminCartSummary {
  user_id: number | null;
  email: string | null;
  customer_name: string | null;
  is_guest: boolean;
}

export interface AdminPayment {
  id: number;
  order_id: number;
  order_number: string | null;
  order_status: string | null;
  email: string | null;
  stripe_payment_intent_id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method_type: string | null;
  created_at: string;
}

export interface AdminRefund {
  id: number;
  order_id: number | null;
  order_number: string | null;
  stripe_refund_id: string;
  amount: number;
  reason: string | null;
  status: string;
  created_at: string;
}

export interface AdminWebhookEvent {
  id: number;
  stripe_event_id: string;
  event_type: string;
  processed: boolean;
  processed_at: string | null;
  error: string | null;
  created_at: string;
  payload?: unknown;
}

export interface AdminShipment {
  id: number;
  order_id: number;
  order_number: string | null;
  email: string | null;
  localizador: string | null;
  status: string;
  error: string | null;
  last_event: { description: string | null; status: string | null; occurred_at: string | null } | null;
  created_at: string;
  updated_at: string;
}

export interface LowStockVariant {
  variant_id: number;
  product_id: number;
  product_name: string;
  format: string;
  sku: string | null;
  stock: number;
  low_stock_threshold: number;
}

// ── Dashboard ────────────────────────────────────────────────────────────
export interface AdminDashboard {
  total_orders: number;
  pending_orders: number;
  total_revenue: number;
  total_customers: number;
  orders_today: number;
  revenue_today: number;
  orders_period: number;
  revenue_period: number;
  average_order_value: number;
  top_products: { product_name: string; quantity_sold: number; revenue: number }[];
  orders_by_status: Record<string, number>;
  orders_growth: number | null;
  revenue_growth: number | null;
  period_days: number;
  period_start: string | null;
  period_end: string | null;
  paid_orders_period: number;
  new_customers_period: number;
  returning_customer_rate: number | null;
  daily_series: { date: string; orders: number; revenue: number }[];
  top_coupons: { code: string; uses: number; discount: number }[];
  abandoned_carts: number;
  abandoned_carts_value: number;
  low_stock_variants: number;
  pending_reviews: number;
  new_leads_period: { newsletter?: number; pos?: number; contact?: number };
}
