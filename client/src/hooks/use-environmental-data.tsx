import { useQuery } from '@tanstack/react-query';
import { getEnvironmentalIndices } from '@/lib/queryClient';
import { useState, useEffect } from 'react';
import { EnvironmentalDataPoint } from '@/lib/types';

export function useEnvironmentalData() {
  // État pour suivre les périodes disponibles
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([]);

  // État pour les filtres actuels
  const [currentFilters, setCurrentFilters] = useState({
    period: '',  // Initialement vide, sera mis à jour avec la période la plus récente
    pollutant: 'composite',
    metric: 'composite_index'
  });

  // Requête pour récupérer les données environnementales
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/environmental-indices', currentFilters],
    queryFn: () => getEnvironmentalIndices(currentFilters)
  });

  // Au premier chargement, effectuer une requête sans filtre pour obtenir toutes les périodes
  const { data: initialData, isLoading: isLoadingInitial } = useQuery({
    queryKey: ['/api/environmental-indices'],
    queryFn: () => getEnvironmentalIndices(),
    enabled: availablePeriods.length === 0,
  });

  // Extraire les périodes disponibles de toutes les entrées
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      const periods = new Set<string>();
      
      // Parcourir toutes les entrées pour trouver les périodes uniques
      Object.values(initialData).forEach((countryData: any) => {
        if (countryData.period) {
          periods.add(countryData.period);
        }
      });
      
      // Trier les périodes par ordre chronologique
      const sortedPeriods = Array.from(periods).sort();
      setAvailablePeriods(sortedPeriods);
      
      // Sélectionner la période la plus récente par défaut
      if (sortedPeriods.length > 0 && !currentFilters.period) {
        const mostRecentPeriod = sortedPeriods[sortedPeriods.length - 1];
        setCurrentFilters(prev => ({
          ...prev,
          period: mostRecentPeriod
        }));
      }
    }
  }, [initialData, currentFilters.period]);

  // Fonction pour mettre à jour les filtres
  const updateFilters = (newFilters: Partial<typeof currentFilters>) => {
    setCurrentFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  };

  // Préparation des données pour la carte
  const prepareDataForMap = (): EnvironmentalDataPoint[] => {
    if (!data) return [];

    const mapData = Object.entries(data).map(([countryCode, countryData]: [string, any]) => {
      // S'assurer que nous avons accès aux indices
      const indices = countryData.indices || {};
      const pollutantData = indices[currentFilters.pollutant] || {};
      const metricValue = pollutantData[currentFilters.metric];

      // Ne retourner que les pays qui ont des données pour la métrique sélectionnée
      if (metricValue !== undefined) {
        return {
          countryCode,
          value: metricValue,
          period: countryData.period || currentFilters.period
        };
      }
      return null;
    }).filter(Boolean) as EnvironmentalDataPoint[];

    return mapData;
  };

  return {
    environmentalData: data,
    preparedData: prepareDataForMap(),
    availablePeriods,
    currentFilters,
    updateFilters,
    isLoading: isLoading || isLoadingInitial,
    error,
    refetch
  };
}