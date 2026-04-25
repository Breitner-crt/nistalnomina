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
    const cleanUsername = formData.username.trim().toLowerCase();
    const email = cleanUsername.includes('@') ? cleanUsername : `${cleanUsername}${emailSuffix}`;

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

export async function deleteCompanyAccount(companyId: string) {
    const supabaseAdmin = getSupabaseAdmin();

    try {
        // 1. Find the profile(s) associated to get the auth user ID
        const { data: profiles, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('company_id', companyId);

        if (profileError) throw new Error(`Error buscando perfiles: ${profileError.message}`);

        // 2. Delete users from auth.users (this should cascade to profiles usually, but we will be thorough)
        if (profiles && profiles.length > 0) {
            for (const profile of profiles) {
                await supabaseAdmin.auth.admin.deleteUser(profile.id);
            }
        }

        // 3. Delete from companies (dependant data like employees must be deleted first if no ON DELETE CASCADE exists)
        // Intento directo
        const { error: companyError } = await supabaseAdmin
            .from('companies')
            .delete()
            .eq('id', companyId);

        if (companyError) throw new Error(`La empresa tiene registros dependientes (empleados, nóminas) o ocurrió un error: ${companyError.message}`);

        revalidatePath('/superadmin');
        return { success: true };
    } catch (error: any) {
        console.error('Admin Action Delete Error:', error);
        return { success: false, error: error.message };
    }
}
