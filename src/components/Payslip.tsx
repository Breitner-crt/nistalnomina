"use client";

import { PayrollResults } from "@/lib/payroll-engine";
import { Employee } from "@/lib/supabase";

interface PayslipProps {
    employee: Employee;
    results: PayrollResults;
    period: string; // e.g. "Febrero 2026"
    companyName: string;
}

export default function Payslip({ employee, results, period, companyName }: PayslipProps) {
    return (
        <div className="bg-white p-12 max-w-4xl mx-auto border shadow-sm print:shadow-none print:border-none print:p-0 font-sans text-slate-900">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-primary-600 pb-6 mb-8">
                <div>
                    <h1 className="text-2xl font-black text-primary-900 uppercase tracking-tight">{companyName}</h1>
                    <p className="text-sm text-slate-500 font-semibold">RECIBO DE PAGO DE SALARIOS</p>
                </div>
                <div className="text-right">
                    <div className="bg-slate-100 px-4 py-2 rounded-lg inline-block border border-slate-200">
                        <span className="text-xs font-bold text-slate-500 block uppercase">Periodo</span>
                        <span className="text-lg font-black text-slate-800">{period}</span>
                    </div>
                </div>
            </div>

            {/* Employee Data */}
            <div className="grid grid-cols-2 gap-8 mb-10 bg-slate-50 p-6 rounded-xl border border-slate-100">
                <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Colaborador</p>
                    <p className="text-lg font-bold text-slate-800">{employee.first_name} {employee.last_name}</p>
                    <p className="text-xs text-slate-600 italic">DPI: {employee.dpi}</p>
                    <p className="text-xs text-slate-600">NIT: {employee.nit || 'C/F'}</p>
                </div>
                <div className="space-y-1 text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Puesto / Depto</p>
                    <p className="text-md font-semibold text-slate-700">{employee.position || 'N/A'}</p>
                    <p className="text-xs text-slate-500">Fecha Ingreso: {employee.hiring_date}</p>
                    <p className="text-xs text-slate-500">No. IGSS: {employee.igss_number || 'N/A'}</p>
                </div>
            </div>

            {/* Financial Table */}
            <div className="grid grid-cols-2 gap-12 mb-12">
                {/* Earnings */}
                <div>
                    <h3 className="text-xs font-black text-primary-700 uppercase tracking-widest border-b pb-2 mb-4">Ingresos (Devengado)</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Salario Ordinario</span>
                            <span className="font-mono font-bold text-slate-800">Q {results.baseSalaryEarned.toFixed(2)}</span>
                        </div>
                        {results.overtimePay > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Horas Extras</span>
                                <span className="font-mono font-bold text-slate-800">Q {results.overtimePay.toFixed(2)}</span>
                            </div>
                        )}
                        {results.commissions > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Comisiones</span>
                                <span className="font-mono font-bold text-slate-800">Q {results.commissions.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm text-green-700 font-semibold">
                            <span>Bonificación Incentivo (D.L. 37-2001)</span>
                            <span className="font-mono">Q {results.bonificacionIncentivo.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Deductions */}
                <div>
                    <h3 className="text-xs font-black text-rose-700 uppercase tracking-widest border-b pb-2 mb-4">Descuentos y Deducciones</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Cuota Laboral IGSS (4.83%)</span>
                            <span className="font-mono font-bold text-rose-600">- Q {results.igssLaboral.toFixed(2)}</span>
                        </div>
                        {results.isrRetencion > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Retención ISR</span>
                                <span className="font-mono font-bold text-rose-600">- Q {results.isrRetencion.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Préstamos / Anticipos</span>
                            <span className="font-mono font-bold text-rose-600">- Q {(results.totalDeductions - results.igssLaboral - results.isrRetencion).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Totals Section */}
            <div className="bg-primary-900 flex text-white rounded-xl overflow-hidden mb-12">
                <div className="flex-1 p-6 border-r border-white/10">
                    <p className="text-[10px] font-bold uppercase text-primary-300">Total Devengado</p>
                    <p className="text-2xl font-bold">Q {results.grossSalary.toFixed(2)}</p>
                </div>
                <div className="flex-1 p-6 border-r border-white/10 bg-rose-950/20">
                    <p className="text-[10px] font-bold uppercase text-rose-300">Total Descuentos</p>
                    <p className="text-2xl font-bold">Q {results.totalDeductions.toFixed(2)}</p>
                </div>
                <div className="flex-[1.5] p-6 bg-primary-600">
                    <p className="text-[10px] font-bold uppercase text-white/70">Liquido a Recibir</p>
                    <p className="text-4xl font-black italic">Q {results.netSalary.toFixed(2)}</p>
                </div>
            </div>

            {/* Footer / Signature */}
            <div className="mt-16 text-[10px] text-slate-400 text-center uppercase tracking-tight leading-loose">
                <p>Certifico que he recibido de {companyName} la suma arriba indicada en concepto de salarios y prestaciones del periodo mencionado.</p>
                <div className="flex justify-center gap-24 mt-12 pb-4">
                    <div className="w-48 border-t-2 border-slate-300 pt-2 font-bold">Firma del Colaborador</div>
                    <div className="w-48 border-t-2 border-slate-300 pt-2 font-bold">Sello y Firma Patrono</div>
                </div>
            </div>
        </div>
    );
}
