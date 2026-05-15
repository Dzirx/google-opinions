export interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
  cost?: number;
}

export interface ISmsProvider {
  sendSms(phone: string, message: string): Promise<SmsResult>;
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
