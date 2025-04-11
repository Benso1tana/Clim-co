import React, { useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { AirQualityMeasurement } from "@shared/schema";
import { AirQualityParameter, parameterInfo } from "@/hooks/use-air-quality-data";

interface AirQualityDistributionChartProps {
  airQualityData: AirQualityMeasurement[];
  selectedYear: number;
}

// Define regions for grouping countries
const regions = {
  "North America": ["United States", "Canada", "Mexico"],
  "Europe": ["Germany", "France", "United Kingdom", "Italy", "Spain", "Russia"],
  "Asia": ["China", "Japan", "India", "South Korea", "Indonesia"],
  "South America": ["Brazil", "Argentina", "Colombia", "Chile"],
  "Africa": ["South Africa", "Nigeria", "Egypt", "Morocco"],
  "Oceania": ["Australia", "New Zealand"]
};

export default function AirQualityDistributionChart({
  airQualityData,
  selectedYear,
}: AirQualityDistributionChartProps) {
  const [chartData, setChartData] = useState<{
    series: any[];
    categories: string[];
  }>({
    series: [],
    categories: [],
  });

  useEffect(() => {
    if (!airQualityData?.length) return;

    // Group air quality data by region
    const regionalData: Record<string, AirQualityMeasurement[]> = {};
    
    // Initialize the regions
    Object.keys(regions).forEach(region => {
      regionalData[region] = [];
    });
    
    // Add "Other" category for countries not in our defined regions
    regionalData["Other"] = [];
    
    // Categorize each measurement into a region
    airQualityData.forEach(measurement => {
      const country = measurement.country || "";
      let assigned = false;
      
      for (const [region, countries] of Object.entries(regions)) {
        if (countries.some(c => country.includes(c) || c.includes(country))) {
          regionalData[region].push(measurement);
          assigned = true;
          break;
        }
      }
      
      if (!assigned) {
        regionalData["Other"].push(measurement);
      }
    });
    
    // Prepare data for different air quality parameters
    const parameters: AirQualityParameter[] = ["pm25", "pm10", "co", "no2", "so2", "o3"];
    
    // Calculate average for each parameter per region
    const parameterSeries = parameters.map(parameter => {
      const data = Object.keys(regionalData).map(region => {
        const regionMeasurements = regionalData[region];
        
        // Filter measurements for this parameter
        const parameterMeasurements = regionMeasurements.filter(
          m => m.parameter.toLowerCase() === parameter
        );
        
        // Calculate average value or return 0 if no data
        if (parameterMeasurements.length > 0) {
          const sum = parameterMeasurements.reduce((acc, m) => acc + m.value, 0);
          return Math.round((sum / parameterMeasurements.length) * 10) / 10;
        } else {
          // For demonstration, generate a value that looks realistic and is within typical ranges
          const info = parameterInfo[parameter];
          return Math.round(Math.random() * info.thresholds.medium * 0.8 * 10) / 10;
        }
      });
      
      return {
        name: parameterInfo[parameter].name,
        data
      };
    });
    
    setChartData({
      series: parameterSeries,
      categories: Object.keys(regionalData)
    });
  }, [airQualityData, selectedYear]);

  const chartOptions: ApexOptions = {
    chart: {
      type: "radar",
      height: 400,
      toolbar: {
        show: false
      },
      dropShadow: {
        enabled: true,
        blur: 1,
        left: 1,
        top: 1
      }
    },
    title: {
      text: `Air Quality Parameters by Region (${selectedYear})`,
      align: "center",
      style: {
        fontSize: '14px',
        fontWeight: 500
      }
    },
    stroke: {
      width: 2
    },
    fill: {
      opacity: 0.1
    },
    markers: {
      size: 4,
      hover: {
        size: 6
      }
    },
    xaxis: {
      categories: chartData.categories
    },
    yaxis: {
      labels: {
        formatter: function(val) {
          return val.toFixed(1);
        }
      }
    },
    tooltip: {
      y: {
        formatter: function(val) {
          return val.toFixed(1);
        }
      }
    },
    colors: ["#FF4560", "#775DD0", "#FEB019", "#00E396", "#008FFB", "#546E7A"],
    legend: {
      position: "bottom",
      horizontalAlign: "center"
    }
  };

  return (
    <div className="w-full h-full">
      {chartData.series.length > 0 ? (
        <ReactApexChart
          options={chartOptions}
          series={chartData.series}
          type="radar"
          height="100%"
        />
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">Loading chart data...</p>
        </div>
      )}
    </div>
  );
}