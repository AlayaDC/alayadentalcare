-- =====================================================
-- PHASE 1: Core Clinic Operations
-- Run this in your Supabase SQL Editor
-- https://supabase.com/dashboard → SQL Editor → New Query
-- =====================================================

-- 1. Patients table
CREATE TABLE IF NOT EXISTS patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  age INTEGER,
  gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
  blood_group TEXT,
  address TEXT,
  medical_history TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name);

-- 2. Treatment catalog
CREATE TABLE IF NOT EXISTS treatments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  prices JSONB DEFAULT '[]',
  description TEXT,
  position INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Clinic settings (singleton — always one row)
CREATE TABLE IF NOT EXISTS clinic_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  clinic_name TEXT DEFAULT 'Alaya Dental Care',
  logo_url TEXT,
  doctor_stamp_url TEXT,
  phone TEXT DEFAULT '+91 8848659365',
  email TEXT DEFAULT 'alayadentalcare@gmail.com',
  address TEXT,
  working_hours JSONB DEFAULT '{
    "mon": "10:00 AM - 8:00 PM",
    "tue": "10:00 AM - 8:00 PM",
    "wed": "10:00 AM - 8:00 PM",
    "thu": "10:00 AM - 8:00 PM",
    "fri": "10:00 AM - 8:00 PM",
    "sat": "10:00 AM - 8:00 PM",
    "sun": "Closed"
  }',
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO clinic_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- 4. Extend appointments table for Phase 1
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES patients(id);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS check_in_time TIMESTAMPTZ;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS completed_time TIMESTAMPTZ;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS notes TEXT;

-- 5. RLS Policies (service role bypasses these, but good practice)
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_patients" ON patients FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_treatments" ON treatments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_clinic_settings" ON clinic_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
