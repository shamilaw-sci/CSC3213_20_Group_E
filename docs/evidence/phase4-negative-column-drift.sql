-- REVIEW DRAFT ONLY. Outside supabase/migrations; never run on an existing installation.
-- No current/live database changes are authorized. See README.md for unresolved decisions.
-- Require an independently verified, separate empty Supabase test database.
-- The explicit session marker is an accidental-run guard, not proof of isolation.
BEGIN;
SET LOCAL statement_timeout = '60s';
SET LOCAL lock_timeout = '3s';
SET LOCAL search_path = pg_catalog, public, extensions;
DO $phase4_guard$
BEGIN
    IF current_setting('thirasara.phase4_isolated', true) IS DISTINCT FROM 'approved-empty-test' THEN
        RAISE EXCEPTION 'Phase 4 isolated-test approval marker is missing';
    END IF;
    IF current_setting('server_version_num')::integer / 10000 <> 17 THEN
        RAISE EXCEPTION 'This draft requires reviewed PostgreSQL major 17';
    END IF;
    IF EXISTS (
        SELECT 1 FROM pg_catalog.pg_class c
        JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relkind IN ('r','p','v','m','S','f')
    ) THEN
        RAISE EXCEPTION 'Public application relations already exist; baseline replay refused';
    END IF;
    IF current_user <> 'postgres' THEN
        RAISE EXCEPTION 'This draft requires the reviewed postgres owner role';
    END IF;
    IF EXISTS (
        SELECT 1 FROM (VALUES ('anon'),('authenticated'),('service_role')) required(role_name)
        WHERE NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles r WHERE r.rolname = required.role_name)
    ) OR pg_catalog.to_regprocedure('auth.uid()') IS NULL
      OR pg_catalog.to_regprocedure('auth.role()') IS NULL
      OR pg_catalog.to_regclass('storage.buckets') IS NULL
      OR pg_catalog.to_regclass('storage.objects') IS NULL THEN
        RAISE EXCEPTION 'Supabase-managed roles/auth/storage prerequisites are missing';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_catalog.pg_extension e
        JOIN pg_catalog.pg_namespace n ON n.oid = e.extnamespace
        WHERE e.extname = 'postgis' AND n.nspname = 'extensions' AND e.extversion = '3.3.7'
    ) OR pg_catalog.to_regprocedure('extensions.uuid_generate_v4()') IS NULL THEN
        RAISE EXCEPTION 'Reviewed PostGIS 3.3.7 and uuid-ossp prerequisites in extensions are missing';
    END IF;
END;
$phase4_guard$;

-- 1. Observed enum labels in their actual sort order.

CREATE TYPE public."lead_lifecycle" AS ENUM ('New', 'Attempted Contact', 'Active', 'Closed', 'Offer');

CREATE TYPE public."lead_timeframe" AS ENUM ('ASAP', '1-3 Months', '6+ Months', 'Browsing');

CREATE TYPE public."payment_status" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

CREATE TYPE public."property_status" AS ENUM ('AVAILABLE', 'PENDING', 'SOLD', 'pending', 'approved', 'rejected');

CREATE TYPE public."user_role" AS ENUM ('BUYER', 'SELLER', 'ADMIN', 'PENDING_AGENT', 'AGENT', 'REJECTED_AGENT', 'BANNED');


-- 2. All tables first; foreign keys follow after their dependencies exist.

CREATE TABLE public."agent_profiles" (
    "agent_id" uuid NOT NULL,
    "agency_name" text,
    "license_number" character varying(100),
    "bio" text,
    "languages" character varying(255),
    "youtube_video_url" character varying(500),
    "total_sales" integer DEFAULT 0,
    "total_rentals" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()),
    "updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()),
    "service_areas" character varying(500),
    "specialization" character varying(50) DEFAULT 'Both'::character varying,
    "rejection_reason" text,
    "cover_image_url" text
);

ALTER TABLE public."agent_profiles" ENABLE ROW LEVEL SECURITY;

CREATE TABLE public."agent_reviews" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "agent_id" uuid,
    "reviewer_id" uuid,
    "rating" integer NOT NULL,
    "comment" text,
    "is_flagged" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public."agent_reviews" ENABLE ROW LEVEL SECURITY;

CREATE TABLE public."contact_inquiries" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "first_name" text NOT NULL,
    "last_name" text NOT NULL,
    "email" text NOT NULL,
    "message" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public."contact_inquiries" ENABLE ROW LEVEL SECURITY;

CREATE TABLE public."conversations" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "type" text NOT NULL,
    "property_id" uuid,
    "buyer_id" uuid,
    "seller_id" uuid,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "support_requested" boolean DEFAULT false,
    "lead_status" text DEFAULT 'New'::text,
    "timeframe" text DEFAULT 'Not specified'::text,
    "pre_approved" boolean DEFAULT false
);

