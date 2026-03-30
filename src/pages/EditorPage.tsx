import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import Toolbar from '@/components/Toolbar/Toolbar';
import IconLibrary from '@/components/Sidebar/IconLibrary';
import IconCounter from '@/components/Icons/IconCounter';
import CanvasEditor from '@/components/Canvas/CanvasEditor';
import PropertiesPanel from '@/components/PropertiesPanel/PropertiesPanel';
import { UpgradeConfirmDialog } from '@/components/UpgradeConfirmDialog';
import { useIconStore } from '@/stores/iconStore';
import { fetchIcons } from '@/data/mockIcons';
import { useCanvasStore } from '@/stores/canvasStore';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Monitor, Home } from 'lucide-react';

export default function EditorPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const setIcons = useIconStore((s) => s.setIcons);
  const setLoading = useIconStore((s) => s.setLoading);
  const removeSelected = useCanvasStore((s) => s.removeSelected);
  const selectedIds = useCanvasStore((s) => s.selectedIds);
  const resetCanvas = useCanvasStore((s) => s.resetCanvas);
  const loadCanvasJSON = useCanvasStore((s) => s.loadCanvasJSON);
  const getCanvasJSON = useCanvasStore((s) => s.getCanvasJSON);
  const { isAuthenticated, logout } = useAuth();
  const canvasId = searchParams.get('load');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingCanvas, setIsLoadingCanvas] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isHandlingTakeover, setIsHandlingTakeover] = useState(false);

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

  // Poll for remote session takeover requests.
  useEffect(() => {
    if (!isAuthenticated || isHandlingTakeover) return;

    const interval = setInterval(async () => {
      try {
        const status = await apiClient.getSessionStatus();
        if (status.takeoverRequested) {
          await handleForcedLogoutWithSave();
        }
      } catch {
        // Ignore polling failures; normal API calls will handle auth issues.
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [isAuthenticated, isHandlingTakeover]);

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

  async function handleForcedLogoutWithSave() {
    if (isHandlingTakeover) return;

    try {
      setIsHandlingTakeover(true);

      toast({
        title: 'Session transfer in progress',
        description: 'Your progress is being saved and you are being logged out.',
      });

      const canvasState = useCanvasStore.getState();
      const canvasJSON = canvasState.getCanvasJSON();
      const canvasTitle = localStorage.getItem('currentCanvasTitle') || 'Untitled Diagram';
      const canvasId = localStorage.getItem('currentCanvasId');

      const stageEl = document.querySelector('.konvajs-content canvas') as HTMLCanvasElement | null;
      const thumbnail = stageEl ? stageEl.toDataURL('image/png') : undefined;

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
      } catch (saveErr) {
        console.error('Forced logout save failed:', saveErr);
      }

      logout();
      navigate('/login');
    } finally {
      setIsHandlingTakeover(false);
    }
  }

  const handleUpgradeClick = async () => {
    try {
      setIsRedirecting(true);
      
      // Auto-save canvas before redirecting
      const canvasState = useCanvasStore.getState();
      const canvasJSON = canvasState.getCanvasJSON();
      const canvasTitle = localStorage.getItem('currentCanvasTitle') || 'Untitled Diagram';
      const canvasId = localStorage.getItem('currentCanvasId');

      // Get thumbnail
      const stageEl = document.querySelector('.konvajs-content canvas') as HTMLCanvasElement | null;
      const thumbnail = stageEl ? stageEl.toDataURL('image/png') : undefined;

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
    <>
      {isMobile ? (
        // Mobile view - show message asking to use desktop
        <div className="flex h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-muted p-6">
          <div className="max-w-md text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/20">
              <Monitor className="w-10 h-10 text-primary" />
            </div>
            
            <div>
              <h1 className="text-2xl font-bold mb-2">Desktop Only</h1>
              <p className="text-muted-foreground mb-4">
                The canvas editor is optimized for desktop and laptop screens. For the best experience and full functionality, please open this on your computer.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                💡 <strong>Tip:</strong> You can still view your saved diagrams and manage your profile on mobile.
              </p>
            </div>

            <Button
              onClick={() => navigate('/profile')}
              variant="default"
              className="w-full gap-2"
            >
              <Home className="w-4 h-4" />
              Go to Profile
            </Button>
          </div>
        </div>
      ) : (
        // Desktop view - show full editor
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

            {isHandlingTakeover && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
                <div className="flex max-w-sm flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 text-center shadow-xl">
                  <div className="h-10 w-10 rounded-full border-4 border-muted-foreground border-t-primary animate-spin" />
                  <p className="text-sm font-semibold">Your progress is being saved</p>
                  <p className="text-xs text-muted-foreground">You are being logged out because your account was opened on another device.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
