"use client";

import { useState, useEffect } from 'react';
import { exportToCSV, exportToIGSS } from '@/lib/export-utils';
import { calculatePayroll } from '@/lib/payroll-engine';
import { supabase } from '@/lib/supabase';
import {
    FileSpreadsheet,
    Download,
    Table as TableIcon,
    FileJson,
    CheckCircle2,
    AlertCircle,
    RefreshCw,
    ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

export default function ReportsPage() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string>("");

    const getFullPayrollData = async () => {
        // 1. Fetch active employees
        const { data: employees, error: empError } = await supabase
            .from('employees')
            .select('*')
            .eq('status', 'Activo');

        if (empError) throw empError;

        // 2. Fetch payroll entries (variables)
        const { data: entries, error: entriesError } = await supabase
            .from('payroll_entries')
            .select('*');

        if (entriesError) throw entriesError;

        // 3. Calculate for each and map for export
        return employees.map(emp => {
            const varData = entries.find(e => e.employee_id === emp.id) || {};
            const results = calculatePayroll({
                baseSalary: emp.base_salary,
                overtimeHours: varData.overtime_hours || 0,
                commissions: varData.commissions || 0,
                bonuses: varData.other_bonuses || 0,
                loans: varData.loans_deduction || 0,
                advances: varData.advances_deduction || 0
            });

            return {
                Nombre: `${emp.first_name} ${emp.last_name}`,
                DPI: emp.dpi,
                Puesto: emp.position,
                Salario_Base: emp.base_salary,
                Comisiones: results.commissions,
                Horas_Extras: results.overtimePay,
                Bonif_Incentivo: results.bonificacionIncentivo,
                IGSS_Laboral: results.igssLaboral,
                ISR: results.isrRetencion,
                Total_Descuentos: results.totalDeductions,
                Neto_Recibir: results.netSalary
            };
        });
    };

    const handleExportGeneral = async () => {
        setLoading(true);
        setStatus("Consultando base de datos...");
        try {
            const data = await getFullPayrollData();
            setStatus("Generando Planilla General...");
            exportToCSV(data, `Planilla_General_${new Date().toLocaleDateString('es-GT').replace(/\//g, '-')}`);
        } catch (error) {
            console.error("Error exporting data:", error);
            alert("Error al exportar datos. Verifique su conexión.");
        } finally {
            setLoading(false);
            setStatus("");
        }
    };

    const handleExportIGSS = async () => {
        setLoading(true);
        setStatus("Preparando archivo IGSS...");
        try {
            const rawData = await getFullPayrollData();
            const igssData = rawData.map(p => ({
                dpi: p.DPI,
                first_name: p.Nombre.split(' ')[0],
                last_name: p.Nombre.split(' ').slice(1).join(' '),
                grossSalary: p.Salario_Base + p.Comisiones + p.Horas_Extras
            }));
            exportToIGSS(igssData, `Carga_IGSS_${new Date().toLocaleDateString('es-GT').replace(/\//g, '-')}`);
        } catch (error) {
            console.error("Error exporting IGSS data:", error);
            alert("Error al exportar datos para IGSS.");
        } finally {
            setLoading(false);
            setStatus("");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-4xl mx-auto">
                <header className="mb-10 text-center md:text-left">
                    <Link href="/" className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-bold mb-4 transition-colors group">
                        <ArrowLeft size={18} className="translate-x-0 group-hover:-translate-x-1 transition-transform" />
                        <span>Volver al Dashboard</span>
                    </Link>
                    <h1 className="text-4xl font-black text-slate-900 flex items-center justify-center md:justify-start gap-4">
                        <FileSpreadsheet className="text-emerald-600 w-12 h-12" /> Central de Reportes
                    </h1>
                    <p className="text-slate-500 mt-3 text-lg">Exportación de datos de planilla en tiempo real desde Supabase.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* General Payroll Card */}
                    <div
                        className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 hover:border-emerald-500 hover:shadow-emerald-500/10 transition-all cursor-pointer group relative overflow-hidden"
                        onClick={handleExportGeneral}
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                        <div className="relative">
                            <div className="bg-emerald-100 text-emerald-700 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform">
                                <TableIcon size={32} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 mb-2">Libro de Salarios</h3>
                            <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                                Genera el archivo completo con desgloses de sueldo base, bonificaciones y deducciones legales (IGSS/ISR).
                            </p>
                            <div className="flex items-center text-emerald-600 font-bold text-sm gap-2 tracking-widest uppercase">
                                <Download size={18} /> Descargar Excel
                            </div>
                        </div>
                    </div>

                    {/* IGSS Card */}
                    <div
                        className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 hover:border-blue-500 hover:shadow-blue-500/10 transition-all cursor-pointer group relative overflow-hidden"
                        onClick={handleExportIGSS}
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                        <div className="relative">
                            <div className="bg-blue-100 text-blue-700 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:-rotate-6 transition-transform">
                                <FileJson size={32} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 mb-2">Archivo IGSS (TXT)</h3>
                            <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                                Formato listo para cargar en el portal de servicios electrónicos del IGSS para reporte de planillas.
                            </p>
                            <div className="flex items-center text-blue-600 font-bold text-sm gap-2 tracking-widest uppercase">
                                <CheckCircle2 size={18} /> Formato Validador
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Box */}
                <div className="mt-12 p-8 bg-slate-900 text-white rounded-3xl flex flex-col md:flex-row gap-8 items-center shadow-2xl relative overflow-hidden">
                    <div className="absolute bottom-0 right-0 opacity-10 pointer-events-none">
                        <FileSpreadsheet size={120} />
                    </div>
                    <div className="bg-emerald-500 p-4 rounded-2xl shadow-lg shadow-emerald-500/40">
                        <AlertCircle className="w-8 h-8 text-white" />
                    </div>
                    <div className="relative">
                        <h4 className="font-black text-xl mb-2 tracking-tight">Recuerde Validar Datos</h4>
                        <p className="text-slate-300 text-sm leading-relaxed max-w-2xl">
                            Los archivos generados se basan en la configuración de **Sueltos Base** definidos en el Control de Empleados y las **Variables Mensuales** de la sección de Pagos Extras.
                            Revise cualquier alerta de ISR antes de procesar el pago final.
                        </p>
                    </div>
                </div>
            </div>

            {loading && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-[100] p-4">
                    <div className="bg-white p-10 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm w-full">
                        <div className="relative mb-6">
                            <div className="w-20 h-20 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <RefreshCw className="text-emerald-600 animate-pulse" size={24} />
                            </div>
                        </div>
                        <p className="text-xl font-black text-slate-800 mb-1">Exportando...</p>
                        <p className="text-slate-500 font-medium">{status}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