ALTER TABLE public."conversations" ENABLE ROW LEVEL SECURITY;

CREATE TABLE public."favorites" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL,
    "property_id" uuid NOT NULL,
    "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public."favorites" ENABLE ROW LEVEL SECURITY;

CREATE TABLE public."feasibility_history" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL,
    "salary" numeric NOT NULL,
    "savings" numeric NOT NULL,
    "loan_deductions" numeric NOT NULL,
    "tenure_years" integer NOT NULL,
    "max_buying_power" numeric NOT NULL,
    "loan_capacity" numeric NOT NULL,
    "monthly_installment" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public."feasibility_history" ENABLE ROW LEVEL SECURITY;

CREATE TABLE public."inquiries" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "property_id" uuid,
    "buyer_id" uuid,
    "message" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public."inquiries" ENABLE ROW LEVEL SECURITY;

CREATE TABLE public."leads" (
    "lead_id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "assigned_agent_id" uuid,
    "property_id" uuid,
    "client_name" character varying(255) NOT NULL,
    "client_email" character varying(255) NOT NULL,
    "client_phone" character varying(50),
    "lead_source" character varying(100) DEFAULT 'Direct'::character varying,
    "pre_approval_status" boolean DEFAULT false,
    "timeframe_to_move" lead_timeframe DEFAULT 'Browsing'::lead_timeframe,
    "lifecycle_status" lead_lifecycle DEFAULT 'New'::lead_lifecycle,
    "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()),
    "updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public."leads" ENABLE ROW LEVEL SECURITY;

CREATE TABLE public."message_receipts" (
    "message_id" uuid NOT NULL,
    "user_id" uuid NOT NULL,
    "read_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public."message_receipts" ENABLE ROW LEVEL SECURITY;

CREATE TABLE public."messages" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "conversation_id" uuid NOT NULL,
    "sender_id" text NOT NULL,
    "sender_role" text NOT NULL,
    "body" text NOT NULL,
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now(),
    "attachment_url" text,
    "attachment_name" text,
    "attachment_type" text,
    "recipient_receipts" boolean DEFAULT true NOT NULL
);

ALTER TABLE public."messages" ENABLE ROW LEVEL SECURITY;

CREATE TABLE public."payment_orders" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "property_id" uuid NOT NULL,
    "owner_id" uuid NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "currency" text DEFAULT 'LKR'::text NOT NULL,
    "mode" text NOT NULL,
    "merchant_id" text NOT NULL,
    "status" text DEFAULT 'pending'::text NOT NULL,
    "provider_payment_id" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "expires_at" timestamp with time zone DEFAULT (now() + '00:30:00'::interval) NOT NULL,
    "paid_at" timestamp with time zone
);

ALTER TABLE public."payment_orders" ENABLE ROW LEVEL SECURITY;

CREATE TABLE public."payment_receipt_outbox" (
    "order_id" uuid NOT NULL,
    "recipient" text NOT NULL,
    "property_title" text NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "status" text DEFAULT 'pending'::text NOT NULL,
    "attempts" integer DEFAULT 0 NOT NULL,
    "available_at" timestamp with time zone DEFAULT now() NOT NULL,
    "lease_id" uuid,
    "sent_at" timestamp with time zone
);

ALTER TABLE public."payment_receipt_outbox" ENABLE ROW LEVEL SECURITY;

CREATE TABLE public."platform_settings" (
    "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
    "setting_key" text NOT NULL,
    "setting_value" text NOT NULL,
    "updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public."platform_settings" ENABLE ROW LEVEL SECURITY;

CREATE TABLE public."properties" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "seller_id" uuid,
    "title" character varying(255) NOT NULL,
    "description" text,
    "price" numeric(15,2) NOT NULL,
    "boundary" geometry(Polygon,4326),
    "status" property_status DEFAULT 'AVAILABLE'::property_status,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "bedrooms" integer,
    "bathrooms" integer,
    "land_size" numeric,
    "latitude" numeric,
    "longitude" numeric,
    "images" text[],
    "type" text,
    "rejection_reason" text,
    "payment_status" text DEFAULT 'Unpaid'::text,
    "house_size" numeric,
    "contact_number" character varying(20),
    "price_period" text,
    "district" text,
    "city" text,
    "listing_type" character varying(50) DEFAULT 'Sale'::character varying,
    "address" text,
    "views_count" integer DEFAULT 0,
    "virtual_tours" jsonb DEFAULT '[]'::jsonb
);

ALTER TABLE public."properties" ENABLE ROW LEVEL SECURITY;

