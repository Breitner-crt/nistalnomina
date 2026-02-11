"use client";

import { useState } from 'react';
import { exportToCSV, exportToIGSS } from '@/lib/export-utils';
import {
    FileSpreadsheet,
    Download,
    Table as TableIcon,
    FileJson,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';

export default function ReportsPage() {
    const [loading, setLoading] = useState(false);

    // Simulated payroll data for export
    const payrollData = [
        {
            Nombre: 'Estuardo Nistal',
            DPI: '2233 44556 0101',
            Puesto: 'Director Operativo',
            Sueldo_Base: 8500,
            Comisiones: 1200,
            Extra: 450,
            Bonif: 250,
            IGSS_Laboral: 485.42,
            ISR: 120.50,
            Neto: 9794.08
        },
        {
            Nombre: 'Juan Perez',
            DPI: '1122 33445 0101',
            Puesto: 'Analista Desarrollador',
            Sueldo_Base: 4500,
            Comisiones: 0,
            Extra: 0,
            Bonif: 250,
            IGSS_Laboral: 217.35,
            ISR: 0,
            Neto: 4532.65
        },
        {
            Nombre: 'Maria Gomez',
            DPI: '9 988 776 650 101',
            Puesto: 'Contadora General',
            Sueldo_Base: 6500,
            Comisiones: 500,
            Extra: 200,
            Bonif: 250,
            IGSS_Laboral: 347.76,
            ISR: 45.00,
            Neto: 7057.24
        }
    ];

    const handleExportGeneral = () => {
        setLoading(true);
        setTimeout(() => {
            exportToCSV(payrollData, 'Planilla_General_Febrero_2026');
            setLoading(false);
        }, 800);
    };

    const handleExportIGSS = () => {
        setLoading(true);
        setTimeout(() => {
            // Mapping to a more IGSS-compliant structure if needed
            exportToIGSS(payrollData.map(p => ({
                dpi: p.DPI,
                first_name: p.Nombre.split(' ')[0],
                last_name: p.Nombre.split(' ')[1],
                grossSalary: p.Sueldo_Base + p.Comisiones + p.Extra
            })), 'Febrero_2026');
            setLoading(false);
        }, 800);
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-4xl mx-auto">
                <header className="mb-10">
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <FileSpreadsheet className="text-green-600 w-9 h-9" /> Exportación de Datos
                    </h1>
                    <p className="text-slate-500 mt-2">Genesare archivos compatibles con Excel y sistemas gubernamentales.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* General Payroll Card */}
                    <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 hover:border-green-500 transition-all cursor-pointer group" onClick={handleExportGeneral}>
                        <div className="bg-green-100 text-green-700 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <TableIcon size={28} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Planilla General (Excel)</h3>
                        <p className="text-slate-500 text-sm mb-6">Contiene el desglose completo de todos los colaboradores del mes actual.</p>
                        <div className="flex items-center text-green-600 font-bold text-sm gap-2 uppercase tracking-widest">
                            <Download size={16} /> Descargar .CSV
                        </div>
                    </div>

                    {/* IGSS Card */}
                    <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 hover:border-blue-500 transition-all cursor-pointer group" onClick={handleExportIGSS}>
                        <div className="bg-blue-100 text-blue-700 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <FileJson size={28} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Archivo de Carga IGSS</h3>
                        <p className="text-slate-500 text-sm mb-6">Formato pre-configurado para la carga masiva en el portal del IGSS.</p>
                        <div className="flex items-center text-blue-600 font-bold text-sm gap-2 uppercase tracking-widest">
                            <CheckCircle2 size={16} /> Formato Oficial
                        </div>
                    </div>
                </div>

                {/* Info Box */}
                <div className="mt-12 p-6 bg-slate-900 text-white rounded-2xl flex gap-6 items-center shadow-2xl">
                    <div className="bg-primary-500 p-3 rounded-full">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="font-bold text-lg">Nota de Compatibilidad</h4>
                        <p className="text-primary-100 text-sm">
                            Los archivos generados están codificados en UTF-8 y utilizan el estándar internacional de CSV,
                            lo que garantiza que sean abiertos por cualquier versión de Microsoft Excel 2010+ o Google Sheets sin errores de caracteres especiales.
                        </p>
                    </div>
                </div>
            </div>

            {loading && (
                <div className="fixed inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-[100]">
                    <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
                        <p className="font-bold text-slate-700">Generando su archivo...</p>
                    </div>
                </div>
            )}
        </div>
    );
}
