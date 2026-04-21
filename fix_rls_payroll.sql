-- ============================================================
-- CORRECCIÓN CRÍTICA: RLS para payroll_periods y payroll_entries
-- Ejecutar en: Supabase > SQL Editor
-- ============================================================

-- PASO 1: Recrear función get_my_company_id con search_path fijo
-- CASCADE elimina las políticas dependientes para poder reemplazar la función
DROP FUNCTION IF EXISTS public.get_my_company_id() CASCADE;
CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- PASO 2: Recrear función is_superadmin con search_path fijo
DROP FUNCTION IF EXISTS public.is_superadmin() CASCADE;
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'superadmin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- PASO 3: Limpiar y recrear política de profiles
-- (Solo el propio usuario puede ver su perfil)
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Superadmin view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;

CREATE POLICY "Users view own profile" ON public.profiles 
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

-- PASO 4: Limpiar y recrear política de companies
DROP POLICY IF EXISTS "Users view assigned company" ON public.companies;
CREATE POLICY "Users view assigned company" ON public.companies 
  FOR SELECT USING (id = get_my_company_id() OR is_superadmin());

-- PASO 5: Limpiar y recrear política de employees
DROP POLICY IF EXISTS "Users manage company employees" ON public.employees;
CREATE POLICY "Users manage company employees" ON public.employees
  FOR ALL USING (company_id = get_my_company_id() OR is_superadmin());

-- PASO 6: Limpiar y recrear política de payroll_periods (CLAVE PARA LOS MÓDULOS)
DROP POLICY IF EXISTS "Users manage company periods" ON public.payroll_periods;
CREATE POLICY "Users manage company periods" ON public.payroll_periods
  FOR ALL USING (company_id = get_my_company_id() OR is_superadmin());

-- PASO 7: Limpiar y recrear política de payroll_entries (CLAVE PARA LOS MÓDULOS)
DROP POLICY IF EXISTS "Users manage company entries" ON public.payroll_entries;
CREATE POLICY "Users manage company entries" ON public.payroll_entries
  FOR ALL USING (
    is_superadmin() OR 
    employee_id IN (SELECT id FROM public.employees WHERE company_id = get_my_company_id())
  );

-- PASO 8: Política para employee_documents
DROP POLICY IF EXISTS "Users manage company documents" ON public.employee_documents;
CREATE POLICY "Users manage company documents" ON public.employee_documents
  FOR ALL USING (
    is_superadmin() OR
    employee_id IN (SELECT id FROM public.employees WHERE company_id = get_my_company_id())
  );

-- VERIFICACIÓN: Esta consulta debe devolver tu company_id si todo está correcto
-- (Ejecutar como prueba con un usuario empleador activo)
-- SELECT get_my_company_id();
