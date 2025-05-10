/**
 * Este arquivo contém dados simulados para identificação de espécies
 * Útil para testes sem fazer chamadas à API do OpenRouter
 */

// Simula uma identificação de planta (exemplo: orquídea)
export const mockPlantIdentification = {
  identification: {
    category: 'plant',
    name: 'Phalaenopsis amabilis',
    popularName: 'Orquídea Mariposa',
    scientificName: 'Phalaenopsis amabilis',
    taxonomicLevel: 'species',
    confidence: 0.92,
    description: 'Orquídea branca com flores delicadas que se assemelham a mariposas em voo. Apresenta longas hastes florais com múltiplas flores.',
    distribution: 'Nativa do sudeste asiático, incluindo Filipinas, Indonésia e norte da Austrália. Amplamente cultivada em todo o mundo como planta ornamental.',
    geographicData: {
      regions: ['South America', 'North America', 'Europe', 'Asia', 'Australia'],
      mainHabitat: 'Tropical',
      density: {
        'South America': 0.1, 
        'North America': 0.2, 
        'Europe': 0.1, 
        'Asia': 0.8, 
        'Australia': 0.4
      },
      nativeRegions: ['Asia', 'Australia'],
      introducedRegions: ['South America', 'North America', 'Europe'],
      observationPoints: [
        {
          lat: 14.5995, 
          lng: 121.0359, 
          id: 'obs1', 
          place: 'Manila, Philippines', 
          observed_on: '2023-05-12'
        },
        {
          lat: -6.2088, 
          lng: 106.8456, 
          id: 'obs2', 
          place: 'Jakarta, Indonesia', 
          observed_on: '2023-04-28'
        }
      ]
    },
    additionalInfo: {
      habitat: 'Florestas tropicais úmidas, geralmente epífitas crescendo em troncos de árvores',
      characteristics: 'Flores grandes, duradouras, brancas, frequentemente com centros amarelos ou rosa pálido',
      notes: 'Identificação baseada na forma e arranjo das flores',
      interestingFacts: 'Simboliza elegância e amor em muitas culturas asiáticas. Pode florescer várias vezes ao ano em cultivo adequado.',
      locationMatch: 'Esta espécie é comum em ambientes tropicais e subtropicais. É frequentemente cultivada como planta ornamental na região indicada.'
    }
  }
};

// Simula uma identificação de animal (exemplo: tigre)
export const mockAnimalIdentification = {
  identification: {
    category: 'animal',
    name: 'Panthera tigris',
    popularName: 'Tigre',
    scientificName: 'Panthera tigris',
    taxonomicLevel: 'species',
    confidence: 0.89,
    description: 'Grande felino com pelagem laranja-avermelhada com listras pretas distintas. Possui corpo musculoso, cabeça larga e dentes caninos proeminentes.',
    distribution: 'Originalmente distribuído em grande parte da Ásia, desde a Turquia até o leste da Rússia e partes do sudeste asiático. Atualmente restrito a populações fragmentadas na Índia, Nepal, Butão, Bangladesh, Myanmar, Tailândia, Malásia, Indonésia, China e Rússia.',
    geographicData: {
      regions: ['Asia'],
      mainHabitat: 'Forest',
      density: {'Asia': 0.95},
      nativeRegions: ['Asia'],
      introducedRegions: [],
      observationPoints: [
        {
          lat: 21.0485, 
          lng: 81.7719, 
          id: 'obs1', 
          place: 'Kanha National Park, India', 
          observed_on: '2023-06-15'
        },
        {
          lat: 47.1499, 
          lng: 134.4508, 
          id: 'obs2', 
          place: 'Sikhote-Alin, Russia', 
          observed_on: '2023-02-18'
        }
      ]
    },
    additionalInfo: {
      habitat: 'Florestas tropicais, florestas temperadas, mangues, savanas e prados',
      characteristics: 'Listras pretas únicas como impressões digitais, corpo musculoso adaptado para caça',
      notes: 'Identificação baseada no padrão de listras e características corporais',
      interestingFacts: 'O maior felino selvagem do mundo. Existem seis subespécies vivas de tigres, todas ameaçadas de extinção. Podem consumir até 40 kg de carne em uma única refeição.',
      locationMatch: 'O tigre é encontrado principalmente em habitats florestais na Ásia. Se esta foto foi tirada fora da Ásia, provavelmente é um animal em cativeiro em um zoológico ou reserva.'
    }
  }
};

// Simula um erro quando os créditos da API acabaram
export const mockCreditsError = {
  identification: {
    category: 'error',
    name: 'API Usage Limit Reached',
    scientificName: 'N/A',
    confidence: 0,
    description: 'The API usage limit has been reached. Please try again later.',
    additionalInfo: {
      error: 'Insufficient credits. Add more using https://openrouter.ai/settings/credits',
      note: 'Free tier models have usage limitations. Please try again later or register for an account with OpenRouter.'
    }
  }
};

// Retorna uma identificação aleatória para testes
export function getMockIdentification() {
  // Gerar número aleatório entre 0 e 2
  const random = Math.floor(Math.random() * 3);
  
  // Retornar uma das três opções
  switch(random) {
    case 0:
      return mockPlantIdentification;
    case 1:
      return mockAnimalIdentification;
    case 2:
      return mockCreditsError;
  }
}