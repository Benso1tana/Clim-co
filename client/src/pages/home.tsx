import { useState, useEffect, useRef } from 'react';
import MapVisualizationLeaflet from '@/components/map-visualization-leaflet';
import TimelineSlider from '@/components/timeline-slider';
import ControlsPanel from '@/components/controls-panel';
import MapLegend from '@/components/map-legend';
import AirQualityLegend from '@/components/air-quality-legend';
import EnvironmentalLegend from '@/components/environmental-legend';
import EnvironmentalControls from '@/components/environmental-controls';
import MonthSlider from '@/components/month-slider';
import DashboardDialog from '@/components/dashboard-dialog';
import { Link } from 'wouter';
import { useGdpData } from '@/hooks/use-gdp-data';
import { useMapData } from '@/hooks/use-map-data';
import { useAirQualityData, AirQualityParameter } from '@/hooks/use-air-quality-data';
import { useEnvironmentalData } from '@/hooks/use-environmental-data';
import { CountryData } from '@/lib/types';
import { getColorScaleExtent } from '@/lib/gdp-data';
import { t } from '@/lib/i18n';

export default function Home() {
  // State
  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null);
  const [isControlsPanelOpen, setIsControlsPanelOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [dataType, setDataType] = useState<'absolute' | 'perCapita'>('absolute');
  const [showBorders, setShowBorders] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(2);
  const [showAirQuality, setShowAirQuality] = useState(false);
  const [airQualityParameter, setAirQualityParameter] = useState<AirQualityParameter>('pm25');
  
  // État pour les indices environnementaux
  const [showEnvironmentalData, setShowEnvironmentalData] = useState(false);
  const [isEnvironmentalControlsOpen, setIsEnvironmentalControlsOpen] = useState(false);
  
  // Custom hooks
  const { gdpData, isLoading, getDataForYear } = useGdpData();
  const { mapData, mapLoading, colorScaleType, setColorScaleType, createColorScale } = useMapData();
  const { 
    airQualityData, 
    isLoading: airQualityLoading, 
    parameter,
    setParameter,
    selectedMonth,
    setSelectedMonth,
    selectedYear: airQualityYear,
    setSelectedYear: setAirQualityYear,
    availableMonths,
    refetch: refetchAirQuality
  } = useAirQualityData();
  
  // Hook pour les données environnementales
  const {
    environmentalData,
    preparedData: environmentalMapData,
    availablePeriods,
    currentFilters,
    updateFilters,
    isLoading: environmentalLoading,
    refetch: refetchEnvironmental
  } = useEnvironmentalData();
  
  // Use the air quality year for consistency
  const selectedYear = airQualityYear;
  const setSelectedYear = setAirQualityYear;
  
  // Create a ref for the map SVG
  const mapRef = useRef<SVGSVGElement>(null);
  
  // Get current year's data
  const currentYearData = getDataForYear(selectedYear.toString());
  
  // Get previous year's data for comparison
  const previousYear = selectedYear > 2016 ? selectedYear - 1 : 2016;
  const previousYearData = getDataForYear(previousYear.toString());
  
  // Create color scale
  const [minValue, maxValue] = getColorScaleExtent(currentYearData);
  const colorScale = createColorScale(currentYearData);
  
  // Handlers
  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    
    // Update air quality data for the same year
    // This will refresh the air quality data when the year changes
    if (showAirQuality) {
      refetchAirQuality();
    }
    
    // Update environmental data for the same year
    if (showEnvironmentalData) {
      // Former une période au format YYYY-MM basée sur l'année et le mois sélectionnés
      // Si le mois est vide, utiliser le mois de décembre par défaut
      const formattedMonth = selectedMonth || '12';
      const period = `${year}-${formattedMonth.padStart(2, '0')}`;
      updateFilters({ period });
      // La nouvelle période sera prise en compte automatiquement lors de la prochaine requête
    }
    
    // Reset zoom level when year changes
    setZoomLevel(2);
  };
  
  const handleCountryHover = (country: CountryData | null) => {
    setSelectedCountry(country);
  };
  
  const handleCountryClick = (country: CountryData | null) => {
    // Could open a detailed view for the selected country
    console.log('Country clicked:', country);
  };
  
  const toggleControlsPanel = () => {
    setIsControlsPanelOpen(!isControlsPanelOpen);
  };
  
  return (
    <div className="flex flex-col h-screen font-roboto">
      {/* Header */}
      <header className="bg-blue-900 text-white px-4 py-3 flex justify-between items-center shadow-lg z-10">
        <div className="flex items-center">
          <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 22V8L12 2L21 8V22H14V16C14 15.4696 13.7893 14.9609 13.4142 14.5858C13.0391 14.2107 12.5304 14 12 14C11.4696 14 10.9609 14.2107 10.5858 14.5858C10.2107 14.9609 10 15.4696 10 16V22H3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M17 8V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="1 3"/>
          </svg>
          <h1 className="text-xl font-medium">{t('Global GDP Visualization')}</h1>
          <div className="ml-2 text-sm bg-blue-700 rounded-full px-3 py-1 flex items-center">
            <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 2V4M18 2V4M3 8H21M19 4H5C3.89543 4 3 4.89543 3 6V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V6C21 4.89543 20.1046 4 19 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="8" y="10" width="3" height="3" rx="0.5" fill="currentColor"/>
              <rect x="13" y="10" width="3" height="3" rx="0.5" fill="currentColor"/>
              <rect x="8" y="15" width="3" height="3" rx="0.5" fill="currentColor"/>
              <rect x="13" y="15" width="3" height="3" rx="0.5" fill="currentColor"/>
            </svg>
            2016-2023
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link 
            href="/france" 
            className="flex items-center bg-blue-700 hover:bg-blue-600 rounded-md px-3 py-1.5 transition shadow-sm text-sm"
          >
            <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 21.7C17.3 17 20 13 20 9.7C20 6.26872 16.4183 2.9 12 2.9C7.58172 2.9 4 6.26872 4 9.7C4 13 6.7 17 12 21.7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            France
          </Link>
          <div className="flex items-center mr-4">
            {/* Air Quality Type Filter - Only shown when air quality is toggled on, now positioned to the LEFT of toggle */}
            {showAirQuality && (
              <div className="flex items-center mr-2 bg-blue-800 text-white text-sm rounded-md p-1.5 border-0 shadow-sm">
                <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19.71 18.29L16.31 14.9C17.4 13.6 18 12 18 10.5C18 6.92 15.08 4 11.5 4C7.92 4 5 6.92 5 10.5C5 14.08 7.92 17 11.5 17C13 17 14.6 16.4 15.9 15.31L19.29 18.71C19.47 18.89 19.72 19 20 19C20.55 19 21 18.55 21 18C21 17.72 20.89 17.47 20.71 17.29L19.71 18.29ZM7 10.5C7 8.01 9.01 6 11.5 6C13.99 6 16 8.01 16 10.5C16 12.99 13.99 15 11.5 15C9.01 15 7 12.99 7 10.5Z" fill="currentColor"/>
                </svg>
                <select 
                  value={airQualityParameter}
                  onChange={(e) => {
                    const newParam = e.target.value as AirQualityParameter;
                    setAirQualityParameter(newParam);
                    setParameter(newParam);
                  }}
                  className="bg-transparent text-white text-sm border-0 focus:ring-0 focus:outline-none appearance-none"
                  style={{ colorScheme: "dark" }}
                >
                  <option value="pm25" className="bg-blue-900 text-white">PM2.5</option>
                  <option value="pm10" className="bg-blue-900 text-white">PM10</option>
                  <option value="no2" className="bg-blue-900 text-white">NO₂</option>
                  <option value="so2" className="bg-blue-900 text-white">SO₂</option>
                  <option value="o3" className="bg-blue-900 text-white">O₃</option>
                  <option value="co" className="bg-blue-900 text-white">CO</option>
                </select>
              </div>
            )}
            
            {/* Air Quality Toggle */}
            <div className="flex items-center bg-blue-800 hover:bg-blue-700 rounded-md px-3 py-1.5 transition shadow-sm">
              <div className="relative inline-block mr-2">
                <input 
                  type="checkbox" 
                  id="airQualityToggle" 
                  checked={showAirQuality}
                  onChange={() => {
                    setShowAirQuality(!showAirQuality);
                    if (!showAirQuality && !airQualityData) {
                      refetchAirQuality();
                    }
                  }}
                  className="sr-only" 
                />
                <div className={`w-10 h-5 bg-gray-600 rounded-full transition-colors ${showAirQuality ? 'bg-green-500' : ''}`}>
                  <div className={`absolute w-4 h-4 bg-white rounded-full top-0.5 left-0.5 transition-transform ${showAirQuality ? 'transform translate-x-5' : ''}`}></div>
                </div>
              </div>
              <label htmlFor="airQualityToggle" className="flex items-center text-sm cursor-pointer">
                <svg className="w-4 h-4 mr-1 inline" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 10C4 8.89543 4.89543 8 6 8H8C9.10457 8 10 8.89543 10 10V20C10 21.1046 9.10457 22 8 22H6C4.89543 22 4 21.1046 4 20V10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 4C14 2.89543 14.8954 2 16 2H18C19.1046 2 20 2.89543 20 4V20C20 21.1046 19.1046 22 18 22H16C14.8954 22 14 21.1046 14 20V4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 2C10 4 10 6 12 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 16C10 18 10 20 12 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {t('Show Air Quality')}
              </label>
            </div>
          </div>
          
          {/* Environnemental Data Controls Button - Now in a more prominent position */}
          <button 
            className={`flex items-center text-sm px-3 py-1.5 rounded-md transition shadow-sm mr-2 ${showEnvironmentalData ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-800 hover:bg-blue-700'}`}
            onClick={() => {
              // Toggle l'affichage des indices environnementaux
              setShowEnvironmentalData(!showEnvironmentalData);
              
              // Désactiver la vue de qualité d'air si on active les indices environnementaux
              if (!showEnvironmentalData && showAirQuality) {
                setShowAirQuality(false);
              }
              
              // Toujours ouvrir le panneau de contrôle environnemental
              setIsEnvironmentalControlsOpen(true);
            }}
          >
            <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 22C4.44772 22 4 21.5523 4 21V3C4 2.44772 4.44772 2 5 2H19C19.5523 2 20 2.44772 20 3V21C20 21.5523 19.5523 22 19 22H5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 10H16M8 7H16M8 13H16M8 16H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {t('Indices Environnementaux')}
          </button>
          
          <button 
            className="flex items-center text-sm bg-blue-800 hover:bg-blue-700 px-3 py-1.5 rounded-md transition shadow-sm mr-2"
            onClick={() => setIsDashboardOpen(true)}
          >
            <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 19V13C9 11.8954 8.10457 11 7 11H5C3.89543 11 3 11.8954 3 13V19C3 20.1046 3.89543 21 5 21H7C8.10457 21 9 20.1046 9 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M21 19V5C21 3.89543 20.1046 3 19 3H17C15.8954 3 15 3.89543 15 5V19C15 20.1046 15.8954 21 17 21H19C20.1046 21 21 20.1046 21 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9 5V9C9 10.1046 8.10457 11 7 11H5C3.89543 11 3 10.1046 3 9V5C3 3.89543 3.89543 3 5 3H7C8.10457 3 9 3.89543 9 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t('Dashboard')}
          </button>

          <button 
            className="flex items-center text-sm bg-blue-800 hover:bg-blue-700 px-3 py-1.5 rounded-md transition shadow-sm"
            onClick={toggleControlsPanel}
          >
            <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 21V14M4 14C5.10457 14 6 13.1046 6 12C6 10.8954 5.10457 10 4 10M4 14C2.89543 14 2 13.1046 2 12C2 10.8954 2.89543 10 4 10M4 10V3M12 21V16M12 16C13.1046 16 14 15.1046 14 14C14 12.8954 13.1046 12 12 12M12 16C10.8954 16 10 15.1046 10 14C10 12.8954 10.8954 12 12 12M12 12V3M20 21V10M20 10C21.1046 10 22 9.10457 22 8C22 6.89543 21.1046 6 20 6M20 10C18.8954 10 18 9.10457 18 8C18 6.89543 18.8954 6 20 6M20 6V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {t('Controls')}
          </button>
        </div>
      </header>
      
      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Map Container */}
        <MapVisualizationLeaflet 
          mapData={mapData}
          gdpData={currentYearData}
          previousYearData={previousYearData}
          year={selectedYear}
          isLoading={isLoading || mapLoading}
          colorScale={colorScale}
          onCountryHover={handleCountryHover}
          onCountryClick={handleCountryClick}
          drawingRef={mapRef}
          startDrawing={() => {}}
          moveDrawing={() => {}}
          endDrawing={() => {}}
          showBorders={showBorders}
          zoomLevel={zoomLevel}
          airQualityData={airQualityData?.measurements}
          showAirQuality={showAirQuality}
          airQualityParameter={airQualityParameter}
          environmentalData={environmentalMapData}
          showEnvironmentalData={showEnvironmentalData}
          environmentalMetric={currentFilters.metric}
        />
        
        {/* Side Controls Panel */}
        <ControlsPanel 
          isOpen={isControlsPanelOpen}
          onClose={() => setIsControlsPanelOpen(false)}
          colorScaleType={colorScaleType}
          onColorScaleChange={setColorScaleType}
          dataType={dataType}
          onDataTypeChange={setDataType}
          showBorders={showBorders}
          onShowBordersChange={setShowBorders}
          showLabels={showLabels}
          onShowLabelsChange={setShowLabels}
          zoomLevel={zoomLevel}
          onZoomLevelChange={setZoomLevel}
          minValue={minValue}
          maxValue={maxValue}
        />
        
        {/* Info Panel removed */}
        
        {/* Drawing Tools removed */}
        
        {/* Map Legend */}
        <MapLegend 
          minValue={minValue}
          maxValue={maxValue}
          selectedYear={selectedYear}
        />
        
        {/* Air Quality Legend */}
        <AirQualityLegend 
          parameter={airQualityParameter}
          visible={showAirQuality}
        />
        
        {/* Environmental Legend */}
        {environmentalMapData && environmentalMapData.length > 0 && (
          <EnvironmentalLegend
            minValue={environmentalMapData.length > 0 ? Math.min(...environmentalMapData.map(d => d.value)) : 0}
            maxValue={environmentalMapData.length > 0 ? Math.max(...environmentalMapData.map(d => d.value)) : 1}
            visible={showEnvironmentalData}
            metricName={
              currentFilters.metric === 'composite_index' ? 'Indice Composite' :
              currentFilters.metric === 'pollution_gdp_ratio' ? 'Pollution/PIB' :
              currentFilters.metric === 'gdp_pollution_ratio' ? 'PIB/Pollution' :
              currentFilters.metric === 'normalized_ratio' ? 'Ratio Normalisé' :
              currentFilters.metric === 'env_inequality_index' ? 'Inégalités Environnementales' :
              'Indice Environnemental'
            }
          />
        )}
        
        {/* Environmental Controls Panel */}
        <EnvironmentalControls
          isOpen={isEnvironmentalControlsOpen}
          selectedPollutant={currentFilters.pollutant}
          selectedMetric={currentFilters.metric}
          selectedPeriod={currentFilters.period}
          availablePeriods={availablePeriods}
          onPollutantChange={(pollutant) => updateFilters({ pollutant })}
          onMetricChange={(metric) => updateFilters({ metric })}
          onPeriodChange={(period) => updateFilters({ period })}
          onToggleEnvironmentalView={() => setShowEnvironmentalData(!showEnvironmentalData)}
          showEnvironmentalData={showEnvironmentalData}
        />
      </div>
      
      {/* GDP Year Timeline Slider */}
      <TimelineSlider 
        currentYear={selectedYear}
        onYearChange={handleYearChange}
      />
      
      {/* Month Slider for Air Quality or Environmental Data (conditionally displayed with animation) */}
      <div className={`transition-all duration-500 ease-in-out overflow-hidden ${(showAirQuality || showEnvironmentalData) && availableMonths && availableMonths.length > 0 ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
        {availableMonths && availableMonths.length > 0 && (
          <MonthSlider 
            months={availableMonths}
            currentMonth={selectedMonth}
            onMonthChange={(month) => {
              setSelectedMonth(month);
              
              // Mettre à jour la période pour les données environnementales si elles sont affichées
              if (showEnvironmentalData) {
                const period = `${selectedYear}-${month.padStart(2, '0')}`;
                updateFilters({ period });
              }
            }}
            selectedYear={selectedYear}
          />
        )}
      </div>

      {/* SVG Filter Definitions for Drawing */}
      <svg width="0" height="0">
        <defs>
          <filter id="shadow-effect" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="1" dy="1" stdDeviation="2" floodOpacity="0.3" />
          </filter>
        </defs>
      </svg>

      {/* Dashboard Dialog */}
      <DashboardDialog
        isOpen={isDashboardOpen}
        onClose={() => setIsDashboardOpen(false)}
        gdpData={currentYearData}
        airQualityData={airQualityData?.measurements || []}
        selectedYear={selectedYear}
      />
    </div>
  );
}
