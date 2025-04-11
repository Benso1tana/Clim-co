import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AirQualityMeasurement } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

// Define a type for air quality parameters
export const airQualityParameters = ['pm25', 'pm10', 'co', 'no2', 'so2', 'o3'] as const;
export type AirQualityParameter = typeof airQualityParameters[number];

// Interface for parameter information including display name and threshold values
interface ParameterInfo {
  name: string;
  fullName: string;
  unit: string;
  thresholds: {
    low: number;
    medium: number;
    high: number;
    veryHigh: number;
  };
}

// Parameter information based on WHO guidelines
export const parameterInfo: Record<AirQualityParameter, ParameterInfo> = {
  pm25: {
    name: 'PM2.5',
    fullName: 'Fine Particulate Matter',
    unit: 'µg/m³',
    thresholds: {
      low: 10,  // WHO Air Quality Guideline
      medium: 25,
      high: 50,
      veryHigh: 75
    }
  },
  pm10: {
    name: 'PM10',
    fullName: 'Particulate Matter',
    unit: 'µg/m³',
    thresholds: {
      low: 20,  // WHO Air Quality Guideline
      medium: 50,
      high: 100,
      veryHigh: 150
    }
  },
  co: {
    name: 'CO',
    fullName: 'Carbon Monoxide',
    unit: 'ppm',
    thresholds: {
      low: 4,
      medium: 10,
      high: 30,
      veryHigh: 50
    }
  },
  no2: {
    name: 'NO₂',
    fullName: 'Nitrogen Dioxide',
    unit: 'ppb',
    thresholds: {
      low: 40,
      medium: 100,
      high: 200,
      veryHigh: 400
    }
  },
  so2: {
    name: 'SO₂',
    fullName: 'Sulfur Dioxide',
    unit: 'ppb',
    thresholds: {
      low: 20,
      medium: 50,
      high: 100,
      veryHigh: 200
    }
  },
  o3: {
    name: 'O₃',
    fullName: 'Ozone',
    unit: 'ppb',
    thresholds: {
      low: 50,
      medium: 100,
      high: 150,
      veryHigh: 200
    }
  }
};

// Map values to intensity for heatmap (0-1 scale)
export const getValueIntensity = (value: number, parameter: AirQualityParameter): number => {
  const info = parameterInfo[parameter];
  if (value <= info.thresholds.low) {
    return value / info.thresholds.low * 0.25; // 0-0.25 range for low
  } else if (value <= info.thresholds.medium) {
    return 0.25 + (value - info.thresholds.low) / (info.thresholds.medium - info.thresholds.low) * 0.25; // 0.25-0.5 range for medium
  } else if (value <= info.thresholds.high) {
    return 0.5 + (value - info.thresholds.medium) / (info.thresholds.high - info.thresholds.medium) * 0.25; // 0.5-0.75 range for high
  } else {
    const maxValue = info.thresholds.veryHigh * 1.5; // Cap at 1.5x the very high threshold
    return 0.75 + Math.min(value - info.thresholds.high, maxValue - info.thresholds.high) / (maxValue - info.thresholds.high) * 0.25; // 0.75-1.0 range for very high
  }
};

// Get color for a value based on parameter thresholds
export const getValueColor = (value: number, parameter: AirQualityParameter): string => {
  const info = parameterInfo[parameter];
  if (value <= info.thresholds.low) {
    return '#00E400'; // Good (Green)
  } else if (value <= info.thresholds.medium) {
    return '#FFFF00'; // Moderate (Yellow)
  } else if (value <= info.thresholds.high) {
    return '#FF7E00'; // Unhealthy for Sensitive Groups (Orange)
  } else if (value <= info.thresholds.veryHigh) {
    return '#FF0000'; // Unhealthy (Red)
  } else {
    return '#99004C'; // Hazardous (Purple)
  }
};

// Interface for our processed air quality data
export interface AirQualityData {
  measurements: AirQualityMeasurement[];
  timestamp: string;
  month: string;
  year: number;
}

// Available months list for the new pollution data format
const availableMonths = [
  '01', '02', '03', '04', '05', '06', 
  '07', '08', '09', '10', '11', '12'
].map(month => `${month}-01`); // First day of each month

// Format the hook for fetching air quality data
export function useAirQualityData() {
  const [parameter, setParameter] = useState<AirQualityParameter>('pm25');
  const [selectedMonth, setSelectedMonth] = useState<string>('09-01');
  const [selectedYear, setSelectedYear] = useState<number>(2022);
  
  // If selectedMonth is not in availableMonths, set it to the first available month
  useEffect(() => {
    if (availableMonths.length > 0 && !availableMonths.includes(selectedMonth)) {
      setSelectedMonth(availableMonths[0]);
    }
  }, [selectedMonth]);
  
  // Format the year-month string for the API
  const yearMonth = useCallback(() => {
    const month = selectedMonth.split('-')[0]; // Extract the month number
    return `${selectedYear}-${month}`;
  }, [selectedYear, selectedMonth]);
  
  // Fetch data from our new API
  const fetchAirQualityData = useCallback(async () => {
    try {
      const url = `/api/pollutant-data?parameter=${parameter}&yearMonth=${yearMonth()}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error fetching data: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      
      // Process the response to match our expected format
      if (responseData && typeof responseData === 'object' && 'measurements' in responseData) {
        return {
          measurements: responseData.measurements || [],
          timestamp: responseData.timestamp || new Date().toISOString(),
          month: selectedMonth,
          year: selectedYear
        } as AirQualityData;
      }
      
      throw new Error('Invalid response format from server');
    } catch (error) {
      console.error('Error fetching air quality data:', error);
      // Return default empty data on error
      return {
        measurements: [],
        timestamp: new Date().toISOString(),
        month: selectedMonth,
        year: selectedYear
      } as AirQualityData;
    }
  }, [parameter, yearMonth, selectedMonth, selectedYear]);
  
  // Query hook for fetching data
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['pollutant-data', selectedYear, selectedMonth, parameter],
    queryFn: fetchAirQualityData,
    refetchOnWindowFocus: false,
    staleTime: Infinity, // Data is static
  });
  
  // Function to format data for heatmap
  const getHeatmapData = useCallback((measurements: AirQualityMeasurement[]): [number, number, number][] => {
    if (!measurements || measurements.length === 0) return [];
    
    return measurements.map(m => {
      const intensity = getValueIntensity(m.value, parameter);
      return [m.coordinates.latitude, m.coordinates.longitude, intensity];
    });
  }, [parameter]);
  
  return {
    airQualityData: data,
    isLoading,
    isError,
    error,
    refetch,
    parameter,
    setParameter,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    availableMonths, // Use our defined months
    getHeatmapData,
    parameterInfo,
    getValueColor,
    getValueIntensity
  };
}