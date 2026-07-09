import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';

@Injectable()
export class QrCodeService {
  /** Renders a share URL as a PNG data URL, embeddable directly in an <img src>. */
  async generateDataUrl(url: string): Promise<string> {
    return QRCode.toDataURL(url, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 320,
    });
  }
}
