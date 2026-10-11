import QRCode from 'qrcode';

/**
 * Generate QR code data URL (PNG)
 */
export async function generateQrDataUrl(
  text: string,
  options?: { width?: number; margin?: number; darkColor?: string; lightColor?: string }
): Promise<string> {
  const width = options?.width || 512;
  const margin = options?.margin ?? 2;
  const darkColor = options?.darkColor || '#0f2b5c';
  const lightColor = options?.lightColor || '#ffffff';

  return QRCode.toDataURL(text, {
    width,
    margin,
    color: {
      dark: darkColor,
      light: lightColor,
    },
    errorCorrectionLevel: 'H',
  });
}

/**
 * Generate high-resolution SVG string
 */
export async function generateQrSvgString(
  text: string,
  options?: { margin?: number; darkColor?: string; lightColor?: string }
): Promise<string> {
  const margin = options?.margin ?? 2;
  const darkColor = options?.darkColor || '#0f2b5c';
  const lightColor = options?.lightColor || '#ffffff';

  return QRCode.toString(text, {
    type: 'svg',
    margin,
    color: {
      dark: darkColor,
      light: lightColor,
    },
    errorCorrectionLevel: 'H',
  });
}

/**
 * Immediately download high-contrast PNG QR code for print
 */
export async function downloadQrCodePng(
  url: string,
  fileName = 'qr-code.png'
): Promise<void> {
  try {
    const dataUrl = await generateQrDataUrl(url, { width: 1024, margin: 2 });
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName.endsWith('.png') ? fileName : `${fileName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error('Failed to download PNG QR code:', err);
    throw err;
  }
}

/**
 * Immediately download high-resolution SVG QR code
 */
export async function downloadQrCodeSvg(
  url: string,
  fileName = 'qr-code.svg'
): Promise<void> {
  try {
    const svgString = await generateQrSvgString(url, { margin: 2 });
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName.endsWith('.svg') ? fileName : `${fileName}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.error('Failed to download SVG QR code:', err);
    throw err;
  }
}

/**
 * Robust copy link helper with clipboard API and manual fallback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below
    }
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
}
