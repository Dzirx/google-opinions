import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { businesses } from './businesses';

export type SmsStatus = 'pending' | 'sent' | 'failed';

export const appointments = pgTable('appointments', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  customerName: varchar('customer_name', { length: 255 }).notNull(),
  customerPhone: varchar('customer_phone', { length: 20 }).notNull(),
  appointmentDate: timestamp('appointment_date').notNull(),
  scheduledSmsDate: timestamp('scheduled_sms_date').notNull(),
  smsSentAt: timestamp('sms_sent_at'),
  smsStatus: varchar('sms_status', { length: 20 }).default('pending').notNull().$type<SmsStatus>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
