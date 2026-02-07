export type CropArea = { width: number; height: number; x: number; y: number };

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => {
      console.error('Failed to load image:', error);
      reject(new Error('Failed to load image'));
    });
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
}

export async function getCroppedImg(imageSrc: string, pixelCrop: CropArea): Promise<string> {
  try {
    // For data URLs, we can load directly
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.error('Failed to get canvas context');
      return imageSrc;
    }

    // Use the crop dimensions to create the output
    const size = Math.max(pixelCrop.width, pixelCrop.height);
    canvas.width = size;
    canvas.height = size;

    // Create circular clip
    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();

    // Draw the cropped portion of the image
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      size,
      size
    );

    ctx.restore();

    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error cropping image:', error);
    return imageSrc;
  }
}

export function getInitials(name?: string | null): string {
  if (!name || typeof name !== 'string') return 'U';
  const trimmed = name.trim();
  if (!trimmed) return 'U';
  
  const parts = trimmed.split(/\s+/).filter(p => p.length > 0);
  if (parts.length === 0) return 'U';

  const first = parts[0]?.[0] ?? 'U';
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '';
  
  return (first + last).toUpperCase().substring(0, 2);
}

export function createAvatarSvgDataUrl(
  initials: string,
  bg1: string,
  bg2: string,
  fg = '#FFFFFF'
): string {
  try {
    // Validate inputs
    const validInitials = (initials || 'U').substring(0, 2);
    const validBg1 = bg1 || '#6366F1';
    const validBg2 = bg2 || '#3B82F6';
    const validFg = fg || '#FFFFFF';

    // Generate unique gradient ID to avoid conflicts
    const gradId = `grad-${Math.random().toString(36).slice(2, 9)}`;

    // Create SVG with proper XML encoding
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <defs>
    <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${validBg1}"/>
      <stop offset="100%" stop-color="${validBg2}"/>
    </linearGradient>
  </defs>
  <rect width="256" height="256" rx="128" fill="url(#${gradId})"/>
  <text x="128" y="128" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="104" font-weight="700" fill="${validFg}">${validInitials}</text>
</svg>`;

    // Use base64 encoding for better compatibility
    const encoded = btoa(unescape(encodeURIComponent(svg)));
    return `data:image/svg+xml;base64,${encoded}`;
  } catch (error) {
    console.error('Error creating avatar SVG:', error);
    // Return a fallback solid color avatar
    return createFallbackAvatarDataUrl();
  }
}

function createFallbackAvatarDataUrl(): string {
  try {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <rect width="256" height="256" rx="128" fill="#6366F1"/>
  <text x="128" y="128" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, sans-serif" font-size="104" font-weight="700" fill="#FFFFFF">U</text>
</svg>`;
    const encoded = btoa(unescape(encodeURIComponent(svg)));
    return `data:image/svg+xml;base64,${encoded}`;
  } catch {
    return 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22256%22 height=%22256%22%3E%3Crect width=%22256%22 height=%22256%22 fill=%22%236366F1%22/%3E%3C/svg%3E';
  }
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  try {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error downloading file:', error);
  }
}
