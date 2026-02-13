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
