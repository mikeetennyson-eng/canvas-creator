import { useEffect } from 'react';
import Toolbar from '@/components/Toolbar/Toolbar';
import IconLibrary from '@/components/Sidebar/IconLibrary';
import CanvasEditor from '@/components/Canvas/CanvasEditor';
import PropertiesPanel from '@/components/PropertiesPanel/PropertiesPanel';
import { useIconStore } from '@/stores/iconStore';
import { fetchIcons } from '@/data/mockIcons';
import { useCanvasStore } from '@/stores/canvasStore';

export default function EditorPage() {
  const setIcons = useIconStore((s) => s.setIcons);
  const setLoading = useIconStore((s) => s.setLoading);
  const removeSelected = useCanvasStore((s) => s.removeSelected);
  const selectedIds = useCanvasStore((s) => s.selectedIds);

  useEffect(() => {
    setLoading(true);
    fetchIcons().then((icons) => {
      setIcons(icons);
      setLoading(false);
    });
  }, [setIcons, setLoading]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
        removeSelected();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedIds, removeSelected]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <Toolbar />
      <div className="flex flex-1 overflow-hidden">
        <IconLibrary />
        <CanvasEditor />
        <PropertiesPanel />
      </div>
    </div>
  );
}
