/**
 * Database types and enums exported for use across the application
 */

// SMS Provider types
export type SmsProvider = 'smsapi' | 'twilio' | 'vonage' | 'smsplanet' | 'aws-sns';

// SMS Config type (matches Prisma Json type)
export type SmsConfig = Record<string, any>;
