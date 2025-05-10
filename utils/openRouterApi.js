/**
 * Utility for integrating OpenRouter API with iNaturalist database
 * Uses AI for feature extraction and matches against iNaturalist species database
 */

// The OpenRouter API endpoint
const OPENROUTER_API_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

// Definir modelos disponíveis - principal e backup
const MODELS = {
  PRIMARY: 'google/gemini-2.0-flash-exp:free',
  BACKUP: 'deepseek/deepseek-chat-v3-0324:free'
};

// Importar API do iNaturalist
import { 
  getTaxonByName, 
  getTaxonGeographicData, 
  searchObservationsByFeatures, 
  getObservationsByTaxon, 
  searchTaxaByQuery 
} from './inaturalistAPI';

// Funções auxiliares para formatação de resposta
function getCategory(taxon) {
  if (!taxon || !taxon.iconic_taxon_name) return "Unknown";
  
  const iconicName = taxon.iconic_taxon_name.toLowerCase();
  if (iconicName === 'plantae') return "plant";
  if (['animalia', 'actinopterygii', 'amphibia', 'arachnida', 'aves', 'mammalia', 'reptilia'].includes(iconicName)) {
    return "animal";
  }
  if (iconicName === 'fungi') return "fungus";
  return "other";
}

function formatDistribution(taxonData) {
  let text = "";
  
  if (taxonData.nativeRegions && taxonData.nativeRegions.length > 0) {
    text += `Native to ${taxonData.nativeRegions.join(', ')}. `;
  }
  
  if (taxonData.introducedRegions && taxonData.introducedRegions.length > 0) {
    text += `Introduced in ${taxonData.introducedRegions.join(', ')}. `;
  }
  
  if (text === "" && taxonData.regions && taxonData.regions.length > 0) {
    text += `Found in ${taxonData.regions.join(', ')}. `;
  }
  
  if (text === "") {
    return "Distribution information not available.";
  }
  
  return text;
}

function formatCharacteristics(features) {
  if (!features || !features.visualFeatures) return "No distinctive characteristics information available.";
  
  const { colors = [], patterns = [], structures = [], size = "unknown size" } = features.visualFeatures;
  
  let description = `${size.charAt(0).toUpperCase() + size.slice(1)} organism with `;
  
  if (colors.length > 0) {
    description += `${colors.join(', ')} coloration`;
  }
  
  if (patterns.length > 0) {
    description += colors.length > 0 ? ` and ${patterns.join(', ')} pattern` : `${patterns.join(', ')} pattern`;
  }
  
  if (structures.length > 0) {
    const structureText = structures.join(', ');
    description += (colors.length > 0 || patterns.length > 0) ? 
      `. Notable structures include ${structureText}.` : 
      `notable structures including ${structureText}.`;
  } else {
    description += '.';
  }
  
  return description;
}

function formatDescription(features) {
  if (!features) return "No description available.";
  
  let description = `This appears to be a ${features.category || "organism"}. `;
  description += formatCharacteristics(features);
  
  if (features.habitatHints && features.habitatHints.length > 0) {
    description += ` Found in ${features.habitatHints.join(', ')} habitats.`;
  }
  
  return description;
}

function getHabitatInfo(taxon, taxonData) {
  if (taxonData && taxonData.mainHabitat && taxonData.mainHabitat !== "Unknown") {
    return `${taxonData.mainHabitat} habitat`;
  }
  
  if (taxon && taxon.wikipedia_summary) {
    const summary = taxon.wikipedia_summary.toLowerCase();
    
    // Extract habitat information from Wikipedia summary
    const habitatKeywords = {
      "forest": "Forest",
      "woodland": "Forest",
      "tropical": "Tropical",
      "desert": "Desert",
      "arid": "Desert",
      "ocean": "Oceanic",
      "marine": "Oceanic",
      "aquatic": "Aquatic",
      "freshwater": "Freshwater",
      "river": "Freshwater",
      "lake": "Freshwater",
      "mountain": "Mountainous",
      "highland": "Mountainous",
      "grassland": "Grassland",
      "savanna": "Grassland",
      "prairie": "Grassland",
      "wetland": "Wetland",
      "marsh": "Wetland",
      "swamp": "Wetland",
      "temperate": "Temperate",
      "arctic": "Arctic",
      "coast": "Coastal",
      "coastal": "Coastal"
    };
    
    for (const [keyword, habitat] of Object.entries(habitatKeywords)) {
      if (summary.includes(keyword)) {
        return `${habitat} habitat`;
      }
    }
  }
  
  return "Habitat information not available";
}

function getInterestingFacts(taxon) {
  if (!taxon || !taxon.wikipedia_summary) return "No additional information available.";
  
  // Extract interesting facts from Wikipedia summary
  // For simplicity, we're just returning the first sentence(s) of the Wikipedia summary
  const summary = taxon.wikipedia_summary;
  
  // Extract first 2 sentences or 150 characters, whichever is shorter
  const sentences = summary.split(/\.\s+/);
  if (sentences.length > 1) {
    return `${sentences[0]}. ${sentences[1]}.`;
  } else if (sentences.length === 1) {
    return sentences[0] + '.';
  }
  
  // Fallback to first 150 characters if can't split by sentences
  return summary.substring(0, 150) + (summary.length > 150 ? '...' : '');
}

