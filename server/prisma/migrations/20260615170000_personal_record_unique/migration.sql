-- Collapse duplicate personal records, keeping the highest value per
-- (user, exercise, record_type). Duplicates broke PR detection: comparing a
-- new lift against an arbitrary (possibly stale, lower) row let sub-best lifts
-- register as PRs.
DELETE FROM "personal_records"
WHERE "id" IN (
  SELECT "id" FROM (
    SELECT "id", ROW_NUMBER() OVER (
      PARTITION BY "user_id", "exercise_id", "record_type"
      ORDER BY "value" DESC, "achieved_at" DESC, "id"
    ) AS rn
    FROM "personal_records"
  ) ranked
  WHERE ranked.rn > 1
);

-- Replace the non-unique index with a uniqueness guarantee so only one record
-- per (user, exercise, record_type) can ever exist again.
DROP INDEX IF EXISTS "personal_records_user_id_exercise_id_record_type_idx";
CREATE UNIQUE INDEX "personal_records_user_id_exercise_id_record_type_key"
  ON "personal_records"("user_id", "exercise_id", "record_type");
