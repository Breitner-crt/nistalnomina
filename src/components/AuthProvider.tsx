"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { fetchProfileSecurely } from '@/app/actions/auth';
import { supabase, Profile, Company, PayrollPeriod } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
    user: User | null;
    profile: Profile | null;
    company: Company | null;
    activePeriod: PayrollPeriod | null;
    setActivePeriod: (period: PayrollPeriod | null) => void;
    loading: boolean;
    authError: string | null;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    company: null,
    activePeriod: null,
    setActivePeriod: () => {},
    loading: true,
    authError: null,
    signOut: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [company, setCompany] = useState<Company | null>(null);
    const [activePeriod, setActivePeriod] = useState<PayrollPeriod | null>(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const fetchProfile = async (sessionUser: User) => {
            // Este timeout de 10s previene que la app se quede en blanco, pero el Server Action
            // ahora resolverá instantáneamente ya que escapa el RLS problemático.
            const timeoutId = setTimeout(() => {
                setLoading(false);
                setAuthError("Timeout en llamada a Server Action Secure");
            }, 10000);

            try {
                // LLAMADA SEGURA BYPASSING RLS
                const { profile, company, activePeriod, error } = await fetchProfileSecurely(sessionUser.id);

                if (error) {
                    setAuthError(error);
                    setProfile(null);
                    setCompany(null);
                    setActivePeriod(null);
                } else {
                    setAuthError(null);
                    setProfile(profile);
                    setCompany(company);
                    setActivePeriod(activePeriod);
                }
            } catch (err: any) {
                console.error('Fatal error in fetchProfileSecurely:', err);
                setAuthError(err.message || 'Error fatal llamando al servidor');
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
                    setActivePeriod(null);
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
        <AuthContext.Provider value={{ user, profile, company, activePeriod, setActivePeriod, loading, authError, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