CREATE TABLE public."property_sales_history" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "listing_id" uuid,
    "assessment_number" character varying(255),
    "coordinates" geometry(Point,4326),
    "sale_price" numeric(15,2) NOT NULL,
    "sale_date" timestamp with time zone DEFAULT timezone('utc'::text, now()),
    "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()),
    "updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public."property_sales_history" ENABLE ROW LEVEL SECURITY;

CREATE TABLE public."role_requests" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL,
    "requested_role" text DEFAULT 'SELLER'::text NOT NULL,
    "status" text DEFAULT 'pending'::text NOT NULL,
    "reason" text,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);

ALTER TABLE public."role_requests" ENABLE ROW LEVEL SECURITY;

CREATE TABLE public."saved_searches" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid,
    "title" character varying(255) NOT NULL,
    "polygon" text,
    "beds" integer,
    "baths" integer,
    "property_type" character varying(50),
    "created_at" timestamp with time zone DEFAULT now(),
    "email_alerts_enabled" boolean DEFAULT true NOT NULL,
    "filters" jsonb
);

ALTER TABLE public."saved_searches" ENABLE ROW LEVEL SECURITY;

CREATE TABLE public."transactions" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "property_id" uuid,
    "buyer_id" uuid,
    "amount" numeric(15,2) NOT NULL,
    "status" text DEFAULT 'PENDING'::payment_status,
    "transaction_id" character varying(255),
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "currency" text DEFAULT 'LKR'::text,
    "payment_method" text DEFAULT 'PayHere'::text,
    "seller_id" uuid,
    "payment_order_id" uuid
);

ALTER TABLE public."transactions" ENABLE ROW LEVEL SECURITY;

CREATE TABLE public."users" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "name" character varying(255) NOT NULL,
    "email" character varying(255) NOT NULL,
    "password_hash" character varying(255),
    "role" user_role DEFAULT 'BUYER'::user_role,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "avatar_url" text,
    "theme_preference" character varying(50) DEFAULT 'system'::character varying,
    "email_notifications" boolean DEFAULT true,
    "phone" character varying(20),
    "provider" character varying(20),
    "provider_id" character varying(255)
);

ALTER TABLE public."users" ENABLE ROW LEVEL SECURITY;


-- 3. Captured validated constraints. Non-FKs before FKs.

ALTER TABLE public."agent_profiles" ADD CONSTRAINT "agent_profiles_pkey" PRIMARY KEY (agent_id);

ALTER TABLE public."agent_reviews" ADD CONSTRAINT "agent_reviews_pkey" PRIMARY KEY (id);

ALTER TABLE public."agent_reviews" ADD CONSTRAINT "agent_reviews_rating_check" CHECK (rating >= 1 AND rating <= 5);

ALTER TABLE public."contact_inquiries" ADD CONSTRAINT "contact_inquiries_email_check" CHECK (char_length(email) >= 3 AND char_length(email) <= 254);

ALTER TABLE public."contact_inquiries" ADD CONSTRAINT "contact_inquiries_first_name_check" CHECK (char_length(btrim(first_name)) >= 1 AND char_length(btrim(first_name)) <= 100);

ALTER TABLE public."contact_inquiries" ADD CONSTRAINT "contact_inquiries_last_name_check" CHECK (char_length(btrim(last_name)) >= 1 AND char_length(btrim(last_name)) <= 100);

ALTER TABLE public."contact_inquiries" ADD CONSTRAINT "contact_inquiries_message_check" CHECK (char_length(btrim(message)) >= 10 AND char_length(btrim(message)) <= 5000);

ALTER TABLE public."contact_inquiries" ADD CONSTRAINT "contact_inquiries_pkey" PRIMARY KEY (id);

ALTER TABLE public."conversations" ADD CONSTRAINT "conversations_pkey" PRIMARY KEY (id);

ALTER TABLE public."conversations" ADD CONSTRAINT "conversations_type_check" CHECK (type = ANY (ARRAY['property'::text, 'support'::text]));

ALTER TABLE public."favorites" ADD CONSTRAINT "favorites_pkey" PRIMARY KEY (id);

ALTER TABLE public."favorites" ADD CONSTRAINT "favorites_user_id_property_id_key" UNIQUE (user_id, property_id);

ALTER TABLE public."feasibility_history" ADD CONSTRAINT "feasibility_history_pkey" PRIMARY KEY (id);

ALTER TABLE public."inquiries" ADD CONSTRAINT "inquiries_pkey" PRIMARY KEY (id);

ALTER TABLE public."leads" ADD CONSTRAINT "leads_pkey" PRIMARY KEY (lead_id);

ALTER TABLE public."message_receipts" ADD CONSTRAINT "message_receipts_pkey" PRIMARY KEY (message_id, user_id);

