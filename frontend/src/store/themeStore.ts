import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  darkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (v: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      darkMode: false,
      toggleDarkMode: () => {
        const next = !get().darkMode;
        document.documentElement.classList.toggle('dark', next);
        set({ darkMode: next });
      },
      setDarkMode: (v) => {
        document.documentElement.classList.toggle('dark', v);
        set({ darkMode: v });
      },
    }),
    { name: 'rrr-theme' }
  )
);
