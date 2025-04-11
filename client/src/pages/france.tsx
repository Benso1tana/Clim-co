import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, GeoJSON, Circle } from 'react-leaflet';
import { Feature, Geometry } from 'geojson';
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { t } from "@/lib/i18n";
import { Link } from "wouter";
import { AirQualityParameter, parameterInfo } from "@/hooks/use-air-quality-data";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Correction pour l'icône Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix pour les icônes Leaflet par défaut
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Types pour les données des capteurs de qualité d'air
interface SensorData {
  date: string;
  value: number;
  min: number; // [cite: 7]
  q02: number;
  q25: number;
  median: number;
  q75: number;
  q98: number;
  max: number;
  avg: number;
  sd: number;
  commune: string;
  sensor_id: number; // [cite: 8]
  pollutant: string;
  commune_originale: string;
  coordinates_latitude: number;
  coordinates_longitude: number;
} // [cite: 9]

// Interface pour les données IDF (Île-de-France) de pollution
interface IDFCommuneData {
  mean: number;
  min: number;
  max: number;
  median: number;
  q1: number;
  q3: number; // [cite: 10]
  count: number;
}

interface GeoJSONGeometry {
  type: string;
  coordinates: number[] | number[][] | number[][][] | number[][][][];
} // [cite: 11]

interface IDFCommune {
  nom: string;
  geo_point_2d: string;
  geo_shape: string; // GeoJSON string
  data: {
    [monthYear: string]: IDFCommuneData; // Keyed by "YYYY-MM"
  }
} // [cite: 12]

// Interface pour les données de revenus IDF
interface IDFRevenusCommuneData {
    revenu_total: number;
    foyers_total: number;
    revenu_moyen: number; // [cite: 13]
    revenu_median?: number;
    revenu_fiscal_reference_total?: number;
    revenu_fiscal_reference_imposes?: number;
    impot_net_total?: number;
    foyers_imposes?: number;
    annee: string;
}

interface IDFRevenusCommune {
  nom: string;
  geo_point_2d: string;
  geo_shape: string; // GeoJSON string
  data: IDFRevenusCommuneData;
}

// Interface générique pour une feature GeoJSON
interface GeoJSONFeature {
  type: 'Feature';
  properties: {
    name: string;
    id: string; // Commune ID
    value: number; // Pollution mean or revenu moyen
    // Add other properties if needed
  }; // [cite: 14]
  geometry: GeoJSONGeometry;
}

// Type compatible avec la bibliothèque react-leaflet
type LeafletFeature = Feature<Geometry, any>;

// Type pour l'ensemble des données de pollution IDF
interface IDFPollutionData {
  [communeId: string]: IDFCommune;
} // [cite: 15]

// Type pour l'ensemble des données de revenus IDF
interface IDFRevenusData {
    [communeId: string]: IDFRevenusCommune;
}


// --- Helper Components & Functions ---

// Composant qui centre la carte
function SetMapView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => { // [cite: 16]
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
} // [cite: 17]

// Fonction pour obtenir la couleur en fonction de la valeur de la qualité de l'air (capteurs et communes IDF)
function getPollutionColor(value: number, pollutant: string): string {
  const parameter = pollutant.toLowerCase() as AirQualityParameter;
  const thresholds = parameterInfo[parameter]?.thresholds || parameterInfo.pm25.thresholds;

  if (value > thresholds.high) return "rgba(255, 32, 64, 0.6)";
  if (value > thresholds.medium) return "rgba(255, 128, 0, 0.6)";
  if (value > thresholds.low) return "rgba(240, 208, 0, 0.6)";
  return "rgba(0, 204, 102, 0.3)";
}

// Fonction pour obtenir la couleur en fonction du revenu moyen
function getRevenusColor(revenuMoyen: number): string {
  // Échelle de couleurs bleues pour les revenus (bleu foncé = plus riches, bleu clair = moins riches)
  if (revenuMoyen > 50000) return "#1E40AF"; // Bleu très foncé [cite: 24]
  if (revenuMoyen > 40000) return "#1D4ED8"; // Bleu foncé [cite: 25]
  if (revenuMoyen > 30000) return "#3B82F6"; // Bleu moyen [cite: 26]
  if (revenuMoyen > 20000) return "#60A5FA"; // Bleu clair [cite: 27]
  return "#93C5FD"; // Bleu très clair [cite: 28]
}

// Fonction pour obtenir le pattern ID en fonction du revenu moyen
 function getRevenusPatternId(revenuMoyen: number): string {
   if (revenuMoyen > 50000) return "pattern-revenue-high";
   if (revenuMoyen > 40000) return "pattern-revenue-medium-high";
   if (revenuMoyen > 30000) return "pattern-revenue-medium";
   if (revenuMoyen > 20000) return "pattern-revenue-low-medium";
   return "pattern-revenue-low";
 }


// Fonction pour obtenir le rayon du cercle de chaleur (capteurs France)
function getHeatCircleRadius(value: number, pollutant: string): number {
  const parameter = pollutant.toLowerCase() as AirQualityParameter;
  const thresholds = parameterInfo[parameter]?.thresholds || parameterInfo.pm25.thresholds; // [cite: 29]
  const baseRadius = 10000; // Rayon de base en mètres (10km) [cite: 29]

  if (value > thresholds.high) return baseRadius * 2; // [cite: 30, 31]
  if (value > thresholds.medium) return baseRadius * 1.5; // [cite: 31, 32]
  return baseRadius; // [cite: 32]
}

// Fonction pour obtenir l'opacité du cercle de chaleur (capteurs France)
function getHeatCircleOpacity(value: number, pollutant: string): number {
  const parameter = pollutant.toLowerCase() as AirQualityParameter;
  const thresholds = parameterInfo[parameter]?.thresholds || parameterInfo.pm25.thresholds; // [cite: 33]

  if (value > thresholds.high) return 0.05; // Rouge plus transparent
  if (value > thresholds.medium) return 0.04; // Orange plus transparent
  if (value > thresholds.low) return 0.03; // Jaune plus transparent
  return 0.02; // Vert plus transparent
}

// Icône personnalisée pour les marqueurs (capteurs France et points IDF)
function createMarkerIcon(value: number, pollutant: string) {
  const color = getPollutionColor(value, pollutant);
  // Calcul d'une taille variable en fonction de la valeur (plus la pollution est élevée, plus le marqueur est grand)
  const parameter = pollutant.toLowerCase() as AirQualityParameter;
  const thresholds = parameterInfo[parameter]?.thresholds || parameterInfo.pm25.thresholds;
  
  // Détermination de la taille en fonction du niveau de pollution
  let size = 18; // Taille de base
  if (value > thresholds.high) size = 24;
  else if (value > thresholds.medium) size = 22;
  else if (value > thresholds.low) size = 20;
  
  const borderSize = Math.max(3, Math.round(size / 6));
  const shadowSize = Math.max(5, Math.round(size / 4));
  
  return L.divIcon({
    className: "sensor-marker",
    html: `<div style="
      background-color: ${color}; 
      width: ${size}px; 
      height: ${size}px; 
      border-radius: 50%; 
      border: ${borderSize}px solid white; 
      box-shadow: 0 0 ${shadowSize}px rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
    "></div>`,
    iconSize: [size + (2 * borderSize), size + (2 * borderSize)],
    iconAnchor: [(size + (2 * borderSize))/2, (size + (2 * borderSize))/2],
  });
}

// Fonction pour formatter le mois/année "YYYY-MM" en "Mois Année"
function formatMonthYear(monthYearStr: string): string {
  if (!monthYearStr || typeof monthYearStr !== 'string') return monthYearStr;
  const parts = monthYearStr.split('-');
  if (parts.length !== 2) return monthYearStr; // [cite: 39]

  const months = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];
  const monthIndex = parseInt(parts[1], 10) - 1; // [cite: 40]
  const year = parts[0]; // [cite: 40]

  if (monthIndex >= 0 && monthIndex < 12) {
    return `${months[monthIndex]} ${year}`; // [cite: 41]
  }
  return monthYearStr; // Retourne l'original si le mois est invalide
}

