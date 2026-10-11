import QRCode from 'qrcode';

export interface QRGenerationOptions {
  url: string;
  schoolTitle?: string;
  tagline?: string;
  width?: number;
}

export async function generateQRCodeDataUrl(options: QRGenerationOptions): Promise<string> {
  const { url, width = 1000 } = options;
  return QRCode.toDataURL(url, {
    width,
    margin: 2,
    color: {
      dark: '#0b192c',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'H',
  });
}

export async function generateQRCodeSVG(options: QRGenerationOptions): Promise<string> {
  const { url } = options;
  return QRCode.toString(url, {
    type: 'svg',
    margin: 2,
    color: {
      dark: '#0b192c',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'H',
  });
}
