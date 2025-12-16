/*
  # Fix Rate Me Constraint
  
  1. Drop the unique constraint `one_published_entry_per_user` from `rate_me_entries`.
  2. This resolves the error "cannot drop index... because constraint requires it".
  3. This change allows the Admin to insert multiple entries for the leaderboard, 
     while the frontend logic continues to restrict normal users to one entry per gender.
*/

-- Drop the constraint explicitly
ALTER TABLE rate_me_entries DROP CONSTRAINT IF EXISTS one_published_entry_per_user;

-- Drop the index if it still exists (usually dropped with constraint, but safe to ensure)
DROP INDEX IF EXISTS one_published_entry_per_user;
