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

-- Nota: Estas políticas permiten que un usuario vea solo los datos de su compañía asignada.
-- El superadmin tiene acceso a todo.

-- Perfiles: El usuario puede ver su propio perfil o el superadmin todos
CREATE POLICY "Users view own profile or superadmin all" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superadmin'
  );

-- Compañías: Ver solo la compañía asignada o superadmin todas
CREATE POLICY "Users view assigned or superadmin all" ON public.companies
  FOR SELECT USING (
    id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()) OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superadmin'
  );

-- Empleados: CRUD filtrado por compañía o superadmin
CREATE POLICY "Users manage company employees or superadmin all" ON public.employees
  FOR ALL USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()) OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superadmin'
  );

-- Periodos: CRUD filtrado por compañía o superadmin
CREATE POLICY "Users manage company periods or superadmin all" ON public.payroll_periods
  FOR ALL USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()) OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superadmin'
  );

-- Entradas de planilla: CRUD filtrado por empleado o superadmin
CREATE POLICY "Users manage company entries or superadmin all" ON public.payroll_entries
  FOR ALL USING (
    employee_id IN (
      SELECT id FROM public.employees 
      WHERE company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    ) OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superadmin'
  );

-- 4. Crear una compañía inicial si no existe
INSERT INTO public.companies (name, nit, address)
VALUES ('Compañía Demostrativa', '0000000-0', 'Ciudad de Guatemala')
ON CONFLICT DO NOTHING;

-- 5. Asignar todos los empleados actuales a la primera compañía creada
UPDATE public.employees
SET company_id = (SELECT id FROM public.companies LIMIT 1)
WHERE company_id IS NULL;

-- 6. Trigger opcional para crear perfil automáticamente al registrarse (pero el usuario los creará manual)
-- Proporcionaremos una función para que el admin pueda facilitar esto si lo desea.
