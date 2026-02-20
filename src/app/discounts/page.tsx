"use client";

import { useState, useEffect } from 'react';
import { supabase, Employee } from '@/lib/supabase';
import DiscountEntryTable from '@/components/DiscountEntryTable';
import { CreditCard, ArrowLeft, CheckCircle2, Loader2, Search, MinusCircle } from 'lucide-react';
import Link from 'next/link';
import { ChangeEvent } from 'react';

export default function DescuentosPage() {
    const [isSaved, setIsSaved] = useState(false);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [initialEntries, setInitialEntries] = useState<any[]>([]);

    useEffect(() => {
        fetchActiveEmployees();
    }, []);

    const fetchActiveEmployees = async () => {
        setLoading(true);
        try {
            const { data: empData, error: empError } = await supabase
                .from('employees')
                .select('*')
                .eq('status', 'Activo')
                .order('first_name', { ascending: true });

            if (empError) throw empError;

            const { data: payrollData, error: payrollError } = await supabase
                .from('payroll_entries')
                .select('id, employee_id, absences');

            if (payrollError) throw payrollError;

            setEmployees(empData || []);
            setInitialEntries(payrollData || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
        setLoading(false);
    };

    const handleSaveDiscounts = async (data: any[]) => {
        setLoading(true);
        try {
            const entriesToSave = data.map(entry => {
                const cleanEntry: any = {
                    employee_id: entry.employeeId,
                    absences: Number(entry.absences || 0),
                };

                if (entry.id && typeof entry.id === 'string' && entry.id.length > 10) {
                    cleanEntry.id = entry.id;
                } else {
                    cleanEntry.id = crypto.randomUUID();
                }

                return cleanEntry;
            });

            const { error } = await supabase
                .from('payroll_entries')
                .upsert(entriesToSave);

            if (error) throw error;

            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 3000);
            fetchActiveEmployees();
            alert('Descuentos guardados exitosamente');
        } catch (error: any) {
            console.error('Error saving discounts:', error);
            alert('Error al guardar: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-6xl mx-auto">
                <header className="mb-8 flex justify-between items-start">
                    <div>
                        <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-rose-600 transition-colors mb-4 text-sm font-bold uppercase tracking-widest">
                            <ArrowLeft size={16} /> Volver al Dashboard
                        </Link>
                        <h1 className="text-4xl font-black text-slate-900 flex items-center gap-3">
                            <MinusCircle className="text-rose-600 w-10 h-10" /> Descuentos y Faltas
                        </h1>
                        <p className="text-slate-500 mt-2 text-lg">Control de inasistencias y deducciones salariales.</p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-2 mt-4 md:mt-0">
                        <div className="relative md:w-64">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar colaborador..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                                value={searchTerm}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {isSaved && (
                        <div className="bg-green-100 text-green-700 px-6 py-3 rounded-2xl flex items-center gap-2 animate-in fade-in zoom-in duration-300 font-bold border border-green-200 shadow-sm">
                            <CheckCircle2 size={20} />
                            Datos guardados correctamente
                        </div>
                    )}
                </header>

                <div className="mt-10">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 shadow-xl">
                            <Loader2 className="w-12 h-12 text-rose-600 animate-spin mb-4" />
                            <p className="text-slate-500 font-medium italic">Cargando colaboradores...</p>
                        </div>
                    ) : (
                        <DiscountEntryTable
                            employees={employees.filter((emp: Employee) =>
                                `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
                            )}
                            initialEntries={initialEntries}
                            onSave={handleSaveDiscounts}
                        />
                    )}
                </div>

                <div className="mt-12 bg-slate-900 rounded-3xl p-10 text-white flex justify-between items-center shadow-2xl">
                    <div className="max-w-md">
                        <h3 className="text-2xl font-bold mb-2">Historial de Faltas</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            El registro de faltas impacta directamente en el cálculo de la planilla actual y en los reportes del IGSS para reportar días laborados reales.
                        </p>
                    </div>
                    <Link href="/payroll-demo" className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black hover:bg-slate-50 transition-all flex items-center gap-3 shadow-xl">
                        Ver Planilla <CreditCard size={22} />
                    </Link>
                </div>
            </div>
        </div>
    );
}
