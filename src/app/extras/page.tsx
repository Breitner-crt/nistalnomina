"use client";

import { useState } from 'react';
import { Employee } from '@/lib/supabase';
import VariableEntryTable from '@/components/VariableEntryTable';
import { CreditCard, ArrowLeft, CheckCircle2, Calculator } from 'lucide-react';
import Link from 'next/link';

export default function PagosExtrasPage() {
    const [isSaved, setIsSaved] = useState(false);

    // Real initial data consistent with EmployeesPage
    const [employees] = useState<Employee[]>([
        {
            id: '1',
            first_name: 'Estuardo',
            last_name: 'Nistal',
            dpi: '2233 44556 0101',
            base_salary: 8500,
            position: 'Director Operativo',
            hiring_date: '2021-03-10',
            company_id: 'c1',
            status: 'Activo'
        },
        {
            id: '2',
            first_name: 'Juan',
            last_name: 'Pérez',
            dpi: '1234 56789 0101',
            base_salary: 4500,
            position: 'Analista Desarrollador',
            hiring_date: '2023-01-15',
            company_id: 'c1',
            status: 'Activo'
        },
        {
            id: '3',
            first_name: 'María',
            last_name: 'Gómez',
            dpi: '9 988 776 650 101',
            base_salary: 6500,
            position: 'Contadora General',
            hiring_date: '2022-06-01',
            company_id: 'c1',
            status: 'Activo'
        }
    ]);

    const handleSaveExtras = (data: any) => {
        console.log("Saving variable data:", data);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-6xl mx-auto">
                <header className="mb-8 flex justify-between items-start">
                    <div>
                        <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-primary-600 transition-colors mb-4 text-sm font-bold uppercase tracking-widest">
                            <ArrowLeft size={16} /> Volver al Dashboard
                        </Link>
                        <h1 className="text-4xl font-black text-slate-900 flex items-center gap-3">
                            <CreditCard className="text-primary-600 w-10 h-10" /> Pagos Extras
                        </h1>
                        <p className="text-slate-500 mt-2 text-lg">Gestión de comisiones y horas extras del periodo.</p>
                    </div>

                    {isSaved && (
                        <div className="bg-green-100 text-green-700 px-6 py-3 rounded-2xl flex items-center gap-2 animate-in fade-in zoom-in duration-300 font-bold border border-green-200 shadow-sm">
                            <CheckCircle2 size={20} />
                            Datos guardados correctamente
                        </div>
                    )}
                </header>

                <div className="mt-10">
                    <VariableEntryTable
                        employees={employees}
                        onSave={handleSaveExtras}
                    />
                </div>

                <div className="mt-12 bg-primary-900 rounded-3xl p-10 text-white flex justify-between items-center shadow-2xl">
                    <div className="max-w-md">
                        <h3 className="text-2xl font-bold mb-2">Planilla Integrada</h3>
                        <p className="text-primary-200 text-sm leading-relaxed">
                            Los valores ingresados arriba se verán reflejados automáticamente en los recibos de pago y en la exportación a Excel para el IGSS.
                        </p>
                    </div>
                    <Link href="/reports" className="bg-white text-primary-900 px-8 py-4 rounded-2xl font-black hover:bg-primary-50 transition-all flex items-center gap-3 shadow-xl">
                        Ir a Reportes <Calculator size={22} />
                    </Link>
                </div>
            </div>
        </div>
    );
}
