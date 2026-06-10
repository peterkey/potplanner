-- Add owner_id to accounts (nullable FK to household_members)
ALTER TABLE "accounts" ADD COLUMN "owner_id" integer REFERENCES "household_members"("id");
--> statement-breakpoint

-- Create account_shares table for shared account arrangements
CREATE TABLE "account_shares" (
  "id" serial PRIMARY KEY NOT NULL,
  "account_id" integer NOT NULL REFERENCES "accounts"("id"),
  "member_id" integer NOT NULL REFERENCES "household_members"("id"),
  "default_percentage" integer NOT NULL
);
--> statement-breakpoint

-- Clear existing bill_splits (member_name strings cannot be mapped to member IDs)
DELETE FROM "bill_splits";
--> statement-breakpoint

-- Replace member_name with member_id FK in bill_splits
ALTER TABLE "bill_splits" DROP COLUMN "member_name";
--> statement-breakpoint
ALTER TABLE "bill_splits" ADD COLUMN "member_id" integer REFERENCES "household_members"("id");
--> statement-breakpoint

-- Add member_id to debts (nullable FK)
ALTER TABLE "debts" ADD COLUMN "member_id" integer REFERENCES "household_members"("id");
--> statement-breakpoint

-- Add member_id to savings_goals (nullable FK)
ALTER TABLE "savings_goals" ADD COLUMN "member_id" integer REFERENCES "household_members"("id");
