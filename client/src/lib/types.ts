export interface CountryGdpData {
  countryName: string;
  countryCode: string;
  gdpValue: number;
  year?: number;
}

export interface GdpDataByYear {
  [year: string]: CountryGdpData[];
}

export interface CountryData {
  name: string;
  code: string;
  gdp: number;
  rank?: number;
  change?: string;
  changeValue?: number;
}

export interface MapDataFeature {
  type: string;
  properties: {
    name: string;
    iso_a2: string;
    iso_a3: string;
  };
  geometry: {
    type: string;
    coordinates: any[];
  };
}

export interface MapData {
  type: string;
  features: MapDataFeature[];
}

export interface ColorScale {
  min: number;
  max: number;
  type: 'linear' | 'log' | 'quantile';
}

export interface Annotation {
  id: string;
  type: 'marker' | 'line' | 'circle' | 'text';
  content?: string;
  coordinates: [number, number] | [number, number][];
  color: string;
  size?: number;
}

export interface DrawingOptions {
  color: string;
  size: number;
  tool: string;
}

export interface ViewSettings {
  showBorders: boolean;
  showLabels: boolean;
  zoomLevel: number;
}

export interface DataDisplayOptions {
  type: 'absolute' | 'perCapita';
  scale: 'linear' | 'log' | 'quantile';
}

// Types pour les données d'indices environnementaux
export interface EnvironmentalIndices {
  pollution_gdp_ratio: number;
  gdp_pollution_ratio: number;
  normalized_ratio: number;
  env_inequality_index: number;
  composite_index: number;
}

export interface PollutantIndices {
  composite?: EnvironmentalIndices;
  no2?: EnvironmentalIndices;
  o3?: EnvironmentalIndices;
  so2?: EnvironmentalIndices;
}

export interface CountryEnvironmentalData {
  period: string; // Format YYYY-MM
  indices: PollutantIndices;
}

export interface EnvironmentalDataPoint {
  countryCode: string;
  value: number;
  period: string;
}
