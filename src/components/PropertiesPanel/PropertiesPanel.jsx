import { useCanvasStore } from '@/stores/canvasStore.js';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Slider } from '@/components/ui/slider.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { ArrowUp, ArrowDown, Trash2, Copy } from 'lucide-react';

export default function PropertiesPanel() {
  const { elements, selectedIds, updateElement, removeSelected, moveLayer } = useCanvasStore();
  const selected = elements.filter((el) => selectedIds.includes(el.id));
  const element = selected[0];

  if (!element) {
    return (
      <div className="w-64 border-l border-panel-border bg-sidebar p-4 flex items-center justify-center text-sm text-muted-foreground">
        Select an element to edit
      </div>
    );
  }

  const handlePropChange = (prop, value) => {
    updateElement(element.id, { [prop]: value });
  };

  const commonProps = ['x', 'y', 'width', 'height', 'rotation', 'opacity'];
  const getDisplayValue = (prop) => {
    const val = element[prop];
    return val !== undefined ? val : '';
  };

  return (
    <div className="w-64 border-l border-panel-border bg-sidebar overflow-y-auto">
      <div className="p-4 space-y-4">
        {/* Element Type */}
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Type</Label>
          <div className="text-sm font-medium capitalize px-2 py-1 rounded bg-secondary text-secondary-foreground">
            {element.type === 'shape' ? (element.shapeType || 'shape') : element.type}
          </div>
        </div>

        {/* Position Controls */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Position</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground/70 mb-1 block">X</Label>
              <Input
                type="number"
                value={Math.round(getDisplayValue('x'))}
                onChange={(e) => handlePropChange('x', parseFloat(e.target.value))}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground/70 mb-1 block">Y</Label>
              <Input
                type="number"
                value={Math.round(getDisplayValue('y'))}
                onChange={(e) => handlePropChange('y', parseFloat(e.target.value))}
                className="h-8 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Size Controls */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Size</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground/70 mb-1 block">Width</Label>
              <Input
                type="number"
                value={Math.round(getDisplayValue('width'))}
                onChange={(e) => handlePropChange('width', Math.max(5, parseFloat(e.target.value)))}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground/70 mb-1 block">Height</Label>
              <Input
                type="number"
                value={Math.round(getDisplayValue('height'))}
                onChange={(e) => handlePropChange('height', Math.max(5, parseFloat(e.target.value)))}
                className="h-8 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Rotation */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Rotation</Label>
            <span className="text-xs font-medium">{Math.round(getDisplayValue('rotation'))}°</span>
          </div>
          <Slider
            value={[getDisplayValue('rotation') || 0]}
            onValueChange={(val) => handlePropChange('rotation', val[0])}
            min={0}
            max={360}
            step={1}
            className="w-full"
          />
        </div>

        {/* Opacity */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Opacity</Label>
            <span className="text-xs font-medium">{Math.round((getDisplayValue('opacity') || 1) * 100)}%</span>
          </div>
          <Slider
            value={[getDisplayValue('opacity') || 1]}
            onValueChange={(val) => handlePropChange('opacity', val[0])}
            min={0}
            max={1}
            step={0.01}
            className="w-full"
          />
        </div>

        {/* Shape-specific properties */}
        {element.type === 'shape' && (
          <>
            {/* Fill Color */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Fill Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={element.fill || '#3b82f6'}
                  onChange={(e) => handlePropChange('fill', e.target.value)}
                  className="h-8 w-12 rounded border border-input cursor-pointer"
                />
                <Input
                  type="text"
                  value={element.fill || '#3b82f6'}
                  onChange={(e) => handlePropChange('fill', e.target.value)}
                  className="h-8 text-xs flex-1"
                />
              </div>
            </div>

            {/* Stroke Color */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Stroke Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={element.stroke || '#1e40af'}
                  onChange={(e) => handlePropChange('stroke', e.target.value)}
                  className="h-8 w-12 rounded border border-input cursor-pointer"
                />
                <Input
                  type="text"
                  value={element.stroke || '#1e40af'}
                  onChange={(e) => handlePropChange('stroke', e.target.value)}
                  className="h-8 text-xs flex-1"
                />
              </div>
            </div>

            {/* Stroke Width */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Stroke Width</Label>
                <span className="text-xs font-medium">{element.strokeWidth || 2}px</span>
              </div>
              <Slider
                value={[element.strokeWidth || 2]}
                onValueChange={(val) => handlePropChange('strokeWidth', val[0])}
                min={0}
                max={10}
                step={0.5}
                className="w-full"
              />
            </div>
          </>
        )}

        {/* Text-specific properties */}
        {element.type === 'text' && (
          <>
            {/* Text Content */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Text</Label>
              <textarea
                value={element.text || ''}
                onChange={(e) => handlePropChange('text', e.target.value)}
                className="w-full h-16 p-2 text-xs border border-input rounded bg-background text-foreground resize-none"
                placeholder="Enter text..."
              />
            </div>

            {/* Font Size */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Font Size</Label>
                <span className="text-xs font-medium">{element.fontSize || 16}px</span>
              </div>
              <Slider
                value={[element.fontSize || 16]}
                onValueChange={(val) => handlePropChange('fontSize', val[0])}
                min={8}
                max={72}
                step={1}
                className="w-full"
              />
            </div>

            {/* Text Color */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Text Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={element.fill || '#1a1a1a'}
                  onChange={(e) => handlePropChange('fill', e.target.value)}
                  className="h-8 w-12 rounded border border-input cursor-pointer"
                />
                <Input
                  type="text"
                  value={element.fill || '#1a1a1a'}
                  onChange={(e) => handlePropChange('fill', e.target.value)}
                  className="h-8 text-xs flex-1"
                />
              </div>
            </div>
          </>
        )}

        {/* Arrow-specific properties */}
        {element.type === 'arrow' && (
          <>
            {/* Stroke Color */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Arrow Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={element.stroke || '#1a1a1a'}
                  onChange={(e) => handlePropChange('stroke', e.target.value)}
                  className="h-8 w-12 rounded border border-input cursor-pointer"
                />
                <Input
                  type="text"
                  value={element.stroke || '#1a1a1a'}
                  onChange={(e) => handlePropChange('stroke', e.target.value)}
                  className="h-8 text-xs flex-1"
                />
              </div>
            </div>

            {/* Stroke Width */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Stroke Width</Label>
                <span className="text-xs font-medium">{element.strokeWidth || 2}px</span>
              </div>
              <Slider
                value={[element.strokeWidth || 2]}
                onValueChange={(val) => handlePropChange('strokeWidth', val[0])}
                min={0}
                max={10}
                step={0.5}
                className="w-full"
              />
            </div>
          </>
        )}

        {/* Layer Controls */}
        <div className="space-y-2 pt-2 border-t border-panel-border">
          <Label className="text-xs text-muted-foreground">Layer</Label>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 flex-1 text-xs"
              onClick={() => moveLayer(element.id, 'forward')}
            >
              <ArrowUp className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 flex-1 text-xs"
              onClick={() => moveLayer(element.id, 'back')}
            >
              <ArrowDown className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Delete Button */}
        <div className="pt-2 border-t border-panel-border">
          <Button
            size="sm"
            variant="destructive"
            className="w-full h-8 text-xs"
            onClick={removeSelected}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
