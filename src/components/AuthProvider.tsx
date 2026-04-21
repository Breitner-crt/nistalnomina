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
    const [activePeriod, setActivePeriodState] = useState<PayrollPeriod | null>(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    // Custom setter that persists to localStorage
    const setActivePeriod = (period: PayrollPeriod | null) => {
        setActivePeriodState(period);
        if (period) {
            localStorage.setItem('nistal_active_period', JSON.stringify(period));
        } else {
            localStorage.removeItem('nistal_active_period');
        }
    };

    useEffect(() => {
        const fetchProfile = async (sessionUser: User) => {
            const timeoutId = setTimeout(() => {
                setLoading(false);
                setAuthError("Timeout en llamada a Server Action Secure");
            }, 10000);

            try {
                const { profile, company, activePeriod: serverDefaultPeriod, error } = await fetchProfileSecurely(sessionUser.id);

                if (error) {
                    setAuthError(error);
                    setProfile(null);
                    setCompany(null);
                    setActivePeriodState(null);
                } else {
                    setAuthError(null);
                    setProfile(profile);
                    setCompany(company);

                    // --- PERSISTENCE LOGIC ---
                    // 1. Try memory
                    if (activePeriod) {
                        // Keep current
                    } 
                    // 2. Try localStorage
                    else {
                        const stored = localStorage.getItem('nistal_active_period');
                        if (stored) {
                            try {
                                const parsed = JSON.parse(stored);
                                // Optional: Verify it belongs to the current company
                                if (parsed && parsed.company_id === company?.id) {
                                    setActivePeriodState(parsed);
                                } else {
                                    setActivePeriodState(serverDefaultPeriod);
                                }
                            } catch (e) {
                                setActivePeriodState(serverDefaultPeriod);
                            }
                        } else {
                            // 3. Fallback to server default
                            setActivePeriodState(serverDefaultPeriod);
                        }
                    }
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
                    setActivePeriodState(null);
                    localStorage.removeItem('nistal_active_period');
                    setLoading(false);
                    if (window.location.pathname !== '/login') {
                        router.push('/login');
                    }
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
        // REMOVED pathname from dependencies to prevent re-fetching and resetting period on every navigation
    }, [router]);

    const signOut = async () => {
        localStorage.removeItem('nistal_active_period');
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
