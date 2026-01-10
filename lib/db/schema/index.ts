import { relations } from 'drizzle-orm';
import { users } from './users';
import { businesses } from './businesses';
import { customers } from './customers';
import { visits } from './visits';
import { reviews } from './reviews';
import { smsLogs } from './sms_logs';

// Relations
export const usersRelations = relations(users, ({ one }) => ({
  business: one(businesses, {
    fields: [users.id],
    references: [businesses.userId],
  }),
}));

export const businessesRelations = relations(businesses, ({ one, many }) => ({
  user: one(users, {
    fields: [businesses.userId],
    references: [users.id],
  }),
  customers: many(customers),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  business: one(businesses, {
    fields: [customers.businessId],
    references: [businesses.id],
  }),
  visits: many(visits),
}));

export const visitsRelations = relations(visits, ({ one, many }) => ({
  customer: one(customers, {
    fields: [visits.customerId],
    references: [customers.id],
  }),
  smsLogs: many(smsLogs),
  review: one(reviews, {
    fields: [visits.id],
    references: [reviews.visitId],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  visit: one(visits, {
    fields: [reviews.visitId],
    references: [visits.id],
  }),
}));

export const smsLogsRelations = relations(smsLogs, ({ one }) => ({
  visit: one(visits, {
    fields: [smsLogs.visitId],
    references: [visits.id],
  }),
}));

// Export tables and enums
export { users } from './users';
export { businesses } from './businesses';
export { customers } from './customers';
export { visits, smsStatusEnum } from './visits';
export { reviews, reviewStatusEnum } from './reviews';
export { smsLogs, smsTypeEnum } from './sms_logs';
