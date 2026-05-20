-- Run this in Supabase Dashboard > SQL Editor
-- Adds Siigo electronic invoice columns to the sales table

ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS siigo_invoice_id     TEXT,
  ADD COLUMN IF NOT EXISTS siigo_invoice_prefix  TEXT,
  ADD COLUMN IF NOT EXISTS siigo_invoice_number  INTEGER,
  ADD COLUMN IF NOT EXISTS siigo_invoice_name    TEXT;
