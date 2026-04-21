-- ============================================================
-- ARREGLO DE NOT-NULL: Columna period_type
-- Ejecutar en: Supabase > SQL Editor
-- ============================================================

-- 1. Poner un valor por defecto para que no falle si no se envía
ALTER TABLE public.payroll_periods 
  ALTER COLUMN period_type SET DEFAULT 'Mensual';

-- 2. Llenar cualquier registro que haya quedado nulo por error
UPDATE public.payroll_periods 
  SET period_type = 'Mensual' 
  WHERE period_type IS NULL;

-- 3. (Opcional pero recomendado) Si prefieres que sea opcional en el futuro
-- ALTER TABLE public.payroll_periods ALTER COLUMN period_type DROP NOT NULL;

-- 4. Refrescar cache
NOTIFY pgrst, 'reload schema';

SELECT 'payroll_periods' as tabla, column_name, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'payroll_periods' AND column_name = 'period_type';