// --- Main Component ---

export default function FrancePage() { // [cite: 41]
  // États pour les données générales de la France (Capteurs)
  const [sensorData, setSensorData] = useState<SensorData[]>([]); // [cite: 41]
  const [franceSensorData, setFranceSensorData] = useState<any[]>([]); // Nouveaux capteurs
  const [franceRevenusData, setFranceRevenusData] = useState<any[]>([]); // Nouvelles données de revenus
  const [isLoadingFrance, setIsLoadingFrance] = useState(true); // [cite: 42] Renommé pour clarté
  const [selectedParameter, setSelectedParameter] = useState<string>("pm25"); // [cite: 42]
  const [selectedPollutantFrance, setSelectedPollutantFrance] = useState<string>("pm10"); // Pour les nouveaux capteurs
  const [selectedDate, setSelectedDate] = useState<string>(""); // [cite: 42]
  const [availableDates, setAvailableDates] = useState<string[]>([]); // [cite: 42]
  const [dateIndex, setDateIndex] = useState<number>(0); // [cite: 43]
  const [selectedYear, setSelectedYear] = useState<string>("2021"); // Année pour les revenus en France

  // États pour les données de l'Île-de-France (Pollution et Revenus)
  const [idfPollutionData, setIdfPollutionData] = useState<IDFPollutionData | null>(null); // [cite: 43] Renommé
  const [idfRevenusData, setIdfRevenusData] = useState<IDFRevenusData | null>(null); // [cite: 44] Type ajusté
  const [isLoadingIdf, setIsLoadingIdf] = useState(true); // [cite: 44] Renommé
  const [selectedIdfPollutant, setSelectedIdfPollutant] = useState<string>("PM25"); // [cite: 44]
  // Nouvel état pour contrôler l'affichage de la superposition des revenus
  const [showRevenueOverlay, setShowRevenueOverlay] = useState<boolean>(true); // Default to true?
  const [selectedIdfMonthYear, setSelectedIdfMonthYear] = useState<string>(""); // [cite: 45] Pour la pollution
  const [availableIdfMonthYears, setAvailableIdfMonthYears] = useState<string[]>([]); // [cite: 45]
  const [idfMonthYearIndex, setIdfMonthYearIndex] = useState<number>(0); // [cite: 46]
  const [selectedIdfRevenuAnnee, setSelectedIdfRevenuAnnee] = useState<string>("2021"); // [cite: 46] Année par défaut pour les revenus

  // Centres des cartes
  const franceCenter: [number, number] = [46.603354, 1.888334]; // [cite: 47]
  const idfCenter: [number, number] = [48.8566, 2.3522]; // [cite: 48]

  // Chargement des données des capteurs pour la France (Onglet France, ancienne méthode)
  useEffect(() => { // [cite: 49]
    async function loadFranceSensorData() {
      try {
        setIsLoadingFrance(true);
        const response = await fetch("/api/france-sensors"); // [cite: 49]
        const data: SensorData[] = await response.json(); // [cite: 49]
        setSensorData(data); // [cite: 50]

        // Extraire et trier les dates uniques (dernier jour de chaque mois)
        const monthMap: Record<string, string> = {};
        data.forEach((sensor) => {
          const datePart = sensor.date.split(' ')[0];
          try {
            const date = new Date(datePart);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // [cite: 51] Format YYYY-MM
            if (!monthMap[monthKey] || date > new Date(monthMap[monthKey])) {
              monthMap[monthKey] = datePart; // [cite: 51]
            }
          } catch (e) {
            // console.warn(`Invalid date format found: ${datePart}`);
          }
        });

        const dates = Object.values(monthMap).sort((a, b) => new Date(a).getTime() - new Date(b).getTime()); // [cite: 52]
        setAvailableDates(dates); // [cite: 53]

        if (dates.length > 0) {
          const latestDateIndex = dates.length -1;
          setSelectedDate(dates[latestDateIndex]); // Default to latest date
          setDateIndex(latestDateIndex); // [cite: 53]
        } else {
            setSelectedDate("");
            setDateIndex(0);
        } // [cite: 54]
      } catch (error) {
        console.error("Erreur lors du chargement des données des capteurs France:", error); // [cite: 54]
        setSensorData([]);
        setAvailableDates([]);
      } finally {
        setIsLoadingFrance(false); // [cite: 55, 56]
      }
    }
    loadFranceSensorData();
  }, []);
  
  // Chargement des nouvelles données de capteurs de qualité d'air en France
  useEffect(() => {
    async function loadNewSensorData() {
      try {
        const response = await fetch("/api/france-sensors");
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Filtrer les données par polluant sélectionné et supprimer les doublons par commune
        const filteredData = data.filter((sensor: any) => 
          sensor.pollutant && sensor.pollutant.toLowerCase() === selectedPollutantFrance.toLowerCase()
        );
        
        // Créer un Map pour regrouper par commune et date (prendre le plus récent)
        const communeMap = new Map();
        
        filteredData.forEach((sensor: any) => {
          const key = `${sensor.code_commune}-${sensor.date}`;
          if (!communeMap.has(key) || new Date(sensor.date) > new Date(communeMap.get(key).date)) {
            communeMap.set(key, sensor);
          }
        });
        
        // Convertir le Map en tableau
        const sensorsArray = Array.from(communeMap.values());
        
        setFranceSensorData(sensorsArray);
        console.log(`Chargé ${sensorsArray.length} capteurs pour le polluant ${selectedPollutantFrance}`);
      } catch (error) {
        console.error("Erreur lors du chargement des données des capteurs:", error);
        setFranceSensorData([]);
      }
    }
    
    loadNewSensorData();
  }, [selectedPollutantFrance]); // Recharger si le polluant change
  
  // Chargement des données de revenus pour la France, lié à la date des capteurs
  useEffect(() => {
    async function loadRevenusData() {
      try {
        // Extraire l'année de la date des capteurs si disponible
        let yearToUse = selectedYear;
        
        // Si une date est sélectionnée pour les capteurs, utiliser cette année à la place
        if (selectedDate) {
          const selectedDateObj = new Date(selectedDate);
          if (!isNaN(selectedDateObj.getTime())) {
            yearToUse = selectedDateObj.getFullYear().toString();
          }
        }
        
        const response = await fetch(`/api/france-revenus?year=${yearToUse}`);
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        setFranceRevenusData(data);
        console.log(`Chargé ${data.length} communes avec données de revenus pour ${yearToUse} (depuis ${selectedDate || 'paramètre par défaut'})`);
      } catch (error) {
        console.error("Erreur lors du chargement des données de revenus:", error);
        setFranceRevenusData([]);
      }
    }
    
    loadRevenusData();
  }, [selectedDate, selectedYear]); // Recharger si la date des capteurs ou l'année explicite change

  // Chargement des données de pollution ET de revenus pour l'Île-de-France (Onglet IDF)
  useEffect(() => { // [cite: 57, 60] Combinaison des chargements pour l'overlay
    async function loadIdfData() {
      setIsLoadingIdf(true);
      let pollutionDataLoaded: IDFPollutionData | null = null;
      let revenusDataLoaded: IDFRevenusData | null = null;
      let monthYears: string[] = [];

      // --- Charger les données de pollution ---
      try {
        const pollutionResponse = await fetch(`/api/idf-pollution/${selectedIdfPollutant}`); // [cite: 61]
        pollutionDataLoaded = await pollutionResponse.json(); // [cite: 61]

        if (!pollutionDataLoaded || Object.keys(pollutionDataLoaded).length === 0) {
          console.error(`Aucune donnée de pollution disponible pour ${selectedIdfPollutant}`); // [cite: 62]
          pollutionDataLoaded = null;
        } else {
          // Validation et extraction des dates disponibles (simplifié)
          const communeWithData = Object.values(pollutionDataLoaded).find((commune: IDFCommune) =>
            commune.data && Object.keys(commune.data).length > 0
          ) as IDFCommune | undefined; // [cite: 69, 70]

          if (communeWithData?.data) {
            monthYears = Object.keys(communeWithData.data).sort((a, b) => { // [cite: 70]
              const [yearA, monthA] = a.split('-').map(Number);
              const [yearB, monthB] = b.split('-').map(Number);
              if (yearA !== yearB) return yearA - yearB; // [cite: 71]
              return monthA - monthB; // [cite: 71]
            });
            setAvailableIdfMonthYears(monthYears); // [cite: 72]
            if (monthYears.length > 0) {
              // Si selectedIdfMonthYear n'est pas déjà défini ou n'est plus valide, prendre le dernier
              if (!selectedIdfMonthYear || !monthYears.includes(selectedIdfMonthYear)) {
                 const lastMonthYearIndex = monthYears.length - 1;
                 setSelectedIdfMonthYear(monthYears[lastMonthYearIndex]); // [cite: 73]
                 setIdfMonthYearIndex(lastMonthYearIndex); // [cite: 73]
              } else {
                 // Assurer que l'index correspond à la date sélectionnée
                 setIdfMonthYearIndex(monthYears.indexOf(selectedIdfMonthYear));
              }
            } else {
                setAvailableIdfMonthYears([]); // [cite: 73, 74]
                setSelectedIdfMonthYear(""); // [cite: 74]
                setIdfMonthYearIndex(0); // [cite: 74]
            }
          } else {
              setAvailableIdfMonthYears([]); // [cite: 73, 74]
              setSelectedIdfMonthYear(""); // [cite: 74]
              setIdfMonthYearIndex(0); // [cite: 74]
          }
        }
      } catch (error) {
        console.error(`Erreur lors du chargement des données de pollution IDF (${selectedIdfPollutant}):`, error); // [cite: 75]
        pollutionDataLoaded = null;
        setAvailableIdfMonthYears([]); // [cite: 75]
        setSelectedIdfMonthYear(""); // [cite: 75]
        setIdfMonthYearIndex(0); // [cite: 75]
      }

      // --- Charger les données de revenus ---
      try {
        // Inclure le monthYear actuel pour synchroniser les données de pollution et revenus
        const monthYearParam = selectedIdfMonthYear ? `&monthYear=${selectedIdfMonthYear}` : '';
        const revenusResponse = await fetch(`/api/idf-revenus?annee=${selectedIdfRevenuAnnee}${monthYearParam}`);
        revenusDataLoaded = await revenusResponse.json();
        
        if (!revenusDataLoaded || Object.keys(revenusDataLoaded).length === 0) {
          console.error(`Aucune donnée de revenus disponible pour ${selectedIdfRevenuAnnee}`);
          revenusDataLoaded = null;
        }
      } catch (error) {
        console.error(`Erreur lors du chargement des données de revenus IDF (${selectedIdfRevenuAnnee}):`, error);
        revenusDataLoaded = null;
      }

      // --- Mettre à jour les états ---
      setIdfPollutionData(pollutionDataLoaded);
      setIdfRevenusData(revenusDataLoaded);
      setIsLoadingIdf(false); // [cite: 76, 59] (combiné)

    }

    loadIdfData();
  // Dépendances : recharger si le polluant ou l'année de revenu changent
  }, [selectedIdfPollutant, selectedIdfRevenuAnnee]); // selectedIdfMonthYear est géré par l'index

  // Mise à jour de la date sélectionnée via l'index (France)
  useEffect(() => { // [cite: 78]
    if (availableDates.length > 0 && dateIndex >= 0 && dateIndex < availableDates.length) {
      setSelectedDate(availableDates[dateIndex]); // [cite: 78]
    }
  }, [dateIndex, availableDates]); // [cite: 78]

  // Mise à jour du mois/année sélectionné via l'index (IDF Pollution)
  useEffect(() => { // [cite: 79]
    if (availableIdfMonthYears.length > 0 && idfMonthYearIndex >= 0 && idfMonthYearIndex < availableIdfMonthYears.length) {
      setSelectedIdfMonthYear(availableIdfMonthYears[idfMonthYearIndex]); // [cite: 79]
    }
  }, [idfMonthYearIndex, availableIdfMonthYears]); // [cite: 79]

  // Mise à jour des données de revenus lorsque le mois/année change
  useEffect(() => {
    if (selectedIdfMonthYear && showRevenueOverlay) {
      // Extraire uniquement l'année du mois sélectionné pour les données de revenus
      const yearFromMonthYear = selectedIdfMonthYear.split('-')[0];
      
      // Charger à nouveau les données de revenus avec l'année extraite du mois actuel
      const updateRevenusData = async () => {
        try {
          // Utiliser l'année extraite du mois sélectionné comme paramètre principal
          const revenusResponse = await fetch(`/api/idf-revenus?annee=${yearFromMonthYear}`);
          
          if (!revenusResponse.ok) {
            throw new Error('Échec du chargement des données de revenus');
          }
          
          const newData = await revenusResponse.json();
          setIdfRevenusData(newData);
          console.log(`Données de revenus mises à jour pour l'année: ${yearFromMonthYear} (mois: ${selectedIdfMonthYear})`);
        } catch (error) {
          console.error('Erreur lors de la mise à jour des données de revenus:', error);
        }
      };
      
      updateRevenusData();
    }
  }, [selectedIdfMonthYear, showRevenueOverlay]);

  // --- Filtrage et Préparation des Données pour l'Affichage ---

  // Données filtrées pour les capteurs France
  const filteredSensorsFrance = sensorData.filter(sensor =>
    sensor.pollutant.toLowerCase() === selectedParameter.toLowerCase() && // [cite: 80]
    sensor.coordinates_latitude &&
    sensor.coordinates_longitude &&
    !isNaN(sensor.coordinates_latitude) &&
    !isNaN(sensor.coordinates_longitude) &&
    (selectedDate ? sensor.date.startsWith(selectedDate) : true) // [cite: 81]
  );

  // Préparer les Features GeoJSON pour IDF (Pollution et Revenus)
  // Fait à l'intérieur du rendu pour utiliser les états les plus récents (selectedIdfMonthYear)

  // --- Gestionnaires d'événements pour Popups (IDF) ---
  const onEachIdfFeature = (feature: LeafletFeature, layer: L.Layer) => {
    const communeId = feature.properties.id;
    const communeName = feature.properties.name;
    
    // Utiliser un gestionnaire d'événement pour la mise à jour du contenu à chaque ouverture
    layer.on('popupopen', function(e) {
      // Récupérer le popup ouvert
      const popup = e.popup;
      
      // Récupérer les données les plus à jour à chaque ouverture du popup
      const pollutionCommune = idfPollutionData?.[communeId];
      const pollutionDataForMonth = pollutionCommune?.data?.[selectedIdfMonthYear];
      const revenusCommune = idfRevenusData?.[communeId];
      const revenusDataForYear = revenusCommune?.data;
      
      let popupContent = `<div class="idf-popup p-2 min-w-[200px]"><h3 class="font-bold text-blue-800">${communeName}</h3><div class="text-sm mt-2">`;

      // Afficher les données de pollution si disponibles
      if (pollutionDataForMonth) {
        const unitText = parameterInfo[selectedIdfPollutant.toLowerCase() as AirQualityParameter]?.unit || "μg/m³";
        popupContent += `
          <div class="bg-green-50 p-2 rounded-md">
            <div class="flex items-center">
              <span class="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
              <span class="font-medium">${selectedIdfPollutant}:</span>
              <span class="font-bold ml-1">${pollutionDataForMonth.mean.toFixed(1)}</span> 
              <span class="text-xs ml-1">${unitText}</span>
            </div>
            <div class="text-xs mt-1 text-gray-600">(${formatMonthYear(selectedIdfMonthYear)})</div>
            <div class="mt-1 text-xs">
              <span class="text-gray-600">${t("Min")}:</span> ${pollutionDataForMonth.min.toFixed(1)} | 
              <span class="text-gray-600">${t("Max")}:</span> ${pollutionDataForMonth.max.toFixed(1)} | 
              <span class="text-gray-600">${t("Median")}:</span> ${pollutionDataForMonth.median.toFixed(1)}
            </div>
          </div>
        `;
      }

      // Afficher les données de revenus si disponibles
      if (revenusDataForYear) {
        // Formater les valeurs monétaires
        const formattedRevenuMoyen = revenusDataForYear.revenu_moyen.toLocaleString('fr-FR', { 
          style: 'currency', 
          currency: 'EUR', 
          maximumFractionDigits: 0 
        });
        
        const formattedRevenuMedian = revenusDataForYear.revenu_median ? 
          revenusDataForYear.revenu_median.toLocaleString('fr-FR', { 
            style: 'currency', 
            currency: 'EUR', 
            maximumFractionDigits: 0 
          }) : "Non disponible";
        
        // Formater les revenus fiscaux de référence
        const formattedRevenuFiscalTotal = revenusDataForYear.revenu_fiscal_reference_total ? 
          revenusDataForYear.revenu_fiscal_reference_total.toLocaleString('fr-FR', { 
            style: 'currency', 
            currency: 'EUR', 
            maximumFractionDigits: 3,
            maximumSignificantDigits: 4
          }) : "Non disponible";
          
        const formattedRevenuFiscalImposes = revenusDataForYear.revenu_fiscal_reference_imposes ? 
          revenusDataForYear.revenu_fiscal_reference_imposes.toLocaleString('fr-FR', { 
            style: 'currency', 
            currency: 'EUR', 
            maximumFractionDigits: 3,
            maximumSignificantDigits: 4
          }) : "Non disponible";
          
        const formattedImpotNetTotal = revenusDataForYear.impot_net_total ? 
          revenusDataForYear.impot_net_total.toLocaleString('fr-FR', { 
            style: 'currency', 
            currency: 'EUR', 
            maximumFractionDigits: 3,
            maximumSignificantDigits: 4
          }) : "Non disponible";
        
        // Récupérer l'année soit depuis les données, soit extraire du mois courant
        const anneeAffichage = revenusDataForYear.annee || 
                              (selectedIdfMonthYear ? selectedIdfMonthYear.split('-')[0] : '');
        
        popupContent += `
          <div class="mt-2 bg-blue-50 p-2 rounded-md">
            <div class="flex items-center">
              <span class="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
              <span class="font-medium">Revenus (${anneeAffichage}):</span>
            </div>
            
            <div class="grid grid-cols-2 gap-1 mt-2">
              <div class="text-xs text-gray-600">Revenu moyen:</div>
              <div class="text-xs font-bold">${formattedRevenuMoyen}</div>
              
              <div class="text-xs text-gray-600">Revenu médian:</div>
              <div class="text-xs font-bold">${formattedRevenuMedian}</div>
            </div>
            
            <div class="mt-2 border-t border-blue-100 pt-1">
              <div class="text-xs font-medium text-gray-600">Données fiscales:</div>
              <div class="grid grid-cols-2 gap-1 mt-1">
                <div class="text-xs text-gray-600">Revenu fiscal total:</div>
                <div class="text-xs">${formattedRevenuFiscalTotal}</div>
                
                <div class="text-xs text-gray-600">Revenu fiscal imposé:</div>
                <div class="text-xs">${formattedRevenuFiscalImposes}</div>
                
                <div class="text-xs text-gray-600">Impôt net total:</div>
                <div class="text-xs">${formattedImpotNetTotal}</div>
              </div>
            </div>
            
            <div class="mt-2 border-t border-blue-100 pt-1">
              <div class="grid grid-cols-2 gap-1">
                <div class="text-xs text-gray-600">Foyers fiscaux:</div>
                <div class="text-xs">${revenusDataForYear.foyers_total.toLocaleString('fr-FR')}</div>
                
                <div class="text-xs text-gray-600">Foyers imposés:</div>
                <div class="text-xs">${revenusDataForYear.foyers_imposes ? 
                  revenusDataForYear.foyers_imposes.toLocaleString('fr-FR') : "Non disponible"}</div>
              </div>
            </div>
            
            <div class="text-xs mt-2 text-gray-600 text-center">
              Pour la période: ${formatMonthYear(selectedIdfMonthYear || '')}
            </div>
          </div>
        `;
      }

      if (!pollutionDataForMonth && !revenusDataForYear) {
        popupContent += `<div class="p-2 text-center text-gray-500">${t("No data available")}</div>`;
      }

      popupContent += `</div></div>`;
      
      // Mettre à jour le contenu du popup
      popup.setContent(popupContent);
    });
    
    // Configurer le popup initial
    layer.bindPopup('', {
      maxWidth: 300,
      className: 'idf-popup-container',
      closeButton: true
    });
  };


  // --- Rendu JSX ---
  return (
    <div className="flex flex-col h-screen">
      <header className="bg-white p-4 shadow-md z-20"> {/* [cite: 101] */}
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-800">{t("France Air Quality")}</h1>
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            &larr; {t("Back to Global Map")}
          </Link>
        </div>
      </header>

      {/* SVG Pattern Definitions - MOTIFS DE CERCLES AU LIEU DE LIGNES */}
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          {/* High Revenue (> 50k) */}
          <pattern id="pattern-revenue-high" patternUnits="userSpaceOnUse" width="10" height="10">
            <line x1="0" y1="0" x2="10" y2="10" stroke="rgb(0, 0, 139)" strokeWidth="2" />
          </pattern>

          {/* Medium-High Revenue (40k-50k) */}
          <pattern id="pattern-revenue-medium-high" patternUnits="userSpaceOnUse" width="10" height="10">
            <line x1="0" y1="0" x2="10" y2="10" stroke="rgb(0, 0, 180)" strokeWidth="2" />
          </pattern>

          {/* Medium Revenue (30k-40k) */}
          <pattern id="pattern-revenue-medium" patternUnits="userSpaceOnUse" width="10" height="10">
            <line x1="0" y1="0" x2="10" y2="10" stroke="rgb(0, 0, 220)" strokeWidth="2" />
          </pattern>

          {/* Low-Medium Revenue (20k-30k) */}
          <pattern id="pattern-revenue-low-medium" patternUnits="userSpaceOnUse" width="10" height="10">
            <line x1="0" y1="0" x2="10" y2="10" stroke="rgb(0, 0, 255)" strokeWidth="2" />
          </pattern>

          {/* Low Revenue (< 20k) */}
          <pattern id="pattern-revenue-low" patternUnits="userSpaceOnUse" width="10" height="10">
            <line x1="0" y1="0" x2="10" y2="10" stroke="rgb(0, 0, 180)" strokeWidth="2" />
          </pattern>
        </defs>
      </svg>


      <div className="flex-1 container mx-auto px-4 py-2 overflow-hidden"> {/* Added overflow-hidden */}
        <Tabs defaultValue="idf" className="w-full h-full flex flex-col"> {/* Adjusted for full height */}
          <TabsList className="mb-4 flex-shrink-0"> {/* [cite: 101] */}
            <TabsTrigger value="france" className="flex-1">{t("France entière")}</TabsTrigger>
            <TabsTrigger value="idf" className="flex-1">{t("Île-de-France")}</TabsTrigger>
          </TabsList>

          {/* Onglet France */}
          <TabsContent value="france" className="flex-1 relative"> {/* [cite: 102] */}
            {/* --- Slider France --- */}
            {!isLoadingFrance && availableDates.length > 0 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 bg-white w-full max-w-md p-3 rounded-md shadow-lg"> {/* [cite: 102] Centered */}
                 <div className="flex items-center justify-between mb-2"> {/* [cite: 103] */}
                  <div className="font-medium">{t("Date")}:</div>
                  <div className="font-medium text-blue-700">
                    {selectedDate ? new Date(selectedDate).toLocaleDateString('fr-FR') : ''} {/* [cite: 104] */}
                  </div>
                </div>
                 <div className="flex items-center space-x-3"> {/* [cite: 111] */}
                  <button /* Gauche */ // [cite: 105]
                     className="bg-blue-600 text-white p-1 rounded-full hover:bg-blue-700 disabled:opacity-50 flex-shrink-0" // [cite: 105]
                     onClick={() => setDateIndex(Math.max(0, dateIndex - 1))}
                     disabled={dateIndex === 0}>
                     <svg className="w-5 h-5" /* ... */> <path d="M15 19l-7-7 7-7" /> </svg> {/* [cite: 106] */}
                  </button>
                  <Slider // [cite: 107]
                    value={[dateIndex]}
                    max={availableDates.length - 1} // [cite: 107]
                    step={1}
                    onValueChange={(value) => setDateIndex(value[0])} // [cite: 108]
                    className="cursor-pointer flex-1" // [cite: 108]
                  />
                  <button /* Droite */ // [cite: 109]
                     className="bg-blue-600 text-white p-1 rounded-full hover:bg-blue-700 disabled:opacity-50 flex-shrink-0" // [cite: 109]
                     onClick={() => setDateIndex(Math.min(availableDates.length - 1, dateIndex + 1))}
                     disabled={dateIndex === availableDates.length - 1}>
                     <svg className="w-5 h-5" /* ... */> <path d="M9 5l7 7-7 7" /> </svg> {/* [cite: 110] */}
                  </button>
                </div>
              </div>
            )}

             {/* --- Loading France --- */}
            {isLoadingFrance && ( // [cite: 112]
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-20"> {/* [cite: 112] */}
                 <div className="flex flex-col items-center"> {/* [cite: 112] */}
                   <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div> {/* [cite: 112] */}
                   <p className="mt-4 text-gray-700 font-medium">{t("Loading sensor data...")}</p> {/* [cite: 112] */}
                 </div> {/* [cite: 113] */}
               </div>
            )}

             {/* --- Map France --- */}
            {!isLoadingFrance && (
              <>
                {/* -- Selecteur Paramètre -- */}
                <div className="absolute top-2 right-2 z-10 bg-white p-2 rounded-md shadow-md"> {/* [cite: 113] */}
                   <div className="mb-1 text-sm font-medium">{t("Select Parameter")}:</div> {/* [cite: 113] */}
                   <div className="flex flex-wrap gap-1"> {/* [cite: 114] Adjusted for wrapping */}
                     {["pm25", "pm10", "no2", "o3", "so2", "co"].map(param => ( // Added more common params
                       <button
                         key={param}
                         className={`px-2 py-0.5 rounded-full text-xs ${ // [cite: 115] Smaller buttons
                           selectedParameter === param
                             ? "bg-blue-600 text-white" // [cite: 115]
                             : "bg-gray-200 text-gray-700 hover:bg-gray-300" // [cite: 115]
                         }`} // [cite: 116]
                         onClick={() => setSelectedParameter(param)} // [cite: 116]
                       >
                         {parameterInfo[param as AirQualityParameter]?.name || param.toUpperCase()} {/* Display full name */}
                       </button> // [cite: 117]
                     ))}
                   </div>
                 </div>

                 {/* -- Conteneur Carte -- */}
                <div className="h-full w-full relative z-0"> {/* [cite: 118] Ensure map container takes full height */}
                  {/* Contrôles améliorés pour les capteurs et revenus */}
                  <div className="absolute top-2 right-2 z-10 bg-white rounded-md shadow-md p-3">
                    <div className="flex items-center space-x-2 mb-3 pb-2 border-b border-blue-100">
                      <div className="flex-shrink-0 bg-green-500 p-1 rounded-full">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                        </svg>
                      </div>
                  
                    </div>

                  </div>
                
                  {/* Légende pour les marqueurs et cercles */}
                  <div className="absolute bottom-8 right-2 z-10 bg-white/90 rounded-md shadow-md p-2 max-w-[250px]">
                    <h4 className="text-sm font-bold mb-1">Légende</h4>
                    <div className="text-xs">
                      <div className="flex items-center mb-1">
                        <div className="w-4 h-4 mr-2 rounded-full bg-red-500 border border-white"></div>
                        <span>Capteur de {selectedPollutantFrance.toUpperCase()} (valeur élevée)</span>
                      </div>
                      <div className="flex items-center mb-1">
                        <div className="w-4 h-4 mr-2 rounded-full bg-green-500 border border-white"></div>
                        <span>Capteur de {selectedPollutantFrance.toUpperCase()} (valeur faible)</span>
                      </div>
                      <div className="flex items-center mb-1">
                        <div className="w-4 h-4 mr-2 rounded-full bg-blue-600 opacity-70"></div>
                        <span>Revenu élevé</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-4 h-4 mr-2 rounded-full bg-blue-200 opacity-70"></div>
                        <span>Revenu faible</span>
                      </div>
                    </div>
                  </div>
                  
                  <MapContainer
                    center={franceCenter} // [cite: 118]
                    zoom={6} // [cite: 118]
                    style={{ height: "100%", width: "100%" }} // [cite: 118]
                    zoomControl={false} // [cite: 119]
                    attributionControl={true} // Keep attribution
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &amp; air data sources' // [cite: 120]
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" // [cite: 120]
                    />
                    <SetMapView center={franceCenter} zoom={6} /> {/* [cite: 120] */}
                    
                    {/* NOUVELLES DONNÉES : Cercles de revenus (dessous) */}
                    {franceRevenusData.map((revenu, idx) => {
                      if (!revenu.coordinates || !revenu.coordinates.latitude || !revenu.coordinates.longitude) return null;
                      
                      // Calculer taille et couleur basées sur le revenu moyen
                      const revenuMoyen = revenu.revenu_moyen || 0;
                      const maxRevenu = 50000; // Revenu considéré comme maximum
                      
                      // Taille du cercle basée sur le revenu (plus grand = plus riche) - AGRANDIE
                      const minRadius = 20000;  // Augmenté de 500 à 2000
                      const maxRadius = 15000; // Augmenté de 5000 à 15000
                      const radius = minRadius + (Math.min(revenuMoyen, maxRevenu) / maxRevenu) * (maxRadius - minRadius);
                      
                      // Couleur basée sur le revenu (bleu plus foncé = plus riche)
                      const opacity = 0.35; // Augmenté pour meilleure visibilité
                      const colorIntensity = Math.min(80 + (revenuMoyen / maxRevenu) * 175, 255);
                      const color = `rgba(${50}, ${100}, ${colorIntensity}, ${opacity})`;
                      
                      return (
                        <Circle
                          key={`revenu-${revenu.code_commune}-${idx}`}
                          center={[revenu.coordinates.latitude, revenu.coordinates.longitude]}
                          radius={radius}
                          pathOptions={{
                            fillColor: color,
                            fillOpacity: opacity,
                            color: 'rgba(0,0,150,0.2)',
                            weight: 2 // Bordure plus large
                          }}
                        >
                          <Popup>
                            <div className="revenu-popup p-2 max-w-[300px]">
                              <h3 className="font-bold text-blue-800">{revenu.nom_commune}</h3>
                              
                              <div className="mt-2 bg-blue-50 p-2 rounded-md">
                                <div className="flex items-center">
                                  <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                                  <span className="font-medium">Revenus ({revenu.annee}):</span>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-1 mt-2">
                                  <div className="text-xs text-gray-600">Revenu moyen:</div>
                                  <div className="text-xs font-bold">
                                    {revenu.revenu_moyen.toLocaleString('fr-FR', {
                                      style: 'currency',
                                      currency: 'EUR',
                                      maximumFractionDigits: 0
                                    })}
                                  </div>
                                  
                                  <div className="text-xs text-gray-600">Revenu médian:</div>
                                  <div className="text-xs font-bold">
                                    {revenu.revenu_median ? 
                                      revenu.revenu_median.toLocaleString('fr-FR', {
                                        style: 'currency',
                                        currency: 'EUR',
                                        maximumFractionDigits: 0
                                      }) : "Non disponible"}
                                  </div>
                                </div>
                                
                                <div className="mt-2 border-t border-blue-100 pt-1">
                                  <div className="text-xs font-medium text-gray-600">Données fiscales:</div>
                                  <div className="grid grid-cols-2 gap-1 mt-1">
                                    <div className="text-xs text-gray-600">Revenu fiscal total:</div>
                                    <div className="text-xs">
                                      {revenu.revenu_fiscal_reference_total ? 
                                        revenu.revenu_fiscal_reference_total.toLocaleString('fr-FR', {
                                          style: 'currency',
                                          currency: 'EUR',
                                          maximumFractionDigits: 3,
                                          maximumSignificantDigits: 4
                                        }) : "Non disponible"}
                                    </div>
                                    
                                    <div className="text-xs text-gray-600">Revenu fiscal imposé:</div>
                                    <div className="text-xs">
                                      {revenu.revenu_fiscal_reference_imposes ? 
                                        revenu.revenu_fiscal_reference_imposes.toLocaleString('fr-FR', {
                                          style: 'currency',
                                          currency: 'EUR',
                                          maximumFractionDigits: 3,
                                          maximumSignificantDigits: 4
                                        }) : "Non disponible"}
                                    </div>
                                    
                                    <div className="text-xs text-gray-600">Impôt net total:</div>
                                    <div className="text-xs">
                                      {revenu.impot_net_total ? 
                                        revenu.impot_net_total.toLocaleString('fr-FR', {
                                          style: 'currency',
                                          currency: 'EUR',
                                          maximumFractionDigits: 3,
                                          maximumSignificantDigits: 4
                                        }) : "Non disponible"}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="mt-2 border-t border-blue-100 pt-1">
                                  <div className="grid grid-cols-2 gap-1">
                                    <div className="text-xs text-gray-600">Foyers fiscaux:</div>
                                    <div className="text-xs">{revenu.foyers_total.toLocaleString('fr-FR')}</div>
                                    
                                    <div className="text-xs text-gray-600">Foyers imposés:</div>
                                    <div className="text-xs">
                                      {revenu.foyers_imposes ? 
                                        revenu.foyers_imposes.toLocaleString('fr-FR') : "Non disponible"}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Popup>
                        </Circle>
                      );
                    })}

                    {/* ANCIENNES DONNÉES : Cercles de chaleur (dessous) */}
                    {filteredSensorsFrance.map((sensor) => ( // [cite: 121]
                       <Circle // [cite: 122]
                         key={`circle-${sensor.sensor_id}-${sensor.date}`} // [cite: 121]
                         center={[sensor.coordinates_latitude, sensor.coordinates_longitude]} // [cite: 122]
                         radius={getHeatCircleRadius(sensor.value, sensor.pollutant)} // [cite: 122]
                         pathOptions={{ // [cite: 123]
                           fillColor: getPollutionColor(sensor.value, sensor.pollutant), // [cite: 123]
                           fillOpacity: getHeatCircleOpacity(sensor.value, sensor.pollutant), // [cite: 123]
                           stroke: false, // [cite: 124]
                         }} // [cite: 124]
                       /> // [cite: 125]
                    ))} {/* [cite: 126] */}
                    
                    {/* NOUVELLES DONNÉES : Marqueurs de capteurs */}
                    {franceSensorData.map((sensor, idx) => {
                      if (!sensor.coordinates_latitude || !sensor.coordinates_longitude) return null;
                      
                      // Utiliser la fonction existante pour créer l'icône
                      const icon = createMarkerIcon(sensor.value, sensor.pollutant);
                      
                      return (
                        <Marker
                          key={`new-marker-${sensor.code_commune}-${idx}`}
                          position={[sensor.coordinates_latitude, sensor.coordinates_longitude]}
                          icon={icon}
                        >
                          <Popup className="sensor-popup">
                            <div>
                              <h3 className="font-bold text-green-800">{sensor.commune || "Commune"}</h3>
                              <div className="text-sm mt-2">
                                <div className="font-medium">
                                  {sensor.pollutant.toUpperCase()}: 
                                  <span className="font-bold ml-1">{sensor.value.toFixed(1)}</span>
                                  <span className="text-xs ml-1">
                                    {parameterInfo[sensor.pollutant.toLowerCase() as AirQualityParameter]?.unit || "μg/m³"}
                                  </span>
                                </div>
                                <div className="mt-1 text-xs text-gray-600">
                                  Date: {new Date(sensor.date).toLocaleDateString('fr-FR')}
                                </div>
                                <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                                  <div><span className="text-gray-600">Min:</span> {sensor.min.toFixed(1)}</div>
                                  <div><span className="text-gray-600">Max:</span> {sensor.max.toFixed(1)}</div>
                                  <div><span className="text-gray-600">Médiane:</span> {sensor.median.toFixed(1)}</div>
                                  <div><span className="text-gray-600">Moyenne:</span> {sensor.avg.toFixed(1)}</div>
                                </div>
                              </div>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}

                     {/* ANCIENNES DONNÉES : Marqueurs (dessus) */}
                    {filteredSensorsFrance.map((sensor) => ( // [cite: 126]
                       <Marker // [cite: 127]
                         key={`marker-${sensor.sensor_id}-${sensor.date}`} // [cite: 126]
                         position={[sensor.coordinates_latitude, sensor.coordinates_longitude]} // [cite: 127]
                         icon={createMarkerIcon(sensor.value, sensor.pollutant)} // [cite: 128]
                       >
                         <Popup> {/* [cite: 128] */}
                            <div className="sensor-popup"> {/* [cite: 129] */}
                               <h3 className="font-bold">{sensor.commune}</h3> {/* [cite: 129] */}
                               <div className="text-sm mt-1"> {/* [cite: 129] */}
                                 <div>
                                   <span className="font-medium">{sensor.pollutant.toUpperCase()}:</span> {/* [cite: 130] */}
                                   <span className="font-bold"> {sensor.value.toFixed(1)}</span> {parameterInfo[sensor.pollutant as AirQualityParameter]?.unit || "μg/m³"} {/* [cite: 130, 131] */}
                                 </div>
                                 <div className="mt-1">
                                   <span className="font-medium">{t("Date")}:</span> {new Date(sensor.date).toLocaleDateString('fr-FR')} {/* [cite: 132] */}
                                 </div>
                                 <div className="mt-2 text-xs"> {/* [cite: 132] */}
                                    {t("Min")}: {sensor.min.toFixed(1)} | {t("Max")}: {sensor.max.toFixed(1)} {/* [cite: 133] */} <br/>
                                    {t("Median")}: {sensor.median.toFixed(1)} | {t("Avg")}: {sensor.avg.toFixed(1)} {/* [cite: 134] */}
                                 </div> {/* [cite: 134] */}
                               </div>
                            </div> {/* [cite: 134] */}
                         </Popup> {/* [cite: 135] */}
                       </Marker> // [cite: 135]
                    ))} {/* [cite: 136] */}
                  </MapContainer>
                </div>
              </>
            )}
          </TabsContent>


          {/* Onglet Île-de-France */}
          <TabsContent value="idf" className="flex-1 relative"> {/* [cite: 137] */}
             {/* --- Slider IDF amélioré --- */}
            {!isLoadingIdf && availableIdfMonthYears.length > 0 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30 w-full max-w-md bg-white p-4 rounded-lg shadow-xl border border-blue-100">
                <div className="flex flex-col">
                  {/* En-tête du slider */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                      <div className="font-medium text-gray-800">{t("Date Visualisation")}:</div>
                    </div>
                    <div className="font-bold text-blue-700 text-lg">
                      {selectedIdfMonthYear ? formatMonthYear(selectedIdfMonthYear) : t('N/A')}
                    </div>
                  </div>
 
                  {/* Slider amélioré */}
                  <div className="flex items-center space-x-3 mt-1">
                    <button
                      className="bg-blue-600 text-white p-1.5 rounded-full hover:bg-blue-700 disabled:opacity-50 flex-shrink-0 shadow-md transition-all duration-150 hover:scale-110"
                      onClick={() => setIdfMonthYearIndex(Math.max(0, idfMonthYearIndex - 1))}
                      disabled={idfMonthYearIndex === 0}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    
                    <div className="flex-1 relative">
                      <Slider
                        value={[idfMonthYearIndex]}
                        max={availableIdfMonthYears.length - 1}
                        step={1}
                        onValueChange={(value) => setIdfMonthYearIndex(value[0])}
                        className="cursor-pointer"
                      />
                      <div className="flex justify-between mt-1 text-xs text-gray-500">
                        <span>{formatMonthYear(availableIdfMonthYears[0] || '')}</span>
                        <span>{formatMonthYear(availableIdfMonthYears[availableIdfMonthYears.length - 1] || '')}</span>
                      </div>
                    </div>
                    
                    <button
                      className="bg-blue-600 text-white p-1.5 rounded-full hover:bg-blue-700 disabled:opacity-50 flex-shrink-0 shadow-md transition-all duration-150 hover:scale-110"
                      onClick={() => setIdfMonthYearIndex(Math.min(availableIdfMonthYears.length - 1, idfMonthYearIndex + 1))}
                      disabled={idfMonthYearIndex === availableIdfMonthYears.length - 1}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* --- Loading IDF --- */}
            {isLoadingIdf && ( // [cite: 146, 147]
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-20"> {/* [cite: 147] */}
                 <div className="flex flex-col items-center"> {/* [cite: 147] */}
                   <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div> {/* [cite: 147] */}
                   <p className="mt-4 text-gray-700 font-medium">{t("Loading Île-de-France data...")}</p> {/* [cite: 147] */}
                 </div> {/* [cite: 148] */}
               </div>
            )}

             {/* --- Map IDF --- */}
            {!isLoadingIdf && (
              <>
                 {/* -- Controles IDF -- */}
                <div className="absolute top-2 right-2 z-10 bg-white p-3 rounded-lg shadow-lg border border-blue-100 max-w-xs">
                  

                   
                    
                    {/* Paramètres Pollution */}
                    <div className="mb-3">
                      <div className="flex items-center mb-2">
                        <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                        <div className="font-medium text-sm text-gray-800">{t("Polluant")}:</div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {["PM25", "PM10", "NOx", "No2"].map(param => (
                          <button
                            key={param}
                            className={`px-2 py-1 rounded-md text-xs font-medium ${
                              selectedIdfPollutant === param
                                ? "bg-blue-600 text-white shadow-md transform scale-105"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            } transition-all duration-150`}
                            onClick={() => setSelectedIdfPollutant(param)}
                          >
                            {param === 'No2' ? 'NO₂' : param}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Contrôle d'affichage des revenus */}
                    <div className="mb-2">
                      <div className="flex items-center mb-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                        <div className="font-medium text-sm text-gray-800">{t("Données de revenus")}:</div>
                      </div>
                      <label className="flex items-center space-x-2 cursor-pointer bg-gray-50 p-2 rounded-md">
                        <input
                          type="checkbox"
                          checked={showRevenueOverlay}
                          onChange={(e) => setShowRevenueOverlay(e.target.checked)}
                          className="form-checkbox h-4 w-4 text-blue-600 rounded"
                        />
                        <span className="text-sm">{t("Afficher les revenus")}</span>
                      </label>
                    </div>
                </div>

                 {/* -- Conteneur Carte -- */}
                <div className="h-full w-full relative z-0"> {/* [cite: 168] */}
                  <MapContainer
                    center={idfCenter} // [cite: 168]
                    zoom={9} // [cite: 168]
                    style={{ height: "100%", width: "100%" }} // [cite: 168, 169]
                    zoomControl={false} // [cite: 169]
                    attributionControl={true} // Keep attribution
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &amp; air/revenue data sources' // [cite: 170]
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" // [cite: 170]
                    />
                    <SetMapView center={idfCenter} zoom={9} /> {/* [cite: 170] */}

                     {/* COUCHE DE BASE: Formes Pollution */}
                    {idfPollutionData && selectedIdfMonthYear && Object.entries(idfPollutionData).map(([communeId, commune]) => { // [cite: 171]
                      if (!commune.data || !commune.data[selectedIdfMonthYear] || !commune.geo_shape) return null; // [cite: 171, 172]
                      try {
                        const geoData = JSON.parse(commune.geo_shape); // [cite: 173]
                        if (!geoData?.type || !geoData?.coordinates) return null; // [cite: 174, 175] Validation
                        const pollutionValue = commune.data[selectedIdfMonthYear].mean; // [cite: 177]
                        const pollutionColor = getPollutionColor(pollutionValue, selectedIdfPollutant);

                        const geoJsonFeature: GeoJSONFeature = { // [cite: 175, 176]
                          type: 'Feature',
                          properties: { name: commune.nom, id: communeId, value: pollutionValue }, // [cite: 176, 177]
                          geometry: geoData // [cite: 177]
                        };
                        return (
                          <GeoJSON // [cite: 178]
                            key={`idf-pollution-${selectedIdfRevenuAnnee}-${selectedIdfMonthYear}`}// [cite: 178]
                            data={geoJsonFeature} // [cite: 178]
                            style={{ // Style de base pour la pollution
                              fillColor: pollutionColor,
                              weight: 0.7, // Bordure légèrement plus épaisse
                              opacity: 0.6,
                              color: '#FFF', // Bordure blanche
                              fillOpacity: 0.4 // Opacité réduite pour mieux voir le fond de carte
                            }} // [cite: 179] (Logique adaptée)
                            onEachFeature={onEachIdfFeature} // [cite: 179] Attacher le popup ici
                          /> // [cite: 179]
                        );
                      } catch (error) { console.error(`Erreur geo_shape pollution ${commune.nom}:`, error); return null; } // [cite: 180, 181]
                    })} {/* [cite: 181] */}


                    {/* COUCHE SUPERPOSÉE: Lignes Revenus */}
                    {showRevenueOverlay && idfRevenusData && Object.entries(idfRevenusData).map(([communeId, commune]: [string, IDFRevenusCommune]) => { // [cite: 182]
                      if (!commune.data || !commune.geo_shape) return null; // [cite: 182]
                      try {
                        const geoData = JSON.parse(commune.geo_shape); // [cite: 183]
                        if (!geoData?.type || !geoData?.coordinates) return null; // [cite: 184, 185] Validation
                        const revenuMoyen = commune.data.revenu_moyen; // [cite: 187]
                        const patternId = getRevenusPatternId(revenuMoyen); // Obtenir l'ID du pattern

                        const geoJsonFeature: GeoJSONFeature = { // [cite: 185, 186]
                          type: 'Feature',
                          properties: { name: commune.nom, id: communeId, value: revenuMoyen }, // [cite: 186, 187]
                          geometry: geoData // [cite: 187]
                        };
                        return (
                          <GeoJSON // [cite: 188]
                            key={`idf-revenue-overlay-${communeId}`} // [cite: 188]
                            data={geoJsonFeature} // [cite: 188]
                            style={{ // Style pour l'overlay pattern
                              fillColor: `url(#${patternId})`, // Utiliser le pattern SVG
                              weight: 1, // Légère bordure pour l'overlay pour une meilleure délimitation
                              color: getRevenusColor(revenuMoyen), // Bordure de la même couleur que le pattern
                              opacity: 0.4, // Opacité de la bordure
                              fillOpacity: 0.85, // Opacité augmentée du pattern pour meilleure visibilité
                              interactive: true // Rendre cette couche interactive pour les popups
                            }} // [cite: 189] (Logique adaptée)
                            onEachFeature={(feature, layer) => {
                              const revenuMoyen = feature.properties.value;
                              const communeName = feature.properties.name;
                              const communeId = feature.properties.id;
                              
                              layer.on({
                                click: (e) => {
                                  // Trouver les données de revenus complètes pour cette commune
                                  const communeData = idfRevenusData[communeId];
                                  if (!communeData || !communeData.data) return;
                                  
                                  const popup = L.popup({
                                    maxWidth: 300,
                                    className: 'idf-popup-container',
                                    closeButton: true,
                                    autoClose: true
                                  });
                                  
                                  let popupContent = `<div class="idf-popup p-2 min-w-[200px] max-w-[300px]">
                                    <h3 class="font-bold text-blue-800">${communeName}</h3>
                                    <div class="text-sm mt-2">`;
                                  
                                  // Calculer et formater les données de revenus
                                  const revenuData = communeData.data;
                                  const annee = revenuData.annee || "N/A";
                                  
                                  // Formater les nombres
                                  const formatCurrency = (value?: number) => {
                                    if (value === undefined || value === null) return "Non disponible";
                                    return value.toLocaleString('fr-FR', {
                                      style: 'currency',
                                      currency: 'EUR',
                                      maximumFractionDigits: 0
                                    });
                                  };
                                  
                                  const formatNumber = (value?: number) => {
                                    if (value === undefined || value === null) return "Non disponible";
                                    return value.toLocaleString('fr-FR');
                                  };
                                  
                                  // Section des revenus
                                  popupContent += `
                                    <div class="mt-2 bg-blue-50 p-2 rounded-md">
                                      <div class="flex items-center">
                                        <span class="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                                        <span class="font-medium">Revenus (${annee}):</span>
                                      </div>
                                      
                                      <div class="grid grid-cols-2 gap-1 mt-2">
                                        <div class="text-xs text-gray-600">Revenu moyen:</div>
                                        <div class="text-xs font-bold">${formatCurrency(revenuData.revenu_moyen)}</div>
                                        
                                        <div class="text-xs text-gray-600">Revenu médian:</div>
                                        <div class="text-xs font-bold">${formatCurrency(revenuData.revenu_median)}</div>
                                      </div>
                                      
                                      <div class="mt-2 border-t border-blue-100 pt-1">
                                        <div class="text-xs font-medium text-gray-600">Données fiscales:</div>
                                        <div class="grid grid-cols-2 gap-1 mt-1">
                                          <div class="text-xs text-gray-600">Revenu fiscal total:</div>
                                          <div class="text-xs">${formatCurrency(revenuData.revenu_fiscal_reference_total)}</div>
                                          
                                          <div class="text-xs text-gray-600">Revenu fiscal imposé:</div>
                                          <div class="text-xs">${formatCurrency(revenuData.revenu_fiscal_reference_imposes)}</div>
                                          
                                          <div class="text-xs text-gray-600">Impôt net total:</div>
                                          <div class="text-xs">${formatCurrency(revenuData.impot_net_total)}</div>
                                        </div>
                                      </div>
                                      
                                      <div class="mt-2 border-t border-blue-100 pt-1">
                                        <div class="grid grid-cols-2 gap-1">
                                          <div class="text-xs text-gray-600">Foyers fiscaux:</div>
                                          <div class="text-xs">${formatNumber(revenuData.foyers_total)}</div>
                                          
                                          <div class="text-xs text-gray-600">Foyers imposés:</div>
                                          <div class="text-xs">${formatNumber(revenuData.foyers_imposes)}</div>
                                        </div>
                                      </div>
                                    </div>`;
                                  
                                  popupContent += `</div></div>`;
                                  
                                  // Définir le contenu et l'emplacement du popup
                                  popup.setContent(popupContent);
                                  popup.setLatLng(e.latlng);
                                  popup.openOn(e.target._map);
                                }
                              });
                            }}
                          /> // [cite: 189]
                        );
                      } catch (error) { console.error(`Erreur geo_shape revenus ${commune.nom}:`, error); return null; } // [cite: 190, 191]
                    })} {/* [cite: 191] */}


                    {/* Marqueurs ponctuels pour la pollution (Optionnel, si geo_point_2d existe et est pertinent) */}
                    {/* Vous pouvez garder ce bloc si vous voulez des points *en plus* des formes */}
                    {/* {idfPollutionData && selectedIdfMonthYear && Object.entries(idfPollutionData).map(([communeId, commune]) => { ... })} */}


                    {/* Légende pour la pollution */}
                    <div className="leaflet-bottom leaflet-left">
                      <div className="leaflet-control leaflet-bar bg-white p-2 rounded shadow-md mb-10 ml-1 w-42">
                        <div className="font-medium text-xs mb-1">{t("Pollution")} ({selectedIdfPollutant}):</div>
                        <div className="grid grid-cols-1 gap-1 text-xs">
                          {(() => {
                            const parameter = selectedIdfPollutant.toLowerCase() as AirQualityParameter;
                            const thresholds = parameterInfo[parameter]?.thresholds || parameterInfo.pm25.thresholds;
                            const unit = parameterInfo[parameter]?.unit || "μg/m³";
                            return (
                              <>
                                <div className="flex items-center">
                                  <div className="w-4 h-4 mr-2 bg-[#FF2040] rounded border border-white shadow-sm"></div>
                                  <span>&gt; {thresholds.high} {unit} ({t("Malsain")})</span>
                                </div>
                                <div className="flex items-center">
                                  <div className="w-4 h-4 mr-2 bg-[#FF8000] rounded border border-white shadow-sm"></div>
                                  <span>&gt; {thresholds.medium} {unit} ({t("Modéré")})</span>
                                </div>
                                <div className="flex items-center">
                                  <div className="w-4 h-4 mr-2 bg-[#F0D000] rounded border border-white shadow-sm"></div>
                                  <span>&gt; {thresholds.low} {unit} ({t("Acceptable")})</span>
                                </div>
                                <div className="flex items-center">
                                  <div className="w-4 h-4 mr-2 bg-[#00CC66] rounded border border-white shadow-sm"></div>
                                  <span>&le; {thresholds.low} {unit} ({t("Bon")})</span>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Légende pour les revenus (si l'overlay est affiché) */}
                    {showRevenueOverlay && (
                      <div className="leaflet-bottom leaflet-right">
                         <div className="leaflet-control leaflet-bar bg-white p-2 rounded shadow-md mb-10 mr-1 w-40">
                            <div className="font-medium text-xs mb-1">{t("Revenus moyens")}:</div>
                            <div className="grid grid-cols-1 gap-1 text-xs">
                               <div className="flex items-center">
                                 <div className="w-4 h-4 mr-2 relative overflow-hidden border border-gray-300">
                                   <div className="absolute inset-0 flex items-center justify-center">
                                     <div className="w-2 h-2 rounded-full bg-[#1E40AF] border border-white"></div>
                                   </div>
                                 </div>
                                 <span>&gt; 50k €</span>
                               </div>
                               <div className="flex items-center">
                                 <div className="w-4 h-4 mr-2 relative overflow-hidden border border-gray-300">
                                   <div className="absolute inset-0 flex items-center justify-center">
                                     <div className="w-2 h-2 rounded-full bg-[#1D4ED8] border border-white"></div>
                                   </div>
                                 </div>
                                 <span>40-50k €</span>
                               </div>
                               <div className="flex items-center">
                                 <div className="w-4 h-4 mr-2 relative overflow-hidden border border-gray-300">
                                   <div className="absolute inset-0 flex items-center justify-center">
                                     <div className="w-2 h-2 rounded-full bg-[#3B82F6] border border-white"></div>
                                   </div>
                                 </div>
                                 <span>30-40k €</span>
                               </div>
                               <div className="flex items-center">
                                 <div className="w-4 h-4 mr-2 relative overflow-hidden border border-gray-300">
                                   <div className="absolute inset-0 flex items-center justify-center">
                                     <div className="w-2 h-2 rounded-full bg-[#60A5FA] border border-white"></div>
                                   </div>
                                 </div>
                                 <span>20-30k €</span>
                               </div>
                               <div className="flex items-center">
                                 <div className="w-4 h-4 mr-2 relative overflow-hidden border border-gray-300">
                                   <div className="absolute inset-0 flex items-center justify-center">
                                     <div className="w-2 h-2 rounded-full bg-[#93C5FD] border border-white"></div>
                                   </div>
                                 </div>
                                 <span>&lt; 20k €</span>
                               </div>
                            </div>
                         </div>
                      </div>
                    )}

                  </MapContainer> {/* [cite: 212] */}
                </div>
              </>
            )}
          </TabsContent> {/* [cite: 212] */}
        </Tabs> {/* [cite: 212] */}
      </div> {/* [cite: 212] */}
    </div> // [cite: 212]
  );
} // [cite: 213]