import { pgTable, uuid, boolean, timestamp, integer, text, pgEnum } from 'drizzle-orm/pg-core';
import { visits } from './visits';

export const reviewStatusEnum = pgEnum('review_status', ['not_opened', 'opened', 'completed']);

export const reviews = pgTable('reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  visitId: uuid('visit_id').notNull().references(() => visits.id, { onDelete: 'cascade' }).unique(),
  linkOpened: boolean('link_opened').default(false).notNull(),
  openedAt: timestamp('opened_at'),
  rating: integer('rating'), // 1-5 stars
  reviewText: text('review_text'),
  reviewStatus: reviewStatusEnum('review_status').default('not_opened').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
