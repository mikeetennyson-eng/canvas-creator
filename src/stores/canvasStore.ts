import { create } from 'zustand';
import type { CanvasElement, ToolType } from '@/types/editor';

interface CanvasStore {
  elements: CanvasElement[];
  selectedIds: string[];
  activeTool: ToolType;
  zoom: number;
  panX: number;
  panY: number;
  nextZIndex: number;

  addElement: (el: CanvasElement) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  removeElement: (id: string) => void;
  removeSelected: () => void;
  setSelectedIds: (ids: string[]) => void;
  toggleSelect: (id: string) => void;
  clearSelection: () => void;
  setActiveTool: (tool: ToolType) => void;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  moveLayer: (id: string, direction: 'up' | 'down') => void;
  getCanvasJSON: () => string;
  loadCanvasJSON: (json: string) => void;
  resetCanvas: () => void;
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  elements: [],
  selectedIds: [],
  activeTool: 'select',
  zoom: 1,
  panX: 0,
  panY: 0,
  nextZIndex: 1,

  addElement: (el) =>
    set((s) => ({
      elements: [...s.elements, { ...el, zIndex: s.nextZIndex }],
      nextZIndex: s.nextZIndex + 1,
    })),

  updateElement: (id, updates) =>
    set((s) => ({
      elements: s.elements.map((el) => (el.id === id ? { ...el, ...updates } : el)),
    })),

  removeElement: (id) =>
    set((s) => ({
      elements: s.elements.filter((el) => el.id !== id),
      selectedIds: s.selectedIds.filter((sid) => sid !== id),
    })),

  removeSelected: () =>
    set((s) => ({
      elements: s.elements.filter((el) => !s.selectedIds.includes(el.id)),
      selectedIds: [],
    })),

  setSelectedIds: (ids) => set({ selectedIds: ids }),
  toggleSelect: (id) =>
    set((s) => ({
      selectedIds: s.selectedIds.includes(id)
        ? s.selectedIds.filter((sid) => sid !== id)
        : [...s.selectedIds, id],
    })),
  clearSelection: () => set({ selectedIds: [] }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(5, zoom)) }),
  setPan: (x, y) => set({ panX: x, panY: y }),

  moveLayer: (id, direction) =>
    set((s) => {
      const sorted = [...s.elements].sort((a, b) => a.zIndex - b.zIndex);
      const idx = sorted.findIndex((el) => el.id === id);
      if (idx < 0) return s;
      const swapIdx = direction === 'up' ? idx + 1 : idx - 1;
      if (swapIdx < 0 || swapIdx >= sorted.length) return s;
      const temp = sorted[idx].zIndex;
      sorted[idx] = { ...sorted[idx], zIndex: sorted[swapIdx].zIndex };
      sorted[swapIdx] = { ...sorted[swapIdx], zIndex: temp };
      return { elements: sorted };
    }),


  getCanvasJSON: () => {
    const { elements, zoom, panX, panY } = get();
    return JSON.stringify({ elements, zoom, panX, panY, width: 1200, height: 800 }, null, 2);
  },

  loadCanvasJSON: (json) => {
    try {
      const data = JSON.parse(json);
      set({
        elements: data.elements || [],
        zoom: data.zoom || 1,
        panX: data.panX || 0,
        panY: data.panY || 0,
      });
    } catch {
      console.error('Invalid canvas JSON');
    }
  },

  resetCanvas: () => {
    set({
      elements: [],
      selectedIds: [],
      activeTool: 'select',
      zoom: 1,
      panX: 0,
      panY: 0,
      nextZIndex: 1,
    });
  },
}));
