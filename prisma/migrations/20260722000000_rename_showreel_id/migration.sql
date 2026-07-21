-- RenameColumn: from "showreelId" to "id"; change default from 'showreelId' to 'singleton'
ALTER TABLE "Showreel" RENAME COLUMN "showreelId" TO "id";
ALTER TABLE "Showreel" ALTER COLUMN "id" SET DEFAULT 'singleton';
-- Update existing singleton's id value to 'singleton' (was 'showreelId')
UPDATE "Showreel" SET "id" = 'singleton' WHERE "id" = 'showreelId';