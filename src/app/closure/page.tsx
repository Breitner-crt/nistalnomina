"use client";

import { useState } from 'react';
import {
    FileText,
    CheckCircle,
    Lock,
    Download,
    PieChart,
    ArrowRight,
    TrendingDown,
    TrendingUp,
    Briefcase,
    ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

export default function MonthEndClosurePage() {
    const [isClosed, setIsClosed] = useState(false);

    // Simulated data for the current month
    const totals = {
        employees: 12,
        baseSalaries: 55000.00,
        incentiveBonuses: 3000.00,
        commissions: 4500.00,
        overtime: 1250.00,
        grossTotal: 63750.00,
        igssLaboral: 3079.13, // 4.83% of (55k + 4.5k + 1.25k)
        isrRetained: 2150.00,
        netPayable: 58520.87,
        igssPatronal: 6402.00, // 10.67%
        irtra: 600.00,
        intecap: 600.00
    };

    const accountingEntries = [
        { account: "Sueldos y Salarios", debit: 63750, credit: 0 },
        { account: "Bonificación Incentivo", debit: 3000, credit: 0 },
        { account: "Cuotas Patronales IGSS", debit: 7602, credit: 0 },
        { account: "IGSS por Pagar", credit: 9481.13, debit: 0 },
        { account: "ISR Retenido por Pagar", credit: 2150, debit: 0 },
        { account: "Bancos / Sueldos por Pagar", credit: 62720.87, debit: 0 },
    ];

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-6xl mx-auto">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <Link href="/" className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-bold mb-2 transition-colors group">
                            <ArrowLeft size={18} className="translate-x-0 group-hover:-translate-x-1 transition-transform" />
                            <span>Volver al Dashboard</span>
                        </Link>
                        <h1 className="text-3xl font-extrabold text-slate-900">Cierre de Mes: Febrero 2026</h1>
                        <p className="text-slate-500">Resumen operativo y contable de la planilla general.</p>
                    </div>

                    {!isClosed ? (
                        <button
                            onClick={() => setIsClosed(true)}
                            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all"
                        >
                            <Lock size={20} />
                            <span>Confirmar Cierre de Mes</span>
                        </button>
                    ) : (
                        <div className="bg-green-100 text-green-700 px-6 py-3 rounded-xl font-bold flex items-center gap-2 border border-green-200">
                            <CheckCircle size={20} />
                            <span>Cierre Confirmado</span>
                        </div>
                    )}
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Total Neto a Pagar</div>
                        <div className="text-3xl font-black text-primary-900">Q {totals.netPayable.toLocaleString()}</div>
                        <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                            <TrendingUp size={12} /> +2.4% vs mes anterior
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Obligaciones IGSS</div>
                        <div className="text-3xl font-black text-amber-600">Q {(totals.igssLaboral + totals.igssPatronal).toLocaleString()}</div>
                        <div className="text-xs text-slate-400 mt-2">Laboral + Patronal</div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Retenciones ISR</div>
                        <div className="text-3xl font-black text-rose-600">Q {totals.isrRetained.toLocaleString()}</div>
                        <div className="text-xs text-slate-400 mt-2">12 Colaboradores sujetos</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Accounting Table */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <PieChart size={18} className="text-primary-600" /> Asientos Contables Sugeridos
                            </h3>
                            <button className="text-primary-600 text-xs font-bold flex items-center gap-1 hover:underline">
                                <Download size={14} /> Exportar Excel
                            </button>
                        </div>
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-slate-500 font-medium">
                                <tr>
                                    <th className="px-6 py-3 text-left">Cuenta</th>
                                    <th className="px-6 py-3 text-right">Debe</th>
                                    <th className="px-6 py-3 text-right">Haber</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {accountingEntries.map((entry, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-medium">{entry.account}</td>
                                        <td className="px-6 py-4 text-right text-slate-900 font-mono italic">
                                            {entry.debit > 0 ? `Q ${entry.debit.toLocaleString()}` : "-"}
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-900 font-mono italic">
                                            {entry.credit > 0 ? `Q ${entry.credit.toLocaleString()}` : "-"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Reporting & Logs */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <FileText size={18} className="text-primary-600" /> Reportes Generados
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer group">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-green-100 text-green-600 p-2 rounded-lg"><Download size={18} /></div>
                                        <div>
                                            <div className="text-sm font-bold">Planilla General de Salarios</div>
                                            <div className="text-xs text-slate-400">Excel (XLSX) • 12 KB</div>
                                        </div>
                                    </div>
                                    <ArrowRight size={16} className="text-slate-300 group-hover:text-primary-500 translate-x-[-4px] group-hover:translate-x-0 transition-all" />
                                </div>

                                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer group">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-rose-100 text-rose-600 p-2 rounded-lg"><Download size={18} /></div>
                                        <div>
                                            <div className="text-sm font-bold">Resumen de ISR Retenido</div>
                                            <div className="text-xs text-slate-400">PDF • 1.2 MB</div>
                                        </div>
                                    </div>
                                    <ArrowRight size={16} className="text-slate-300 group-hover:text-primary-500 translate-x-[-4px] group-hover:translate-x-0 transition-all" />
                                </div>

                                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer group">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-100 text-blue-600 p-2 rounded-lg"><Download size={18} /></div>
                                        <div>
                                            <div className="text-sm font-bold">Resumen Cuotas Patronales</div>
                                            <div className="text-xs text-slate-400">Excel (XLSX) • 8 KB</div>
                                        </div>
                                    </div>
                                    <ArrowRight size={16} className="text-slate-300 group-hover:text-primary-500 translate-x-[-4px] group-hover:translate-x-0 transition-all" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-primary-50 p-6 rounded-2xl border border-primary-100">
                            <h3 className="font-bold text-primary-900 mb-2 flex items-center gap-2">
                                <Briefcase size={18} /> Nota para Contabilidad
                            </h3>
                            <p className="text-sm text-primary-800 italic">
                                "Este cierre bloquea automáticamente toda edición de salarios o DPIs para el periodo actual.
                                Asegúrese de haber revisado todas las horas extras y comisiones antes de confirmar."
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
