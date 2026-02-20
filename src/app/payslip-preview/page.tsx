"use client";

import { useState, useEffect } from 'react';
import Payslip from '@/components/Payslip';
import { calculatePayroll } from '@/lib/payroll-engine';
import { supabase, Employee } from '@/lib/supabase';
import { Printer, ArrowLeft, Mail, User, RefreshCw, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function PayslipPreviewPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [selectedEmpId, setSelectedEmpId] = useState<string>("");
    const [loadingEmps, setLoadingEmps] = useState(true);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [results, setResults] = useState<any>(null);

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
            advances: varData.advances_deduction || 0
        });

        setResults(res);
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
                        <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-primary-600 transition-colors">
                            <ArrowLeft size={18} />
                        </Link>

                        <div className="relative flex-1 md:w-64">
                            <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <select
                                className="w-full pl-10 pr-4 py-3 rounded-xl border-slate-200 bg-slate-50 font-bold text-sm focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer"
                                value={selectedEmpId}
                                onChange={(e) => handleEmployeeSelect(e.target.value)}
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
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 text-slate-600 bg-white px-4 py-3 rounded-xl border hover:bg-slate-50 transition-all font-black text-xs uppercase tracking-widest disabled:opacity-50"
                            disabled={!selectedEmployee}
                        >
                            <Mail size={16} />
                            Enviar
                        </button>
                        <button
                            onClick={handlePrint}
                            disabled={!selectedEmployee || loadingDetails}
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
                            <p className="font-black text-slate-400 uppercase text-xs tracking-widest">Calculando Boleta...</p>
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
                                Seleccione un empleado en la barra superior para generar su boleta de pago con los cálculos legales automáticos.
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
