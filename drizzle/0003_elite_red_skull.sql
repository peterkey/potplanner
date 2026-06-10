CREATE TABLE "pay_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"amount_pence" integer DEFAULT 0 NOT NULL,
	"frequency" varchar(20) DEFAULT 'monthly' NOT NULL,
	"next_pay_date" timestamp NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
