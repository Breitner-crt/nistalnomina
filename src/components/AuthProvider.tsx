"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase, Profile, Company } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
    user: User | null;
    profile: Profile | null;
    company: Company | null;
    loading: boolean;
    authError: string | null;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    company: null,
    loading: true,
    authError: null,
    signOut: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [company, setCompany] = useState<Company | null>(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const fetchProfile = async (sessionUser: User) => {
            // Failsafe: if profile fetch takes too long, release loading state
            const timeoutId = setTimeout(() => {
                setLoading(false);
                setAuthError("Timeout conectando con DB");
                console.warn('Auth: Profile fetch timed out. Releasing loading state.');
            }, 5000);

            try {
                // 1. Fetch profile standalone
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', sessionUser.id)
                    .single();

                if (profileError) {
                    console.error('Error fetching profile:', profileError);
                    setAuthError(`Profile API: ${profileError.message || JSON.stringify(profileError)}`);
                    setProfile(null);
                    setCompany(null);
                    return;
                }

                setProfile(profileData);

                // 2. Fetch company standalone if they have one
                if (profileData && profileData.company_id) {
                    const { data: companyData, error: companyError } = await supabase
                        .from('companies')
                        .select('*')
                        .eq('id', profileData.company_id)
                        .single();
                        
                    if (!companyError) {
                        setCompany(companyData);
                    } else {
                        console.error('Company fetch error (ignored):', companyError);
                        setCompany(null);
                    }
                } else {
                    setCompany(null);
                }

                setAuthError(null);

            } catch (err: any) {
                console.error('Fatal error in fetchProfile:', err);
                setAuthError(err.message || 'Error fatal');
            } finally {
                clearTimeout(timeoutId);
                setLoading(false);
            }
        };

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                const currentUser = session?.user ?? null;
                setUser(currentUser);

                if (currentUser) {
                    await fetchProfile(currentUser);
                } else {
                    setProfile(null);
                    setCompany(null);
                    setLoading(false);
                    if (pathname !== '/login') {
                        router.push('/login');
                    }
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [router, pathname]);

    const signOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, profile, company, loading, authError, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
