"use client";

import { useEffect, useState } from 'react';
import { Employee, supabase } from '@/lib/supabase';
import EmployeeForm from '@/components/EmployeeForm';
import { UserPlus, Users, List, Settings, Edit2, UserMinus, Loader2, Search, ArrowLeft, Building2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

export const dynamic = 'force-dynamic';

export default function EmployeesPage() {
    const [view, setView] = useState<'list' | 'add'>('list');
    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState('');
    const { company, loading: authLoading } = useAuth();

    useEffect(() => {
        if (!authLoading && company) {
            fetchEmployees();
        }
    }, [authLoading, company]);

    const fetchEmployees = async () => {
        if (!company) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('employees')
            .select('*')
            .eq('company_id', company.id)
            .order('first_name', { ascending: true });

        if (error) {
            console.error('Error fetching employees:', error);
        } else {
            setEmployees(data || []);
        }
        setLoading(false);
    };

    const handleSaveEmployee = async (empData: Employee) => {
        // Clean data: Ensure UUID fields are valid or excluded
        const { id, company_id, ...rest } = empData;
        const cleanData: any = { ...rest };

        if (id && id.length > 10) cleanData.id = id;
        if (company_id && company_id.length > 10) cleanData.company_id = company_id;

        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            alert('Error: No se detectaron las credenciales de Supabase. Asegúrate de configurar las variables de entorno en Vercel y hacer un "Redeploy".');
            return;
        }

        const { error } = await supabase
            .from('employees')
            .upsert({ ...cleanData, company_id: company?.id });

        if (error) {
            alert('Error al guardar: ' + error.message);
        } else {
            alert(id ? 'Empleado actualizado' : 'Empleado registrado');
            setView('list');
            setEditingEmployee(undefined);
            fetchEmployees();
        }
    };

    const handleEdit = (emp: Employee) => {
        setEditingEmployee(emp);
        setView('add');
    };

    const handleBaja = async (id: string) => {
        if (!confirm('¿Está seguro de dar de baja a este empleado?')) return;

        const { error } = await supabase
            .from('employees')
            .update({
                status: 'Baja',
                termination_date: new Date().toISOString().split('T')[0]
            })
            .eq('id', id);

        if (error) {
            alert('Error: ' + error.message);
        } else {
            fetchEmployees();
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-7xl mx-auto">
                <Link
                    href="/"
                    className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium mb-6 transition-colors group"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    Volver al Dashboard
                </Link>
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                        <Users className="text-primary-600" /> Gestión de Colaboradores
                    </h1>
                    <div className="hidden md:flex items-center gap-2 text-slate-400 text-sm font-medium">
                        <Building2 size={16} />
                        <span>{company?.name}</span>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        {view === 'list' && (
                            <div className="relative flex-1 md:w-64">
                                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre o DPI..."
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        )}

                        <button
                            onClick={() => setView(view === 'list' ? 'add' : 'list')}
                            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-all shadow-md whitespace-nowrap"
                        >
                            {view === 'list' ? (
                                <>
                                    <UserPlus size={18} />
                                    <span>Nuevo Empleado</span>
                                </>
                            ) : (
                                <>
                                    <List size={18} />
                                    <span>Ver Listado</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center p-20 bg-white rounded-xl border border-slate-200 shadow-sm">
                        <Loader2 className="w-10 h-10 text-primary-600 animate-spin mb-4" />
                        <p className="text-slate-500 font-medium">Cargando colaboradores...</p>
                    </div>
                ) : view === 'add' ? (
                    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <EmployeeForm
                            onSave={handleSaveEmployee}
                            initialData={editingEmployee}
                            onCancel={() => {
                                setView('list');
                                setEditingEmployee(undefined);
                            }}
                        />
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Colaborador</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">DPI</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Puesto / Depto</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Salario Base</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Fecha Baja</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Estado</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {employees
                                    .filter(emp =>
                                        `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        emp.dpi.includes(searchTerm) ||
                                        (emp.position && emp.position.toLowerCase().includes(searchTerm.toLowerCase()))
                                    )
                                    .length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-10 text-center text-slate-500 italic">
                                            {searchTerm ? 'No se encontraron resultados para su búsqueda.' : 'No hay empleados registrados.'}
                                        </td>
                                    </tr>
                                ) : (
                                    employees
                                        .filter(emp =>
                                            `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            emp.dpi.includes(searchTerm) ||
                                            (emp.position && emp.position.toLowerCase().includes(searchTerm.toLowerCase()))
                                        )
                                        .map((emp) => (
                                            <tr key={emp.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-slate-800">{emp.first_name} {emp.last_name}</div>
                                                    <div className="text-[10px] text-slate-500">
                                                        Ingreso: {emp.hiring_date}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600 font-mono italic">{emp.dpi}</td>
                                                <td className="px-6 py-4 text-sm text-slate-600">{emp.position || 'N/A'}</td>
                                                <td className="px-6 py-4 font-mono font-semibold text-primary-700">Q {emp.base_salary.toFixed(2)}</td>
                                                <td className="px-6 py-4 text-sm text-rose-600 font-bold">
                                                    {emp.status === 'Baja' ? (emp.termination_date || 'N/A') : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${emp.status === 'Activo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                        }`}>
                                                        {emp.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleEdit(emp)}
                                                            className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                                                            title="Editar"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        {emp.status === 'Activo' && (
                                                            <button
                                                                onClick={() => handleBaja(emp.id!)}
                                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                                title="Dar de Baja"
                                                            >
                                                                <UserMinus size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
