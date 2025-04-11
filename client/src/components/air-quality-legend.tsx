import { AirQualityParameter, parameterInfo } from '@/hooks/use-air-quality-data';

interface AirQualityLegendProps {
  parameter: AirQualityParameter;
  visible: boolean;
}

export default function AirQualityLegend({ parameter, visible }: AirQualityLegendProps) {
  if (!visible) return null;

  const info = parameterInfo[parameter];

  return (
    <div className="absolute bottom-50 left-4 bg-white shadow-xl rounded-md p-4 z-[50] min-w-60 border border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-sm flex items-center text-gray-800">
          <svg className="w-4 h-4 mr-1.5 text-green-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 10.1433C4 5.64588 7.58172 2 12 2C16.4183 2 20 5.64588 20 10.1433C20 14.6055 17.4467 19.8124 13.4629 21.6744C12.5343 22.1085 11.4657 22.1085 10.5371 21.6744C6.55332 19.8124 4 14.6055 4 10.1433Z" stroke="currentColor" strokeWidth="1.5"/>
            <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
          {info.fullName} <span className="text-xs ml-1 text-gray-500">({info.name})</span>
        </h3>
        <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded">
          {info.unit}
        </span>
      </div>

      <div className="mt-2 space-y-1.5 text-xs">
        <div className="flex items-center">
          <span className="w-3 h-3 rounded-full bg-[#00E400] mr-2 shadow-sm" />
          <span className="text-gray-700">Bon : <span className="font-medium">&lt; {info.thresholds.low}</span></span>
        </div>

        <div className="flex items-center">
          <span className="w-3 h-3 rounded-full bg-[#FFFF00] mr-2 shadow-sm" />
          <span className="text-gray-700">Modéré : <span className="font-medium">{info.thresholds.low}-{info.thresholds.medium}</span></span>
        </div>

        <div className="flex items-center">
          <span className="w-3 h-3 rounded-full bg-[#FF7E00] mr-2 shadow-sm" />
          <span className="text-gray-700">Mauvais (groupes sensibles) : <span className="font-medium">{info.thresholds.medium}-{info.thresholds.high}</span></span>
        </div>

        <div className="flex items-center">
          <span className="w-3 h-3 rounded-full bg-[#FF0000] mr-2 shadow-sm" />
          <span className="text-gray-700">Mauvais : <span className="font-medium">{info.thresholds.high}-{info.thresholds.veryHigh}</span></span>
        </div>

        <div className="flex items-center">
          <span className="w-3 h-3 rounded-full bg-[#99004C] mr-2 shadow-sm" />
          <span className="text-gray-700">Dangereux : <span className="font-medium">&gt; {info.thresholds.veryHigh}</span></span>
        </div>
      </div>
    </div>
  );
}
