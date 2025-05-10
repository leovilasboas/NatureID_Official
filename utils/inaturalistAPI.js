/**
 * Utilitário para interagir com a API do iNaturalist
 * Provê funções para buscar dados de espécies e suas distribuições geográficas
 * Inclui funções para buscar espécies por características visuais e localização
 */

// Constantes
const INATURALIST_API_BASE = 'https://api.inaturalist.org/v1';

/**
 * Busca táxons pelo nome científico ou comum usando uma consulta de texto livre
 * @param {string} query - Texto para busca (nome comum ou científico)
 * @param {Object} options - Opções adicionais para a busca
 * @param {number} options.perPage - Número de resultados por página (default: 10)
 * @param {boolean} options.preferCommonNames - Se deve priorizar nomes comuns nos resultados
 * @returns {Promise<Array>} Lista de táxons correspondentes
 */
export async function searchTaxaByQuery(query, options = {}) {
  try {
    const apiToken = process.env.INATURALIST_API_TOKEN;
   
    if (!apiToken) {
      console.error('Token da API do iNaturalist não encontrado nas variáveis de ambiente');
      throw new Error('Token da API não configurado');
    }
   
    const {
      perPage = 10,
      preferCommonNames = true
    } = options;
   
    const params = new URLSearchParams({
      q: query,
      per_page: perPage,
      preferred_place_id: 1, // Global
      locale: 'pt-BR'  // Preferência para nomes em português
    });
   
    const response = await fetch(`${INATURALIST_API_BASE}/taxa?${params.toString()}`, {
      headers: {
        'Authorization': `JWT ${apiToken}`,
        'Content-Type': 'application/json'
      }
    });
   
    if (!response.ok) {
      throw new Error(`Erro na API do iNaturalist: ${response.status} ${response.statusText}`);
    }
   
    const data = await response.json();
   
    return data.results || [];
  } catch (error) {
    console.error('Erro ao buscar táxons pela consulta:', error);
    throw error;
  }
}

/**
 * Busca observações com base em características visuais e localização
 * @param {Object} features - Características visuais extraídas da imagem pela IA
 * @param {Object} location - Dados de localização
 * @returns {Promise<Object>} Resultados processados com possíveis correspondências
 */
