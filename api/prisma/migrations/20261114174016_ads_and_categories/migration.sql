-- CreateEnum
CREATE TYPE "AdPlacement" AS ENUM ('HOME_BANNER', 'LISTING_CARD', 'ITEM_PAGE');

-- CreateTable
CREATE TABLE "Ad" (
    "id" TEXT NOT NULL,
    "advertiser" TEXT NOT NULL,
    "headline" TEXT NOT NULL DEFAULT '',
    "imageDesktop" TEXT NOT NULL,
    "imageMobile" TEXT,
    "linkUrl" TEXT NOT NULL,
    "placement" "AdPlacement" NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "paused" BOOLEAN NOT NULL DEFAULT false,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSetting" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "adsenseEnabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Ad_placement_paused_startsAt_endsAt_idx" ON "Ad"("placement", "paused", "startsAt", "endsAt");

-- New shop categories used by the footer links (safe to re-run: skips existing slugs)
INSERT INTO "Category" ("id", "name", "slug", "icon") VALUES
  ('cat_electronics', 'Electronics', 'electronics', '📺'),
  ('cat_kitchen_appliances', 'Kitchen Appliances', 'kitchen-appliances', '🍳')
ON CONFLICT DO NOTHING;
