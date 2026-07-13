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
  createItem: (data: Partial<MenuItem> & Record<string, unknown>) =>
    api.post<MenuItem>('/menu/items', data).then((r) => r.data),
  updateItem: (id: string, data: Partial<MenuItem> & Record<string, unknown>) =>
    api.patch<MenuItem>(`/menu/items/${id}`, data).then((r) => r.data),
  deleteItem: (id: string) => api.delete(`/menu/items/${id}`),
  createCategory: (data: Partial<Category>) =>
    api.post<Category>('/menu/categories', data).then((r) => r.data),
  updateCategory: (id: string, data: Partial<Category>) =>
    api.patch<Category>(`/menu/categories/${id}`, data).then((r) => r.data),
  deleteCategory: (id: string) => api.delete(`/menu/categories/${id}`),
  // Admin bulk
  bulkDelete: (ids: string[]) => api.post('/menu/admin/bulk/delete', { ids }),
  bulkAvailability: (ids: string[], is_available: boolean) =>
    api.post('/menu/admin/bulk/availability', { ids, is_available }),
  bulkCategory: (ids: string[], category_id: string) =>
    api.post('/menu/admin/bulk/category', { ids, category_id }),
  bulkPrice: (ids: string[], mode: string, value: number) =>
    api.post('/menu/admin/bulk/price', { ids, mode, value }),
  bulkFlags: (ids: string[], flags: Record<string, boolean>) =>
    api.post('/menu/admin/bulk/flags', { ids, ...flags }),
  sortItems: (items: { id: string; sort_order: number }[]) =>
    api.post('/menu/admin/sort', { items }),
  duplicateItem: (id: string) => api.post<MenuItem>(`/menu/admin/items/${id}/duplicate`, {}),
  archiveItem: (id: string) => api.post<MenuItem>(`/menu/admin/items/${id}/archive`),
  restoreItem: (id: string) => api.post<MenuItem>(`/menu/admin/items/${id}/restore`),
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
  reviewsAdmin: (params?: { page?: number; approved_only?: boolean }) =>
    api.get<Paginated<Review>>('/reviews/admin', { params }).then((r) => r.data),
  createReview: (data: unknown) => api.post<Review>('/reviews', data).then((r) => r.data),
  approveReview: (id: string, featured = false) =>
    api.patch(`/reviews/${id}/approve`, null, { params: { featured } }).then((r) => r.data),
  rejectReview: (id: string) => api.patch(`/reviews/${id}/reject`).then((r) => r.data),
  replyReview: (id: string, reply: string) =>
    api.patch(`/reviews/${id}/reply`, null, { params: { reply } }).then((r) => r.data),
  deleteReview: (id: string) => api.delete(`/reviews/${id}`),
  gallery: (params?: { category?: string; featured_only?: boolean }) =>
    api.get<GalleryImage[]>('/gallery', { params }).then((r) => r.data),
  galleryAdmin: () => api.get<GalleryImage[]>('/gallery/admin').then((r) => r.data),
  createGallery: (data: Partial<GalleryImage>) =>
    api.post<GalleryImage>('/gallery', data).then((r) => r.data),
  updateGallery: (id: string, data: Partial<GalleryImage>) =>
    api.patch<GalleryImage>(`/gallery/${id}`, data).then((r) => r.data),
  deleteGallery: (id: string) => api.delete(`/gallery/${id}`),
  blog: (page = 1) =>
    api.get<Paginated<BlogPost>>('/blog', { params: { page } }).then((r) => r.data),
  blogAdmin: (page = 1) =>
    api.get<Paginated<BlogPost>>('/blog/admin/list', { params: { page } }).then((r) => r.data),
  blogPost: (slug: string) => api.get<BlogPost>(`/blog/${slug}`).then((r) => r.data),
  createBlog: (data: Partial<BlogPost>) => api.post<BlogPost>('/blog', data).then((r) => r.data),
  updateBlog: (id: string, data: Partial<BlogPost>) =>
    api.patch<BlogPost>(`/blog/id/${id}`, data).then((r) => r.data),
  deleteBlog: (id: string) => api.delete(`/blog/id/${id}`),
  events: () => api.get<EventItem[]>('/events').then((r) => r.data),
  eventsAdmin: () => api.get<EventItem[]>('/events/admin').then((r) => r.data),
  createEvent: (data: Partial<EventItem> & Record<string, unknown>) =>
    api.post<EventItem>('/events', data).then((r) => r.data),
  updateEvent: (id: string, data: Partial<EventItem> & Record<string, unknown>) =>
    api.patch<EventItem>(`/events/${id}`, data).then((r) => r.data),
  deleteEvent: (id: string) => api.delete(`/events/${id}`),
  offers: () => api.get<Offer[]>('/offers').then((r) => r.data),
  offersAdmin: () => api.get<Offer[]>('/offers/admin').then((r) => r.data),
  createOffer: (data: Partial<Offer>) => api.post<Offer>('/offers', data).then((r) => r.data),
  updateOffer: (id: string, data: Partial<Offer>) =>
    api.patch<Offer>(`/offers/${id}`, data).then((r) => r.data),
  deleteOffer: (id: string) => api.delete(`/offers/${id}`),
  contact: (data: unknown) => api.post('/contact', data).then((r) => r.data),
  faqs: (category?: string) =>
    api.get<FAQ[]>('/faqs', { params: { category } }).then((r) => r.data),
  createFaq: (data: Partial<FAQ>) => api.post<FAQ>('/faqs', data).then((r) => r.data),
  updateFaq: (id: string, data: Partial<FAQ>) =>
    api.patch<FAQ>(`/faqs/${id}`, data).then((r) => r.data),
  deleteFaq: (id: string) => api.delete(`/faqs/${id}`),
};

