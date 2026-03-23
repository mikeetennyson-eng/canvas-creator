import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Toolbar from '@/components/Toolbar/Toolbar';
import IconLibrary from '@/components/Sidebar/IconLibrary';
import CanvasEditor from '@/components/Canvas/CanvasEditor';
import PropertiesPanel from '@/components/PropertiesPanel/PropertiesPanel';
import { useIconStore } from '@/stores/iconStore';
import { fetchIcons } from '@/data/mockIcons';
import { useCanvasStore } from '@/stores/canvasStore';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';

export default function EditorPage() {
  const [searchParams] = useSearchParams();
  const setIcons = useIconStore((s) => s.setIcons);
  const setLoading = useIconStore((s) => s.setLoading);
  const removeSelected = useCanvasStore((s) => s.removeSelected);
  const selectedIds = useCanvasStore((s) => s.selectedIds);
  const resetCanvas = useCanvasStore((s) => s.resetCanvas);
  const loadCanvasJSON = useCanvasStore((s) => s.loadCanvasJSON);
  const { isAuthenticated } = useAuth();
  const canvasId = searchParams.get('load');
  const [isSaving, setIsSaving] = useState(false);

  // Handle canvas loading or creating new
  useEffect(() => {
    if (canvasId && isAuthenticated) {
      // Load specific canvas from profile
      loadCanvasData(canvasId);
    } else {
      // Creating new canvas - clear previous canvas context
      resetCanvas();
      localStorage.removeItem('currentCanvasId');
      localStorage.removeItem('lastLoadedCanvas');
      // Set default title for new canvas
      localStorage.setItem('currentCanvasTitle', 'Untitled Diagram');
    }
  }, [canvasId, isAuthenticated, resetCanvas]);

  // Load icons
  useEffect(() => {
    setLoading(true);
    fetchIcons().then((icons) => {
      setIcons(icons);
      setLoading(false);
    });
  }, [setIcons, setLoading]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!isAuthenticated) return;

    const autoSaveInterval = setInterval(() => {
      autoSaveCanvas();
    }, 30000); // 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [isAuthenticated]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
        removeSelected();
      }
      // Ctrl+S / Cmd+S for manual save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        autoSaveCanvas();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedIds, removeSelected, isAuthenticated]);

  const loadCanvasData = async (id: string) => {
    try {
      const response = await apiClient.getCanvas(id);
      const canvas = response.canvas;
      const canvasData = JSON.parse(canvas.canvasData);
      
      // Load canvas data into Zustand store
      loadCanvasJSON(JSON.stringify(canvasData));
      
      // Save to localStorage for reference
      localStorage.setItem('currentCanvasId', canvas._id);
      localStorage.setItem('currentCanvasTitle', canvas.title);
      
      console.log('Canvas loaded successfully');
    } catch (err) {
      console.error('Failed to load canvas:', err);
    }
  };

  const autoSaveCanvas = async () => {
    if (!isAuthenticated) return;

    try {
      setIsSaving(true);
      const canvasState = useCanvasStore.getState();
      const canvasJSON = canvasState.getCanvasJSON();
      const canvasTitle = localStorage.getItem('currentCanvasTitle') || 'Untitled Diagram';
      const canvasId = localStorage.getItem('currentCanvasId');

      // Get thumbnail
      const stageEl = document.querySelector('.konvajs-content canvas') as HTMLCanvasElement | null;
      const thumbnail = stageEl ? stageEl.toDataURL('image/png') : undefined;

      const response = await apiClient.saveCanvas({
        ...(canvasId && { _id: canvasId }),
        title: canvasTitle,
        canvasData: canvasJSON,
        thumbnail,
      });

      // Save the canvas ID for future auto-saves in this session
      if (response.canvas && response.canvas._id) {
        localStorage.setItem('currentCanvasId', response.canvas._id);
      }

      console.log('Canvas auto-saved');
    } catch (err) {
      console.error('Auto-save failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <Toolbar onSave={autoSaveCanvas} isSaving={isSaving} />
      <div className="flex flex-1 overflow-hidden">
        <IconLibrary />
        <CanvasEditor />
        <PropertiesPanel />
      </div>
    </div>
  );
}
