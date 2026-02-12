import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('ERROR: Supabase credentials missing! Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables.');
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder');

// Types based on schema.sql
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
}
