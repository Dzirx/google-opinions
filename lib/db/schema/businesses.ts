import { pgTable, uuid, varchar, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';

export type SmsProvider = 'smsapi' | 'twilio' | 'vonage' | 'aws-sns';

export interface SmsConfig {
  apiKey?: string;
  apiSecret?: string;
  accountSid?: string; // Twilio
  authToken?: string; // Twilio
  sender: string;
  region?: string; // AWS SNS
  [key: string]: string | undefined; // Index signature for compatibility with SmsProviderConfig
}

export const businesses = pgTable('businesses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  googleReviewUrl: text('google_review_url').notNull(),

  // SMS Provider Configuration (Universal)
  smsProvider: varchar('sms_provider', { length: 50 }).$type<SmsProvider>().default('smsapi'),
  smsConfig: jsonb('sms_config').$type<SmsConfig>(),

  // SMS Templates - Available placeholders: {name}, {link}, {date}, {staff}
  reminderSmsTemplate: text('reminder_sms_template').default('Cześć {name}! Przypominamy o wizycie w dniu {date}. Pozdrawiamy, {staff}'),
  reviewSmsTemplate: text('review_sms_template').default('Cześć {name}! Dziękujemy za wizytę. Zostaw nam swoją opinię: {link} - {staff}'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