export async function searchObservationsByFeatures(features, location) {
  try {
    // Extrair dados relevantes das características
    const { category, taxonomicHints, visualFeatures, searchTerms, regionalRelevance } = features;
    
    // Mapeamento de características para besouros conhecidos da Amazônia
    const amazonBeetles = checkForKnownAmazonianBeetles(features, location);
    if (amazonBeetles.length > 0) {
      console.log("Detected potential known Amazonian beetle species: ", amazonBeetles);
    }
    
    // Extrair cores principais para filtragem posterior
    const primaryColors = [];
    if (visualFeatures && visualFeatures.colors && visualFeatures.colors.length > 0) {
      // Transformar cores compostas em cores primárias
      for (const color of visualFeatures.colors) {
        const colorLower = color.toLowerCase();
        if (colorLower.includes('black')) primaryColors.push('black');
        if (colorLower.includes('white')) primaryColors.push('white');
        if (colorLower.includes('red')) primaryColors.push('red');
        if (colorLower.includes('blue')) primaryColors.push('blue');
        if (colorLower.includes('green')) primaryColors.push('green');
        if (colorLower.includes('yellow')) primaryColors.push('yellow');
        if (colorLower.includes('orange')) primaryColors.push('orange');
        if (colorLower.includes('brown')) primaryColors.push('brown');
        if (colorLower.includes('grey') || colorLower.includes('gray')) primaryColors.push('gray');
        if (colorLower.includes('purple')) primaryColors.push('purple');
        if (colorLower.includes('metallic')) primaryColors.push('metallic');
      }
    }
    console.log("Primary colors for filtering:", primaryColors);
   
    // Construir busca para iNaturalist
    const searchPromises = [];
    
    // Determinar região para refinar busca
    let regionPrefix = '';
    if (location && location.coords) {
      const { lat, lng } = location.coords;
      
      // Adaptar busca para regiões específicas
      if (isInAmazon(lat, lng)) {
        regionPrefix = 'amazônia ';
      } else if (lat >= -30 && lat <= -5 && lng >= -55 && lng <= -35) {
        regionPrefix = 'mata atlântica ';
      } else if (lat >= -24 && lat <= -5 && lng >= -60 && lng <= -42) {
        regionPrefix = 'cerrado ';
      }
    }
   
    // 1. Buscar por termos de busca gerados pela IA, refinados com região
    if (searchTerms && searchTerms.length > 0) {
      // Limitar a 3 termos de busca para não sobrecarregar
      const topSearchTerms = searchTerms.slice(0, 3);
     
      for (const term of topSearchTerms) {
        // Adicionar busca com região específica se disponível
        if (regionPrefix) {
          searchPromises.push(searchTaxaByQuery(`${regionPrefix}${term}`, { perPage: 5 }));
        }
        searchPromises.push(searchTaxaByQuery(term, { perPage: 5 }));
      }
    }
   
    // 2. Buscar por dicas taxonômicas, refinadas com região
    if (taxonomicHints && taxonomicHints.length > 0) {
      // Limitar a 2 dicas taxonômicas
      const topTaxonomicHints = taxonomicHints.slice(0, 2);
     
      for (const hint of topTaxonomicHints) {
        // Adicionar busca com região específica se disponível
        if (regionPrefix) {
          searchPromises.push(searchTaxaByQuery(`${regionPrefix}${hint}`, { perPage: 5 }));
        }
        searchPromises.push(searchTaxaByQuery(hint, { perPage: 5 }));
      }
    }
   
    // Esperar todas as buscas completarem
    const searchResults = await Promise.all(searchPromises);
   
    // Unir e deduplicar resultados
    const allTaxa = [];
    const seenTaxonIds = new Set();
    
    // Priorizar besouros específicos da Amazônia se detectados
    if (amazonBeetles.length > 0) {
      for (const beetleName of amazonBeetles) {
        // Buscar por esse nome específico de besouro
        try {
          const beetleResults = await searchTaxaByQuery(beetleName, { perPage: 3 });
          
          // Adicionar resultados ao conjunto
          beetleResults.forEach(taxon => {
            if (!seenTaxonIds.has(taxon.id)) {
              seenTaxonIds.add(taxon.id);
              // Adicionar como prioritário no início da lista
              allTaxa.unshift(taxon);
            }
          });
        } catch (error) {
          console.error(`Erro ao buscar espécie específica ${beetleName}:`, error);
        }
      }
    }
   
    searchResults.flat().forEach(taxon => {
      if (!seenTaxonIds.has(taxon.id)) {
        seenTaxonIds.add(taxon.id);
        allTaxa.push(taxon);
      }
    });
   
    // Para cada táxon, buscar observações próximas à localização fornecida (se disponível)
    const taxaWithObservations = [];
   
    for (const taxon of allTaxa.slice(0, 20)) { // Aumentado para 20 táxons para ter mais opções de top-10
      try {
        let observations;
       
        if (location && location.coords) {
          // Buscar observações deste táxon próximas à localização
          const { lat, lng } = location.coords;
          observations = await getNearbyObservationsForTaxon(taxon.id, lat, lng, 100); // 100km raio
        } else {
          // Sem localização, buscar observações gerais
          observations = await getObservationsByTaxon(taxon.id, { perPage: 10 });
        }
       
        // Calcular pontuação de relevância
        // Aqui podemos adicionar lógica para pontuar com base em quão bem as características visuais combinam
        const matchScore = calculateMatchScore(taxon, observations, features, location);
       
        taxaWithObservations.push({
          taxon,
          observations: observations.slice(0, 5), // Limitar a 5 observações
          matchScore
        });
      } catch (error) {
        console.error(`Erro ao buscar observações para táxon ${taxon.id}:`, error);
        // Continuar com o próximo táxon
      }
    }
   
    // Ordenar por pontuação de relevância
    taxaWithObservations.sort((a, b) => b.matchScore - a.matchScore);
    
    // Filtro adicional: remover resultados com incompatibilidade visual óbvia
    const filteredResults = taxaWithObservations.filter(item => {
      // Se a pontuação é muito baixa, remover
      if (item.matchScore < 0.1) return false;
      
      // Verificar compatibilidade de cor se temos cores primárias
      if (primaryColors.length > 0) {
        const taxonName = item.taxon.name?.toLowerCase() || '';
        const taxonCommonName = item.taxon.preferred_common_name?.toLowerCase() || '';
        const taxonSummary = item.taxon.wikipedia_summary?.toLowerCase() || '';
        const allText = taxonName + ' ' + taxonCommonName + ' ' + taxonSummary;
        
        // Verificar se pelo menos uma das cores primárias é mencionada
        const colorMatch = primaryColors.some(color => allText.includes(color));
        
        // Se não há menção de nenhuma cor primária, considerar incompatível
        if (!colorMatch && primaryColors.length > 1) return false;
      }
      
      return true;
    });
    
    console.log(`Filtered out ${taxaWithObservations.length - filteredResults.length} incompatible results`);
   
    // Construir resposta final
    return {
      query: {
        category,
        visualFeatures,
        searchTerms,
        location: location ? {
          coords: location.coords,
          name: location.name || 'Location provided'
        } : null
      },
      results: filteredResults.length > 0 ? filteredResults : taxaWithObservations,
      totalMatches: filteredResults.length > 0 ? filteredResults.length : taxaWithObservations.length
    };
  } catch (error) {
    console.error('Erro na busca por características:', error);
    throw error;
  }
}

