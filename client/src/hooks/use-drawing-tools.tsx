import { useState, useRef, useCallback } from 'react';
import { Annotation, DrawingOptions } from '@/lib/types';

export function useDrawingTools() {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [activeTool, setActiveTool] = useState<string>('pointer');
  const [drawingColor, setDrawingColor] = useState<string>('#1565C0');
  const [drawingSize, setDrawingSize] = useState<number>(2);
  const drawingRef = useRef<SVGSVGElement | null>(null);
  const isDrawing = useRef<boolean>(false);
  const currentAnnotation = useRef<Partial<Annotation> | null>(null);

  const getDrawingOptions = useCallback((): DrawingOptions => {
    return {
      color: drawingColor,
      size: drawingSize,
      tool: activeTool
    };
  }, [drawingColor, drawingSize, activeTool]);

  const startDrawing = useCallback((event: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
    if (activeTool === 'pointer') return;
    
    isDrawing.current = true;
    const svg = drawingRef.current;
    if (!svg) return;
    
    // Get SVG coordinates
    const svgRect = svg.getBoundingClientRect();
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    const point = [
      clientX - svgRect.left,
      clientY - svgRect.top
    ] as [number, number];

    switch (activeTool) {
      case 'marker':
        const marker: Annotation = {
          id: Date.now().toString(),
          type: 'marker',
          coordinates: point,
          color: drawingColor
        };
        setAnnotations(prev => [...prev, marker]);
        break;
      case 'line':
      case 'circle':
        currentAnnotation.current = {
          id: Date.now().toString(),
          type: activeTool as 'line' | 'circle',
          coordinates: [point, point],
          color: drawingColor
        };
        break;
      case 'text':
        // For text, we just place a marker and then prompt for text
        const text = prompt('Enter annotation text:');
        if (text) {
          const textAnnotation: Annotation = {
            id: Date.now().toString(),
            type: 'text',
            content: text,
            coordinates: point,
            color: drawingColor
          };
          setAnnotations(prev => [...prev, textAnnotation]);
        }
        break;
    }
  }, [activeTool, drawingColor]);

  const moveDrawing = useCallback((event: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
    if (!isDrawing.current || !currentAnnotation.current || activeTool === 'pointer') return;
    
    const svg = drawingRef.current;
    if (!svg) return;
    
    // Get SVG coordinates
    const svgRect = svg.getBoundingClientRect();
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    const point = [
      clientX - svgRect.left,
      clientY - svgRect.top
    ] as [number, number];

    if (Array.isArray(currentAnnotation.current.coordinates)) {
      const coords = [...currentAnnotation.current.coordinates] as [number, number][];
      coords[1] = point;
      currentAnnotation.current.coordinates = coords;
      
      // Create temporary visualization for drawing in progress
      const tempAnnotation = { ...currentAnnotation.current } as Annotation;
      setAnnotations(prev => [...prev.filter(a => a.id !== tempAnnotation.id), tempAnnotation]);
    }
  }, [activeTool]);

  const endDrawing = useCallback(() => {
    if (!isDrawing.current || !currentAnnotation.current) {
      isDrawing.current = false;
      return;
    }
    
    if (currentAnnotation.current.type === 'line' || currentAnnotation.current.type === 'circle') {
      const annotation = { ...currentAnnotation.current } as Annotation;
      setAnnotations(prev => [...prev.filter(a => a.id !== annotation.id), annotation]);
    }
    
    isDrawing.current = false;
    currentAnnotation.current = null;
  }, []);

  const clearDrawings = useCallback(() => {
    setAnnotations([]);
  }, []);

  return {
    annotations,
    setAnnotations,
    activeTool,
    setActiveTool,
    drawingColor,
    setDrawingColor,
    drawingSize,
    setDrawingSize,
    drawingRef,
    startDrawing,
    moveDrawing,
    endDrawing,
    clearDrawings,
    getDrawingOptions
  };
}
