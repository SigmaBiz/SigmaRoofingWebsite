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
  companyLogo?: string;
  processStep1Image?: string;
  processStep2Image?: string;
  processStep3Image?: string;
  processStep4Image?: string;
  testimonialBackground?: string;
}

export async function getWebsiteImages(): Promise<WebsiteImages> {
  try {
    const response = await fetch('/api/website-images');
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.images) {
        // Also save to localStorage as backup
        Object.entries(data.images).forEach(([key, value]) => {
          if (value) {
            localStorage.setItem(key, value as string);
          }
        });
        return data.images;
      }
    }
  } catch (error) {
    console.log('API fetch failed, using localStorage');
  }
  
  // Fallback to localStorage
  const images: WebsiteImages = {};
  const imageKeys = [
    'heroBackground', 'heroFeatureImage', 'residentialRoofingImage', 'roofRepairImage',
    'roofInspectionImage', 'gutterServiceImage', 'stormDamageImage',
    'paintingServiceImage', 'teamPhoto', 'companyLogo',
    'processStep1Image', 'processStep2Image', 'processStep3Image',
    'processStep4Image', 'testimonialBackground'
  ];
  
  imageKeys.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
      images[key as keyof WebsiteImages] = value;
    }
  });
  
  return images;
}

export function getProjectsData() {
  const saved = localStorage.getItem('adminProjects');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (error) {
      console.error('Error parsing projects data');
    }
  }
  return [];
}