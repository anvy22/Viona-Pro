// Optimized components/ui/image-upload.tsx
"use client";

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  X, 
  ImageIcon, 
  Loader2, 
  Camera,
  AlertCircle,
  Check,
  RefreshCw,
  UploadCloud,
  FileImage
} from 'lucide-react';
import { toast } from 'sonner';
import { uploadToCloudinaryWithProgress } from "../../lib/cloudinary-progress"; 

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  disabled?: boolean;
  maxSizeInMB?: number;
  acceptedFormats?: string[];
  className?: string;
  showPreview?: boolean;
  uploadPreset?: string;
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  disabled = false,
  maxSizeInMB = 5,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
  className = '',
  showPreview = true,
  uploadPreset,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!acceptedFormats.includes(file.type)) {
      const msg = `Invalid file format. Accepted: ${acceptedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')}`;
      setError(msg);
      toast.error(msg);
      return;
    }

    if (file.size > maxSizeInMB * 1024 * 1024) {
      const msg = `File size exceeds ${maxSizeInMB}MB`;
      setError(msg);
      toast.error(msg);
      return;
    }

    setError(null);
    setImageError(false);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const imageUrl = await uploadToCloudinaryWithProgress(
        file,
        uploadPreset || 'ml_default',
        (progress) => {
          setUploadProgress(progress);
        }
      );
      
      onChange(imageUrl);
      
      toast.success('Image uploaded successfully!', {
        description: `${file.name} has been uploaded to your product database`,
        duration: 4000,
        icon: <Check className="h-4 w-4" />,
      });
      
      setTimeout(() => setUploadProgress(0), 1000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload image';
      setError(errorMessage);
      toast.error('Upload failed', {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsUploading(false);
    }
  }, [onChange, acceptedFormats, maxSizeInMB, uploadPreset]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled || isUploading) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [disabled, isUploading, handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  }, [disabled, isUploading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFileUpload]);

  const handleRemove = useCallback(() => {
    if (onRemove) {
      onRemove();
    } else {
      onChange('');
    }
    setError(null);
    setImageError(false);
    toast.success('Image removed', {
      description: 'Image has been removed from your product database.',
      duration: 3000,
    });
  }, [onChange, onRemove]);

  const openFileDialog = useCallback(() => {
    if (!disabled && !isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled, isUploading]);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  const handleImageLoad = useCallback(() => {
    setImageError(false);
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept={acceptedFormats.join(',')}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {!value || imageError ? (
        <Card 
          className={`relative transition-all duration-300 group ${
            isDragging 
              ? 'border-primary bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-dashed shadow-lg scale-[1.02]' 
              : 'border-dashed border-2 border-muted-foreground/25 hover:border-primary/50 hover:bg-gradient-to-br hover:from-muted/50 hover:to-background hover:shadow-md hover:scale-[1.01]'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onClick={openFileDialog}
        >
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            {isUploading ? (
              <div className="space-y-6">
                <div className="relative">
                  <UploadCloud className="h-12 w-12 text-primary/30 absolute inset-0 animate-ping" />
                  <UploadCloud className="h-12 w-12 text-primary relative z-10" />
                </div>
                <p className="text-base font-semibold text-primary">Uploading image...</p>
                <div className="space-y-2">
                  <Progress value={uploadProgress} className="w-64 h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Uploading</span>
                    <span className="font-mono">{uploadProgress}%</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {isDragging ? (
                  <div className="relative">
                    <Upload className="h-16 w-16 text-primary/50 absolute inset-0 animate-pulse" />
                    <Upload className="h-16 w-16 text-primary relative z-10" />
                  </div>
                ) : (
                  <div className="relative group-hover:scale-110 transition-transform duration-200">
                    <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-primary/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
                    <FileImage className="h-16 w-16 text-muted-foreground group-hover:text-primary transition-colors duration-200 relative z-10" />
                  </div>
                )}
                
                <p className="text-lg font-semibold mb-1">
                  {isDragging ? 'Drop your image here' : imageError ? 'Upload a new image' : 'Upload product image'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isDragging ? 'Release to upload' : 'Drag and drop or click to browse'}
                </p>
                
                <div className="flex flex-wrap gap-2 justify-center">
                  <Badge variant="secondary" className="text-xs">
                    Max {maxSizeInMB}MB
                  </Badge>
                  {acceptedFormats.map(format => (
                    <Badge key={format} variant="outline" className="text-xs">
                      {format.split('/')[1].toUpperCase()}
                    </Badge>
                  ))}
                </div>

                {!isDragging && (
                  <Button 
                    type="button"
                    variant="outline" 
                    size="lg"
                    className="mt-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200"
                    disabled={disabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      openFileDialog();
                    }}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Choose Image
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        showPreview && (
          <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="relative aspect-square w-full max-w-sm mx-auto">
                <div className="relative h-full w-full overflow-hidden rounded-xl bg-muted">
                  <img
                    src={value}
                    alt="Product image"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={handleImageError}
                    onLoad={handleImageLoad}
                    style={{ display: imageError ? 'none' : 'block' }}
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {imageError && (
                    <div className="w-full h-full flex items-center justify-center bg-muted rounded-xl">
                      <div className="text-center space-y-2">
                        <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground font-medium">Failed to load image</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-9 w-9 p-0 bg-white/50 hover:color-red-500 shadow-md backdrop-blur-sm"
                      onClick={openFileDialog}
                      disabled={disabled || isUploading}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="h-9 w-9 p-0 shadow-md"
                      onClick={handleRemove}
                      disabled={disabled}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Badge className="bg-green-500/90 text-white backdrop-blur-sm">
                      <Check className="h-3 w-3 mr-1" />
                      Uploaded
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="mt-4 text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Click the buttons above to replace or remove
                </p>
                <p className="text-xs text-muted-foreground">
                  Or drag a new image anywhere on the card
                </p>
              </div>
            </CardContent>
          </Card>
        )
      )}

      {error && (
        <Alert variant="destructive" className="border-l-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="font-medium">{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
