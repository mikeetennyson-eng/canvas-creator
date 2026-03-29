import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Toolbar from '@/components/Toolbar/Toolbar.jsx';
import IconLibrary from '@/components/Sidebar/IconLibrary.jsx';
import IconCounter from '@/components/Icons/IconCounter.jsx';
import CanvasEditor from '@/components/Canvas/CanvasEditor.jsx';
import PropertiesPanel from '@/components/PropertiesPanel/PropertiesPanel.jsx';
import { UpgradeConfirmDialog } from '@/components/UpgradeConfirmDialog.jsx';
import { useIconStore } from '@/stores/iconStore.js';
import { fetchIcons } from '@/data/mockIcons.js';
import { useCanvasStore } from '@/stores/canvasStore.js';
import { apiClient } from '@/lib/apiClient.js';
import { useAuth } from '@/context/AuthContext.jsx';
import { useToast } from '@/hooks/use-toast.js';

export default function EditorPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const setIcons = useIconStore((s) => s.setIcons);
  const setLoading = useIconStore((s) => s.setLoading);
  const removeSelected = useCanvasStore((s) => s.removeSelected);
  const selectedIds = useCanvasStore((s) => s.selectedIds);
  const resetCanvas = useCanvasStore((s) => s.resetCanvas);
  const loadCanvasJSON = useCanvasStore((s) => s.loadCanvasJSON);
  const getCanvasJSON = useCanvasStore((s) => s.getCanvasJSON);
  const { isAuthenticated } = useAuth();
  const canvasId = searchParams.get('load');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingCanvas, setIsLoadingCanvas] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

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
    const handleKey = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
        const target = e.target;
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

  const loadCanvasData = async (id) => {
    try {
      setIsLoadingCanvas(true);
      console.log(`[EditorPage] Starting to load canvas: ${id}`);
      const startTime = performance.now();

      console.log('[EditorPage] Calling apiClient.getCanvas...');
      const apiStart = performance.now();
      const response = await apiClient.getCanvas(id);
      const apiEnd = performance.now();
      console.log(`[EditorPage] API call took ${apiEnd - apiStart}ms`);

      const canvas = response.canvas;
      
      console.log('[EditorPage] Parsing canvas data...');
      const parseStart = performance.now();
      const canvasData = JSON.parse(canvas.canvasData);
      const parseEnd = performance.now();
      console.log(`[EditorPage] JSON parse took ${parseEnd - parseStart}ms`);
      
      console.log('[EditorPage] Loading canvas into store...');
      const loadStart = performance.now();
      loadCanvasJSON(JSON.stringify(canvasData));
      const loadEnd = performance.now();
      console.log(`[EditorPage] Store load took ${loadEnd - loadStart}ms`);
      
      // Save to localStorage for reference
      localStorage.setItem('currentCanvasId', canvas._id);
      localStorage.setItem('currentCanvasTitle', canvas.title);
      
      const endTime = performance.now();
      console.log(`[EditorPage] Total canvas load time: ${endTime - startTime}ms`);
      setIsLoadingCanvas(false);
    } catch (err) {
      console.error('Failed to load canvas:', err);
      setIsLoadingCanvas(false);
    }
  };

  const getCanvasThumbnail = () => {
    // Try Konva-generated canvas first
    let stageEl = document.querySelector('.konvajs-content canvas');

    // Fallback for situations where class names have changed
    if (!stageEl) stageEl = document.querySelector('canvas');

    if (!stageEl) return undefined;

    try {
      return stageEl.toDataURL('image/png');
    } catch (error) {
      console.warn('[EditorPage] thumbnail generation failed', error);
      return undefined;
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
      const thumbnail = getCanvasThumbnail();

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

  const handleUpgradeClick = async () => {
    try {
      setIsRedirecting(true);
      
      // Auto-save canvas before redirecting
      const canvasState = useCanvasStore.getState();
      const canvasJSON = canvasState.getCanvasJSON();
      const canvasTitle = localStorage.getItem('currentCanvasTitle') || 'Untitled Diagram';
      const canvasId = localStorage.getItem('currentCanvasId');

      // Get thumbnail
      const thumbnail = getCanvasThumbnail();

      try {
        const response = await apiClient.saveCanvas({
          ...(canvasId && { _id: canvasId }),
          title: canvasTitle,
          canvasData: canvasJSON,
          thumbnail,
        });

        if (response.canvas && response.canvas._id) {
          localStorage.setItem('currentCanvasId', response.canvas._id);
        }

        toast({
          title: 'Progress Saved',
          description: 'Your diagram has been saved.',
        });
      } catch (saveErr) {
        console.error('Failed to save before upgrade:', saveErr);
        toast({
          title: 'Warning',
          description: 'Could not save diagram, but redirecting to upgrade anyway.',
          variant: 'destructive',
        });
      }

      // Redirect to pricing
      setTimeout(() => {
        navigate('/pricing');
      }, 1000);
    } finally {
      setIsRedirecting(false);
      setShowUpgradeDialog(false);
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <Toolbar onSave={autoSaveCanvas} isSaving={isSaving} />
      <div className="flex flex-1 overflow-hidden relative">
        <IconLibrary onUpgradeRequest={() => setShowUpgradeDialog(true)} />
        <CanvasEditor />
        <PropertiesPanel />
        <IconCounter />

        {/* Upgrade confirmation dialog */}
        <UpgradeConfirmDialog
          open={showUpgradeDialog}
          onOpenChange={setShowUpgradeDialog}
          onConfirm={handleUpgradeClick}
          isLoading={isRedirecting}
        />
        
        {/* Loading overlay */}
        {isLoadingCanvas && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 rounded-full border-4 border-muted-foreground border-t-primary animate-spin" />
              <p className="text-sm font-medium text-muted-foreground">Loading canvas...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
