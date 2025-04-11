import { formatGdpValue } from '@/lib/gdp-data';
import { t } from '@/lib/i18n';

interface MapLegendProps {
  minValue: number;
  maxValue: number;
  selectedYear: number;
}

export default function MapLegend({ minValue, maxValue, selectedYear }: MapLegendProps) {
  // Updated monochromatic blue palette with more contrast
  const legendColors = [
    '#E6F0FA', // Extremely light blue (lowest GDP)
    '#B6D8F2', // Very light blue
    '#80B5E8', // Light blue
    '#4186D9', // Medium blue
    '#1F5FC9', // Dark blue
    '#0A337A'  // Very dark blue (highest GDP)
  ];
  
  // Calculate step values for the legend
  const step = (maxValue - minValue) / 4;
  const values = [
    minValue,
    Math.round(minValue + step),
    Math.round(minValue + 2 * step),
    Math.round(minValue + 3 * step),
    maxValue
  ];

  return (
    <div className="absolute bottom-20 left-4 bg-white p-4 rounded-md shadow-xl z-[999] border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center">
          <svg className="w-4 h-4 mr-1.5 text-blue-700" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 6V4M12 6C10.8954 6 10 6.89543 10 8C10 9.10457 10.8954 10 12 10M12 6C13.1046 6 14 6.89543 14 8C14 9.10457 13.1046 10 12 10M12 10V12M12 12C10.8954 12 10 12.8954 10 14C10 15.1046 10.8954 16 12 16M12 12C13.1046 12 14 12.8954 14 14C14 15.1046 13.1046 16 12 16M12 16V18M12 18C10.8954 18 10 18.8954 10 20C10 21.1046 10.8954 22 12 22M12 18C13.1046 18 14 18.8954 14 20C14 21.1046 13.1046 22 12 22M6 16L4.85858 17.1414M6 16C4.89543 16 4 15.1046 4 14C4 12.8954 4.89543 12 6 12M6 16C7.10457 16 8 15.1046 8 14C8 12.8954 7.10457 12 6 12M4.85858 17.1414C3.70404 18.2959 3.70404 20.1585 4.85858 21.3131C6.01312 22.4677 7.87564 22.4677 9.03018 21.3131M4.85858 17.1414L9.03018 21.3131M18 16L19.1414 17.1414M18 16C19.1046 16 20 15.1046 20 14C20 12.8954 19.1046 12 18 12M18 16C16.8954 16 16 15.1046 16 14C16 12.8954 16.8954 12 18 12M19.1414 17.1414C20.2959 18.2959 20.2959 20.1585 19.1414 21.3131C17.9869 22.4677 16.1244 22.4677 14.9698 21.3131M19.1414 17.1414L14.9698 21.3131M6 8L4.85858 6.85858M6 8C4.89543 8 4 7.10457 4 6C4 4.89543 4.89543 4 6 4M6 8C7.10457 8 8 7.10457 8 6C8 4.89543 7.10457 4 6 4M4.85858 6.85858C3.70404 5.70404 3.70404 3.84142 4.85858 2.68689C6.01312 1.53235 7.87564 1.53235 9.03018 2.68689M4.85858 6.85858L9.03018 2.68689M18 8L19.1414 6.85858M18 8C19.1046 8 20 7.10457 20 6C20 4.89543 19.1046 4 18 4M18 8C16.8954 8 16 7.10457 16 6C16 4.89543 16.8954 4 18 4M19.1414 6.85858C20.2959 5.70404 20.2959 3.84142 19.1414 2.68689C17.9869 1.53235 16.1244 1.53235 14.9698 2.68689M19.1414 6.85858L14.9698 2.68689" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {t('GDP Per Country')}
        </h3>
        <span className="text-xs text-blue-700 font-medium flex items-center">
          <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 2V4M18 2V4M3 8H21M19 4H5C3.89543 4 3 4.89543 3 6V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V6C21 4.89543 20.1046 4 19 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="8" y="12" width="2" height="2" rx="0.5" fill="currentColor"/>
            <rect x="11" y="12" width="2" height="2" rx="0.5" fill="currentColor"/>
            <rect x="14" y="12" width="2" height="2" rx="0.5" fill="currentColor"/>
          </svg>
          {selectedYear}
        </span>
      </div>
      
      {/* Main gradient bar */}
      <div className="flex items-center mb-4">
        <div className="w-40 h-8 rounded-md overflow-hidden flex shadow-sm">
          {legendColors.map((color, index) => (
            <div 
              key={index}
              className="flex-1 h-full" 
              style={{ backgroundColor: color }}
            ></div>
          ))}
        </div>
        <div className="ml-3 text-xs">
          <div className="flex flex-col justify-between h-8">
            <span className="font-medium text-gray-700">{formatGdpValue(maxValue)}</span>
            <span className="font-medium text-gray-700">{formatGdpValue(minValue)}</span>
          </div>
        </div>
      </div>
      
      {/* Color scale with values */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-2 mb-3">
        {[0, 1, 2, 3, 4].map(index => (
          <div key={index} className="flex items-center text-xs">
            <div 
              className="w-3 h-3 mr-1.5 rounded-sm flex-shrink-0 shadow-sm" 
              style={{ 
                backgroundColor: legendColors[index]
              }}
            ></div>
            <span className="truncate text-gray-700">{formatGdpValue(values[index])}</span>
          </div>
        ))}
      </div>
      
      <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500 flex justify-between items-center">
        <span className="flex items-center">
          <svg className="w-3 h-3 mr-1 text-gray-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {t('GDP in Trillion $')}
        </span>
        <span className="text-gray-400 text-[10px] flex items-center">
          <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 12L9 11C9 9.89543 9.89543 9 11 9L13 9C14.1046 9 15 9.89543 15 11V11C15 12.1046 14.1046 13 13 13L11 13C9.89543 13 9 13.8954 9 15V15C9 16.1046 9.89543 17 11 17H13C14.1046 17 15 16.1046 15 15V14M12 7V5M12 19V21M17 3H7C4.79086 3 3 4.79086 3 7V17C3 19.2091 4.79086 21 7 21H17C19.2091 21 21 19.2091 21 17V7C21 4.79086 19.2091 3 17 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          {t('Source: World Bank')}
        </span>
      </div>
    </div>
  );
}
