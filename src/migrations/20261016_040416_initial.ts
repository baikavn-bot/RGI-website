import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."_locales" AS ENUM('vi', 'en');
  CREATE TYPE "public"."enum_leads_kits" AS ENUM('board_hose_water', 'board_hose_technical', 'board_roofing', 'board_wall', 'book');
  CREATE TYPE "public"."enum_leads_type" AS ENUM('distributor', 'retailer', 'contractor', 'sample', 'contact');
  CREATE TYPE "public"."enum_leads_locale" AS ENUM('vi', 'en');
  CREATE TYPE "public"."enum_leads_volume_band" AS ENUM('lt100m', '100to500m', 'gt500m', 'unknown');
  CREATE TYPE "public"."enum_leads_status" AS ENUM('new', 'contacted', 'qualified', 'sample_sent', 'proposal_sent', 'won', 'lost', 'unqualified', 'duplicate');
  CREATE TYPE "public"."enum_leads_lost_reason" AS ENUM('price', 'no_need', 'competitor', 'conditions', 'no_response', 'other');
  CREATE TYPE "public"."enum_lead_activities_kind" AS ENUM('note', 'call', 'email', 'sample_sent', 'form_resubmit', 'status_change');
  CREATE TYPE "public"."enum_products_sale_status" AS ENUM('draft', 'coming_soon', 'on_sale', 'discontinued');
  CREATE TYPE "public"."enum_products_claim_level" AS ENUM('none', 'level1_factory', 'level2_product', 'level3_certified');
  CREATE TYPE "public"."enum_products_legal_review_status" AS ENUM('pending', 'approved', 'rejected');
  CREATE TYPE "public"."enum_products_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__products_v_version_sale_status" AS ENUM('draft', 'coming_soon', 'on_sale', 'discontinued');
  CREATE TYPE "public"."enum__products_v_version_claim_level" AS ENUM('none', 'level1_factory', 'level2_product', 'level3_certified');
  CREATE TYPE "public"."enum__products_v_version_legal_review_status" AS ENUM('pending', 'approved', 'rejected');
  CREATE TYPE "public"."enum__products_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__products_v_published_locale" AS ENUM('vi', 'en');
  CREATE TYPE "public"."enum_variants_spec_status" AS ENUM('proposed', 'factory_confirmed');
  CREATE TYPE "public"."enum_compliance_records_type" AS ENUM('cr_declaration', 'standard_declaration');
  CREATE TYPE "public"."enum_compliance_records_status" AS ENUM('draft', 'approved', 'expired');
  CREATE TYPE "public"."enum_pages_key" AS ENUM('home', 'about', 'factory', 'products', 'partners', 'samples', 'downloads', 'contact', 'terms', 'privacy');
  CREATE TYPE "public"."enum_pages_kind" AS ENUM('standard', 'legal');
  CREATE TYPE "public"."enum_pages_legal_review_status" AS ENUM('pending', 'approved', 'rejected');
  CREATE TYPE "public"."enum_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pages_v_version_key" AS ENUM('home', 'about', 'factory', 'products', 'partners', 'samples', 'downloads', 'contact', 'terms', 'privacy');
  CREATE TYPE "public"."enum__pages_v_version_kind" AS ENUM('standard', 'legal');
  CREATE TYPE "public"."enum__pages_v_version_legal_review_status" AS ENUM('pending', 'approved', 'rejected');
  CREATE TYPE "public"."enum__pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pages_v_published_locale" AS ENUM('vi', 'en');
  CREATE TYPE "public"."enum_documents_kind" AS ENUM('catalog', 'profile', 'datasheet', 'standard', 'test_report', 'certificate', 'material_balance', 'other');
  CREATE TYPE "public"."enum_documents_locale" AS ENUM('vi', 'en', 'both');
  CREATE TYPE "public"."enum_documents_visibility" AS ENUM('public', 'gated', 'internal');
  CREATE TYPE "public"."enum_data_requests_kind" AS ENUM('access', 'rectify', 'erase', 'withdraw');
  CREATE TYPE "public"."enum_data_requests_status" AS ENUM('received', 'verifying', 'in_progress', 'executed', 'rejected', 'closed');
  CREATE TYPE "public"."enum_users_role" AS ENUM('director', 'marketing', 'sales', 'editor', 'legal', 'tech');
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'sendLeadEmails', 'notifyDataRequest', 'leadOverdueCheck', 'complianceExpiryCheck', 'anonymizeStaleLeads');
  CREATE TYPE "public"."enum_payload_jobs_log_state" AS ENUM('failed', 'succeeded');
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'sendLeadEmails', 'notifyDataRequest', 'leadOverdueCheck', 'complianceExpiryCheck', 'anonymizeStaleLeads');
  CREATE TABLE "leads_kits" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_leads_kits",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "leads" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"ref_code" varchar,
  	"type" "enum_leads_type" NOT NULL,
  	"locale" "enum_leads_locale" DEFAULT 'vi',
  	"contact_name" varchar NOT NULL,
  	"position" varchar,
  	"phone" varchar NOT NULL,
  	"phone_normalized" varchar,
  	"email" varchar,
  	"company" varchar,
  	"tax_code" varchar,
  	"province" varchar,
  	"country" varchar,
  	"warehouse_area" numeric,
  	"project_name" varchar,
  	"volume_band" "enum_leads_volume_band",
  	"needed_by" varchar,
  	"delivery_address" varchar,
  	"message" varchar,
  	"utm_source" varchar,
  	"utm_medium" varchar,
  	"utm_campaign" varchar,
  	"source_path" varchar,
  	"referrer" varchar,
  	"consent_id" integer,
  	"notified_at" timestamp(3) with time zone,
  	"escalated_at" timestamp(3) with time zone,
  	"status" "enum_leads_status" DEFAULT 'new' NOT NULL,
  	"owner_id" integer,
  	"lost_reason" "enum_leads_lost_reason",
  	"first_contact_at" timestamp(3) with time zone,
  	"merged_count" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"deleted_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "leads_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "leads_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"product_lines_id" integer
  );
  
  CREATE TABLE "lead_activities" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"lead_id" integer NOT NULL,
  	"kind" "enum_lead_activities_kind" DEFAULT 'note' NOT NULL,
  	"note" varchar,
  	"by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "product_lines" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"code" varchar NOT NULL,
  	"order" numeric DEFAULT 0,
  	"color" varchar NOT NULL,
  	"image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "product_lines_locales" (
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"tagline" varchar,
  	"description" varchar,
  	"note" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "products" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"code" varchar,
  	"line_id" integer,
  	"order" numeric DEFAULT 0,
  	"cover_id" integer,
  	"sale_status" "enum_products_sale_status" DEFAULT 'coming_soon',
  	"claim_level" "enum_products_claim_level" DEFAULT 'none',
  	"hs_code" varchar,
  	"legal_review_status" "enum_products_legal_review_status" DEFAULT 'pending',
  	"legal_review_note" varchar,
  	"legal_review_reviewed_by_id" integer,
  	"legal_review_reviewed_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_products_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "products_locales" (
  	"name" varchar,
  	"slug" varchar,
  	"summary" varchar,
  	"body" jsonb,
  	"standard_text" varchar,
  	"manufacturer_text" varchar DEFAULT 'Nhà máy REN Group tại Tangerang, Indonesia',
  	"claim_statement" varchar,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "products_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar,
  	"locale" "_locales"
  );
  
  CREATE TABLE "products_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer,
  	"documents_id" integer
  );
  
  CREATE TABLE "_products_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_code" varchar,
  	"version_line_id" integer,
  	"version_order" numeric DEFAULT 0,
  	"version_cover_id" integer,
  	"version_sale_status" "enum__products_v_version_sale_status" DEFAULT 'coming_soon',
  	"version_claim_level" "enum__products_v_version_claim_level" DEFAULT 'none',
  	"version_hs_code" varchar,
  	"version_legal_review_status" "enum__products_v_version_legal_review_status" DEFAULT 'pending',
  	"version_legal_review_note" varchar,
  	"version_legal_review_reviewed_by_id" integer,
  	"version_legal_review_reviewed_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__products_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__products_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_products_v_locales" (
  	"version_name" varchar,
  	"version_slug" varchar,
  	"version_summary" varchar,
  	"version_body" jsonb,
  	"version_standard_text" varchar,
  	"version_manufacturer_text" varchar DEFAULT 'Nhà máy REN Group tại Tangerang, Indonesia',
  	"version_claim_statement" varchar,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_products_v_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar,
  	"locale" "_locales"
  );
  
  CREATE TABLE "_products_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer,
  	"documents_id" integer
  );
  
  CREATE TABLE "variants" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"sku" varchar NOT NULL,
  	"product_id" integer NOT NULL,
  	"order" numeric DEFAULT 0,
  	"spec_status" "enum_variants_spec_status" DEFAULT 'proposed' NOT NULL,
  	"dn_mm" numeric,
  	"e_mm" numeric,
  	"pn_bar" numeric,
  	"length_m" numeric,
  	"id_mm" numeric,
  	"od_mm" numeric,
  	"coil_length_m" numeric,
  	"weight_kg_per_m" numeric,
  	"length_mm" numeric,
  	"width_mm" numeric,
  	"thickness_mm" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "variants_locales" (
  	"size_label" varchar NOT NULL,
  	"color" varchar,
  	"note" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "compliance_records" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"product_id" integer NOT NULL,
  	"type" "enum_compliance_records_type" DEFAULT 'cr_declaration' NOT NULL,
  	"regulation" varchar DEFAULT 'QCVN 16:2023/BXD',
  	"standard" varchar DEFAULT 'TCCS 01:2026/RGI',
  	"cert_no" varchar,
  	"cert_body" varchar,
  	"registration_no" varchar,
  	"issued_on" timestamp(3) with time zone,
  	"expires_on" timestamp(3) with time zone,
  	"scan_id" integer,
  	"status" "enum_compliance_records_status" DEFAULT 'draft' NOT NULL,
  	"approved_by_id" integer,
  	"approved_at" timestamp(3) with time zone,
  	"internal_note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "pages_blocks" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"text" varchar,
  	"figure" varchar,
  	"figure_label" varchar,
  	"source" varchar
  );
  
  CREATE TABLE "pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" "enum_pages_key",
  	"kind" "enum_pages_kind" DEFAULT 'standard',
  	"hero_id" integer,
  	"effective_date" timestamp(3) with time zone,
  	"policy_version" varchar,
  	"legal_review_status" "enum_pages_legal_review_status" DEFAULT 'pending',
  	"legal_review_note" varchar,
  	"legal_review_reviewed_by_id" integer,
  	"legal_review_reviewed_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_pages_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "pages_locales" (
  	"kicker" varchar,
  	"title" varchar,
  	"title_accent" varchar,
  	"summary" varchar,
  	"body" jsonb,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_version_blocks" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"text" varchar,
  	"figure" varchar,
  	"figure_label" varchar,
  	"source" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_key" "enum__pages_v_version_key",
  	"version_kind" "enum__pages_v_version_kind" DEFAULT 'standard',
  	"version_hero_id" integer,
  	"version_effective_date" timestamp(3) with time zone,
  	"version_policy_version" varchar,
  	"version_legal_review_status" "enum__pages_v_version_legal_review_status" DEFAULT 'pending',
  	"version_legal_review_note" varchar,
  	"version_legal_review_reviewed_by_id" integer,
  	"version_legal_review_reviewed_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__pages_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__pages_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_pages_v_locales" (
  	"version_kicker" varchar,
  	"version_title" varchar,
  	"version_title_accent" varchar,
  	"version_summary" varchar,
  	"version_body" jsonb,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"source" varchar NOT NULL,
  	"rights_note" varchar,
  	"rights_cleared" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumb_url" varchar,
  	"sizes_thumb_width" numeric,
  	"sizes_thumb_height" numeric,
  	"sizes_thumb_mime_type" varchar,
  	"sizes_thumb_filesize" numeric,
  	"sizes_thumb_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_hero_url" varchar,
  	"sizes_hero_width" numeric,
  	"sizes_hero_height" numeric,
  	"sizes_hero_mime_type" varchar,
  	"sizes_hero_filesize" numeric,
  	"sizes_hero_filename" varchar
  );
  
  CREATE TABLE "media_locales" (
  	"alt" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "enum_documents_kind" NOT NULL,
  	"locale" "enum_documents_locale" DEFAULT 'vi' NOT NULL,
  	"version" varchar,
  	"published_on" timestamp(3) with time zone,
  	"visibility" "enum_documents_visibility" DEFAULT 'internal' NOT NULL,
  	"download_count" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "documents_locales" (
  	"title" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "consents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"policy_version" varchar NOT NULL,
  	"text_shown" varchar NOT NULL,
  	"locale" varchar,
  	"granted_at" timestamp(3) with time zone NOT NULL,
  	"ip_hash" varchar,
  	"user_agent" varchar,
  	"source_path" varchar,
  	"withdrawn_at" timestamp(3) with time zone,
  	"anonymized" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "data_requests" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"ref_code" varchar,
  	"kind" "enum_data_requests_kind" NOT NULL,
  	"contact_name" varchar NOT NULL,
  	"contact" varchar NOT NULL,
  	"detail" varchar,
  	"locale" varchar,
  	"status" "enum_data_requests_status" DEFAULT 'received' NOT NULL,
  	"due_at" timestamp(3) with time zone,
  	"resolution" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "data_requests_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"leads_id" integer
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"role" "enum_users_role" DEFAULT 'sales' NOT NULL,
  	"notify_leads" boolean DEFAULT false,
  	"totp_secret" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "audit_logs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"action" varchar NOT NULL,
  	"collection_slug" varchar NOT NULL,
  	"doc_id" varchar,
  	"actor_id" integer,
  	"actor_label" varchar,
  	"changes" jsonb,
  	"note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "redirects" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"from" varchar NOT NULL,
  	"to" varchar NOT NULL,
  	"permanent" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "totp_attempts" (
  	"id" varchar PRIMARY KEY NOT NULL,
  	"attempts" numeric DEFAULT 0 NOT NULL,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_jobs_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"executed_at" timestamp(3) with time zone NOT NULL,
  	"completed_at" timestamp(3) with time zone NOT NULL,
  	"task_slug" "enum_payload_jobs_log_task_slug" NOT NULL,
  	"task_i_d" varchar NOT NULL,
  	"input" jsonb,
  	"output" jsonb,
  	"state" "enum_payload_jobs_log_state" NOT NULL,
  	"error" jsonb
  );
  
  CREATE TABLE "payload_jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"input" jsonb,
  	"completed_at" timestamp(3) with time zone,
  	"total_tried" numeric DEFAULT 0,
  	"has_error" boolean DEFAULT false,
  	"error" jsonb,
  	"task_slug" "enum_payload_jobs_task_slug",
  	"queue" varchar DEFAULT 'default',
  	"wait_until" timestamp(3) with time zone,
  	"processing" boolean DEFAULT false,
  	"meta" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"leads_id" integer,
  	"lead_activities_id" integer,
  	"product_lines_id" integer,
  	"products_id" integer,
  	"variants_id" integer,
  	"compliance_records_id" integer,
  	"pages_id" integer,
  	"media_id" integer,
  	"documents_id" integer,
  	"consents_id" integer,
  	"data_requests_id" integer,
  	"users_id" integer,
  	"audit_logs_id" integer,
  	"redirects_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tax_code" varchar NOT NULL,
  	"representative" varchar,
  	"hotline" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"zalo_url" varchar,
  	"director_email" varchar,
  	"forms_distributor" boolean DEFAULT true,
  	"forms_retailer" boolean DEFAULT true,
  	"forms_contractor" boolean DEFAULT true,
  	"forms_sample" boolean DEFAULT true,
  	"forms_contact" boolean DEFAULT true,
  	"consent_policy_version" varchar DEFAULT 'WB02-v1' NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "settings_locales" (
  	"company_name" varchar NOT NULL,
  	"address" varchar NOT NULL,
  	"response_time" varchar,
  	"consent_text" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "settings_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "payload_jobs_stats" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"stats" jsonb,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "leads_kits" ADD CONSTRAINT "leads_kits_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "leads" ADD CONSTRAINT "leads_consent_id_consents_id_fk" FOREIGN KEY ("consent_id") REFERENCES "public"."consents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "leads" ADD CONSTRAINT "leads_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "leads_texts" ADD CONSTRAINT "leads_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "leads_rels" ADD CONSTRAINT "leads_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "leads_rels" ADD CONSTRAINT "leads_rels_product_lines_fk" FOREIGN KEY ("product_lines_id") REFERENCES "public"."product_lines"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_by_id_users_id_fk" FOREIGN KEY ("by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "product_lines" ADD CONSTRAINT "product_lines_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "product_lines_locales" ADD CONSTRAINT "product_lines_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."product_lines"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products" ADD CONSTRAINT "products_line_id_product_lines_id_fk" FOREIGN KEY ("line_id") REFERENCES "public"."product_lines"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products" ADD CONSTRAINT "products_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products" ADD CONSTRAINT "products_legal_review_reviewed_by_id_users_id_fk" FOREIGN KEY ("legal_review_reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_locales" ADD CONSTRAINT "products_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_texts" ADD CONSTRAINT "products_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_documents_fk" FOREIGN KEY ("documents_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_parent_id_products_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_version_line_id_product_lines_id_fk" FOREIGN KEY ("version_line_id") REFERENCES "public"."product_lines"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_version_cover_id_media_id_fk" FOREIGN KEY ("version_cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_version_legal_review_reviewed_by_id_users_id_fk" FOREIGN KEY ("version_legal_review_reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v_locales" ADD CONSTRAINT "_products_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_texts" ADD CONSTRAINT "_products_v_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_rels" ADD CONSTRAINT "_products_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_rels" ADD CONSTRAINT "_products_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_rels" ADD CONSTRAINT "_products_v_rels_documents_fk" FOREIGN KEY ("documents_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "variants" ADD CONSTRAINT "variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "variants_locales" ADD CONSTRAINT "variants_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "compliance_records" ADD CONSTRAINT "compliance_records_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "compliance_records" ADD CONSTRAINT "compliance_records_scan_id_documents_id_fk" FOREIGN KEY ("scan_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "compliance_records" ADD CONSTRAINT "compliance_records_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks" ADD CONSTRAINT "pages_blocks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_hero_id_media_id_fk" FOREIGN KEY ("hero_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_legal_review_reviewed_by_id_users_id_fk" FOREIGN KEY ("legal_review_reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_locales" ADD CONSTRAINT "pages_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_version_blocks" ADD CONSTRAINT "_pages_v_version_blocks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_hero_id_media_id_fk" FOREIGN KEY ("version_hero_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_legal_review_reviewed_by_id_users_id_fk" FOREIGN KEY ("version_legal_review_reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_locales" ADD CONSTRAINT "_pages_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media_locales" ADD CONSTRAINT "media_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "documents_locales" ADD CONSTRAINT "documents_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "data_requests_rels" ADD CONSTRAINT "data_requests_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."data_requests"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "data_requests_rels" ADD CONSTRAINT "data_requests_rels_leads_fk" FOREIGN KEY ("leads_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_jobs_log" ADD CONSTRAINT "payload_jobs_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payload_jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_leads_fk" FOREIGN KEY ("leads_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_lead_activities_fk" FOREIGN KEY ("lead_activities_id") REFERENCES "public"."lead_activities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_product_lines_fk" FOREIGN KEY ("product_lines_id") REFERENCES "public"."product_lines"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_variants_fk" FOREIGN KEY ("variants_id") REFERENCES "public"."variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_compliance_records_fk" FOREIGN KEY ("compliance_records_id") REFERENCES "public"."compliance_records"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_documents_fk" FOREIGN KEY ("documents_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_consents_fk" FOREIGN KEY ("consents_id") REFERENCES "public"."consents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_data_requests_fk" FOREIGN KEY ("data_requests_id") REFERENCES "public"."data_requests"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_audit_logs_fk" FOREIGN KEY ("audit_logs_id") REFERENCES "public"."audit_logs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_redirects_fk" FOREIGN KEY ("redirects_id") REFERENCES "public"."redirects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "settings_locales" ADD CONSTRAINT "settings_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "settings_texts" ADD CONSTRAINT "settings_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "leads_kits_order_idx" ON "leads_kits" USING btree ("order");
  CREATE INDEX "leads_kits_parent_idx" ON "leads_kits" USING btree ("parent_id");
  CREATE UNIQUE INDEX "leads_ref_code_idx" ON "leads" USING btree ("ref_code");
  CREATE INDEX "leads_type_idx" ON "leads" USING btree ("type");
  CREATE INDEX "leads_phone_normalized_idx" ON "leads" USING btree ("phone_normalized");
  CREATE INDEX "leads_province_idx" ON "leads" USING btree ("province");
  CREATE INDEX "leads_consent_idx" ON "leads" USING btree ("consent_id");
  CREATE INDEX "leads_status_idx" ON "leads" USING btree ("status");
  CREATE INDEX "leads_owner_idx" ON "leads" USING btree ("owner_id");
  CREATE INDEX "leads_updated_at_idx" ON "leads" USING btree ("updated_at");
  CREATE INDEX "leads_created_at_idx" ON "leads" USING btree ("created_at");
  CREATE INDEX "leads_deleted_at_idx" ON "leads" USING btree ("deleted_at");
  CREATE INDEX "leads_texts_order_parent" ON "leads_texts" USING btree ("order","parent_id");
  CREATE INDEX "leads_rels_order_idx" ON "leads_rels" USING btree ("order");
  CREATE INDEX "leads_rels_parent_idx" ON "leads_rels" USING btree ("parent_id");
  CREATE INDEX "leads_rels_path_idx" ON "leads_rels" USING btree ("path");
  CREATE INDEX "leads_rels_product_lines_id_idx" ON "leads_rels" USING btree ("product_lines_id");
  CREATE INDEX "lead_activities_lead_idx" ON "lead_activities" USING btree ("lead_id");
  CREATE INDEX "lead_activities_by_idx" ON "lead_activities" USING btree ("by_id");
  CREATE INDEX "lead_activities_updated_at_idx" ON "lead_activities" USING btree ("updated_at");
  CREATE INDEX "lead_activities_created_at_idx" ON "lead_activities" USING btree ("created_at");
  CREATE UNIQUE INDEX "product_lines_code_idx" ON "product_lines" USING btree ("code");
  CREATE INDEX "product_lines_image_idx" ON "product_lines" USING btree ("image_id");
  CREATE INDEX "product_lines_updated_at_idx" ON "product_lines" USING btree ("updated_at");
  CREATE INDEX "product_lines_created_at_idx" ON "product_lines" USING btree ("created_at");
  CREATE INDEX "product_lines_slug_idx" ON "product_lines_locales" USING btree ("slug","_locale");
  CREATE UNIQUE INDEX "product_lines_locales_locale_parent_id_unique" ON "product_lines_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "product_lines_locales_parent_id_idx" ON "product_lines_locales" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "products_code_idx" ON "products" USING btree ("code");
  CREATE INDEX "products_line_idx" ON "products" USING btree ("line_id");
  CREATE INDEX "products_cover_idx" ON "products" USING btree ("cover_id");
  CREATE INDEX "products_legal_review_legal_review_reviewed_by_idx" ON "products" USING btree ("legal_review_reviewed_by_id");
  CREATE INDEX "products_updated_at_idx" ON "products" USING btree ("updated_at");
  CREATE INDEX "products_created_at_idx" ON "products" USING btree ("created_at");
  CREATE INDEX "products__status_idx" ON "products" USING btree ("_status");
  CREATE INDEX "products_slug_idx" ON "products_locales" USING btree ("slug","_locale");
  CREATE UNIQUE INDEX "products_locales_locale_parent_id_unique" ON "products_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "products_locales_parent_id_idx" ON "products_locales" USING btree ("_parent_id");
  CREATE INDEX "products_texts_order_parent" ON "products_texts" USING btree ("order","parent_id");
  CREATE INDEX "products_texts_locale_parent" ON "products_texts" USING btree ("locale","parent_id");
  CREATE INDEX "products_rels_order_idx" ON "products_rels" USING btree ("order");
  CREATE INDEX "products_rels_parent_idx" ON "products_rels" USING btree ("parent_id");
  CREATE INDEX "products_rels_path_idx" ON "products_rels" USING btree ("path");
  CREATE INDEX "products_rels_media_id_idx" ON "products_rels" USING btree ("media_id");
  CREATE INDEX "products_rels_documents_id_idx" ON "products_rels" USING btree ("documents_id");
  CREATE INDEX "_products_v_parent_idx" ON "_products_v" USING btree ("parent_id");
  CREATE INDEX "_products_v_version_version_code_idx" ON "_products_v" USING btree ("version_code");
  CREATE INDEX "_products_v_version_version_line_idx" ON "_products_v" USING btree ("version_line_id");
  CREATE INDEX "_products_v_version_version_cover_idx" ON "_products_v" USING btree ("version_cover_id");
  CREATE INDEX "_products_v_version_legal_review_version_legal_review_re_idx" ON "_products_v" USING btree ("version_legal_review_reviewed_by_id");
  CREATE INDEX "_products_v_version_version_updated_at_idx" ON "_products_v" USING btree ("version_updated_at");
  CREATE INDEX "_products_v_version_version_created_at_idx" ON "_products_v" USING btree ("version_created_at");
  CREATE INDEX "_products_v_version_version__status_idx" ON "_products_v" USING btree ("version__status");
  CREATE INDEX "_products_v_created_at_idx" ON "_products_v" USING btree ("created_at");
  CREATE INDEX "_products_v_updated_at_idx" ON "_products_v" USING btree ("updated_at");
  CREATE INDEX "_products_v_snapshot_idx" ON "_products_v" USING btree ("snapshot");
  CREATE INDEX "_products_v_published_locale_idx" ON "_products_v" USING btree ("published_locale");
  CREATE INDEX "_products_v_latest_idx" ON "_products_v" USING btree ("latest");
  CREATE INDEX "_products_v_version_version_slug_idx" ON "_products_v_locales" USING btree ("version_slug","_locale");
  CREATE UNIQUE INDEX "_products_v_locales_locale_parent_id_unique" ON "_products_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_products_v_locales_parent_id_idx" ON "_products_v_locales" USING btree ("_parent_id");
  CREATE INDEX "_products_v_texts_order_parent" ON "_products_v_texts" USING btree ("order","parent_id");
  CREATE INDEX "_products_v_texts_locale_parent" ON "_products_v_texts" USING btree ("locale","parent_id");
  CREATE INDEX "_products_v_rels_order_idx" ON "_products_v_rels" USING btree ("order");
  CREATE INDEX "_products_v_rels_parent_idx" ON "_products_v_rels" USING btree ("parent_id");
  CREATE INDEX "_products_v_rels_path_idx" ON "_products_v_rels" USING btree ("path");
  CREATE INDEX "_products_v_rels_media_id_idx" ON "_products_v_rels" USING btree ("media_id");
  CREATE INDEX "_products_v_rels_documents_id_idx" ON "_products_v_rels" USING btree ("documents_id");
  CREATE UNIQUE INDEX "variants_sku_idx" ON "variants" USING btree ("sku");
  CREATE INDEX "variants_product_idx" ON "variants" USING btree ("product_id");
  CREATE INDEX "variants_updated_at_idx" ON "variants" USING btree ("updated_at");
  CREATE INDEX "variants_created_at_idx" ON "variants" USING btree ("created_at");
  CREATE UNIQUE INDEX "variants_locales_locale_parent_id_unique" ON "variants_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "variants_locales_parent_id_idx" ON "variants_locales" USING btree ("_parent_id");
  CREATE INDEX "compliance_records_product_idx" ON "compliance_records" USING btree ("product_id");
  CREATE INDEX "compliance_records_expires_on_idx" ON "compliance_records" USING btree ("expires_on");
  CREATE INDEX "compliance_records_scan_idx" ON "compliance_records" USING btree ("scan_id");
  CREATE INDEX "compliance_records_approved_by_idx" ON "compliance_records" USING btree ("approved_by_id");
  CREATE INDEX "compliance_records_updated_at_idx" ON "compliance_records" USING btree ("updated_at");
  CREATE INDEX "compliance_records_created_at_idx" ON "compliance_records" USING btree ("created_at");
  CREATE INDEX "pages_blocks_order_idx" ON "pages_blocks" USING btree ("_order");
  CREATE INDEX "pages_blocks_parent_id_idx" ON "pages_blocks" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_locale_idx" ON "pages_blocks" USING btree ("_locale");
  CREATE UNIQUE INDEX "pages_key_idx" ON "pages" USING btree ("key");
  CREATE INDEX "pages_hero_idx" ON "pages" USING btree ("hero_id");
  CREATE INDEX "pages_legal_review_legal_review_reviewed_by_idx" ON "pages" USING btree ("legal_review_reviewed_by_id");
  CREATE INDEX "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "pages" USING btree ("created_at");
  CREATE INDEX "pages__status_idx" ON "pages" USING btree ("_status");
  CREATE UNIQUE INDEX "pages_locales_locale_parent_id_unique" ON "pages_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_locales_parent_id_idx" ON "pages_locales" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_version_blocks_order_idx" ON "_pages_v_version_blocks" USING btree ("_order");
  CREATE INDEX "_pages_v_version_blocks_parent_id_idx" ON "_pages_v_version_blocks" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_version_blocks_locale_idx" ON "_pages_v_version_blocks" USING btree ("_locale");
  CREATE INDEX "_pages_v_parent_idx" ON "_pages_v" USING btree ("parent_id");
  CREATE INDEX "_pages_v_version_version_key_idx" ON "_pages_v" USING btree ("version_key");
  CREATE INDEX "_pages_v_version_version_hero_idx" ON "_pages_v" USING btree ("version_hero_id");
  CREATE INDEX "_pages_v_version_legal_review_version_legal_review_revie_idx" ON "_pages_v" USING btree ("version_legal_review_reviewed_by_id");
  CREATE INDEX "_pages_v_version_version_updated_at_idx" ON "_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_pages_v_version_version_created_at_idx" ON "_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_pages_v_version_version__status_idx" ON "_pages_v" USING btree ("version__status");
  CREATE INDEX "_pages_v_created_at_idx" ON "_pages_v" USING btree ("created_at");
  CREATE INDEX "_pages_v_updated_at_idx" ON "_pages_v" USING btree ("updated_at");
  CREATE INDEX "_pages_v_snapshot_idx" ON "_pages_v" USING btree ("snapshot");
  CREATE INDEX "_pages_v_published_locale_idx" ON "_pages_v" USING btree ("published_locale");
  CREATE INDEX "_pages_v_latest_idx" ON "_pages_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_pages_v_locales_locale_parent_id_unique" ON "_pages_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_locales_parent_id_idx" ON "_pages_v_locales" USING btree ("_parent_id");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumb_sizes_thumb_filename_idx" ON "media" USING btree ("sizes_thumb_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_hero_sizes_hero_filename_idx" ON "media" USING btree ("sizes_hero_filename");
  CREATE UNIQUE INDEX "media_locales_locale_parent_id_unique" ON "media_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "media_locales_parent_id_idx" ON "media_locales" USING btree ("_parent_id");
  CREATE INDEX "documents_updated_at_idx" ON "documents" USING btree ("updated_at");
  CREATE INDEX "documents_created_at_idx" ON "documents" USING btree ("created_at");
  CREATE UNIQUE INDEX "documents_filename_idx" ON "documents" USING btree ("filename");
  CREATE UNIQUE INDEX "documents_locales_locale_parent_id_unique" ON "documents_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "documents_locales_parent_id_idx" ON "documents_locales" USING btree ("_parent_id");
  CREATE INDEX "consents_updated_at_idx" ON "consents" USING btree ("updated_at");
  CREATE INDEX "consents_created_at_idx" ON "consents" USING btree ("created_at");
  CREATE UNIQUE INDEX "data_requests_ref_code_idx" ON "data_requests" USING btree ("ref_code");
  CREATE INDEX "data_requests_updated_at_idx" ON "data_requests" USING btree ("updated_at");
  CREATE INDEX "data_requests_created_at_idx" ON "data_requests" USING btree ("created_at");
  CREATE INDEX "data_requests_rels_order_idx" ON "data_requests_rels" USING btree ("order");
  CREATE INDEX "data_requests_rels_parent_idx" ON "data_requests_rels" USING btree ("parent_id");
  CREATE INDEX "data_requests_rels_path_idx" ON "data_requests_rels" USING btree ("path");
  CREATE INDEX "data_requests_rels_leads_id_idx" ON "data_requests_rels" USING btree ("leads_id");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action");
  CREATE INDEX "audit_logs_collection_slug_idx" ON "audit_logs" USING btree ("collection_slug");
  CREATE INDEX "audit_logs_doc_id_idx" ON "audit_logs" USING btree ("doc_id");
  CREATE INDEX "audit_logs_actor_idx" ON "audit_logs" USING btree ("actor_id");
  CREATE INDEX "audit_logs_updated_at_idx" ON "audit_logs" USING btree ("updated_at");
  CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");
  CREATE UNIQUE INDEX "redirects_from_idx" ON "redirects" USING btree ("from");
  CREATE INDEX "redirects_updated_at_idx" ON "redirects" USING btree ("updated_at");
  CREATE INDEX "redirects_created_at_idx" ON "redirects" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_jobs_log_order_idx" ON "payload_jobs_log" USING btree ("_order");
  CREATE INDEX "payload_jobs_log_parent_id_idx" ON "payload_jobs_log" USING btree ("_parent_id");
  CREATE INDEX "payload_jobs_completed_at_idx" ON "payload_jobs" USING btree ("completed_at");
  CREATE INDEX "payload_jobs_total_tried_idx" ON "payload_jobs" USING btree ("total_tried");
  CREATE INDEX "payload_jobs_has_error_idx" ON "payload_jobs" USING btree ("has_error");
  CREATE INDEX "payload_jobs_task_slug_idx" ON "payload_jobs" USING btree ("task_slug");
  CREATE INDEX "payload_jobs_queue_idx" ON "payload_jobs" USING btree ("queue");
  CREATE INDEX "payload_jobs_wait_until_idx" ON "payload_jobs" USING btree ("wait_until");
  CREATE INDEX "payload_jobs_processing_idx" ON "payload_jobs" USING btree ("processing");
  CREATE INDEX "payload_jobs_updated_at_idx" ON "payload_jobs" USING btree ("updated_at");
  CREATE INDEX "payload_jobs_created_at_idx" ON "payload_jobs" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_leads_id_idx" ON "payload_locked_documents_rels" USING btree ("leads_id");
  CREATE INDEX "payload_locked_documents_rels_lead_activities_id_idx" ON "payload_locked_documents_rels" USING btree ("lead_activities_id");
  CREATE INDEX "payload_locked_documents_rels_product_lines_id_idx" ON "payload_locked_documents_rels" USING btree ("product_lines_id");
  CREATE INDEX "payload_locked_documents_rels_products_id_idx" ON "payload_locked_documents_rels" USING btree ("products_id");
  CREATE INDEX "payload_locked_documents_rels_variants_id_idx" ON "payload_locked_documents_rels" USING btree ("variants_id");
  CREATE INDEX "payload_locked_documents_rels_compliance_records_id_idx" ON "payload_locked_documents_rels" USING btree ("compliance_records_id");
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_documents_id_idx" ON "payload_locked_documents_rels" USING btree ("documents_id");
  CREATE INDEX "payload_locked_documents_rels_consents_id_idx" ON "payload_locked_documents_rels" USING btree ("consents_id");
  CREATE INDEX "payload_locked_documents_rels_data_requests_id_idx" ON "payload_locked_documents_rels" USING btree ("data_requests_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_audit_logs_id_idx" ON "payload_locked_documents_rels" USING btree ("audit_logs_id");
  CREATE INDEX "payload_locked_documents_rels_redirects_id_idx" ON "payload_locked_documents_rels" USING btree ("redirects_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE UNIQUE INDEX "settings_locales_locale_parent_id_unique" ON "settings_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "settings_locales_parent_id_idx" ON "settings_locales" USING btree ("_parent_id");
  CREATE INDEX "settings_texts_order_parent" ON "settings_texts" USING btree ("order","parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "leads_kits" CASCADE;
  DROP TABLE "leads" CASCADE;
  DROP TABLE "leads_texts" CASCADE;
  DROP TABLE "leads_rels" CASCADE;
  DROP TABLE "lead_activities" CASCADE;
  DROP TABLE "product_lines" CASCADE;
  DROP TABLE "product_lines_locales" CASCADE;
  DROP TABLE "products" CASCADE;
  DROP TABLE "products_locales" CASCADE;
  DROP TABLE "products_texts" CASCADE;
  DROP TABLE "products_rels" CASCADE;
  DROP TABLE "_products_v" CASCADE;
  DROP TABLE "_products_v_locales" CASCADE;
  DROP TABLE "_products_v_texts" CASCADE;
  DROP TABLE "_products_v_rels" CASCADE;
  DROP TABLE "variants" CASCADE;
  DROP TABLE "variants_locales" CASCADE;
  DROP TABLE "compliance_records" CASCADE;
  DROP TABLE "pages_blocks" CASCADE;
  DROP TABLE "pages" CASCADE;
  DROP TABLE "pages_locales" CASCADE;
  DROP TABLE "_pages_v_version_blocks" CASCADE;
  DROP TABLE "_pages_v" CASCADE;
  DROP TABLE "_pages_v_locales" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "media_locales" CASCADE;
  DROP TABLE "documents" CASCADE;
  DROP TABLE "documents_locales" CASCADE;
  DROP TABLE "consents" CASCADE;
  DROP TABLE "data_requests" CASCADE;
  DROP TABLE "data_requests_rels" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "audit_logs" CASCADE;
  DROP TABLE "redirects" CASCADE;
  DROP TABLE "totp_attempts" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_jobs_log" CASCADE;
  DROP TABLE "payload_jobs" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "settings" CASCADE;
  DROP TABLE "settings_locales" CASCADE;
  DROP TABLE "settings_texts" CASCADE;
  DROP TABLE "payload_jobs_stats" CASCADE;
  DROP TYPE "public"."_locales";
  DROP TYPE "public"."enum_leads_kits";
  DROP TYPE "public"."enum_leads_type";
  DROP TYPE "public"."enum_leads_locale";
  DROP TYPE "public"."enum_leads_volume_band";
  DROP TYPE "public"."enum_leads_status";
  DROP TYPE "public"."enum_leads_lost_reason";
  DROP TYPE "public"."enum_lead_activities_kind";
  DROP TYPE "public"."enum_products_sale_status";
  DROP TYPE "public"."enum_products_claim_level";
  DROP TYPE "public"."enum_products_legal_review_status";
  DROP TYPE "public"."enum_products_status";
  DROP TYPE "public"."enum__products_v_version_sale_status";
  DROP TYPE "public"."enum__products_v_version_claim_level";
  DROP TYPE "public"."enum__products_v_version_legal_review_status";
  DROP TYPE "public"."enum__products_v_version_status";
  DROP TYPE "public"."enum__products_v_published_locale";
  DROP TYPE "public"."enum_variants_spec_status";
  DROP TYPE "public"."enum_compliance_records_type";
  DROP TYPE "public"."enum_compliance_records_status";
  DROP TYPE "public"."enum_pages_key";
  DROP TYPE "public"."enum_pages_kind";
  DROP TYPE "public"."enum_pages_legal_review_status";
  DROP TYPE "public"."enum_pages_status";
  DROP TYPE "public"."enum__pages_v_version_key";
  DROP TYPE "public"."enum__pages_v_version_kind";
  DROP TYPE "public"."enum__pages_v_version_legal_review_status";
  DROP TYPE "public"."enum__pages_v_version_status";
  DROP TYPE "public"."enum__pages_v_published_locale";
  DROP TYPE "public"."enum_documents_kind";
  DROP TYPE "public"."enum_documents_locale";
  DROP TYPE "public"."enum_documents_visibility";
  DROP TYPE "public"."enum_data_requests_kind";
  DROP TYPE "public"."enum_data_requests_status";
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  DROP TYPE "public"."enum_payload_jobs_log_state";
  DROP TYPE "public"."enum_payload_jobs_task_slug";`)
}
