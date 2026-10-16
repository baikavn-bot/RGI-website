import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "lead_activities" ADD COLUMN "consent_id" integer;
  ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_consent_id_consents_id_fk" FOREIGN KEY ("consent_id") REFERENCES "public"."consents"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "lead_activities_consent_idx" ON "lead_activities" USING btree ("consent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "lead_activities" DROP CONSTRAINT "lead_activities_consent_id_consents_id_fk";
  
  DROP INDEX "lead_activities_consent_idx";
  ALTER TABLE "lead_activities" DROP COLUMN "consent_id";`)
}
