import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  initialQuality?: number;
  fileType?: string;
}

/**
 * Safe wrapper for image compression that enforces useWebWorker: false
 * to prevent runtime errors in WebContainer/StackBlitz environments.
 */
export const compressImageSafe = async (file: File, options: CompressionOptions = {}): Promise<File> => {
  // Default options
  const defaultOptions = {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1280,
    useWebWorker: false, // CRITICAL: Must be false to avoid "t._onTimeout is not a function"
    fileType: 'image/jpeg',
    initialQuality: 0.8
  };

  const finalOptions = {
    ...defaultOptions,
    ...options,
    useWebWorker: false // Enforce this override
  };

  try {
    return await imageCompression(file, finalOptions);
  } catch (error) {
    console.warn("Image compression failed, falling back to original file:", error);
    return file;
  }
};
