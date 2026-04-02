import { ISmsProvider, SmsProviderConfig } from './interface';
import { SmsApiProvider } from './smsapi';
import { SmsPlanetProvider } from './smsplanet';
import { SmsProvider } from '@/lib/db/types';

export class SmsProviderFactory {
  static create(provider: SmsProvider, config: SmsProviderConfig): ISmsProvider {
    switch (provider) {
      case 'smsapi':
        return new SmsApiProvider(config);

      case 'smsplanet':
        return new SmsPlanetProvider(config);

      default:
        throw new Error(`Unknown SMS provider: ${provider}`);
    }
  }

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
        id: 'smsplanet',
        name: 'SMSPlanet',
        description: 'Polska',
        website: 'https://smsplanet.pl',
        requiredFields: [
          { name: 'apiKey', label: 'Token API', type: 'password' },
          { name: 'sender', label: 'Nazwa nadawcy', type: 'text', maxLength: 11 },
        ],
      },
    ];
  }
}
