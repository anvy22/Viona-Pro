// New file: utils/cloudinary.ts (create this file to resolve the module not found error)
export async function uploadToCloudinaryWithProgress(
  file: File,
  uploadPreset: string,
  onProgress: (progress: number) => void
): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  if (!cloudName) {
    throw new Error('Cloudinary cloud name not configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME in your environment variables.');
  }

  if (!uploadPreset) {
    throw new Error('Upload preset is required');
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, true);
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded * 100) / e.total);
        onProgress(percent);
      }
    });

    xhr.onreadystatechange = () => {
      if (xhr.readyState !== 4) return;
      if (xhr.status !== 200) {
        reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText}`));
        return;
      }
      const response = JSON.parse(xhr.responseText);
      if (!response.secure_url) {
        reject(new Error('No secure_url in response'));
        return;
      }
      resolve(response.secure_url);
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    // Optional: formData.append('tags', 'product_image'); // Add tags if needed for organization

    xhr.send(formData);
  });
}