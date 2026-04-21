-- ============================================================
-- NORMALIZACIÓN DE ESQUEMA: Unificar valores de status
-- Ejecutar en: Supabase > SQL Editor
-- ============================================================

-- PASO 1: Convertir status de español a inglés en payroll_periods
UPDATE public.payroll_periods SET status = 'open'   WHERE status = 'Abierto';
UPDATE public.payroll_periods SET status = 'closed'  WHERE status = 'Cerrado';

-- PASO 2: Cambiar el default del campo status a 'open'
ALTER TABLE public.payroll_periods 
  ALTER COLUMN status SET DEFAULT 'open';

-- PASO 3: Verificar payroll_entries y añadir columnas faltantes
ALTER TABLE public.payroll_entries
  ADD COLUMN IF NOT EXISTS payroll_period_id UUID REFERENCES public.payroll_periods(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS absences NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commissions NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS overtime_hours NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bonificacion_incentivo NUMERIC DEFAULT 250,
  ADD COLUMN IF NOT EXISTS other_bonuses NUMERIC DEFAULT 0;

-- PASO 4: Forzar reload del schema cache
NOTIFY pgrst, 'reload schema';

-- VERIFICACIÓN FINAL: Ver columnas de ambas tablas
SELECT 'payroll_periods' as tabla, column_name, data_type, column_default 
  FROM information_schema.columns 
  WHERE table_name = 'payroll_periods' AND table_schema = 'public'
UNION ALL
SELECT 'payroll_entries' as tabla, column_name, data_type, column_default 
  FROM information_schema.columns 
  WHERE table_name = 'payroll_entries' AND table_schema = 'public'
ORDER BY tabla, column_name;
