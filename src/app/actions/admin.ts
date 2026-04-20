'use server';

import { getSupabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function createEmployerAccount(formData: {
    companyName: string;
    nit: string;
    address: string;
    fullName: string;
    username: string; // This will be used as part of the email suffix
    password: string;
}) {
    const supabaseAdmin = getSupabaseAdmin();
    const emailSuffix = '@nistalnomina.com';
    const email = formData.username.includes('@') ? formData.username : `${formData.username}${emailSuffix}`;

    try {
        // 1. Crear la compañía
        const { data: company, error: companyError } = await supabaseAdmin
            .from('companies')
            .insert({
                name: formData.companyName,
                nit: formData.nit,
                address: formData.address
            })
            .select()
            .single();

        if (companyError) throw new Error(`Error creando compañía: ${companyError.message}`);

        // 2. Crear el usuario en auth.users
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: formData.password,
            email_confirm: true,
            user_metadata: {
                full_name: formData.fullName,
                company_name: formData.companyName
            }
        });

        if (authError) {
            // Rollback company if auth fails
            await supabaseAdmin.from('companies').delete().eq('id', company.id);
            throw new Error(`Error creando usuario: ${authError.message}`);
        }

        // 3. Crear el perfil vinculado
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: authUser.user.id,
                company_id: company.id,
                full_name: formData.fullName,
                role: 'employer'
            });

        if (profileError) {
            // Harder to rollback auth user easily without complications, 
            // but we should at least report it.
            throw new Error(`Error vinculando perfil: ${profileError.message}`);
        }

        revalidatePath('/superadmin');
        return { success: true };
    } catch (error: any) {
        console.error('Admin Action Error:', error);
        return { success: false, error: error.message };
    }
}

export async function getAllCompanies() {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
        .from('companies')
        .select(`
            *,
            profiles(full_name, id)
        `);
    
    if (error) {
        console.error('Error fetching companies:', error);
        return [];
    }
    return data;
}
