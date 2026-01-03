export interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
  cost?: number; // in cents
}

export interface ISmsProvider {
  /**
   * Send SMS to a phone number
   */
  sendSms(phone: string, message: string): Promise<SmsResult>;

  /**
   * Validate provider configuration
   */
  validateConfig(): boolean;

  /**
   * Get provider name
   */
  getName(): string;

  /**
   * Test connection (optional - sends test SMS or validates credentials)
   */
  testConnection?(): Promise<boolean>;
}

export interface SmsProviderConfig {
  apiKey?: string;
  apiSecret?: string;
  accountSid?: string;
  authToken?: string;
  sender: string;
  region?: string;
  [key: string]: string | undefined;
}
