import { useState } from 'react';

interface ControlsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  colorScaleType: 'linear' | 'log' | 'quantile';
  onColorScaleChange: (type: 'linear' | 'log' | 'quantile') => void;
  dataType: 'absolute' | 'perCapita';
  onDataTypeChange: (type: 'absolute' | 'perCapita') => void;
  showBorders: boolean;
  onShowBordersChange: (show: boolean) => void;
  showLabels: boolean;
  onShowLabelsChange: (show: boolean) => void;
  zoomLevel: number;
  onZoomLevelChange: (level: number) => void;
  minValue: number;
  maxValue: number;
}

export default function ControlsPanel({ 
  isOpen, 
  onClose,
  colorScaleType,
  onColorScaleChange,
  dataType,
  onDataTypeChange,
  showBorders,
  onShowBordersChange,
  showLabels,
  onShowLabelsChange,
  zoomLevel,
  onZoomLevelChange,
  minValue,
  maxValue
}: ControlsPanelProps) {
  const handleExportClick = () => {
    alert('Export feature would be implemented here');
  };

  return (
    <div 
      className={`absolute top-0 right-0 h-full w-80 bg-white shadow-lg transform transition-transform duration-300 z-30 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
    >
      <div className="p-4 bg-ui-dark text-white flex justify-between items-center">
        <h2 className="font-medium">Visualization Controls</h2>
        <button 
          className="text-white hover:text-gray-200"
          onClick={onClose}
        >
          <span className="material-icons">close</span>
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {/* Data Display Options */}
        <div className="mb-6">
          <h3 className="font-medium text-ui-dark mb-2">Data Display</h3>
          <div className="space-y-3">
            <div>
              <label className="flex items-center text-sm text-gray-700 mb-1">
                <input 
                  type="radio" 
                  name="data-type" 
                  checked={dataType === 'absolute'} 
                  onChange={() => onDataTypeChange('absolute')}
                  className="mr-2" 
                /> 
                GDP (Absolute)
              </label>
              <label className="flex items-center text-sm text-gray-700">
                <input 
                  type="radio" 
                  name="data-type" 
                  checked={dataType === 'perCapita'}
                  onChange={() => onDataTypeChange('perCapita')}
                  className="mr-2" 
                /> 
                GDP (Per Capita)
              </label>
            </div>
            
            <div className="mt-3">
              <label htmlFor="color-scale" className="block text-sm text-gray-700 mb-1">Color Intensity</label>
              <select 
                id="color-scale" 
                className="w-full p-2 border border-gray-300 rounded"
                value={colorScaleType}
                onChange={(e) => onColorScaleChange(e.target.value as 'linear' | 'log' | 'quantile')}
              >
                <option value="linear">Linear Scale</option>
                <option value="log">Logarithmic Scale</option>
                <option value="quantile">Quantile Scale</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Map Options */}
        <div className="mb-6">
          <h3 className="font-medium text-ui-dark mb-2">Map Options</h3>
          <div className="space-y-3">
            <div>
              <label className="flex items-center text-sm text-gray-700">
                <input 
                  type="checkbox" 
                  checked={showBorders}
                  onChange={(e) => onShowBordersChange(e.target.checked)}
                  className="mr-2" 
                /> 
                Show country borders
              </label>
            </div>
            <div>
              <label className="flex items-center text-sm text-gray-700">
                <input 
                  type="checkbox" 
                  checked={showLabels}
                  onChange={(e) => onShowLabelsChange(e.target.checked)}
                  className="mr-2" 
                /> 
                Show country labels
              </label>
            </div>
            <div>
              <label htmlFor="map-zoom" className="block text-sm text-gray-700 mb-1">Base Zoom Level</label>
              <input 
                type="range" 
                id="map-zoom" 
                min="1" 
                max="10" 
                value={zoomLevel}
                onChange={(e) => onZoomLevelChange(parseInt(e.target.value))}
                className="w-full" 
              />
            </div>
          </div>
        </div>
        
        {/* Legend Preview */}
        <div>
          <h3 className="font-medium text-ui-dark mb-2">GDP Color Scale</h3>
          <div className="h-8 w-full rounded overflow-hidden flex">
            {['#E3F2FD', '#BBDEFB', '#90CAF9', '#64B5F6', '#42A5F5', '#2196F3', '#1E88E5', '#1976D2', '#1565C0'].map(
              (color, index) => (
                <div 
                  key={index}
                  className="flex-1 h-full" 
                  style={{ backgroundColor: color }}
                ></div>
              )
            )}
          </div>
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>${minValue.toLocaleString()}</span>
            <span>${maxValue.toLocaleString()}+</span>
          </div>
        </div>
      </div>
      
      {/* Export Options */}
      <div className="p-4 border-t border-gray-200">
        <button 
          className="w-full bg-accent-blue text-white py-2 rounded flex items-center justify-center hover:bg-blue-600 transition"
          onClick={handleExportClick}
        >
          <span className="material-icons mr-1 text-sm">download</span>
          Export Visualization
        </button>
      </div>
    </div>
  );
}
