-- =====================================================
-- COMPLETE MIGRATION - Run this in Supabase SQL Editor
-- https://supabase.com/dashboard → SQL Editor → New Query
-- This is safe to run multiple times (uses IF NOT EXISTS)
-- =====================================================

-- ===================== TABLES =====================

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

-- 2. Add missing columns to services table (for treatment catalog)
ALTER TABLE services ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General';
ALTER TABLE services ADD COLUMN IF NOT EXISTS prices JSONB DEFAULT '[]';
ALTER TABLE services ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

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

-- 4. Extend appointments table
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES patients(id);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS check_in_time TIMESTAMPTZ;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS completed_time TIMESTAMPTZ;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS notes TEXT;

-- 5. Consultations (case sheets)
CREATE TABLE IF NOT EXISTS consultations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id),
  doctor_id UUID REFERENCES doctors(id),
  appointment_id UUID REFERENCES appointments(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  chief_complaint TEXT,
  medical_history JSONB DEFAULT '[]',
  dental_history TEXT,
  examination_notes TEXT,
  status TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'Completed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consultations_patient ON consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_date ON consultations(date);

-- 6. Patient treatments (treatment pipeline)
CREATE TABLE IF NOT EXISTS patient_treatments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id),
  treatment_id UUID REFERENCES services(id),
  treatment_name TEXT NOT NULL,
  tooth_numbers INTEGER[] DEFAULT '{}',
  status TEXT DEFAULT 'Available' CHECK (status IN ('Available', 'In Progress', 'Completed')),
  amount DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_patient_treatments_consultation ON patient_treatments(consultation_id);
CREATE INDEX IF NOT EXISTS idx_patient_treatments_patient ON patient_treatments(patient_id);

-- 7. Dental chart entries
CREATE TABLE IF NOT EXISTS dental_chart (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id),
  tooth_number INTEGER NOT NULL CHECK (tooth_number BETWEEN 11 AND 48),
  condition TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(patient_id, tooth_number, condition)
);

CREATE INDEX IF NOT EXISTS idx_dental_chart_patient ON dental_chart(patient_id);

-- 8. Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  patient_id UUID NOT NULL REFERENCES patients(id),
  consultation_id UUID REFERENCES consultations(id),
  subtotal DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Sent', 'Partial', 'Paid')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_patient ON invoices(patient_id);

-- 9. Invoice line items
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) DEFAULT 0,
  patient_treatment_id UUID REFERENCES patient_treatments(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  patient_id UUID NOT NULL REFERENCES patients(id),
  amount DECIMAL(10,2) NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('Cash', 'UPI', 'Card', 'Bank')),
  transaction_id TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_patient ON payments(patient_id);

-- ===================== TRIGGERS =====================

-- Auto-generate invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_invoice_number ON invoices;
CREATE TRIGGER set_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW
  WHEN (NEW.invoice_number IS NULL OR NEW.invoice_number = '')
  EXECUTE FUNCTION generate_invoice_number();

-- ===================== RLS POLICIES =====================

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE dental_chart ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (safe to run multiple times)
DROP POLICY IF EXISTS "authenticated_patients" ON patients;
DROP POLICY IF EXISTS "authenticated_clinic_settings" ON clinic_settings;
DROP POLICY IF EXISTS "authenticated_consultations" ON consultations;
DROP POLICY IF EXISTS "authenticated_patient_treatments" ON patient_treatments;
DROP POLICY IF EXISTS "authenticated_dental_chart" ON dental_chart;
DROP POLICY IF EXISTS "authenticated_invoices" ON invoices;
DROP POLICY IF EXISTS "authenticated_invoice_items" ON invoice_items;
DROP POLICY IF EXISTS "authenticated_payments" ON payments;
DROP POLICY IF EXISTS "authenticated_services" ON services;

-- Create policies
CREATE POLICY "authenticated_patients" ON patients FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_clinic_settings" ON clinic_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_consultations" ON consultations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_patient_treatments" ON patient_treatments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_dental_chart" ON dental_chart FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_invoices" ON invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_invoice_items" ON invoice_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_payments" ON payments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_services" ON services FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ===================== DONE =====================
-- All tables, columns, indexes, triggers, and policies are now set up.
