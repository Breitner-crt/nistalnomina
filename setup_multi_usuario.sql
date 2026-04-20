-- 1. Crear tabla de perfiles para vincular usuarios con compañías
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id),
  full_name TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar RLS en todas las tablas
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas de seguridad basadas en el company_id del perfil del usuario
-- Nota: Estas políticas permiten que un usuario vea solo los datos de su compañía asignada.

-- Perfiles: El usuario puede ver su propio perfil
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Compañías: Ver solo la compañía asignada
CREATE POLICY "Users can view their companies" ON public.companies
  FOR SELECT USING (
    id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

-- Empleados: CRUD filtrado por compañía
CREATE POLICY "Users can manage employees of their company" ON public.employees
  FOR ALL USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

-- Periodos: CRUD filtrado por compañía
CREATE POLICY "Users can manage periods of their company" ON public.payroll_periods
  FOR ALL USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

-- Entradas de planilla: CRUD filtrado por empleado -> compañía
CREATE POLICY "Users can manage payroll entries of their company" ON public.payroll_entries
  FOR ALL USING (
    employee_id IN (
      SELECT id FROM public.employees 
      WHERE company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    )
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