export const cmsApiLayout = {
  getHomepage: () => api.get('/cms/homepage-layout').then((r) => r.data),
  putHomepage: (sections: unknown[]) =>
    api.put('/cms/homepage-layout', { sections }).then((r) => r.data),
};

export const publicApi = {
  restaurant: () => api.get<RestaurantInfo>('/restaurant').then((r) => r.data),
  home: () => api.get<HomePayload>('/home').then((r) => r.data),
  search: (q: string) => api.get('/search', { params: { q } }).then((r) => r.data),
  features: () => api.get('/features/public').then((r) => r.data),
  cms: () => api.get('/cms/public').then((r) => r.data),
};

export const mediaApi = {
  list: (params?: { folder?: string; search?: string; page?: number; page_size?: number }) =>
    api
      .get<{ items: import('@/types').MediaAsset[]; meta?: unknown }>('/media', { params })
      .then((r) => r.data),
  upload: async (
    file: File,
    folder = 'royal-rail-restro',
    alt_text = ''
  ): Promise<import('@/types').MediaAsset> => {
    const form = new FormData();
    form.append('file', file);
    form.append('folder', folder);
    form.append('alt_text', alt_text || file.name);
    // Do NOT set Content-Type manually — browser sets multipart boundary
    const { data } = await api.post<import('@/types').MediaAsset>('/media/upload', form);
    return data;
  },
  remove: (id: string) => api.delete(`/media/${id}`),
  update: (id: string, params: { alt_text?: string; folder?: string }) =>
    api
      .patch<import('@/types').MediaAsset>(`/media/${id}`, null, { params })
      .then((r) => r.data),
};

export const featureApi = {
  list: () => api.get('/features').then((r) => r.data),
  update: (
    key: string,
    data: {
      enabled?: boolean;
      visible?: boolean;
      maintenance_message?: string | null;
    }
  ) => api.patch(`/features/${key}`, data).then((r) => r.data),
  bulk: (updates: unknown[]) => api.post('/features/bulk', { updates }).then((r) => r.data),
  ensure: () => api.post('/features/ensure-catalog').then((r) => r.data),
};

export const cmsApi = {
  public: () => api.get('/cms/public').then((r) => r.data),
  profile: () => api.get('/cms/profile').then((r) => r.data),
  updateProfile: (data: Record<string, unknown>) =>
    api.put('/cms/profile', data).then((r) => r.data),
  theme: () => api.get('/cms/theme').then((r) => r.data),
  updateTheme: (values: Record<string, string>) =>
    api.put('/cms/theme', { values }).then((r) => r.data),
  getHomepage: () => api.get('/cms/homepage-layout').then((r) => r.data),
  putHomepage: (sections: unknown[]) =>
    api.put('/cms/homepage-layout', { sections }).then((r) => r.data),
};

export const adminApi = {
  dashboard: () => api.get<DashboardStats>('/admin/dashboard').then((r) => r.data),
  users: (page = 1, search?: string) =>
    api.get<Paginated<User>>('/admin/users', { params: { page, search } }).then((r) => r.data),
  toggleUser: (id: string) =>
    api.patch(`/admin/users/${id}/toggle-active`).then((r) => r.data),
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
  seed: (secret?: string) =>
    api
      .post(
        '/admin/seed',
        {},
        secret ? { headers: { 'X-Seed-Secret': secret } } : undefined
      )
      .then((r) => r.data),
  dbStats: () => api.get('/admin/db-stats').then((r) => r.data),
};
