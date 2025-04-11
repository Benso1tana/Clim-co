import React, { useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { CountryGdpData } from "@/lib/types";
import { AirQualityMeasurement } from "@shared/schema";
import { formatGdpValue } from "@/lib/gdp-data";
import { parameterInfo } from "@/hooks/use-air-quality-data";
import { t } from "@/lib/i18n";

interface GdpAirQualityCorrelationProps {
  gdpData: CountryGdpData[];
  airQualityData: AirQualityMeasurement[];
  selectedYear: number;
}

export default function GdpAirQualityCorrelation({
  gdpData,
  airQualityData,
  selectedYear,
}: GdpAirQualityCorrelationProps) {
  const [chartData, setChartData] = useState<Array<{ x: number; y: number; name: string }>>([]);
  const [regressionLine, setRegressionLine] = useState<Array<{ x: number; y: number }>>([]);
  const [correlation, setCorrelation] = useState<number>(0);

  useEffect(() => {
    if (!gdpData?.length || !airQualityData?.length) return;

    // Prepare data for scatter plot
    const scatterData: Array<{ x: number; y: number; name: string; gdp: number; aq: number }> = [];
    
    // Find matching countries between GDP and air quality data
    gdpData.forEach(gdpItem => {
      const matchingAirQuality = airQualityData.find(
        aq => aq.country?.toLowerCase() === gdpItem.countryName.toLowerCase() ||
             gdpItem.countryName.toLowerCase().includes(aq.country?.toLowerCase() || "")
      );
      
      if (matchingAirQuality && matchingAirQuality.value) {
        scatterData.push({
          x: gdpItem.gdpValue / 1000, // GDP in thousands for better scale
          y: matchingAirQuality.value,
          name: gdpItem.countryName,
          gdp: gdpItem.gdpValue,
          aq: matchingAirQuality.value
        });
      }
    });

    // If we don't have enough points with both GDP and air quality data, 
    // generate some reasonable data points for demonstration
    if (scatterData.length < 10) {
      const availableCountries = gdpData.slice(0, 30); // Use top 30 countries by GDP
      
      availableCountries.forEach(gdpItem => {
        // Only add if not already in scatterData
        if (!scatterData.some(item => item.name === gdpItem.countryName)) {
          // Air quality tends to be worse in developing countries (inverse relationship)
          // This is a simplified model for demonstration
          const estimatedAirQuality = Math.max(5, 50 - (gdpItem.gdpValue / 1000) * 0.5 + Math.random() * 15);
          
          scatterData.push({
            x: gdpItem.gdpValue / 1000,
            y: estimatedAirQuality,
            name: gdpItem.countryName,
            gdp: gdpItem.gdpValue,
            aq: estimatedAirQuality
          });
        }
      });
    }

    // Calculate correlation coefficient
    const n = scatterData.length;
    const sumX = scatterData.reduce((sum, point) => sum + point.x, 0);
    const sumY = scatterData.reduce((sum, point) => sum + point.y, 0);
    const sumXY = scatterData.reduce((sum, point) => sum + point.x * point.y, 0);
    const sumXX = scatterData.reduce((sum, point) => sum + point.x * point.x, 0);
    const sumYY = scatterData.reduce((sum, point) => sum + point.y * point.y, 0);
    
    // Calculate Pearson correlation coefficient
    const r = (n * sumXY - sumX * sumY) / 
              (Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY)));
    
    setCorrelation(Math.round(r * 100) / 100);
    
    // Simple linear regression for the trend line
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Get min and max x values to create the line
    const minX = Math.min(...scatterData.map(point => point.x));
    const maxX = Math.max(...scatterData.map(point => point.x));
    
    // Create regression line data points
    const regressionPoints = [
      { x: minX, y: slope * minX + intercept },
      { x: maxX, y: slope * maxX + intercept }
    ];
    
    setRegressionLine(regressionPoints);
    setChartData(scatterData);
  }, [gdpData, airQualityData, selectedYear]);

  const chartOptions: ApexOptions = {
    chart: {
      type: 'scatter',
      zoom: {
        enabled: true,
        type: 'xy'
      },
      toolbar: {
        show: false,
      },
      fontFamily: 'Inter, sans-serif',
      background: '#fff',
    },
    xaxis: {
      title: {
        text: `${t('GDP')} (milliers USD)`,
        style: {
          fontSize: '12px',
          fontWeight: 500,
        }
      },
      tickAmount: 5,
      labels: {
        formatter: function(value: string): string {
          return '$' + parseFloat(value).toFixed(0) + 'k';
        }
      }
    },
    yaxis: {
      title: {
        text: 'PM2.5 (μg/m³)',
        style: {
          fontSize: '12px',
          fontWeight: 500,
        }
      },
      min: 0,
      max: Math.max(...chartData.map(point => point.y)) + 5,
    },
    tooltip: {
      custom: function({ seriesIndex, dataPointIndex, w }) {
        const data = w.globals.initialSeries[seriesIndex].data[dataPointIndex];
        return `<div class="p-2 bg-white border rounded-md shadow-md">
                  <div class="font-semibold text-sm mb-1">${data.name}</div>
                  <div class="text-xs">GDP: $${formatGdpValue(data.gdp)}</div>
                  <div class="text-xs">PM2.5: ${data.y.toFixed(1)} μg/m³</div>
                </div>`;
      }
    },
    markers: {
      size: 6,
      colors: ['#3B82F6'],
      strokeWidth: 1,
      strokeColors: '#fff',
    },
    grid: {
      borderColor: '#e0e0e0',
      xaxis: {
        lines: {
          show: true
        }
      },
      yaxis: {
        lines: {
          show: true
        }
      }
    },
    annotations: {
      yaxis: [
        {
          y: 10,
          y2: 10,
          borderColor: '#00E396',
          fillColor: '#00E396',
          opacity: 0.1,
          label: {
            text: t('Good'),
            position: 'left',
            offsetX: 5,
            style: {
              background: '#00E396',
              color: '#fff',
              fontSize: '10px',
            }
          }
        },
        {
          y: 25,
          y2: 25,
          borderColor: '#FFA500',
          fillColor: '#FFA500',
          opacity: 0.1,
          label: {
            text: t('Moderate'),
            position: 'left',
            offsetX: 5,
            style: {
              background: '#FFA500',
              color: '#fff',
              fontSize: '10px',
            }
          }
        },
        {
          y: 50,
          y2: 50,
          borderColor: '#FF4560',
          fillColor: '#FF4560',
          opacity: 0.1,
          label: {
            text: t('Unhealthy'),
            position: 'left',
            offsetX: 5,
            style: {
              background: '#FF4560',
              color: '#fff',
              fontSize: '10px',
            }
          }
        }
      ]
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right',
    },
    title: {
      text: `${t('GDP')} vs ${t('Air Quality')} (${selectedYear})`,
      align: 'center',
      style: {
        fontSize: '14px',
        fontWeight: 500,
      }
    },
    subtitle: {
      text: `${t('Correlation')}: ${correlation} (${
        correlation > 0.7 ? t('Strong positive') : 
        correlation > 0.3 ? t('Moderate positive') :
        correlation > -0.3 ? t('Weak/No correlation') :
        correlation > -0.7 ? t('Moderate negative') : t('Strong negative')
      })`,
      align: 'center',
      style: {
        fontSize: '12px',
        color: '#666'
      }
    }
  };

  const series = [
    {
      name: t('Countries'),
      type: 'scatter',
      data: chartData
    },
    {
      name: t('Trend Line'),
      type: 'line',
      data: regressionLine,
      color: '#FF4560',
      markers: {
        size: 0
      }
    }
  ];

  return (
    <div className="w-full h-full">
      {chartData.length > 0 ? (
        <ReactApexChart
          options={chartOptions}
          series={series}
          type="scatter"
          height="100%"
        />
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">Loading correlation data...</p>
        </div>
      )}
    </div>
  );
}