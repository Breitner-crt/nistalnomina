CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id),
  full_name TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asegurar que existe la columna role si la tabla ya fue creada previamente
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'employer' CHECK (role IN ('superadmin', 'employer'));

-- 2. Habilitar RLS en todas las tablas
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- REFACTORIZACIÓN DE POLÍTICAS RLS PARA EVITAR RECURSIVIDAD

-- 1. Función auxiliar para verificar si el usuario es superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'superadmin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Función auxiliar para obtener el company_id del usuario actual
CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT company_id FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RE-APLICAR POLÍTICAS LIMPIAS

-- Perfiles
DROP POLICY IF EXISTS "Users view own profile or superadmin all" ON public.profiles;
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Superadmin view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;

CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Superadmin view all profiles" ON public.profiles FOR SELECT USING (is_superadmin());
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Compañías
DROP POLICY IF EXISTS "Users view assigned or superadmin all" ON public.companies;
DROP POLICY IF EXISTS "Users view assigned company" ON public.companies;
CREATE POLICY "Users view assigned company" ON public.companies 
  FOR SELECT USING (id = get_my_company_id() OR is_superadmin());

-- Empleados
DROP POLICY IF EXISTS "Users manage company employees or superadmin all" ON public.employees;
DROP POLICY IF EXISTS "Users manage company employees" ON public.employees;
CREATE POLICY "Users manage company employees" ON public.employees
  FOR ALL USING (company_id = get_my_company_id() OR is_superadmin());

-- Periodos
DROP POLICY IF EXISTS "Users manage company periods or superadmin all" ON public.payroll_periods;
DROP POLICY IF EXISTS "Users manage company periods" ON public.payroll_periods;
CREATE POLICY "Users manage company periods" ON public.payroll_periods
  FOR ALL USING (company_id = get_my_company_id() OR is_superadmin());

-- Entradas de planilla
DROP POLICY IF EXISTS "Users manage company entries or superadmin all" ON public.payroll_entries;
DROP POLICY IF EXISTS "Users manage company entries" ON public.payroll_entries;
CREATE POLICY "Users manage company entries" ON public.payroll_entries
  FOR ALL USING (
    is_superadmin() OR 
    employee_id IN (SELECT id FROM public.employees WHERE company_id = get_my_company_id())
  );

-- 4. Compañía por defecto
INSERT INTO public.companies (name, nit, address)
VALUES ('Compañía Demostrativa', '0000000-0', 'Ciudad de Guatemala')
ON CONFLICT DO NOTHING;

-- 5. Vincular empleados huérfanos
UPDATE public.employees
SET company_id = (SELECT id FROM public.companies LIMIT 1)
WHERE company_id IS NULL;
