"use client";

import { useState, useEffect } from 'react';
import { Employee } from '@/lib/supabase';
import { calculatePayroll, PayrollResults } from '@/lib/payroll-engine';
import { Save, AlertCircle, MinusCircle } from 'lucide-react';

interface DiscountEntry {
    id?: string; // PK of payroll_entries
    employeeId: string;
    absences: number;
}

interface DiscountEntryTableProps {
    employees: Employee[];
    initialEntries?: any[];
    onSave: (data: DiscountEntry[]) => void;
    disabled?: boolean;
}

export default function DiscountEntryTable({ employees, onSave, initialEntries = [], disabled = false }: DiscountEntryTableProps) {
    const [entries, setEntries] = useState<Record<string, DiscountEntry>>({});

    useEffect(() => {
        setEntries(prev => {
            const next = { ...prev };
            employees.forEach(emp => {
                const id = emp.id || '';
                if (!next[id]) {
                    next[id] = { employeeId: id, absences: 0 };
                }
            });

            initialEntries.forEach(item => {
                const id = item.employee_id;
                if (next[id]) {
                    next[id] = {
                        ...next[id],
                        id: item.id,
                        absences: item.absences || 0
                    };
                }
            });
            return next;
        });
    }, [employees, initialEntries]);

    const updateEntry = (id: string, field: keyof DiscountEntry, value: number) => {
        setEntries(prev => ({
            ...prev,
            [id]: { ...prev[id], [field]: value }
        }));
    };

    const getResults = (emp: Employee): PayrollResults => {
        const entry = entries[emp.id || ''] || { absences: 0 };
        return calculatePayroll({
            baseSalary: emp.base_salary,
            overtimeHours: 0,
            commissions: 0,
            bonuses: 0,
            loans: 0,
            advances: 0,
            absences: entry.absences
        });
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Carga de Descuentos</h2>
                    <p className="text-sm text-slate-500">Registre faltas y otros descuentos para el periodo actual.</p>
                </div>
                {!disabled && (
                    <button
                        onClick={() => onSave(Object.values(entries))}
                        className="flex items-center gap-2 bg-rose-600 text-white px-6 py-2.5 rounded-xl hover:bg-rose-700 transition-all font-bold shadow-lg shadow-rose-200"
                    >
                        <Save size={18} />
                        Guardar Cambios
                    </button>
                )}
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-100/50 text-slate-600 uppercase text-[10px] font-black tracking-widest border-b">
                            <th className="px-6 py-4">Colaborador</th>
                            <th className="px-6 py-4">Sueldo Base</th>
                            <th className="px-6 py-4 w-40 text-rose-700">Días de Falta</th>
                            <th className="px-6 py-4 bg-slate-100/30 text-right">Deducción Est. (Q)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {employees.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-10 text-center text-slate-500 italic">
                                    No se encontraron colaboradores.
                                </td>
                            </tr>
                        ) : (
                            employees.map((emp) => {
                                const results = getResults(emp);
                                const id = emp.id || '';
                                const dailyRate = emp.base_salary / 30;
                                const deduction = dailyRate * (entries[id]?.absences || 0);

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
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="30"
                                                    step="0.5"
                                                    value={entries[id]?.absences || 0}
                                                    onChange={(e) => updateEntry(id, 'absences', parseFloat(e.target.value) || 0)}
                                                    disabled={disabled}
                                                    className={`w-full bg-rose-50 border-rose-100 rounded-lg p-2 text-sm font-bold text-rose-900 outline-none transition-all ${
                                                        disabled ? 'opacity-60 cursor-not-allowed' : 'focus:ring-2 focus:ring-rose-500 focus:border-transparent'
                                                    }`}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 bg-slate-50/30 text-right">
                                            <div className="flex flex-col">
                                                <span className="font-mono font-bold text-rose-600">
                                                    - Q {deduction.toFixed(2)}
                                                </span>
                                                <span className="text-[10px] text-slate-400">Neto Est: Q {results.netSalary.toFixed(2)}</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <div className="p-4 bg-rose-50 border-t border-rose-100 flex gap-3 text-rose-800">
                <AlertCircle size={20} className="shrink-0 text-rose-500" />
                <p className="text-xs leading-relaxed italic">
                    <strong>Importante:</strong> Los descuentos por falta afectan el Salario Devengado y proporcionalmente el cálculo del IGSS patronal y laboral.
                </p>
            </div>
        </div>
    );
}
