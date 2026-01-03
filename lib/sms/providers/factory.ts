import { ISmsProvider, SmsProviderConfig } from './interface';
import { SmsApiProvider } from './smsapi';
import { TwilioProvider } from './twilio';
import { VonageProvider } from './vonage';
import { SmsProvider } from '@/lib/db/schema/businesses';

/**
 * Factory for creating SMS provider instances
 */
export class SmsProviderFactory {
  static create(provider: SmsProvider, config: SmsProviderConfig): ISmsProvider {
    switch (provider) {
      case 'smsapi':
        return new SmsApiProvider(config);

      case 'twilio':
        return new TwilioProvider(config);

      case 'vonage':
        return new VonageProvider(config);

      case 'aws-sns':
        // TODO: Implement AWS SNS provider
        throw new Error('AWS SNS provider not implemented yet');

      default:
        throw new Error(`Unknown SMS provider: ${provider}`);
    }
  }

  /**
   * Get list of available providers with their required config fields
   */
  static getAvailableProviders() {
    return [
      {
        id: 'smsapi',
        name: 'SMSAPI.pl',
        description: 'Poland & Europe',
        website: 'https://www.smsapi.pl',
        requiredFields: [
          { name: 'apiKey', label: 'API Token', type: 'password' },
          { name: 'sender', label: 'Sender Name', type: 'text', maxLength: 11 },
        ],
      },
      {
        id: 'twilio',
        name: 'Twilio',
        description: 'Global (USA, Europe, Asia)',
        website: 'https://www.twilio.com',
        requiredFields: [
          { name: 'accountSid', label: 'Account SID', type: 'text' },
          { name: 'authToken', label: 'Auth Token', type: 'password' },
          { name: 'sender', label: 'From Number', type: 'tel', placeholder: '+1234567890' },
        ],
      },
      {
        id: 'vonage',
        name: 'Vonage (Nexmo)',
        description: 'Global',
        website: 'https://www.vonage.com',
        requiredFields: [
          { name: 'apiKey', label: 'API Key', type: 'text' },
          { name: 'apiSecret', label: 'API Secret', type: 'password' },
          { name: 'sender', label: 'Sender Name', type: 'text', maxLength: 11 },
        ],
      },
      // {
      //   id: 'aws-sns',
      //   name: 'AWS SNS',
      //   description: 'Global (AWS)',
      //   website: 'https://aws.amazon.com/sns',
      //   requiredFields: [
      //     { name: 'apiKey', label: 'Access Key ID', type: 'text' },
      //     { name: 'apiSecret', label: 'Secret Access Key', type: 'password' },
      //     { name: 'region', label: 'Region', type: 'text', placeholder: 'us-east-1' },
      //     { name: 'sender', label: 'Sender ID', type: 'text' },
      //   ],
      // },
    ];
  }
}
