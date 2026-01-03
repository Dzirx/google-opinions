import { relations } from 'drizzle-orm';
import { users } from './users';
import { businesses } from './businesses';
import { appointments } from './appointments';
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
  appointments: many(appointments),
}));

export const appointmentsRelations = relations(appointments, ({ one, many }) => ({
  business: one(businesses, {
    fields: [appointments.businessId],
    references: [businesses.id],
  }),
  smsLogs: many(smsLogs),
}));

export const smsLogsRelations = relations(smsLogs, ({ one }) => ({
  appointment: one(appointments, {
    fields: [smsLogs.appointmentId],
    references: [appointments.id],
  }),
}));

// Export tables
export { users } from './users';
export { businesses } from './businesses';
export { appointments } from './appointments';
export { smsLogs } from './sms_logs';
