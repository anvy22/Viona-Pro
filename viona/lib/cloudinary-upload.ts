// utils/cloudinary.ts or lib/cloudinary-upload.ts
export interface UploadResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
}

export interface UploadProgressCallback {
  (progress: number): void;
}

export const uploadToCloudinary = async (
  file: File, 
  onProgress?: UploadProgressCallback
): Promise<string> => {
  const uploadPreset = 'viona_products';
  
  // Validate file
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Invalid file format. Accepted formats: ${allowedTypes.map(f => f.split('/')[1]).join(', ')}`);
  }
  
  if (file.size > maxSize) {
    throw new Error('File size exceeds 5MB limit');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', 'viona/products');
  
  // Enhanced transformation parameters
  formData.append('transformation', JSON.stringify([
    { quality: 'auto:good' },
    { fetch_format: 'auto' },
    { width: 800, height: 800, crop: 'limit' },
    { flags: 'progressive' },
    { dpr: 'auto' }
  ]));

  try {
    // Simulate progress if callback provided
    if (onProgress) {
      const progressInterval = setInterval(() => {
        // This is just for UX, real progress tracking needs XMLHttpRequest
        onProgress(Math.random() * 80);
      }, 200);
      
      setTimeout(() => clearInterval(progressInterval), 2000);
    }

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/dxbyd5wae/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Upload failed');
    }

    const data: UploadResult = await response.json();
    
    if (onProgress) {
      onProgress(100);
    }
    
    return data.secure_url;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to upload image');
  }
};

// Alternative version with XMLHttpRequest for real progress tracking
export const uploadToCloudinaryWithProgress = (
  file: File,
  onProgress?: UploadProgressCallback
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadPreset = 'viona_products';
    
    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    
    if (!allowedTypes.includes(file.type)) {
      reject(new Error(`Invalid file format. Accepted formats: ${allowedTypes.map(f => f.split('/')[1]).join(', ')}`));
      return;
    }
    
    if (file.size > maxSize) {
      reject(new Error('File size exceeds 5MB limit'));
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', 'viona/products');
    
    formData.append('transformation', JSON.stringify([
      { quality: 'auto:good' },
      { fetch_format: 'auto' },
      { width: 800, height: 800, crop: 'limit' },
      { flags: 'progressive' },
      { dpr: 'auto' }
    ]));

    const xhr = new XMLHttpRequest();

    // Track upload progress
    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          onProgress(Math.round(percentComplete));
        }
      });
    }

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        try {
          const data: UploadResult = JSON.parse(xhr.responseText);
          resolve(data.secure_url);
        } catch (error) {
          reject(new Error('Failed to parse response'));
        }
      } else {
        try {
          const errorData = JSON.parse(xhr.responseText);
          reject(new Error(errorData.error?.message || 'Upload failed'));
        } catch {
          reject(new Error('Upload failed'));
        }
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });

    xhr.open('POST', `https://api.cloudinary.com/v1_1/dxbyd5wae/image/upload`);
    xhr.send(formData);
  });
};