ALTER TABLE public."messages" ADD CONSTRAINT "messages_pkey" PRIMARY KEY (id);

ALTER TABLE public."messages" ADD CONSTRAINT "messages_sender_role_check" CHECK (sender_role = ANY (ARRAY['BUYER'::text, 'SELLER'::text, 'ADMIN'::text]));

ALTER TABLE public."payment_orders" ADD CONSTRAINT "payment_orders_amount_check" CHECK (amount > 0::numeric);

ALTER TABLE public."payment_orders" ADD CONSTRAINT "payment_orders_check" CHECK (expires_at > created_at);

ALTER TABLE public."payment_orders" ADD CONSTRAINT "payment_orders_check1" CHECK ((status = 'paid'::text) = (paid_at IS NOT NULL));

ALTER TABLE public."payment_orders" ADD CONSTRAINT "payment_orders_currency_check" CHECK (currency = 'LKR'::text);

ALTER TABLE public."payment_orders" ADD CONSTRAINT "payment_orders_mode_check" CHECK (mode = ANY (ARRAY['sandbox'::text, 'live'::text]));

ALTER TABLE public."payment_orders" ADD CONSTRAINT "payment_orders_pkey" PRIMARY KEY (id);

ALTER TABLE public."payment_orders" ADD CONSTRAINT "payment_orders_provider_payment_id_key" UNIQUE (provider_payment_id);

ALTER TABLE public."payment_orders" ADD CONSTRAINT "payment_orders_status_check" CHECK (status = ANY (ARRAY['pending'::text, 'paid'::text, 'cancelled'::text, 'expired'::text]));

ALTER TABLE public."payment_receipt_outbox" ADD CONSTRAINT "payment_receipt_outbox_pkey" PRIMARY KEY (order_id);

ALTER TABLE public."payment_receipt_outbox" ADD CONSTRAINT "payment_receipt_outbox_status_check" CHECK (status = ANY (ARRAY['pending'::text, 'sending'::text, 'sent'::text]));

ALTER TABLE public."platform_settings" ADD CONSTRAINT "platform_settings_pkey" PRIMARY KEY (id);

ALTER TABLE public."platform_settings" ADD CONSTRAINT "platform_settings_setting_key_key" UNIQUE (setting_key);

ALTER TABLE public."properties" ADD CONSTRAINT "properties_pkey" PRIMARY KEY (id);

ALTER TABLE public."property_sales_history" ADD CONSTRAINT "property_sales_history_pkey" PRIMARY KEY (id);

ALTER TABLE public."role_requests" ADD CONSTRAINT "role_requests_pkey" PRIMARY KEY (id);

ALTER TABLE public."role_requests" ADD CONSTRAINT "role_requests_status_check" CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text]));

ALTER TABLE public."role_requests" ADD CONSTRAINT "role_requests_user_id_status_key" UNIQUE (user_id, status);

ALTER TABLE public."saved_searches" ADD CONSTRAINT "saved_search_filters_object" CHECK (filters IS NULL OR jsonb_typeof(filters) = 'object'::text);

ALTER TABLE public."saved_searches" ADD CONSTRAINT "saved_searches_pkey" PRIMARY KEY (id);

ALTER TABLE public."transactions" ADD CONSTRAINT "transactions_payment_order_id_key" UNIQUE (payment_order_id);

ALTER TABLE public."transactions" ADD CONSTRAINT "transactions_pkey" PRIMARY KEY (id);

ALTER TABLE public."users" ADD CONSTRAINT "users_email_key" UNIQUE (email);

ALTER TABLE public."users" ADD CONSTRAINT "users_pkey" PRIMARY KEY (id);

ALTER TABLE public."agent_profiles" ADD CONSTRAINT "agent_profiles_agent_id_fkey" FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE public."agent_reviews" ADD CONSTRAINT "agent_reviews_agent_id_fkey" FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE public."agent_reviews" ADD CONSTRAINT "agent_reviews_reviewer_id_fkey" FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE public."conversations" ADD CONSTRAINT "conversations_buyer_id_fkey" FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE public."conversations" ADD CONSTRAINT "conversations_property_id_fkey" FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL;

ALTER TABLE public."conversations" ADD CONSTRAINT "conversations_seller_id_fkey" FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE public."favorites" ADD CONSTRAINT "favorites_property_id_fkey" FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE public."favorites" ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE public."feasibility_history" ADD CONSTRAINT "feasibility_history_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE public."inquiries" ADD CONSTRAINT "inquiries_buyer_id_fkey" FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE public."leads" ADD CONSTRAINT "leads_assigned_agent_id_fkey" FOREIGN KEY (assigned_agent_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE public."leads" ADD CONSTRAINT "leads_property_id_fkey" FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL;

