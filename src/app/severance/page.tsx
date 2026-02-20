"use client";

import { useState, useEffect } from 'react';
import { calculateSeverance } from '@/lib/payroll-engine';
import { supabase, Employee } from '@/lib/supabase';
import { Calculator, Calendar, TrendingUp, AlertCircle, User, RefreshCw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SeverancePage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loadingEmps, setLoadingEmps] = useState(true);
    const [selectedEmpId, setSelectedEmpId] = useState<string>("");

    const [data, setData] = useState({
        avgSalary: 5000,
        hiringDate: '2020-01-01',
        leavingDate: new Date().toISOString().split('T')[0],
        includesIndemnizacion: true
    });

    const [result, setResult] = useState<any>(null);

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        setLoadingEmps(true);
        const { data: emps, error } = await supabase
            .from('employees')
            .select('*')
            .order('first_name', { ascending: true });

        if (!error && emps) {
            setEmployees(emps);
        }
        setLoadingEmps(false);
    };

    const handleEmployeeSelect = (id: string) => {
        setSelectedEmpId(id);
        const emp = employees.find(e => e.id === id);
        if (emp) {
            setData({
                ...data,
                avgSalary: emp.base_salary,
                hiringDate: emp.hiring_date
            });
        }
    };

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
            <div className="max-w-6xl mx-auto">
                <header className="mb-10">
                    <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-primary-600 font-bold mb-4 transition-colors uppercase text-xs tracking-widest">
                        <ArrowLeft size={16} /> Volver al Dashboard
                    </Link>
                    <h1 className="text-4xl font-black text-slate-900 flex items-center gap-3">
                        <Calculator className="text-primary-600 w-10 h-10" /> Liquidaciones Legales
                    </h1>
                    <p className="text-slate-500 mt-2">Cálculo automatizado sincronizado con la base de datos de empleados.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Form */}
                    <div className="lg:col-span-5 bg-white p-8 rounded-3xl shadow-xl border border-slate-100 h-fit space-y-8">
                        <div>
                            <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                                <User className="text-primary-500 w-6 h-6" /> 1. Seleccionar Colaborador
                            </h2>
                            <div className="relative">
                                <select
                                    className="block w-full px-4 py-4 rounded-2xl border-slate-200 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 border bg-slate-50 font-bold text-slate-700 appearance-none cursor-pointer"
                                    value={selectedEmpId}
                                    onChange={(e) => handleEmployeeSelect(e.target.value)}
                                    disabled={loadingEmps}
                                >
                                    <option value="">-- Seleccionar Empleado --</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.first_name} {emp.last_name}
                                        </option>
                                    ))}
                                </select>
                                {loadingEmps && (
                                    <div className="absolute right-10 top-1/2 -translate-y-1/2">
                                        <RefreshCw size={20} className="animate-spin text-primary-500" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                                <Calendar className="text-primary-500 w-6 h-6" /> 2. Parámetros del Cálculo
                            </h2>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Salario de Referencia (Q)</label>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 font-bold">Q</span>
                                        <input
                                            type="number"
                                            value={data.avgSalary}
                                            onChange={(e) => setData({ ...data, avgSalary: parseFloat(e.target.value) || 0 })}
                                            className="block w-full pl-10 pr-4 py-4 rounded-2xl border-slate-200 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 border bg-slate-50 font-mono text-lg font-bold"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Fecha Ingreso</label>
                                        <input
                                            type="date"
                                            value={data.hiringDate}
                                            onChange={(e) => setData({ ...data, hiringDate: e.target.value })}
                                            className="block w-full px-4 py-4 rounded-2xl border-slate-200 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 border bg-slate-50 font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Fecha Salida</label>
                                        <input
                                            type="date"
                                            value={data.leavingDate}
                                            onChange={(e) => setData({ ...data, leavingDate: e.target.value })}
                                            className="block w-full px-4 py-4 rounded-2xl border-slate-200 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 border bg-slate-50 font-bold"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-5 bg-amber-50 rounded-2xl border border-amber-100 group cursor-pointer" onClick={() => setData({ ...data, includesIndemnizacion: !data.includesIndemnizacion })}>
                                    <input
                                        type="checkbox"
                                        checked={data.includesIndemnizacion}
                                        onChange={(e) => setData({ ...data, includesIndemnizacion: e.target.checked })}
                                        className="w-6 h-6 text-amber-600 rounded-lg border-amber-300 focus:ring-amber-500"
                                    />
                                    <label className="text-sm font-black text-amber-900 cursor-pointer select-none">
                                        ¿Incluir Indemnización?<br />
                                        <span className="text-xs font-medium text-amber-700 font-serif italic">Solo aplica en despido injustificado o retiro con causa.</span>
                                    </label>
                                </div>

                                <button
                                    onClick={handleCalculate}
                                    className="w-full bg-slate-900 hover:bg-primary-600 text-white font-black py-5 rounded-2xl shadow-2xl transition-all duration-300 flex items-center justify-center gap-3 text-lg"
                                >
                                    <TrendingUp size={24} />
                                    Calcular Liquidación
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Results */}
                    <div className="lg:col-span-7">
                        {result ? (
                            <div className="animate-in slide-in-from-right duration-500 space-y-8">
                                <div className="bg-primary-600 text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8">
                                        <Calculator size={80} className="opacity-10 rotate-12" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="w-3 h-3 bg-white rounded-full animate-pulse"></span>
                                            <p className="text-primary-100 uppercase tracking-[0.2em] text-[10px] font-black">Cálculo Vigente Final</p>
                                        </div>
                                        <h3 className="text-6xl font-black mb-6 tracking-tighter">
                                            Q {result.totalLiquidacion.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </h3>
                                        <div className="flex flex-wrap gap-6 text-sm">
                                            <div className="bg-white/10 px-4 py-2 rounded-full font-bold">
                                                🗓️ {result.yearsWorked} años laborados
                                            </div>
                                            <div className="bg-white/10 px-4 py-2 rounded-full font-bold">
                                                ⏱️ {result.daysWorked} días totales
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-10 overflow-hidden relative">
                                    <div className="absolute top-0 left-0 w-2 h-full bg-primary-600"></div>
                                    <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
                                        <FileText className="text-slate-400" size={24} />
                                        Detalle de Prestaciones Irrenunciables
                                    </h3>

                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center group p-4 hover:bg-slate-50 rounded-2xl transition-colors">
                                            <span className="text-slate-500 font-bold uppercase text-xs tracking-widest">Indemnización (Tiempo)</span>
                                            <span className="font-mono text-2xl font-black text-slate-900">Q {result.indemnizacion.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between items-center group p-4 hover:bg-slate-50 rounded-2xl transition-colors border-t border-slate-100">
                                            <span className="text-slate-500 font-bold uppercase text-xs tracking-widest">Aguinaldo Proporcional</span>
                                            <span className="font-mono text-2xl font-black text-slate-900 text-emerald-600">Q {result.aguinaldo.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between items-center group p-4 hover:bg-slate-50 rounded-2xl transition-colors border-t border-slate-100">
                                            <span className="text-slate-500 font-bold uppercase text-xs tracking-widest">Bono 14 Proporcional</span>
                                            <span className="font-mono text-2xl font-black text-slate-900 text-emerald-600">Q {result.bono14.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between items-center group p-4 hover:bg-slate-50 rounded-2xl transition-colors border-t border-slate-100">
                                            <span className="text-slate-500 font-bold uppercase text-xs tracking-widest">Vacaciones Proporcionales</span>
                                            <span className="font-mono text-2xl font-black text-slate-900 text-emerald-600">Q {result.vacaciones.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>

                                    <div className="mt-10 p-6 bg-slate-50 rounded-3xl border border-slate-200 flex gap-5 items-center">
                                        <div className="bg-white p-3 rounded-2xl shadow-sm">
                                            <AlertCircle className="text-amber-500 w-8 h-8" />
                                        </div>
                                        <p className="text-slate-500 text-xs font-serif leading-relaxed">
                                            <strong className="text-slate-700">Aviso Legal:</strong> Este informe es puramente orientativo. Los cálculos exactos deben validarse con los salarios reales reportados al Ministerio de Trabajo y las retenciones de ley pendientes a la fecha de egreso.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white border-4 border-dashed border-slate-100 rounded-[3rem] h-full min-h-[500px] flex flex-col items-center justify-center p-16 text-center shadow-inner">
                                <div className="bg-slate-50 p-10 rounded-full mb-8">
                                    <Calculator className="w-12 h-12 text-slate-300" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-300">Esperando Selección</h3>
                                <p className="text-slate-400 max-w-sm mt-4 text-sm leading-relaxed">
                                    Elija un colaborador del panel izquierdo o complete los datos manualmente para visualizar el cálculo detallado de sus beneficios laborales.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Missing Lucide Import for FileText
import { FileText } from "lucide-react";
