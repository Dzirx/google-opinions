import { ISmsProvider, SmsResult, SmsProviderConfig } from './interface';

/**
 * SMSPlanet Provider (Poland)
 * Docs: https://smsplanet.pl/api
 */
export class SmsPlanetProvider implements ISmsProvider {
  private apiKey: string;
  private sender: string;
  private baseUrl = 'https://api2.smsplanet.pl';

  constructor(config: SmsProviderConfig) {
    if (!config.apiKey) {
      throw new Error('SMSPlanet: apiKey is required');
    }
    this.apiKey = config.apiKey;
    this.sender = config.sender || 'Info';
  }

  async sendSms(phone: string, message: string): Promise<SmsResult> {
    try {
      const params = new URLSearchParams({
        from: this.sender,
        to: phone,
        msg: message,
      });

      const response = await fetch(`${this.baseUrl}/sms`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const body = await response.text();

      if (!response.ok) {
        return { success: false, error: body };
      }

      return { success: true, messageId: body };
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
    return 'SMSPlanet';
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/balance`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
