import { ISmsProvider, SmsResult, SmsProviderConfig } from './interface';

/**
 * SMSAPI.pl Provider (Poland & Europe)
 * Docs: https://www.smsapi.pl/docs
 */
export class SmsApiProvider implements ISmsProvider {
  private apiKey: string;
  private sender: string;
  private baseUrl = 'https://api.smsapi.pl';

  constructor(config: SmsProviderConfig) {
    if (!config.apiKey) {
      throw new Error('SMSAPI: apiKey is required');
    }
    this.apiKey = config.apiKey;
    this.sender = config.sender || 'Info';
  }

  async sendSms(phone: string, message: string): Promise<SmsResult> {
    try {
      const response = await fetch(`${this.baseUrl}/sms.do`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: phone,
          message: message,
          from: this.sender,
          format: 'json',
        }),
      });

      const data = await response.json();

      if (response.ok && data.count > 0) {
        return {
          success: true,
          messageId: data.list?.[0]?.id,
          cost: data.list?.[0]?.points,
        };
      }

      return {
        success: false,
        error: data.message || 'Unknown error',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  validateConfig(): boolean {
    return !!this.apiKey && !!this.sender;
  }

  getName(): string {
    return 'SMSAPI.pl';
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/user.do`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
