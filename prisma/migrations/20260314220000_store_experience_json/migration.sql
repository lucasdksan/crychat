-- Persist vitrine admin config and analytics on Store
ALTER TABLE "Store" ADD COLUMN "experienceSettings" JSONB;
ALTER TABLE "Store" ADD COLUMN "experienceAnalytics" JSONB;