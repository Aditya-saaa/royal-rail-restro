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
  /** Force re-fetch (call after admin toggles) */
  reload: () => Promise<void>;
  isEnabled: (key: string) => boolean;
  isVisible: (key: string) => boolean;
  message: (key: string) => string | null;
  /** Optimistic local update for admin preview */
  setLocal: (key: string, patch: Partial<FeatureState>) => void;
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
  contact_form: { enabled: true, visible: true },
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
  offers: { enabled: true, visible: true },
};

function normalizeMap(
  raw: Record<string, FeatureState | boolean | { enabled?: boolean; visible?: boolean; message?: string | null }>
): Record<string, FeatureState> {
  const out: Record<string, FeatureState> = { ...DEFAULTS };
  for (const [key, val] of Object.entries(raw || {})) {
    if (typeof val === 'boolean') {
      out[key] = { enabled: val, visible: val };
    } else if (val && typeof val === 'object') {
      out[key] = {
        enabled: val.enabled !== false,
        visible: val.visible !== false && val.enabled !== false,
        message: val.message ?? null,
      };
    }
  }
  return out;
}

export const useFeatureStore = create<FeatureStore>((set, get) => ({
  features: { ...DEFAULTS },
  loaded: false,

  load: async () => {
    try {
      const { data } = await api.get('/features/public');
      set({ features: normalizeMap(data as Record<string, FeatureState>), loaded: true });
    } catch {
      set({ features: { ...DEFAULTS }, loaded: true });
    }
  },

  reload: async () => {
    try {
      const { data } = await api.get('/features/public', {
        // bust any intermediate cache
        params: { _t: Date.now() },
      });
      set({ features: normalizeMap(data as Record<string, FeatureState>), loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  isEnabled: (key) => {
    const f = get().features[key];
    return f ? f.enabled !== false : true;
  },

  isVisible: (key) => {
    const f = get().features[key];
    if (!f) return true;
    // Hidden if either visible=false OR enabled=false
    return f.visible !== false && f.enabled !== false;
  },

  message: (key) => {
    const f = get().features[key];
    if (!f) return null;
    if (!f.enabled || !f.visible) {
      return (
        f.message ||
        'This service is currently unavailable. Please check back later.'
      );
    }
    return f.message || null;
  },

  setLocal: (key, patch) => {
    const prev = get().features[key] || { enabled: true, visible: true };
    set({
      features: {
        ...get().features,
        [key]: { ...prev, ...patch },
      },
    });
  },
}));
