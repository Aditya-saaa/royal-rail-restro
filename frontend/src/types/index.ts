export interface User {
  id: string;
  email: string;
  phone?: string | null;
  full_name: string;
  avatar_url?: string | null;
  is_active: boolean;
  is_verified: boolean;
  is_superuser: boolean;
  last_login?: string | null;
  roles: { id: string; name: string; description?: string | null }[];
  created_at?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  icon?: string | null;
  sort_order: number;
  is_active: boolean;
  is_featured: boolean;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description?: string | null;
  short_description?: string | null;
  price: number;
  compare_at_price?: number | null;
  image_url?: string | null;
  is_veg: boolean;
  spice_level: number;
  is_available: boolean;
  is_featured: boolean;
  is_chef_special: boolean;
  is_seasonal: boolean;
  is_rail_special: boolean;
  preparation_time_mins: number;
  calories?: number | null;
  allergens?: string | null;
  recommended_pairing?: string | null;
  tags?: string | null;
  rating_avg: number;
  rating_count: number;
  category?: { id: string; name: string; slug: string } | null;
}

export interface CartItem {
  menu_item: MenuItem;
  quantity: number;
  special_notes?: string;
}

export interface OrderItem {
  id: string;
  menu_item_id?: string | null;
  name: string;
  is_veg: boolean;
  unit_price: number;
  quantity: number;
  line_total: number;
  special_notes?: string | null;
}

export interface Order {
  id: string;
  order_number: string;
  order_type: string;
  status: string;
  payment_status: string;
  payment_method?: string | null;
  subtotal: number;
  discount_amount: number;
  delivery_fee: number;
  gst_amount: number;
  packing_fee: number;
  total_amount: number;
  coupon_code?: string | null;
  delivery_address?: string | null;
  special_instructions?: string | null;
  tracking_status?: string | null;
  invoice_number?: string | null;
  items: OrderItem[];
  created_at?: string;
}

export interface Reservation {
  id: string;
  reservation_number: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  reservation_date: string;
  reservation_time: string;
  guest_count: number;
  special_requests?: string | null;
  occasion?: string | null;
  status: string;
  table_number?: string | null;
  created_at?: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  remaining_capacity: number;
}

export interface Offer {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  discount_label?: string | null;
  coupon_code?: string | null;
  is_active: boolean;
  is_featured: boolean;
}

export interface Review {
  id: string;
  guest_name?: string | null;
  rating: number;
  title?: string | null;
  comment?: string | null;
  is_approved: boolean;
  is_featured: boolean;
  created_at?: string;
}

export interface GalleryImage {
  id: string;
  title: string;
  image_url: string;
  alt_text: string;
  category: string;
  is_featured: boolean;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  cover_image?: string | null;
  tags?: string | null;
  status: string;
  published_at?: string | null;
  views: number;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface EventItem {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  event_date: string;
  start_time?: string | null;
  end_time?: string | null;
  location: string;
}

export interface PaginationMeta {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface HomePayload {
  featured_dishes: MenuItem[];
  chef_specials: MenuItem[];
  rail_specials: MenuItem[];
  categories: Category[];
  offers: Offer[];
  testimonials: Review[];
  gallery: GalleryImage[];
  stats: {
    happy_customers: string;
    dishes: string;
    years: string;
    rating: string;
  };
}

export interface DashboardStats {
  total_orders: number;
  today_orders: number;
  total_revenue: number;
  month_revenue: number;
  total_users: number;
  new_users_week: number;
  pending_reservations: number;
  today_reservations: number;
  pending_reviews: number;
  new_messages: number;
  orders_by_status: Record<string, number>;
  revenue_series: { date: string; revenue: number }[];
}

export interface RestaurantInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
  latitude: number;
  longitude: number;
  currency: string;
  gst_percent: number;
  cuisines: string[];
  hours: Record<string, string>;
  features: string[];
}
