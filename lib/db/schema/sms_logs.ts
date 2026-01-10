import { pgTable, uuid, varchar, text, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core';
import { visits } from './visits';

export const smsTypeEnum = pgEnum('sms_type', ['reminder', 'review']);

export const smsLogs = pgTable('sms_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  visitId: uuid('visit_id').references(() => visits.id, { onDelete: 'cascade' }).notNull(),
  smsType: smsTypeEnum('sms_type').notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  message: text('message').notNull(),
  status: varchar('status', { length: 20 }).notNull(),
  errorMessage: text('error_message'),
  smsapiMessageId: varchar('smsapi_message_id', { length: 255 }),
  cost: integer('cost'),
  sentAt: timestamp('sent_at').defaultNow().notNull(),
});
