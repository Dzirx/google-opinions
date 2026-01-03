import { ISmsProvider, SmsResult, SmsProviderConfig } from './interface';

/**
 * Twilio Provider (Global)
 * Docs: https://www.twilio.com/docs/sms/api
 */
export class TwilioProvider implements ISmsProvider {
  private accountSid: string;
  private authToken: string;
  private sender: string;
  private baseUrl = 'https://api.twilio.com/2010-04-01';

  constructor(config: SmsProviderConfig) {
    if (!config.accountSid || !config.authToken) {
      throw new Error('Twilio: accountSid and authToken are required');
    }
    this.accountSid = config.accountSid;
    this.authToken = config.authToken;
    this.sender = config.sender; // Phone number or Messaging Service SID
  }

  async sendSms(phone: string, message: string): Promise<SmsResult> {
    try {
      const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');

      const response = await fetch(
        `${this.baseUrl}/Accounts/${this.accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: phone,
            From: this.sender,
            Body: message,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          messageId: data.sid,
          cost: data.price ? Math.abs(parseFloat(data.price) * 100) : undefined,
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
    return !!this.accountSid && !!this.authToken && !!this.sender;
  }

  getName(): string {
    return 'Twilio';
  }

  async testConnection(): Promise<boolean> {
    try {
      const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');
      const response = await fetch(
        `${this.baseUrl}/Accounts/${this.accountSid}.json`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${auth}`,
          },
        }
      );
      return response.ok;
    } catch {
      return false;
    }
  }
}
