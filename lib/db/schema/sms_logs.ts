import { pgTable, uuid, varchar, text, timestamp, integer } from 'drizzle-orm/pg-core';
import { appointments } from './appointments';

export const smsLogs = pgTable('sms_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  appointmentId: uuid('appointment_id').references(() => appointments.id, { onDelete: 'cascade' }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  message: text('message').notNull(),
  status: varchar('status', { length: 20 }).notNull(),
  errorMessage: text('error_message'),
  smsapiMessageId: varchar('smsapi_message_id', { length: 255 }),
  cost: integer('cost'),
  sentAt: timestamp('sent_at').defaultNow().notNull(),
});
