import { useQuery } from '@tanstack/react-query';
import { CountryGdpData, GdpDataByYear } from '@/lib/types';
import { processGdpData } from '@/lib/gdp-data';

export function useGdpData() {
  const { 
    data, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['/api/gdp-data'],
    select: (data: any) => processGdpData(data)
  });

  const getDataForYear = (year: string): CountryGdpData[] => {
    if (!data || !data[year]) return [];
    return data[year];
  };

  const getDataForYearRange = (startYear: string, endYear: string): GdpDataByYear => {
    if (!data) return {};
    
    const filteredData: GdpDataByYear = {};
    const start = parseInt(startYear);
    const end = parseInt(endYear);
    
    for (let i = start; i <= end; i++) {
      const year = i.toString();
      if (data[year]) {
        filteredData[year] = data[year];
      }
    }
    
    return filteredData;
  };

  const getCountryData = (countryCode: string, year: string): CountryGdpData | undefined => {
    if (!data || !data[year]) return undefined;
    return data[year].find(item => item.countryCode === countryCode);
  };

  return {
    gdpData: data,
    isLoading,
    error,
    getDataForYear,
    getDataForYearRange,
    getCountryData
  };
}
