"use client";

import { useState, useEffect } from 'react';
import { supabase, Employee } from '@/lib/supabase';
import VariableEntryTable from '@/components/VariableEntryTable';
import { CreditCard, ArrowLeft, CheckCircle2, Calculator, Loader2, Search } from 'lucide-react';
import Link from 'next/link';
import { ChangeEvent } from 'react';
import { useAuth } from '@/components/AuthProvider';

export default function PagosExtrasPage() {
    const [isSaved, setIsSaved] = useState(false);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { company, loading: authLoading } = useAuth();

    useEffect(() => {
        if (!authLoading && company) {
            fetchActiveEmployees();
        }
    }, [authLoading, company]);

    const fetchActiveEmployees = async () => {
        setLoading(true);
        try {
            if (!company) return;
            // Fetch active employees of this company
            const { data: empData, error: empError } = await supabase
                .from('employees')
                .select('*')
                .eq('company_id', company.id)
                .eq('status', 'Activo')
                .order('first_name', { ascending: true });

            if (empError) throw empError;

            // Fetch existing payroll entries (variable data) for this company's employees
            const { data: payrollData, error: payrollError } = await supabase
                .from('payroll_entries')
                .select('*, employees!inner(company_id)')
                .eq('employees.company_id', company.id);

            if (payrollError) throw payrollError;

            // Map payroll data to employees if needed, 
            // but VariableEntryTable now handles state internally.
            // We'll pass the payroll data to the table for initial state.
            setEmployees(empData || []);

            // Note: We might need a way to pass initial entries to the table
            // Let's store them in a state to pass as prop
            setInitialEntries(payrollData || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
        setLoading(false);
    };

    const [initialEntries, setInitialEntries] = useState<any[]>([]);

    const handleSaveExtras = async (data: any[]) => {
        setLoading(true);
        try {
            // Prepare data for payroll_entries
            const entriesToSave = data.map(entry => {
                // Find existing data to preserve other fields (absences, etc.)
                const existing = initialEntries.find(i => i.employee_id === entry.employeeId) || {};

                const cleanEntry: any = {
                    ...existing,
                    employee_id: entry.employeeId,
                    commissions: Number(entry.commissions || 0),
                    overtime_hours: Number(entry.overtimeHours || 0),
                    bonificacion_incentivo: 250, // Default base
                };

                if (!cleanEntry.id || typeof cleanEntry.id !== 'string' || cleanEntry.id.length < 10) {
                    cleanEntry.id = crypto.randomUUID();
                }

                return cleanEntry;
            });

            // Upsert by ID (default behavior for primary key)
            const { error } = await supabase
                .from('payroll_entries')
                .upsert(entriesToSave);

            if (error) throw error;

            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 3000);

            // Refresh data to get new record IDs for newly created rows
            fetchActiveEmployees();

            alert('Datos de pagos extras guardados exitosamente');
        } catch (error: any) {
            console.error('Error saving extras:', error);
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
                        <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-primary-600 transition-colors mb-4 text-sm font-bold uppercase tracking-widest">
                            <ArrowLeft size={16} /> Volver al Dashboard
                        </Link>
                        <h1 className="text-4xl font-black text-slate-900 flex items-center gap-3">
                            <CreditCard className="text-primary-600 w-10 h-10" /> Pagos Extras
                        </h1>
                        <p className="text-slate-500 mt-2 text-lg">Gestión de comisiones y horas extras del periodo.</p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-2 mt-4 md:mt-0">
                        <div className="relative md:w-64">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar colaborador..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
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
                            <Loader2 className="w-12 h-12 text-primary-600 animate-spin mb-4" />
                            <p className="text-slate-500 font-medium italic">Cargando colaboradores activos...</p>
                        </div>
                    ) : employees.length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-slate-200">
                            <p className="text-slate-400 font-medium">No se encontraron colaboradores activos.</p>
                            <Link href="/employees" className="inline-block mt-4 text-primary-600 font-bold hover:underline">
                                Ir a Control de Empleados
                            </Link>
                        </div>
                    ) : (
                        <VariableEntryTable
                            employees={employees.filter((emp: Employee) =>
                                `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (emp.dpi && emp.dpi.includes(searchTerm))
                            )}
                            initialEntries={initialEntries}
                            onSave={handleSaveExtras}
                        />
                    )}
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
