CREATE TABLE IF NOT EXISTS "prebuilt_routes" (
  "id" serial PRIMARY KEY NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "city" text NOT NULL,
  "mood" text NOT NULL,
  "stops" text NOT NULL,
  "accent" text NOT NULL,
  "image" text NOT NULL,
  "tagline" text NOT NULL,
  "itinerary" jsonb NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "prebuilt_routes_slug_idx" ON "prebuilt_routes" ("slug");
CREATE INDEX IF NOT EXISTS "prebuilt_routes_sort_order_idx" ON "prebuilt_routes" ("sort_order");
