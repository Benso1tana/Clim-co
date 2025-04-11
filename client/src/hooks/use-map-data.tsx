import { useQuery } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import * as d3 from 'd3';
import { MapData, CountryGdpData } from '@/lib/types';
import { getColorScaleExtent } from '@/lib/gdp-data';

export function useMapData() {
  const [colorScaleType, setColorScaleType] = useState<'linear' | 'log' | 'quantile'>('linear');
  
  const { data: mapData, isLoading: mapLoading, error: mapError } = useQuery<MapData>({
    queryKey: ['/api/map-data']
  });

  const createColorScale = (data: CountryGdpData[]) => {
    const [min, max] = getColorScaleExtent(data);
    
    // Define a more distinct blue palette with greater contrast between values
    const colorPalette = [
      '#E6F0FA', // Extremely light blue (lowest GDP)
      '#B6D8F2', // Very light blue
      '#80B5E8', // Light blue
      '#4186D9', // Medium blue
      '#1F5FC9', // Dark blue
      '#0A337A'  // Very dark blue (highest GDP)
    ];
    
    switch (colorScaleType) {
      case 'log':
        // Create a scale with explicit output type as string
        const logScale = d3.scaleLog<string>()
          .domain([Math.max(1, min), max])
          .range([colorPalette[0], colorPalette[4]])
          // Casting to any to avoid TypeScript errors with the interpolator
          .interpolate(d3.interpolateHcl as any) 
          .clamp(true);
        return logScale;
      case 'quantile':
        return d3.scaleQuantile<string>()
          .domain(data.map(d => d.gdpValue).filter(v => !isNaN(v)))
          .range(colorPalette);
      case 'linear':
      default:
        // Create a scale with explicit output type as string
        const linearScale = d3.scaleLinear<string>()
          .domain([min, min + (max-min)*0.25, min + (max-min)*0.5, min + (max-min)*0.75, max])
          .range(colorPalette)
          // Casting to any to avoid TypeScript errors with the interpolator
          .interpolate(d3.interpolateHcl as any) 
          .clamp(true);
        return linearScale;
    }
  };

  const getCountryColor = (countryCode: string, gdpData: CountryGdpData[]) => {
    if (!gdpData || !gdpData.length) return '#F5F5F5';
    
    const country = gdpData.find(d => d.countryCode === countryCode);
    if (!country || isNaN(country.gdpValue)) return '#F5F5F5';
    
    const colorScale = createColorScale(gdpData);
    return colorScale(country.gdpValue);
  };

  return {
    mapData,
    mapLoading,
    mapError,
    colorScaleType,
    setColorScaleType,
    createColorScale,
    getCountryColor
  };
}
