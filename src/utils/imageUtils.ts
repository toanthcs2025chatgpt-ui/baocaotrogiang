/**
 * Image compression and optimization utility.
 * Prevents localStorage QuotaExceededError and optimizes upload speed and memory usage.
 */

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: "image/webp" | "image/jpeg";
}

export function compressImageFile(
  file: File | Blob,
  options: CompressOptions = {}
): Promise<string> {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.82,
    mimeType = "image/jpeg",
  } = options;

  return new Promise((resolve, reject) => {
    // If it's already a tiny file (< 40KB) and not an image that needs resizing, check if we can read it
    if (file.size > 0 && file.size <= 40 * 1024 && file.type === "image/png") {
      const directReader = new FileReader();
      directReader.onload = () => {
        if (typeof directReader.result === "string") {
          resolve(directReader.result);
        } else {
          reject(new Error("Failed to read image as data URL"));
        }
      };
      directReader.onerror = () => reject(new Error("File reading failed"));
      directReader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;

          // Downscale if larger than max dimensions
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            // Fallback to original string if canvas context unavailable
            resolve(event.target?.result as string);
            return;
          }

          // Fill white background in case of transparent png converting to jpeg
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, width, height);

          ctx.drawImage(img, 0, 0, width, height);

          // Use WebP if supported, otherwise JPEG
          const outputType = mimeType === "image/webp" ? "image/webp" : "image/jpeg";
          const dataUrl = canvas.toDataURL(outputType, quality);
          resolve(dataUrl);
        } catch (err) {
          // If canvas fails, fallback to direct data url
          resolve(event.target?.result as string);
        }
      };
      img.onerror = () => {
        reject(new Error("Failed to load image for compression"));
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error("File reading failed"));
    reader.readAsDataURL(file);
  });
}
