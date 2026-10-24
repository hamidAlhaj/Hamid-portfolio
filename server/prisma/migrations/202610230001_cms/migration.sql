CREATE TABLE "Content" (
 "id" TEXT NOT NULL, "kind" TEXT NOT NULL, "slug" TEXT NOT NULL,
 "data" JSONB NOT NULL, "published" BOOLEAN NOT NULL DEFAULT false,
 "position" INTEGER NOT NULL DEFAULT 0, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Content_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Content_kind_slug_key" ON "Content"("kind", "slug");
CREATE INDEX "Content_kind_published_position_idx" ON "Content"("kind", "published", "position");
CREATE TABLE "Message" (
 "id" TEXT NOT NULL, "name" TEXT NOT NULL, "email" TEXT NOT NULL, "subject" TEXT NOT NULL,
 "message" TEXT NOT NULL, "read" BOOLEAN NOT NULL DEFAULT false,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");
