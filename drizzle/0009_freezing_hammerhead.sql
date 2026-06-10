CREATE TABLE "incomes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"amount_pence" integer NOT NULL,
	"frequency" varchar(20) DEFAULT 'monthly' NOT NULL,
	"next_pay_date" timestamp NOT NULL,
	"member_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "incomes" ADD CONSTRAINT "incomes_member_id_household_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."household_members"("id") ON DELETE no action ON UPDATE no action;