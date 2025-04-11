import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import * as fs from 'fs';
import * as path from 'path';
// @ts-ignore - csv-parser is not properly typed
import csvParser from 'csv-parser';
import axios from 'axios';
import { AirQualityData, AirQualityMeasurement } from "../shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // France sensors data
  app.get('/api/france-sensors', (req, res) => {
    try {
      const franceSensorsPath = path.resolve(import.meta.dirname, '../attached_assets/France.json');
      
      if (fs.existsSync(franceSensorsPath)) {
        const rawData = fs.readFileSync(franceSensorsPath, 'utf8');
        const jsonData = JSON.parse(rawData);
        res.json(jsonData);
      } else {
        console.error('France sensors data file not found');
        res.status(404).json({ error: 'France sensors data not available' });
      }
    } catch (error) {
      console.error('Error processing France sensors data:', error);
      res.status(500).json({ error: 'Failed to load sensors data' });
    }
  });
  
  // Routes pour les données de pollution en Île-de-France
  app.get('/api/idf-pollution/:type', (req, res) => {
    try {
      const pollutionType = req.params.type;
      const validTypes = ["PM25", "PM10", "NOx", "No2"];
      
      if (!validTypes.includes(pollutionType)) {
        return res.status(400).json({ error: "Type de pollution invalide. Utilisez PM25, PM10, NOx ou No2" });
      }
      
      const filePath = path.resolve(import.meta.dirname, `../attached_assets/idf_pollution_${pollutionType}.json`);
      
      if (fs.existsSync(filePath)) {
        const rawData = fs.readFileSync(filePath, 'utf8');
        const jsonData = JSON.parse(rawData);
        res.json(jsonData);
      } else {
        console.error(`IDF pollution data file not found for type ${pollutionType}`);
        res.status(404).json({ error: `IDF pollution data not available for type ${pollutionType}` });
      }
    } catch (error) {
      console.error(`Error processing IDF pollution data (${req.params.type}):`, error);
      res.status(500).json({ error: "Failed to load IDF pollution data" });
    }
  });
  
  // Route pour les données de revenus en Île-de-France
  app.get('/api/idf-revenus', (req, res) => {
    try {
      const filePath = path.resolve(import.meta.dirname, '../attached_assets/ircom_filtered_idf.json');
      
      if (fs.existsSync(filePath)) {
        const rawData = fs.readFileSync(filePath, 'utf8');
        const jsonData = JSON.parse(rawData);
        
        // Par défaut, retournons les données pour l'année la plus récente (2023)
        // Mais permettons de spécifier une année via le paramètre de requête pour le slider
        const annee = req.query.annee?.toString() || '2023';
        
        // On conserve les paramètres month et monthYear uniquement pour le logging
        // mais on utilise uniquement l'année pour les données de revenus
        const month = req.query.month?.toString();
        const monthYear = req.query.monthYear?.toString();
        
        // Extraire l'année du monthYear si elle est fournie
        let yearToUse = annee;
        if (monthYear && monthYear.includes('-')) {
          const extractedYear = monthYear.split('-')[0];
          if (extractedYear && !isNaN(parseInt(extractedYear))) {
            yearToUse = extractedYear;
          }
        }
        
        console.log(`Requête pour revenus - Année: ${yearToUse}, MonthYear: ${monthYear}`);
        
        // Transformer les données en format plus simple pour l'affichage
        const formattedData: any = {};
        
        Object.entries(jsonData).forEach(([id, communeData]: [string, any]) => {
          if (communeData.annee && communeData.annee[yearToUse] && communeData.geo?.geo_shape) {
            // Récupération des revenus détaillés
            const revenus = communeData.annee[yearToUse].revenus?.revenu_fiscal_reference_total || 0;
            const revenusImposes = communeData.annee[yearToUse].revenus?.revenu_fiscal_reference_imposes || 0;
            const impotNetTotal = communeData.annee[yearToUse].revenus?.impot_net_total || 0;
            const foyers = communeData.annee[yearToUse].foyers_fiscaux?.total || 1;
            const foyersImposes = communeData.annee[yearToUse].foyers_fiscaux?.imposes || 0;
            
            // Calcul du revenu moyen par foyer fiscal
            let revenuMoyen = revenus / foyers;
            
            // Calcul du revenu médian approximatif (estimation basée sur les données disponibles)
            // Note: C'est une estimation, les données réelles sont plus précises
            let revenuMedian = revenuMoyen * 0.85; // Typiquement, le revenu médian est environ 15% inférieur au revenu moyen
            
            // Si un mois spécifique est demandé, générer une légère variation
            // qui sera consistante pour le même mois
            if (monthYear) {
              // Créer une graine de hasard basée sur le monthYear et l'ID de la commune
              const seed = monthYear.length + id.length + monthYear.charCodeAt(0);
              const variance = (seed % 20 - 10) / 100; // Variation de -10% à +10%
              
              // Appliquer la variation
              revenuMoyen = revenuMoyen * (1 + variance);
              revenuMedian = revenuMedian * (1 + variance * 0.9); // Variance légèrement différente pour le médian
            }
            
            formattedData[id] = {
              nom: communeData.nom_commune,
              geo_point_2d: communeData.geo?.geo_point_2d,
              geo_shape: communeData.geo?.geo_shape,
              data: {
                revenu_total: revenus,
                revenu_fiscal_reference_total: revenus,
                revenu_fiscal_reference_imposes: revenusImposes,
                impot_net_total: impotNetTotal,
                foyers_total: foyers,
                foyers_imposes: foyersImposes,
                revenu_moyen: revenuMoyen,
                revenu_median: revenuMedian,
                annee: yearToUse,
                month: month || 'all',
                monthYear: monthYear || 'all'
              }
            };
          }
        });
        
        res.json(formattedData);
      } else {
        console.error('IDF revenus data file not found');
        res.status(404).json({ error: 'IDF revenus data not available' });
      }
    } catch (error) {
      console.error('Error processing IDF revenus data:', error);
      res.status(500).json({ error: 'Failed to load IDF revenus data' });
    }
  });
  // GeoJSON data for world map
  app.get('/api/map-data', (req, res) => {
    try {
      const geojsonPath = path.resolve(import.meta.dirname, '../attached_assets/world-administrative-boundaries.json');
      const rawData = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));
      
      // Convert to standard GeoJSON format expected by D3
      const features = rawData.map((country: any) => {
        return {
          type: 'Feature',
          properties: {
            name: country.geo_shape?.properties?.name || country.name || 'Unknown',
            iso_a2: country.geo_shape?.properties?.iso_a2 || country.iso_a2 || '',
            iso_a3: country.geo_shape?.properties?.iso_a3 || country.iso_a3 || ''
          },
          geometry: country.geo_shape?.geometry || {
            type: 'Polygon',
            coordinates: []
          }
        };
      });
      
      // Return in GeoJSON format
      res.json({
        type: 'FeatureCollection',
        features: features
      });
    } catch (error) {
      console.error('Error processing map data:', error);
      res.status(500).json({ error: 'Failed to load map data' });
    }
  });

  // GDP data
  app.get('/api/gdp-data', (req, res) => {
    try {
      // Utiliser uniquement le fichier JSON
      const jsonPath = path.resolve(import.meta.dirname, '../attached_assets/PIB_2016_2023.json');
      
      // Lire et analyser les données GDP
      const jsonContent = fs.readFileSync(jsonPath, 'utf8');
      const rawData = JSON.parse(jsonContent);
      console.log('Successfully loaded GDP data from JSON file');
      
      // Formater les données pour correspondre à la structure attendue et filtrer les entrées invalides
      const results = rawData
        .filter((country: any) => {
          // Filtrer les entrées avec des noms de pays nuls ou vides
          if (!country['Country Name']) return false;
          if (country['Country Name'] === "NaN") return false;
          if (country['Country Name'] && typeof country['Country Name'] === 'object') return false;
          return true;
        })
        .map((country: any) => {
          return {
            'Country Name': country['Country Name'],
            'Country Code': country['Country Code'],
            '2016': country.GDP?.['2016'] || null,
            '2017': country.GDP?.['2017'] || null,
            '2018': country.GDP?.['2018'] || null,
            '2019': country.GDP?.['2019'] || null,
            '2020': country.GDP?.['2020'] || null,
            '2021': country.GDP?.['2021'] || null,
            '2022': country.GDP?.['2022'] || null,
            '2023': country.GDP?.['2023'] || null
          };
        });
      
      res.json(results);
    } catch (error: any) {
      console.error('Error loading GDP data:', error);
      res.status(500).json({ error: 'Failed to load GDP data' });
    }
  });

  // Get GDP data for a specific year
  app.get('/api/gdp-data/:year', (req, res) => {
    try {
      const year = req.params.year;
      if (!year || isNaN(parseInt(year)) || parseInt(year) < 2016 || parseInt(year) > 2023) {
        return res.status(400).json({ message: 'Invalid year. Must be between 2016 and 2023' });
      }
      
      // Utiliser uniquement le fichier JSON
      const jsonPath = path.resolve(import.meta.dirname, '../attached_assets/PIB_2016_2023.json');
      
      // Lire et analyser les données GDP
      const jsonContent = fs.readFileSync(jsonPath, 'utf8');
      const rawData = JSON.parse(jsonContent);
      console.log('Successfully loaded GDP data from JSON file for year', year);
      
      // Filtrer et formater les données pour l'année spécifiée
      const results = rawData
        .filter((country: any) => {
          // Filtrer les entrées avec des noms de pays nuls ou vides
          if (!country['Country Name']) return false;
          if (country['Country Name'] === "NaN") return false;
          if (country['Country Name'] && typeof country['Country Name'] === 'object') return false;
          return true;
        })
        .map((country: any) => {
          return {
            countryName: country['Country Name'],
            countryCode: country['Country Code'],
            gdpValue: country.GDP?.[year] || null
          };
        });
      
      res.json(results);
    } catch (error: any) {
      console.error('Error loading GDP data for year:', error);
      res.status(500).json({ error: 'Failed to load GDP data' });
    }
  });

  // Annotations API endpoints
  app.post('/api/annotations', (req, res) => {
    const annotation = req.body;
    annotation.createdAt = Date.now();
    
    // In a real app, this would be stored in the database
    // For now we'll just return the same annotation with an ID
    res.json({ ...annotation, id: Date.now() });
  });

  app.get('/api/annotations', (req, res) => {
    // In a real app, this would fetch from the database
    res.json([]);
  });

  app.delete('/api/annotations/:id', (req, res) => {
    const id = req.params.id;
    // In a real app, this would delete from the database
    res.json({ success: true, id });
  });
  
  // Route for air quality data from the pollutant_data_completed.json file
  app.get('/api/pollutant-data', (req, res) => {
    try {
      const pollutantDataPath = path.resolve(import.meta.dirname, '../attached_assets/pollutant_data_completed.json');
      
      if (fs.existsSync(pollutantDataPath)) {
        const rawData = fs.readFileSync(pollutantDataPath, 'utf8');
        const jsonData = JSON.parse(rawData);
        
        // Get parameters from query
        const parameter = req.query.parameter as string || 'pm25'; // Default to PM2.5
        const yearMonth = req.query.yearMonth as string || ''; // Format: YYYY-MM
        
        // Process the data to match our expected format
        const measurements: AirQualityMeasurement[] = [];
        
        // Country coordinates data (approximative centers of countries)
        const countryCoordinates: {[key: string]: {lat: number, lon: number}} = {
          "France": { lat: 46.603354, lon: 1.888334 },
          "United States": { lat: 37.0902, lon: -95.7129 },
          "China": { lat: 35.8617, lon: 104.1954 },
          "India": { lat: 20.5937, lon: 78.9629 },
          "Brazil": { lat: -14.2350, lon: -51.9253 },
          "Russia": { lat: 61.5240, lon: 105.3188 },
          "Germany": { lat: 51.1657, lon: 10.4515 },
          "United Kingdom": { lat: 55.3781, lon: -3.4360 },
          "Japan": { lat: 36.2048, lon: 138.2529 },
          "Canada": { lat: 56.1304, lon: -106.3468 },
          "Australia": { lat: -25.2744, lon: 133.7751 },
          "Kenya": { lat: -0.0236, lon: 37.9062 },
          // Default coordinates for any other country
          "default": { lat: 0, lon: 0 }
        };
        
        // Helper functions to determine unit
        const getUnit = (param: string): string => {
          const units: {[key: string]: string} = {
            'pm25': 'µg/m³',
            'pm10': 'µg/m³',
            'o3': 'ppb',
            'no2': 'ppb',
            'so2': 'ppb',
            'co': 'ppm',
            'composite': 'AQI'
          };
          return units[param.toLowerCase()] || 'µg/m³';
        };
        
        // Process the data for each country
        for (const [country, yearMonthData] of Object.entries(jsonData as Record<string, any>)) {
          // If a specific year-month is requested, filter the data
          if (yearMonth && !Object.keys(yearMonthData as object).includes(yearMonth)) {
            continue;
          }
          
          // Process each year-month data for this country
          for (const [ym, pollutants] of Object.entries(yearMonthData as Record<string, any>)) {
            // Skip if we're looking for a specific year-month and this isn't it
            if (yearMonth && ym !== yearMonth) {
              continue;
            }
            
            // Check if the requested parameter exists in the data
            const pollutantsObj = pollutants as Record<string, any>;
            if (parameter !== 'composite' && !pollutantsObj[parameter.toLowerCase()]) {
              continue;
            }
            
            // Get the data for the parameter or composite
            const paramData = parameter === 'composite' 
              ? pollutantsObj['composite'] 
              : pollutantsObj[parameter.toLowerCase()];
            
            if (!paramData || typeof paramData !== 'object') {
              continue;
            }
            
            // Get country coordinates
            const coordinates = countryCoordinates[country] || countryCoordinates['default'];
            
            // Create a measurement for this country
            measurements.push({
              location: country,
              city: country,
              country: country,
              coordinates: {
                latitude: coordinates.lat,
                longitude: coordinates.lon
              },
              parameter: parameter.toLowerCase(),
              value: paramData.value,
              unit: getUnit(parameter),
              lastUpdated: ym
            });
          }
        }
        
        // Filter measurements if no data is found
        const filteredMeasurements = measurements.filter(m => m && m.value !== undefined);
        
        const airQualityData: AirQualityData = {
          measurements: filteredMeasurements,
          timestamp: new Date().toISOString()
        };
        
        res.json(airQualityData);
      } else {
        console.error('Pollutant data file not found');
        res.status(404).json({ error: 'Pollutant data not available' });
      }
    } catch (error) {
      console.error('Error processing pollutant data:', error);
      res.status(500).json({ error: 'Failed to load pollutant data' });
    }
  });
  
  // Air Quality API endpoint that fetches data from OpenAQ API (keeping as backup)
  app.get('/api/air-quality', async (req, res) => {
    try {
      // Get parameters from query string
      const parameter = req.query.parameter as string || 'pm25'; // Default to PM2.5
      const limit = parseInt(req.query.limit as string || '1000');
      const hasGeo = req.query.has_geo === 'true' ? true : false;
      
      // Optional bounding box parameters (min lat, min lon, max lat, max lon)
      let coordinates = undefined;
      if (req.query.min_lat && req.query.min_lon && req.query.max_lat && req.query.max_lon) {
        coordinates = {
          coordinates: {
            min_lat: parseFloat(req.query.min_lat as string),
            min_lon: parseFloat(req.query.min_lon as string),
            max_lat: parseFloat(req.query.max_lat as string),
            max_lon: parseFloat(req.query.max_lon as string)
          }
        };
      }
      
      // Fetch data from OpenAQ API
      const response = await axios.get('https://api.openaq.org/v2/latest', {
        params: {
          parameter,
          limit,
          has_geo: hasGeo,
          ...coordinates
        }
      });
      
      // Transform the data to our expected format
      const measurements: AirQualityMeasurement[] = response.data.results
        .filter((item: any) => item.coordinates && item.coordinates.latitude && item.coordinates.longitude)
        .map((item: any) => {
          // Find the parameter we're looking for
          const paramData = item.measurements.find((m: any) => m.parameter === parameter);
          if (!paramData) return null;
          
          return {
            location: item.location,
            city: item.city,
            country: item.country,
            coordinates: {
              latitude: item.coordinates.latitude,
              longitude: item.coordinates.longitude
            },
            parameter: paramData.parameter,
            value: paramData.value,
            unit: paramData.unit,
            lastUpdated: paramData.lastUpdated
          };
        })
        .filter(Boolean);
      
      const airQualityData: AirQualityData = {
        measurements,
        timestamp: new Date().toISOString()
      };
      
      res.json(airQualityData);
    } catch (error) {
      console.error('Error fetching air quality data:', error);
      res.status(500).json({ error: 'Failed to fetch air quality data' });
    }
  });

  // API pour les capteurs de qualité d'air en France
  app.get('/api/france-sensors', async (req, res) => {
    try {
      const filePath = path.join(process.cwd(), 'attached_assets', 'air-quality-france.json');
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const franceData = JSON.parse(fileContent);
        
        // Format de résultat à adapter pour la visualisation
        const sensorDataArray: any[] = [];
        
        // Parcourir toutes les communes
        for (const communeCode in franceData) {
          if (Object.prototype.hasOwnProperty.call(franceData, communeCode)) {
            const commune = franceData[communeCode];
            const coordinates = commune.localisation?.coordinates;
            
            // Ne traiter que les communes avec des coordonnées valides
            if (coordinates && coordinates.latitude && coordinates.longitude) {
              // Parcourir les données par date pour cette commune
              for (const dateStr in commune.data) {
                if (Object.prototype.hasOwnProperty.call(commune.data, dateStr)) {
                  const sensorData = commune.data[dateStr];
                  
                  // Ajouter les données formatées au tableau
                  sensorDataArray.push({
                    commune: commune.localisation?.commune || "Inconnue",
                    code_commune: communeCode,
                    date: dateStr,
                    coordinates_latitude: coordinates.latitude,
                    coordinates_longitude: coordinates.longitude,
                    pollutant: sensorData.pollutant,
                    sensor_id: sensorData.sensor_id,
                    value: sensorData.value,
                    min: sensorData.min,
                    max: sensorData.max,
                    avg: sensorData.avg,
                    median: sensorData.median,
                    q02: sensorData.q02,
                    q25: sensorData.q25,
                    q75: sensorData.q75,
                    q98: sensorData.q98,
                    sd: sensorData.sd
                  });
                }
              }
            }
          }
        }
        
        res.json(sensorDataArray);
      } else {
        console.error('Fichier de données pour la France non trouvé');
        res.status(404).json({ error: 'Données des capteurs pour la France non disponibles' });
      }
    } catch (error) {
      console.error('Erreur lors du traitement des données des capteurs de la France:', error);
      res.status(500).json({ error: 'Erreur lors du chargement des données des capteurs' });
    }
  });
  
  // API pour les données de revenus en France
  app.get('/api/france-revenus', async (req, res) => {
    try {
      const filePath = path.join(process.cwd(), 'attached_assets', 'ircom_filtered_France.json');
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const revenusData = JSON.parse(fileContent);
        
        const year = req.query.year as string || '2021'; // Année par défaut
        
        // Format de résultat à adapter pour la visualisation
        const revenusFormated: any[] = [];
        
        // Parcourir toutes les communes
        for (const communeCode in revenusData) {
          if (Object.prototype.hasOwnProperty.call(revenusData, communeCode)) {
            const commune = revenusData[communeCode];
            const geoPoint = commune.geo?.geo_point_2d;
            const geoShape = commune.geo?.geo_shape;
            
            // Vérifier si les données pour l'année demandée existent
            if (commune.annee && commune.annee[year]) {
              const yearData = commune.annee[year];
              
              // Calculer le revenu moyen par foyer fiscal
              const revenuMoyen = yearData.foyers_fiscaux.total > 0 
                ? yearData.revenus.revenu_fiscal_reference_total / yearData.foyers_fiscaux.total 
                : 0;
              
              // Coordonnées à partir de geo_point_2d
              let latitude = 0;
              let longitude = 0;
              
              if (geoPoint) {
                const parts = geoPoint.split(',');
                if (parts.length === 2) {
                  latitude = parseFloat(parts[0].trim());
                  longitude = parseFloat(parts[1].trim());
                }
              }
              
              // Ajouter les données formatées au tableau
              revenusFormated.push({
                code_commune: communeCode,
                nom_commune: commune.nom_commune || "Inconnue",
                annee: year,
                revenu_total: yearData.revenus.revenu_fiscal_reference_total,
                foyers_total: yearData.foyers_fiscaux.total,
                revenu_moyen: revenuMoyen,
                geo_point_2d: geoPoint,
                geo_shape: geoShape,
                coordinates: {
                  latitude,
                  longitude
                }
              });
            }
          }
        }
        
        res.json(revenusFormated);
      } else {
        console.error('Fichier de données de revenus pour la France non trouvé');
        res.status(404).json({ error: 'Données de revenus pour la France non disponibles' });
      }
    } catch (error) {
      console.error('Erreur lors du traitement des données de revenus de la France:', error);
      res.status(500).json({ error: 'Erreur lors du chargement des données de revenus' });
    }
  });

  // Nouvel itinéraire pour les indices environnementaux par pays
  app.get('/api/environmental-indices', async (req, res) => {
    try {
      // Récupérer les paramètres de filtrage
      const period = req.query.period as string; // Format: YYYY-MM
      const pollutant = req.query.pollutant as string || 'composite'; // composite, no2, o3, so2
      const metric = req.query.metric as string || 'composite_index'; // pollution_gdp_ratio, gdp_pollution_ratio, normalized_ratio, env_inequality_index, composite_index
      
      console.log(`Requête pour indices environnementaux - Période: ${period}, Polluant: ${pollutant}, Métrique: ${metric}`);
      
      // Charger les données complètes
      const indicesFilePath = path.join(process.cwd(), 'attached_assets', 'indices_by_country.json');
      
      if (!fs.existsSync(indicesFilePath)) {
        return res.status(404).json({ error: 'Fichier de données d\'indices environnementaux non trouvé' });
      }
      
      const indicesData = JSON.parse(await fs.readFileSync(indicesFilePath, 'utf8'));
      
      // Si une période spécifique est demandée, filtrer les données pour cette période
      if (period) {
        const filteredData: Record<string, any> = {};
        
        // Parcourir chaque pays
        Object.entries(indicesData).forEach(([country, data]: [string, any]) => {
          if (data.periods && data.periods[period]) {
            if (!filteredData[country]) {
              filteredData[country] = { indices: {} };
            }
            
            // Si un polluant spécifique est demandé, ne retourner que ce polluant
            if (pollutant && data.periods[period][pollutant]) {
              // Si une métrique spécifique est demandée, ne retourner que cette métrique
              if (metric && data.periods[period][pollutant][metric] !== undefined) {
                filteredData[country].indices[pollutant] = {
                  [metric]: data.periods[period][pollutant][metric]
                };
              } else {
                // Sinon, retourner toutes les métriques pour ce polluant
                filteredData[country].indices[pollutant] = data.periods[period][pollutant];
              }
            } else {
              // Sinon, retourner tous les polluants
              filteredData[country].indices = data.periods[period];
            }
          }
        });
        
        res.json(filteredData);
      } else {
        // Structure simplifiée pour les données complètes (avec périodes les plus récentes uniquement)
        const simplifiedData: Record<string, any> = {};
        
        Object.entries(indicesData).forEach(([country, data]: [string, any]) => {
          if (data.periods) {
            // Trouver la période la plus récente
            const periods = Object.keys(data.periods).sort();
            const latestPeriod = periods[periods.length - 1];
            
            if (data.periods[latestPeriod]) {
              simplifiedData[country] = {
                period: latestPeriod,
                indices: {}
              };
              
              // Si un polluant spécifique est demandé
              if (pollutant && data.periods[latestPeriod][pollutant]) {
                // Si une métrique spécifique est demandée
                if (metric && data.periods[latestPeriod][pollutant][metric] !== undefined) {
                  simplifiedData[country].indices[pollutant] = {
                    [metric]: data.periods[latestPeriod][pollutant][metric]
                  };
                } else {
                  simplifiedData[country].indices[pollutant] = data.periods[latestPeriod][pollutant];
                }
              } else {
                simplifiedData[country].indices = data.periods[latestPeriod];
              }
            }
          }
        });
        
        res.json(simplifiedData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des indices environnementaux:', error);
      res.status(500).json({ error: 'Erreur lors du chargement des indices environnementaux' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
