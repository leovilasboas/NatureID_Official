import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

// Import the DistributionMap component
const DistributionMap = dynamic(() => import('./DistributionMap'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-64 bg-black/60 flex items-center justify-center">
      <p className="text-spring-green animate-pulse">Loading map...</p>
    </div>
  )
});

export default function ResultDisplay({ results, onReset }) {
  const [showDetails, setShowDetails] = useState(false);
  const [showLocationDetails, setShowLocationDetails] = useState(false);
  
  if (!results || !results.identification) {
    return (
      <div className="text-center py-10">
        <div className="text-red-600 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-800">No Results Available</h3>
        <p className="text-gray-600 mt-1">Unable to process the identification results</p>
        <button
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          onClick={onReset}
        >
          Try Again
        </button>
      </div>
    );
  }
  
  // Verificar se é uma resposta de erro (por exemplo, limite de requisições excedido ou erro de autenticação)
  if (results.error || (results.identification && results.identification.category === 'error')) {
    // Extract error information either from API error response or identification error
    const errorName = results.error || (results.identification && results.identification.name) || 'API Error';
    const errorDescription = results.message || (results.identification && results.identification.description) || 'An error occurred during identification';
    const errorDetails = results.details || (results.identification && results.identification.additionalInfo) || {};
    const statusCode = results.status || null;
    
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden">
        <div className="p-8 text-center">
            <div className="text-amber-500 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          
            <h2 className="text-2xl font-bold text-white mb-4">
              {errorName}
              {statusCode && <span className="text-lg font-normal ml-2 text-white/70">(Status: {statusCode})</span>}
            </h2>
            <p className="text-white/90 text-lg mb-6">{errorDescription}</p>
          
            <div className="mb-8 bg-black/30 p-4 rounded-xl max-w-lg mx-auto text-left">
              {errorDetails.error && (
                <p className="text-amber-400 font-medium mb-2">
                  {errorDetails.error}
                </p>
              )}
              {errorDetails.note && (
                <p className="text-white/70">
                  {errorDetails.note}
                </p>
              )}
            
              {/* Authentication error specific advice */}
              {statusCode === 401 && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <p className="text-spring-green font-medium">Authentication Error:</p>
                  <p className="text-white/70 mt-2">
                    The API key is invalid or missing. Please check your API configuration.
                  </p>
                </div>
              )}
              
              {/* Rate limit error specific advice */}
              {(errorName === 'API Usage Limit Reached' || statusCode === 429) && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <p className="text-spring-green font-medium">Sugestões:</p>
                  <ul className="list-disc pl-5 text-white/70 mt-2 space-y-1">
                    <li>Aguarde alguns minutos e tente novamente</li>
                    <li>Tente com uma imagem diferente</li>
                    <li>Modelos gratuitos têm limites de uso - OpenRouter oferece mais requisições com uma conta</li>
                  </ul>
                </div>
              )}
            </div>
          
            <button
              className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white py-3 px-6 rounded-xl transition-all"
              onClick={onReset}
            >
              Try Again
            </button>
          
            {(errorName === 'API Usage Limit Reached' || statusCode === 429) && (
              <div className="mt-4">
                <a 
                  href="https://openrouter.ai/signup" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block bg-white/10 hover:bg-white/20 text-spring-green py-2 px-4 rounded-lg transition-all text-sm"
                >
                  Criar conta na OpenRouter
                </a>
              </div>
            )}
          </div>
      </div>
    );
  }

  const { 
    identification: { 
      category, 
      name, 
      popularName = name,
      scientificName, 
      taxonomicLevel = "Unknown",
      confidence,
      description,
      distribution = "Information not available",
      geographicData,
      additionalInfo
    } 
  } = results;

  // Parse confidence as a percentage
  const confidencePercentage = Math.round(confidence * 100);
  
  // Determine confidence level color and message
  const getConfidenceColor = () => {
    if (confidencePercentage >= 85) return 'text-green-600';
    if (confidencePercentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const getConfidenceMessage = () => {
    if (confidencePercentage >= 85) return 'High confidence';
    if (confidencePercentage >= 70) return 'Moderate confidence';
    if (confidencePercentage >= 50) return 'Low confidence';
    return 'Very uncertain';
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden">
      <div className="p-8">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mr-4">
            <img 
              src={category === 'plant' ? '/icons/plants.svg' : (category === 'insect' ? '/icons/animals.svg' : '/icons/animals.svg')} 
              alt={category}
              className="w-7 h-7"
            />
          </div>
          <div>
            <h2 className="text-2xl font-bold stripe-gradient-text">{name}</h2>
            {popularName && popularName !== name && (
              <p className="text-white/90 font-medium">{popularName}</p>
            )}
            <p className="text-white/60 italic">
              <a 
                href={`https://www.inaturalist.org/search?q=${encodeURIComponent(scientificName)}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-spring-green transition-colors"
              >
                {scientificName}
              </a>
            </p>
            <div className="flex items-center">
              <p className="text-white/50 text-sm">Taxonomic Level: {taxonomicLevel}</p>
              {additionalInfo && additionalInfo.aiSpecificID && (
                <span className="ml-2 px-2 py-0.5 bg-spring-green/20 text-spring-green text-xs rounded-full">
                  AI Enhanced ID
                </span>
              )}
              {results.identification.featuresUsed?.visualFeatures?.colors && (
                <div className="ml-2 flex items-center">
                  <span className="text-xs text-white/50 mr-1">Colors:</span>
                  <div className="flex space-x-1">
                    {results.identification.featuresUsed.visualFeatures.colors.slice(0, 4).map((color, i) => (
                      <span key={i} className="inline-block w-3 h-3 rounded-full border border-white/20" 
                        style={{
                          backgroundColor: color.toLowerCase().includes('black') ? 'black' : 
                                          color.toLowerCase().includes('white') ? 'white' :
                                          color.toLowerCase().includes('red') ? 'red' :
                                          color.toLowerCase().includes('blue') ? 'blue' :
                                          color.toLowerCase().includes('green') ? 'green' :
                                          color.toLowerCase().includes('yellow') ? 'yellow' :
                                          color.toLowerCase().includes('orange') ? 'orange' :
                                          color.toLowerCase().includes('brown') ? 'brown' :
                                          color.toLowerCase().includes('grey') || color.toLowerCase().includes('gray') ? 'gray' :
                                          color.toLowerCase().includes('purple') ? 'purple' : 
                                          color.toLowerCase().includes('metallic') ? '#a8d6dc' : '#888'
                        }}
                        title={color}
                      ></span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <span className="text-sm font-medium text-white/80 mr-2">Confidence:</span>
              <span className={`text-sm font-bold text-white`}>{confidencePercentage}%</span>
            </div>
            <div className="flex items-center">
              <div className={`text-xs px-3 py-1 rounded-full ${
                confidencePercentage >= 85 ? 'bg-black/60 text-spring-green border border-spring-green/30' : 
                confidencePercentage >= 70 ? 'bg-black/60 text-spring-green border border-spring-green/30' : 
                'bg-black/60 text-spring-green border border-spring-green/30'
              }`}>
                {getConfidenceMessage()}
              </div>
              {taxonomicLevel === 'species' && (
                <div className="ml-2 px-3 py-1 bg-spring-green text-black text-xs font-medium rounded-full">
                  Species-level ID
                </div>
              )}
              {taxonomicLevel === 'genus' && (
                <div className="ml-2 px-3 py-1 bg-spring-green/80 text-black text-xs font-medium rounded-full">
                  Genus-level ID
                </div>
              )}
            </div>
          </div>
          
          <div className="w-full bg-black/40 rounded-full h-3 border border-white/10">
            <div 
              className={`h-3 rounded-full ${
                confidencePercentage >= 85 ? 'bg-gradient-to-r from-lime-green to-spring-green' : 
                confidencePercentage >= 70 ? 'bg-gradient-to-r from-lime-green to-spring-green' : 
                'bg-gradient-to-r from-lime-green to-spring-green'
              }`}
              style={{ width: `${confidencePercentage}%` }}
            ></div>
          </div>
        </div>
        
        <div className="mb-8">
          <p className="text-white/90 leading-relaxed">{description}</p>
        </div>
        
        {distribution && (
          <div className="mb-6">
            <h3 className="text-lg font-bold text-spring-green mb-3">Geographic Distribution</h3>
            <p className="text-white/90 leading-relaxed">{distribution}</p>
            
            <div className="mt-4 bg-black/30 rounded-xl overflow-hidden border border-white/10">
              <DistributionMap 
                geographicData={geographicData} 
                centerOnObservation={results.location ? true : false}
                initialLocation={results.location?.coords}
              />
            </div>
          </div>
        )}
        
        {/* Location information if available in results */}
        {(results.location || (additionalInfo && additionalInfo.locationMatch)) && (
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-spring-green mb-3">Sighting Location</h3>
              {results.location && (
                <button
                  className="flex items-center text-green-400 hover:text-green-300 font-medium"
                  onClick={() => setShowLocationDetails(!showLocationDetails)}
                >
                  <span className="mr-2">{showLocationDetails ? 'Hide' : 'Show'} Map</span>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`h-5 w-5 transition-transform duration-300 ${showLocationDetails ? 'rotate-180' : ''}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
            </div>
            
            {results.location && (
              <div className="p-3 bg-spring-green/10 border border-spring-green/30 rounded-md text-white text-sm mb-3">
                <div className="font-medium">{results.location.name}</div>
                <div className="text-xs text-white/70 mt-1">
                  Coordinates: {results.location.coords.lat.toFixed(6)}, {results.location.coords.lng.toFixed(6)}
                </div>
                {results.location.source && (
                  <div className="text-xs text-white/70 mt-1">
                    Source: {results.location.source === 'gps' ? 'GPS' : 
                            results.location.source === 'exif' ? 'Image Metadata' : 'Manual Selection'}
                  </div>
                )}
              </div>
            )}
            
            {!results.location && additionalInfo && additionalInfo.locationMatch && (
              <div className="p-3 bg-spring-green/10 border border-spring-green/30 rounded-md text-white text-sm mb-3">
                <div className="font-medium">Location Analysis</div>
                <div className="text-white/90 mt-1">
                  {additionalInfo.locationMatch}
                </div>
              </div>
            )}
            
            {showLocationDetails && results.location && (
              <div className="mt-4 bg-black/30 rounded-xl overflow-hidden border border-white/10 h-64">
                {/* Mini map showing location */}
                <div className="h-full" id="location-map">
                  <DistributionMap 
                    geographicData={{
                      observationPoints: [{
                        lat: results.location.coords.lat,
                        lng: results.location.coords.lng,
                        id: "current",
                        quality: "current",
                        place: results.location.name
                      }]
                    }} 
                    centerOnObservation={true}
                  />
                </div>
              </div>
            )}
            
            {results.location && additionalInfo && additionalInfo.locationMatch && (
              <div className="mt-3 p-3 bg-white/10 rounded-md text-white/90 text-sm">
                  <span className="font-semibold text-spring-green">Region Impact on Identification: </span>
                  <span className="text-white/90">{additionalInfo.locationMatch}</span>
                  <p className="text-xs text-white/70 mt-2">Note: The search considers the entire Amazon region, not just the exact location of the photo. Click on the species names to see more information on iNaturalist. Results have been filtered to match the colors and characteristics in the image.</p>
                </div>
            )}
          </div>
        )}
        
        {/* Regional Specificity Section */}
        {additionalInfo && additionalInfo.regionalRelevance && (
          <div className="mb-8">
            <h3 className="text-lg font-bold text-spring-green mb-3">Regional Specificity</h3>
            <div className="bg-black/30 p-4 rounded-xl border border-spring-green/20">
              <p className="text-white/90 leading-relaxed">{additionalInfo.regionalRelevance}</p>
              
              {additionalInfo.regionSpecific && (
                <div className="mt-4 flex items-center">
                  <div className="bg-spring-green/20 p-2 rounded-full mr-3">
                    <svg className="w-5 h-5 text-spring-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <p className="text-spring-green font-medium">Region-specific identification</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Distinctive Features Section */}
        {additionalInfo && additionalInfo.specificFeatures && (
          <div className="mb-6">
            <h3 className="text-lg font-bold text-spring-green mb-3">Distinctive Features</h3>
            <div className="p-4 bg-black/30 rounded-xl border border-spring-green/20 text-white/90">
              {additionalInfo.specificFeatures}
              
              {additionalInfo.visualFiltering && (
                <div className="mt-3 pt-3 border-t border-white/10 text-sm text-white/70">
                  <span className="text-spring-green font-medium">Visual Matching: </span>
                  {additionalInfo.visualFiltering}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Possible Specific Species */}
        {additionalInfo && additionalInfo.possibleSpecificSpecies && (
          <div className="mb-6">
            <h3 className="text-lg font-bold text-spring-green mb-3">Possible Specific Species</h3>
            <div className="p-4 bg-black/30 rounded-xl border border-spring-green/20 text-white/90">
              {additionalInfo.possibleSpecificSpecies}
            </div>
          </div>
        )}
        
                {/* Top 10 Alternative Identifications */}
                {results.identification.suggestions && results.identification.suggestions.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-bold text-spring-green mb-3">Top 10 Possible Species</h3>
                    <div className="bg-black/30 rounded-xl border border-white/10 overflow-hidden">
                      <table className="w-full text-sm text-white/90">
                        <thead className="bg-black/60 text-left">
                          <tr>
                            <th className="px-4 py-3 font-medium">Name</th>
                            <th className="px-4 py-3 font-medium">Scientific Name</th>
                            <th className="px-4 py-3 font-medium">Taxonomic Level</th>
                            <th className="px-4 py-3 font-medium text-right">Confidence & Visual Match</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {results.identification.suggestions.map((suggestion, index) => (
                            <tr key={index} className={`${index === 0 ? 'bg-spring-green/10' : ''} hover:bg-white/10 cursor-pointer transition-colors`}>
                              <td className="px-4 py-3 font-medium">
                                {suggestion.iNaturalistTaxonId ? (
                                  <a 
                                    href={`https://www.inaturalist.org/taxa/${suggestion.iNaturalistTaxonId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-spring-green hover:underline"
                                  >
                                    {suggestion.name}
                                  </a>
                                ) : suggestion.name}
                              </td>
                              <td className="px-4 py-3 italic">{suggestion.scientificName}</td>
                              <td className="px-4 py-3">{suggestion.taxonomicLevel}</td>
                              <td className="px-4 py-3 text-right">
                                {Math.round(suggestion.confidence * 100)}%
                                {suggestion.colors && suggestion.colors.length > 0 && (
                                  <div className="flex items-center justify-end mt-1 space-x-1">
                                    {suggestion.colors.slice(0, 3).map((color, i) => (
                                      <span key={i} className="inline-block w-3 h-3 rounded-full" 
                                        style={{
                                          backgroundColor: color.toLowerCase().includes('black') ? 'black' : 
                                                          color.toLowerCase().includes('white') ? 'white' :
                                                          color.toLowerCase().includes('red') ? 'red' :
                                                          color.toLowerCase().includes('blue') ? 'blue' :
                                                          color.toLowerCase().includes('green') ? 'green' :
                                                          color.toLowerCase().includes('yellow') ? 'yellow' :
                                                          color.toLowerCase().includes('orange') ? 'orange' :
                                                          color.toLowerCase().includes('brown') ? 'brown' :
                                                          color.toLowerCase().includes('grey') || color.toLowerCase().includes('gray') ? 'gray' :
                                                          color.toLowerCase().includes('purple') ? 'purple' : 
                                                          color.toLowerCase().includes('metallic') ? '#a8d6dc' : '#888'
                                        }}
                                        title={color}
                                      ></span>
                                    ))}
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {additionalInfo && (
                  <div className="mb-8">
                    <button
                      className="flex items-center text-green-400 hover:text-green-300 font-medium"
                      onClick={() => setShowDetails(!showDetails)}
                    >
                      <span className="mr-2">{showDetails ? 'Hide' : 'Show'} Technical Details</span>
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`h-5 w-5 transition-transform duration-300 ${showDetails ? 'rotate-180' : ''}`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
            
                    {showDetails && (
                      <div className="mb-8 bg-white/10 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-white/10">
                        {Object.entries(additionalInfo)
                          .filter(([key]) => !['regionalRelevance', 'regionSpecific', 'specificFeatures', 'possibleSpecificSpecies', 'aiSpecificID', 'visualFiltering'].includes(key))
                          .map(([key, value]) => (
                            <div key={key} className="mb-3 last:mb-0 pb-3 last:pb-0 border-b last:border-b-0 border-white/10">
                              <span className="font-semibold text-white">{key}: </span>
                              <span className="text-white/80">{value}</span>
                            </div>
                          ))
                        }
                      </div>
                    )}
                  </div>
                )}
        
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <button
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 py-3 px-6 rounded-xl order-2 sm:order-1 transition-all"
            onClick={onReset}
          >
            Identify Another
          </button>
          
          <button
            className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white py-3 px-6 rounded-xl order-1 sm:order-2 transition-all"
            onClick={() => {
              // This would navigate to premium for more details in a real app
              window.location.href = '/premium';
            }}
          >
            Premium Details
          </button>
        </div>
      </div>
    </div>
  );
}
