// Define interfaces first
import { AirQualityParameter } from '@/hooks/use-air-quality-data';

export interface MonthlyAirQualityData {
  value: number;
  min: number;
  q02: number;
  q25: number;
  median: number;
  q75: number;
  q98: number;
  max: number;
  avg: number;
  sd: number;
}

export interface CountryAirQualityData {
  [date: string]: MonthlyAirQualityData;
}

export interface AirQualityDataByCountry {
  [country: string]: CountryAirQualityData;
}

// Create sample data structure with many countries and years for better visualization
const countryAirQualityData: AirQualityDataByCountry = {
  "Kenya": {
    "2018-03-31": {
      "value": 8.147499999999999,
      "min": 2.1,
      "q02": 2.161,
      "q25": 4.675,
      "median": 7.225,
      "q75": 10.8875,
      "q98": 19.217999999999993,
      "max": 22.025,
      "avg": 8.156276088252831,
      "sd": 4.6531597274135
    },
    "2018-04-30": {
      "value": 6.97,
      "min": 1.175,
      "q02": 1.35,
      "q25": 3.6625,
      "median": 5.475,
      "q75": 7.8125,
      "q98": 24.417999999999996,
      "max": 46.275,
      "avg": 6.962712643678161,
      "sd": 6.566664734912836
    },
    "2019-04-30": {
      "value": 7.97,
      "min": 2.175,
      "q02": 2.35,
      "q25": 4.6625,
      "median": 6.475,
      "q75": 8.8125,
      "q98": 25.417999999999996,
      "max": 47.275,
      "avg": 7.962712643678161,
      "sd": 6.566664734912836
    },
    "2020-04-30": {
      "value": 8.97,
      "min": 3.175,
      "q02": 3.35,
      "q25": 5.6625,
      "median": 7.475,
      "q75": 9.8125,
      "q98": 26.417999999999996,
      "max": 48.275,
      "avg": 8.962712643678161,
      "sd": 6.566664734912836
    },
    "2021-04-30": {
      "value": 9.97,
      "min": 4.175,
      "q02": 4.35,
      "q25": 6.6625,
      "median": 8.475,
      "q75": 10.8125,
      "q98": 27.417999999999996,
      "max": 49.275,
      "avg": 9.962712643678161,
      "sd": 6.566664734912836
    }
  },
  "Afghanistan": {
    "2018-09-30": {
      "value": 58.05,
      "min": 13.0,
      "q02": 17.8,
      "q25": 34.375,
      "median": 51.75,
      "q75": 76.5,
      "q98": 123.19999999999999,
      "max": 146.5,
      "avg": 58.047970085470084,
      "sd": 30.13261167841148
    },
    "2019-09-30": {
      "value": 59.05,
      "min": 14.0,
      "q02": 18.8,
      "q25": 35.375,
      "median": 52.75,
      "q75": 77.5,
      "q98": 124.19999999999999,
      "max": 147.5,
      "avg": 59.047970085470084,
      "sd": 30.13261167841148
    },
    "2020-09-30": {
      "value": 60.05,
      "min": 15.0,
      "q02": 19.8,
      "q25": 36.375,
      "median": 53.75,
      "q75": 78.5,
      "q98": 125.19999999999999,
      "max": 148.5,
      "avg": 60.047970085470084,
      "sd": 30.13261167841148
    }
  },
  "Poland": {
    "2018-11-30": {
      "value": 86.748648,
      "min": 27.67552104,
      "q02": 34.42512094008,
      "q25": 55.786332159,
      "median": 75.463363902,
      "q75": 107.22588899,
      "q98": 204.71749504719995,
      "max": 299.34397598,
      "avg": 86.71855656298894,
      "sd": 43.91653373822374
    },
    "2019-11-30": {
      "value": 87.748648,
      "min": 28.67552104,
      "q02": 35.42512094008,
      "q25": 56.786332159,
      "median": 76.463363902,
      "q75": 108.22588899,
      "q98": 205.71749504719995,
      "max": 300.34397598,
      "avg": 87.71855656298894,
      "sd": 43.91653373822374
    },
    "2020-11-30": {
      "value": 88.748648,
      "min": 29.67552104,
      "q02": 36.42512094008,
      "q25": 57.786332159,
      "median": 77.463363902,
      "q75": 109.22588899,
      "q98": 206.71749504719995,
      "max": 301.34397598,
      "avg": 88.71855656298894,
      "sd": 43.91653373822374
    }
  },
  "China": {
    "2018-04-30": {
      "value": 92.45,
      "min": 35.2,
      "q02": 44.6,
      "q25": 67.4,
      "median": 89.7,
      "q75": 124.5,
      "q98": 167.3,
      "max": 189.2,
      "avg": 94.12,
      "sd": 37.8
    },
    "2019-04-30": {
      "value": 85.3,
      "min": 32.5,
      "q02": 41.8,
      "q25": 62.9,
      "median": 84.1,
      "q75": 115.7,
      "q98": 156.5,
      "max": 175.9,
      "avg": 87.5,
      "sd": 35.6
    },
    "2020-04-30": {
      "value": 78.6,
      "min": 29.8,
      "q02": 38.5,
      "q25": 57.3,
      "median": 77.9,
      "q75": 106.4,
      "q98": 142.1,
      "max": 162.7,
      "avg": 80.5,
      "sd": 33.2
    }
  },
  "India": {
    "2018-04-30": {
      "value": 110.3,
      "min": 45.8,
      "q02": 56.2,
      "q25": 83.4,
      "median": 108.9,
      "q75": 146.7,
      "q98": 194.5,
      "max": 220.3,
      "avg": 112.7,
      "sd": 42.9
    },
    "2019-04-30": {
      "value": 105.8,
      "min": 42.6,
      "q02": 53.1,
      "q25": 79.8,
      "median": 102.4,
      "q75": 139.5,
      "q98": 186.2,
      "max": 212.7,
      "avg": 107.8,
      "sd": 41.6
    },
    "2020-04-30": {
      "value": 95.6,
      "min": 37.7,
      "q02": 48.4,
      "q25": 72.5,
      "median": 93.8,
      "q75": 125.6,
      "q98": 167.3,
      "max": 192.4,
      "avg": 98.3,
      "sd": 38.1
    }
  },
  "United States": {
    "2018-04-30": {
      "value": 15.3,
      "min": 5.1,
      "q02": 6.5,
      "q25": 10.2,
      "median": 14.8,
      "q75": 21.5,
      "q98": 32.7,
      "max": 38.4,
      "avg": 16.1,
      "sd": 7.5
    },
    "2019-04-30": {
      "value": 14.5,
      "min": 4.8,
      "q02": 6.1,
      "q25": 9.7,
      "median": 14.1,
      "q75": 20.3,
      "q98": 30.9,
      "max": 36.5,
      "avg": 15.3,
      "sd": 7.1
    }, 
    "2020-04-30": {
      "value": 12.8,
      "min": 4.2,
      "q02": 5.5,
      "q25": 8.6,
      "median": 12.4,
      "q75": 17.9,
      "q98": 27.3,
      "max": 32.1,
      "avg": 13.5,
      "sd": 6.4
    }
  },
  "Brazil": {
    "2018-04-30": {
      "value": 23.7,
      "min": 8.5,
      "q02": 10.3,
      "q25": 16.5,
      "median": 22.9,
      "q75": 32.4,
      "q98": 47.5,
      "max": 54.8,
      "avg": 24.8,
      "sd": 10.9
    },
    "2019-04-30": {
      "value": 22.9,
      "min": 8.2,
      "q02": 9.9,
      "q25": 15.9,
      "median": 22.1,
      "q75": 31.1,
      "q98": 45.7,
      "max": 52.9,
      "avg": 23.9,
      "sd": 10.5
    },
    "2020-04-30": {
      "value": 21.5,
      "min": 7.7,
      "q02": 9.3,
      "q25": 14.9,
      "median": 20.8,
      "q75": 29.3,
      "q98": 43.1,
      "max": 49.8,
      "avg": 22.5,
      "sd": 9.9
    }
  },
  "Germany": {
    "2018-04-30": {
      "value": 17.8,
      "min": 6.1,
      "q02": 7.5,
      "q25": 11.7,
      "median": 17.1,
      "q75": 24.5,
      "q98": 36.2,
      "max": 42.9,
      "avg": 18.6,
      "sd": 8.5
    },
    "2019-04-30": {
      "value": 16.9,
      "min": 5.8,
      "q02": 7.1,
      "q25": 11.2,
      "median": 16.3,
      "q75": 23.3,
      "q98": 34.5,
      "max": 40.9,
      "avg": 17.6,
      "sd": 8.1
    },
    "2020-04-30": {
      "value": 14.5,
      "min": 5.1,
      "q02": 6.2,
      "q25": 9.6,
      "median": 14.1,
      "q75": 20.1,
      "q98": 29.8,
      "max": 35.2,
      "avg": 15.3,
      "sd": 7.1
    }
  }
};

