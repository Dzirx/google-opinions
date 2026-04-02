/**
 * Database types and enums exported for use across the application
 */

// SMS Provider types
export type SmsProvider = 'smsapi' | 'smsplanet';

// SMS Config type (matches Prisma Json type)
export type SmsConfig = Record<string, any>;
