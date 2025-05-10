import { identifyWithOpenRouter } from '../../utils/openRouterApi';
import { addToHistory } from '../../utils/memoryDb';
import { processImageServerSide } from '../../utils/imageProcessing';

// Chave API para teste - em produção isto deve vir das variáveis de ambiente
const OPENROUTER_API_KEY = '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';

// Configure Next.js API route to handle larger payloads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Increase the body parser limit for image uploads
    },
  },
};

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log("API request received:", req.method, req.url);
    const { image, location } = req.body;

    console.log("Image data received:", image ? 
      `${typeof image} (length: ${image.length})` : "null");
    
    console.log("Location data received:", location ? 
      JSON.stringify(location) : "null");

    if (!image) {
      return res.status(400).json({ message: 'No image provided' });
    }

    // Process image for server-side use (extract base64 content)
    const processedImage = await processImageServerSide(image);
    console.log("Processed image size:", processedImage.length);
    
    // Call OpenRouter API for identification with location data
    console.log("Calling OpenRouter API with location data...");
    
    let identificationResults;
    
    try {
      identificationResults = await identifyWithOpenRouter(processedImage, location, OPENROUTER_API_KEY);
    } catch (apiError) {
      console.error("API error:", apiError.message);
      // Propagate the API error to the client
      throw apiError;
    }

    // Extract results
    if (!identificationResults || !identificationResults.identification) {
      return res.status(500).json({ 
        message: 'Failed to identify the image. The AI service returned an invalid response.' 
      });
    }
    
    // Log results para debug 
    console.log('Resultados da identificação:');
    console.log('Categoria:', identificationResults?.identification?.category);
    console.log('Nome científico:', identificationResults?.identification?.scientificName);
    
    // Verificar se é um erro de rate limit
    if (identificationResults?.identification?.category === 'error') {
      console.log('Erro identificado:', identificationResults?.identification?.name);
      console.log('Descrição:', identificationResults?.identification?.description);
      
      // Retornar erro para o frontend com código de status apropriado
      if (identificationResults?.identification?.name === 'Rate Limit Exceeded') {
        return res.status(429).json({
          message: identificationResults?.identification?.description,
          error: identificationResults?.identification?.additionalInfo?.error || 'Rate limit exceeded',
          details: identificationResults
        });
      }
      
      // Outros tipos de erros
      return res.status(400).json({
        message: identificationResults?.identification?.description,
        error: identificationResults?.identification?.name,
        details: identificationResults
      });
    }
    
    if (identificationResults?.identification?.geographicData) {
      console.log('Dados geográficos presentes:', 
        Object.keys(identificationResults.identification.geographicData).join(', '));
      console.log('Regiões nativas:', 
        identificationResults.identification.geographicData.nativeRegions?.join(', ') || 'Nenhuma');
      console.log('Densidade populacional:', 
        JSON.stringify(identificationResults.identification.geographicData.density || {}));
    } else {
      console.log('Sem dados geográficos nos resultados');
    }

    // Store in history (keep original image for display)
    const historyItem = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      imageData: image, // Store original image for better quality in history view
      location: location, // Store location data
      results: identificationResults,
      type: identificationResults.identification.category // 'plant', 'animal', or 'error'
    };

    addToHistory(historyItem);

    // Return results to client
    return res.status(200).json(identificationResults);
  } catch (error) {
    console.error('General identification error:', error);
    
    // Return the actual error to the client with appropriate status code
    const statusCode = error.message?.includes('401') ? 401 :
                       error.message?.includes('402') ? 402 :
                       error.message?.includes('429') ? 429 : 500;
    
    return res.status(statusCode).json({ 
      message: `Failed to process image: ${error.message || 'Unknown error'}`,
      error: error.message,
      details: error.response?.data || {}
    });
  }
}