// Parse the date string (YYYY-MM-DD) and return a formatted string (Month YYYY)
export function formatDateString(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

// Get a list of all available months in the data
export function getAvailableMonths(): string[] {
  // Generate all 12 months in MM-DD format for consistency
  const allMonths = [
    '01-31', '02-28', '03-31', '04-30', '05-31', '06-30',
    '07-31', '08-31', '09-30', '10-31', '11-30', '12-31'
  ];
  
  return allMonths;
}

// Get air quality data for all countries for a specific year and month
export function getAirQualityForYearAndMonth(year: number, month: string): {
  country: string;
  coordinates: [number, number];
  value: number;
  parameter: AirQualityParameter;
}[] {
  const result: {
    country: string;
    coordinates: [number, number];
    value: number;
    parameter: AirQualityParameter;
  }[] = [];
  
  // Comprehensive map of countries and their approximate center coordinates
  const countryCoordinates: Record<string, [number, number]> = {
    'Afghanistan': [33.9391, 67.7100],
    'Albania': [41.1533, 20.1683],
    'Algeria': [28.0339, 1.6596],
    'Angola': [-11.2027, 17.8739],
    'Argentina': [-38.4161, -63.6167],
    'Armenia': [40.0691, 45.0382],
    'Australia': [-25.2744, 133.7751],
    'Austria': [47.5162, 14.5501],
    'Azerbaijan': [40.1431, 47.5769],
    'Bahamas': [25.0343, -77.3963],
    'Bangladesh': [23.6850, 90.3563],
    'Belarus': [53.7098, 27.9534],
    'Belgium': [50.5039, 4.4699],
    'Belize': [17.1899, -88.4976],
    'Benin': [9.3077, 2.3158],
    'Bhutan': [27.5142, 90.4336],
    'Bolivia': [-16.2902, -63.5887],
    'Bosnia and Herzegovina': [43.9159, 17.6791],
    'Botswana': [-22.3285, 24.6849],
    'Brazil': [-14.2350, -51.9253],
    'Brunei': [4.5353, 114.7277],
    'Bulgaria': [42.7339, 25.4858],
    'Burkina Faso': [12.2383, -1.5616],
    'Burundi': [-3.3731, 29.9189],
    'Cambodia': [12.5657, 104.9910],
    'Cameroon': [7.3697, 12.3547],
    'Canada': [56.1304, -106.3468],
    'Central African Republic': [6.6111, 20.9394],
    'Chad': [15.4542, 18.7322],
    'Chile': [-35.6751, -71.5430],
    'China': [35.8617, 104.1954],
    'Colombia': [4.5709, -74.2973],
    'Congo': [-0.2280, 15.8277],
    'Costa Rica': [9.7489, -83.7534],
    'Croatia': [45.1000, 15.2000],
    'Cuba': [21.5218, -77.7812],
    'Cyprus': [35.1264, 33.4299],
    'Czech Republic': [49.8175, 15.4730],
    'Denmark': [56.2639, 9.5018],
    'Djibouti': [11.8251, 42.5903],
    'Dominican Republic': [18.7357, -70.1627],
    'DR Congo': [-4.0383, 21.7587],
    'Ecuador': [-1.8312, -78.1834],
    'Egypt': [26.8206, 30.8025],
    'El Salvador': [13.7942, -88.8965],
    'Equatorial Guinea': [1.6508, 10.2679],
    'Eritrea': [15.1794, 39.7823],
    'Estonia': [58.5953, 25.0136],
    'Eswatini': [-26.5225, 31.4659],
    'Ethiopia': [9.1450, 40.4897],
    'Fiji': [-17.7134, 178.0650],
    'Finland': [61.9241, 25.7482],
    'France': [46.2276, 2.2137],
    'French Guiana': [3.9339, -53.1258],
    'Gabon': [-0.8037, 11.6094],
    'Gambia': [13.4432, -15.3101],
    'Georgia': [42.3154, 43.3569],
    'Germany': [51.1657, 10.4515],
    'Ghana': [7.9465, -1.0232],
    'Greece': [39.0742, 21.8243],
    'Greenland': [71.7069, -42.6043],
    'Guatemala': [15.7835, -90.2308],
    'Guinea': [9.9456, -9.6966],
    'Guinea-Bissau': [11.8037, -15.1804],
    'Guyana': [4.8604, -58.9302],
    'Haiti': [18.9712, -72.2852],
    'Honduras': [15.2000, -86.2419],
    'Hungary': [47.1625, 19.5033],
    'Iceland': [64.9631, -19.0208],
    'India': [20.5937, 78.9629],
    'Indonesia': [-0.7893, 113.9213],
    'Iran': [32.4279, 53.6880],
    'Iraq': [33.2232, 43.6793],
    'Ireland': [53.1424, -7.6921],
    'Israel': [31.0461, 34.8516],
    'Italy': [41.8719, 12.5674],
    'Ivory Coast': [7.5400, -5.5471],
    'Jamaica': [18.1096, -77.2975],
    'Japan': [36.2048, 138.2529],
    'Jordan': [30.5852, 36.2384],
    'Kazakhstan': [48.0196, 66.9237],
    'Kenya': [0.0236, 37.9062],
    'Kosovo': [42.5633, 20.9040],
    'Kuwait': [29.3117, 47.4818],
    'Kyrgyzstan': [41.2044, 74.7661],
    'Laos': [19.8563, 102.4955],
    'Latvia': [56.8796, 24.6032],
    'Lebanon': [33.8547, 35.8623],
    'Lesotho': [-29.6100, 28.2336],
    'Liberia': [6.4281, -9.4295],
    'Libya': [26.3351, 17.2283],
    'Lithuania': [55.1694, 23.8813],
    'Luxembourg': [49.8153, 6.1296],
    'Macedonia': [41.6086, 21.7453],
    'Madagascar': [-18.7669, 46.8691],
    'Malawi': [-13.2543, 34.3015],
    'Malaysia': [4.2105, 101.9758],
    'Mali': [17.5707, -3.9962],
    'Mauritania': [21.0079, -10.9408],
    'Mauritius': [-20.3484, 57.5522],
    'Mexico': [23.6345, -102.5528],
    'Moldova': [47.4116, 28.3699],
    'Mongolia': [46.8625, 103.8467],
    'Montenegro': [42.7087, 19.3744],
    'Morocco': [31.7917, -7.0926],
    'Mozambique': [-18.6657, 35.5296],
    'Myanmar': [21.9162, 95.9560],
    'Namibia': [-22.9576, 18.4904],
    'Nepal': [28.3949, 84.1240],
    'Netherlands': [52.1326, 5.2913],
    'New Caledonia': [-20.9043, 165.6180],
    'New Zealand': [-40.9006, 174.8860],
    'Nicaragua': [12.8654, -85.2072],
    'Niger': [17.6078, 8.0817],
    'Nigeria': [9.0820, 8.6753],
    'North Korea': [40.3399, 127.5101],
    'Norway': [60.4720, 8.4689],
    'Oman': [21.4735, 55.9754],
    'Pakistan': [30.3753, 69.3451],
    'Palestine': [31.9522, 35.2332],
    'Panama': [8.5380, -80.7821],
    'Papua New Guinea': [-6.3150, 143.9555],
    'Paraguay': [-23.4425, -58.4438],
    'Peru': [-9.1900, -75.0152],
    'Philippines': [12.8797, 121.7740],
    'Poland': [51.9194, 19.1451],
    'Portugal': [39.3999, -8.2245],
    'Puerto Rico': [18.2208, -66.5901],
    'Qatar': [25.3548, 51.1839],
    'Romania': [45.9432, 24.9668],
    'Russia': [61.5240, 105.3188],
    'Rwanda': [-1.9403, 29.8739],
    'Saudi Arabia': [23.8859, 45.0792],
    'Senegal': [14.4974, -14.4524],
    'Serbia': [44.0165, 21.0059],
    'Sierra Leone': [8.4606, -11.7799],
    'Singapore': [1.3521, 103.8198],
    'Slovakia': [48.6690, 19.6990],
    'Slovenia': [46.1512, 14.9955],
    'Solomon Islands': [-9.6457, 160.1562],
    'Somalia': [5.1521, 46.1996],
    'South Africa': [-30.5595, 22.9375],
    'South Korea': [35.9078, 127.7669],
    'South Sudan': [6.8770, 31.3070],
    'Spain': [40.4637, -3.7492],
    'Sri Lanka': [7.8731, 80.7718],
    'Sudan': [12.8628, 30.2176],
    'Suriname': [3.9193, -56.0278],
    'Sweden': [60.1282, 18.6435],
    'Switzerland': [46.8182, 8.2275],
    'Syria': [34.8021, 38.9968],
    'Taiwan': [23.6978, 120.9605],
    'Tajikistan': [38.8610, 71.2761],
    'Tanzania': [-6.3690, 34.8888],
    'Thailand': [15.8700, 100.9925],
    'Timor-Leste': [-8.8742, 125.7275],
    'Togo': [8.6195, 0.8248],
    'Trinidad and Tobago': [10.6918, -61.2225],
    'Tunisia': [33.8869, 9.5375],
    'Turkey': [38.9637, 35.2433],
    'Turkmenistan': [38.9697, 59.5563],
    'Uganda': [1.3733, 32.2903],
    'Ukraine': [48.3794, 31.1656],
    'United Arab Emirates': [23.4241, 53.8478],
    'United Kingdom': [55.3781, -3.4360],
    'United States': [37.0902, -95.7129],
    'Uruguay': [-32.5228, -55.7658],
    'Uzbekistan': [41.3775, 64.5853],
    'Venezuela': [6.4238, -66.5897],
    'Vietnam': [14.0583, 108.2772],
    'Western Sahara': [24.2155, -12.8858],
    'Yemen': [15.5527, 48.5164],
    'Zambia': [-13.1339, 27.8493],
    'Zimbabwe': [-19.0154, 29.1549]
  };
  
  // For any countries without explicit coordinates, use these defaults
  const defaultCoordinates: [number, number] = [0, 0];
  
  // Base Parameter Values for Different Regions - this simulates realistic air quality patterns
  const baseValues: Record<string, number> = {
    'pm25': 30, // Base value for PM2.5
    'pm10': 45, // Base value for PM10
    'co': 5,   // Base value for CO
    'no2': 35, // Base value for NO2
    'so2': 15, // Base value for SO2
    'o3': 45   // Base value for O3
  };
  
  // Regional multipliers to create geographic patterns
  const regionMultipliers: Record<string, number> = {
    // Higher pollution in industrialized East Asia
    'China': 3.5, 'South Korea': 2.8, 'Japan': 1.8, 'Taiwan': 2.2, 'Mongolia': 2.0,
    // Higher in South Asia
    'India': 3.8, 'Pakistan': 3.2, 'Bangladesh': 3.5, 'Nepal': 2.5,
    // Higher in Southeast Asia
    'Thailand': 2.0, 'Vietnam': 2.3, 'Indonesia': 2.2, 'Philippines': 2.1, 'Malaysia': 1.9,
    // Higher in Middle East
    'Iran': 2.5, 'Iraq': 2.7, 'Saudi Arabia': 2.0, 'Kuwait': 2.2, 'UAE': 1.8,
    // Moderate in Eastern Europe
    'Poland': 1.8, 'Ukraine': 1.7, 'Romania': 1.6, 'Bulgaria': 1.5, 'Hungary': 1.4,
    // Lower in Western Europe
    'Germany': 1.2, 'United Kingdom': 1.1, 'France': 1.0, 'Italy': 1.3, 'Spain': 1.1,
    // Varied in Americas
    'United States': 1.4, 'Mexico': 1.9, 'Brazil': 1.5, 'Colombia': 1.4, 'Chile': 1.3,
    // Lower in Oceania
    'Australia': 0.8, 'New Zealand': 0.6,
    // Higher in African industrial areas, lower elsewhere
    'South Africa': 1.8, 'Nigeria': 2.0, 'Egypt': 2.5, 'Kenya': 1.7,
    // Default multiplier for all other countries
    'default': 1.0
  };
  
  // Seasonal variation based on month (1-based) and hemisphere
  const getSeasonalMultiplier = (country: string, monthNum: number): number => {
    // Extract month number from MM-DD format
    const monthNumber = parseInt(month.split('-')[0]);
    
    // Determine if country is in northern or southern hemisphere
    const isNorthern = countryCoordinates[country] && countryCoordinates[country][0] >= 0;
    
    // Winter months have higher pollution in urban areas due to heating and inversions
    const winterMonths = isNorthern ? [1, 2, 12] : [6, 7, 8];
    const summerMonths = isNorthern ? [6, 7, 8] : [1, 2, 12];
    
    if (winterMonths.includes(monthNumber)) {
      return 1.3; // Higher in winter
    } else if (summerMonths.includes(monthNumber)) {
      return 0.9; // Lower in summer (except ozone, handled separately)
    } else {
      return 1.0; // Normal in spring/fall
    }
  };
  
  // Adjust for parameter differences and add some randomization
  const getParameterAdjustment = (parameter: AirQualityParameter, monthNum: number): number => {
    // Ozone is higher in summer months due to sunlight
    if (parameter === 'o3') {
      // Northern hemisphere summer is months 6-8, southern is 12-2
      const isNorthernSummer = (monthNum >= 6 && monthNum <= 8);
      const isSouthernSummer = (monthNum === 12 || monthNum <= 2);
      
      if (isNorthernSummer || isSouthernSummer) {
        return 1.4; // Higher ozone in summer
      }
    }
    
    // Other parameter adjustments
    switch(parameter) {
      case 'pm25': return 1.0 + (Math.random() * 0.3);
      case 'pm10': return 1.1 + (Math.random() * 0.2);
      case 'co': return 1.0 + (Math.random() * 0.4);
      case 'no2': return 0.9 + (Math.random() * 0.5);
      case 'so2': return 0.8 + (Math.random() * 0.5);
      case 'o3': return 0.9 + (Math.random() * 0.3);
      default: return 1.0;
    }
  };
  
  // Year trend - slight increase in pollution over time for developing countries,
  // decrease for developed countries with stronger regulations
  const getYearTrend = (country: string, year: number): number => {
    // Developed countries with decreasing trends
    const developedCountries = ['United States', 'Canada', 'Germany', 'France', 'United Kingdom', 
                                'Italy', 'Japan', 'Australia', 'New Zealand', 'South Korea', 
                                'Spain', 'Portugal', 'Switzerland', 'Netherlands', 'Sweden', 
                                'Norway', 'Finland', 'Denmark', 'Austria', 'Belgium'];
                                
    // Countries with rapidly increasing pollution                            
    const rapidGrowthCountries = ['China', 'India', 'Bangladesh', 'Pakistan', 'Nigeria', 
                                  'Indonesia', 'Vietnam', 'Philippines', 'Ethiopia', 'Egypt'];
                                  
    // Base year to calculate relative change
    const baseYear = 2016;
    const yearDiff = year - baseYear;
    
    if (developedCountries.includes(country)) {
      // Developed countries see pollution decrease by ~2% per year
      return Math.max(0.7, 1 - (yearDiff * 0.02));
    } else if (rapidGrowthCountries.includes(country)) {
      // Rapid growth countries see pollution increase by ~4% per year
      return 1 + (yearDiff * 0.04);
    } else {
      // Other countries see pollution increase by ~1.5% per year
      return 1 + (yearDiff * 0.015);
    }
  };
  
  // Generate data for all countries
  Object.entries(countryCoordinates).forEach(([country, coordinates]) => {
    // Extract month number from MM-DD format
    const monthNum = parseInt(month.split('-')[0]);
    
    // Select parameter - default to pm25
    const parameter: AirQualityParameter = 'pm25';
    
    // Get the base value for this parameter
    const baseValue = baseValues[parameter] || 30;
    
    // Get the regional multiplier for this country
    const regionMultiplier = regionMultipliers[country] || regionMultipliers['default'];
    
    // Get seasonal adjustment
    const seasonalMultiplier = getSeasonalMultiplier(country, monthNum);
    
    // Get parameter-specific adjustment
    const parameterAdjustment = getParameterAdjustment(parameter, monthNum);
    
    // Get year trend adjustment
    const yearTrendAdjustment = getYearTrend(country, year);
    
    // Add randomization to create variation (+/- 20%)
    const randomFactor = 0.8 + (Math.random() * 0.4);
    
    // Calculate final value
    const value = baseValue * regionMultiplier * seasonalMultiplier * 
                  parameterAdjustment * yearTrendAdjustment * randomFactor;
    
    // Push the result
    result.push({
      country,
      coordinates,
      value: Math.round(value * 10) / 10, // Round to 1 decimal place
      parameter
    });
  });
  
  // Check if we need to add data from the real dataset too
  Object.entries(countryAirQualityData).forEach(([country, data]) => {
    // Try different month formats
    const possibleMonthFormats = [
      `${year}-${month}`, // e.g., "2020-04-30"
      `${month}`, // Just the month string as provided
    ];
    
    for (const monthFormat of possibleMonthFormats) {
      if (data[monthFormat]) {
        // Try to find if we already have this country in results
        const existingIndex = result.findIndex(r => r.country === country);
        
        if (existingIndex >= 0) {
          // Update the existing entry with real data
          result[existingIndex].value = data[monthFormat].median;
        } else if (countryCoordinates[country]) {
          // Add a new entry with real data
          result.push({
            country,
            coordinates: countryCoordinates[country],
            value: data[monthFormat].median,
            parameter: 'pm25'
          });
        }
        // Found data for this country with this month format, stop checking other formats
        break;
      }
    }
  });
  
  return result;
}

// Backward compatibility function
export function getAirQualityForMonth(month: string): {
  country: string;
  coordinates: [number, number];
  value: number;
  parameter: AirQualityParameter;
}[] {
  // Default to 2020 if no year is specified
  return getAirQualityForYearAndMonth(2020, month);
}

// Default export the air quality data
export default countryAirQualityData as AirQualityDataByCountry;