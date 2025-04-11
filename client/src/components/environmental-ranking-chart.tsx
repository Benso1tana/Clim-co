import { useState, useEffect, useMemo } from 'react';
import { t } from '@/lib/i18n';
import ReactApexChart from 'react-apexcharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface EnvironmentalRankingChartProps {
  environmentalData: any;
  selectedPollutant: string;
  selectedMetric: string;
  selectedPeriod: string;
}

interface RangeData {
  country: string;
  min: number;
  max: number;
  avg: number;
}

export default function EnvironmentalRankingChart({
  environmentalData,
  selectedPollutant,
  selectedMetric,
  selectedPeriod: initialPeriod,
}: EnvironmentalRankingChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(initialPeriod);
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([]);
  const [chartData, setChartData] = useState<{ countries: string[], ranges: RangeData[] }>({
    countries: [],
    ranges: []
  });

  // Extraire toutes les périodes disponibles
  useEffect(() => {
    if (!environmentalData) return;

    const periods = new Set<string>();
    
    // Collecter toutes les périodes disponibles dans les données
    Object.values(environmentalData).forEach((countryData: any) => {
      if (countryData.periods) {
        // Format avec periods
        Object.keys(countryData.periods).forEach(period => periods.add(period));
      } else if (countryData.period) {
        // Format avec une seule période
        periods.add(countryData.period);
      }
    });
    
    const sortedPeriods = Array.from(periods).sort((a, b) => a.localeCompare(b));
    setAvailablePeriods(sortedPeriods);
    
    // Utiliser la période initiale si elle existe, sinon la plus récente
    if (sortedPeriods.length > 0) {
      if (!selectedPeriod || !sortedPeriods.includes(selectedPeriod)) {
        setSelectedPeriod(sortedPeriods[sortedPeriods.length - 1]);
      }
    }
  }, [environmentalData, initialPeriod]);

  // Navigation entre périodes
  const prevNextPeriod = useMemo(() => {
    if (!availablePeriods.length) return { prev: null, next: null };
    const currentIndex = availablePeriods.indexOf(selectedPeriod);
    
    return {
      prev: currentIndex > 0 ? availablePeriods[currentIndex - 1] : null,
      next: currentIndex < availablePeriods.length - 1 ? availablePeriods[currentIndex + 1] : null
    };
  }, [availablePeriods, selectedPeriod]);

  // Traiter les données pour le graphique
  useEffect(() => {
    if (!environmentalData || !selectedPeriod) return;

    // Structure pour stocker les données pour chaque pays sur toutes les périodes
    interface CountryMetrics {
      [period: string]: number;
    }
    
    const countriesData: {[country: string]: CountryMetrics} = {};

    // Collecter les données pour chaque pays et période
    Object.entries(environmentalData).forEach(([countryName, countryData]: [string, any]) => {
      if (!countriesData[countryName]) {
        countriesData[countryName] = {};
      }

      // Extraire les données de la période sélectionnée
      let periodData;
      
      if (countryData.periods && countryData.periods[selectedPeriod]) {
        periodData = countryData.periods[selectedPeriod];
      } else if (countryData.indices) {
        // Format alternatif
        periodData = countryData.indices;
      } else if (countryData.period === selectedPeriod) {
        // Autre format possible
        periodData = countryData;
      }
      
      // Vérifier si nous avons des données pour le polluant et la métrique sélectionnés
      if (periodData && 
          periodData[selectedPollutant] && 
          periodData[selectedPollutant][selectedMetric] !== undefined) {
        
        countriesData[countryName][selectedPeriod] = periodData[selectedPollutant][selectedMetric];
      }
    });

    // Calculer les min, max et avg pour chaque pays
    const rangeData: RangeData[] = [];

    Object.entries(countriesData).forEach(([countryName, metrics]) => {
      const values = Object.values(metrics);
      
      if (values.length > 0) {
        rangeData.push({
          country: countryName,
          min: Math.min(...values),
          max: Math.max(...values),
          avg: values.reduce((a, b) => a + b, 0) / values.length
        });
      }
    });

    // Trier par valeur moyenne (décroissant)
    rangeData.sort((a, b) => b.avg - a.avg);

    // Limiter à 10 pays pour une meilleure lisibilité
    const topCountries = rangeData.slice(0, 10);

    setChartData({
      countries: topCountries.map(item => item.country),
      ranges: topCountries
    });
  }, [environmentalData, selectedPollutant, selectedMetric, selectedPeriod]);

  // Déterminer le nom de la métrique pour le titre
  const getMetricName = (metricId: string): string => {
    switch (metricId) {
      case 'composite_index': return 'Indice Composite';
      case 'pollution_gdp_ratio': return 'Pollution/PIB';
      case 'gdp_pollution_ratio': return 'PIB/Pollution';
      case 'normalized_ratio': return 'Ratio Normalisé';
      case 'env_inequality_index': return 'Inégalités Environnementales';
      default: return 'Indice Environnemental';
    }
  };

  // Options pour le graphique ApexCharts
  const chartOptions = {
    chart: {
      type: 'rangeArea',
      height: 350,
      toolbar: {
        show: false
      },
      fontFamily: 'Inter, system-ui, sans-serif',
      background: 'transparent',
      zoom: {
        enabled: false
      }
    },
    colors: ['#10B981'],
    fill: {
      opacity: 0.24,
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: 'vertical',
        shadeIntensity: 0.5,
        opacityFrom: 0.9,
        opacityTo: 0.2,
      }
    },
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    markers: {
      size: 5,
      hover: {
        size: 7
      }
    },
    dataLabels: {
      enabled: false
    },
    xaxis: {
      categories: chartData.countries,
      labels: {
        style: {
          fontSize: '11px'
        }
      }
    },
    yaxis: {
      title: {
        text: getMetricName(selectedMetric)
      },
      labels: {
        formatter: function(val: number) {
          return val.toFixed(2);
        }
      }
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: function (val: number) {
          return val.toFixed(3);
        }
      }
    },
    title: {
      text: t('Performance environnementale par pays'),
      align: 'center',
      style: {
        fontSize: '16px',
        fontWeight: 'bold'
      }
    },
    subtitle: {
      text: `Période: ${selectedPeriod} - Polluant: ${selectedPollutant === 'composite' ? 'Tous polluants' : selectedPollutant}`,
      align: 'center'
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right'
    },
    noData: {
      text: t('Aucune donnée disponible'),
      align: 'center',
      verticalAlign: 'middle',
      style: {
        fontSize: '16px'
      }
    }
  };

  const series = chartData.ranges.length > 0 ? [
    {
      name: `${getMetricName(selectedMetric)} (Min-Max)`,
      data: chartData.ranges.map(item => ({
        x: item.country,
        y: [item.min, item.max]
      }))
    },
    {
      name: `${getMetricName(selectedMetric)} (Moyenne)`,
      type: 'line',
      data: chartData.ranges.map(item => ({
        x: item.country,
        y: item.avg
      }))
    }
  ] : [];

  const handlePrevPeriod = () => {
    if (prevNextPeriod.prev) {
      setSelectedPeriod(prevNextPeriod.prev);
    }
  };

  const handleNextPeriod = () => {
    if (prevNextPeriod.next) {
      setSelectedPeriod(prevNextPeriod.next);
    }
  };

  return (
    <div className="chart-container bg-white p-4 rounded-lg shadow w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-green-700">Indices Environnementaux</h3>
        
        <div className="flex items-center space-x-2">
          <Label className="text-xs">Période:</Label>
          <div className="flex items-center gap-1">
            <Button 
              variant="outline" 
              size="icon" 
              className="h-7 w-7"
              disabled={!prevNextPeriod.prev}
              onClick={handlePrevPeriod}
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="h-8 text-xs w-[120px]">
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
              disabled={!prevNextPeriod.next}
              onClick={handleNextPeriod}
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
      
      <div id="environmental-ranking-chart">
        {chartData.countries.length > 0 ? (
          <ReactApexChart
            options={chartOptions as any}
            series={series as any}
            type="rangeArea"
            height={400}
          />
        ) : (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">{t('Chargement des données...')}</p>
          </div>
        )}
      </div>
    </div>
  );
}