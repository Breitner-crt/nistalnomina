"use client";

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

    // Añadir Panel Global si es superadmin
    const finalModules = [...modules];
    if (profile?.role === 'superadmin') {
        finalModules.unshift({
            title: "Panel Global",
            description: "Gestión maestra de empresas y accesos de patronos.",
            href: "/superadmin",
            icon: <Lock className="text-red-600" />,
            color: "bg-red-50"
        });
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="animate-spin text-primary-600" size={48} />
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 p-8 md:p-16">
            <div className="max-w-6xl mx-auto">
                <header className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="bg-primary-900 p-3 rounded-2xl">
                                <span className="text-white font-black text-xl italic leading-none">N</span>
                            </div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">NistalNomina </h1>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 font-medium bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm w-fit">
                            <Building2 size={18} className="text-primary-600" />
                            <span>{company?.name || 'Cargando compañía...'}</span>
                        </div>
                    </div>
                    <button
                        onClick={signOut}
                        className="flex items-center gap-2 text-slate-500 hover:text-rose-600 font-bold transition-colors bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm group hover:border-rose-100 hover:bg-rose-50"
                    >
                        <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                        Cerrar Sesión
                    </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {finalModules.map((m, idx) => (
                        <Link key={idx} href={m.href}>
                            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all group h-full flex flex-col">
                                <div className={`${m.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                    {m.icon}
                                </div>
                                <h2 className="text-xl font-bold text-slate-800 mb-3">{m.title}</h2>
                                <p className="text-slate-500 text-sm leading-relaxed mb-8 flex-1">
                                    {m.description}
                                </p>
                                <div className="flex items-center text-primary-600 font-bold text-xs uppercase tracking-widest gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    Entrar al Módulo <ArrowRight size={14} />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                <footer className="mt-20 pt-10 border-t border-slate-200 text-center">
                    <p className="text-slate-400 text-sm font-medium">
                        © 2026 NistalNomina • Diseñado para la excelencia empresarial en Guatemala.
                    </p>

                    {/* Bloque de Diagnóstico - Re-activado */}
                    <div className="mt-6 p-4 bg-slate-800 rounded-xl border border-slate-700 inline-block text-left shadow-2xl">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Diagnóstico de Acceso</p>
                        <p className="text-xs text-white font-mono">UID: {profile?.id || 'No Profile'}</p>
                        <p className="text-xs text-white font-mono">ROLE: {profile?.role || 'No Role'}</p>
                    </div>
                </footer>
            </div>
        </main>
    );
}
