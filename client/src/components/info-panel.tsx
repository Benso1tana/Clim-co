interface InfoPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InfoPanel({ isOpen, onClose }: InfoPanelProps) {
  return (
    <div 
      className={`absolute top-0 left-0 h-full w-80 bg-white shadow-lg transform transition-transform duration-300 z-30 flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
    >
      <div className="p-4 bg-ui-dark text-white flex justify-between items-center">
        <h2 className="font-medium">About This Visualization</h2>
        <button 
          className="text-white hover:text-gray-200"
          onClick={onClose}
        >
          <span className="material-icons">close</span>
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <div className="prose prose-sm">
          <p className="text-gray-700">
            This visualization displays the Gross Domestic Product (GDP) for countries around the world from 2016 to 2023. 
            Data is sourced from official economic databases.
          </p>
          
          <h3 className="text-ui-dark font-medium mt-4 mb-2">How to Use</h3>
          <ul className="list-disc pl-5 text-gray-700 space-y-1">
            <li>Hover over countries to see detailed GDP information</li>
            <li>Use the year slider to navigate through time</li>
            <li>Draw and annotate on the map using the drawing tools</li>
            <li>Customize the display through the controls panel</li>
          </ul>
          
          <h3 className="text-ui-dark font-medium mt-4 mb-2">Legend</h3>
          <div className="flex items-center mb-2">
            <div className="w-5 h-5 rounded-sm mr-2" style={{ backgroundColor: '#E3F2FD' }}></div>
            <span className="text-gray-700">Lower GDP values</span>
          </div>
          <div className="flex items-center">
            <div className="w-5 h-5 rounded-sm mr-2" style={{ backgroundColor: '#1565C0' }}></div>
            <span className="text-gray-700">Higher GDP values</span>
          </div>
          
          <h3 className="text-ui-dark font-medium mt-4 mb-2">Data Notes</h3>
          <p className="text-gray-700 text-sm">
            Some countries may have missing data for certain years. In these cases, the most recent available data is used.
            GDP values are displayed in current US dollars.
          </p>
        </div>
      </div>
    </div>
  );
}
