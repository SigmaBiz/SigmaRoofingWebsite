import { v2 as cloudinary } from 'cloudinary';

// Cloudinary configuration
export const cloudinaryConfig = {
  cloud_name: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
  api_key: import.meta.env.VITE_CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
};

// Configure Cloudinary (server-side only)
if (typeof window === 'undefined') {
  cloudinary.config(cloudinaryConfig);
}

// Function to get optimized image URL
export function getOptimizedImageUrl(publicId: string, options: {
  width?: number;
  height?: number;
  quality?: string;
  format?: string;
} = {}): string {
  const {
    width = 800,
    height = 600,
    quality = 'auto',
    format = 'auto'
  } = options;

  const cloudName = cloudinaryConfig.cloud_name;
  return `https://res.cloudinary.com/${cloudName}/image/upload/w_${width},h_${height},c_fill,f_${format},q_${quality}/${publicId}`;
}

// Function to get thumbnail URL
export function getThumbnailUrl(publicId: string): string {
  return getOptimizedImageUrl(publicId, {
    width: 300,
    height: 200,
    quality: 'auto'
  });
}

// Function to get full-size image URL
export function getFullImageUrl(publicId: string): string {
  return getOptimizedImageUrl(publicId, {
    width: 1200,
    height: 800,
    quality: '80'
  });
}