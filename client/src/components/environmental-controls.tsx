import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { ChevronLeft, ChevronRight, BarChart4 } from 'lucide-react';
import { useEffect, useState } from 'react';

// Types de polluants et métriques disponibles
const pollutantTypes = [
  { id: 'composite', name: 'Composite', description: 'Indice combiné de tous les polluants' },
  { id: 'no2', name: 'NO₂', description: 'Dioxyde d\'azote' },
  { id: 'o3', name: 'O₃', description: 'Ozone' },
  { id: 'so2', name: 'SO₂', description: 'Dioxyde de soufre' }
];

const metricTypes = [
  { id: 'composite_index', name: 'Indice Composite', description: 'Score global combinant tous les facteurs' },
  { id: 'pollution_gdp_ratio', name: 'Pollution/PIB', description: 'Niveau de pollution par rapport au PIB' },
  { id: 'gdp_pollution_ratio', name: 'PIB/Pollution', description: 'PIB par rapport au niveau de pollution' },
  { id: 'normalized_ratio', name: 'Ratio Normalisé', description: 'Ratio normalisé entre pollution et PIB' },
  { id: 'env_inequality_index', name: 'Inégalités Environnementales', description: 'Indice d\'inégalité environnementale' }
];

interface EnvironmentalControlsProps {
  isOpen: boolean;
  selectedPollutant: string;
  selectedMetric: string;
  selectedPeriod: string;
  availablePeriods: string[];
  onPollutantChange: (pollutant: string) => void;
  onMetricChange: (metric: string) => void;
  onPeriodChange: (period: string) => void;
  onToggleEnvironmentalView: () => void;
  showEnvironmentalData: boolean;
}

export default function EnvironmentalControls({
  isOpen,
  selectedPollutant,
  selectedMetric,
  selectedPeriod,
  availablePeriods,
  onPollutantChange,
  onMetricChange,
  onPeriodChange,
  onToggleEnvironmentalView,
  showEnvironmentalData
}: EnvironmentalControlsProps) {
  const [prevPeriod, setPrevPeriod] = useState<string | null>(null);
  const [nextPeriod, setNextPeriod] = useState<string | null>(null);

  // Déterminer les périodes précédente et suivante
  useEffect(() => {
    const periodIndex = availablePeriods.indexOf(selectedPeriod);
    setPrevPeriod(periodIndex > 0 ? availablePeriods[periodIndex - 1] : null);
    setNextPeriod(periodIndex < availablePeriods.length - 1 ? availablePeriods[periodIndex + 1] : null);
  }, [selectedPeriod, availablePeriods]);

  if (!isOpen) return null;

  return (
    <div className="absolute top-20 right-4 p-3 z-20 bg-white rounded-lg shadow-lg max-w-[220px] space-y-3 border border-gray-200">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-green-700">Indices Environnementaux</h3>
      </div>
      
      <Separator />
      
      <div className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="pollutant" className="text-xs">Polluant</Label>
          <Select value={selectedPollutant} onValueChange={onPollutantChange}>
            <SelectTrigger id="pollutant" className="h-8 text-xs">
              <SelectValue placeholder="Choisir un polluant" />
            </SelectTrigger>
            <SelectContent>
              {pollutantTypes.map(type => (
                <SelectItem key={type.id} value={type.id} className="text-xs">
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-1">
          <Label htmlFor="metric" className="text-xs">Métrique</Label>
          <Select value={selectedMetric} onValueChange={onMetricChange}>
            <SelectTrigger id="metric" className="h-8 text-xs">
              <SelectValue placeholder="Choisir une métrique" />
            </SelectTrigger>
            <SelectContent>
              {metricTypes.map(type => (
                <SelectItem key={type.id} value={type.id} className="text-xs">
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-1">
          <Label className="text-xs">Période</Label>
          <div className="flex items-center justify-between gap-1">
            <Button 
              variant="outline" 
              size="icon" 
              className="h-7 w-7"
              disabled={!prevPeriod}
              onClick={() => prevPeriod && onPeriodChange(prevPeriod)}
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            
            <Select value={selectedPeriod} onValueChange={onPeriodChange}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Choisir une période" />
              </SelectTrigger>
              <SelectContent>
                {availablePeriods.map(period => (
                  <SelectItem key={period} value={period} className="text-xs">
                    {period}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              size="icon"
              className="h-7 w-7"
              disabled={!nextPeriod}
              onClick={() => nextPeriod && onPeriodChange(nextPeriod)}
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
      
      <div className="text-[10px] text-gray-500 pt-2">
        Valeurs élevées = meilleure performance
      </div>
    </div>
  );
}