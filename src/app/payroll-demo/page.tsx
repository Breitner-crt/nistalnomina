"use client";

import { useState, useEffect } from "react";
import { calculatePayroll, PayrollInput, PayrollResults } from "@/lib/payroll-engine";
import { supabase, Employee } from "@/lib/supabase";
import { Users, Calculator, Eye, ArrowLeft, RefreshCw, FileText, Search, Building2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export default function PayrollGenerationPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [payrollEntries, setPayrollEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEmployeeResults, setSelectedEmployeeResults] = useState<{ emp: Employee, results: PayrollResults } | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const { company, loading: authLoading } = useAuth();

    useEffect(() => {
        if (!authLoading && company) {
            fetchData();
        }
    }, [authLoading, company]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (!company) return;
            // 1. Fetch active employees of this company
            const { data: empData, error: empError } = await supabase
                .from('employees')
                .select('*')
                .eq('company_id', company.id)
                .eq('status', 'Activo')
                .order('first_name', { ascending: true });

            if (empError) throw empError;

            // 2. Fetch variable entries for this company's employees
            const { data: payrollData, error: payrollError } = await supabase
                .from('payroll_entries')
                .select('*, employees!inner(company_id)')
                .eq('employees.company_id', company.id);

            if (payrollError) throw payrollError;

            setEmployees(empData || []);
            setPayrollEntries(payrollData || []);
        } catch (error) {
            console.error("Error fetching payroll data:", error);
        } finally {
            setLoading(false);
        }
    };

    const getVariableData = (employeeId: string) => {
        return payrollEntries.find(entry => entry.employee_id === employeeId) || {
            commissions: 0,
            overtime_hours: 0,
            bonuses: 0,
            loans: 0,
            advances: 0
        };
    };

    const handleViewDetail = (emp: Employee) => {
        const varData = getVariableData(emp.id!);
        const results = calculatePayroll({
            baseSalary: emp.base_salary,
            overtimeHours: varData.overtime_hours || 0,
            commissions: varData.commissions || 0,
            bonuses: varData.other_bonuses || 0,
            loans: varData.loans_deduction || 0,
            advances: varData.advances_deduction || 0,
            absences: varData.absences || 0
        });
        setSelectedEmployeeResults({ emp, results });
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <RefreshCw className="animate-spin text-primary-600 mb-4" size={48} />
                <p className="text-slate-600 font-medium">Generando cálculos de planilla...</p>
            </div>
        );
    }

    if (selectedEmployeeResults) {
        const { emp, results } = selectedEmployeeResults;
        return (
            <div className="p-8 max-w-4xl mx-auto">
                <button
                    onClick={() => setSelectedEmployeeResults(null)}
                    className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium mb-6 transition-colors"
                >
                    <ArrowLeft size={20} />
                    Volver a la lista
                </button>

                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                    <div className="bg-primary-600 p-6 text-white">
                        <h2 className="text-2xl font-bold">{emp.first_name} {emp.last_name}</h2>
                        <p className="opacity-90">{emp.position} | {emp.department}</p>
                    </div>

                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                                <FileText className="text-primary-500" size={20} />
                                Desglose de Ingresos
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                                    <span className="text-slate-600">Salario Base</span>
                                    <span className="font-bold text-slate-900 font-mono text-lg">Q {results.baseSalaryEarned.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between items-center p-2">
                                    <span className="text-slate-600">Bonificación Incentivo</span>
                                    <span className="font-semibold text-green-600 font-mono">Q {results.bonificacionIncentivo.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center p-2">
                                    <span className="text-slate-600">Comisiones</span>
                                    <span className="font-semibold text-slate-800 font-mono">Q {results.commissions.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center p-2 border-b pb-4">
                                    <span className="text-slate-600">Horas Extras ({results.overtimePay > 0 ? 'Calculado' : '0'})</span>
                                    <span className="font-semibold text-slate-800 font-mono">Q {results.overtimePay.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 text-primary-900">
                                    <span className="font-bold">Total Devengado</span>
                                    <span className="font-bold text-xl font-mono">Q {(results.grossSalary).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-red-800 border-b pb-2">Deducciones</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-2">
                                    <span className="text-slate-600">IGSS Laboral (4.83%)</span>
                                    <span className="font-semibold text-red-600 font-mono">- Q {results.igssLaboral.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center p-2">
                                    <span className="text-slate-600">ISR Retenido (Estim.)</span>
                                    <span className="font-semibold text-red-600 font-mono">- Q {results.isrRetencion.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center p-2 border-b pb-4">
                                    <span className="text-slate-600">Otras Deducciones</span>
                                    <span className="font-semibold text-red-600 font-mono">- Q {(results.totalDeductions - results.igssLaboral - results.isrRetencion).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center pt-4 bg-primary-50 p-4 rounded-xl">
                                    <span className="font-bold text-primary-900 text-lg">Total Líquido</span>
                                    <span className="font-black text-2xl text-primary-600 font-mono underline decoration-primary-200 decoration-4">Q {results.netSalary.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            </div>

                            <div className="mt-8 bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Cargas Patronales (Costo Empresa)</h4>
                                <div className="grid grid-cols-2 gap-2 text-sm italic text-slate-600">
                                    <span>IGSS (10.67%): Q{results.igssPatronal.toFixed(2)}</span>
                                    <span>IRTRA (1%): Q{results.irtra.toFixed(2)}</span>
                                    <span>INTECAP (1%): Q{results.intecap.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <Link href="/" className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-bold mb-2 transition-colors group w-fit">
                        <ArrowLeft size={18} className="translate-x-0 group-hover:-translate-x-1 transition-transform" />
                        <span>Volver al Dashboard</span>
                    </Link>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Users className="text-primary-600" size={32} />
                        Planilla General
                    </h1>
                    <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                        <Building2 size={16} />
                        <span>{company?.name}</span>
                    </div>
                </div>
                    <p className="text-slate-500 mt-1">Cálculo mensual basado en salarios base y variables de Supabase.</p>
                </div>
                <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o DPI..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={fetchData}
                            className="p-2.5 text-slate-600 hover:text-primary-600 bg-white border border-slate-200 rounded-xl hover:bg-primary-50 transition-all shadow-sm flex-1 md:flex-none flex justify-center items-center"
                            title="Actualizar Datos"
                        >
                            <RefreshCw size={20} />
                        </button>
                        <Link
                            href="/reports"
                            className="bg-primary-600 text-white px-5 py-2.5 rounded-xl hover:bg-primary-700 transition-all font-bold shadow-lg shadow-primary-200 flex items-center justify-center gap-2 flex-1 md:flex-none"
                        >
                            <FileText size={20} />
                            Exportar
                        </Link>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-600 text-sm uppercase tracking-wider">
                                <th className="px-6 py-4">Colaborador</th>
                                <th className="px-6 py-4">Sueldo Base</th>
                                <th className="px-6 py-4">Variables (C/H.E)</th>
                                <th className="px-6 py-4">Descuentos</th>
                                <th className="px-6 py-4 text-center">Bonif. Inc.</th>
                                <th className="px-6 py-4 text-right">Total Líquido</th>
                                <th className="px-6 py-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {employees
                                .filter(emp =>
                                    `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    emp.dpi.includes(searchTerm)
                                )
                                .length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                                        {searchTerm ? 'No se encontraron resultados para su búsqueda.' : 'No hay empleados activos registrados.'}
                                    </td>
                                </tr>
                            ) : (
                                employees
                                    .filter(emp =>
                                        `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        emp.dpi.includes(searchTerm)
                                    )
                                    .map((emp) => {
                                        const varData = getVariableData(emp.id!);
                                        const results = calculatePayroll({
                                            baseSalary: emp.base_salary,
                                            overtimeHours: varData.overtime_hours || 0,
                                            commissions: varData.commissions || 0,
                                            bonuses: varData.other_bonuses || 0,
                                            loans: varData.loans_deduction || 0,
                                            advances: varData.advances_deduction || 0,
                                            absences: varData.absences || 0
                                        });

                                        return (
                                            <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <p className="font-bold text-slate-900">{emp.first_name} {emp.last_name}</p>
                                                    <p className="text-xs text-slate-500 uppercase tracking-wide">{emp.position}</p>
                                                </td>
                                                <td className="px-6 py-4 font-mono text-slate-600">
                                                    Q {emp.base_salary.toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col text-xs gap-0.5">
                                                        <span className="text-slate-500">Com: Q{results.commissions.toFixed(2)}</span>
                                                        <span className="text-slate-500">H.E: Q{results.overtimePay.toFixed(2)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col text-xs gap-0.5">
                                                        <span className="text-rose-600 font-medium">IGSS: -Q{results.igssLaboral.toFixed(2)}</span>
                                                        <span className="text-rose-600">Fal: -Q{results.absenceDeduction.toFixed(2)}</span>
                                                        {(results.loans > 0 || results.advances > 0) && (
                                                            <span className="text-amber-600">P/A: -Q{(results.loans + results.advances).toFixed(2)}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-1 rounded-full">
                                                        Q 250.00
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className="font-mono font-black text-primary-700 text-base flex gap-1 items-center">
                                                            <span className="text-[10px] text-primary-500 font-bold">Q</span>
                                                            {results.netSalary.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => handleViewDetail(emp)}
                                                        className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                                                        title="Ver Detalle"
                                                    >
                                                        <Eye size={20} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-8 bg-blue-50/50 border border-blue-100 rounded-2xl p-6 flex items-start gap-4">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                    <Calculator size={24} />
                </div>
                <div>
                    <h4 className="font-bold text-blue-900">Nota del Sistema</h4>
                    <p className="text-blue-700 text-sm mt-1">
                        Los cálculos de ISR y Deducción de Préstamos se obtienen automáticamente de la base de datos de cada mes.
                        Asegúrese de haber completado la carga de **Pagos Extras** antes de emitir los pagos globales.
                    </p>
                </div>
            </div>
        </div>
    );
}
