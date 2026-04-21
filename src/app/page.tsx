"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Users,
    Calculator,
    FileText,
    FileSpreadsheet,
    Lock,
    LayoutDashboard,
    ArrowRight,
    CreditCard,
    LogOut,
    Building2,
    Loader2
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function HomePage() {
    const modules = [
        {
            title: "Control de Empleados",
            description: "Gestión de expedientes, DPI, NIT y salarios base.",
            href: "/employees",
            icon: <Users className="text-blue-600" />,
            color: "bg-blue-50"
        },
        {
            title: "Cálculo de Planilla",
            description: "Motor de cálculos legales (IGSS, ISR, Horas Extras).",
            href: "/payroll-demo",
            icon: <Calculator className="text-primary-600" />,
            color: "bg-primary-50"
        },
        {
            title: "Descuentos",
            description: "Gestión de faltas y otras deducciones del periodo.",
            href: "/discounts",
            icon: <CreditCard className="text-rose-600" />,
            color: "bg-rose-50"
        },
        {
            title: "Pagos Extras",
            description: "Gestión de comisiones y horas extras del periodo.",
            href: "/extras",
            icon: <CreditCard className="text-primary-600" />,
            color: "bg-primary-50"
        },
        {
            title: "Liquidaciones",
            description: "Calculadora de indemnización y prestaciones irrenunciables.",
            href: "/severance",
            icon: <FileText className="text-rose-600" />,
            color: "bg-rose-50"
        },
        {
            title: "Cierre de Mes",
            description: "Consolidación contable y bloqueo de periodos.",
            href: "/closure",
            icon: <Lock className="text-amber-600" />,
            color: "bg-amber-50"
        },
        {
            title: "Reportes y Excel",
            description: "Exportación de planilla general y carga masiva IGSS.",
            href: "/reports",
            icon: <FileSpreadsheet className="text-green-600" />,
            color: "bg-green-50"
        },
        {
            title: "Vista de Recibo",
            description: "Vista previa de impresión de boletas de pago PDF.",
            href: "/payslip-preview",
            icon: <LayoutDashboard className="text-purple-600" />,
            color: "bg-purple-50"
        }
    ];

    const { company, signOut, loading, profile } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && profile?.role === 'superadmin') {
            console.log('User is superadmin, redirecting...');
            router.replace('/superadmin');
        }
    }, [loading, profile, router]);

    // Bloqueo total para SuperAdmin en esta ruta para evitar que vea el dashboard de empresa
    if (loading || profile?.role === 'superadmin') {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-primary-600" size={48} />
                <div className="text-center">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Verificando Credenciales...</p>
                    <p className="text-[10px] text-slate-300 mt-1">Rol detectado: {profile?.role || 'Buscando...'}</p>
                </div>
            </div>
        );
    }

    // Si llegamos aquí, es un employer
    return (
        <main className="min-h-screen bg-slate-50 p-8 md:p-16">
            <div className="max-w-6xl mx-auto space-y-12">
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="bg-primary-900 p-4 rounded-[1.5rem] shadow-lg">
                                <span className="text-white font-black text-2xl italic leading-none">N</span>
                            </div>
                            <div>
                                <h1 className="text-4xl font-black text-slate-900 tracking-tight">NistalNomina</h1>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Panel de Control de Planilla</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600 font-bold bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm w-fit group hover:border-primary-200 transition-colors">
                            <Building2 size={20} className="text-primary-600 group-hover:scale-110 transition-transform" />
                            <span>{company?.name || 'Administración Central'}</span>
                            {/* CAJA DE DEBUG PARA ENTENDER QUÉ ROL TIENE EN VERDAD */}
                            <span className="ml-4 px-2 py-1 bg-red-100 text-red-800 text-[10px] rounded-full uppercase tracking-widest border border-red-200">
                                Rol DB: {profile?.role || 'NINGUNO/ERROR DE DB'}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={signOut}
                        className="flex items-center gap-2 text-slate-500 hover:text-rose-600 font-bold transition-all bg-white px-8 py-4 rounded-2xl border border-slate-200 shadow-sm group hover:border-rose-100 hover:bg-rose-50 active:scale-95"
                    >
                        <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                        Cerrar Sesión
                    </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {modules.map((m, idx) => (
                        <Link key={idx} href={m.href}>
                            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all group h-full flex flex-col relative overflow-hidden">
                                <div className={`${m.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner`}>
                                    {m.icon}
                                </div>
                                <h2 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">{m.title}</h2>
                                <p className="text-slate-500 text-sm leading-relaxed mb-10 flex-1 font-medium italic">
                                    {m.description}
                                </p>
                                <div className="flex items-center text-primary-600 font-black text-[10px] uppercase tracking-[0.2em] gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                    Ingresar ahora <ArrowRight size={14} strokeWidth={3} />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                <footer className="mt-20 pt-10 border-t border-slate-200 text-center">
                    <p className="text-slate-400 text-sm font-medium">
                        © 2026 NistalNomina • Diseñado para la excelencia empresarial en Guatemala.
                    </p>
                </footer>
            </div>
        </main>
    );
}
 
