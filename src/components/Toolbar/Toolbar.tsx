import {
  MousePointer2, Square, Circle, Type, ArrowUpRight,
  Download, ScrollText, ZoomIn, ZoomOut,
  Undo2, Redo2, Home, Save, Clock, Plus, Trash2,
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
]

export default function Toolbar({ onSave, isSaving }: { onSave?: () => void; isSaving?: boolean }) {
  const navigate = useNavigate();
  const { activeTool, setActiveTool, zoom, setZoom, elements, selectedIds, setSelectedIds, removeSelected } = useCanvasStore();
  const usedIcons = useIconStore((s) => s.usedIcons);
  const [showAttrModal, setShowAttrModal] = useState(false);

  const handleExportPNG = () => {
    const stageEl = document.querySelector('.konvajs-content canvas') as HTMLCanvasElement | null;
    if (!stageEl) return;
    const link = document.createElement('a');
    link.download = 'diagram.png';
    link.href = stageEl.toDataURL('image/png');
    link.click();
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

          {/* Select All */}
          <button
            onClick={() => setSelectedIds(elements.map(e => e.id))}
            className="rounded-md p-2 transition-all duration-150 active:scale-95 text-muted-foreground hover:bg-secondary hover:text-foreground"
            title="Select All"
          >
            <Plus className="h-4 w-4" />
          </button>

          {/* Delete Selected */}
          {selectedIds.length > 0 && (
            <button
              onClick={() => removeSelected()}
              className="rounded-md p-2 transition-all duration-150 active:scale-95 text-destructive hover:bg-destructive/10"
              title={`Delete ${selectedIds.length} item${selectedIds.length > 1 ? 's' : ''}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}

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
            className="relative flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-secondary active:scale-95"
          >
            <ScrollText className="h-3.5 w-3.5" />
            Attributions
          </button>

          <div className="mx-1.5 h-5 w-px bg-border" />

          <button onClick={handleExportPNG} className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-secondary hover:text-foreground active:scale-95">
            <Download className="h-3.5 w-3.5" />
            PNG
          </button>

          <div className="mx-1.5 h-5 w-px bg-border" />

          {onSave && (
            <button
              onClick={onSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-secondary hover:text-foreground active:scale-95 disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          )}

          <div className="mx-1.5 h-5 w-px bg-border" />

          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-secondary hover:text-foreground active:scale-95"
          >
            <Home className="h-3.5 w-3.5" />
            Home
          </button>

          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-secondary hover:text-foreground active:scale-95"
          >
            <Clock className="h-3.5 w-3.5" />
            Recent Edits
          </button>


        </div>
      </div>

      <AttributionModal open={showAttrModal} onClose={() => setShowAttrModal(false)} />
    </>
  );
}
