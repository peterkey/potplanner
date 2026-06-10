ALTER TABLE "debts" ADD COLUMN "account_id" integer;--> statement-breakpoint
ALTER TABLE "debts" ADD COLUMN "pot_id" integer;--> statement-breakpoint
ALTER TABLE "debts" ADD CONSTRAINT "debts_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debts" ADD CONSTRAINT "debts_pot_id_pots_id_fk" FOREIGN KEY ("pot_id") REFERENCES "public"."pots"("id") ON DELETE no action ON UPDATE no action;