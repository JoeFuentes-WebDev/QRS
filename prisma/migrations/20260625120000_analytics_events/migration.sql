CREATE TABLE "events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event" TEXT NOT NULL,
    "user_id" TEXT,
    "properties" JSONB,
    "context" TEXT NOT NULL,
    "identity_model" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "events_context_check" CHECK ("context" IN ('client', 'server')),
    CONSTRAINT "events_identity_model_check" CHECK ("identity_model" IN ('anonymous', 'authenticated', 'hybrid'))
);

CREATE INDEX "events_user_id_idx" ON "events"("user_id");
CREATE INDEX "events_event_idx" ON "events"("event");
CREATE INDEX "events_created_at_idx" ON "events"("created_at");
