import { create } from 'zustand';

export const useIconStore = create((set, get) => ({
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

  removeUsedIcon: (iconId) =>
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
