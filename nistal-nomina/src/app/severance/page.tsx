"use client";

import { useState } from 'react';
import { calculateSeverance } from '@/lib/payroll-engine';
import { Calculator, Calendar, TrendingUp, AlertCircle } from 'lucide-react';

export default function SeverancePage() {
    const [data, setData] = useState({
        avgSalary: 5000,
        hiringDate: '2020-01-01',
        leavingDate: new Date().toISOString().split('T')[0],
        includesIndemnizacion: true
    });

    const [result, setResult] = useState<any>(null);

    const handleCalculate = () => {
        const res = calculateSeverance(
            data.avgSalary,
            new Date(data.hiringDate),
            new Date(data.leavingDate),
            data.includesIndemnizacion
        );
        setResult(res);
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-5xl mx-auto">
                <header className="mb-10 text-center">
                    <h1 className="text-4xl font-extrabold text-slate-900 flex items-center justify-center gap-3">
                        <Calculator className="text-primary-600 w-10 h-10" /> Calculadora de Liquidación
                    </h1>
                    <p className="text-slate-500 mt-2">Cálculos automáticos conforme al Código de Trabajo de Guatemala</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Form */}
                    <div className="lg:col-span-5 bg-white p-6 rounded-2xl shadow-xl border border-slate-200 h-fit">
                        <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Calendar className="text-primary-500 w-5 h-5" /> Datos del Vínculo Laboral
                        </h2>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Salario Promedio (Últimos 6 meses)</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">Q</span>
                                    <input
                                        type="number"
                                        value={data.avgSalary}
                                        onChange={(e) => setData({ ...data, avgSalary: parseFloat(e.target.value) || 0 })}
                                        className="block w-full pl-8 pr-4 py-3 rounded-xl border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent border bg-slate-50"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Fecha de Ingreso</label>
                                    <input
                                        type="date"
                                        value={data.hiringDate}
                                        onChange={(e) => setData({ ...data, hiringDate: e.target.value })}
                                        className="block w-full px-4 py-3 rounded-xl border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent border bg-slate-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Fecha de Salida</label>
                                    <input
                                        type="date"
                                        value={data.leavingDate}
                                        onChange={(e) => setData({ ...data, leavingDate: e.target.value })}
                                        className="block w-full px-4 py-3 rounded-xl border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent border bg-slate-50"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-primary-50 rounded-xl border border-primary-100">
                                <input
                                    type="checkbox"
                                    id="indem"
                                    checked={data.includesIndemnizacion}
                                    onChange={(e) => setData({ ...data, includesIndemnizacion: e.target.checked })}
                                    className="w-5 h-5 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
                                />
                                <label htmlFor="indem" className="text-sm font-medium text-primary-900 cursor-pointer">
                                    ¿Incluir Indemnización? (Despido Injustificado)
                                </label>
                            </div>

                            <button
                                onClick={handleCalculate}
                                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary-200 transition-all flex items-center justify-center gap-2"
                            >
                                Generar Cálculo
                            </button>
                        </div>
                    </div>

                    {/* Results */}
                    <div className="lg:col-span-7">
                        {result ? (
                            <div className="animate-in fade-in zoom-in duration-300 space-y-6">
                                <div className="bg-primary-900 text-white p-8 rounded-2xl shadow-2xl relative overflow-hidden">
                                    <TrendingUp className="absolute top-[-20px] right-[-20px] w-48 h-48 text-white opacity-10 rotate-12" />
                                    <div className="relative z-10">
                                        <p className="text-primary-200 uppercase tracking-widest text-xs font-bold mb-1">Total a Pagar (Estimado)</p>
                                        <h3 className="text-5xl font-black mb-4">
                                            Q {result.totalLiquidacion.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </h3>
                                        <div className="flex gap-4 text-sm text-primary-200 font-medium">
                                            <span>• {result.yearsWorked} años laborados</span>
                                            <span>• {result.daysWorked} días en total</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
                                    <h3 className="text-xl font-bold text-slate-800 mb-6 pb-2 border-b">Desglose de Prestaciones</h3>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center group">
                                            <span className="text-slate-600 group-hover:text-slate-900 transition-colors">Indemnización:</span>
                                            <span className="font-mono text-lg font-bold text-slate-800">Q {result.indemnizacion.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between items-center group">
                                            <span className="text-slate-600 group-hover:text-slate-900 transition-colors">Aguinaldo Proporcional:</span>
                                            <span className="font-mono text-lg font-bold text-slate-800">Q {result.aguinaldo.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between items-center group">
                                            <span className="text-slate-600 group-hover:text-slate-900 transition-colors">Bono 14 Proporcional:</span>
                                            <span className="font-mono text-lg font-bold text-slate-800">Q {result.bono14.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between items-center group">
                                            <span className="text-slate-600 group-hover:text-slate-900 transition-colors">Vacaciones Proporcionales:</span>
                                            <span className="font-mono text-lg font-bold text-slate-800">Q {result.vacaciones.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>

                                    <div className="mt-8 p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-4 items-start">
                                        <AlertCircle className="text-amber-500 w-6 h-6 flex-shrink-0" />
                                        <p className="text-amber-800 text-sm italic">
                                            Este cálculo es una estimación basada en los parámetros legales vigentes.
                                            Para una liquidación definitiva, consulte con su departamento de contabilidad o el Ministerio de Trabajo.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl h-full min-h-[400px] flex flex-col items-center justify-center p-12 text-center opacity-60">
                                <Calculator className="w-16 h-16 text-slate-300 mb-4" />
                                <h3 className="text-xl font-bold text-slate-400">Listo para Calcular</h3>
                                <p className="text-slate-400 max-w-xs mt-2">Complete la información a la izquierda y presione el botón para ver el desglose legal.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
