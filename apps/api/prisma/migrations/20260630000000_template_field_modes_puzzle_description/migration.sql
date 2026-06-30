-- Migration: replace useXxx boolean fields on Template with xxxMode string
-- (values: "disabled" | "optional" | "required"), add customFieldXMode columns,
-- and add description to Puzzle.

-- ── Template: add new mode columns ───────────────────────────────────────────
ALTER TABLE "Template" ADD COLUMN "indexMode"      TEXT NOT NULL DEFAULT 'disabled';
ALTER TABLE "Template" ADD COLUMN "gcCodeMode"     TEXT NOT NULL DEFAULT 'disabled';
ALTER TABLE "Template" ADD COLUMN "difficultyMode" TEXT NOT NULL DEFAULT 'disabled';
ALTER TABLE "Template" ADD COLUMN "terrainMode"    TEXT NOT NULL DEFAULT 'disabled';
ALTER TABLE "Template" ADD COLUMN "coordsMode"     TEXT NOT NULL DEFAULT 'disabled';
ALTER TABLE "Template" ADD COLUMN "hintMode"       TEXT NOT NULL DEFAULT 'disabled';
ALTER TABLE "Template" ADD COLUMN "spoilerMode"    TEXT NOT NULL DEFAULT 'disabled';
ALTER TABLE "Template" ADD COLUMN "customField1Mode" TEXT NOT NULL DEFAULT 'disabled';
ALTER TABLE "Template" ADD COLUMN "customField2Mode" TEXT NOT NULL DEFAULT 'disabled';

-- ── Template: migrate existing boolean data → 'optional' ─────────────────────
UPDATE "Template" SET "indexMode"      = 'optional' WHERE "useIndex"      = true;
UPDATE "Template" SET "gcCodeMode"     = 'optional' WHERE "useGcCode"     = true;
UPDATE "Template" SET "difficultyMode" = 'optional' WHERE "useDifficulty" = true;
UPDATE "Template" SET "terrainMode"    = 'optional' WHERE "useTerrain"    = true;
UPDATE "Template" SET "coordsMode"     = 'optional' WHERE "useCoords"     = true;
UPDATE "Template" SET "hintMode"       = 'optional' WHERE "useHint"       = true;
UPDATE "Template" SET "spoilerMode"    = 'optional' WHERE "useSpoiler"    = true;

-- ── Template: drop old boolean columns ───────────────────────────────────────
ALTER TABLE "Template" DROP COLUMN "useIndex";
ALTER TABLE "Template" DROP COLUMN "useGcCode";
ALTER TABLE "Template" DROP COLUMN "useDifficulty";
ALTER TABLE "Template" DROP COLUMN "useTerrain";
ALTER TABLE "Template" DROP COLUMN "useCoords";
ALTER TABLE "Template" DROP COLUMN "useHint";
ALTER TABLE "Template" DROP COLUMN "useSpoiler";

-- ── Puzzle: add description ───────────────────────────────────────────────────
ALTER TABLE "Puzzle" ADD COLUMN "description" TEXT;
