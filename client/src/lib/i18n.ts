// French translations for the application
export const translations: Record<string, string> = {
  // Map legend and tooltips
  "GDP Per Country": "PIB Par Pays",
  "GDP in Trillion $": "PIB en Trillions $",
  "Source: World Bank": "Source: Banque Mondiale",
  
  // Tooltips
  "GDP": "PIB",
  "Global Rank": "Rang Mondial",
  "YoY Change": "Variation Annuelle",
  "Air Quality Parameters": "Paramètres de Qualité de l'Air",
  "N/A": "N/D",
  
  // Air quality terms
  "Good": "Bon",
  "Moderate": "Modéré",
  "Unhealthy for Sensitive Groups": "Malsain pour Groupes Sensibles",
  "Unhealthy": "Malsain",
  "Very Unhealthy": "Très Malsain",
  "Hazardous": "Dangereux",
  
  // Dashboard titles
  "Economic & Environmental Dashboard": "Tableau de Bord Économique & Environnemental",
  "Top 10 Countries by GDP and Air Quality": "Top 10 des Pays par PIB et Qualité de l'Air",
  "GDP & Air Quality Correlation Analysis": "Analyse de Corrélation PIB & Qualité de l'Air",
  "Air Quality Distribution by Region": "Distribution de la Qualité de l'Air par Région",
  
  // Correlation graph
  "Air Quality": "Qualité de l'Air",
  "Correlation": "Corrélation",
  "Strong positive": "Forte positive",
  "Moderate positive": "Modérée positive",
  "Weak/No correlation": "Faible/Sans corrélation",
  "Moderate negative": "Modérée négative",
  "Strong negative": "Forte négative",
  "Countries": "Pays",
  "Trend Line": "Ligne de Tendance",
  
  // Button texts
  "Dashboard": "Tableau de Bord",
  "Controls": "Contrôles",
  "Show Air Quality": "Afficher Qualité de l'Air",
  "Close": "Fermer",
  
  // Page header
  "Global GDP Visualization": "Visualisation PIB Mondial"
};

// Helper function to translate text
export function t(key: string): string {
  return translations[key] || key;
}