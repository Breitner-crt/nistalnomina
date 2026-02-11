"use client";

import { useState, useRef } from 'react';
import Payslip from '@/components/Payslip';
import { calculatePayroll } from '@/lib/payroll-engine';
import { Employee } from '@/lib/supabase';
import { Printer, Download, ArrowLeft, Mail } from 'lucide-react';
import Link from 'next/link';

export default function PayslipPreviewPage() {
    const [employee] = useState<Employee>({
        first_name: 'Estuardo',
        last_name: 'Nistal',
        dpi: '2233 44556 0101',
        nit: '556677-8',
        hiring_date: '2021-03-10',
        base_salary: 8500,
        position: 'Director Operativo',
        igss_number: '1000223344',
        company_id: 'c1'
    });

    const results = calculatePayroll({
        baseSalary: 8500,
        overtimeHours: 5,
        commissions: 1200,
        bonuses: 0,
        loans: 500,
        advances: 0
    });

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="bg-slate-100 min-h-screen">
            {/* Tool Bar */}
            <div className="bg-white border-b p-4 sticky top-0 z-50 shadow-sm print:hidden">
                <div className="max-w-5xl mx-auto flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-primary-600 transition-colors">
                        <ArrowLeft size={18} />
                        <span className="font-semibold text-sm">Volver al Dashboard</span>
                    </Link>

                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 text-slate-600 bg-slate-50 px-4 py-2 rounded-lg border hover:bg-slate-100 transition-all font-bold text-sm">
                            <Mail size={16} />
                            Enviar por Correo
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 shadow-md transition-all font-bold text-sm"
                        >
                            <Printer size={16} />
                            Imprimir / Descargar PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* Preview area */}
            <div className="p-8 pb-20 print:p-0">
                <div className="max-w-fit mx-auto print:max-w-none">
                    <Payslip
                        employee={employee}
                        results={results}
                        period="Febrero 2026"
                        companyName="NistalNomina S.A."
                    />
                </div>
            </div>

            {/* Legend for USER */}
            <div className="max-w-4xl mx-auto p-6 bg-amber-50 rounded-xl border border-amber-200 mt-4 mb-12 print:hidden flex gap-4">
                <div className="text-amber-500 font-black text-2xl">!</div>
                <p className="text-sm text-amber-800 italic leading-relaxed">
                    <strong>Tip Pro:</strong> Al presionar el botón de "Imprimir", el sistema abrirá el diálogo nativo de tu navegador.
                    Selecciona <strong>"Guardar como PDF"</strong> en la opción de destino para generar el archivo digital con un diseño 100% profesional y optimizado.
                </p>
            </div>
        </div>
    );
}
