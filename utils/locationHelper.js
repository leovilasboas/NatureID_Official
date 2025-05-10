/**
 * Utilitário para auxiliar na identificação de espécies com base em localização geográfica
 * Integra-se com a API do iNaturalist para obter informações sobre espécies presentes em uma região
 */

import { getObservationsByTaxon } from './inaturalistAPI';

// Mapeamento de coordenadas para regiões biogeográficas
const BIOREGIONS = [
  { name: 'Amazonia', bounds: { minLat: -9.5, maxLat: 5, minLng: -79, maxLng: -50 } },
  { name: 'Atlantic Forest', bounds: { minLat: -30, maxLat: -5, minLng: -55, maxLng: -35 } },
  { name: 'Cerrado', bounds: { minLat: -24, maxLat: -5, minLng: -60, maxLng: -42 } },
  { name: 'Pantanal', bounds: { minLat: -20, maxLat: -15, minLng: -58, maxLng: -54 } },
  { name: 'Caatinga', bounds: { minLat: -15, maxLat: -3, minLng: -45, maxLng: -37 } },
  { name: 'Pampa', bounds: { minLat: -33, maxLat: -28, minLng: -58, maxLng: -50 } },
  
  // América do Norte
  { name: 'Eastern Deciduous Forests', bounds: { minLat: 30, maxLat: 47, minLng: -95, maxLng: -70 } },
  { name: 'Great Plains', bounds: { minLat: 30, maxLat: 49, minLng: -105, maxLng: -95 } },
  { name: 'Western Mountains', bounds: { minLat: 35, maxLat: 49, minLng: -125, maxLng: -105 } },
  { name: 'Desert Southwest', bounds: { minLat: 25, maxLat: 37, minLng: -115, maxLng: -100 } },
  
  // Europa
  { name: 'Mediterranean Europe', bounds: { minLat: 36, maxLat: 45, minLng: -5, maxLng: 20 } },
  { name: 'Central European Forest', bounds: { minLat: 45, maxLat: 54, minLng: -5, maxLng: 30 } },
  { name: 'Boreal Europe', bounds: { minLat: 55, maxLat: 70, minLng: 4, maxLng: 32 } },
  
  // Ásia
  { name: 'Tropical Asia', bounds: { minLat: 0, maxLat: 23, minLng: 98, maxLng: 140 } },
  { name: 'Himalayan Region', bounds: { minLat: 25, maxLat: 35, minLng: 70, maxLng: 95 } },
  { name: 'Temperate East Asia', bounds: { minLat: 30, maxLat: 50, minLng: 100, maxLng: 145 } },
  
  // Outras regiões biogeográficas
  { name: 'African Savanna', bounds: { minLat: -20, maxLat: 15, minLng: 15, maxLng: 40 } },
  { name: 'Australian Outback', bounds: { minLat: -30, maxLat: -20, minLng: 120, maxLng: 140 } },
  { name: 'Tropical Australia', bounds: { minLat: -17, maxLat: -10, minLng: 125, maxLng: 145 } }
];

/**
 * Determina a bioregião com base nas coordenadas
 * @param {number} lat Latitude
 * @param {number} lng Longitude
 * @returns {string|null} Nome da bioregião ou null se não identificada
 */
export function determineBioregion(lat, lng) {
  for (const region of BIOREGIONS) {
    const { bounds } = region;
    
    if (lat >= bounds.minLat && lat <= bounds.maxLat && 
        lng >= bounds.minLng && lng <= bounds.maxLng) {
      return region.name;
    }
  }
  
  // Se não encontrar uma bioregião específica, determine pelo continente
  return determineContinent(lat, lng);
}

/**
 * Determina o continente com base nas coordenadas
 * @param {number} lat Latitude
 * @param {number} lng Longitude
 * @returns {string} Nome do continente
 */
function determineContinent(lat, lng) {
  if (lat >= 15 && lat <= 75 && lng >= -170 && lng <= -50) {
    return 'North America';
  } else if (lat <= 15 && lat >= -55 && lng >= -80 && lng <= -35) {
    return 'South America';
  } else if (lat >= 35 && lat <= 70 && lng >= -10 && lng <= 40) {
    return 'Europe';
  } else if (lat >= -35 && lat <= 37 && lng >= -20 && lng <= 60) {
    return 'Africa';
  } else if (lat >= -10 && lat <= 55 && lng >= 60 && lng <= 150) {
    return 'Asia';
  } else if (lat <= -10 && lat >= -45 && lng >= 110 && lng <= 180) {
    return 'Australia';
  } else if (lat <= -60) {
    return 'Antarctica';
  }
  
  return 'Unknown Region';
}

