-- NistalNomina Database Schema (Supabase/PostgreSQL)

-- Enable RLS
-- AUTH: Companies table to support multi-tenancy
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  nit TEXT UNIQUE,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employees Table
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  dpi TEXT NOT NULL UNIQUE,
  nit TEXT,
  igss_number TEXT,
  hiring_date DATE NOT NULL,
  base_salary NUMERIC(10, 2) NOT NULL,
  department TEXT,
  position TEXT,
  contract_type TEXT, -- 'Indefinido', 'Temporal', etc.
  status TEXT DEFAULT 'Activo', -- 'Activo', 'Baja'
  termination_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payroll Periods
CREATE TABLE payroll_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  period_type TEXT NOT NULL, -- 'Mensual', 'Quincenal', 'Semanal'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'Abierto', -- 'Abierto', 'Cerrado'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payroll Entries (Calculated values)
CREATE TABLE payroll_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id),
  period_id UUID REFERENCES payroll_periods(id),
  base_salary_earned NUMERIC(10, 2),
  overtime_hours NUMERIC(5, 2) DEFAULT 0,
  overtime_pay NUMERIC(10, 2) DEFAULT 0,
  bonificacion_incentivo NUMERIC(10, 2) DEFAULT 250,
  commissions NUMERIC(10, 2) DEFAULT 0,
  other_bonuses NUMERIC(10, 2) DEFAULT 0,
  igss_laboral NUMERIC(10, 2), -- 4.83%
  isr_retencion NUMERIC(10, 2),
  loans_deduction NUMERIC(10, 2) DEFAULT 0,
  advances_deduction NUMERIC(10, 2) DEFAULT 0,
  total_liquid NUMERIC(10, 2),
  igss_patronal NUMERIC(10, 2), -- 10.67%
  irtra_patronal NUMERIC(10, 2), -- 1%
  intecap_patronal NUMERIC(10, 2), -- 1%
  absences NUMERIC(5, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employee Documents
CREATE TABLE employee_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id),
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  category TEXT, -- 'Contrato', 'DPI', 'NIT'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
