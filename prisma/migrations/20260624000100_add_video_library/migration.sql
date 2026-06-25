-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "thumbnailUrl" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "isFreePreview" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Video_slug_key" ON "Video"("slug");
CREATE INDEX "Video_isPublished_sortOrder_idx" ON "Video"("isPublished", "sortOrder");
CREATE INDEX "Video_category_idx" ON "Video"("category");
