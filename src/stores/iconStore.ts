import { create } from 'zustand';
import type { IconData } from '@/types/editor';

interface IconStore {
  icons: IconData[];
  loading: boolean;
  searchQuery: string;
  selectedCategory: string;
  attributionFilter: 'all' | 'free' | 'attribution';
  usedIcons: IconData[];

  setIcons: (icons: IconData[]) => void;
  setLoading: (loading: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  setAttributionFilter: (filter: 'all' | 'free' | 'attribution') => void;
  trackUsedIcon: (icon: IconData) => void;
  removeUsedIcon: (iconId: string) => void;
  getAttributionText: () => string;
  getFilteredIcons: () => IconData[];
  getCategories: () => string[];
}

export const useIconStore = create<IconStore>((set, get) => ({
  icons: [],
  loading: false,
  searchQuery: '',
  selectedCategory: 'all',
  attributionFilter: 'all',
  usedIcons: [],

  setIcons: (icons) => set({ icons }),
  setLoading: (loading) => set({ loading }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setAttributionFilter: (filter) => set({ attributionFilter: filter }),

  trackUsedIcon: (icon) =>
    set((s) => {
      if (s.usedIcons.some((u) => u.id === icon.id)) return s;
      return { usedIcons: [...s.usedIcons, icon] };
    }),

  removeUsedIcon: (iconId: string) =>
    set((s) => ({ usedIcons: s.usedIcons.filter((u) => u.id !== iconId) })),

  getAttributionText: () => {
    const required = get().usedIcons.filter((i) => i.attribution_required);
    if (required.length === 0) return '';
    return required
      .map((i) => `Icons by ${i.author} from ${i.source_url} licensed under ${i.license}`)
      .join('\n');
  },

  getFilteredIcons: () => {
    const { icons, searchQuery, selectedCategory, attributionFilter } = get();
    return icons.filter((icon) => {
      const matchesSearch =
        !searchQuery ||
        icon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        icon.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || icon.category === selectedCategory;
      const matchesAttribution =
        attributionFilter === 'all' ||
        (attributionFilter === 'free' && !icon.attribution_required) ||
        (attributionFilter === 'attribution' && icon.attribution_required);
      return matchesSearch && matchesCategory && matchesAttribution;
    });
  },

  getCategories: () => {
    const cats = new Set(get().icons.map((i) => i.category));
    return ['all', ...Array.from(cats)];
  },
}));
