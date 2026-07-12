import { create } from 'zustand';
import { api } from '@/api/client';

export type FeatureState = {
  enabled: boolean;
  visible: boolean;
  message?: string | null;
};

interface FeatureStore {
  features: Record<string, FeatureState>;
  loaded: boolean;
  load: () => Promise<void>;
  isEnabled: (key: string) => boolean;
  isVisible: (key: string) => boolean;
  message: (key: string) => string | null;
}

const DEFAULTS: Record<string, FeatureState> = {
  online_ordering: { enabled: true, visible: true },
  table_reservation: { enabled: true, visible: true },
  delivery: { enabled: true, visible: true },
  pickup: { enabled: true, visible: true },
  dine_in_ordering: { enabled: true, visible: true },
  coupons: { enabled: true, visible: true },
  search: { enabled: true, visible: true },
  blog: { enabled: true, visible: true },
  events: { enabled: true, visible: true },
  gallery: { enabled: true, visible: true },
  reviews: { enabled: true, visible: true },
  dark_mode: { enabled: true, visible: true },
  home_hero: { enabled: true, visible: true },
  home_featured_dishes: { enabled: true, visible: true },
  home_categories: { enabled: true, visible: true },
  home_chef_specials: { enabled: true, visible: true },
  home_rail_specials: { enabled: true, visible: true },
  home_testimonials: { enabled: true, visible: true },
  home_offers: { enabled: true, visible: true },
  home_gallery: { enabled: true, visible: true },
  home_story: { enabled: true, visible: true },
  home_awards: { enabled: true, visible: true },
  home_reservation_cta: { enabled: true, visible: true },
  whatsapp_chat: { enabled: true, visible: true },
};

export const useFeatureStore = create<FeatureStore>((set, get) => ({
  features: { ...DEFAULTS },
  loaded: false,

  load: async () => {
    try {
      const { data } = await api.get<Record<string, FeatureState>>('/features/public');
      set({ features: { ...DEFAULTS, ...data }, loaded: true });
    } catch {
      set({ features: { ...DEFAULTS }, loaded: true });
    }
  },

  isEnabled: (key) => {
    const f = get().features[key];
    return f ? f.enabled !== false : true;
  },

  isVisible: (key) => {
    const f = get().features[key];
    if (!f) return true;
    return f.visible !== false && f.enabled !== false;
  },

  message: (key) => {
    const f = get().features[key];
    return f?.message || null;
  },
}));
