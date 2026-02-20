"use client";

import { useState, useEffect } from 'react';
import Payslip from '@/components/Payslip';
import { calculatePayroll } from '@/lib/payroll-engine';
import { supabase, Employee } from '@/lib/supabase';
import { Printer, ArrowLeft, Mail, User, Users, RefreshCw, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { ChangeEvent } from 'react';

export default function PayslipPreviewPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [selectedEmpId, setSelectedEmpId] = useState<string>("");
    const [loadingEmps, setLoadingEmps] = useState(true);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [results, setResults] = useState<any>(null);

    // Batch state
    const [showAll, setShowAll] = useState(false);
    const [batchData, setBatchData] = useState<{ emp: Employee, res: any }[]>([]);

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        setLoadingEmps(true);
        const { data, error } = await supabase
            .from('employees')
            .select('*')
            .eq('status', 'Activo')
            .order('first_name');

        if (!error && data) setEmployees(data);
        setLoadingEmps(false);
    };

    const handleEmployeeSelect = async (id: string) => {
        setShowAll(false);
        if (!id) {
            setSelectedEmployee(null);
            setResults(null);
            setSelectedEmpId("");
            return;
        }

        setSelectedEmpId(id);
        const emp = employees.find(e => e.id === id);
        if (!emp) return;

        setLoadingDetails(true);
        setSelectedEmployee(emp);

        // Fetch variables
        const { data: entries, error } = await supabase
            .from('payroll_entries')
            .select('*')
            .eq('employee_id', id)
            .single();

        const varData = !error && entries ? entries : {};

        const res = calculatePayroll({
            baseSalary: emp.base_salary,
            overtimeHours: varData.overtime_hours || 0,
            commissions: varData.commissions || 0,
            bonuses: varData.other_bonuses || 0,
            loans: varData.loans_deduction || 0,
            advances: varData.advances_deduction || 0,
            absences: varData.absences || 0
        });

        setResults(res);
        setLoadingDetails(false);
    };

    const handleGenerateAll = async () => {
        setLoadingDetails(true);
        setSelectedEmpId("");
        setSelectedEmployee(null);
        setResults(null);

        // 1. Fetch all variables
        const { data: allEntries, error } = await supabase
            .from('payroll_entries')
            .select('*');

        const entries = allEntries || [];

        // 2. Calculate for all active employees
        const data = employees.map((emp: Employee) => {
            const varData = entries.find((e: any) => e.employee_id === emp.id) || {};
            const res = calculatePayroll({
                baseSalary: emp.base_salary,
                overtimeHours: varData.overtime_hours || 0,
                commissions: varData.commissions || 0,
                bonuses: varData.other_bonuses || 0,
                loans: varData.loans_deduction || 0,
                advances: varData.advances_deduction || 0,
                absences: varData.absences || 0
            });
            return { emp, res };
        });

        setBatchData(data);
        setShowAll(true);
        setLoadingDetails(false);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="bg-slate-100 min-h-screen">
            {/* Tool Bar */}
            <div className="bg-white border-b p-4 sticky top-0 z-50 shadow-sm print:hidden">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-6 w-full md:w-auto">
                        <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-primary-600 transition-colors font-bold text-sm group">
                            <ArrowLeft size={18} className="translate-x-0 group-hover:-translate-x-1 transition-transform" />
                            <span className="hidden md:inline">Volver al Dashboard</span>
                        </Link>

                        <div className="relative flex-1 md:w-64">
                            <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <select
                                className="w-full pl-10 pr-4 py-3 rounded-xl border-slate-200 bg-slate-50 font-bold text-sm focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer"
                                value={selectedEmpId}
                                onChange={(e: ChangeEvent<HTMLSelectElement>) => handleEmployeeSelect(e.target.value)}
                                disabled={loadingEmps}
                            >
                                <option value="">Seleccionar Colaborador...</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.first_name} {emp.last_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {loadingEmps && <RefreshCw size={20} className="animate-spin text-primary-500" />}
                    </div>

                    <div className="flex gap-3 w-full md:w-auto">
                        <button
                            onClick={handleGenerateAll}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 text-primary-600 bg-primary-50 px-4 py-3 rounded-xl border border-primary-100 hover:bg-primary-100 transition-all font-black text-xs uppercase tracking-widest disabled:opacity-50"
                            disabled={loadingEmps || employees.length === 0}
                        >
                            <Users size={16} />
                            Generar Todos
                        </button>
                        <button
                            onClick={handlePrint}
                            disabled={(!selectedEmployee && !showAll) || loadingDetails}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl hover:bg-primary-600 shadow-lg transition-all font-black text-xs uppercase tracking-widest disabled:opacity-50"
                        >
                            <Printer size={16} />
                            Imprimir PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* Preview area */}
            <div className="p-8 pb-20 print:p-0">
                <div className="max-w-fit mx-auto print:max-w-none">
                    {loadingDetails ? (
                        <div className="bg-white p-20 rounded-3xl shadow-xl flex flex-col items-center justify-center gap-4 min-w-[300px]">
                            <RefreshCw size={40} className="animate-spin text-primary-500" />
                            <p className="font-black text-slate-400 uppercase text-xs tracking-widest">Procesando Boletas...</p>
                        </div>
                    ) : showAll && batchData.length > 0 ? (
                        <div className="flex flex-col gap-8 print:gap-0">
                            {batchData.map(({ emp, res }: { emp: Employee, res: any }, idx: number) => (
                                <div key={emp.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500 print:break-after-page" style={{ animationDelay: `${idx * 50}ms` }}>
                                    <Payslip
                                        employee={emp}
                                        results={res}
                                        period={`${new Date().toLocaleString('es-GT', { month: 'long' })} ${new Date().getFullYear()}`}
                                        companyName="NistalNomina S.A."
                                    />
                                </div>
                            ))}
                        </div>
                    ) : selectedEmployee && results ? (
                        <div className="animate-in fade-in zoom-in duration-300">
                            <Payslip
                                employee={selectedEmployee}
                                results={results}
                                period={`${new Date().toLocaleString('es-GT', { month: 'long' })} ${new Date().getFullYear()}`}
                                companyName="NistalNomina S.A."
                            />
                        </div>
                    ) : (
                        <div className="bg-white/50 border-4 border-dashed border-slate-200 rounded-[3rem] p-24 text-center max-w-lg mx-auto">
                            <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                                <Printer size={32} className="text-slate-300" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-400 mb-2">Vista Previa Inactiva</h3>
                            <p className="text-slate-400 text-sm leading-relaxed font-medium">
                                Seleccione un empleado o presione <span className="text-primary-600 font-bold">Generar Todos</span> para visualizar las boletas de pago.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Legend for USER */}
            <div className="max-w-4xl mx-auto p-8 bg-slate-900 text-white rounded-[2rem] mt-4 mb-20 print:hidden flex flex-col md:flex-row gap-8 items-center shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Printer size={120} />
                </div>
                <div className="bg-primary-500 p-4 rounded-2xl flex-shrink-0 animate-bounce">
                    <AlertCircle size={32} />
                </div>
                <div className="relative">
                    <h4 className="text-xl font-black mb-2 tracking-tight">Consejo de Exportación Profesional</h4>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed">
                        Al presionar <span className="text-white font-bold">Imprimir PDF</span>, asegúrate de que el destino sea "Guardar como PDF" y que la opción <span className="text-white font-bold">"Gráficos de fondo"</span> esté activada en la configuración avanzada del navegador para preservar los colores y el diseño premium.
                    </p>
                </div>
            </div>
        </div>
    );
}
