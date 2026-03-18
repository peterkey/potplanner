import 'server-only'
import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  boolean,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core'

// Frequency enum for recurring bills
export const frequencyEnum = pgEnum('frequency', [
  'weekly',
  'biweekly',
  'four_weekly',
  'monthly',
  'annual',
])

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const accounts = pgTable('accounts', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  // Balance stored in pence — initial value; current balance derived from transfer_history
  initialBalancePence: integer('initial_balance_pence').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const pots = pgTable('pots', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  allocatedPence: integer('allocated_pence').notNull().default(0),
  rollover: boolean('rollover').notNull().default(false), // v2-ready
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const bills = pgTable('bills', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  amountPence: integer('amount_pence').notNull(),
  frequency: frequencyEnum('frequency').notNull(),
  potId: integer('pot_id').references(() => pots.id), // nullable = potless bill
  nextDueDate: timestamp('next_due_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const billSplits = pgTable('bill_splits', {
  id: serial('id').primaryKey(),
  billId: integer('bill_id').notNull().references(() => bills.id),
  memberName: varchar('member_name', { length: 255 }).notNull(),
  percentage: integer('percentage').notNull(), // 0-100, stored as integer
})

// Append-only: rows are NEVER updated or deleted
export const transferHistory = pgTable('transfer_history', {
  id: serial('id').primaryKey(),
  sourceType: varchar('source_type', { length: 50 }).notNull(), // 'account' | 'pot' | 'external'
  sourceId: integer('source_id'), // nullable
  destinationType: varchar('destination_type', { length: 50 }).notNull(),
  destinationId: integer('destination_id'), // nullable
  amountPence: integer('amount_pence').notNull(),
  description: text('description'), // nullable
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const debts = pgTable('debts', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  balancePence: integer('balance_pence').notNull(),
  interestRate: integer('interest_rate').notNull(), // basis points (2500 = 25.00%)
  minimumPaymentPence: integer('minimum_payment_pence').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const savingsGoals = pgTable('savings_goals', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  targetPence: integer('target_pence').notNull(),
  potId: integer('pot_id').references(() => pots.id), // nullable
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