ALTER TABLE public."message_receipts" ADD CONSTRAINT "message_receipts_message_id_fkey" FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE;

ALTER TABLE public."message_receipts" ADD CONSTRAINT "message_receipts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE public."messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;

ALTER TABLE public."payment_orders" ADD CONSTRAINT "payment_orders_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE public."payment_orders" ADD CONSTRAINT "payment_orders_property_id_fkey" FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE RESTRICT;

ALTER TABLE public."payment_receipt_outbox" ADD CONSTRAINT "payment_receipt_outbox_order_id_fkey" FOREIGN KEY (order_id) REFERENCES payment_orders(id);

ALTER TABLE public."properties" ADD CONSTRAINT "properties_seller_id_fkey" FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE public."property_sales_history" ADD CONSTRAINT "property_sales_history_listing_id_fkey" FOREIGN KEY (listing_id) REFERENCES properties(id) ON DELETE SET NULL;

ALTER TABLE public."role_requests" ADD CONSTRAINT "role_requests_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE public."saved_searches" ADD CONSTRAINT "saved_searches_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE public."transactions" ADD CONSTRAINT "transactions_buyer_id_fkey" FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE public."transactions" ADD CONSTRAINT "transactions_payment_order_id_fkey" FOREIGN KEY (payment_order_id) REFERENCES payment_orders(id);


-- 4. Only standalone indexes; primary/unique constraints already create their indexes.

CREATE INDEX contact_inquiries_created_at_id_idx ON public.contact_inquiries USING btree (created_at DESC, id DESC);

CREATE INDEX conversations_buyer_idx ON public.conversations USING btree (buyer_id);

CREATE INDEX conversations_property_idx ON public.conversations USING btree (property_id);

CREATE INDEX conversations_seller_idx ON public.conversations USING btree (seller_id);

CREATE INDEX idx_feasibility_history_user_created ON public.feasibility_history USING btree (user_id, created_at DESC);

CREATE INDEX message_receipts_user_idx ON public.message_receipts USING btree (user_id, message_id);

CREATE INDEX messages_conversation_idx ON public.messages USING btree (conversation_id);

CREATE UNIQUE INDEX payment_orders_one_pending_idx ON public.payment_orders USING btree (property_id) WHERE (status = 'pending'::text);

CREATE INDEX payment_orders_property_idx ON public.payment_orders USING btree (property_id, created_at DESC);

CREATE INDEX payment_receipt_due_idx ON public.payment_receipt_outbox USING btree (available_at) WHERE (status <> 'sent'::text);

CREATE INDEX idx_properties_boundary ON public.properties USING gist (boundary);

CREATE INDEX idx_sales_history_assessment ON public.property_sales_history USING btree (assessment_number);

CREATE INDEX idx_sales_history_coordinates ON public.property_sales_history USING gist (coordinates);

CREATE INDEX idx_role_requests_status ON public.role_requests USING btree (status);

CREATE INDEX idx_role_requests_user ON public.role_requests USING btree (user_id);

CREATE INDEX idx_saved_searches_alerts_enabled ON public.saved_searches USING btree (email_alerts_enabled) WHERE (email_alerts_enabled = true);


-- 5. Five application functions. rls_auto_enable/ensure_rls remain environment decisions.

CREATE OR REPLACE FUNCTION public.claim_payment_receipts(p_order_id uuid DEFAULT NULL::uuid)
 RETURNS SETOF payment_receipt_outbox
 LANGUAGE sql
 SET search_path TO 'public', 'pg_temp'
AS $function$
    UPDATE public.payment_receipt_outbox o SET status='sending',attempts=o.attempts+1,
        lease_id=gen_random_uuid(),available_at=now()+interval '5 minutes'
    WHERE o.order_id IN (
        SELECT q.order_id FROM public.payment_receipt_outbox q
        WHERE q.status<>'sent' AND q.available_at<=now() AND (p_order_id IS NULL OR q.order_id=p_order_id)
        ORDER BY q.available_at LIMIT 10 FOR UPDATE SKIP LOCKED
    ) RETURNING o.*;
$function$;

