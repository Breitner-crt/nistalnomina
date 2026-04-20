"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Loader2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError('Credenciales incorrectas. Por favor, verifica tu correo y contraseña.');
            setLoading(false);
        } else {
            router.push('/');
        }
    };

    return (
        <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-slate-50 to-slate-100">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 p-10">
                    <header className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-900 rounded-2xl mb-6 shadow-lg shadow-primary-900/20">
                            <span className="text-white font-black text-2xl italic leading-none">N</span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Bienvenido</h1>
                        <p className="text-slate-500 font-medium">Gestión de Planilla Premium</p>
                    </header>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1" htmlFor="email">Correo Electrónico</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors" size={20} />
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="ejemplo@nistal.com"
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-medium"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1" htmlFor="password">Contraseña</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors" size={20} />
                                <input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-medium"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-sm font-bold flex items-center gap-3 border border-rose-100 animate-in fade-in zoom-in duration-300">
                                <div className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></div>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary-900 text-white py-4 rounded-2xl font-black text-lg hover:bg-slate-900 transition-all shadow-xl shadow-primary-900/10 disabled:opacity-70 flex items-center justify-center gap-3 group active:scale-95"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={24} />
                            ) : (
                                <>
                                    <span>Entrar al Sistema</span>
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
                
                <p className="text-center mt-8 text-slate-400 text-sm font-medium">
                    © 2026 NistalNomina • Inteligencia Empresarial
                </p>
            </div>
        </main>
    );
}
