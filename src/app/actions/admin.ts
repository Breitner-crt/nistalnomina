'use server';

import { getSupabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function createEmployerAccount(formData: {
    companyName: string;
    nit: string;
    address: string;
    fullName: string;
    username: string;
    password: string;
}) {
    const supabaseAdmin = getSupabaseAdmin();
    const emailSuffix = '@nistalnomina.com';
    const cleanUsername = formData.username.trim().toLowerCase();
    const email = cleanUsername.includes('@') ? cleanUsername : `${cleanUsername}${emailSuffix}`;

    try {
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
            await supabaseAdmin.from('companies').delete().eq('id', company.id);
            throw new Error(`Error creando usuario: ${authError.message}`);
        }

        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: authUser.user.id,
                company_id: company.id,
                full_name: formData.fullName,
                role: 'employer'
            });

        if (profileError) {
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
        // 1. Obtener ID del usuario en auth.users
        const { data: profiles, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('company_id', companyId);

        if (profileError) throw new Error(`Error buscando perfiles: ${profileError.message}`);

        // 2. Eliminar de autenticación (esto suele borrar el perfil automáticamente por cascada)
        if (profiles && profiles.length > 0) {
            for (const profile of profiles) {
                await supabaseAdmin.auth.admin.deleteUser(profile.id);
            }
        }

        // 3. Eliminar empresa
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

    }
    return data;
}
