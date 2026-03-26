import { RotateCw, Move, Eye, Palette, Trash2, ArrowUp, ArrowDown, Crop } from 'lucide-react';
import { useCanvasStore } from '@/stores/canvasStore';

export default function PropertiesPanel() {
  const { elements, selectedIds, updateElement, removeElement, moveLayer } = useCanvasStore();

  const selected = selectedIds.length === 1 ? elements.find((el) => el.id === selectedIds[0]) : null;

  if (!selected) {
    return (
      <div className="flex h-full w-56 flex-col border-l border-panel-border bg-card">
        <div className="border-b border-panel-border px-3 py-2.5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Properties</h2>
        </div>
        <div className="flex flex-1 items-center justify-center p-4">
          <p className="text-center text-xs text-muted-foreground">
            {selectedIds.length > 1
              ? `${selectedIds.length} elements selected`
              : 'Select an element to edit its properties'}
          </p>
        </div>
      </div>
    );
  }

  const update = (updates: Record<string, unknown>) => updateElement(selected.id, updates);

  return (
    <div className="flex h-full w-56 flex-col border-l border-panel-border bg-card">
      <div className="border-b border-panel-border px-3 py-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Properties</h2>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-3 scrollbar-thin">
        {/* Type badge */}
        <div className="flex items-center gap-2">
          <span className="rounded bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary capitalize">
            {selected.type}
          </span>
          {selected.iconData?.attribution_required && (
            <span className="rounded bg-attribution-badge/15 px-2 py-0.5 text-[10px] font-medium text-attribution-badge">
              ⚠️ Attribution
            </span>
          )}
        </div>

        {/* Position */}
        <fieldset className="space-y-2">
          <legend className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Move className="h-3 w-3" /> Position
          </legend>
          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-0.5">
              <span className="text-[10px] text-muted-foreground">X</span>
              <input type="number" value={Math.round(selected.x)} onChange={(e) => update({ x: +e.target.value })}
                className="w-full rounded border border-input bg-background px-2 py-1 text-xs tabular-nums focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring" />
            </label>
            <label className="space-y-0.5">
              <span className="text-[10px] text-muted-foreground">Y</span>
              <input type="number" value={Math.round(selected.y)} onChange={(e) => update({ y: +e.target.value })}
                className="w-full rounded border border-input bg-background px-2 py-1 text-xs tabular-nums focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring" />
            </label>
          </div>
        </fieldset>

        {/* Size */}
        <fieldset className="space-y-2">
          <legend className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Size
          </legend>
          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-0.5">
              <span className="text-[10px] text-muted-foreground">W</span>
              <input type="number" value={Math.round(selected.width)} onChange={(e) => update({ width: +e.target.value })}
                className="w-full rounded border border-input bg-background px-2 py-1 text-xs tabular-nums focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring" />
            </label>
            <label className="space-y-0.5">
              <span className="text-[10px] text-muted-foreground">H</span>
              <input type="number" value={Math.round(selected.height)} onChange={(e) => update({ height: +e.target.value })}
                className="w-full rounded border border-input bg-background px-2 py-1 text-xs tabular-nums focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring" />
            </label>
          </div>
        </fieldset>

        {/* Rotation */}
        <fieldset className="space-y-2">
          <legend className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <RotateCw className="h-3 w-3" /> Rotation
          </legend>
          <div className="flex items-center gap-2">
            <input
              type="range" min={0} max={360} value={selected.rotation}
              onChange={(e) => update({ rotation: +e.target.value })}
              className="flex-1 accent-primary"
            />
            <span className="min-w-[2.5rem] text-right text-xs tabular-nums text-muted-foreground">{Math.round(selected.rotation)}°</span>
          </div>
        </fieldset>

        {/* Opacity */}
        <fieldset className="space-y-2">
          <legend className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Eye className="h-3 w-3" /> Opacity
          </legend>
          <div className="flex items-center gap-2">
            <input
              type="range" min={0} max={1} step={0.05} value={selected.opacity}
              onChange={(e) => update({ opacity: +e.target.value })}
              className="flex-1 accent-primary"
            />
            <span className="min-w-[2.5rem] text-right text-xs tabular-nums text-muted-foreground">{Math.round(selected.opacity * 100)}%</span>
          </div>
        </fieldset>

        {/* Fill color */}
        {(selected.type === 'shape' || selected.type === 'text') && (
          <fieldset className="space-y-2">
            <legend className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Palette className="h-3 w-3" /> Color
            </legend>
            {/* Shape fill options */}
            {selected.type === 'shape' && (
              <div className="flex gap-1.5 mb-2">
                <button
                  onClick={() => update({ fill: '#3b82f6' })}
                  className={`flex-1 px-2 py-1.5 rounded text-xs font-medium border transition-colors ${
                    selected.fill && selected.fill !== 'none' && selected.fill !== 'transparent'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-input bg-background text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  Fill
                </button>
                <button
                  onClick={() => update({ fill: 'none' })}
                  className={`flex-1 px-2 py-1.5 rounded text-xs font-medium border transition-colors ${
                    selected.fill === 'none' || selected.fill === 'transparent'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-input bg-background text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  No Fill
                </button>
              </div>
            )}
            {/* Color picker - only show if fill is enabled */}
            {selected.fill !== 'none' && selected.fill !== 'transparent' && (
              <div className="flex items-center gap-2">
                <input
                  type="color" value={selected.fill || '#3b82f6'}
                  onChange={(e) => update({ fill: e.target.value })}
                  className="h-8 w-8 cursor-pointer rounded border border-input"
                />
                <input
                  type="text" value={selected.fill || '#3b82f6'}
                  onChange={(e) => update({ fill: e.target.value })}
                  className="flex-1 rounded border border-input bg-background px-2 py-1 text-xs font-mono focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            )}
          </fieldset>
        )}

        {/* Text content */}
        {selected.type === 'text' && (
          <fieldset className="space-y-2">
            <legend className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Text</legend>
            <textarea
              value={selected.text || ''}
              onChange={(e) => update({ text: e.target.value })}
              rows={3}
              className="w-full rounded border border-input bg-background px-2 py-1.5 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
            <label className="space-y-0.5">
              <span className="text-[10px] text-muted-foreground">Font Size</span>
              <input type="number" value={selected.fontSize || 16} onChange={(e) => update({ fontSize: +e.target.value })}
                className="w-full rounded border border-input bg-background px-2 py-1 text-xs tabular-nums focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring" />
            </label>
          </fieldset>
        )}

        {/* Layers */}
        <fieldset className="space-y-2">
          <legend className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Layer</legend>
          <div className="flex gap-1">
            <button onClick={() => moveLayer(selected.id, 'up')} className="flex flex-1 items-center justify-center gap-1 rounded border border-input py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors active:scale-95">
              <ArrowUp className="h-3 w-3" /> Forward
            </button>
            <button onClick={() => moveLayer(selected.id, 'down')} className="flex flex-1 items-center justify-center gap-1 rounded border border-input py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors active:scale-95">
              <ArrowDown className="h-3 w-3" /> Back
            </button>
          </div>
        </fieldset>
      </div>

      {/* Actions */}
      <div className="border-t border-panel-border p-3 space-y-2">
        {/* Crop button - only for icons */}
        {selected.type === 'icon' && (
          <button
            onClick={() => update({ cropMode: !selected.cropMode })}
            className={`flex w-full items-center justify-center gap-2 rounded-lg border py-2 text-sm font-medium transition-all active:scale-[0.97] ${
              selected.cropMode
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-input text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            <Crop className="h-3.5 w-3.5" />
            {selected.cropMode ? 'Editing Crop...' : 'Crop'}
          </button>
        )}
        
        {/* Delete */}
        <button
          onClick={() => removeElement(selected.id)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-destructive/30 py-2 text-sm font-medium text-destructive transition-all hover:bg-destructive/10 active:scale-[0.97]"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>
      </div>
    </div>
  );
}

