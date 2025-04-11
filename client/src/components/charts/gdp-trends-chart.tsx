import React, { useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { CountryGdpData } from "@/lib/types";

interface GdpTrendsChartProps {
  gdpData: CountryGdpData[];
  selectedYear: number;
}

export default function GdpTrendsChart({
  gdpData,
  selectedYear,
}: GdpTrendsChartProps) {
  const [chartData, setChartData] = useState<{
    series: any[];
    years: number[];
  }>({
    series: [],
    years: [],
  });

  useEffect(() => {
    if (!gdpData?.length) return;
    
    // Get top 5 countries by GDP for the selected year
    const topCountriesForSelectedYear = [...gdpData]
      .sort((a, b) => b.gdpValue - a.gdpValue)
      .slice(0, 5);
    
    // Get unique years from the GDP data
    const years = Array.from(
      new Set(gdpData.map((item) => item.year || selectedYear))
    ).sort();
    
    // Create a series for each top country
    const series = topCountriesForSelectedYear.map((country) => {
      // For each country, find its GDP value for each year
      const yearData = years.map((year) => {
        const yearEntry = gdpData.find(
          (item) => 
            item.countryCode === country.countryCode && 
            (item.year === year || (item.year === undefined && year === selectedYear))
        );
        
        return yearEntry ? yearEntry.gdpValue / 1000 : null; // Convert to thousands
      });
      
      return {
        name: country.countryName,
        data: yearData
      };
    });
    
    setChartData({
      series,
      years,
    });
  }, [gdpData, selectedYear]);

  const chartOptions: ApexOptions = {
    chart: {
      height: 400,
      type: "line",
      zoom: {
        enabled: false
      },
      toolbar: {
        show: false
      },
      dropShadow: {
        enabled: true,
        color: "#000",
        top: 10,
        left: 7,
        blur: 3,
        opacity: 0.1
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: "smooth",
      width: 3
    },
    grid: {
      borderColor: "#e7e7e7",
      row: {
        colors: ["#f3f3f3", "transparent"],
        opacity: 0.5
      },
    },
    markers: {
      size: 6,
      colors: ["#fff"],
      strokeColors: ["#2E93fA", "#66DA26", "#546E7A", "#E91E63", "#FF9800"],
      strokeWidth: 2
    },
    xaxis: {
      categories: chartData.years,
      title: {
        text: "Year",
        style: {
          fontSize: "12px",
          fontWeight: 500,
        },
      }
    },
    yaxis: {
      title: {
        text: "GDP (thousands)",
        style: {
          fontSize: "12px",
          fontWeight: 500
        }
      },
      min: 0,
      labels: {
        formatter: function (val) {
          return "$" + val.toFixed(0) + "k";
        }
      }
    },
    legend: {
      position: "top",
      horizontalAlign: "center",
      floating: false,
      offsetY: -5,
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return "$" + val.toFixed(0) + "k";
        }
      }
    },
    theme: {
      palette: "palette1" // Use a pre-defined palette for attractive colors
    }
  };

  return (
    <div className="w-full h-full">
      {chartData.series.length > 0 ? (
        <ReactApexChart
          options={chartOptions}
          series={chartData.series}
          type="line"
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