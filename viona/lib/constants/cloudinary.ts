// lib/constants/cloudinary.ts
export const CLOUDINARY_CONFIG = {
  CLOUD_NAME: 'dxbyd5wae',
  UPLOAD_PRESET: 'viona_products',
  FOLDER: 'viona/products',
  API_URL: `https://api.cloudinary.com/v1_1/dxbyd5wae/image/upload`,
  TRANSFORMATIONS: {
    PRODUCT_UPLOAD: [
      { quality: 'auto:good' },
      { fetch_format: 'auto' },
      { width: 800, height: 800, crop: 'limit' },
      { flags: 'progressive' },
      { dpr: 'auto' }
    ],
    THUMBNAIL: [
      { width: 150, height: 150, crop: 'fill' },
      { quality: 'auto' },
      { fetch_format: 'auto' }
    ]
  }
};
