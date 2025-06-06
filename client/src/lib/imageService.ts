interface WebsiteImages {
  heroBackground?: string;
  heroFeatureImage?: string;
  residentialRoofingImage?: string;
  roofRepairImage?: string;
  roofInspectionImage?: string;
  gutterServiceImage?: string;
  stormDamageImage?: string;
  paintingServiceImage?: string;
  teamPhoto?: string;
  visionImage?: string;
  companyLogo?: string;
  processStep1Image?: string;
  processStep2Image?: string;
  processStep3Image?: string;
  processStep4Image?: string;
  testimonialBackground?: string;
  stormReportBackground?: string;
}

export async function getWebsiteImages(): Promise<WebsiteImages> {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  console.log(`[ImageService] Loading images - Mobile: ${isMobile}, URL: ${window.location.href}`);
  
  try {
    // Create absolute URL for better mobile compatibility
    const baseUrl = window.location.origin;
    const apiUrl = `${baseUrl}/api/website-images`;
    console.log(`[ImageService] Fetching from: ${apiUrl}`);
    
    // Add timeout for slow mobile networks
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      console.log('[ImageService] API response:', data);
      
      if (data.success && data.images) {
        // Check if API has any non-null images
        const hasValidImages = Object.values(data.images).some(value => value !== null && value !== undefined && value !== '');
        
        if (hasValidImages) {
          // Also save to localStorage as backup
          Object.entries(data.images).forEach(([key, value]) => {
            if (value) {
              localStorage.setItem(key, value as string);
            }
          });
          console.log('[ImageService] Successfully loaded images from API');
          return data.images;
        } else {
          console.log('[ImageService] API returned null/empty images, falling back to localStorage');
        }
      }
    } else {
      console.error('[ImageService] API error:', response.status, response.statusText);
      // For 404 errors, don't retry, just use localStorage
      if (response.status === 404) {
        console.log('[ImageService] API endpoint not found, using localStorage only');
      }
    }
  } catch (error) {
    console.error('[ImageService] Fetch error:', error);
    if (error instanceof Error) {
      console.error('[ImageService] Error details:', error.message);
    }
  }
  
  // Fallback to localStorage
  console.log('[ImageService] Falling back to localStorage');
  const images: WebsiteImages = {};
  const imageKeys = [
    'heroBackground', 'heroFeatureImage', 'residentialRoofingImage', 'roofRepairImage',
    'roofInspectionImage', 'gutterServiceImage', 'stormDamageImage',
    'paintingServiceImage', 'teamPhoto', 'visionImage', 'companyLogo',
    'processStep1Image', 'processStep2Image', 'processStep3Image',
    'processStep4Image', 'testimonialBackground', 'stormReportBackground'
  ];
  
  imageKeys.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
      images[key as keyof WebsiteImages] = value;
    }
  });
  
  console.log('[ImageService] LocalStorage images found:', Object.keys(images).length);
  return images;
}

export async function getProjectsData() {
  console.log('[ImageService] Loading projects data');
  
  try {
    // Try API first
    const baseUrl = window.location.origin;
    const apiUrl = `${baseUrl}/api/projects`;
    console.log(`[ImageService] Fetching projects from: ${apiUrl}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      console.log('[ImageService] Projects API response:', data);
      
      if (data.success && data.projects && data.projects.length > 0) {
        // Save to localStorage as backup
        localStorage.setItem('adminProjects', JSON.stringify(data.projects));
        console.log('[ImageService] Successfully loaded projects from API');
        return data.projects;
      } else if (data.success && data.projects && data.projects.length === 0) {
        console.log('[ImageService] API returned empty projects, checking localStorage');
        // API is working but returned empty data, fall through to localStorage
      }
    } else {
      console.error('[ImageService] Projects API error:', response.status);
    }
  } catch (error) {
    console.error('[ImageService] Projects fetch error:', error);
  }
  
  // Fallback to localStorage
  console.log('[ImageService] Falling back to localStorage for projects');
  const saved = localStorage.getItem('adminProjects');
  if (saved) {
    try {
      const projects = JSON.parse(saved);
      console.log('[ImageService] LocalStorage projects found:', projects.length);
      return projects;
    } catch (error) {
      console.error('[ImageService] Error parsing projects data:', error);
    }
  }
  return [];
}