"use client";

import { useState } from 'react';
import { Employee } from '@/lib/supabase';
import { calculatePayroll, PayrollResults } from '@/lib/payroll-engine';
import { Save, Calculator, AlertCircle } from 'lucide-react';

interface VariableEntry {
    employeeId: string;
    commissions: number;
    overtimeHours: number;
    bonuses: number;
}

interface VariableEntryTableProps {
    employees: Employee[];
    onSave: (data: VariableEntry[]) => void;
}

export default function VariableEntryTable({ employees, onSave }: VariableEntryTableProps) {
    const [entries, setEntries] = useState<Record<string, VariableEntry>>(
        Object.fromEntries(employees.map(emp => [
            emp.id || '',
            { employeeId: emp.id || '', commissions: 0, overtimeHours: 0, bonuses: 0 }
        ]))
    );

    const updateEntry = (id: string, field: keyof VariableEntry, value: number) => {
        setEntries(prev => ({
            ...prev,
            [id]: { ...prev[id], [field]: value }
        }));
    };

    const getResults = (emp: Employee): PayrollResults => {
        const entry = entries[emp.id || ''] || { commissions: 0, overtimeHours: 0, bonuses: 0 };
        return calculatePayroll({
            baseSalary: emp.base_salary,
            overtimeHours: entry.overtimeHours,
            commissions: entry.commissions,
            bonuses: entry.bonuses,
            loans: 0,
            advances: 0
        });
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Carga de Pagos Extras</h2>
                    <p className="text-sm text-slate-500">Ingrese comisiones y horas extras para la planilla actual.</p>
                </div>
                <button
                    onClick={() => onSave(Object.values(entries))}
                    className="flex items-center gap-2 bg-primary-600 text-white px-6 py-2.5 rounded-xl hover:bg-primary-700 transition-all font-bold shadow-lg shadow-primary-200"
                >
                    <Save size={18} />
                    Guardar Cambios
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-100/50 text-slate-600 uppercase text-[10px] font-black tracking-widest border-b">
                            <th className="px-6 py-4">Colaborador</th>
                            <th className="px-6 py-4">Sueldo Base</th>
                            <th className="px-6 py-4 w-40 text-primary-700">Comisiones (Q)</th>
                            <th className="px-6 py-4 w-40 text-primary-700">Horas Extras</th>
                            <th className="px-6 py-4 bg-slate-100/30">Total Líquido</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {employees.map((emp) => {
                            const results = getResults(emp);
                            const id = emp.id || '';
                            return (
                                <tr key={id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-5">
                                        <div className="font-bold text-slate-800">{emp.first_name} {emp.last_name}</div>
                                        <div className="text-[10px] text-slate-400 font-mono uppercase">{emp.position}</div>
                                    </td>
                                    <td className="px-6 py-5 text-sm font-medium text-slate-500">
                                        Q {emp.base_salary.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-5">
                                        <input
                                            type="number"
                                            value={entries[id]?.commissions || 0}
                                            onChange={(e) => updateEntry(id, 'commissions', parseFloat(e.target.value) || 0)}
                                            className="w-full bg-primary-50 border-primary-100 rounded-lg p-2 text-sm font-bold text-primary-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                        />
                                    </td>
                                    <td className="px-6 py-5">
                                        <input
                                            type="number"
                                            value={entries[id]?.overtimeHours || 0}
                                            onChange={(e) => updateEntry(id, 'overtimeHours', parseFloat(e.target.value) || 0)}
                                            className="w-full bg-primary-50 border-primary-100 rounded-lg p-2 text-sm font-bold text-primary-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                        />
                                    </td>
                                    <td className="px-6 py-5 bg-slate-50/30">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-400">Neto:</span>
                                            <span className="font-mono font-black text-slate-900 text-lg">
                                                Q {results.netSalary.toFixed(2)}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="p-4 bg-amber-50 border-t border-amber-100 flex gap-3 text-amber-800">
                <AlertCircle size={20} className="shrink-0 text-amber-500" />
                <p className="text-xs leading-relaxed italic">
                    <strong>Aviso:</strong> Los cambios realizados aquí impactarán directamente en el cálculo de la planilla del mes actual.
                    Asegúrese de guardar antes de salir de esta pantalla.
                </p>
            </div>
        </div>
    );
}