/**
 // Obter observações próximas a uma localização para um táxon específico
  * @param {number} taxonId - ID do táxon
  * @param {number} lat - Latitude
  * @param {number} lng - Longitude
  * @param {number} radiusKm - Raio de busca em quilômetros (default: 500)
  * @returns {Promise<Array>} Lista de observações
  */
 async function getNearbyObservationsForTaxon(taxonId, lat, lng, radiusKm = 500) {
  try {
    const apiToken = process.env.INATURALIST_API_TOKEN;
   
    if (!apiToken) {
      console.error('Token da API do iNaturalist não encontrado nas variáveis de ambiente');
      throw new Error('Token da API não configurado');
    }
   
    // Verificar se estamos na Amazônia
    const isAmazonRegion = isInAmazon(lat, lng);
    
    // Se estamos na Amazônia, buscar em toda a região amazônica, não apenas no raio específico
    if (isAmazonRegion) {
      // Usar coordenadas aproximadas do centro da Amazônia para busca mais ampla
      const params = new URLSearchParams({
        taxon_id: taxonId,
        swlat: -10.0, // Latitude sudoeste aproximada da Amazônia
        swlng: -80.0, // Longitude sudoeste aproximada da Amazônia
        nelat: 5.0,   // Latitude nordeste aproximada da Amazônia
        nelng: -50.0, // Longitude nordeste aproximada da Amazônia
        per_page: 30,
        quality_grade: 'research',
        photos: true,
        geo: true
      });
      
      const response = await fetch(`${INATURALIST_API_BASE}/observations?${params.toString()}`, {
        headers: {
          'Authorization': `JWT ${apiToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erro na API do iNaturalist: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.results || [];
    } else {
      // Para outras regiões, usar a busca por raio normal
      // Converter raio para graus (aproximação)
      // 1 grau de latitude ~= 111km
      const radiusDegrees = radiusKm / 111;
    
      const params = new URLSearchParams({
        taxon_id: taxonId,
        lat: lat,
        lng: lng,
        radius: radiusDegrees,
        per_page: 30,
        quality_grade: 'research',
        photos: true,
        geo: true
      });
   
      const response = await fetch(`${INATURALIST_API_BASE}/observations?${params.toString()}`, {
        headers: {
          'Authorization': `JWT ${apiToken}`,
          'Content-Type': 'application/json'
        }
      });
     
      if (!response.ok) {
        throw new Error(`Erro na API do iNaturalist: ${response.status} ${response.statusText}`);
      }
     
      const data = await response.json();
     
      return data.results || [];
    }
  } catch (error) {
    console.error('Erro ao buscar observações próximas:', error);
    throw error;
  }
}

/**
 * Calcula uma pontuação de relevância para uma correspondência
 * @param {Object} taxon - Dados do táxon
 * @param {Array} observations - Observações do táxon
 * @param {Object} features - Características extraídas da imagem
 * @param {Object} location - Dados de localização
 * @returns {number} Pontuação de relevância (0-1)
 */
function calculateMatchScore(taxon, observations, features, location) {
  let score = 0.3; // Pontuação base menor para dar mais peso a fatores específicos
 
  // Fator 1: Se há observações próximas à localização fornecida (peso aumentado)
  if (location && observations.length > 0) {
    // Calcular pontuação baseada na quantidade de observações locais
    const localObservationBonus = Math.min(0.4, observations.length * 0.05);
    score += localObservationBonus;
    
    // Priorizar espécies com observações na mesma bioregião
    if (location.coords) {
      const bioregiaoAmazonica = isInAmazon(location.coords.lat, location.coords.lng);
      const temObservacoesAmazonicas = observations.some(obs => 
        obs.geojson && isInAmazon(obs.geojson.coordinates[1], obs.geojson.coordinates[0])
      );
      
      // Bônus significativo para correspondências na mesma bioregião
      if (bioregiaoAmazonica && temObservacoesAmazonicas) {
        score += 0.25;
      }
    }
  }
 
  // Fator 2: Correspondência de categoria (planta/animal)
  if (taxon.iconic_taxon_name && features.category) {
    const taxonCategory = taxon.iconic_taxon_name.toLowerCase();
    const featureCategory = features.category.toLowerCase();
   
    if ((taxonCategory === 'plantae' && featureCategory === 'plant') ||
        (taxonCategory !== 'plantae' && featureCategory === 'animal')) {
      score += 0.15;
    }
  }
 
  // Fator 3: Correspondência de estruturas visuais e características (peso MUITO aumentado)
  if (features.visualFeatures) {
    let visualMatchCount = 0;
    let visualMismatchCount = 0;
    
    const summary = taxon.wikipedia_summary ? taxon.wikipedia_summary.toLowerCase() : '';
    const name = taxon.name ? taxon.name.toLowerCase() : '';
    const commonName = taxon.preferred_common_name ? taxon.preferred_common_name.toLowerCase() : '';
    // Combine todos os textos disponíveis para busca
    const allText = summary + ' ' + name + ' ' + commonName;
    
    // Verificar correspondência de cores (CRÍTICO)
    if (features.visualFeatures.colors && features.visualFeatures.colors.length > 0) {
      let colorMatched = false;
      for (const color of features.visualFeatures.colors) {
        const colorLower = color.toLowerCase();
        if (allText.includes(colorLower)) {
          visualMatchCount += 2; // Peso maior para cores
          colorMatched = true;
        }
      }
      
      // Penalidade significativa se NENHUMA cor corresponder
      if (!colorMatched && features.visualFeatures.colors.length > 1) {
        visualMismatchCount += 5;
      }
    }
    
    // Verificar correspondência de padrões
    if (features.visualFeatures.patterns) {
      for (const pattern of features.visualFeatures.patterns) {
        if (allText.includes(pattern.toLowerCase())) {
          visualMatchCount++;
        }
      }
    }
    
    // Verificar correspondência de estruturas distintivas
    if (features.visualFeatures.distinctiveFeatures) {
      for (const feature of features.visualFeatures.distinctiveFeatures) {
        const featureLower = feature.toLowerCase();
        if (allText.includes(featureLower)) {
          visualMatchCount += 2; // Peso maior para características distintivas
        } else {
          // Penalizar características distintivas ausentes
          visualMismatchCount++;
        }
      }
    }
    
    // Bonus baseado na quantidade de características visuais correspondentes
    score += Math.min(0.4, visualMatchCount * 0.1);
    
    // Penalidade severa para incompatibilidades visuais
    score -= Math.min(0.7, visualMismatchCount * 0.15);
  }
  
  // Fator 4: Especificidade taxonômica (FORTEMENTE favorece identificações mais específicas)
  if (taxon.rank_level) {
    // Penalizar fortemente classificações genéricas como "Insecta"
    // rank_level: 10=Reino, 20=Filo, 30=Classe, 40=Ordem, 50=Família, 60=Gênero, 70=Espécie
    if (taxon.rank_level <= 30) {
      // Classificações muito genéricas (Reino, Filo, Classe) recebem severa penalidade
      score -= 0.4;
    } else if (taxon.rank_level <= 40) {
      // Ordem (ex: Coleoptera) recebe penalidade moderada
      score -= 0.2;
    } else if (taxon.rank_level >= 70) {
      // Espécies recebem um bônus grande
      score += 0.5;
    } else if (taxon.rank_level >= 60) {
      // Gêneros recebem um bônus médio
      score += 0.3;
    } else if (taxon.rank_level >= 50) {
      // Famílias recebem um bônus pequeno
      score += 0.15;
    }
    
    // Informação adicional de nomenclatura em latim favorecida
    if (taxon.name && taxon.name.includes(' ')) {
      // Nomes binomiais (espécies) são favorecidos
      score += 0.2;
    }
  }
 
  // Limitar pontuação entre 0 e 1
  // Se for uma classificação muito genérica (Classe ou superior) e temos features detalhadas, reduzir drasticamente
  // Verificar se a classificação do banco de dados é muito genérica (Classe ou superior) e temos features detalhadas
  if (taxon.rank_level <= 30 && features.visualFeatures && 
      ((features.visualFeatures.colors && features.visualFeatures.colors.length > 1) || 
       (features.visualFeatures.patterns && features.visualFeatures.patterns.length > 0))) {
    // Quando temos detalhes visuais claros, penalizar SEVERAMENTE identificações vagas como "Insecta"
    score = Math.max(0, score - 0.9);
  } else if (taxon.rank_level <= 40 && features.visualFeatures && 
            ((features.visualFeatures.colors && features.visualFeatures.colors.length > 1) || 
             (features.visualFeatures.patterns && features.visualFeatures.patterns.length > 0))) {
    // Penalizar identificações de nível de ordem quando temos detalhes visuais
    score = Math.max(0, score - 0.8);  
  }
  
  // Verificar correspondência de região - penalizar severamente se o táxon não ocorre na região da foto
  if (location && location.coords) {
    const isLocationAmazon = isInAmazon(location.coords.lat, location.coords.lng);
    const isAmazonianTaxon = taxon.name && (
      taxon.wikipedia_summary?.toLowerCase().includes('amazon') ||
      taxon.preferred_common_name?.toLowerCase().includes('amazon')
    );
    
    // Se a foto é da Amazônia mas o táxon não tem relação com a Amazônia, reduzir drasticamente a pontuação
    // Isso só se aplica para identificações específicas (família ou mais específico)
    if (isLocationAmazon && !isAmazonianTaxon && taxon.rank_level >= 50) {
      // Verificar se há observações na região
      const hasObservationsInRegion = observations && observations.some(obs => 
        obs.geojson && isInAmazon(obs.geojson.coordinates[1], obs.geojson.coordinates[0])
      );
      
      if (!hasObservationsInRegion) {
        score -= 0.7; // Penalidade severa para espécies que não ocorrem na região
      }
    }
  }
  
  return Math.min(1, Math.max(0, score));
}

// Função para verificar se coordenadas estão na região amazônica
function isInAmazon(lat, lng) {
  // Coordenadas aproximadas da bacia amazônica
  return (lat >= -9.5 && lat <= 5 && lng >= -79 && lng <= -50);
}

// Função para detectar besouros conhecidos da Amazônia com base nas características visuais
function checkForKnownAmazonianBeetles(features, location) {
  const matchedBeetles = [];
  
  // Verificar se estamos na Amazônia ou próximo
  const isAmazonian = location && location.coords && isInAmazon(location.coords.lat, location.coords.lng);
  
  // Se não for da Amazônia, retornar lista vazia
  if (!isAmazonian && location) return matchedBeetles;
  
  // Se não temos localização, verificamos de qualquer forma para ter mais opções
  
  // Verificar se é um inseto/besouro
  const isInsect = features.category === 'insect' || 
                   (features.taxonomicHints && 
                    (typeof features.taxonomicHints === 'object' ? 
                      Object.values(features.taxonomicHints).some(hint => 
                        hint && hint.toLowerCase().includes('insect') || hint.toLowerCase().includes('beetle') || 
                        hint.toLowerCase().includes('coleoptera')
                      ) : 
                      features.taxonomicHints.some(hint => 
                        hint && hint.toLowerCase().includes('insect') || hint.toLowerCase().includes('beetle') || 
                        hint.toLowerCase().includes('coleoptera')
                      )
                    ));
  
  if (!isInsect) return matchedBeetles;
  
  // Extrair características visuais
  const colors = features.visualFeatures?.colors || [];
  const patterns = features.visualFeatures?.patterns || [];
  const structures = features.visualFeatures?.structures || [];
  const distinctiveFeatures = features.visualFeatures?.distinctiveFeatures || [];
  
  // Converter para texto para facilitar a busca
  const visualDescription = [
    ...colors, 
    ...patterns, 
    ...structures, 
    ...distinctiveFeatures
  ].map(f => f?.toLowerCase?.() || '').join(' ');
  
  // Detectar besouro de escaravelho (Scarabaeidae) - besouros conhecidos da Amazônia
  if (visualDescription.includes('metallic') && 
      (visualDescription.includes('green') || visualDescription.includes('blue') || visualDescription.includes('bronze')) &&
      (visualDescription.includes('horn') || visualDescription.includes('pronotum') || visualDescription.includes('abdomen'))) {
    matchedBeetles.push('Phanaeus lancifer');
  }
  
  // Besouro rinoceronte ou besouro-hércules (Dynastes hercules)
  if ((visualDescription.includes('horn') || visualDescription.includes('rhinoceros')) && 
      visualDescription.includes('large') && 
      (visualDescription.includes('black') || visualDescription.includes('brown'))) {
    matchedBeetles.push('Dynastes hercules');
  }
  
  // Besouro-de-chifre
  if (visualDescription.includes('horn') && 
      (visualDescription.includes('pronotum') || visualDescription.includes('thorax')) && 
      (visualDescription.includes('black') || visualDescription.includes('brown'))) {
    matchedBeetles.push('Megasoma actaeon');
  }
  
  // Besouro Titan (Titanus giganteus) - um dos maiores besouros do mundo
  if (visualDescription.includes('large') && 
      (visualDescription.includes('titan') || visualDescription.includes('gigant')) && 
      (visualDescription.includes('brown') || visualDescription.includes('mandible'))) {
    matchedBeetles.push('Titanus giganteus');
  }
  
  // Weevil (Curculionidae)
  if ((visualDescription.includes('snout') || visualDescription.includes('rostrum')) && 
      visualDescription.includes('elongated')) {
    matchedBeetles.push('Curculionidae');
  }
  
  // Besouro longhorn (Cerambycidae)
  if ((visualDescription.includes('long antennae') || visualDescription.includes('longhorn')) && 
      (visualDescription.includes('cylindrical') || visualDescription.includes('elongated'))) {
    matchedBeetles.push('Cerambycidae');
  }
  
  return matchedBeetles;
}

/**
 * Busca informações de um táxon específico pelo nome científico
 * @param {string} taxonName - Nome científico do táxon (ex: "Panthera leo")
 * @returns {Promise<Object>} Dados do táxon
 */
export async function getTaxonByName(taxonName) {
  try {
    const apiToken = process.env.INATURALIST_API_TOKEN;
    
    if (!apiToken) {
      console.error('Token da API do iNaturalist não encontrado nas variáveis de ambiente');
      throw new Error('Token da API não configurado');
    }
    
    const response = await fetch(`${INATURALIST_API_BASE}/taxa?q=${encodeURIComponent(taxonName)}&per_page=1`, {
      headers: {
        'Authorization': `JWT ${apiToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro na API do iNaturalist: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.total_results === 0 || !data.results || data.results.length === 0) {
      throw new Error(`Táxon não encontrado: ${taxonName}`);
    }
    
    return data.results[0];
  } catch (error) {
    console.error('Erro ao buscar táxon pelo nome:', error);
    throw error;
  }
}

/**
 * Busca informações de um táxon específico pelo ID
 * @param {number} taxonId - ID do táxon na API do iNaturalist
 * @returns {Promise<Object>} Dados do táxon
 */
export async function getTaxonById(taxonId) {
  try {
    const apiToken = process.env.INATURALIST_API_TOKEN;
    
    if (!apiToken) {
      console.error('Token da API do iNaturalist não encontrado nas variáveis de ambiente');
      throw new Error('Token da API não configurado');
    }
    
    const response = await fetch(`${INATURALIST_API_BASE}/taxa/${taxonId}`, {
      headers: {
        'Authorization': `JWT ${apiToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro na API do iNaturalist: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      throw new Error(`Táxon não encontrado com ID: ${taxonId}`);
    }
    
    return data.results[0];
  } catch (error) {
    console.error('Erro ao buscar táxon pelo ID:', error);
    throw error;
  }
}

/**
 * Busca observações de um táxon específico
 * @param {number} taxonId - ID do táxon na API do iNaturalist
 * @param {Object} options - Opções adicionais para a busca
 * @param {number} options.perPage - Número de resultados por página (default: 10)
 * @param {number} options.page - Número da página (default: 1)
 * @param {string} options.quality - Qualidade da observação (default: 'research')
 * @returns {Promise<Array>} Lista de observações
 */
export async function getObservationsByTaxon(taxonId, options = {}) {
  try {
    const apiToken = process.env.INATURALIST_API_TOKEN;
    
    if (!apiToken) {
      console.error('Token da API do iNaturalist não encontrado nas variáveis de ambiente');
      throw new Error('Token da API não configurado');
    }
    
    const {
      perPage = 10,
      page = 1,
      quality = 'research'
    } = options;
    
    const params = new URLSearchParams({
      taxon_id: taxonId,
      per_page: perPage,
      page: page,
      quality_grade: quality,
      photos: true, // Apenas observações com fotos
      geo: true     // Apenas observações com dados geográficos
    });
    
    const response = await fetch(`${INATURALIST_API_BASE}/observations?${params.toString()}`, {
      headers: {
        'Authorization': `JWT ${apiToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro na API do iNaturalist: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return data.results || [];
  } catch (error) {
    console.error('Erro ao buscar observações:', error);
    throw error;
  }
}

/**
 * Obtém dados da distribuição geográfica de um táxon
 * @param {number} taxonId - ID do táxon na API do iNaturalist
 * @returns {Promise<Object>} Dados geográficos do táxon
 */
export async function getTaxonGeographicData(taxonId) {
  try {
    // Primeiro, obter detalhes do táxon
    const taxonData = await getTaxonById(taxonId);
    
    // Buscar observações para mapear a distribuição com dados geográficos
    const observations = await getObservationsByTaxon(taxonId, { perPage: 100 });
    
    // Extrair pontos de observação reais
    const observationPoints = [];
    observations.forEach(obs => {
      if (obs.geojson && obs.geojson.coordinates) {
        const [longitude, latitude] = obs.geojson.coordinates;
        observationPoints.push({
          lat: latitude,
          lng: longitude,
          id: obs.id,
          quality: obs.quality_grade,
          observed_on: obs.observed_on,
          place: obs.place_guess || 'Unknown location'
        });
      }
    });
    
    // Processar informações taxonômicas para determinar regiões nativas
    const nativeRegions = [];
    const introducedRegions = [];
    
    // Analisar a ancestralidade e detalhes do táxon para determinar região de origem
    if (taxonData.establishment_means) {
      if (taxonData.establishment_means.establishment_means === 'native') {
        if (taxonData.establishment_means.place) {
          nativeRegions.push(mapPlaceToRegion(taxonData.establishment_means.place));
        }
      } else if (taxonData.establishment_means.establishment_means === 'introduced') {
        if (taxonData.establishment_means.place) {
          introducedRegions.push(mapPlaceToRegion(taxonData.establishment_means.place));
        }
      }
    }
    
    // Se não conseguirmos extrair as regiões diretamente, faça uma estimativa baseada na distribuição dos avistamentos
    if (nativeRegions.length === 0 && observations.length > 0) {
      // Mapear observações para regiões continentais
      const regionCounts = {};
      
      observations.forEach(obs => {
        if (obs.geojson && obs.geojson.coordinates) {
          const [longitude, latitude] = obs.geojson.coordinates;
          const region = determineRegionFromCoordinates(latitude, longitude);
          
          if (region) {
            regionCounts[region] = (regionCounts[region] || 0) + 1;
          }
        }
      });
      
      // Calcular densidades por região
      const totalObservations = Object.values(regionCounts).reduce((sum, count) => sum + count, 0);
      const densities = {};
      
      Object.entries(regionCounts).forEach(([region, count]) => {
        densities[region] = count / totalObservations;
      });
      
      // Determinar regiões nativas (as com maior densidade)
      const sortedRegions = Object.entries(densities)
        .sort((a, b) => b[1] - a[1]);
      
      // As regiões com maior concentração são provavelmente nativas
      if (sortedRegions.length > 0) {
        // A região com maior densidade é considerada nativa
        nativeRegions.push(sortedRegions[0][0]);
        
        // Regiões com densidade significativa também são consideradas nativas
        sortedRegions.slice(1).forEach(([region, density]) => {
          if (density > 0.15) { // Limite arbitrário para considerar uma região como nativa
            nativeRegions.push(region);
          } else if (density > 0.05) { // Limite para regiões onde a espécie foi introduzida
            introducedRegions.push(region);
          }
        });
      }
      
      console.log(`Dados do iNaturalist: ${observations.length} observações, ${observationPoints.length} pontos com coordenadas`);
      
      return {
        taxon_id: taxonId,
        scientific_name: taxonData.name,
        common_name: taxonData.preferred_common_name || '',
        regions: Object.keys(densities),
        mainHabitat: determineHabitatFromTaxonData(taxonData),
        density: densities,
        nativeRegions,
        introducedRegions,
        observationPoints, // Adicionando os pontos de observação reais
        photos: observations.map(obs => obs.photos?.[0]?.url || null).filter(Boolean).slice(0, 5) // Adicionando fotos de referência
      };
    }
    
    // Se não conseguimos obter dados suficientes
    return {
      taxon_id: taxonId,
      scientific_name: taxonData.name,
      common_name: taxonData.preferred_common_name || '',
      regions: ["Not available"],
      mainHabitat: "Unknown",
      density: {},
      nativeRegions: [],
      introducedRegions: [],
      observationPoints, // Mesmo sem dados regionais, retornamos os pontos que temos
      photos: observations.map(obs => obs.photos?.[0]?.url || null).filter(Boolean).slice(0, 5) // Adicionando fotos de referência
    };
  } catch (error) {
    console.error('Erro ao obter dados geográficos:', error);
    throw error;
  }
}

/**
 * Determina a região continental a partir de coordenadas
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @returns {string|null} Nome da região continental ou null se não for possível determinar
 */
function determineRegionFromCoordinates(latitude, longitude) {
  // Lógica simplificada para determinar o continente
  if (latitude >= 15 && latitude <= 75 && longitude >= -170 && longitude <= -50) {
    return 'North America';
  } else if (latitude <= 15 && latitude >= -55 && longitude >= -80 && longitude <= -35) {
    return 'South America';
  } else if (latitude >= 35 && latitude <= 70 && longitude >= -10 && longitude <= 40) {
    return 'Europe';
  } else if (latitude >= -35 && latitude <= 37 && longitude >= -20 && longitude <= 60) {
    return 'Africa';
  } else if (latitude >= -10 && latitude <= 55 && longitude >= 60 && longitude <= 150) {
    return 'Asia';
  } else if (latitude <= -10 && latitude >= -45 && longitude >= 110 && longitude <= 180) {
    return 'Australia';
  } else if (latitude <= -60) {
    return 'Antarctica';
  }
  
  return null;
}

/**
 * Mapeia uma localização para uma região continental
 * @param {Object} place - Objeto de lugar do iNaturalist
 * @returns {string} Nome da região continental
 */
function mapPlaceToRegion(place) {
  // Mapear nomes de locais para regiões continentais
  const placeNameLower = (place.name || '').toLowerCase();
  
  if (placeNameLower.includes('north america') || 
      placeNameLower.includes('usa') || 
      placeNameLower.includes('canada') || 
      placeNameLower.includes('mexico')) {
    return 'North America';
  } else if (placeNameLower.includes('south america') || 
             placeNameLower.includes('brazil') || 
             placeNameLower.includes('argentina')) {
    return 'South America';
  } else if (placeNameLower.includes('europe')) {
    return 'Europe';
  } else if (placeNameLower.includes('africa')) {
    return 'Africa';
  } else if (placeNameLower.includes('asia') || 
             placeNameLower.includes('china') || 
             placeNameLower.includes('india') || 
             placeNameLower.includes('japan')) {
    return 'Asia';
  } else if (placeNameLower.includes('australia') || 
             placeNameLower.includes('oceania')) {
    return 'Australia';
  } else if (placeNameLower.includes('antarctica')) {
    return 'Antarctica';
  }
  
  return 'Unknown';
}

/**
 * Determina o habitat principal de um táxon com base em seus dados
 * @param {Object} taxonData - Dados do táxon da API do iNaturalist
 * @returns {string} Tipo de habitat principal
 */
function determineHabitatFromTaxonData(taxonData) {
  // Tenta extrair informações de habitat das tags ou wikipedia_summary
  const wikipediaSummary = taxonData.wikipedia_summary || '';
  const tags = taxonData.tag_list || [];
  
  // Tipos de habitat que tentaremos identificar
  const habitatTypes = [
    'Desert', 'Tropical', 'Temperate', 'Arctic', 'Mountainous',
    'Coastal', 'Oceanic', 'Forest', 'Grassland', 'Wetland', 
    'Freshwater', 'Marine', 'Urban', 'Agricultural'
  ];
  
  // Verificar tags primeiro
  for (const tag of tags) {
    for (const habitat of habitatTypes) {
      if (tag.toLowerCase().includes(habitat.toLowerCase())) {
        return habitat;
      }
    }
  }
  
  // Verificar resumo da Wikipedia
  for (const habitat of habitatTypes) {
    if (wikipediaSummary.toLowerCase().includes(habitat.toLowerCase())) {
      return habitat;
    }
  }
  
  // Verificar ancestrais (para plantas/animais aquáticos, etc.)
  if (taxonData.ancestors) {
    for (const ancestor of taxonData.ancestors) {
      const name = (ancestor.name || '').toLowerCase();
      
      if (name.includes('marine') || name.includes('aquatic')) {
        return 'Oceanic';
      } else if (name.includes('forest')) {
        return 'Forest';
      }
    }
  }
  
  return 'Unknown';
}