function formatLocationMatch(match, locationData, taxonData) {
  if (!locationData || !locationData.coords) {
    return "No location data was provided for this identification.";
  }
  
  if (!match || !match.observations || match.observations.length === 0) {
    return "This species has not been frequently observed in the provided location.";
  }
  
  // Format information about observations near the provided location
  const observationCount = match.observations.length;
  const locationName = locationData.name || `location (${locationData.coords.lat.toFixed(4)}, ${locationData.coords.lng.toFixed(4)})`;
  
  // Get region name based on coordinates
  const lat = locationData.coords.lat;
  const lng = locationData.coords.lng;
  let regionDescription = "";
  
  // Identify specific bioregions based on coordinates
  if (lat >= -9.5 && lat <= 5 && lng >= -79 && lng <= -50) {
    regionDescription = "the Amazon rainforest";
  } else if (lat >= -30 && lat <= -5 && lng >= -55 && lng <= -35) {
    regionDescription = "the Atlantic Forest (Mata Atlântica)";
  } else if (lat >= -24 && lat <= -5 && lng >= -60 && lng <= -42) {
    regionDescription = "the Cerrado savanna";
  } else if (lat >= -20 && lat <= -15 && lng >= -58 && lng <= -54) {
    regionDescription = "the Pantanal wetlands";
  } else if (lat >= -15 && lat <= -3 && lng >= -45 && lng <= -37) {
    regionDescription = "the Caatinga dry forest";
  } else {
    // Use continents as fallback
    if (lat >= 15 && lat <= 75 && lng >= -170 && lng <= -50) {
      regionDescription = "North America";
    } else if (lat <= 15 && lat >= -55 && lng >= -80 && lng <= -35) {
      regionDescription = "South America";
    } else if (lat >= 35 && lat <= 70 && lng >= -10 && lng <= 40) {
      regionDescription = "Europe";
    } else if (lat >= -35 && lat <= 37 && lng >= -20 && lng <= 60) {
      regionDescription = "Africa";
    } else if (lat >= -10 && lat <= 55 && lng >= 60 && lng <= 150) {
      regionDescription = "Asia";
    } else if (lat <= -10 && lat >= -45 && lng >= 110 && lng <= 180) {
      regionDescription = "Australia";
    } else {
      regionDescription = "this region";
    }
  }
  
  let result = `${observationCount} observation${observationCount !== 1 ? 's' : ''} found near the provided ${locationName} in ${regionDescription}. Nossa busca considera toda a região amazônica, não apenas a localização exata da foto. `;
  
  // Add information about native vs. introduced status
  if (taxonData && taxonData.nativeRegions && taxonData.nativeRegions.length > 0) {
    const regionMatch = taxonData.nativeRegions.find(region => {
      // Determine which continent the location is in
      if (region === 'North America' && lat >= 15 && lat <= 75 && lng >= -170 && lng <= -50) {
        return true;
      } else if (region === 'South America' && lat <= 15 && lat >= -55 && lng >= -80 && lng <= -35) {
        return true;
      } else if (region === 'Europe' && lat >= 35 && lat <= 70 && lng >= -10 && lng <= 40) {
        return true;
      } else if (region === 'Africa' && lat >= -35 && lat <= 37 && lng >= -20 && lng <= 60) {
        return true;
      } else if (region === 'Asia' && lat >= -10 && lat <= 55 && lng >= 60 && lng <= 150) {
        return true;
      } else if (region === 'Australia' && lat <= -10 && lat >= -45 && lng >= 110 && lng <= 180) {
        return true;
      }
      return false;
    });
    
    if (regionMatch) {
      result += "This species is native to this region and frequently found in this ecosystem. ";
      
      // Add regional specificity for certain bioregions
      if (lat >= -9.5 && lat <= 5 && lng >= -79 && lng <= -50) {
        result += "Many unique species have evolved in the Amazon basin due to its unparalleled biodiversity. ";
      } else if (lat >= -30 && lat <= -5 && lng >= -55 && lng <= -35) {
        result += "The Atlantic Forest is known for high levels of endemism due to its isolation from other forest systems. ";
      }
    } else if (taxonData.introducedRegions && taxonData.introducedRegions.length > 0) {
      result += "This species appears to be introduced (non-native) to this region. It may have been transported by humans or natural means. ";
    }
  }
  
  return result;
}

// New function to format regional relevance information
function formatRegionalRelevance(regionalRelevance, locationData) {
  if (!regionalRelevance) return "No specific regional information available.";
  
  let result = "";
  
  if (regionalRelevance.endemicFeatures && regionalRelevance.endemicFeatures.length > 0) {
    result += "Regional characteristics: " + regionalRelevance.endemicFeatures.join(", ") + ". ";
  }
  
  if (regionalRelevance.environmentalAdaptations && regionalRelevance.environmentalAdaptations.length > 0) {
    result += "Environmental adaptations: " + regionalRelevance.environmentalAdaptations.join(", ") + ". ";
  }
  
  // Add regional context if available
  if (locationData && locationData.coords) {
    const lat = locationData.coords.lat;
    const lng = locationData.coords.lng;
    
    if (lat >= -9.5 && lat <= 5 && lng >= -79 && lng <= -50) {
      result += "The Amazon rainforest is home to approximately 10% of known species in the world, with many endemic species adapted to this specific ecosystem.";
    } else if (lat >= -30 && lat <= -5 && lng >= -55 && lng <= -35) {
      result += "The Atlantic Forest is considered a biodiversity hotspot with over 20,000 plant species, of which 40% are endemic.";
    } else if (lat >= -24 && lat <= -5 && lng >= -60 && lng <= -42) {
      result += "The Cerrado savanna has evolved adaptations to periodic fires and is rich in plant diversity with around 7,000 plant species.";
    }
  }
  
  return result || "No specific regional information available.";
}

// Status de identificação
const IDENTIFICATION_STATUS = {
  SUCCESS: 'success',
  NO_MATCH: 'no_match',
  LOW_CONFIDENCE: 'low_confidence',
  ERROR: 'error'
};

/**
 * Analyzes an image with AI and matches against iNaturalist database
 * @param {string} imageData - Base64 encoded image data
 * @param {Object} locationData - Location data to narrow down species matching
 * @param {string} providedApiKey - Optional API key to override environment variable
 * @returns {Promise<Object>} Identification results matched with iNaturalist data
 */
