-- ============================================================
-- NISTALNOMINA: Módulo de Aguinaldo y Bono 14
-- Script para habilitar la persistencia de pagos y estados
-- Ejecutar en: Supabase > SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.annual_bonus_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    bonus_type TEXT NOT NULL,          -- 'aguinaldo' | 'bono14'
    year INTEGER NOT NULL,             -- Ej: 2025, 2026
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    days_worked INTEGER NOT NULL,
    base_salary NUMERIC(10, 2) NOT NULL,
    gross_amount NUMERIC(10, 2) NOT NULL,
    advances NUMERIC(10, 2) DEFAULT 0,
    judicial_retentions NUMERIC(10, 2) DEFAULT 0,
    net_amount NUMERIC(10, 2) NOT NULL,
    status TEXT DEFAULT 'Pagado',      -- 'Pagado', 'Pendiente'
    payment_mode TEXT DEFAULT '100%',  -- '100%', '50%_primera', '50%_segunda'
    paid_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT annual_bonus_records_unique_payment UNIQUE (company_id, employee_id, bonus_type, year, payment_mode)
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.annual_bonus_records ENABLE ROW LEVEL SECURITY;

-- Política de RLS
DROP POLICY IF EXISTS "Users manage company annual bonus records" ON public.annual_bonus_records;
CREATE POLICY "Users manage company annual bonus records"
ON public.annual_bonus_records
FOR ALL
USING (auth.uid() IS NOT NULL);

-- Notificar recarga de caché de esquema
NOTIFY pgrst, 'reload schema';
