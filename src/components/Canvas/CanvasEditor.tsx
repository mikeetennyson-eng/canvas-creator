import { useEffect, useRef, useCallback, useState } from 'react';
import { Stage, Layer, Rect, Ellipse, Text, Arrow, Image as KonvaImage, Transformer, Group } from 'react-konva';
import type Konva from 'konva';
import { useCanvasStore } from '@/stores/canvasStore';
import { useIconStore } from '@/stores/iconStore';
import { generateIconDataUrl } from '@/hooks/useIconRenderer';
import type { CanvasElement, IconData } from '@/types/editor';

function CanvasIcon({ element, isSelected, onSelect }: { element: CanvasElement; isSelected: boolean; onSelect: () => void }) {
  const imgRef = useRef<Konva.Image>(null);
  const groupRef = useRef<Konva.Group>(null);
  const cropRectRef = useRef<Konva.Rect>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const updateElement = useCanvasStore((s) => s.updateElement);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [cropBoxState, setCropBoxState] = useState({
    x: element.cropBox?.x ?? 0,
    y: element.cropBox?.y ?? 0,
    width: element.cropBox?.width ?? element.width,
    height: element.cropBox?.height ?? element.height,
  });
  const [draggingHandle, setDraggingHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const image = new window.Image();
    const url = element.svg_url || (element.iconData ? generateIconDataUrl(element.iconData.category, element.iconData.name, 128) : '');
    image.src = url;
    image.onload = () => setImg(image);
  }, [element.svg_url, element.iconData]);

  useEffect(() => {
    if (isSelected && !element.cropMode && trRef.current) {
      // If cropped, attach transformer to the crop boundary rect 
      // so it shows the crop region size, not the full image size
      const nodeToTransform = element.cropBox ? cropRectRef.current : imgRef.current;
      if (nodeToTransform) {
        trRef.current.nodes([nodeToTransform]);
        trRef.current.getLayer()?.batchDraw();
      }
    }
  }, [isSelected, element.cropMode, element.cropBox]);

  // Update crop box state when element changes
  useEffect(() => {
    if (element.cropBox) {
      setCropBoxState(element.cropBox);
    }
  }, [element.cropBox]);

  // Add global mouse up handler to catch drags outside the canvas
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (draggingHandle) {
        setDraggingHandle(null);
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [draggingHandle]);

  const applyCrop = () => {
    updateElement(element.id, {
      cropBox: cropBoxState,
      cropMode: false,
    });
  };

  const cancelCrop = () => {
    setCropBoxState({
      x: element.cropBox?.x ?? 0,
      y: element.cropBox?.y ?? 0,
      width: element.cropBox?.width ?? element.width,
      height: element.cropBox?.height ?? element.height,
    });
    updateElement(element.id, { cropMode: false });
  };

  const handleCropHandleMouseDown = (handle: string, e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!element.cropMode) return;
    e.cancelBubble = true;
    setDraggingHandle(handle);
    const pos = e.target.getStage()?.getPointerPosition();
    if (pos) {
      setDragStart({ x: pos.x, y: pos.y });
    }
  };

  const handleCropMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!draggingHandle || !element.cropMode) return;
    
    const stage = e.target.getStage();
    const pos = stage?.getPointerPosition();
    if (!pos) return;

    const deltaX = pos.x - dragStart.x;
    const deltaY = pos.y - dragStart.y;

    const newCropBox = { ...cropBoxState };
    const minSize = 20;

    // Handle different resize directions
    if (draggingHandle === 'tl') { // top-left
      newCropBox.x = Math.max(0, cropBoxState.x + deltaX);
      newCropBox.y = Math.max(0, cropBoxState.y + deltaY);
      newCropBox.width = Math.max(minSize, cropBoxState.width - deltaX);
      newCropBox.height = Math.max(minSize, cropBoxState.height - deltaY);
    } else if (draggingHandle === 'tm') { // top-middle
      newCropBox.y = Math.max(0, cropBoxState.y + deltaY);
      newCropBox.height = Math.max(minSize, cropBoxState.height - deltaY);
    } else if (draggingHandle === 'tr') { // top-right
      newCropBox.y = Math.max(0, cropBoxState.y + deltaY);
      newCropBox.width = Math.min(element.width - cropBoxState.x, cropBoxState.width + deltaX);
      newCropBox.height = Math.max(minSize, cropBoxState.height - deltaY);
    } else if (draggingHandle === 'ml') { // middle-left
      newCropBox.x = Math.max(0, cropBoxState.x + deltaX);
      newCropBox.width = Math.max(minSize, cropBoxState.width - deltaX);
    } else if (draggingHandle === 'mr') { // middle-right
      newCropBox.width = Math.min(element.width - cropBoxState.x, cropBoxState.width + deltaX);
    } else if (draggingHandle === 'bl') { // bottom-left
      newCropBox.x = Math.max(0, cropBoxState.x + deltaX);
      newCropBox.width = Math.max(minSize, cropBoxState.width - deltaX);
      newCropBox.height = Math.min(element.height - cropBoxState.y, cropBoxState.height + deltaY);
    } else if (draggingHandle === 'bm') { // bottom-middle
      newCropBox.height = Math.min(element.height - cropBoxState.y, cropBoxState.height + deltaY);
    } else if (draggingHandle === 'br') { // bottom-right
      newCropBox.width = Math.min(element.width - cropBoxState.x, cropBoxState.width + deltaX);
      newCropBox.height = Math.min(element.height - cropBoxState.y, cropBoxState.height + deltaY);
    }

    setCropBoxState(newCropBox);
    // Update the element's crop box in the store as user drags
    updateElement(element.id, { cropBox: newCropBox });
    setDragStart({ x: pos.x, y: pos.y });
  };

  const handleCropMouseUp = () => {
    setDraggingHandle(null);
  };

  if (!img) return null;

  // Calculate the displayed crop box (with offset from image position)
  const displayCropBox = {
    x: element.x + cropBoxState.x,
    y: element.y + cropBoxState.y,
    width: cropBoxState.width,
    height: cropBoxState.height,
  };

  const cropBox = element.cropBox;
  const displayX = cropBox ? element.x + cropBox.x : element.x;
  const displayY = cropBox ? element.y + cropBox.y : element.y;
  const displayWidth = cropBox ? cropBox.width : element.width;
  const displayHeight = cropBox ? cropBox.height : element.height;
  const imageX = cropBox ? element.x - cropBox.x : element.x;
  const imageY = cropBox ? element.y - cropBox.y : element.y;

  return (
    <>
      {/* If cropped, wrap in a Group with clip region */}
      {cropBox && !element.cropMode ? (
        <Group
          ref={groupRef}
          x={displayX}
          y={displayY}
          clipFunc={(ctx) => {
            ctx.rect(0, 0, displayWidth, displayHeight);
          }}
          draggable
          onClick={onSelect}
          onTap={onSelect}
          onDragEnd={(e) => updateElement(element.id, { x: e.target.x(), y: e.target.y() })}
        >
          {/* Invisible background rect to define the cropped bounds for Transformer */}
          <Rect
            ref={cropRectRef}
            x={0}
            y={0}
            width={displayWidth}
            height={displayHeight}
            fill="transparent"
            stroke="transparent"
            onTransformEnd={() => {
              // When the crop rect is transformed, apply it to the entire group
              if (!cropRectRef.current || !groupRef.current) return;
              const rectScaleX = cropRectRef.current.scaleX();
              const rectScaleY = cropRectRef.current.scaleY();
              cropRectRef.current.scaleX(1);
              cropRectRef.current.scaleY(1);
              
              const newWidth = Math.max(5, displayWidth * rectScaleX);
              const newHeight = Math.max(5, displayHeight * rectScaleY);
              
              // Update the group's rendered width and height through the element store
              const updates: any = {
                x: groupRef.current.x(),
                y: groupRef.current.y(),
                width: newWidth,
                height: newHeight,
              };
              
              // Scale the image size along with the crop
              updates.width = Math.max(5, element.width * rectScaleX);
              updates.height = Math.max(5, element.height * rectScaleY);
              
              // Scale the crop box proportionally
              if (element.cropBox) {
                updates.cropBox = {
                  x: element.cropBox.x * rectScaleX,
                  y: element.cropBox.y * rectScaleY,
                  width: element.cropBox.width * rectScaleX,
                  height: element.cropBox.height * rectScaleY,
                };
              }
              
              updateElement(element.id, updates);
            }}
          />
          <KonvaImage
            ref={imgRef}
            image={img}
            x={imageX - displayX}
            y={imageY - displayY}
            width={element.width}
            height={element.height}
            rotation={element.rotation}
            opacity={element.opacity}
            onTransformEnd={() => {
              const node = imgRef.current;
              if (!node) return;
              const scaleX = node.scaleX();
              const scaleY = node.scaleY();
              node.scaleX(1);
              node.scaleY(1);
              
              const newWidth = Math.max(5, node.width() * scaleX);
              const newHeight = Math.max(5, node.height() * scaleY);
              
              const updates: any = {
                x: node.x() + displayX,
                y: node.y() + displayY,
                width: newWidth,
                height: newHeight,
                rotation: node.rotation(),
              };
              
              // If cropped, scale the cropBox proportionally to match image scaling
              if (element.cropBox) {
                updates.cropBox = {
                  x: element.cropBox.x * (newWidth / element.width),
                  y: element.cropBox.y * (newHeight / element.height),
                  width: element.cropBox.width * (newWidth / element.width),
                  height: element.cropBox.height * (newHeight / element.height),
                };
              }
              
              updateElement(element.id, updates);
            }}
          />
        </Group>
      ) : (
        <KonvaImage
          ref={imgRef}
          image={img}
          x={element.x}
          y={element.y}
          width={element.width}
          height={element.height}
          rotation={element.rotation}
          opacity={element.cropMode ? 0.5 : element.opacity}
          draggable={!element.cropMode}
          onClick={onSelect}
          onTap={onSelect}
          onDragEnd={(e) => !element.cropMode && updateElement(element.id, { x: e.target.x(), y: e.target.y() })}
          onTransformEnd={() => {
            if (element.cropMode) return;
            const node = imgRef.current;
            if (!node) return;
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();
            node.scaleX(1);
            node.scaleY(1);
            updateElement(element.id, {
              x: node.x(), y: node.y(),
              width: Math.max(5, node.width() * scaleX),
              height: Math.max(5, node.height() * scaleY),
              rotation: node.rotation(),
            });
          }}
        />
      )}
      {isSelected && !element.cropMode && <Transformer ref={trRef} rotateEnabled enabledAnchors={['top-left', 'top-center', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right']} />}
      
      {/* Crop mode overlay */}
      {element.cropMode && (
        <Group
          onMouseMove={handleCropMouseMove}
          onMouseUp={handleCropMouseUp}
          onMouseLeave={handleCropMouseUp}
        >
          {/* Darkened overlay outside crop area */}
          <Rect
            x={element.x}
            y={element.y}
            width={cropBoxState.x}
            height={element.height}
            fill="black"
            opacity={0.6}
          />
          <Rect
            x={element.x + cropBoxState.x + cropBoxState.width}
            y={element.y}
            width={element.width - cropBoxState.x - cropBoxState.width}
            height={element.height}
            fill="black"
            opacity={0.6}
          />
          <Rect
            x={element.x + cropBoxState.x}
            y={element.y}
            width={cropBoxState.width}
            height={cropBoxState.y}
            fill="black"
            opacity={0.6}
          />
          <Rect
            x={element.x + cropBoxState.x}
            y={element.y + cropBoxState.y + cropBoxState.height}
            width={cropBoxState.width}
            height={element.height - cropBoxState.y - cropBoxState.height}
            fill="black"
            opacity={0.6}
          />
          
          {/* Crop box border */}
          <Rect
            x={displayCropBox.x}
            y={displayCropBox.y}
            width={displayCropBox.width}
            height={displayCropBox.height}
            stroke="#3b82f6"
            strokeWidth={2}
            fill="transparent"
          />
          
          {/* Crop handles */}
          {[
            { handle: 'tl', x: displayCropBox.x, y: displayCropBox.y, cursor: 'nw-resize' },
            { handle: 'tm', x: displayCropBox.x + displayCropBox.width / 2, y: displayCropBox.y, cursor: 'n-resize' },
            { handle: 'tr', x: displayCropBox.x + displayCropBox.width, y: displayCropBox.y, cursor: 'ne-resize' },
            { handle: 'ml', x: displayCropBox.x, y: displayCropBox.y + displayCropBox.height / 2, cursor: 'w-resize' },
            { handle: 'mr', x: displayCropBox.x + displayCropBox.width, y: displayCropBox.y + displayCropBox.height / 2, cursor: 'e-resize' },
            { handle: 'bl', x: displayCropBox.x, y: displayCropBox.y + displayCropBox.height, cursor: 'sw-resize' },
            { handle: 'bm', x: displayCropBox.x + displayCropBox.width / 2, y: displayCropBox.y + displayCropBox.height, cursor: 's-resize' },
            { handle: 'br', x: displayCropBox.x + displayCropBox.width, y: displayCropBox.y + displayCropBox.height, cursor: 'se-resize' },
          ].map(({ handle, x, y }, i) => (
            <Rect
              key={i}
              x={x - 4}
              y={y - 4}
              width={8}
              height={8}
              fill="#3b82f6"
              stroke="white"
              strokeWidth={1}
              onMouseDown={(e) => handleCropHandleMouseDown(handle, e)}
            />
          ))}
        </Group>
      )}
    </>
  );
}

function CanvasShape({ element, isSelected, onSelect }: { element: CanvasElement; isSelected: boolean; onSelect: () => void }) {
  const shapeRef = useRef<Konva.Rect | Konva.Ellipse>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const updateElement = useCanvasStore((s) => s.updateElement);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  // Determine fill color - if 'none' or 'transparent', don't fill
  const fillColor = element.fill === 'none' || element.fill === 'transparent' ? 'transparent' : (element.fill || '#3b82f6');

  const commonProps = {
    ref: shapeRef as any,
    x: element.x,
    y: element.y,
    rotation: element.rotation,
    opacity: element.opacity,
    fill: fillColor,
    stroke: element.stroke || '#1e40af',
    strokeWidth: element.strokeWidth || 2,
    draggable: true,
    onClick: onSelect,
    onTap: onSelect,
    onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => updateElement(element.id, { x: e.target.x(), y: e.target.y() }),
    onTransformEnd: () => {
      const node = shapeRef.current;
      if (!node) return;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      node.scaleX(1);
      node.scaleY(1);
      updateElement(element.id, {
        x: node.x(), y: node.y(),
        width: Math.max(5, node.width() * scaleX),
        height: Math.max(5, node.height() * scaleY),
        rotation: node.rotation(),
      });
    },
  };

  return (
    <>
      {element.shapeType === 'circle' || element.shapeType === 'ellipse' ? (
        <Ellipse {...commonProps} radiusX={element.width / 2} radiusY={element.height / 2} />
      ) : (
        <Rect {...commonProps} width={element.width} height={element.height} cornerRadius={4} />
      )}
      {isSelected && <Transformer ref={trRef} rotateEnabled enabledAnchors={['top-left', 'top-center', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right']} />}
    </>
  );
}

function CanvasText({ element, isSelected, onSelect }: { element: CanvasElement; isSelected: boolean; onSelect: () => void }) {
  const textRef = useRef<Konva.Text>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const updateElement = useCanvasStore((s) => s.updateElement);

  useEffect(() => {
    if (isSelected && trRef.current && textRef.current) {
      trRef.current.nodes([textRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <Text
        ref={textRef}
        text={element.text || 'Text'}
        x={element.x}
        y={element.y}
        fontSize={element.fontSize || 16}
        fontFamily="DM Sans"
        fill={element.fill || '#1a1a1a'}
        rotation={element.rotation}
        opacity={element.opacity}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => updateElement(element.id, { x: e.target.x(), y: e.target.y() })}
        onTransformEnd={() => {
          const node = textRef.current;
          if (!node) return;
          updateElement(element.id, { x: node.x(), y: node.y(), fontSize: Math.max(8, (element.fontSize || 16) * node.scaleY()), rotation: node.rotation() });
          node.scaleX(1);
          node.scaleY(1);
        }}
      />
      {isSelected && <Transformer ref={trRef} rotateEnabled enabledAnchors={['middle-left', 'middle-right']} />}
    </>
  );
}

function CanvasArrow({ element, isSelected, onSelect }: { element: CanvasElement; isSelected: boolean; onSelect: () => void }) {
  const updateElement = useCanvasStore((s) => s.updateElement);

  return (
    <Arrow
      points={element.points || [0, 0, element.width, element.height]}
      x={element.x}
      y={element.y}
      stroke={element.stroke || '#1a1a1a'}
      strokeWidth={element.strokeWidth || 2}
      fill={element.stroke || '#1a1a1a'}
      opacity={element.opacity}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => updateElement(element.id, { x: e.target.x(), y: e.target.y() })}
    />
  );
}

export default function CanvasEditor() {
  const {
    elements, selectedIds, setSelectedIds, clearSelection,
    activeTool, addElement, zoom, setZoom, panX, panY, setPan, updateElement,
  } = useCanvasStore();
  const trackUsedIcon = useIconStore((s) => s.trackUsedIcon);
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });

  // Resize observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setStageSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Wheel zoom
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const scaleBy = 1.05;
    const stage = stageRef.current;
    if (!stage) return;
    const oldScale = zoom;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const clampedScale = Math.max(0.1, Math.min(5, newScale));

    const mousePointTo = {
      x: (pointer.x - panX) / oldScale,
      y: (pointer.y - panY) / oldScale,
    };

    setZoom(clampedScale);
    setPan(pointer.x - mousePointTo.x * clampedScale, pointer.y - mousePointTo.y * clampedScale);
  }, [zoom, panX, panY, setZoom, setPan]);

  // Click to add shapes
  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage()) {
      if (activeTool === 'select') {
        // Before clearing selection, exit crop mode if any selected element is in crop mode
        for (const id of selectedIds) {
          const element = elements.find(el => el.id === id);
          if (element?.cropMode) {
            updateElement(id, { cropMode: false });
          }
        }
        clearSelection();
        return;
      }

      const stage = stageRef.current;
      const pointer = stage?.getPointerPosition();
      if (!pointer) return;

      const x = (pointer.x - panX) / zoom;
      const y = (pointer.y - panY) / zoom;
      const id = `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      if (activeTool === 'rect') {
        addElement({ id, type: 'shape', shapeType: 'rect', x, y, width: 120, height: 80, rotation: 0, opacity: 1, fill: '#3b82f6', stroke: '#1e40af', strokeWidth: 2, zIndex: 0 });
      } else if (activeTool === 'circle') {
        addElement({ id, type: 'shape', shapeType: 'circle', x, y, width: 100, height: 100, rotation: 0, opacity: 1, fill: '#10b981', stroke: '#047857', strokeWidth: 2, zIndex: 0 });
      } else if (activeTool === 'text') {
        addElement({ id, type: 'text', x, y, width: 200, height: 30, rotation: 0, opacity: 1, text: 'Double-click to edit', fontSize: 16, fill: '#1a1a1a', zIndex: 0 });
      } else if (activeTool === 'arrow') {
        addElement({ id, type: 'arrow', x, y, width: 100, height: 0, rotation: 0, opacity: 1, points: [0, 0, 100, 0], stroke: '#1a1a1a', strokeWidth: 2, zIndex: 0 });
      }
    }
  };

  // Drop handler for icons
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/json');
    if (!data) return;
    const icon: IconData = JSON.parse(data);
    const stage = stageRef.current;
    if (!stage) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left - panX) / zoom;
    const y = (e.clientY - rect.top - panY) / zoom;
    const id = `icon-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const svg_url = icon.svg_url;
    addElement({ id, type: 'icon', x, y, width: 80, height: 80, rotation: 0, opacity: 1, zIndex: 0, iconData: icon, svg_url });
    trackUsedIcon(icon);
  }, [addElement, trackUsedIcon, zoom, panX, panY]);

  const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div
      ref={containerRef}
      className="relative flex-1 overflow-hidden bg-canvas"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      {/* Grid pattern */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)`,
          backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
          backgroundPosition: `${panX}px ${panY}px`,
          opacity: 0.5,
        }}
      />

      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        scaleX={zoom}
        scaleY={zoom}
        x={panX}
        y={panY}
        onClick={handleStageClick}
        onWheel={handleWheel}
        draggable={activeTool === 'select'}
        onDragEnd={(e) => {
          if (e.target === stageRef.current) {
            setPan(e.target.x(), e.target.y());
          }
        }}
      >
        <Layer>
          {sorted.map((el) => {
            const isSelected = selectedIds.includes(el.id);
            const onSelect = () => setSelectedIds([el.id]);

            switch (el.type) {
              case 'icon':
                return <CanvasIcon key={el.id} element={el} isSelected={isSelected} onSelect={onSelect} />;
              case 'shape':
                return <CanvasShape key={el.id} element={el} isSelected={isSelected} onSelect={onSelect} />;
              case 'text':
                return <CanvasText key={el.id} element={el} isSelected={isSelected} onSelect={onSelect} />;
              case 'arrow':
                return <CanvasArrow key={el.id} element={el} isSelected={isSelected} onSelect={onSelect} />;
              default:
                return null;
            }
          })}
        </Layer>
      </Stage>

      {/* Crop buttons - show when in crop mode */}
      {selectedIds.length === 1 && elements.find(el => el.id === selectedIds[0])?.cropMode && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-50">
          <button
            onClick={() => {
              const selected = elements.find(el => el.id === selectedIds[0]);
              if (selected) {
                updateElement(selected.id, { cropMode: false });
              }
            }}
            className="px-3 py-1.5 rounded bg-card border border-panel-border text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              const selected = elements.find(el => el.id === selectedIds[0]);
              if (selected?.type === 'icon') {
                // Apply crop by exiting crop mode
                // The cropBox has been saved during dragging in handleCropMouseMove
                updateElement(selected.id, {
                  cropMode: false,
                });
              }
            }}
            className="px-3 py-1.5 rounded bg-primary text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Apply Crop
          </button>
        </div>
      )}

      {/* Status bar */}
      <div className="absolute bottom-2 left-2 flex items-center gap-3 rounded-md bg-card/90 px-2.5 py-1 text-[10px] text-muted-foreground backdrop-blur-sm border border-panel-border">
        <span>{elements.length} element{elements.length !== 1 ? 's' : ''}</span>
        <span>·</span>
        <span>{Math.round(zoom * 100)}%</span>
      </div>
    </div>
  );
}

