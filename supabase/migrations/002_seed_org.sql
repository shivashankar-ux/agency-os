-- ============================================================
-- SEED: Create your organization
-- Run this AFTER 001_initial_schema.sql
-- ============================================================

insert into organizations (name) values ('The Story Builder');

-- Note: After running this, go to Supabase Dashboard > Authentication > Users
-- and create your first user (shivashankar.7991@gmail.com) manually,
-- OR sign up through the app's /signup page once it's deployed.
-- The trigger will automatically create a matching profile row.

-- After your user signs up, run this to make yourself the Owner:
-- (replace the email if needed)

-- update profiles set role = 'owner' where email = 'shivashankar.7991@gmail.com';
