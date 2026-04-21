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
            return { profile: null, company: null, activePeriod: null, error: `Error DB Profile: ${profileError.message}` };
        }

        let companyData = null;
        let activePeriod = null;

        if (profileData && profileData.company_id) {
            const { data: comp } = await supabase
                .from('companies')
                .select('*')
                .eq('id', profileData.company_id)
                .single();
            companyData = comp;

            if (companyData) {
                // Ensure a default active period exists
                const currentYear = new Date().getFullYear();
                const currentMonth = new Date().getMonth();
                const defaultName = `Mes de ${new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(new Date())} ${currentYear}`;
                
                const { data: periods } = await supabase
                    .from('payroll_periods')
                    .select('*')
                    .eq('company_id', companyData.id)
                    .eq('name', defaultName)
                    .limit(1);

                if (periods && periods.length > 0) {
                    activePeriod = periods[0];
                } else {
                    const startDate = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
                    const endDate = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];
                    const newPeriod = {
                        id: crypto.randomUUID(),
                        company_id: companyData.id,
                        name: defaultName,
                        start_date: startDate,
                        end_date: endDate,
                        status: 'open'
                    };
                    const { data: created } = await supabase
                        .from('payroll_periods')
                        .insert([newPeriod])
                        .select()
                        .single();
                    if (created) {
                        activePeriod = created;
                    }
                }
            }
        }

        return { 
            profile: profileData, 
            company: companyData, 
            activePeriod: activePeriod,
            error: null 
        };
    } catch (err: any) {
        return { profile: null, company: null, activePeriod: null, error: `Server Action Fatal: ${err.message}` };
    }
}
