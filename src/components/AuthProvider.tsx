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
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*, company:companies(*)')
                    .eq('id', sessionUser.id)
                    .single();

                if (error) {
                    console.error('Error fetching profile:', error);
                    setAuthError(error.message || JSON.stringify(error));
                    setProfile(null);
                    setCompany(null);
                } else {
                    setAuthError(null);
                    setProfile(data);
                    setCompany(data.company);
                }
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
