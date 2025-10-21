// lib/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dxbyd5wae',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Force HTTPS
});

export default cloudinary;

// Upload preset configuration
export const CLOUDINARY_UPLOAD_PRESET = 'viona_products';

// Helper function to generate Cloudinary URLs
export const getCloudinaryUrl = (publicId: string, transformations?: string) => {
  const baseUrl = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/`;
  return transformations ? `${baseUrl}${transformations}/${publicId}` : `${baseUrl}${publicId}`;
};

// Common transformations
export const CLOUDINARY_TRANSFORMATIONS = {
  thumbnail: 'w_150,h_150,c_fill,f_auto,q_auto',
  medium: 'w_400,h_400,c_fill,f_auto,q_auto',
  large: 'w_800,h_800,c_limit,f_auto,q_auto',
  optimized: 'f_auto,q_auto:good',
};
