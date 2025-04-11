import { useState } from 'react';

interface TimelineSliderProps {
  currentYear: number;
  onYearChange: (year: number) => void;
}

export default function TimelineSlider({ currentYear, onYearChange }: TimelineSliderProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onYearChange(parseInt(e.target.value));
    if (isPlaying) setIsPlaying(false);
  };

  const handlePrevYear = () => {
    if (currentYear > 2016) {
      onYearChange(currentYear - 1);
    }
    if (isPlaying) setIsPlaying(false);
  };

  const handleNextYear = () => {
    if (currentYear < 2023) {
      onYearChange(currentYear + 1);
    }
    if (isPlaying) setIsPlaying(false);
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
    
    if (!isPlaying) {
      let year = currentYear;
      const interval = setInterval(() => {
        year = year + 1;
        
        if (year > 2023) {
          clearInterval(interval);
          setIsPlaying(false);
          year = 2016;
        }
        
        onYearChange(year);
      }, 1500);
      
      // Store the interval ID to clear it later
      return () => clearInterval(interval);
    }
  };

  return (
    <div className="bg-white border-t border-gray-200 p-4 z-10 shadow-sm">
      <div className="max-w-screen-lg mx-auto">
        <div className="flex items-center">
          <button 
            className={`flex items-center justify-center w-10 h-10 rounded-full shadow-md transition ${isPlaying ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white'} hover:bg-blue-800`}
            onClick={togglePlayback}
            title={isPlaying ? "Pause animation" : "Play animation"}
          >
            {isPlaying ? (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 9V15M14 9V15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14.7519 11.1679L11.5547 9.03647C10.8901 8.59343 10 9.06982 10 9.86852V14.1315C10 14.9302 10.8901 15.4066 11.5547 14.9635L14.7519 12.8321C15.3457 12.4362 15.3457 11.5638 14.7519 11.1679Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="currentColor"/>
                <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
          
          <div className="flex-1 mx-4">
            <div className="relative">
              <div className="flex items-center">
                <span className="text-xs text-blue-600 font-medium mr-2 flex items-center">
                  <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Year:
                </span>
                <input 
                  type="range" 
                  id="year-slider" 
                  min="2016" 
                  max="2023" 
                  value={currentYear} 
                  step="1"
                  onChange={handleSliderChange}
                  className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
                />
              </div>
              
              {/* Year Markers */}
              <div className="relative h-6 mt-1">
                {[2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023].map((year, index) => (
                  <span 
                    key={year}
                    className={`absolute text-xs ${year === currentYear ? 'text-blue-600 font-medium' : 'text-gray-500'}`}
                    style={{ 
                      left: `${index * 14.3}%`,
                      transform: index === 7 ? 'translateX(-100%)' : 'none'
                    }}
                  >
                    {year}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex items-center bg-blue-50 rounded-md overflow-hidden border border-blue-100 shadow-sm">
            <button 
              className="px-3 py-1.5 hover:bg-blue-100 transition"
              onClick={handlePrevYear}
              disabled={currentYear <= 2016}
              title="Previous year"
            >
              <svg className={`w-5 h-5 ${currentYear <= 2016 ? 'text-gray-400' : 'text-blue-700'}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className="w-16 text-center font-medium text-blue-800">{currentYear}</div>
            <button 
              className="px-3 py-1.5 hover:bg-blue-100 transition"
              onClick={handleNextYear}
              disabled={currentYear >= 2023}
              title="Next year"
            >
              <svg className={`w-5 h-5 ${currentYear >= 2023 ? 'text-gray-400' : 'text-blue-700'}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