CREATE OR REPLACE FUNCTION public.create_listing_checkout(p_property_id uuid, p_owner_id uuid, p_amount numeric, p_currency text, p_mode text, p_merchant_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE listing public.properties%ROWTYPE; checkout public.payment_orders%ROWTYPE;
BEGIN
    SELECT * INTO listing FROM public.properties WHERE id=p_property_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Property not found'; END IF;
    IF listing.seller_id IS DISTINCT FROM p_owner_id THEN RAISE EXCEPTION 'Checkout owner mismatch'; END IF;
    IF listing.payment_status='Paid' THEN RAISE EXCEPTION 'Property already paid'; END IF;
    SELECT * INTO checkout FROM public.payment_orders WHERE property_id=p_property_id AND status='pending';
    IF FOUND AND checkout.expires_at > now() AND checkout.owner_id=p_owner_id
        AND checkout.mode=p_mode AND checkout.merchant_id=p_merchant_id THEN
        RETURN to_jsonb(checkout);
    END IF;
    UPDATE public.payment_orders SET status='expired' WHERE property_id=p_property_id AND status='pending';
    INSERT INTO public.payment_orders(property_id,owner_id,amount,currency,mode,merchant_id)
        VALUES(p_property_id,p_owner_id,p_amount,p_currency,p_mode,p_merchant_id) RETURNING * INTO checkout;
    RETURN to_jsonb(checkout);
END $function$;

CREATE OR REPLACE FUNCTION public.increment_property_views(property_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
DECLARE
    new_views integer;
BEGIN
    UPDATE properties
    SET views_count = COALESCE(views_count, 0) + 1
    WHERE id = property_id
    RETURNING views_count INTO new_views;
    
    RETURN new_views;
END;
$function$;

CREATE OR REPLACE FUNCTION public.search_properties(search_polygon text)
 RETURNS SETOF properties
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT *
  FROM properties
  WHERE ST_Intersects(
    boundary::geometry, 
    ST_GeomFromText(search_polygon, 4326)
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.settle_listing_checkout(p_order_id uuid, p_payment_id text, p_amount numeric, p_currency text, p_mode text, p_merchant_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE checkout public.payment_orders%ROWTYPE; listing public.properties%ROWTYPE; receipt_email text;
BEGIN
    -- Property-before-order locking matches checkout creation and avoids deadlocks.
    SELECT * INTO checkout FROM public.payment_orders WHERE id=p_order_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Checkout not found'; END IF;
    SELECT * INTO listing FROM public.properties WHERE id=checkout.property_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Property not found'; END IF;
    SELECT * INTO checkout FROM public.payment_orders WHERE id=p_order_id FOR UPDATE;
    IF checkout.amount IS DISTINCT FROM p_amount OR checkout.currency IS DISTINCT FROM p_currency
        OR checkout.mode IS DISTINCT FROM p_mode OR checkout.merchant_id IS DISTINCT FROM p_merchant_id
        OR p_payment_id IS NULL OR btrim(p_payment_id)='' THEN RAISE EXCEPTION 'Checkout terms mismatch'; END IF;
    IF checkout.status='paid' THEN
        IF checkout.provider_payment_id IS DISTINCT FROM p_payment_id THEN
            RAISE EXCEPTION 'Different payment requires reconciliation';
        END IF;
        RETURN jsonb_build_object('order',to_jsonb(checkout),'property',to_jsonb(listing),'already_paid',true);
    END IF;
    IF listing.seller_id IS DISTINCT FROM checkout.owner_id THEN RAISE EXCEPTION 'Checkout owner changed'; END IF;
    IF listing.payment_status='Paid' OR checkout.status='cancelled' THEN
        RAISE EXCEPTION 'Conflicting payment requires reconciliation';
    END IF;
    -- Honor signed late success if no other checkout paid this listing.
    INSERT INTO public.transactions(property_id,amount,currency,payment_method,status,transaction_id,payment_order_id)
        VALUES(checkout.property_id,checkout.amount,checkout.currency,'PayHere','SUCCESS',p_payment_id,checkout.id);
    UPDATE public.properties SET payment_status='Paid' WHERE id=checkout.property_id RETURNING * INTO listing;
    UPDATE public.payment_orders SET status='paid',provider_payment_id=p_payment_id,paid_at=now()
        WHERE id=checkout.id RETURNING * INTO checkout;
    UPDATE public.payment_orders SET status='cancelled' WHERE property_id=checkout.property_id AND status='pending';
    SELECT email INTO receipt_email FROM public.users WHERE id=checkout.owner_id;
    IF receipt_email IS NOT NULL AND receipt_email<>'' THEN
        INSERT INTO public.payment_receipt_outbox(order_id,recipient,property_title,amount)
            VALUES(checkout.id,receipt_email,coalesce(listing.title,'Your Property'),checkout.amount);
    END IF;
    RETURN jsonb_build_object('order',to_jsonb(checkout),'property',to_jsonb(listing),'already_paid',false);
END $function$;


-- 6. Explicit table ACLs. Revoke inherited creation defaults before restoring observed grants.

REVOKE ALL ON TABLE public."agent_profiles" FROM PUBLIC, anon, authenticated, service_role;

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."agent_profiles" TO "anon";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."agent_profiles" TO "authenticated";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."agent_profiles" TO "service_role";

REVOKE ALL ON TABLE public."agent_reviews" FROM PUBLIC, anon, authenticated, service_role;

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."agent_reviews" TO "anon";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."agent_reviews" TO "authenticated";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."agent_reviews" TO "service_role";

REVOKE ALL ON TABLE public."contact_inquiries" FROM PUBLIC, anon, authenticated, service_role;

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."contact_inquiries" TO "service_role";

REVOKE ALL ON TABLE public."conversations" FROM PUBLIC, anon, authenticated, service_role;

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."conversations" TO "anon";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."conversations" TO "authenticated";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."conversations" TO "service_role";

REVOKE ALL ON TABLE public."favorites" FROM PUBLIC, anon, authenticated, service_role;

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."favorites" TO "anon";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."favorites" TO "authenticated";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."favorites" TO "service_role";

REVOKE ALL ON TABLE public."feasibility_history" FROM PUBLIC, anon, authenticated, service_role;

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."feasibility_history" TO "anon";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."feasibility_history" TO "authenticated";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."feasibility_history" TO "service_role";

REVOKE ALL ON TABLE public."inquiries" FROM PUBLIC, anon, authenticated, service_role;

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."inquiries" TO "anon";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."inquiries" TO "authenticated";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."inquiries" TO "service_role";

REVOKE ALL ON TABLE public."leads" FROM PUBLIC, anon, authenticated, service_role;

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."leads" TO "anon";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."leads" TO "authenticated";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."leads" TO "service_role";

REVOKE ALL ON TABLE public."message_receipts" FROM PUBLIC, anon, authenticated, service_role;

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."message_receipts" TO "service_role";

REVOKE ALL ON TABLE public."messages" FROM PUBLIC, anon, authenticated, service_role;

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."messages" TO "anon";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."messages" TO "authenticated";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."messages" TO "service_role";

REVOKE ALL ON TABLE public."payment_orders" FROM PUBLIC, anon, authenticated, service_role;

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."payment_orders" TO "service_role";

REVOKE ALL ON TABLE public."payment_receipt_outbox" FROM PUBLIC, anon, authenticated, service_role;

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."payment_receipt_outbox" TO "service_role";

REVOKE ALL ON TABLE public."platform_settings" FROM PUBLIC, anon, authenticated, service_role;

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."platform_settings" TO "anon";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."platform_settings" TO "authenticated";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."platform_settings" TO "service_role";

REVOKE ALL ON TABLE public."properties" FROM PUBLIC, anon, authenticated, service_role;

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."properties" TO "anon";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."properties" TO "authenticated";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."properties" TO "service_role";

REVOKE ALL ON TABLE public."property_sales_history" FROM PUBLIC, anon, authenticated, service_role;

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."property_sales_history" TO "anon";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."property_sales_history" TO "authenticated";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."property_sales_history" TO "service_role";

REVOKE ALL ON TABLE public."role_requests" FROM PUBLIC, anon, authenticated, service_role;

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."role_requests" TO "anon";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."role_requests" TO "authenticated";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."role_requests" TO "service_role";

REVOKE ALL ON TABLE public."saved_searches" FROM PUBLIC, anon, authenticated, service_role;

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."saved_searches" TO "anon";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."saved_searches" TO "authenticated";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."saved_searches" TO "service_role";

REVOKE ALL ON TABLE public."transactions" FROM PUBLIC, anon, authenticated, service_role;

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."transactions" TO "anon";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."transactions" TO "authenticated";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."transactions" TO "service_role";

REVOKE ALL ON TABLE public."users" FROM PUBLIC, anon, authenticated, service_role;

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."users" TO "anon";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."users" TO "authenticated";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."users" TO "service_role";


-- 7. Explicit function EXECUTE ACLs, including revocation of PUBLIC defaults.

REVOKE ALL ON FUNCTION public."claim_payment_receipts"(p_order_id uuid) FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."claim_payment_receipts"(p_order_id uuid) TO "service_role";

REVOKE ALL ON FUNCTION public."create_listing_checkout"(p_property_id uuid, p_owner_id uuid, p_amount numeric, p_currency text, p_mode text, p_merchant_id text) FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."create_listing_checkout"(p_property_id uuid, p_owner_id uuid, p_amount numeric, p_currency text, p_mode text, p_merchant_id text) TO "service_role";

REVOKE ALL ON FUNCTION public."increment_property_views"(property_id uuid) FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."increment_property_views"(property_id uuid) TO PUBLIC;

GRANT EXECUTE ON FUNCTION public."increment_property_views"(property_id uuid) TO "anon";

GRANT EXECUTE ON FUNCTION public."increment_property_views"(property_id uuid) TO "authenticated";

GRANT EXECUTE ON FUNCTION public."increment_property_views"(property_id uuid) TO "service_role";

REVOKE ALL ON FUNCTION public."search_properties"(search_polygon text) FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."search_properties"(search_polygon text) TO PUBLIC;

GRANT EXECUTE ON FUNCTION public."search_properties"(search_polygon text) TO "anon";

GRANT EXECUTE ON FUNCTION public."search_properties"(search_polygon text) TO "authenticated";

GRANT EXECUTE ON FUNCTION public."search_properties"(search_polygon text) TO "service_role";

REVOKE ALL ON FUNCTION public."settle_listing_checkout"(p_order_id uuid, p_payment_id text, p_amount numeric, p_currency text, p_mode text, p_merchant_id text) FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."settle_listing_checkout"(p_order_id uuid, p_payment_id text, p_amount numeric, p_currency text, p_mode text, p_merchant_id text) TO "service_role";


-- 8. Public RLS policies. Explicit proposed saved-search deviation; see README.

CREATE POLICY "Agent profiles are viewable by everyone" ON "public"."agent_profiles" AS PERMISSIVE FOR SELECT TO PUBLIC USING (true);

CREATE POLICY "Agents can insert their own profile" ON "public"."agent_profiles" AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((auth.uid() = agent_id));

CREATE POLICY "Agents can update their own profile" ON "public"."agent_profiles" AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((auth.uid() = agent_id));

CREATE POLICY "Logged in users can insert reviews" ON "public"."agent_reviews" AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((auth.uid() = reviewer_id));

CREATE POLICY "Reviews are viewable by everyone" ON "public"."agent_reviews" AS PERMISSIVE FOR SELECT TO PUBLIC USING (true);

CREATE POLICY "Users can delete their own favorites" ON "public"."favorites" AS PERMISSIVE FOR DELETE TO PUBLIC USING ((auth.uid() = user_id));

CREATE POLICY "Users can insert their own favorites" ON "public"."favorites" AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Users can view their own favorites" ON "public"."favorites" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((auth.uid() = user_id));

CREATE POLICY "Users can delete their own feasibility history" ON "public"."feasibility_history" AS PERMISSIVE FOR DELETE TO PUBLIC USING ((auth.uid() = user_id));

CREATE POLICY "Users can insert their own feasibility history" ON "public"."feasibility_history" AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Users can view their own feasibility history" ON "public"."feasibility_history" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((auth.uid() = user_id));

CREATE POLICY "Agents can update their own leads" ON "public"."leads" AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((auth.uid() = assigned_agent_id));

CREATE POLICY "Agents can view their own leads" ON "public"."leads" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((auth.uid() = assigned_agent_id));

CREATE POLICY "Anyone can insert a lead" ON "public"."leads" AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK (true);

CREATE POLICY "Anyone can view property sales history" ON "public"."property_sales_history" AS PERMISSIVE FOR SELECT TO PUBLIC USING (true);

CREATE POLICY "Authenticated users can insert sales history" ON "public"."property_sales_history" AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((auth.role() = 'authenticated'::text));

CREATE POLICY "Users can delete their own saved searches" ON "public"."saved_searches" AS PERMISSIVE FOR DELETE TO PUBLIC USING ((auth.uid() = user_id));

CREATE POLICY "Users can insert their own saved searches" ON "public"."saved_searches" AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Users can view their own saved searches" ON "public"."saved_searches" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((auth.uid() = user_id));


-- 9. Application bucket configuration only, never object/user rows.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES ('avatars', 'avatars', true, NULL, NULL);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES ('chat-attachments', 'chat-attachments', true, NULL, NULL);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES ('logo', 'logo', false, NULL, NULL);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES ('properties', 'properties', true, NULL, NULL);

CREATE POLICY "Allow authenticated uploads" ON "storage"."objects" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((bucket_id = 'chat-attachments'::text));

CREATE POLICY "Allow public read access" ON "storage"."objects" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((bucket_id = 'chat-attachments'::text));

CREATE POLICY "Allow users to delete their own uploads" ON "storage"."objects" AS PERMISSIVE FOR DELETE TO "authenticated" USING (((bucket_id = 'chat-attachments'::text) AND (auth.uid() = owner)));

CREATE POLICY "Avatar images are publicly accessible." ON "storage"."objects" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((bucket_id = 'avatars'::text));

CREATE POLICY "Users can update their own avatars." ON "storage"."objects" AS PERMISSIVE FOR UPDATE TO PUBLIC USING (((bucket_id = 'avatars'::text) AND (auth.uid() = owner)));

CREATE POLICY "Users can upload their own avatars." ON "storage"."objects" AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK (((bucket_id = 'avatars'::text) AND (auth.uid() = owner)));


-- No publication membership, environment event triggers, app rows or history writes.
COMMIT;
