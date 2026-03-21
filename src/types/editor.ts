export interface IconData {
  id: string;
  name: string;
  category: string;
  tags: string[];
  svg_url: string;
  attribution_required: boolean;
  author: string;
  license: string;
  source_url: string;
}

export interface CanvasElement {
  id: string;
  type: 'icon' | 'shape' | 'text' | 'arrow';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  fill?: string;
  // Icon-specific
  iconData?: IconData;
  svg_url?: string;
  // Text-specific
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  // Shape-specific
  shapeType?: 'rect' | 'circle' | 'ellipse';
  stroke?: string;
  strokeWidth?: number;
  // Arrow-specific
  points?: number[];
  // Layer
  zIndex: number;
}

export type ToolType = 'select' | 'rect' | 'circle' | 'text' | 'arrow';

export interface CanvasState {
  width: number;
  height: number;
  elements: CanvasElement[];
  zoom: number;
  panX: number;
  panY: number;
}
