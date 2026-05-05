-- AddColumn: slug (unique URL identifier for collections)
ALTER TABLE "Collection" ADD COLUMN "slug" TEXT NOT NULL DEFAULT '';

-- Backfill: use id as temporary slug for any existing rows
UPDATE "Collection" SET "slug" = id WHERE slug = '';

-- Remove default once backfill is done
ALTER TABLE "Collection" ALTER COLUMN "slug" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "Collection_slug_key" ON "Collection"("slug");
