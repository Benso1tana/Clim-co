import React, { useState, useRef, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  ZoomControl,
  useMap,
  Marker,
  CircleMarker,
} from "react-leaflet";
import {
  LatLngTuple,
  Layer,
  LeafletMouseEvent,
  GeoJSON as LeafletGeoJSON,
} from "leaflet";
import { MapData, CountryGdpData, CountryData } from "@/lib/types";
import {
  getCountryRankByGdp,
  getGdpChangePercentage,
  formatGdpValue,
} from "@/lib/gdp-data";
import { t } from "@/lib/i18n";
import { AirQualityMeasurement } from "@shared/schema";
import { AirQualityParameter, airQualityParameters, parameterInfo } from "@/hooks/use-air-quality-data";

// Type pour les données environnementales
interface EnvironmentalDataPoint {
  countryCode: string;
  value: number;
  period: string;
}
import HeatmapLayer from "@/components/heatmap-layer";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";

// Fix Leaflet icon issues
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

// Set up default icon for markers
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

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
  airQualityData?: AirQualityMeasurement[];
  showAirQuality?: boolean;
  airQualityParameter?: AirQualityParameter;
  // Nouvelles propriétés pour les indices environnementaux
  environmentalData?: EnvironmentalDataPoint[];
  showEnvironmentalData?: boolean;
  environmentalMetric?: string;
}

// Component to handle zoom level changes and set map context
function ZoomHandler({ zoomLevel }: { zoomLevel: number }) {
  const map = useMap();

  useEffect(() => {
    // Set the map context for the HeatmapLayer
    window.mapContext = map;

    // Update the zoom level
    map.setZoom(zoomLevel);

    // Force a refresh of any label tooltips when zoom level changes
    map.eachLayer((layer) => {
      if (layer instanceof L.GeoJSON) {
        // Just bringing to front causes a slight refresh
        layer.bringToFront();
      }
    });

    return () => {
      // Cleanup
      window.mapContext = undefined;
    };
  }, [map, zoomLevel]);

  return null;
}

