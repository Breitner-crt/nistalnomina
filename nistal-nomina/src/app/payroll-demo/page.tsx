"use client";

import { useState } from "react";
import { calculatePayroll, PayrollInput, PayrollResults } from "@/lib/payroll-engine";

export default function PayrollDemoPage() {
    const [input, setInput] = useState<PayrollInput>({
        baseSalary: 3500,
        overtimeHours: 0,
        commissions: 0,
        bonuses: 0,
        loans: 0,
        advances: 0,
    });

    const [results, setResults] = useState<PayrollResults | null>(null);

    const handleCalculate = () => {
        const res = calculatePayroll(input);
        setResults(res);
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-primary-900 mb-6">Demo Cálculo de Planilla (Guatemala)</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-lg shadow border border-slate-200">
                    <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-slate-700">Entradas</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Salario Base (Q)</label>
                            <input
                                type="number"
                                value={input.baseSalary}
                                onChange={(e) => setInput({ ...input, baseSalary: parseFloat(e.target.value) || 0 })}
                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700">Horas Extras</label>
                            <input
                                type="number"
                                value={input.overtimeHours}
                                onChange={(e) => setInput({ ...input, overtimeHours: parseFloat(e.target.value) || 0 })}
                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Comisiones (Q)</label>
                                <input
                                    type="number"
                                    value={input.commissions}
                                    onChange={(e) => setInput({ ...input, commissions: parseFloat(e.target.value) || 0 })}
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Bonos Extra (Q)</label>
                                <input
                                    type="number"
                                    value={input.bonuses}
                                    onChange={(e) => setInput({ ...input, bonuses: parseFloat(e.target.value) || 0 })}
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleCalculate}
                            className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 transition-colors font-semibold mt-4"
                        >
                            Calcular
                        </button>
                    </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-lg shadow border border-slate-200">
                    <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-slate-700">Resultados</h2>

                    {results ? (
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span>Base + Letras + Com:</span>
                                <span className="font-mono">Q {(results.baseSalaryEarned + results.overtimePay + results.commissions + results.otherBonuses).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-green-700">
                                <span>Bonif. Incentivo:</span>
                                <span className="font-mono">Q {results.bonificacionIncentivo.toFixed(2)}</span>
                            </div>
                            <div className="border-t pt-2 mt-2">
                                <div className="flex justify-between text-red-600">
                                    <span>IGSS Laboral (4.83%):</span>
                                    <span className="font-mono">- Q {results.igssLaboral.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-red-600">
                                    <span>ISR Retenid (Estim.):</span>
                                    <span className="font-mono">- Q {results.isrRetencion.toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="border-t pt-4 mt-4 flex justify-between text-xl font-bold text-primary-900">
                                <span>Total Líquido:</span>
                                <span className="font-mono">Q {results.netSalary.toFixed(2)}</span>
                            </div>

                            <div className="mt-8 pt-4 border-t border-slate-300">
                                <h3 className="text-sm font-bold text-slate-500 uppercase">Cargas Patronales</h3>
                                <div className="flex justify-between text-sm mt-2">
                                    <span>IGSS (10.67%):</span>
                                    <span className="font-mono">Q {results.igssPatronal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>IRTRA (1%):</span>
                                    <span className="font-mono">Q {results.irtra.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>INTECAP (1%):</span>
                                    <span className="font-mono">Q {results.intecap.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-slate-500 italic">Ingrese datos y presione calcular</p>
                    )}
                </div>
            </div>
        </div>
    );
}
