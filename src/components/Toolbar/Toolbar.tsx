import {
  MousePointer2, Square, Circle, Type, ArrowUpRight,
  Download, FileJson, ScrollText, ZoomIn, ZoomOut,
  Undo2, Redo2, Sun, Moon, Home,
} from 'lucide-react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useIconStore } from '@/stores/iconStore';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AttributionModal from '@/components/AttributionModal/AttributionModal';
import type { ToolType } from '@/types/editor';

const tools: { id: ToolType; icon: typeof MousePointer2; label: string }[] = [
  { id: 'select', icon: MousePointer2, label: 'Select' },
  { id: 'rect', icon: Square, label: 'Rectangle' },
  { id: 'circle', icon: Circle, label: 'Ellipse' },
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'arrow', icon: ArrowUpRight, label: 'Arrow' },
];

export default function Toolbar() {
  const navigate = useNavigate();
  const { activeTool, setActiveTool, zoom, setZoom, getCanvasJSON, elements } = useCanvasStore();
  const usedIcons = useIconStore((s) => s.usedIcons);
  const [showAttrModal, setShowAttrModal] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const handleExportPNG = () => {
    const stageEl = document.querySelector('.konvajs-content canvas') as HTMLCanvasElement | null;
    if (!stageEl) return;
    const link = document.createElement('a');
    link.download = 'diagram.png';
    link.href = stageEl.toDataURL('image/png');
    link.click();
  };

  const handleExportJSON = () => {
    const json = getCanvasJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    link.download = 'diagram.json';
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const attributionRequired = usedIcons.filter((i) => i.attribution_required);

  return (
    <>
      <div className="flex h-11 items-center justify-between border-b border-panel-border bg-card px-3">
        {/* Left: tools */}
        <div className="flex items-center gap-0.5">
          {tools.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTool(t.id)}
              title={t.label}
              className={`rounded-md p-2 transition-all duration-150 active:scale-95 ${
                activeTool === t.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <t.icon className="h-4 w-4" />
            </button>
          ))}

          <div className="mx-2 h-5 w-px bg-border" />

          {/* Zoom */}
          <button onClick={() => setZoom(zoom - 0.1)} className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground active:scale-95 transition-all" title="Zoom out">
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="min-w-[3.5rem] text-center text-xs font-medium tabular-nums text-muted-foreground">
            {Math.round(zoom * 100)}%
          </span>
          <button onClick={() => setZoom(zoom + 0.1)} className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground active:scale-95 transition-all" title="Zoom in">
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-0.5">
          {/* Attribution */}
          <button
            onClick={() => setShowAttrModal(true)}
            className={`relative flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all active:scale-95 ${
              attributionRequired.length > 0
                ? 'bg-attribution-badge/15 text-attribution-badge hover:bg-attribution-badge/25'
                : 'text-muted-foreground hover:bg-secondary'
            }`}
          >
            <ScrollText className="h-3.5 w-3.5" />
            Attributions
            {attributionRequired.length > 0 && (
              <span className="flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-attribution-badge px-1 text-[10px] font-bold text-card">
                {attributionRequired.length}
              </span>
            )}
          </button>

          <div className="mx-1.5 h-5 w-px bg-border" />

          <button onClick={handleExportPNG} className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-secondary hover:text-foreground active:scale-95">
            <Download className="h-3.5 w-3.5" />
            PNG
          </button>
          <button onClick={handleExportJSON} className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-secondary hover:text-foreground active:scale-95">
            <FileJson className="h-3.5 w-3.5" />
            JSON
          </button>

          <div className="mx-1.5 h-5 w-px bg-border" />

          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-secondary hover:text-foreground active:scale-95"
          >
            <Home className="h-3.5 w-3.5" />
            Home
          </button>

          <div className="mx-1.5 h-5 w-px bg-border" />

          <button
            onClick={() => setDarkMode(!darkMode)}
            className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground active:scale-95 transition-all"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <AttributionModal open={showAttrModal} onClose={() => setShowAttrModal(false)} />
    </>
  );
}
