/**
 * Main SMS Module Export
 */

export { SmsProviderFactory } from './providers/factory';
export { generateReviewRequestSms, validatePhoneNumber, formatPhoneNumber } from './templates';
export type { ISmsProvider, SmsResult, SmsProviderConfig } from './providers/interface';
export type { SmsProvider, SmsConfig } from '@/lib/db/types';
