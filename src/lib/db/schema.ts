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

// Defined before accounts so accounts can reference it
export const householdMembers = pgTable('household_members', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const accounts = pgTable('accounts', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  // Balance stored in pence — initial value; current balance derived from transfer_history
  initialBalancePence: integer('initial_balance_pence').notNull().default(0),
  // Nullable for migration compatibility; forms enforce required at application layer
  ownerId: integer('owner_id').references(() => householdMembers.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Rows only exist when an account is shared; includes the owner's share entry too
export const accountShares = pgTable('account_shares', {
  id: serial('id').primaryKey(),
  accountId: integer('account_id').notNull().references(() => accounts.id),
  memberId: integer('member_id').notNull().references(() => householdMembers.id),
  defaultPercentage: integer('default_percentage').notNull(), // 0-100
})

export const pots = pgTable('pots', {
  id: serial('id').primaryKey(),
  accountId: integer('account_id').references(() => accounts.id),
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
  potId: integer('pot_id').references(() => pots.id),
  accountId: integer('account_id').references(() => accounts.id),
  nextDueDate: timestamp('next_due_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const billSplits = pgTable('bill_splits', {
  id: serial('id').primaryKey(),
  billId: integer('bill_id').notNull().references(() => bills.id),
  // memberId replaces the old memberName string — nullable for migration compatibility
  memberId: integer('member_id').references(() => householdMembers.id),
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
  paymentDueDate: timestamp('payment_due_date'), // nullable — next payment due date
  accountId: integer('account_id').references(() => accounts.id),
  potId: integer('pot_id').references(() => pots.id),
  // Nullable for migration compatibility; forms enforce required at application layer
  memberId: integer('member_id').references(() => householdMembers.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const paySettings = pgTable('pay_settings', {
  id: serial('id').primaryKey(),
  amountPence: integer('amount_pence').notNull().default(0),
  frequency: varchar('frequency', { length: 20 }).notNull().default('monthly'),
  nextPayDate: timestamp('next_pay_date').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const incomes = pgTable('incomes', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  amountPence: integer('amount_pence').notNull(),
  frequency: varchar('frequency', { length: 20 }).notNull().default('monthly'),
  nextPayDate: timestamp('next_pay_date').notNull(),
  memberId: integer('member_id').references(() => householdMembers.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const savingsGoals = pgTable('savings_goals', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  targetPence: integer('target_pence').notNull(),
  goalDate: timestamp('goal_date'), // nullable — target date to reach the goal
  potId: integer('pot_id').references(() => pots.id), // nullable
  // memberId retained for migration compatibility; use savings_goal_members for contributors
  memberId: integer('member_id').references(() => householdMembers.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Per-member contribution percentages for a savings goal (0-100 integer)
export const savingsGoalMembers = pgTable('savings_goal_members', {
  id: serial('id').primaryKey(),
  goalId: integer('goal_id').notNull().references(() => savingsGoals.id, { onDelete: 'cascade' }),
  memberId: integer('member_id').notNull().references(() => householdMembers.id),
  percentage: integer('percentage').notNull(), // 0-100
})
