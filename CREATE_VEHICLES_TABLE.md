# Create Vehicles Table in Supabase

Follow these steps to set up the vehicles table in your Supabase database:

## Step 1: Open Supabase SQL Editor

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/nfaisyzhpzttuxmfbhot
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**

## Step 2: Run the SQL Script

1. Open the file `supabase_create_vehicles_table.sql` in this project
2. Copy the entire contents
3. Paste it into the Supabase SQL Editor
4. Click **Run** (or press `Cmd+Enter` / `Ctrl+Enter`)

## Step 3: Verify the Table

1. Go to **Table Editor** in the left sidebar
2. You should see a new `vehicles` table
3. Check that it has these columns:
   - `id` (UUID, primary key)
   - `user_id` (UUID, foreign key to auth.users)
   - `make` (text)
   - `model` (text)
   - `sub_model` (text, nullable)
   - `year` (text)
   - `color` (text, nullable)
   - `nickname` (text, nullable)
   - `image_url` (text, nullable)
   - `created_at` (timestamp)
   - `updated_at` (timestamp)

## Step 4: Verify RLS Policies

1. In the **Table Editor**, click on the `vehicles` table
2. Click on the **Policies** tab
3. You should see 4 policies:
   - "Users can view all vehicles" (SELECT)
   - "Users can insert own vehicles" (INSERT)
   - "Users can update own vehicles" (UPDATE)
   - "Users can delete own vehicles" (DELETE)

## Troubleshooting

If you get an error about the table already existing:
- The table might already be created. You can skip the `CREATE TABLE` part and just run the RLS policies section.

If you get RLS policy errors:
- Make sure you're running the entire script, including the `DROP POLICY IF EXISTS` statements.

## Next Steps

Once the table is created, you can:
1. Navigate to your Profile page in the app
2. Click the "+" button in the "My Garage" section
3. Fill out the vehicle form and save

