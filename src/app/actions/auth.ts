'use server';

import { getSupabaseAdmin, Profile, Company } from '@/lib/supabase';

export async function fetchProfileSecurely(userId: string) {
    try {
        const supabase = getSupabaseAdmin();
        
        // Fetch profile with admin key (Bypasses RLS)
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
            
        if (profileError) {
            return { profile: null, company: null, error: `Error DB Profile: ${profileError.message}` };
        }

        let companyData = null;
        if (profileData && profileData.company_id) {
            const { data: comp } = await supabase
                .from('companies')
                .select('*')
                .eq('id', profileData.company_id)
                .single();
            companyData = comp;
        }

        return { 
            profile: profileData, 
            company: companyData, 
            error: null 
        };
    } catch (err: any) {
        return { profile: null, company: null, error: `Server Action Fatal: ${err.message}` };
    }
}
