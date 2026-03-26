import { create } from 'zustand';
import type { IconData } from '@/types/editor';

interface IconStore {
  icons: IconData[];
  loading: boolean;
  searchQuery: string;
  selectedCategory: string;
  usedIcons: IconData[];

  setIcons: (icons: IconData[]) => void;
  setLoading: (loading: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  trackUsedIcon: (icon: IconData) => void;
  removeUsedIcon: (iconId: string) => void;
  getFilteredIcons: () => IconData[];
  getCategories: () => string[];
}

export const useIconStore = create<IconStore>((set, get) => ({
  icons: [],
  loading: false,
  searchQuery: '',
  selectedCategory: 'all',
  usedIcons: [],

  setIcons: (icons) => set({ icons }),
  setLoading: (loading) => set({ loading }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),

  trackUsedIcon: (icon) =>
    set((s) => {
      if (s.usedIcons.some((u) => u.id === icon.id)) return s;
      return { usedIcons: [...s.usedIcons, icon] };
    }),

  removeUsedIcon: (iconId: string) =>
    set((s) => ({ usedIcons: s.usedIcons.filter((u) => u.id !== iconId) })),

  getFilteredIcons: () => {
    const { icons, searchQuery, selectedCategory } = get();
    return icons.filter((icon) => {
      const matchesSearch =
        !searchQuery ||
        icon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        icon.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || icon.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  },

  getCategories: () => {
    const cats = new Set(get().icons.map((i) => i.category));
    return ['all', ...Array.from(cats)];
  },
}));
