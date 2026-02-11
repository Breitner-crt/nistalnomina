import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
