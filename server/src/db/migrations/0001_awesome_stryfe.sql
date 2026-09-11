ALTER TABLE "jobs" ADD COLUMN "external_id" varchar(255);--> statement-breakpoint
CREATE UNIQUE INDEX "jobs_source_external_id_idx" ON "jobs" USING btree ("source","external_id");