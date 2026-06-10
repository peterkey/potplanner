CREATE TABLE "savings_goal_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"goal_id" integer NOT NULL,
	"member_id" integer NOT NULL,
	"percentage" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "savings_goals" ADD COLUMN "goal_date" timestamp;--> statement-breakpoint
ALTER TABLE "savings_goal_members" ADD CONSTRAINT "savings_goal_members_goal_id_savings_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."savings_goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_goal_members" ADD CONSTRAINT "savings_goal_members_member_id_household_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."household_members"("id") ON DELETE no action ON UPDATE no action;