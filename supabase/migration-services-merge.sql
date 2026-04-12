-- =====================================================
-- MERGE: Add pricing & category to services table
-- Run this BEFORE migration-phase2.sql
-- =====================================================

-- Add new columns to existing services table
ALTER TABLE services ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General';
ALTER TABLE services ADD COLUMN IF NOT EXISTS prices JSONB DEFAULT '[]';
ALTER TABLE services ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- If you previously created the treatments table (from Phase 1),
-- you can safely drop it since services now replaces it:
-- DROP TABLE IF EXISTS treatments CASCADE;
