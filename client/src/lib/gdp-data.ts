import { CountryGdpData, GdpDataByYear } from './types';

export const processGdpData = (rawData: any[]): GdpDataByYear => {
  const result: GdpDataByYear = {};
  const years = ['2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023'];
  
  for (const year of years) {
    result[year] = [];
  }

  for (const row of rawData) {
    // Skip entries with invalid country names
    if (!row['Country Name'] || 
        row['Country Name'] === "NaN" || 
        typeof row['Country Name'] !== 'string' ||
        !row['Country Code']) {
      continue;
    }
    
    for (const year of years) {
      // Handle both string values (from CSV) and number values (from JSON)
      let gdpValue: number;
      
      if (typeof row[year] === 'string') {
        gdpValue = parseFloat(row[year]);
      } else if (typeof row[year] === 'number') {
        gdpValue = row[year];
      } else {
        // Try to handle nested GDP structure from JSON
        const nestedGdp = row.GDP?.[year];
        gdpValue = typeof nestedGdp === 'number' ? nestedGdp : 
                  (typeof nestedGdp === 'string' ? parseFloat(nestedGdp) : NaN);
      }
      
      // Only add valid GDP values
      if (!isNaN(gdpValue) && gdpValue > 0) {
        result[year].push({
          countryName: row['Country Name'],
          countryCode: row['Country Code'],
          gdpValue: gdpValue,
          year: parseInt(year)
        });
      }
    }
  }

  return result;
};

export const getCountryRankByGdp = (
  countryCode: string, 
  data: CountryGdpData[]
): number => {
  // Sort by GDP in descending order
  const sortedData = [...data].sort((a, b) => b.gdpValue - a.gdpValue);
  const index = sortedData.findIndex(item => item.countryCode === countryCode);
  return index >= 0 ? index + 1 : -1;
};

export const getGdpChangePercentage = (
  countryCode: string,
  currentYearData: CountryGdpData[],
  previousYearData: CountryGdpData[]
): { value: number, formatted: string } => {
  const current = currentYearData.find(item => item.countryCode === countryCode);
  const previous = previousYearData.find(item => item.countryCode === countryCode);
  
  if (!current || !previous || previous.gdpValue === 0) {
    return { value: 0, formatted: 'N/A' };
  }
  
  const change = ((current.gdpValue - previous.gdpValue) / previous.gdpValue) * 100;
  const formatted = change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
  
  return { value: change, formatted };
};

export const formatGdpValue = (value: number): string => {
  if (isNaN(value)) return 'N/A';
  
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`;
  } else {
    return `$${value.toFixed(1)}`;
  }
};

export const getColorScaleExtent = (data: CountryGdpData[]): [number, number] => {
  if (!data.length) return [0, 100000];

  const validValues = data.filter(d => !isNaN(d.gdpValue)).map(d => d.gdpValue);
  if (!validValues.length) return [0, 100000];

  return [0, Math.ceil(Math.max(...validValues) / 1000) * 1000];
};
