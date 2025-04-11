import { Slider } from '@/components/ui/slider';
import { formatDateString } from '@/lib/air-quality-service';

// Helper function to format month strings that include year information
function formatMonthWithYear(monthStr: string, year?: number): string {
  try {
    // Full date format (YYYY-MM-DD)
    if (monthStr.includes('-') && monthStr.split('-').length === 3) {
      return formatDateString(monthStr);
    }
    
    // MM-DD format
    if (monthStr.includes('-') && monthStr.split('-').length === 2) {
      const currentYear = year || new Date().getFullYear();
      const fullDate = `${currentYear}-${monthStr}`;
      return formatDateString(fullDate);
    }
    
    // Fallback
    return monthStr;
  } catch (e) {
    return monthStr;
  }
}

interface MonthSliderProps {
  months: string[];
  currentMonth: string;
  onMonthChange: (month: string) => void;
  selectedYear?: number; // Optional selected year prop
}

export default function MonthSlider({ months, currentMonth, onMonthChange, selectedYear }: MonthSliderProps) {
  const currentIndex = months.indexOf(currentMonth);
  
  const handleSliderChange = (value: number[]) => {
    const index = Math.round(value[0]);
    if (index >= 0 && index < months.length) {
      onMonthChange(months[index]);
    }
  };
  
  return (
    <div className="p-4 bg-white shadow-sm z-20 border-t border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium flex items-center">
          <svg className="w-4 h-4 mr-1.5 text-blue-700" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 18.8856 21 19.8284 20.4142 20.4142C19.8284 21 18.8856 21 17 21H7C5.11438 21 4.17157 21 3.58579 20.4142C3 19.8284 3 18.8856 3 17V8.5C3 6.61438 3 5.67157 3.58579 5.08579C4.17157 4.5 5.11438 4.5 7 4.5H17C18.8856 4.5 19.8284 4.5 20.4142 5.08579C21 5.67157 21 6.61438 21 8.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7 13H9M15 13H17M7 17H9M15 17H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span>Month: </span>
          <span className="ml-1 text-blue-700 font-semibold">{formatMonthWithYear(currentMonth, selectedYear)}</span>
          {selectedYear && <span className="ml-1 text-gray-600 text-xs font-medium">({selectedYear})</span>}
        </span>
        
        <div className="flex items-center gap-1 text-sm">
          <button 
            onClick={() => {
              const prevIndex = Math.max(0, currentIndex - 1);
              onMonthChange(months[prevIndex]);
            }}
            className={`p-1.5 rounded-md transition ${currentIndex === 0 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-700 hover:bg-blue-100'}`}
            disabled={currentIndex === 0}
            title="Previous month"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <span className="bg-blue-50 px-2 py-1 rounded-md text-blue-800 font-medium text-xs border border-blue-100">
            {currentIndex + 1} / {months.length}
          </span>
          <button
            onClick={() => {
              const nextIndex = Math.min(months.length - 1, currentIndex + 1);
              onMonthChange(months[nextIndex]);
            }}
            className={`p-1.5 rounded-md transition ${currentIndex === months.length - 1 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-700 hover:bg-blue-100'}`}
            disabled={currentIndex === months.length - 1}
            title="Next month"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
      
      <div className="px-1">
        <Slider
          value={[currentIndex]}
          min={0}
          max={months.length - 1}
          step={1}
          onValueChange={handleSliderChange}
          className="py-1"
        />
      </div>
      
      <div className="relative h-8 px-1">
        {months.map((month, index) => (
          <span 
            key={month}
            className={`absolute text-xs transform -translate-x-1/2 transition-all duration-300 ${index === currentIndex ? 'text-blue-600 font-semibold' : 'text-gray-500'}`} 
            style={{ 
              left: `${(index / (months.length - 1)) * 100}%`,
              opacity: Math.abs(index - currentIndex) < 3 ? 1 : 0.6,
              transform: `translateX(-50%) scale(${index === currentIndex ? 1.1 : 0.9})`,
            }}
          >
            {formatMonthWithYear(month, selectedYear).split(' ')[0]}
          </span>
        ))}
      </div>
    </div>
  );
}