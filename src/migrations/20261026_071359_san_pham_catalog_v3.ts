import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_products_spec_template" AS ENUM('pressure_pipe', 'drain_pipe', 'fitting', 'hose', 'gutter_liner', 'sheet', 'panel');
  CREATE TYPE "public"."enum__products_v_version_spec_template" AS ENUM('pressure_pipe', 'drain_pipe', 'fitting', 'hose', 'gutter_liner', 'sheet', 'panel');
  CREATE TYPE "public"."enum_variants_wall_class" AS ENUM('A', 'B');
  ALTER TABLE "products" ADD COLUMN "spec_template" "enum_products_spec_template";
  ALTER TABLE "products_locales" ADD COLUMN "group_label" varchar;
  ALTER TABLE "_products_v" ADD COLUMN "version_spec_template" "enum__products_v_version_spec_template";
  ALTER TABLE "_products_v_locales" ADD COLUMN "version_group_label" varchar;
  ALTER TABLE "variants" ADD COLUMN "pipe_series" numeric;
  ALTER TABLE "variants" ADD COLUMN "wall_class" "enum_variants_wall_class";
  ALTER TABLE "variants" ADD COLUMN "od_max_mm" numeric;
  ALTER TABLE "variants" ADD COLUMN "weight_kg_per_coil_min" numeric;
  ALTER TABLE "variants" ADD COLUMN "weight_kg_per_coil_max" numeric;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products" DROP COLUMN "spec_template";
  ALTER TABLE "products_locales" DROP COLUMN "group_label";
  ALTER TABLE "_products_v" DROP COLUMN "version_spec_template";
  ALTER TABLE "_products_v_locales" DROP COLUMN "version_group_label";
  ALTER TABLE "variants" DROP COLUMN "pipe_series";
  ALTER TABLE "variants" DROP COLUMN "wall_class";
  ALTER TABLE "variants" DROP COLUMN "od_max_mm";
  ALTER TABLE "variants" DROP COLUMN "weight_kg_per_coil_min";
  ALTER TABLE "variants" DROP COLUMN "weight_kg_per_coil_max";
  DROP TYPE "public"."enum_products_spec_template";
  DROP TYPE "public"."enum__products_v_version_spec_template";
  DROP TYPE "public"."enum_variants_wall_class";`)
}
