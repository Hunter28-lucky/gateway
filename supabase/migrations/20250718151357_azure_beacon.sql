/*
# Create payments table and storage setup

1. New Tables
   - `payments`
     - `id` (uuid, primary key)
     - `utr_number` (text, required)
     - `email_phone` (text, optional)
     - `screenshot_url` (text, optional)
     - `status` (enum: pending, verified, rejected)
     - `submitted_at` (timestamp with timezone)

2. Storage
   - Create `screenshots` bucket for payment proof images
   - Set up storage policies for authenticated users

3. Security
   - Enable RLS on payments table
   - Add policies for authenticated users to manage payments
*/

-- Create status enum
CREATE TYPE payment_status AS ENUM ('pending', 'verified', 'rejected');

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  utr_number text NOT NULL,
  email_phone text,
  screenshot_url text,
  status payment_status DEFAULT 'pending',
  submitted_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create policies for payments table
CREATE POLICY "Allow anonymous insert"
  ON payments
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow authenticated select"
  ON payments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated update"
  ON payments
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create storage bucket for screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('screenshots', 'screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Allow anonymous uploads"
  ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'screenshots');

CREATE POLICY "Allow public access"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'screenshots');

CREATE POLICY "Allow authenticated delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'screenshots');