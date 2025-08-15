// lib/qrCodeService.js
import QRCode from 'qrcode';
import crypto from 'crypto';

export class QRCodeService {
  // Generate unique QR code data for a booking
  static generateQRData(bookingId, recipientId, listingId, timestamp) {
    const data = {
      bookingId,
      recipientId,
      listingId,
      timestamp,
      type: 'food_collection',
      hash: crypto.createHash('sha256')
        .update(`${bookingId}-${recipientId}-${timestamp}`)
        .digest('hex')
        .substring(0, 16)
    };
    return JSON.stringify(data);
  }

  // Generate QR code as base64 image
  static async generateQRCode(qrData) {
    try {
      const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256
      });
      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  // Generate 6-digit backup collection code
  static generateCollectionCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Verify QR code data
  static verifyQRData(qrData) {
    try {
      const data = JSON.parse(qrData);
      const expectedHash = crypto.createHash('sha256')
        .update(`${data.bookingId}-${data.recipientId}-${data.timestamp}`)
        .digest('hex')
        .substring(0, 16);
      
      return {
        isValid: data.hash === expectedHash && data.type === 'food_collection',
        data: data.hash === expectedHash ? data : null
      };
    } catch (error) {
      return { isValid: false, data: null };
    }
  }

  // Check if QR code is expired (24 hours after booking)
  static isQRExpired(qrCodeExpiry) {
    return new Date() > new Date(qrCodeExpiry);
  }
}