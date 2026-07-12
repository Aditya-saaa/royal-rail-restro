import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, MenuItem } from '@/types';

interface CartState {
  items: CartItem[];
  orderType: 'delivery' | 'pickup' | 'dine_in';
  couponCode: string;
  specialInstructions: string;
  deliveryAddress: string;
  addItem: (item: MenuItem, qty?: number, notes?: string) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  setOrderType: (t: 'delivery' | 'pickup' | 'dine_in') => void;
  setCouponCode: (c: string) => void;
  setSpecialInstructions: (s: string) => void;
  setDeliveryAddress: (a: string) => void;
  clear: () => void;
  subtotal: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      orderType: 'delivery',
      couponCode: '',
      specialInstructions: '',
      deliveryAddress: '',

      addItem: (item, qty = 1, notes) => {
        const items = [...get().items];
        const idx = items.findIndex((i) => i.menu_item.id === item.id);
        if (idx >= 0) {
          items[idx] = {
            ...items[idx],
            quantity: items[idx].quantity + qty,
            special_notes: notes ?? items[idx].special_notes,
          };
        } else {
          items.push({ menu_item: item, quantity: qty, special_notes: notes });
        }
        set({ items });
      },

      removeItem: (menuItemId) => {
        set({ items: get().items.filter((i) => i.menu_item.id !== menuItemId) });
      },

      updateQuantity: (menuItemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(menuItemId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.menu_item.id === menuItemId ? { ...i, quantity } : i
          ),
        });
      },

      setOrderType: (orderType) => set({ orderType }),
      setCouponCode: (couponCode) => set({ couponCode }),
      setSpecialInstructions: (specialInstructions) => set({ specialInstructions }),
      setDeliveryAddress: (deliveryAddress) => set({ deliveryAddress }),
      clear: () =>
        set({
          items: [],
          couponCode: '',
          specialInstructions: '',
          deliveryAddress: '',
        }),

      subtotal: () =>
        get().items.reduce(
          (sum, i) => sum + Number(i.menu_item.price) * i.quantity,
          0
        ),

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'rrr-cart' }
  )
);