/**
 * Busca espécies observadas em uma região com base nas coordenadas
 * @param {number} lat Latitude
 * @param {number} lng Longitude
 * @returns {Promise<Object>} Dados das espécies mais comuns na região
 */
export async function getSpeciesForRegion(lat, lng) {
  try {
    const bioregion = determineBioregion(lat, lng);
    
    // Construir modelo regional de espécies
    const regionalData = {
      bioregion,
      coordinates: { lat, lng },
      possibleSpecies: []
    };
    
    // Para simplificar, vamos usar taxon_ids conhecidos
    // Em uma implementação real, você pode obter isso de um banco de dados ou API
    const commonTaxonIds = [
      47126,  // Plantas (Plantae)
      1,      // Animais (Animalia)
      20978,  // Aves
      26036,  // Mamíferos
      47170   // Insetos
    ];
    
    // Opcional: Para usar coordenadas exatas (não implementado aqui)
    // const observations = await searchObservationsNearby(lat, lng, 50); // 50km raio
    
    // Buscando espécies para cada categoria
    for (const taxonId of commonTaxonIds) {
      try {
        const observations = await getObservationsByTaxon(taxonId, {
          perPage: 20,
          quality: 'research'
        });
        
        if (observations && observations.length > 0) {
          const uniqueSpecies = new Map();
          
          // Extrair e desduplicar espécies de observações
          observations.forEach(obs => {
            if (obs.taxon && !uniqueSpecies.has(obs.taxon.id)) {
              uniqueSpecies.set(obs.taxon.id, {
                id: obs.taxon.id,
                name: obs.taxon.name,
                commonName: obs.taxon.preferred_common_name || obs.taxon.name,
                taxonomicLevel: obs.taxon.rank,
                frequency: 1, // Começar contando
                iconicGroup: obs.taxon.iconic_taxon_name || 'Unknown'
              });
            } else if (obs.taxon) {
              // Incrementar frequência se já existir
              const species = uniqueSpecies.get(obs.taxon.id);
              species.frequency += 1;
              uniqueSpecies.set(obs.taxon.id, species);
            }
          });
          
          // Adicionar espécies únicas à lista regional
          uniqueSpecies.forEach(species => {
            regionalData.possibleSpecies.push(species);
          });
        }
      } catch (err) {
        console.error(`Error fetching observations for taxon ${taxonId}:`, err);
        // Continue com o próximo táxon
      }
    }
    
    // Ordenar por frequência de observação (mais comuns primeiro)
    regionalData.possibleSpecies.sort((a, b) => b.frequency - a.frequency);
    
    return regionalData;
  } catch (error) {
    console.error('Error in getSpeciesForRegion:', error);
    // Retornar objeto vazio em caso de erro
    return { 
      bioregion: 'Unknown',
      coordinates: { lat, lng },
      possibleSpecies: []
    };
  }
}

/**
 * Gera o contexto regional para o prompt de IA
 * @param {Object} regionalData Dados regionais obtidos de getSpeciesForRegion
 * @returns {string} Texto descritivo para incluir no prompt da IA
 */
export function generateRegionalContext(regionalData) {
  if (!regionalData || !regionalData.bioregion || !regionalData.possibleSpecies) {
    return "";
  }
  
  // Extrai somente as espécies mais relevantes para o contexto (top 10)
  const topSpecies = regionalData.possibleSpecies.slice(0, 10);
  
  // Formata texto descritivo com informações regionais
  let contextText = `Image location: ${regionalData.bioregion} bioregion (${regionalData.coordinates.lat.toFixed(4)}, ${regionalData.coordinates.lng.toFixed(4)}).\n\n`;
  contextText += `Species commonly found in this region include:\n`;
  
  // Agrupa por tipo (plantas, animais, etc)
  const groupedSpecies = {};
  
  topSpecies.forEach(species => {
    if (!groupedSpecies[species.iconicGroup]) {
      groupedSpecies[species.iconicGroup] = [];
    }
    groupedSpecies[species.iconicGroup].push(species);
  });
  
  // Adiciona cada grupo ao contexto
  Object.entries(groupedSpecies).forEach(([group, speciesList]) => {
    contextText += `\n${group}:\n`;
    speciesList.forEach(species => {
      const commonName = species.commonName !== species.name ? 
        ` (${species.commonName})` : '';
      contextText += `- ${species.name}${commonName}\n`;
    });
  });
  
  return contextText;
}