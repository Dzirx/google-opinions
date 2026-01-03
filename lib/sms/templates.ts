/**
 * SMS Message Templates
 */

export interface SmsTemplateData {
  customerName: string;
  businessName: string;
  googleReviewUrl: string;
}

/**
 * Generate personalized SMS message
 */
export function generateReviewRequestSms(data: SmsTemplateData): string {
  return `Cześć ${data.customerName}!

Dziękujemy za wizytę w ${data.businessName}.
Zostaw opinię na Google: ${data.googleReviewUrl}

${data.businessName}`;
}

/**
 * Validate phone number format (basic validation)
 */
export function validatePhoneNumber(phone: string): boolean {
  // Remove spaces, dashes, parentheses
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');

  // Should start with + and have 10-15 digits
  const regex = /^\+\d{10,15}$/;
  return regex.test(cleaned);
}

/**
 * Format phone number to E.164 format
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');

  // Ensure it starts with +
  if (!cleaned.startsWith('+')) {
    // Assume Poland (+48) if no country code
    cleaned = '+48' + cleaned;
  }

  return cleaned;
}
