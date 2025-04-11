import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, BarChart } from "lucide-react";
import { t } from "@/lib/i18n";
// Import chart components
import TopGdpAirQualityChart from "@/components/charts/top-gdp-air-quality-chart";
import GdpAirQualityCorrelation from "@/components/charts/gdp-air-quality-correlation";
import EnvironmentalRankingChart from "@/components/environmental-ranking-chart";
// Other chart components will be implemented as needed
// import GdpTrendsChart from "@/components/charts/gdp-trends-chart";
// import AirQualityDistributionChart from "@/components/charts/air-quality-distribution-chart";
import { useQuery } from '@tanstack/react-query';
import { getEnvironmentalIndices } from '@/lib/queryClient';

interface DashboardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  gdpData: any[];
  airQualityData: any[];
  selectedYear: number;
}

export default function DashboardDialog({
  isOpen,
  onClose,
  gdpData,
  airQualityData,
  selectedYear,
}: DashboardDialogProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Récupérer les données environnementales
  const { data: environmentalData } = useQuery({
    queryKey: ['/api/environmental-indices'],
    queryFn: () => getEnvironmentalIndices({
      period: `${selectedYear}-12`, // Utiliser le mois de décembre de l'année sélectionnée
      pollutant: 'composite',
      metric: 'composite_index'
    }),
    enabled: isOpen // Charger uniquement si le dialogue est ouvert
  });
  
  // Array of chart components to be used in the carousel
  const charts = [
    {
      title: t("Top 10 Countries by GDP and Air Quality"),
      component: (
        <TopGdpAirQualityChart 
          gdpData={gdpData} 
          airQualityData={airQualityData}
          selectedYear={selectedYear}
        />
      )
    },
    {
      title: t("GDP & Air Quality Correlation Analysis"),
      component: (
        <GdpAirQualityCorrelation
          gdpData={gdpData}
          airQualityData={airQualityData}
          selectedYear={selectedYear}
        />
      )
    },
    {
      title: t("Évolution des Performances Environnementales"),
      component: (
        <EnvironmentalRankingChart
          environmentalData={environmentalData || {}}
          selectedPollutant="composite"
          selectedMetric="composite_index"
          selectedPeriod={`${selectedYear}-12`}
        />
      )
    }
  ];

  const handlePrevious = () => {
    setCurrentSlide((prev) => (prev === 0 ? charts.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev === charts.length - 1 ? 0 : prev + 1));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[900px] bg-white p-0 overflow-hidden z-[1001]" aria-describedby="dashboard-dialog-description">
        <DialogHeader className="px-6 pt-6 pb-3 border-b">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            <span>{t('Economic & Environmental Dashboard')}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="relative">
          {/* Current chart title */}
          <div className="px-6 py-4 bg-blue-50 text-blue-800 font-medium">
            {charts[currentSlide].title}
          </div>
          
          {/* Chart container */}
          <div className="px-6 py-6 h-[480px] flex items-center justify-center overflow-hidden">
            {charts[currentSlide].component}
          </div>
          <div id="dashboard-dialog-description" className="sr-only">
            Economic and environmental data visualization dashboard showing GDP and air quality statistics
          </div>
          
          {/* Navigation buttons */}
          <div className="absolute top-1/2 left-0 transform -translate-y-1/2 flex justify-between w-full px-4 pointer-events-none">
            <Button 
              variant="outline" 
              size="icon"
              className="rounded-full bg-white shadow-lg border-gray-200 hover:bg-blue-50 pointer-events-auto"
              onClick={handlePrevious}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <Button 
              variant="outline" 
              size="icon"
              className="rounded-full bg-white shadow-lg border-gray-200 hover:bg-blue-50 pointer-events-auto"
              onClick={handleNext}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Slide indicators */}
          <div className="flex justify-center gap-2 pb-4">
            {charts.map((_, index) => (
              <div 
                key={index}
                className={`h-2 w-2 rounded-full ${
                  index === currentSlide ? "bg-blue-600" : "bg-gray-300"
                }`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}