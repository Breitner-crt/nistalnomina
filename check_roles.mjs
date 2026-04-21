import { createClient } from '@supabase/supabase-js'; 

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY); 

async function run() { 
    const { data: profiles, error: pError } = await supabase.from('profiles').select('*'); 
    console.log("Profiles:");
    console.log(profiles);

    const { data: session } = await supabase.auth.getSession();
    console.log("Session:");
    console.log(session);
} 

run();
