"use client";

import Link from 'next/link';
import {
    Users,
    Calculator,
    FileText,
    FileSpreadsheet,
    Lock,
    LayoutDashboard,
    ArrowRight
} from 'lucide-react';

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

    return (
        <main className="min-h-screen bg-slate-50 p-8 md:p-16">
            <div className="max-w-6xl mx-auto">
                <header className="mb-16">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="bg-primary-900 p-3 rounded-2xl">
                            <span className="text-white font-black text-xl italic leading-none">N</span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">NistalNomina</h1>
                    </div>
                    <p className="text-xl text-slate-500 max-w-2xl">
                        Sistema inteligente de gestión de talento y planilla para el mercado guatemalteco.
                        Seguro, automatizado y siempre alineado a la ley.
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {modules.map((m, idx) => (
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
                </footer>
            </div>
        </main>
    );
}
