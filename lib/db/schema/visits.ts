import { pgTable, uuid, timestamp, varchar, text, pgEnum } from 'drizzle-orm/pg-core';
import { customers } from './customers';

export const smsStatusEnum = pgEnum('sms_status', ['pending', 'sent', 'failed']);

export const visits = pgTable('visits', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerId: uuid('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  visitDate: timestamp('visit_date').notNull(),
  visitType: varchar('visit_type', { length: 100 }),
  notes: text('notes'),

  // Reminder SMS (before visit)
  reminderSmsDate: timestamp('reminder_sms_date'),
  reminderSmsStatus: smsStatusEnum('reminder_sms_status').default('pending'),
  reminderSmsSentAt: timestamp('reminder_sms_sent_at'),

  // Review SMS (after visit)
  reviewSmsDate: timestamp('review_sms_date'),
  reviewSmsStatus: smsStatusEnum('review_sms_status').default('pending'),
  reviewSmsSentAt: timestamp('review_sms_sent_at'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Visit = typeof visits.$inferSelect;
export type NewVisit = typeof visits.$inferInsert;
