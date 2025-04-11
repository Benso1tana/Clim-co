import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { MapData, CountryGdpData, CountryData } from '@/lib/types';
import { getCountryRankByGdp, getGdpChangePercentage, formatGdpValue } from '@/lib/gdp-data';

interface MapVisualizationProps {
  mapData: MapData | undefined;
  gdpData: CountryGdpData[];
  previousYearData: CountryGdpData[];
  year: number;
  isLoading: boolean;
  colorScale: any;
  onCountryHover: (country: CountryData | null) => void;
  onCountryClick: (country: CountryData | null) => void;
  drawingRef: React.RefObject<SVGSVGElement>;
  startDrawing: (event: React.MouseEvent<SVGSVGElement>) => void;
  moveDrawing: (event: React.MouseEvent<SVGSVGElement>) => void;
  endDrawing: () => void;
  showBorders: boolean;
  zoomLevel: number;
}

export default function MapVisualization({
  mapData,
  gdpData,
  previousYearData,
  year,
  isLoading,
  colorScale,
  onCountryHover,
  onCountryClick,
  drawingRef,
  startDrawing,
  moveDrawing,
  endDrawing,
  showBorders,
  zoomLevel
}: MapVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  // Setup the map projection and path generator
  useEffect(() => {
    if (!mapData || !svgRef.current || !mapData.features || mapData.features.length === 0) {
      console.log('MapData not ready or invalid:', mapData);
      return;
    }

    console.log('Rendering map with features:', mapData.features.length);

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    
    // Clear previous map
    svg.selectAll('*').remove();
    
    // Create projection and path generator
    const projection = d3.geoMercator()
      .fitSize([width, height], mapData)
      .scale(zoomLevel * 100);
    
    const pathGenerator = d3.geoPath().projection(projection);
    
    // Create a group for the map elements
    const g = svg.append('g');
    
    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    
    svg.call(zoom);
    
    // Draw countries
    g.selectAll('path')
      .data(mapData.features)
      .join('path')
      .attr('d', pathGenerator)
      .attr('fill', (d) => {
        // Try different country code properties to match with GDP data
        const countryCode = d.properties.iso_a3 || d.properties.iso_a2 || '';
        const country = gdpData.find(item => 
          item.countryCode === countryCode || 
          item.countryName === d.properties.name
        );
        
        if (!country || isNaN(country.gdpValue)) {
          return '#F5F5F5'; // Default color for countries with no data
        }
        return colorScale(country.gdpValue);
      })
      .attr('stroke', showBorders ? '#666' : 'none') // Make borders more visible
      .attr('stroke-width', 0.5)
      .attr('class', 'country')
      .attr('data-country', d => d.properties.iso_a3 || d.properties.iso_a2 || '')
      .on('mouseover', (event, d) => {
        const countryCode = d.properties.iso_a3 || d.properties.iso_a2 || '';
        const country = gdpData.find(item => 
          item.countryCode === countryCode || 
          item.countryName === d.properties.name
        );
        
        if (country) {
          setSelectedCountry(countryCode);
          
          const rank = getCountryRankByGdp(country.countryCode, gdpData);
          const change = getGdpChangePercentage(country.countryCode, gdpData, previousYearData);
          
          onCountryHover({
            name: d.properties.name || country.countryName,
            code: country.countryCode,
            gdp: country.gdpValue,
            rank,
            change: change.formatted,
            changeValue: change.value
          });
          
          // Show tooltip
          if (tooltipRef.current) {
            tooltipRef.current.style.display = 'block';
            tooltipRef.current.style.left = `${event.clientX + 15}px`;
            tooltipRef.current.style.top = `${event.clientY + 15}px`;
            
            // Make sure the tooltip is visible
            console.log('Showing tooltip:', {
              country: country.countryName,
              gdp: country.gdpValue,
              left: event.clientX,
              top: event.clientY
            });
          }
        }
      })
      .on('mouseout', () => {
        setSelectedCountry(null);
        onCountryHover(null);
        
        if (tooltipRef.current) {
          tooltipRef.current.style.display = 'none';
        }
      })
      .on('click', (_event, d) => {
        const countryCode = d.properties.iso_a3 || d.properties.iso_a2 || '';
        const country = gdpData.find(item => 
          item.countryCode === countryCode || 
          item.countryName === d.properties.name
        );
        
        if (country) {
          const rank = getCountryRankByGdp(country.countryCode, gdpData);
          const change = getGdpChangePercentage(country.countryCode, gdpData, previousYearData);
          
          onCountryClick({
            name: d.properties.name || country.countryName,
            code: country.countryCode,
            gdp: country.gdpValue,
            rank,
            change: change.formatted,
            changeValue: change.value
          });
        }
      });
      
    // Update selected country styling when it changes
    if (selectedCountry) {
      svg.selectAll('.country')
        .attr('stroke-width', d => {
          const code = (d as any).properties.iso_a3 || (d as any).properties.iso_a2 || '';
          return code === selectedCountry ? 2 : 0.5;
        })
        .attr('stroke', d => {
          const code = (d as any).properties.iso_a3 || (d as any).properties.iso_a2 || '';
          return code === selectedCountry ? '#424242' : (showBorders ? '#666' : 'none');
        });
    }
    
  }, [mapData, gdpData, showBorders, zoomLevel, colorScale, selectedCountry, onCountryHover, onCountryClick, previousYearData]);

  return (
    <div className="absolute inset-0 bg-map-bg">
      <svg 
        ref={svgRef} 
        className="w-full h-full"
      ></svg>
      
      {/* Map Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-20">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-gdp-dark border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-ui-dark font-medium">Loading map data...</p>
          </div>
        </div>
      )}
      
      {/* Country Info Tooltip */}
      <div 
        ref={tooltipRef}
        className="absolute hidden bg-white p-4 rounded-md shadow-xl text-sm text-ui-dark border border-blue-200 z-50 max-w-xs pointer-events-none"
        style={{ minWidth: '200px' }}
      >
        {selectedCountry && (() => {
          // Find country by code or name in the map features
          const country = gdpData.find(item => {
            if (item.countryCode === selectedCountry) return true;
            
            const mapFeature = mapData?.features.find(f => 
              f.properties.iso_a3 === selectedCountry || 
              f.properties.iso_a2 === selectedCountry
            );
            
            return mapFeature && item.countryName === mapFeature.properties.name;
          });
          
          if (!country) return null;
          
          const countryName = mapData?.features.find(f => 
            f.properties.iso_a3 === selectedCountry || 
            f.properties.iso_a2 === selectedCountry
          )?.properties.name || country.countryName;
          
          const rank = getCountryRankByGdp(country.countryCode, gdpData);
          const change = getGdpChangePercentage(country.countryCode, gdpData, previousYearData);
          
          return (
            <>
              <h3 className="font-bold text-base">{countryName}</h3>
              <div className="flex justify-between mt-1.5">
                <span className="text-gray-500">GDP ({year}):</span>
                <span className="font-medium">{formatGdpValue(country.gdpValue)}</span>
              </div>
              <div className="mt-3 pt-2 border-t border-gray-100">
                <div className="flex justify-between text-xs">
                  <span>Rank:</span>
                  <span>{rank}th</span>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span>Change from prev. year:</span>
                  <span className={`${change.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {change.formatted}
                  </span>
                </div>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}
