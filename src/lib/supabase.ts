import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if URL is valid or fallback to placeholder to avoid build-time crashes
const isValidUrl = (url?: string) => url && url.startsWith('http');
const finalUrl = isValidUrl(supabaseUrl) ? supabaseUrl! : 'https://placeholder.supabase.co';
const finalKey = supabaseAnonKey || 'placeholder';

if (!isValidUrl(supabaseUrl) || !supabaseAnonKey) {
    if (typeof window !== 'undefined') {
        console.error('ERROR: Supabase credentials missing or invalid! Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
    }
}

export const supabase = createClient(finalUrl, finalKey);

export interface Profile {
    id: string;
    company_id: string;
    full_name?: string;
    role: 'superadmin' | 'employer';
    company?: Company;
}

export interface Company {
    id: string;
    name: string;
    nit?: string;
    address?: string;
}

export interface Employee {
    id?: string;
    company_id: string;
    first_name: string;
    last_name: string;
    dpi: string;
    nit?: string;
    igss_number?: string;
    hiring_date: string;
    base_salary: number;
    department?: string;
    position?: string;
    contract_type?: string;
    status?: 'Activo' | 'Baja';
    termination_date?: string;
}

export interface PayrollPeriod {
    id: string;
    company_id: string;
    name: string;
    start_date: string;
    end_date: string;
    status: 'open' | 'closed';
    created_at?: string;
    closed_at?: string;
}

export interface PayrollEntry {
    id: string;
    payroll_period_id: string;
    employee_id: string;
    base_salary: number;
    absences: number;
    overtime_hours: number;
    commissions: number;
    igss_deduction: number;
    isr_deduction: number;
    other_deductions: number;
    net_salary: number;
    status: string;
}

// Cliente administrativo (SOLO PARA USO EN SERVER ACTIONS / API ROUTES)
export const getSupabaseAdmin = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseServiceRoleKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined in environment variables');
    }

    return createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
};