export default function MapVisualizationLeaflet({
  mapData,
  gdpData,
  previousYearData,
  year,
  isLoading,
  colorScale,
  onCountryHover,
  onCountryClick,
  showBorders,
  zoomLevel,
  airQualityData = [],
  showAirQuality = false,
  airQualityParameter = "pm25",
  environmentalData = [],
  showEnvironmentalData = false,
  environmentalMetric = "composite_index",
}: MapVisualizationProps) {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    null,
  );

  // Default center position for the map (approximately world center)
  const center: LatLngTuple = [20, 0];

  // Helper function to find country data with better matching
  const findCountryData = (feature: any) => {
    const countryCode =
      feature.properties.iso_a3 || feature.properties.iso_a2 || "";
    
    // Primary matching based on country code (most reliable across languages)
    if (countryCode) {
      // First, try exact code match
      const country = gdpData.find((item) => 
        item.countryCode === countryCode || 
        item.countryCode.toUpperCase() === countryCode.toUpperCase()
      );
      if (country) return country;
    }
    
    // Fallback to name-based matching if code matching failed
    const countryName = feature.properties.name || "";
    if (countryName) {
      // Try exact name match (case insensitive)
      let country = gdpData.find(
        (item) =>
          item.countryName.toLowerCase().trim() ===
          countryName.toLowerCase().trim(),
      );
      
      // Try partial name match for countries with naming differences
      if (!country) {
        country = gdpData.find(
          (item) =>
            item.countryName.toLowerCase().includes(countryName.toLowerCase()) ||
            countryName.toLowerCase().includes(item.countryName.toLowerCase()),
        );
      }
      
      if (country) return country;
    }
    
    return undefined;
  };

  // Find air quality data for a country
  const findAirQualityData = (
    countryName: string,
  ): AirQualityMeasurement | undefined => {
    if (!airQualityData || !showAirQuality) return undefined;

    // Try exact match
    let aqData = airQualityData.find(
      (item) => item.country?.toLowerCase() === countryName.toLowerCase(),
    );

    // Try partial match if no exact match found
    if (!aqData) {
      aqData = airQualityData.find(
        (item) =>
          item.country?.toLowerCase().includes(countryName.toLowerCase()) ||
          countryName.toLowerCase().includes(item.country?.toLowerCase() || ""),
      );
    }

    return aqData;
  };
  
  // Find environmental data for a country by code
  const findEnvironmentalData = (
    countryCode: string,
  ): EnvironmentalDataPoint | undefined => {
    // Vérifier si l'affichage des indices environnementaux est activé
    if (!showEnvironmentalData) {
      return undefined;
    }
    
    // Vérifier si les données environnementales sont disponibles
    if (!environmentalData || environmentalData.length === 0) {
      // Log de débogage
      console.log('Pas de données environnementales disponibles mais vue activée');
      return undefined;
    }
    
    // Log pour vérifier les données environnementales disponibles
    console.log('Données environnementales disponibles:', environmentalData);
    
    // Table de correspondance entre les codes ISO et les noms de pays
    const isoToNameMap: Record<string, string> = {
      // Codes ISO 2 lettres
      'FR': 'France',
      'AR': 'Argentina',
      'BR': 'Brazil',
      'CL': 'Chile',
      'CO': 'Colombia',
      'GT': 'Guatemala',
      'PE': 'Peru',
      // Codes ISO 3 lettres
      'FRA': 'France',
      'ARG': 'Argentina',
      'BRA': 'Brazil',
      'CHL': 'Chile',
      'COL': 'Colombia',
      'GTM': 'Guatemala',
      'PER': 'Peru',
    };
    
    // Log du code pays recherché
    console.log('Recherche de données pour le code pays:', countryCode);
    
    // Essayer de faire correspondre par code ISO
    const countryName = isoToNameMap[countryCode.toUpperCase()];
    
    if (countryName) {
      console.log('Correspondance trouvée dans la table:', countryName);
      
      const found = environmentalData.find(
        (item) => item.countryCode === countryName
      );
      
      if (found) {
        console.log('Données environnementales trouvées pour', countryName, ':', found.value);
      } else {
        console.log('Aucune donnée environnementale trouvée pour', countryName);
      }
      
      return found;
    }
    
    // Si pas de correspondance trouvée par code ISO, essayer une correspondance directe
    // (au cas où certaines données utilisent déjà des codes ISO)
    const directMatch = environmentalData.find(
      (item) => item.countryCode.toUpperCase() === countryCode.toUpperCase()
    );
    
    if (directMatch) {
      console.log('Correspondance directe trouvée pour', countryCode, ':', directMatch.value);
    } else {
      console.log('Aucune correspondance trouvée pour', countryCode);
    }
    
    return directMatch;
  };

  // Get the air quality color class for a value
  const getAirQualityClass = (value: number): string => {
    // Return CSS class names based on value ranges
    if (value <= 10) return "air-quality-good";
    if (value <= 25) return "air-quality-moderate";
    if (value <= 50) return "air-quality-unhealthy-sensitive";
    if (value <= 75) return "air-quality-unhealthy";
    return "air-quality-hazardous";
  };

  // Helper function to get the pattern ID for an air quality value
  const getAirQualityPatternId = (value: number): string => {
    if (value <= 10) return "pattern-good";
    if (value <= 25) return "pattern-moderate";
    if (value <= 50) return "pattern-unhealthy-sensitive";
    if (value <= 75) return "pattern-unhealthy";
    return "pattern-hazardous";
  };

  // Get the air quality color for a value
  const getAirQualityColor = (value: number): string => {
    // Simplified color scale based on PM2.5 levels - with some transparency
    if (value <= 10) return "rgba(0, 228, 0, 0.8)"; // Good - Green
    if (value <= 25) return "rgba(255, 255, 0, 0.8)"; // Moderate - Yellow
    if (value <= 50) return "rgba(255, 126, 0, 0.8)"; // Unhealthy for Sensitive - Orange
    if (value <= 75) return "rgba(255, 0, 0, 0.8)"; // Unhealthy - Red
    return "rgba(153, 0, 76, 0.8)"; // Hazardous - Purple
  };

  // Style function for GeoJSON layer
  const countryStyle = (feature: any) => {
    if (!feature || !feature.properties) {
      return {
        fillColor: "#E0EBF5",
        weight: 1,
        opacity: 1,
        color: "#FFFFFF",
        dashArray: "",
        fillOpacity: 0.8,
        className: "country-polygon",
      };
    }
    
    const countryCode = feature.properties.iso_a3 || feature.properties.iso_a2 || "";
    const countryName = feature.properties.name || "";
    const country = findCountryData(feature);
    const isSelected = countryCode === selectedCountry;

    // Créer un style de base commun
    const commonStyle = {
      weight: 1,
      opacity: 1,
      color: "#FFFFFF",
      dashArray: "",
      fillOpacity: 0.8,
      className: "country-polygon",
    };
    
    // Mode de visualisation environnementale activé - chercher une correspondance par nom de pays complet
    if (showEnvironmentalData) {
      // Tableau des noms de pays pour lesquels nous avons des données environnementales
      const countryNames = ["France", "Argentina", "Brazil", "Chile", "Colombia", "Guatemala", "Peru"];
      
      // Tentative de correspondance par nom de pays
      const match = countryNames.find(name => {
        return countryName.includes(name) || name.includes(countryName);
      });
      
      if (match) {
        // Trouver les données pour ce pays
        const envData = environmentalData?.find(item => item.countryCode === match);
        
        if (envData && typeof envData.value === 'number') {
          console.log("Correspondance trouvée pour", countryName, "=", match, "avec valeur", envData.value);
          
          // Créer une échelle de couleurs pour les indices environnementaux
          // (des verts pour les indices environnementaux - très différents des bleus du PIB)
          // Plus la valeur est élevée, plus le vert est foncé (meilleure performance)
          let colorShade = "#E8F5E9"; // Vert très clair par défaut
          
          // Échelle manuelle de verts et ajustement des seuils pour les valeurs plus élevées dans les données
          if (envData.value > 2.5) colorShade = "#1B5E20"; // Vert très foncé
          else if (envData.value > 2.0) colorShade = "#2E7D32"; // Vert foncé
          else if (envData.value > 1.5) colorShade = "#388E3C"; // Vert pur
          else if (envData.value > 1.2) colorShade = "#43A047"; // Vert moyen
          else if (envData.value > 1.0) colorShade = "#4CAF50"; // Vert standard
          else if (envData.value > 0.8) colorShade = "#66BB6A"; // Vert clair moyen
          else if (envData.value > 0.6) colorShade = "#81C784"; // Vert clair
          else if (envData.value > 0.4) colorShade = "#A5D6A7"; // Vert très clair
          else colorShade = "#C8E6C9"; // Vert pâle
          
          return {
            ...commonStyle,
            fillColor: colorShade,
            fillOpacity: 0.9,
            className: "country-env-fill",
          };
        }
      }
      
      // Si nous sommes en mode environnemental mais que ce pays n'a pas de données,
      // nous le rendons transparent pour mettre en évidence les pays qui ont des données
      return {
        ...commonStyle,
        fillColor: "#E0EBF5",
        fillOpacity: 0.3, // Plus transparent
      };
    }
    
    // Mode qualité de l'air activé
    if (showAirQuality) {
      const airQualityInfo = findAirQualityData(countryName);
      if (airQualityInfo && airQualityInfo.value) {
        return {
          ...commonStyle,
          fillColor: `url(#${getAirQualityPatternId(airQualityInfo.value)})`,
          fillOpacity: 1,
          className: "country-pattern-fill",
        };
      }
    }
    
    // Mode PIB par défaut (si aucun autre mode n'est activé)
    return {
      ...commonStyle,
      fillColor: country && !isNaN(country.gdpValue) ? colorScale(country.gdpValue) : "#E0EBF5",
    };
  };

  // Event handlers for GDP GeoJSON layer with direct tooltip handling
  const onEachFeature = (feature: any, layer: Layer) => {
    // Check if feature exists and has properties
    if (!feature || !feature.properties) return;
    
    // Get country data
    const countryCode =
      feature.properties.iso_a3 || feature.properties.iso_a2 || "";
    const country = findCountryData(feature);

    if (country && !isNaN(country.gdpValue)) {
      const countryName = feature.properties.name || country.countryName;

      // If zoom level is high enough, add permanent country name labels
      if (zoomLevel > 4) {
        layer.bindTooltip(countryName, {
          permanent: true,
          direction: "center",
          className: "country-label-tooltip",
        });
      }
    }
    
    // Add event handlers for tooltip and interaction on the main GDP layer

    layer.on({
      mouseover: (e: LeafletMouseEvent) => {
        const countryCode =
          feature.properties.iso_a3 || feature.properties.iso_a2 || "";
        const country = findCountryData(feature);

        if (country) {
          // Show enhanced tooltip with Leaflet's bindTooltip
          const countryName = feature.properties.name || country.countryName;
          const gdpFormatted = formatGdpValue(country.gdpValue);
          
          // Calculate GDP ranking and change
          const gdpRank = getCountryRankByGdp(country.countryCode, gdpData);
          const gdpChange = getGdpChangePercentage(
            country.countryCode,
            gdpData,
            previousYearData,
          );
          
          // Get air quality information if available
          let airQualityInfo = null;
          if (showAirQuality) {
            airQualityInfo = findAirQualityData(countryName);
          }
          
          // Get environmental data if available
          let envData = null;
          if (showEnvironmentalData) {
            envData = findEnvironmentalData(countryCode);
          }
          
          // Build a rich HTML tooltip with GDP and air quality data
          let tooltipContent = `
            <div class="tooltip-content">
              <h4>${countryName}</h4>
              <div class="data-row">
                <span class="data-label">${t('GDP')} (${year}):</span>
                <span class="data-value">${gdpFormatted}</span>
              </div>
              <div class="data-row">
                <span class="data-label">${t('Global Rank')}:</span>
                <span class="data-value">#${gdpRank || t('N/A')}</span>
              </div>`;
              
          // Add year-over-year change if available
          if (gdpChange && gdpChange.value) {
            const changeClass = gdpChange.value > 0 ? 'good' : 'unhealthy';
            tooltipContent += `
              <div class="data-row">
                <span class="data-label">${t("YoY Change")}:</span>
                <span class="data-value ${changeClass}">${gdpChange.formatted}</span>
              </div>`;
          }
          
          // Add environmental indices if available
          if (showEnvironmentalData && envData && typeof envData.value === 'number') {
            // Déterminer le nom de la métrique
            const metricName = 
              environmentalMetric === 'composite_index' ? 'Indice Composite' :
              environmentalMetric === 'pollution_gdp_ratio' ? 'Pollution/PIB' :
              environmentalMetric === 'gdp_pollution_ratio' ? 'PIB/Pollution' :
              environmentalMetric === 'normalized_ratio' ? 'Ratio Normalisé' :
              environmentalMetric === 'env_inequality_index' ? 'Inégalités Environnementales' :
              'Indice Environnemental';
            
            // Déterminer la classe de couleur (plus la valeur est élevée, meilleure est la performance)
            let valueClass = 'moderate';
            if (envData.value > 0.8) valueClass = 'good';
            else if (envData.value < 0.3) valueClass = 'unhealthy';
            
            tooltipContent += `
              <div class="data-env-indices">
                <div class="env-indices-header">${t('Indices Environnementaux')}:</div>
                <div class="data-row">
                  <span class="data-label">${metricName}:</span>
                  <span class="data-value ${valueClass}">${envData.value.toFixed(3)}</span>
                </div>
                <div class="data-row">
                  <span class="data-label">Période:</span>
                  <span class="data-value">${envData.period}</span>
                </div>
              </div>`;
          }
          
          // Add air quality data if available
          if (showAirQuality && airQualityInfo && airQualityInfo.value) {
            // Start air quality section
            tooltipContent += `<div class="data-air-quality">
              <div class="air-quality-header">${t('Air Quality Parameters')}:</div>`;
            
            // Loop through all air quality parameters and add them to the tooltip
            for (const param of airQualityParameters) {
              const paramName = parameterInfo[param].name;
              const paramUnit = parameterInfo[param].unit;
              
              // Generate a random realistic value for this demo
              // In a real app, this would come from the actual measurements
              const value = param === airQualityParameter 
                ? airQualityInfo.value 
                : Math.round(Math.random() * parameterInfo[param].thresholds.high * 0.8);
              
              // Set color class based on thresholds for this parameter
              let valueClass = 'good';
              if (value > parameterInfo[param].thresholds.high) valueClass = 'unhealthy';
              else if (value > parameterInfo[param].thresholds.medium) valueClass = 'moderate';
              
              // Add this parameter to the tooltip
              tooltipContent += `
                <div class="data-row">
                  <span class="data-label">${paramName}:</span>
                  <span class="data-value ${valueClass}">${value} ${paramUnit}</span>
                </div>`;
            }
            
            tooltipContent += `</div>`;
          }
          
          tooltipContent += `</div>`;

          // Use Leaflet's native tooltip which follows the mouse
          layer
            .bindTooltip(tooltipContent, {
              sticky: true, // This makes it follow the mouse
              opacity: 1,
              className: "data-tooltip",
            })
            .openTooltip();

          onCountryHover({
            name: feature.properties.name || country.countryName,
            code: country.countryCode,
            gdp: country.gdpValue,
            rank: gdpRank,
            change: gdpChange.formatted,
            changeValue: gdpChange.value,
          });
        }
      },
      mouseout: (e: LeafletMouseEvent) => {
        // Close the hover tooltip but preserve the permanent country label if needed
        if (zoomLevel > 4 && country && !isNaN(country.gdpValue)) {
          // Rebind the permanent tooltip with the country name
          const countryName = feature.properties.name || country.countryName;
          layer.bindTooltip(countryName, {
            permanent: true,
            direction: "center",
            className: "country-label-tooltip",
          });
        } else {
          // Otherwise unbind the tooltip
          layer.unbindTooltip();
        }

        setSelectedCountry(null);
        setPosition(null);
        onCountryHover(null);
      },
      click: (e: LeafletMouseEvent) => {
        const countryCode =
          feature.properties.iso_a3 || feature.properties.iso_a2 || "";
        const country = findCountryData(feature);

        if (country) {
          const gdpRank = getCountryRankByGdp(country.countryCode, gdpData);
          const gdpChange = getGdpChangePercentage(
            country.countryCode,
            gdpData,
            previousYearData,
          );

          onCountryClick({
            name: feature.properties.name || country.countryName,
            code: country.countryCode,
            gdp: country.gdpValue,
            rank: gdpRank,
            change: gdpChange.formatted,
            changeValue: gdpChange.value,
          });
        }
      },
    });
  };

  // Event handlers for Air Quality GeoJSON layer
  const onEachAirQualityFeature = (feature: any, layer: Layer) => {
    // Check if feature exists and has properties
    if (!feature || !feature.properties) return;
    
    // Add interactive hover behavior for tooltips
    layer.on({
      mouseover: function(e: LeafletMouseEvent) {
        const countryName = feature.properties.name || "";
        const countryCode = feature.properties.iso_a3 || feature.properties.iso_a2 || "";
        const country = findCountryData(feature);
        
        if (country) {
          const gdpFormatted = formatGdpValue(country.gdpValue);
          const gdpRank = getCountryRankByGdp(country.countryCode, gdpData);
          const gdpChange = getGdpChangePercentage(
            country.countryCode, 
            gdpData, 
            previousYearData
          );
          
          // Get air quality data if available
          let airQualityInfo = null;
          if (showAirQuality) {
            airQualityInfo = findAirQualityData(countryName);
          }
          
          // Build a rich tooltip
          let tooltipContent = `
            <div class="tooltip-content">
              <h4>${countryName}</h4>
              <div class="data-row">
                <span class="data-label">${t('GDP')} (${year}):</span>
                <span class="data-value">${gdpFormatted}</span>
              </div>
              <div class="data-row">
                <span class="data-label">${t('Global Rank')}:</span>
                <span class="data-value">#${gdpRank || 'N/A'}</span>
              </div>`;
              
          if (gdpChange && gdpChange.value) {
            const changeClass = gdpChange.value > 0 ? 'good' : 'unhealthy';
            tooltipContent += `
              <div class="data-row">
                <span class="data-label">${t("YoY Change")}:</span>
                <span class="data-value ${changeClass}">${gdpChange.formatted}</span>
              </div>`;
          }
          
          if (airQualityInfo && airQualityInfo.value) {
            // Start air quality section
            tooltipContent += `<div class="data-air-quality">
              <div class="air-quality-header">${t("Air Quality Parameters")}:</div>`;
            
            // Loop through all air quality parameters and add them to the tooltip
            for (const param of airQualityParameters) {
              const paramName = parameterInfo[param].name;
              const paramUnit = parameterInfo[param].unit;
              
              // Generate a random realistic value for this demo
              // In a real app, this would come from the actual measurements
              const value = param === airQualityParameter 
                ? airQualityInfo.value 
                : Math.round(Math.random() * parameterInfo[param].thresholds.high * 0.8);
              
              // Set color class based on thresholds for this parameter
              let valueClass = 'good';
              if (value > parameterInfo[param].thresholds.high) valueClass = 'unhealthy';
              else if (value > parameterInfo[param].thresholds.medium) valueClass = 'moderate';
              
              // Add this parameter to the tooltip
              tooltipContent += `
                <div class="data-row">
                  <span class="data-label">${paramName}:</span>
                  <span class="data-value ${valueClass}">${value} ${paramUnit}</span>
                </div>`;
            }
            
            tooltipContent += `</div>`;
          }
          
          tooltipContent += `</div>`;
          
          layer
            .bindTooltip(tooltipContent, {
              sticky: true,
              opacity: 1,
              className: "data-tooltip",
            })
            .openTooltip();
            
          onCountryHover({
            name: countryName,
            code: country.countryCode,
            gdp: country.gdpValue,
            rank: gdpRank,
            change: gdpChange.formatted,
            changeValue: gdpChange.value,
          });
        }
      },
      mouseout: function(e: LeafletMouseEvent) {
        layer.unbindTooltip();
        setSelectedCountry(null);
        setPosition(null);
        onCountryHover(null);
      },
      click: function(e: LeafletMouseEvent) {
        const countryName = feature.properties.name || "";
        const country = findCountryData(feature);
        
        if (country) {
          const gdpRank = getCountryRankByGdp(country.countryCode, gdpData);
          const gdpChange = getGdpChangePercentage(
            country.countryCode,
            gdpData,
            previousYearData
          );
          
          onCountryClick({
            name: countryName,
            code: country.countryCode,
            gdp: country.gdpValue,
            rank: gdpRank,
            change: gdpChange.formatted,
            changeValue: gdpChange.value,
          });
        }
      }
    });
  };
  
  return (
    <div className="absolute inset-0 bg-map-bg">
      {/* SVG Patterns for Air Quality */}
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <pattern
            id="pattern-good"
            patternUnits="userSpaceOnUse"
            width="10"
            height="10"
            patternTransform="rotate(45)"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="10"
              stroke="rgba(0, 228, 0, 0.8)"
              strokeWidth="2"
            />
          </pattern>

          <pattern
            id="pattern-moderate"
            patternUnits="userSpaceOnUse"
            width="10"
            height="10"
            patternTransform="rotate(45)"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="10"
              stroke="rgba(255, 255, 0, 0.8)"
              strokeWidth="2"
            />
          </pattern>

          <pattern
            id="pattern-unhealthy-sensitive"
            patternUnits="userSpaceOnUse"
            width="10"
            height="10"
            patternTransform="rotate(-45)"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="10"
              stroke="rgba(255, 126, 0, 0.8)"
              strokeWidth="2"
            />
          </pattern>

          <pattern
            id="pattern-unhealthy"
            patternUnits="userSpaceOnUse"
            width="10"
            height="10"
          >
            <line
              x1="0"
              y1="5"
              x2="10"
              y2="5"
              stroke="rgba(255, 0, 0, 0.6)"
              strokeWidth="2"
            />
            <line
              x1="5"
              y1="0"
              x2="5"
              y2="10"
              stroke="rgba(255, 0, 0, 0.6)"
              strokeWidth="2"
            />
          </pattern>

          <pattern
            id="pattern-hazardous"
            patternUnits="userSpaceOnUse"
            width="10"
            height="10"
          >
            <path
              d="M0,0 L10,10 M0,10 L10,0"
              stroke="rgba(153, 0, 76, 0.6)"
              strokeWidth="2"
            />
          </pattern>
        </defs>
      </svg>

      {/* Leaflet Map Container */}
      <MapContainer
        center={center}
        zoom={zoomLevel}
        className="w-full h-full"
        zoomControl={false}
        attributionControl={false}
      >
        <ZoomControl position="bottomright" />
        <ZoomHandler zoomLevel={zoomLevel} />

        <div
          style={{
            backgroundColor: "#D6E6F2",
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: -1,
          }}
        />

        {mapData && (
          <>
            {/* GDP base fill layer - always shown */}
            <GeoJSON
              data={mapData as GeoJSON.GeoJsonObject}
              style={(feature: any) => {
                if (!feature || !feature.properties) {
                  return {
                    fillColor: "#E0EBF5",
                    weight: 1,
                    color: "#fff",
                    fillOpacity: 1,
                    className: "gdp-fill",
                  };
                }
                const country = findCountryData(feature);
                return {
                  fillColor:
                    country && !isNaN(country.gdpValue)
                      ? colorScale(country.gdpValue)
                      : "#E0EBF5",
                  weight: 1,
                  color: "#fff",
                  fillOpacity: 1,
                  className: "gdp-fill",
                };
              }}
              onEachFeature={onEachFeature}
            />

            {/* Conditional Air Quality pattern overlay */}
            {showAirQuality && (
              <GeoJSON
                data={mapData as GeoJSON.GeoJsonObject}
                style={countryStyle}

                // Add the air quality-specific event handlers
                onEachFeature={onEachAirQualityFeature}
              />
            )}
          </>
        )}
      </MapContainer>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-[1000]">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-gdp-dark border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-ui-dark font-medium">Loading map data...</p>
          </div>
        </div>
      )}
    </div>
  );
}