export async function identifyWithOpenRouter(imageData, locationData = null, providedApiKey = null) {
  try {
    // Get API key from parameter or environment variable
    const apiKey = providedApiKey || process.env.OPENROUTER_API_KEY;
    
    console.log('API Key exists:', !!apiKey);
    console.log('API Key length:', apiKey ? apiKey.length : 0);
    console.log('API Key first 5 chars:', apiKey ? apiKey.substring(0, 5) : 'none');
    
    if (!apiKey) {
      throw new Error('OpenRouter API key is not configured');
    }

    // Check if we have valid image data
    if (!imageData) {
      throw new Error('No image was provided for analysis');
    }
    
    console.log('Image data type:', typeof imageData);
    console.log('Image data starts with:', imageData.substring(0, 50) + '...');
    console.log('Image data length:', imageData.length);
    
    // Location data logging if available
    if (locationData && locationData.coords) {
      console.log('Location provided:', `${locationData.coords.lat}, ${locationData.coords.lng}`);
      console.log('Location name:', locationData.name || 'Unnamed location');
    } else {
      console.log('No location data provided');
    }
    
    // Handle common image issues by testing different image formats
    let imageUrl;
    
    if (imageData.startsWith('http')) {
      // It's already a URL, use as is
      imageUrl = imageData;
      console.log('Using image URL directly');
    } else if (imageData.startsWith('data:image/')) {
      // It's already a data URL with correct format, use as is
      imageUrl = imageData;
      console.log('Using image data URL directly');
    } else if (imageData.startsWith('data:')) {
      // It's a data URL but might not have correct format
      const contentType = imageData.split(';')[0].split(':')[1];
      console.log('Content type detected:', contentType);
      
      if (!contentType || !contentType.startsWith('image/')) {
        // Fix content type if needed
        console.log('Invalid content type, trying to fix');
        const base64Data = imageData.includes('base64,') ? 
          imageData.split('base64,')[1] : imageData;
        imageUrl = `data:image/jpeg;base64,${base64Data}`;
      } else {
        imageUrl = imageData;
      }
    } else {
      // Assume it's raw base64 data and add the prefix
      imageUrl = `data:image/jpeg;base64,${imageData}`;
      console.log('Added data:image/jpeg prefix to base64 data');
    }
    
    // Ensure valid URL format for OpenRouter API
    if (!imageUrl) {
      throw new Error('Failed to process image into valid format');
    }
    
    // Definir modelo a ser usado - comece com o primário
    let currentModel = MODELS.PRIMARY;

    // Prepare the prompt for feature extraction with location context
    let promptBase = `
      I need you to analyze this image and provide the MOST SPECIFIC possible taxonomic classification and detailed visual features for exact species matching in the iNaturalist database.
      
      CRITICAL INSTRUCTIONS:
      1. NEVER return high-level taxonomic classifications (like just "Insecta" or "Coleoptera") when more specific identification is possible from visual features.
      2. If you see distinctive features that could identify a specific genus or species, you MUST include this information.
      3. For insects especially, note specific anatomical details like horn structures, mandible shape, number of legs visible, antenna length/shape, eye placement, etc.
      4. Pay special attention to color patterns, body segment shapes, and distinctive markings that aid in species-level identification.
      5. Amazon rainforest species often have distinctive adaptations - note any specialized features for this environment.
      6. If you recognize a famous/distinctive Amazon species (like Hercules beetle, longhorn beetle, etc.), specify this directly.
    `;
    
    // Add regional context if available to improve feature extraction
    if (locationData && locationData.coords) {
      // Determine regional context
      const lat = locationData.coords.lat;
      const lng = locationData.coords.lng;
      let regionName = "unknown region";
      
      // Identify specific bioregions based on coordinates
      if (lat >= -9.5 && lat <= 5 && lng >= -79 && lng <= -50) {
        regionName = "Amazon rainforest";
      } else if (lat >= -30 && lat <= -5 && lng >= -55 && lng <= -35) {
        regionName = "Atlantic Forest";
      } else if (lat >= -24 && lat <= -5 && lng >= -60 && lng <= -42) {
        regionName = "Cerrado savanna";
      } else if (lat >= -20 && lat <= -15 && lng >= -58 && lng <= -54) {
        regionName = "Pantanal wetlands";
      } else if (lat >= -15 && lat <= -3 && lng >= -45 && lng <= -37) {
        regionName = "Caatinga dry forest";
      }
      
      promptBase += `
      
      LOCATION CONTEXT:
      This image was taken in the ${regionName} at coordinates: ${locationData.coords.lat.toFixed(6)}, ${locationData.coords.lng.toFixed(6)}.
      
      AMAZON RAINFOREST SPECIFIC INSTRUCTIONS:
      1. The Amazon rainforest contains thousands of endemic beetles, including famous species like:
         - Hercules beetle (Dynastes hercules) - with distinctive horns
         - Titan beetle (Titanus giganteus) - one of the world's largest beetles
         - Scarab beetles (Scarabaeidae) with metallic colors
         - Longhorn beetles (Cerambycidae) with extremely long antennae
         - Weevils (Curculionidae) with distinctive elongated snouts
      
      2. DO NOT generalize to high taxonomic levels like "Insecta" or "Coleoptera" - if the image shows distinctive features of Amazonian species, provide the MOST SPECIFIC identification possible.
      
      3. Highlight features that would allow exact species matching in taxonomic databases.
      
      4. Pay EXTREME attention to color! The color of the organism is CRITICAL for correct species identification. Be very precise in describing colors.`;
    }
    
    promptBase += `
      
      Please extract and provide:
      - Category (plant or animal)
      - Key visual features (colors, patterns, distinctive structures)
      - Possible taxonomic groups (likely family, order, or class)
      - Size estimation if possible (tiny, small, medium, large)
      - Habitat cues visible in the image
      - Search terms that would be useful for an iNaturalist database query
      
      Format your response as JSON with this structure:
      {
        "featureExtraction": {
          "category": "plant" or "animal" or "fungus" or "insect",
          "specificIdentification": {
            "mostSpecificTaxon": "the most specific taxonomic level you can confidently identify (species name if possible)",
            "taxonomicLevel": "species|genus|family|order (indicate the most specific level you provided)",
            "scientificName": "full scientific name if you can determine it"
          },
          "taxonomicHints": {
            "class": "likely class",
            "order": "likely order",
            "family": "likely family",
            "genus": "likely genus if evident",
            "species": "likely species if features allow for this determination"
          },
          "visualFeatures": {
            "colors": ["PRECISE colors with body parts they appear on - be EXTREMELY specific about colors"],
            "patterns": ["detailed description of patterns or markings"],
            "structures": ["detailed anatomical structures with measurements if possible"],
            "bodyShape": "description of overall shape",
            "size": "size estimation with as much precision as possible",
            "distinctiveFeatures": ["3-5 most distinctive visual features that enable species-level identification"]
          },
          "amazonianSpeciesMatch": {
            "possibleSpecies": ["list of specific Amazonian species this might be"],
            "matchConfidence": 0.1 to 0.99,
            "distinctiveTraits": ["traits that match known Amazonian species"]
          },
          "regionalRelevance": {
            "endemicFeatures": ["features suggesting regional endemism"],
            "environmentalAdaptations": ["adaptations to local environment visible in image"]
          },
          "habitatHints": ["habitat cues from image"],
          "searchTerms": ["12-15 highly specific search terms optimized for exact species matching"],
          "confidence": 0.3 to 0.95,
          "limitations": "Any limitations in the image that affect analysis"
        }
      }
      
      FINAL CRITICAL INSTRUCTIONS:
      1. NEVER return only high taxonomic classifications (like just "Insecta") - this is unacceptable when more specific identification is possible
      2. If you can see distinctive features allowing for genus or species identification, you MUST provide this level of specificity
      3. COLOR ACCURACY IS CRITICAL - be extremely precise about colors, as matching will heavily rely on color
      4. For Amazon rainforest beetles especially:
         - Note specific horn shapes and sizes in scarabs and dynastids
         - Describe metallic coloration patterns in detail for scarabs
         - Note mandible size and shape for longhorns and titans
         - Describe antennae length relative to body
         - Note specific patterns on elytra (wing covers)
      5. Use the most specific and accurate scientific terminology
      6. If the organism shows CLEAR distinctive features of a known Amazonian species, include the scientific name
      
      The goal is MAXIMUM TAXONOMIC SPECIFICITY with ACCURATE COLOR DESCRIPTION - not just basic features. Generic identifications like "Insecta" when more specific identification is possible are considered failures, as are incorrect color descriptions.
    `;
    
        // Use the enhanced feature extraction prompt with regional focus
        const prompt = promptBase;

    // Função para fazer uma requisição à API com um modelo específico
    const callOpenRouterAPI = async (model) => {
      console.log(`Tentando fazer chamada para OpenRouter com modelo: ${model}`);
      console.log('Authorization header:', `Bearer ${apiKey ? apiKey.substring(0, 5) + '...' : 'missing'}`);
      
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://natureid.app',
        'X-Title': 'NatureID'
      };
      
      console.log('Headers being sent:', Object.keys(headers).join(', '));
      
      return await fetch(OPENROUTER_API_ENDPOINT, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                {
                  type: 'image_url',
                  image_url: {
                    url: imageUrl
                  }
                }
              ]
            }
          ],
          max_tokens: 1000,
          response_format: { type: "text" }
        })
      });
    };
    
    // Primeira tentativa com o modelo primário
    let response = await callOpenRouterAPI(currentModel);
    
    // Se a resposta for 429 (rate limit) ou 402 (insufficient credits), tente novamente com o modelo de backup
    if (response.status === 429 || response.status === 402) {
      console.log(`Modelo primário atingiu limite de taxa ou créditos. Tentando modelo de backup...`);
      currentModel = MODELS.BACKUP;
      response = await callOpenRouterAPI(currentModel);
        
      // Se ainda assim tivermos um erro (429 ou 402), desistimos e retornamos o erro
      if (response.status === 429 || response.status === 402) {
        console.log('Ambos os modelos atingiram limite de taxa ou créditos.');
      } else {
        console.log(`Usando modelo de backup: ${currentModel}`);
      }
    }

    // Tratar erro na resposta HTTP
    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API error response:", errorText);
      
      try {
        const errorData = JSON.parse(errorText);
        // Se houver um erro de rate limit ou créditos insuficientes, envie uma mensagem mais específica
        if (errorData.error?.code === 429 || response.status === 429 || errorData.error?.code === 402 || response.status === 402) {
          // Se já tentamos o modelo de backup, exibir mensagem informando ambos os limites excedidos
          if (currentModel === MODELS.BACKUP) {
            return {
              identification: {
                category: 'error',
                name: 'Rate Limit Exceeded',
                scientificName: 'N/A',
                confidence: 0,
                description: 'The API rate limit has been exceeded for all available models. Please try again later.',
                additionalInfo: {
                  error: errorData.error?.message || 'Rate limit or insufficient credits for both primary and backup models',
                  note: 'This is a temporary limitation. The free tier has usage limits. Please try again later or create an account with OpenRouter.'
                }
              }
            };
          }
          // Caso contrário, o erro deve ter sido capturado durante a troca de modelo
          return {
            identification: {
              category: 'error',
              name: 'API Usage Limit Reached',
              scientificName: 'N/A',
              confidence: 0,
              description: 'The API usage limit has been reached. Please try again later.',
              additionalInfo: {
                error: errorData.error?.message || 'Usage limit reached for OpenRouter API',
                note: 'This is a temporary limitation. The free tier has usage constraints. Please try again later or create an account with OpenRouter.'
              }
            }
          };
        }
        
        throw new Error(
          errorData.error?.message || 
          `OpenRouter API responded with status ${response.status}`
        );
      } catch (parseError) {
        if (errorText.includes('rate limit') || errorText.includes('credits') || response.status === 429 || response.status === 402) {
          // Se já tentamos o modelo de backup, exibir mensagem informando ambos os limites excedidos
          if (currentModel === MODELS.BACKUP) {
            return {
              identification: {
                category: 'error',
                name: 'API Usage Limit Reached',
                scientificName: 'N/A',
                confidence: 0,
                description: 'The usage limit has been reached for all available AI models. Please try again later.',
                additionalInfo: {
                  error: `Usage limit reached for both models (${response.status})`,
                  note: 'Free tier models have usage limitations. Please try again later or register for an account with OpenRouter.'
                }
              }
            };
          }
          // Caso contrário, erro padrão de limite de uso
          return {
            identification: {
              category: 'error',
              name: 'API Usage Limit Reached',
              scientificName: 'N/A',
              confidence: 0,
              description: 'The API usage limit has been reached. Please try again later.',
              additionalInfo: {
                error: `API usage limit reached (${response.status})`,
                note: 'Free tier models have usage limitations. Please try again later or register for an account with OpenRouter.'
              }
            }
          };
        }
        
        throw new Error(`OpenRouter API error (${response.status}): ${errorText.slice(0, 100)}...`);
      }
    }

    let data;
    try {
      const responseText = await response.text();
      console.log("API response text:", responseText.slice(0, 200) + "...");
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse API response:", parseError);
      throw new Error("Failed to parse API response");
    }
    
    console.log("Parsing AI response completed successfully");
    
    // Extract the features from the AI response
    if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
      try {
        // Parse the JSON response
        const aiResponseText = data.choices[0].message.content;
        console.log("AI Response:", aiResponseText.substring(0, 200) + "...");
        
        // Extract JSON from the response (handle potential text wrapper)
        let jsonStart = aiResponseText.indexOf('{');
        let jsonEnd = aiResponseText.lastIndexOf('}');
        
        if (jsonStart !== -1 && jsonEnd !== -1) {
          const jsonStr = aiResponseText.substring(jsonStart, jsonEnd + 1);
          const aiData = JSON.parse(jsonStr);
          
          // Check if we have feature extraction data
          if (aiData.featureExtraction) {
            console.log("Successfully extracted features from AI response");
            
            // Use the extracted features to search iNaturalist database
            const features = aiData.featureExtraction;
            
            // Expand taxonomic hints if they're in the new detailed format
            // Extract the most specific identification if available
            if (features.specificIdentification && features.specificIdentification.mostSpecificTaxon) {
              console.log("Most specific taxon identified:", features.specificIdentification.mostSpecificTaxon);
                    
              // Add this as a priority search term
              if (!features.searchTerms) features.searchTerms = [];
              features.searchTerms.unshift(features.specificIdentification.mostSpecificTaxon);
                    
              // If scientific name is provided, add it too
              if (features.specificIdentification.scientificName) {
                features.searchTerms.unshift(features.specificIdentification.scientificName);
              }
            }
                
            if (features.taxonomicHints && typeof features.taxonomicHints === 'object' && !Array.isArray(features.taxonomicHints)) {
              // Convert structured taxonomic hints to array for backward compatibility
              features.taxonomicHints = Object.values(features.taxonomicHints).filter(Boolean);
            }
                  
            // Check for Amazonian species matches
            if (features.amazonianSpeciesMatch && features.amazonianSpeciesMatch.possibleSpecies) {
              const amazonSpecies = features.amazonianSpeciesMatch.possibleSpecies.filter(Boolean);
              console.log("Possible Amazonian species matches:", amazonSpecies);
                    
              // Add these as priority search terms
              if (amazonSpecies.length > 0) {
                if (!features.searchTerms) features.searchTerms = [];
                features.searchTerms.unshift(...amazonSpecies);
              }
            }
            
            console.log("Features:", JSON.stringify(features).substring(0, 200) + "...");
            
            // Enrich search terms with location data if available
            if (locationData && locationData.coords && features.searchTerms && Array.isArray(features.searchTerms)) {
              // Add regional terms to search
              if (locationData.name) {
                features.searchTerms.push(locationData.name);
              }
              
              // Determine region based on coordinates
              const { lat, lng } = locationData.coords;
              if (lat >= -9.5 && lat <= 5 && lng >= -79 && lng <= -50) {
                // Adicionar termos específicos para a Amazônia
                features.searchTerms.push("amazon", "amazonia", "amazonian", "rainforest");
                
                // Adicionar termos para grupos comuns da Amazônia
                if (features.category === 'insect' || 
                    (features.taxonomicHints && 
                     (typeof features.taxonomicHints === 'object' ? 
                        Object.values(features.taxonomicHints).some(h => h && h.toLowerCase().includes('insect')) : 
                        features.taxonomicHints.some(h => h && h.toLowerCase().includes('insect'))))) {
                  features.searchTerms.push(
                    "amazon insect", 
                    "amazonian beetle", 
                    "amazon beetle", 
                    "coleoptera amazonia",
                    "scarabaeidae",
                    "cerambycidae",
                    "dynastinae",
                    "buprestidae", 
                    "insetos da amazônia"
                  );
                } else if (features.category === 'plant' || 
                          (features.taxonomicHints && 
                           (typeof features.taxonomicHints === 'object' ? 
                              Object.values(features.taxonomicHints).some(h => h && h.toLowerCase().includes('plant')) : 
                              features.taxonomicHints.some(h => h && h.toLowerCase().includes('plant'))))) {
                  features.searchTerms.push(
                    "amazon flora",
                    "amazonian plant",
                    "rainforest plant",
                    "plantas da amazonia"
                  );
                }
              } else if (lat >= -30 && lat <= -5 && lng >= -55 && lng <= -35) {
                features.searchTerms.push("atlantic forest", "mata atlantica");
              }
            }
            
            // Search iNaturalist database with the extracted features
            console.log("Searching iNaturalist database with extracted features...");
            const inatResults = await searchObservationsByFeatures(features, locationData);
            
            // Process search results
            if (inatResults && inatResults.results && inatResults.results.length > 0) {
              // Use the top match as our identification
              const topMatch = inatResults.results[0];
              console.log("Found matching species in iNaturalist:", 
                topMatch.taxon.name, "with score", topMatch.matchScore);
              
              // Get additional data for the taxon
              const taxonData = await getTaxonGeographicData(topMatch.taxon.id);
              
              // Check if the result is too generic (like just "Insecta") when we have detailed features
              const isTooGeneric = (topMatch.taxon.rank_level <= 40) && // Class or Order level or higher
                features.visualFeatures && 
                features.visualFeatures.distinctiveFeatures && 
                features.visualFeatures.distinctiveFeatures.length > 0;
                
              // Check if we have a more specific ID from AI analysis
              const hasMoreSpecificID = features.specificIdentification && 
                features.specificIdentification.mostSpecificTaxon &&
                features.specificIdentification.taxonomicLevel &&
                (features.specificIdentification.taxonomicLevel === 'species' || 
                 features.specificIdentification.taxonomicLevel === 'genus');
              
              // Use the more specific ID if available and the database match is too generic
              const finalName = isTooGeneric && hasMoreSpecificID ? 
                features.specificIdentification.mostSpecificTaxon : 
                (topMatch.taxon.preferred_common_name || topMatch.taxon.name);
                
              const finalScientificName = isTooGeneric && hasMoreSpecificID && features.specificIdentification.scientificName ? 
                features.specificIdentification.scientificName : 
                topMatch.taxon.name;
                
              const finalTaxonomicLevel = isTooGeneric && hasMoreSpecificID ? 
                features.specificIdentification.taxonomicLevel : 
                (topMatch.taxon.rank || "Unknown");
              
              // Get the top matches - AGGRESSIVELY filter out generic and visually incompatible matches
              let filteredMatches = inatResults.results;
              
              // Filter out results with very low confidence scores first (likely wrong matches)
              filteredMatches = filteredMatches.filter(match => match.matchScore > 0.05);
              
              // Extract primary colors from the image features for filtering
              const primaryColors = [];
              if (features.visualFeatures && features.visualFeatures.colors) {
                for (const color of features.visualFeatures.colors) {
                  const colorLower = color.toLowerCase();
                  // Extract basic colors for matching
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
              
              // Filter based on visual compatibility if we have color information
              if (primaryColors.length > 0) {
                const visuallyCompatibleMatches = filteredMatches.filter(match => {
                  const taxon = match.taxon;
                  
                  // Combine all available text for searching
                  const allText = (
                    (taxon.name || '').toLowerCase() + ' ' +
                    (taxon.preferred_common_name || '').toLowerCase() + ' ' + 
                    (taxon.wikipedia_summary || '').toLowerCase()
                  );
                  
                  // Check if at least one color matches
                  return primaryColors.some(color => allText.includes(color));
                });
                
                // Only apply color filtering if we have enough results left
                if (visuallyCompatibleMatches.length >= 3) {
                  filteredMatches = visuallyCompatibleMatches;
                  console.log(`Filtered to ${filteredMatches.length} color-compatible matches`);
                }
              }
              
              // Now apply taxonomic filtering to prefer more specific identifications
              // Step 1: Try to get only species-level matches first
              const speciesMatches = filteredMatches.filter(m => m.taxon.rank_level >= 70);
              if (speciesMatches.length >= 3) {
                filteredMatches = speciesMatches;
              } else {
                // Step 2: If not enough species matches, try genus level and above
                const genusMatches = filteredMatches.filter(m => m.taxon.rank_level >= 60);
                if (genusMatches.length >= 3) {
                  filteredMatches = genusMatches;
                } else {
                  // Step 3: If still not enough, try family level and above
                  const familyMatches = filteredMatches.filter(m => m.taxon.rank_level >= 50);
                  if (familyMatches.length >= 3) {
                    filteredMatches = familyMatches;
                  }
                }
              }
              
              // Demote very generic matches (Insecta, etc.) if we have more specific options
              if (filteredMatches.length > 0 && filteredMatches[0].taxon.rank_level <= 30) {
                const betterMatches = filteredMatches.filter(m => m.taxon.rank_level > 40);
                if (betterMatches.length > 0) {
                  // Remove the generic match and put better matches first
                  filteredMatches = betterMatches.concat(
                    filteredMatches.filter(m => m.taxon.rank_level <= 40)
                  );
                }
              }
              
              // Keep top 10 matches
              const topMatches = filteredMatches.slice(0, 10);
              
              // Format result
              return {
                identification: {
                  category: getCategory(topMatch.taxon),
                  name: finalName,
                  popularName: topMatch.taxon.preferred_common_name || finalName,
                  scientificName: finalScientificName,
                  taxonomicLevel: finalTaxonomicLevel,
                  confidence: topMatch.matchScore,
                  description: topMatch.taxon.wikipedia_summary || "No description available.",
                  distribution: taxonData.density ? formatDistribution(taxonData) : "Distribution data not available.",
                  geographicData: taxonData,
                  status: IDENTIFICATION_STATUS.SUCCESS,
                  featuresUsed: features,
                  // If our top result is still Insecta or other very generic class,
                  // but we have more specific results in the top matches,
                  // switch the main identification to the most specific one
                  ...(topMatch.taxon.rank_level <= 30 && topMatches.length > 1 && topMatches[0].taxon.rank_level > 40 ? {
                    name: topMatches[0].taxon.preferred_common_name || topMatches[0].taxon.name,
                    scientificName: topMatches[0].taxon.name,
                    taxonomicLevel: topMatches[0].taxon.rank || "Unknown",
                    confidence: topMatches[0].matchScore
                  } : {}),
                  suggestions: topMatches.map(match => ({
                    name: match.taxon.preferred_common_name || match.taxon.name, 
                    scientificName: match.taxon.name,
                    taxonomicLevel: match.taxon.rank || "Unknown",
                    rankLevel: match.taxon.rank_level || 0,
                    confidence: match.matchScore,
                    observations: match.observations.length || 0,
                    iNaturalistTaxonId: match.taxon.id,
                    colors: features.visualFeatures?.colors || []
                  })),
                  additionalInfo: {
                    habitat: getHabitatInfo(topMatch.taxon, taxonData),
                    characteristics: formatCharacteristics(features),
                    notes: features.limitations || "Identification based on visual features and geographic location.",
                    interestingFacts: getInterestingFacts(topMatch.taxon),
                    specificFeatures: features.visualFeatures?.distinctiveFeatures?.join(", ") || "No specific features noted.",
                    possibleSpecificSpecies: features.amazonianSpeciesMatch?.possibleSpecies?.join(", ") || "",
                    locationMatch: formatLocationMatch(topMatch, locationData, taxonData),
                    regionalRelevance: features.regionalRelevance ? 
                      formatRegionalRelevance(features.regionalRelevance, locationData) : 
                      "No specific regional information available.",
                    matchMethod: "AI feature extraction + regional iNaturalist database match",
                    observations: topMatch.observations.length,
                    iNaturalistTaxonId: topMatch.taxon.id,
                    dataSource: "iNaturalist database",
                    regionSpecific: true,
                    aiSpecificID: hasMoreSpecificID && isTooGeneric ? "AI provided more specific identification than database match" : ""
                  }
                }
              };
            } else {
              console.log("No matching species found in iNaturalist database");
              // No matches found - create a response with the features but no specific identification
              // Check if we have a specific ID from AI analysis even if no database match
              const hasSpecificID = features.specificIdentification && 
                features.specificIdentification.mostSpecificTaxon &&
                (features.specificIdentification.taxonomicLevel === 'species' || 
                 features.specificIdentification.taxonomicLevel === 'genus');
                
              const finalName = hasSpecificID ? 
                features.specificIdentification.mostSpecificTaxon : 
                "Unidentified " + (features.category || "Organism");
                
              const finalScientificName = hasSpecificID && features.specificIdentification.scientificName ? 
                features.specificIdentification.scientificName : 
                "Unknown";
                
              const finalTaxonomicLevel = hasSpecificID ? 
                features.specificIdentification.taxonomicLevel : 
                "Unknown";
                
              // Check for Amazonian species matches  
              const amazonianMatch = features.amazonianSpeciesMatch && 
                features.amazonianSpeciesMatch.possibleSpecies && 
                features.amazonianSpeciesMatch.possibleSpecies.length > 0;
                
              return {
                identification: {
                  category: features.category || "Unknown",
                  name: finalName,
                  scientificName: finalScientificName,
                  taxonomicLevel: finalTaxonomicLevel,
                  confidence: features.confidence || (hasSpecificID ? 0.7 : 0.3),
                  description: formatDescription(features),
                  status: hasSpecificID ? IDENTIFICATION_STATUS.SUCCESS : IDENTIFICATION_STATUS.NO_MATCH,
                  featuresUsed: features,
                  additionalInfo: {
                    characteristics: formatCharacteristics(features),
                    specificFeatures: features.visualFeatures?.distinctiveFeatures?.join(", ") || "No specific features noted.",
                    possibleSpecificSpecies: features.amazonianSpeciesMatch?.possibleSpecies?.join(", ") || "",
                    notes: hasSpecificID ? 
                      "No exact match found in iNaturalist database, but AI analysis provides specific identification based on visual features." :
                      "No matching species found in the iNaturalist database. The AI extracted visual features but couldn't find a corresponding species in this region.",
                    searchTerms: features.searchTerms ? features.searchTerms.join(", ") : "None provided",
                    regionalRelevance: features.regionalRelevance ? 
                      formatRegionalRelevance(features.regionalRelevance, locationData) : 
                      "The organism may not be native to this region or may be rare in this area.",
                    aiSpecificID: hasSpecificID ? "Identification provided directly by AI visual analysis" : "",
                    visualFiltering: primaryColors && primaryColors.length > 0 ? 
                      `Results were filtered to match visual characteristics including colors: ${primaryColors.join(", ")}` : 
                      "No visual filtering applied"
                  }
                }
              };
            }
          }
        }
      } catch (parseError) {
        console.error("Error parsing AI feature extraction:", parseError);
      }
    }
    
    // Verificar se é uma resposta de erro (específicamente checando o error.code 429)
    if (data.error) {
      console.error("API returned error response:", data.error);
      
      // Verificar se é um erro de rate limit ou créditos insuficientes e ainda não tentamos o modelo de backup
      if ((data.error.code === 429 || data.error.code === 402 || data.error.message?.includes('rate limit') || data.error.message?.includes('credits')) && currentModel === MODELS.PRIMARY) {
        console.log('Detectado erro de limite de uso na resposta. Tentando modelo de backup...');
    
        // Tentar novamente com o modelo de backup
            currentModel = MODELS.BACKUP;
            try {
              console.log(`Tentando com modelo alternativo: ${currentModel}`);
              const backupResponse = await callOpenRouterAPI(currentModel);
          
              // Se a resposta for bem-sucedida, processe normalmente
              if (backupResponse.ok) {
                console.log('Modelo de backup funcionou com sucesso!');
                const backupResponseText = await backupResponse.text();
                const backupData = JSON.parse(backupResponseText);
            
                // Continuar o processamento com os dados do modelo de backup
                data = backupData;
                // Limpar o erro para continuar o processamento
                delete data.error;
            
                // Adicionar informação sobre o uso do modelo de backup
                console.log('Usando dados do modelo de backup para processamento');
            
            // Continuar para o próximo passo (não retornar aqui)
          } else {
            // Se o backup também falhou, retornar erro de ambos os modelos
            console.log('Modelo de backup também falhou.');
            return {
              identification: {
                category: 'error',
                name: 'Rate Limit Exceeded',
                scientificName: 'N/A',
                confidence: 0,
                description: 'The API rate limit has been exceeded for all available models. Please try again later.',
                additionalInfo: {
                  error: data.error.message || 'Rate limit exceeded for both primary and backup models',
                  note: 'This is a temporary limitation. The free tier has a limited number of requests per day.'
                }
              }
            };
          }
        } catch (backupError) {
          console.error('Erro ao tentar o modelo de backup:', backupError);
          return {
            identification: {
              category: 'error',
              name: 'API Error',
              scientificName: 'N/A',
              confidence: 0,
              description: 'Failed to use backup model after primary model rate limit was exceeded.',
              additionalInfo: {
                error: backupError.message || 'Error when switching to backup model',
                note: 'Please try again later when the rate limits are reset.'
              }
            }
          };
        }
      }
      
      // Se ainda existe um erro após tentativa de backup ou é outro tipo de erro
      if (data.error) {
        // Verificar se é um erro de rate limit
        if (data.error.code === 429 || data.error.message?.includes('rate limit')) {
          return {
            identification: {
              category: 'error',
              name: 'Rate Limit Exceeded',
              scientificName: 'N/A',
              confidence: 0,
              description: 'The API rate limit has been exceeded for all available models. Please try again later.',
              additionalInfo: {
                error: data.error.message || 'Rate limit exceeded for all models',
                note: 'This is a temporary limitation. The free tier has a limited number of requests per day.'
              }
            }
          };
        }
        
        // Outros tipos de erro
        return {
          identification: {
            category: 'error',
            name: 'API Error',
            scientificName: 'N/A',
            confidence: 0,
            description: 'The OpenRouter API returned an error.',
            additionalInfo: {
              error: data.error.message || 'Unknown API error',
              note: 'Please try again later.'
            }
          }
        };
      }
    }
    
    // Verificar se temos choices e message no response
    if (!data.choices || !data.choices.length) {
      console.error("Invalid API response structure - missing choices:", data);
      return {
        identification: {
          category: 'error',
          name: 'Invalid Response',
          scientificName: 'N/A',
          confidence: 0,
          description: 'The API returned an unexpected response format.',
          additionalInfo: {
            error: 'Missing choices in API response',
            note: 'Please try again with a clearer image.'
          }
        }
      };
    }
    
    // Extract the content from the response
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      console.error("Empty content in API response:", data);
      return {
        identification: {
          category: 'error',
          name: 'Empty Response',
          scientificName: 'N/A',
          confidence: 0,
          description: 'The AI service returned an empty response.',
          additionalInfo: {
            error: 'No content in API response',
            note: 'Please try again with a clearer image.'
          }
        }
      };
    }

    // Parse the JSON response
    try {
      // Find the JSON content (in case there's text around it)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not find JSON in the response');
      }
      
      const identificationData = JSON.parse(jsonMatch[0]);
      
      // Validate response format
      if (!identificationData.identification) {
        throw new Error('Invalid identification format in response');
      }
      
      // Tentar enriquecer os resultados com dados do iNaturalist
      try {
        const inaturalistToken = process.env.INATURALIST_API_TOKEN;
        if (inaturalistToken && identificationData.identification.scientificName) {
          const scientificName = identificationData.identification.scientificName;
          console.log(`Buscando dados do iNaturalist para: ${scientificName}`);
          
          // Buscar dados do táxon na API do iNaturalist
          const taxonData = await getTaxonByName(scientificName);
          
          if (taxonData && taxonData.id) {
            console.log(`Táxon encontrado no iNaturalist, ID: ${taxonData.id}`);
            
            // Buscar dados geográficos detalhados
            const geoData = await getTaxonGeographicData(taxonData.id);
            
            if (geoData) {
              console.log('Dados geográficos obtidos do iNaturalist');
              
              // Atualizar/enriquecer dados de distribuição geográfica
              identificationData.identification.geographicData = {
                ...identificationData.identification.geographicData || {},
                ...geoData,
                // Manter as regiões se já existirem no resultado original
                regions: identificationData.identification.geographicData?.regions || geoData.regions,
                // Usar dados do iNaturalist para regiões nativas e introduzidas
                nativeRegions: geoData.nativeRegions.length > 0 
                  ? geoData.nativeRegions 
                  : identificationData.identification.geographicData?.nativeRegions || [],
                introducedRegions: geoData.introducedRegions.length > 0
                  ? geoData.introducedRegions
                  : identificationData.identification.geographicData?.introducedRegions || []
              };
              
              // Atualizar habitat principal se disponível
              if (geoData.mainHabitat && geoData.mainHabitat !== 'Unknown') {
                if (!identificationData.identification.geographicData) {
                  identificationData.identification.geographicData = {};
                }
                identificationData.identification.geographicData.mainHabitat = geoData.mainHabitat;
              }
              
              // Atualizar densidade populacional se disponível
              if (Object.keys(geoData.density).length > 0) {
                if (!identificationData.identification.geographicData) {
                  identificationData.identification.geographicData = {};
                }
                identificationData.identification.geographicData.density = geoData.density;
              }
              
              console.log('Dados de identificação enriquecidos com informações do iNaturalist');
            }
          }
        }
      } catch (inaturalistError) {
        console.error('Erro ao buscar dados do iNaturalist:', inaturalistError);
        // Não falhar a requisição principal se o enriquecimento falhar
      }
      
      // Adicionar informação sobre qual modelo foi usado
      if (!identificationData.identification.additionalInfo) {
        identificationData.identification.additionalInfo = {};
      }
      identificationData.identification.additionalInfo.modelUsed = currentModel;
      
      return identificationData;
    } catch (parseError) {
      console.error('Failed to parse identification data:', parseError);
      
      // Fallback response if parsing fails
      return {
        identification: {
          category: content.toLowerCase().includes('plant') ? 'plant' : 'animal',
          name: 'Unknown Species',
          scientificName: 'N/A',
          confidence: 0.5,
          description: 'We could not properly identify this specimen. The AI provided a response but it was not in the expected format.',
          additionalInfo: {
            note: 'The identification system encountered an issue. Try again with a clearer image.',
            modelUsed: currentModel
          }
        }
      };
    }
  } catch (error) {
    console.error('OpenRouter API error:', error);
    throw error;
  }
}