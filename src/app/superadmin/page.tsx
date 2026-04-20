'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { createEmployerAccount, getAllCompanies } from '@/app/actions/admin';
import { 
    ShieldCheck, 
    Building2, 
    UserPlus, 
    LayoutDashboard, 
    Loader2, 
    CheckCircle2, 
    AlertCircle,
    ArrowLeft,
    Users,
    Key,
    User
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SuperAdminPage() {
    const { profile, loading: authLoading } = useAuth();
    const router = useRouter();
    
    const [companies, setCompanies] = useState<any[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        companyName: '',
        nit: '',
        address: '',
        fullName: '',
        username: '',
        password: ''
    });

    useEffect(() => {
        if (!authLoading) {
            if (!profile || profile.role !== 'superadmin') {
                router.push('/');
            } else {
                fetchCompanies();
            }
        }
    }, [authLoading, profile, router]);

    const fetchCompanies = async () => {
        setLoadingData(true);
        const data = await getAllCompanies();
        setCompanies(data);
        setLoadingData(false);
    };

    const handleCreateEmployer = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage(null);

        const result = await createEmployerAccount(formData);

        if (result.success) {
            setMessage({ type: 'success', text: '¡Empresa y Administrador creados exitosamente!' });
            setFormData({
                companyName: '',
                nit: '',
                address: '',
                fullName: '',
                username: '',
                password: ''
            });
            fetchCompanies();
        } else {
            setMessage({ type: 'error', text: result.error || 'Ocurrió un error inesperado' });
        }
        setSubmitting(false);
    };

    if (authLoading || loadingData) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-4 text-white">
                <Loader2 className="animate-spin text-primary-500" size={48} />
                <p className="font-black text-xs uppercase tracking-widest opacity-50">Accediendo al Panel Global...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-8 md:p-12">
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div>
                        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-primary-400 font-bold mb-4 transition-colors group text-sm uppercase tracking-tighter">
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            Regresar
                        </Link>
                        <h1 className="text-5xl font-black text-white flex items-center gap-4 tracking-tighter">
                            <ShieldCheck className="text-primary-500 w-12 h-12" /> Panel General
                        </h1>
                        <p className="text-slate-400 mt-2 text-lg">Control maestro de infraestructura multi-inquilino.</p>
                    </div>

                    <div className="bg-slate-900/50 p-4 rounded-3xl border border-slate-800 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary-500/20 flex items-center justify-center">
                            <User className="text-primary-500" size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Super Usuario</p>
                            <p className="font-bold text-white">{profile?.full_name}</p>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Stats & List */}
                    <div className="lg:col-span-7 space-y-8">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Building2 size={80} />
                                </div>
                                <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Empresas Activas</p>
                                <h3 className="text-5xl font-black text-white">{companies.length}</h3>
                            </div>
                            <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Users size={80} />
                                </div>
                                <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Nodos de Datos</p>
                                <h3 className="text-5xl font-black text-white">Online</h3>
                            </div>
                        </div>

                        <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden">
                            <div className="p-8 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                                <h3 className="text-xl font-black flex items-center gap-3">
                                    <LayoutDashboard className="text-primary-500" /> Directorio de Clientes
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-950/50 text-slate-500 text-xs font-black uppercase tracking-widest">
                                        <tr>
                                            <th className="px-8 py-5">Empresa</th>
                                            <th className="px-8 py-5">Administrador</th>
                                            <th className="px-8 py-5">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {companies.map((comp) => (
                                            <tr key={comp.id} className="hover:bg-slate-800/30 transition-colors">
                                                <td className="px-8 py-6 uppercase font-black text-white tracking-tighter">
                                                    {comp.name}
                                                </td>
                                                <td className="px-8 py-6 text-slate-400 font-medium">
                                                    {comp.profiles?.[0]?.full_name || 'Sin asignar'}
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-500/20">
                                                        Activo
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Registration Form */}
                    <div className="lg:col-span-5">
                        <div className="bg-primary-600 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-10 opacity-10">
                                <UserPlus size={120} />
                            </div>
                            
                            <h2 className="text-3xl font-black text-white mb-8 tracking-tighter flex items-center gap-3">
                                <Building2 /> Nueva Entidad
                            </h2>

                            <form onSubmit={handleCreateEmployer} className="space-y-5">
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-primary-200 uppercase tracking-[0.2em] pl-2">Información Legal</p>
                                    <input
                                        required
                                        placeholder="Nombre de la Empresa"
                                        className="w-full bg-primary-700/50 border-2 border-primary-500/20 rounded-2xl p-4 text-white placeholder:text-primary-300/50 focus:outline-none focus:border-white transition-all"
                                        value={formData.companyName}
                                        onChange={e => setFormData({...formData, companyName: e.target.value})}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <input
                                            required
                                            placeholder="NIT / Tax ID"
                                            className="bg-primary-700/50 border-2 border-primary-500/20 rounded-2xl p-4 text-white placeholder:text-primary-300/50 focus:outline-none focus:border-white transition-all"
                                            value={formData.nit}
                                            onChange={e => setFormData({...formData, nit: e.target.value})}
                                        />
                                        <input
                                            required
                                            placeholder="Dirección"
                                            className="bg-primary-700/50 border-2 border-primary-500/20 rounded-2xl p-4 text-white placeholder:text-primary-300/50 focus:outline-none focus:border-white transition-all"
                                            value={formData.address}
                                            onChange={e => setFormData({...formData, address: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-primary-500/30">
                                    <p className="text-[10px] font-black text-primary-200 uppercase tracking-[0.2em] pl-2">Credenciales de Acceso</p>
                                    <input
                                        required
                                        placeholder="Nombre Completo Administrador"
                                        className="w-full bg-primary-700/50 border-2 border-primary-500/20 rounded-2xl p-4 text-white placeholder:text-primary-300/50 focus:outline-none focus:border-white transition-all"
                                        value={formData.fullName}
                                        onChange={e => setFormData({...formData, fullName: e.target.value})}
                                    />
                                    <div className="relative">
                                        <User className="absolute right-4 top-1/2 -translate-y-1/2 text-primary-300/50" />
                                        <input
                                            required
                                            placeholder="Usuario (ej: patrono_01)"
                                            className="w-full bg-primary-700/50 border-2 border-primary-500/20 rounded-2xl p-4 text-white placeholder:text-primary-300/50 focus:outline-none focus:border-white transition-all"
                                            value={formData.username}
                                            onChange={e => setFormData({...formData, username: e.target.value})}
                                        />
                                    </div>
                                    <div className="relative">
                                        <Key className="absolute right-4 top-1/2 -translate-y-1/2 text-primary-300/50" />
                                        <input
                                            required
                                            type="password"
                                            placeholder="Contraseña Maestra"
                                            className="w-full bg-primary-700/50 border-2 border-primary-500/20 rounded-2xl p-4 text-white placeholder:text-primary-300/50 focus:outline-none focus:border-white transition-all"
                                            value={formData.password}
                                            onChange={e => setFormData({...formData, password: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-white text-primary-600 font-black py-5 rounded-2xl shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 mt-6 disabled:opacity-50"
                                >
                                    {submitting ? <Loader2 className="animate-spin" /> : <UserPlus />}
                                    PROCESAR ALTA GLOBAL
                                </button>

                                {message && (
                                    <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-emerald-500/20 text-emerald-100 border border-emerald-500/30' : 'bg-red-500/20 text-red-100 border border-red-500/30'}`}>
                                        {message.type === 'success' ? <CheckCircle2 /> : <AlertCircle />}
                                        <p className="text-xs font-bold">{message.text}</p>
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
