import { ISmsProvider, SmsResult, SmsProviderConfig } from './interface';

/**
 * Vonage (Nexmo) Provider (Global)
 * Docs: https://developer.vonage.com/messaging/sms/overview
 */
export class VonageProvider implements ISmsProvider {
  private apiKey: string;
  private apiSecret: string;
  private sender: string;
  private baseUrl = 'https://rest.nexmo.com';

  constructor(config: SmsProviderConfig) {
    if (!config.apiKey || !config.apiSecret) {
      throw new Error('Vonage: apiKey and apiSecret are required');
    }
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.sender = config.sender || 'Vonage';
  }

  async sendSms(phone: string, message: string): Promise<SmsResult> {
    try {
      const response = await fetch(`${this.baseUrl}/sms/json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: this.apiKey,
          api_secret: this.apiSecret,
          to: phone,
          from: this.sender,
          text: message,
        }),
      });

      const data = await response.json();

      if (data.messages?.[0]?.status === '0') {
        return {
          success: true,
          messageId: data.messages[0]['message-id'],
          cost: parseFloat(data.messages[0]['message-price']) * 100,
        };
      }

      return {
        success: false,
        error: data.messages?.[0]?.['error-text'] || 'Unknown error',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  validateConfig(): boolean {
    return !!this.apiKey && !!this.apiSecret && !!this.sender;
  }

  getName(): string {
    return 'Vonage';
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/account/get-balance?api_key=${this.apiKey}&api_secret=${this.apiSecret}`,
        { method: 'GET' }
      );
      return response.ok;
    } catch {
      return false;
    }
  }
}
