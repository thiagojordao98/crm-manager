import { pgTable, uuid, text, timestamp, boolean, index } from 'drizzle-orm/pg-core';
import { organizations } from './organizations.schema';

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').unique().notNull(),
    passwordHash: text('password_hash'),
    name: text('name').notNull(),
    role: text('role').notNull().default('agent'), // 'owner', 'admin', 'agent', 'viewer'
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    emailVerified: boolean('email_verified'),
    emailVerificationToken: text('email_verification_token'),
    lastLoginAt: timestamp('last_login_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index('users_email_idx').on(table.email),
    organizationIdIdx: index('users_organization_id_idx').on(table.organizationId),
  }),
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
