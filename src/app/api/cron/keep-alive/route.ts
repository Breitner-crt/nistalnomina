import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        // Realizamos una consulta mínima a la tabla de compañías
        // Esto mantiene la base de datos activa en Supabase
        const { data, error } = await supabase
            .from('companies')
            .select('id')
            .limit(1);

        if (error) throw error;

        return NextResponse.json({ 
            success: true, 
            message: 'Database keep-alive successful',
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('Keep-alive error:', error);
        return NextResponse.json({ 
            success: false, 
            error: error.message 
        }, { status: 500 });
    }
}
