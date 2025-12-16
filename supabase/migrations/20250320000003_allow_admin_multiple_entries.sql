/*
  # Remove Unique Entry Constraint for Admin Flexibility

  ## Query Description:
  This migration drops the unique constraint `one_published_entry_per_user` on the `rate_me_entries` table.
  This is required to allow the Admin account to upload multiple entries to the leaderboard for seeding/competition purposes.
  
  Note: The application logic (frontend) still enforces the "one entry per user" rule for standard users by checking for existing entries before inserting.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Medium"
  - Requires-Backup: false
  - Reversible: true

  ## Structure Details:
  - Drop INDEX/CONSTRAINT `one_published_entry_per_user` on `rate_me_entries`
*/

-- Drop the unique index if it exists
DROP INDEX IF EXISTS one_published_entry_per_user;

-- Drop the constraint if it was added as a table constraint
ALTER TABLE rate_me_entries DROP CONSTRAINT IF EXISTS one_published_entry_per_user;
