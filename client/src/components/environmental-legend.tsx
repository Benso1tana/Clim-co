import { cn } from '@/lib/utils';

interface EnvironmentalLegendProps {
  minValue: number;
  maxValue: number;
  visible: boolean;
  metricName: string;
}

export default function EnvironmentalLegend({ minValue, maxValue, visible, metricName }: EnvironmentalLegendProps) {
  if (!visible) return null;

  // Formatter les valeurs numériques
  const formatValue = (value: number): string => {
    if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'k';
    } else if (value <= 0.01) {
      return value.toExponential(1);
    } else {
      return value.toFixed(2);
    }
  };

  // Calculer des valeurs intermédiaires pour l'échelle
  // Utiliser une échelle adaptée aux valeurs des indices environnementaux (généralement entre 0 et 3)
  const values = [0, 0.5, 1.0, 1.5, 2.5];

  // Générer un gradient de couleurs du vert clair au vert foncé
  const colorGradient = [
    'bg-green-100',
    'bg-green-300',
    'bg-green-500',
    'bg-green-700',
    'bg-green-900'
  ];
  
  return (
    <div className={cn(
      "absolute bottom-20 right-8 z-10 bg-white/90 p-3 rounded-md shadow-md border border-gray-200",
      "transition-opacity duration-300",
      visible ? "opacity-100" : "opacity-0 pointer-events-none"
    )}>
      <div className="mb-2 flex justify-between items-center">
        <h4 className="text-sm font-medium">{metricName}</h4>
      </div>
      
      <div className="flex items-center space-x-1">
        {colorGradient.map((color, index) => (
          <div key={index} className="flex flex-col items-center">
            <div className={`${color} w-10 h-6 rounded-sm`}></div>
            <span className="text-xs mt-1">{formatValue(values[index])}</span>
          </div>
        ))}
      </div>
      
      <div className="mt-2 text-xs text-gray-600">
        <p>Valeurs plus élevées = meilleure performance</p>
      </div>
    </div>
  );
}