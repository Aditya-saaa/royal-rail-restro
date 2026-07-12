import { api } from './client';
import type {
  BlogPost,
  DashboardStats,
  EventItem,
  FAQ,
  GalleryImage,
  HomePayload,
  MenuItem,
  Category,
  Offer,
  Order,
  Paginated,
  Reservation,
  RestaurantInfo,
  Review,
  TimeSlot,
  TokenResponse,
  User,
} from '@/types';

export const authApi = {
  signup: (data: { email: string; password: string; full_name: string; phone?: string }) =>
    api.post<User>('/auth/signup', data).then((r) => r.data),
  login: (data: { email: string; password: string; remember_me?: boolean }) =>
    api.post<TokenResponse>('/auth/login', data).then((r) => r.data),
  me: () => api.get<User>('/auth/me').then((r) => r.data),
  logout: () => api.post('/auth/logout'),
  updateMe: (data: Partial<User>) => api.patch<User>('/auth/me', data).then((r) => r.data),
  changePassword: (data: { current_password: string; new_password: string }) =>
    api.post('/auth/change-password', data),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, new_password: string) =>
    api.post('/auth/reset-password', { token, new_password }),
};

export const menuApi = {
  categories: (params?: { active_only?: boolean; featured_only?: boolean }) =>
    api.get<Category[]>('/menu/categories', { params }).then((r) => r.data),
  items: (params?: Record<string, unknown>) =>
    api.get<Paginated<MenuItem>>('/menu/items', { params }).then((r) => r.data),
  item: (idOrSlug: string) => api.get<MenuItem>(`/menu/items/${idOrSlug}`).then((r) => r.data),
  featured: () => api.get<MenuItem[]>('/menu/items/featured').then((r) => r.data),
  chefSpecials: () => api.get<MenuItem[]>('/menu/items/chef-specials').then((r) => r.data),
  railSpecials: () => api.get<MenuItem[]>('/menu/items/rail-specials').then((r) => r.data),
  createItem: (data: Partial<MenuItem>) => api.post<MenuItem>('/menu/items', data).then((r) => r.data),
  updateItem: (id: string, data: Partial<MenuItem>) =>
    api.patch<MenuItem>(`/menu/items/${id}`, data).then((r) => r.data),
  deleteItem: (id: string) => api.delete(`/menu/items/${id}`),
  createCategory: (data: Partial<Category>) =>
    api.post<Category>('/menu/categories', data).then((r) => r.data),
  updateCategory: (id: string, data: Partial<Category>) =>
    api.patch<Category>(`/menu/categories/${id}`, data).then((r) => r.data),
};

export const orderApi = {
  preview: (data: unknown) => api.post('/orders/preview', data).then((r) => r.data),
  create: (data: unknown) => api.post<Order>('/orders', data).then((r) => r.data),
  mine: (page = 1) =>
    api.get<Paginated<Order>>('/orders/mine', { params: { page } }).then((r) => r.data),
  track: (orderNumber: string) =>
    api.get<Order>(`/orders/track/${orderNumber}`).then((r) => r.data),
  list: (params?: { status?: string; page?: number }) =>
    api.get<Paginated<Order>>('/orders', { params }).then((r) => r.data),
  updateStatus: (id: string, data: { status: string; cancel_reason?: string }) =>
    api.patch<Order>(`/orders/${id}/status`, data).then((r) => r.data),
  validateCoupon: (code: string, order_amount: number, order_type = 'delivery') =>
    api
      .post('/orders/coupons/validate', { code, order_amount, order_type })
      .then((r) => r.data),
};

export const reservationApi = {
  slots: (date: string) =>
    api.get<TimeSlot[]>('/reservations/slots', { params: { date } }).then((r) => r.data),
  create: (data: unknown) =>
    api.post<Reservation>('/reservations', data).then((r) => r.data),
  mine: (page = 1) =>
    api.get<Paginated<Reservation>>('/reservations/mine', { params: { page } }).then((r) => r.data),
  list: (params?: Record<string, unknown>) =>
    api.get<Paginated<Reservation>>('/reservations', { params }).then((r) => r.data),
  update: (id: string, data: unknown) =>
    api.patch<Reservation>(`/reservations/${id}`, data).then((r) => r.data),
};

export const contentApi = {
  reviews: (params?: { featured_only?: boolean; page?: number }) =>
    api.get<Paginated<Review>>('/reviews', { params }).then((r) => r.data),
  createReview: (data: unknown) => api.post<Review>('/reviews', data).then((r) => r.data),
  gallery: (params?: { category?: string; featured_only?: boolean }) =>
    api.get<GalleryImage[]>('/gallery', { params }).then((r) => r.data),
  blog: (page = 1) =>
    api.get<Paginated<BlogPost>>('/blog', { params: { page } }).then((r) => r.data),
  blogPost: (slug: string) => api.get<BlogPost>(`/blog/${slug}`).then((r) => r.data),
  events: () => api.get<EventItem[]>('/events').then((r) => r.data),
  offers: () => api.get<Offer[]>('/offers').then((r) => r.data),
  contact: (data: unknown) => api.post('/contact', data).then((r) => r.data),
  faqs: (category?: string) =>
    api.get<FAQ[]>('/faqs', { params: { category } }).then((r) => r.data),
};

export const publicApi = {
  restaurant: () => api.get<RestaurantInfo>('/restaurant').then((r) => r.data),
  home: () => api.get<HomePayload>('/home').then((r) => r.data),
  search: (q: string) => api.get('/search', { params: { q } }).then((r) => r.data),
};

export const adminApi = {
  dashboard: () => api.get<DashboardStats>('/admin/dashboard').then((r) => r.data),
  users: (page = 1, search?: string) =>
    api.get<Paginated<User>>('/admin/users', { params: { page, search } }).then((r) => r.data),
  theme: () => api.get<Record<string, string>>('/admin/settings/theme').then((r) => r.data),
  updateTheme: (key: string, value: string) =>
    api.put(`/admin/settings/theme/${key}`, null, { params: { value } }).then((r) => r.data),
  featureFlags: () => api.get('/admin/feature-flags').then((r) => r.data),
  toggleFlag: (key: string, enabled: boolean) =>
    api.patch(`/admin/feature-flags/${key}`, null, { params: { enabled } }).then((r) => r.data),
  health: () => api.get('/admin/health/detailed').then((r) => r.data),
  activityLogs: (page = 1) =>
    api.get('/admin/activity-logs', { params: { page } }).then((r) => r.data),
  siteSettings: () => api.get('/admin/settings/site').then((r) => r.data),
};
