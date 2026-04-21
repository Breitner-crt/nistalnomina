"use client";

import { useState, useEffect, useCallback } from 'react';
import {
    Lock,
    Loader2,
    ArrowLeft,
    Building2,
    Users,
    AlertTriangle,
    CheckCircle2,
    FileLock2,
    TrendingDown,
    TrendingUp,
    Calendar,
    ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { calculatePayroll } from '@/lib/payroll-engine';

interface EmployeeSummary {
    id: string;
    name: string;
    position: string;
    baseSalary: number;
    absences: number;
    commissions: number;
    overtimeHours: number;
    bonificacion: number;
    gross: number;
    igssLaboral: number;
    net: number;
}

export default function ClosurePage() {
    const { company, activePeriod, setActivePeriod } = useAuth();
    const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [closing, setClosing] = useState(false);
    const [confirmStep, setConfirmStep] = useState(false);

    const fetchPayrollSummary = useCallback(async () => {
        if (!company || !activePeriod) return;
        setLoading(true);
        try {
            // 1. Get active employees
            const { data: empData } = await supabase
                .from('employees')
                .select('*')
                .eq('company_id', company.id)
                .eq('status', 'Activo');

            // 2. Get payroll entries for the active period
            const { data: entries } = await supabase
                .from('payroll_entries')
                .select('*')
                .in('employee_id', (empData || []).map((e: any) => e.id))
                .eq('payroll_period_id', activePeriod.id);

            // 3. Build summary per employee
            const summary: EmployeeSummary[] = (empData || []).map((emp: any) => {
                const entry = (entries || []).find((e: any) => e.employee_id === emp.id) || {};
                const absences = Number(entry.absences || 0);
                const commissions = Number(entry.commissions || 0);
                const overtimeHours = Number(entry.overtime_hours || 0);
                const bonificacion = Number(entry.bonificacion_incentivo || 250);

                const result = calculatePayroll({
                    baseSalary: emp.base_salary,
                    overtimeHours,
                    commissions,
                    bonuses: bonificacion,
                    loans: 0,
                    advances: 0,
                    absences
                });

                return {
                    id: emp.id,
                    name: `${emp.first_name} ${emp.last_name}`,
                    position: emp.position,
                    baseSalary: emp.base_salary,
                    absences,
                    commissions,
                    overtimeHours,
                    bonificacion,
                    gross: result.grossSalary,
                    igssLaboral: result.igssLaboral,
                    net: result.netSalary
                };
            });

            setEmployees(summary);
        } catch (err) {
            console.error('Error building payroll summary:', err);
        } finally {
            setLoading(false);
        }
    }, [company, activePeriod]);

    useEffect(() => {
        fetchPayrollSummary();
    }, [fetchPayrollSummary]);

    const handleClosePeriod = async () => {
        if (!activePeriod) return;
        setClosing(true);
        try {
            const { data, error } = await supabase
                .from('payroll_periods')
                .update({ status: 'closed' })
                .eq('id', activePeriod.id)
                .select()
                .single();

            if (error) throw error;

            // Update the global activePeriod context
            setActivePeriod(data);
            setConfirmStep(false);
            alert(`✅ Período "${activePeriod.name}" cerrado exitosamente. Los datos quedan sellados y en modo solo lectura.`);
        } catch (err: any) {
            alert('Error al cerrar el período: ' + err.message);
        } finally {
            setClosing(false);
        }
    };

    // Totals
    const totalNet = employees.reduce((s, e) => s + e.net, 0);
    const totalGross = employees.reduce((s, e) => s + e.gross, 0);
    const totalIGSSLaboral = employees.reduce((s, e) => s + e.igssLaboral, 0);
    const totalIGSSPatronal = totalGross * 0.1067;
    const isClosed = activePeriod?.status === 'closed';

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <header className="mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-primary-600 font-bold mb-4 transition-colors text-sm uppercase tracking-widest">
                        <ArrowLeft size={16} /> Volver al Dashboard
                    </Link>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 flex items-center gap-3">
                                <FileLock2 className="text-amber-600 w-10 h-10" /> Cierre de Período
                            </h1>
                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                                <div className="flex items-center gap-2 text-slate-500 font-medium">
                                    <Building2 size={16} className="text-primary-600" />
                                    <span>{company?.name || '—'}</span>
                                </div>
                                {activePeriod && (
                                    <div className="flex items-center gap-2 text-slate-500 font-medium">
                                        <Calendar size={16} className="text-amber-600" />
                                        <span className="font-bold text-slate-700">{activePeriod.name}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                            isClosed ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-green-100 text-green-700 border border-green-200'
                                        }`}>
                                            {isClosed ? '🔒 Cerrado' : '🟢 Abierto'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Close Button */}
                        {!isClosed ? (
                            !confirmStep ? (
                                <button
                                    onClick={() => setConfirmStep(true)}
                                    disabled={employees.length === 0 || loading}
                                    className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-amber-200 transition-all hover:scale-[1.02] active:scale-95"
                                >
                                    <Lock size={20} /> Cerrar Período Definitivamente
                                </button>
                            ) : (
                                <div className="flex items-center gap-3 bg-red-50 border-2 border-red-200 rounded-2xl p-4">
                                    <AlertTriangle className="text-red-500 shrink-0" size={24} />
                                    <div>
                                        <p className="text-red-800 font-black text-sm">¿Confirmar cierre definitivo?</p>
                                        <p className="text-red-600 text-xs">Esta acción es irreversible.</p>
                                    </div>
                                    <div className="flex gap-2 ml-2">
                                        <button onClick={() => setConfirmStep(false)} className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100 text-sm">
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleClosePeriod}
                                            disabled={closing}
                                            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 text-sm disabled:opacity-50"
                                        >
                                            {closing ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                                            Sí, Cerrar
                                        </button>
                                    </div>
                                </div>
                            )
                        ) : (
                            <div className="flex items-center gap-3 bg-amber-50 border-2 border-amber-200 rounded-2xl px-6 py-4">
                                <ShieldCheck className="text-amber-600" size={24} />
                                <div>
                                    <p className="text-amber-800 font-black">Período Cerrado</p>
                                    <p className="text-amber-600 text-xs">Solo lectura</p>
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-slate-200">
                        <Loader2 className="animate-spin text-amber-500 mb-4" size={48} />
                        <p className="text-slate-500 font-medium">Calculando planilla de {activePeriod?.name}...</p>
                    </div>
                ) : employees.length === 0 ? (
                    <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-slate-200">
                        <Users size={48} className="text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 font-bold text-lg">No hay empleados activos en este período</p>
                        <p className="text-slate-400 text-sm mt-2">Registra empleados en la sección de Control de Empleados.</p>
                        <Link href="/employees" className="inline-block mt-6 text-primary-600 font-bold hover:underline">
                            Ir a Empleados →
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Colaboradores</div>
                                <div className="text-4xl font-black text-slate-900">{employees.length}</div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Bruto Total</div>
                                <div className="text-2xl font-black text-slate-700">Q {totalGross.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</div>
                                <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                                    <TrendingUp size={12} /> Salarios + Extras
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">IGSS Total</div>
                                <div className="text-2xl font-black text-amber-600">
                                    Q {(totalIGSSLaboral + totalIGSSPatronal).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                                    <TrendingDown size={12} /> Laboral + Patronal
                                </div>
                            </div>
                            <div className="bg-primary-900 p-6 rounded-2xl shadow-xl">
                                <div className="text-primary-300 text-[10px] font-black uppercase tracking-widest mb-1">Neto a Pagar</div>
                                <div className="text-2xl font-black text-white">
                                    Q {totalNet.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-primary-400 mt-1">
                                    <CheckCircle2 size={12} /> Líquido total
                                </div>
                            </div>
                        </div>

                        {/* Payroll Table */}
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b bg-slate-50">
                                <h2 className="text-xl font-black text-slate-800">Detalle de Planilla — {activePeriod?.name}</h2>
                                <p className="text-slate-400 text-sm mt-1">Resumen calculado por colaborador basado en novedades del período.</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-slate-100/60 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b">
                                            <th className="px-5 py-4">Colaborador</th>
                                            <th className="px-5 py-4 text-right">Sueldo Base</th>
                                            <th className="px-5 py-4 text-right text-primary-600">Comisiones / Extras</th>
                                            <th className="px-5 py-4 text-right text-rose-600">Faltas</th>
                                            <th className="px-5 py-4 text-right">Bruto</th>
                                            <th className="px-5 py-4 text-right text-amber-600">IGSS Laboral</th>
                                            <th className="px-5 py-4 text-right text-slate-900 bg-slate-100">Neto a Pagar</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {employees.map((emp) => (
                                            <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                                                <td className="px-5 py-4">
                                                    <div className="font-bold text-slate-800">{emp.name}</div>
                                                    <div className="text-[10px] text-slate-400 font-mono uppercase">{emp.position}</div>
                                                </td>
                                                <td className="px-5 py-4 text-right font-mono text-slate-600">
                                                    Q {emp.baseSalary.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-5 py-4 text-right font-mono text-primary-700">
                                                    {(emp.commissions + emp.overtimeHours) > 0 
                                                        ? `+Q ${(emp.commissions).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`
                                                        : <span className="text-slate-300">—</span>
                                                    }
                                                </td>
                                                <td className="px-5 py-4 text-right font-mono text-rose-600">
                                                    {emp.absences > 0 
                                                        ? `${emp.absences} día${emp.absences !== 1 ? 's' : ''}`
                                                        : <span className="text-slate-300">—</span>
                                                    }
                                                </td>
                                                <td className="px-5 py-4 text-right font-mono text-slate-700">
                                                    Q {emp.gross.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-5 py-4 text-right font-mono text-amber-600">
                                                    -Q {emp.igssLaboral.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-5 py-4 text-right bg-slate-50">
                                                    <span className="font-black text-slate-900 font-mono text-base">
                                                        Q {emp.net.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-primary-900 text-white">
                                            <td className="px-5 py-4 font-black uppercase tracking-widest text-xs">
                                                TOTALES ({employees.length} colaboradores)
                                            </td>
                                            <td className="px-5 py-4 text-right font-mono font-bold">
                                                Q {employees.reduce((s,e) => s + e.baseSalary, 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-5 py-4 text-right font-mono font-bold text-primary-200">
                                                +Q {employees.reduce((s,e) => s + e.commissions, 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-5 py-4 text-right font-mono font-bold text-rose-300">
                                                {employees.reduce((s, e) => s + e.absences, 0)} días
                                            </td>
                                            <td className="px-5 py-4 text-right font-mono font-bold">
                                                Q {totalGross.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-5 py-4 text-right font-mono font-bold text-amber-300">
                                                -Q {totalIGSSLaboral.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-5 py-4 text-right font-mono font-black text-xl">
                                                Q {totalNet.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>

                        {/* IGSS Detail */}
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                                <p className="text-amber-700 text-[10px] font-black uppercase tracking-widest">IGSS Laboral (4.83%)</p>
                                <p className="text-2xl font-black text-amber-800 mt-1">
                                    Q {totalIGSSLaboral.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-amber-600 text-xs mt-1">Descontado del colaborador</p>
                            </div>
                            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
                                <p className="text-orange-700 text-[10px] font-black uppercase tracking-widest">IGSS Patronal (10.67%)</p>
                                <p className="text-2xl font-black text-orange-800 mt-1">
                                    Q {totalIGSSPatronal.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-orange-600 text-xs mt-1">Cargo directo a la empresa</p>
                            </div>
                            <div className="bg-slate-900 rounded-2xl p-5">
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Costo Total Empresa</p>
                                <p className="text-2xl font-black text-white mt-1">
                                    Q {(totalGross + totalIGSSPatronal).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-slate-400 text-xs mt-1">Bruto + cuota patronal IGSS</p>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
