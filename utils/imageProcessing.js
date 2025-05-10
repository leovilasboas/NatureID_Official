/**
 * Utility functions for processing images before sending to AI
 */

/**
 * Process an image to ensure it's in a suitable format for the AI
 * @param {string} imageDataUrl - Base64 encoded image data URL
 * @returns {string} Processed image data URL
 */
export async function processImage(imageDataUrl) {
  try {
    // Ensure we have a valid data URL
    if (!imageDataUrl || !imageDataUrl.startsWith('data:image/')) {
      throw new Error('Invalid image data');
    }

    // Create an image to load the data URL
    const img = document.createElement('img');
    
    // Create a promise to handle the image loading
    const imageLoaded = new Promise((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load image'));
    });
    
    // Set the source and start loading
    img.src = imageDataUrl;
    
    // Wait for the image to load
    await imageLoaded;
    
    // Create a canvas element for processing
    const canvas = document.createElement('canvas');
    
    // Calculate dimensions (max 1024px width/height while preserving aspect ratio)
    let { width, height } = img;
    const MAX_DIMENSION = 1024;
    
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      if (width > height) {
        height = Math.round((height * MAX_DIMENSION) / width);
        width = MAX_DIMENSION;
      } else {
        width = Math.round((width * MAX_DIMENSION) / height);
        height = MAX_DIMENSION;
      }
    }
    
    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;
    
    // Draw image on canvas with new dimensions
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);
    
    // Convert to JPEG and reduce quality to save bandwidth
    const processedImageDataUrl = canvas.toDataURL('image/jpeg', 0.85);
    
    return processedImageDataUrl;
  } catch (error) {
    console.error('Image processing error:', error);
    
    // If something goes wrong, return the original image
    return imageDataUrl;
  }
}

/**
 * Server-side image processing function for the API route
 * @param {string} imageDataUrl - Base64 encoded image data URL
 * @returns {string} Processed image data URL
 */
export async function processImageServerSide(imageDataUrl) {
  try {
    console.log('processImageServerSide received:', 
      typeof imageDataUrl === 'string' 
        ? `${imageDataUrl.substring(0, 50)}... (length: ${imageDataUrl.length})` 
        : typeof imageDataUrl);
    
    // Check if we have an image at all
    if (!imageDataUrl) {
      console.error('No image data provided to processImageServerSide');
      throw new Error('No image data provided');
    }
    
    // Ensure we have a valid data URL
    if (!imageDataUrl.startsWith('data:image/')) {
      console.error('Invalid image data format, expected data:image/ URL');
      // If it's not a data URL but still has content, we'll just return it as-is
      // The API handler will deal with it
      return imageDataUrl;
    }
    
    // For server-side processing, we'll just extract the base64 data
    // and return it without the data URL prefix to save space
    const parts = imageDataUrl.split(',');
    if (parts.length !== 2) {
      console.error('Invalid data URL format');
      return imageDataUrl;
    }
    
    // Return the full data URL to ensure compatibility with the API
    // This is a change from previous code that tried to extract just the base64 part
    console.log('Extracted base64 data length:', parts[1].length);
    
    return imageDataUrl;
  } catch (error) {
    console.error('Server-side image processing error:', error);
    // If something goes wrong, return the original data
    return imageDataUrl;
  }
}
