import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet.heat';
import { AirQualityMeasurement } from '@shared/schema';
import { AirQualityParameter, getValueColor, getValueIntensity } from '@/hooks/use-air-quality-data';

// Extend Window interface to include mapContext
declare global {
  interface Window {
    mapContext?: L.Map;
  }
}

interface HeatmapLayerProps {
  points: AirQualityMeasurement[];
  visible: boolean;
  parameter: AirQualityParameter;
  radius?: number;
  maxZoom?: number;
  blur?: number;
  max?: number;
}

export default function HeatmapLayer({
  points,
  visible,
  parameter,
  radius = 25,
  maxZoom = 18,
  blur = 15,
  max = 1.0
}: HeatmapLayerProps) {
  const heatLayerRef = useRef<L.HeatLayer | null>(null);
  const circleLayerRef = useRef<L.LayerGroup | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  
  // Effect to add/remove the heatmap layer when visibility changes
  useEffect(() => {
    // Return early if no map context
    if (!window.mapContext) return;
    
    mapRef.current = window.mapContext;
    
    if (visible && points && points.length > 0) {
      // Remove previous layers if they exist
      if (heatLayerRef.current) {
        mapRef.current.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
      
      if (circleLayerRef.current) {
        mapRef.current.removeLayer(circleLayerRef.current);
        circleLayerRef.current = null;
      }
      
      // Create circle markers for each point
      circleLayerRef.current = L.layerGroup();
      
      points.forEach(point => {
        const intensity = getValueIntensity(point.value, parameter);
        const color = getValueColor(point.value, parameter);
        
        const size = 20 + (intensity * 30); // Scale size based on intensity
        
        const circleMarker = L.circleMarker(
          [point.coordinates.latitude, point.coordinates.longitude],
          {
            radius: size,
            fillColor: color,
            color: 'white',
            weight: 1,
            opacity: 0.8,
            fillOpacity: 0.6
          }
        );
        
        // Add tooltip with information
        circleMarker.bindTooltip(
          `<div class="p-2">
            <div class="font-bold">${point.country || point.location}</div>
            <div>${parameter.toUpperCase()}: ${point.value} ${point.unit}</div>
          </div>`,
          { 
            direction: 'top',
            offset: L.point(0, -10),
            opacity: 0.9
          }
        );
        
        if (circleLayerRef.current) {
          circleLayerRef.current.addLayer(circleMarker);
        }
      });
      
      // Add the layer to the map
      if (circleLayerRef.current && mapRef.current) {
        circleLayerRef.current.addTo(mapRef.current);
      }
      
    } else {
      // Remove layers when not visible
      if (heatLayerRef.current && mapRef.current) {
        mapRef.current.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
      
      if (circleLayerRef.current && mapRef.current) {
        mapRef.current.removeLayer(circleLayerRef.current);
        circleLayerRef.current = null;
      }
    }
    
    return () => {
      // Cleanup
      if (heatLayerRef.current && mapRef.current) {
        mapRef.current.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
      
      if (circleLayerRef.current && mapRef.current) {
        mapRef.current.removeLayer(circleLayerRef.current);
        circleLayerRef.current = null;
      }
    };
  }, [points, visible, parameter, radius, blur, maxZoom, max]);
  
  return null;
}