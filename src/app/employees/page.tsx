"use client";

import { useState } from 'react';
import { Employee } from '@/lib/supabase';
import EmployeeForm from '@/components/EmployeeForm';
import { UserPlus, Users, List, Settings } from 'lucide-react';

export default function EmployeesPage() {
    const [view, setView] = useState<'list' | 'add'>('list');
    const [employees, setEmployees] = useState<Employee[]>([
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
            dpi: '1122 33445 0101',
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

    const handleAddEmployee = (newEmp: Employee) => {
        setEmployees([...employees, { ...newEmp, id: Math.random().toString() }]);
        setView('list');
        alert('Empleado registrado exitosamente (Simulado)');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar Simulado */}
            <aside className="w-64 bg-primary-900 text-white p-6 hidden md:block">
                <h2 className="text-xl font-bold mb-8">NistalNomina</h2>
                <nav className="space-y-4">
                    <div className="flex items-center gap-3 cursor-pointer hover:text-primary-300 transition-colors">
                        <Users size={20} />
                        <span>Dashboard</span>
                    </div>
                    <div className="flex items-center gap-3 font-semibold text-primary-300 cursor-pointer">
                        <List size={20} />
                        <span>Empleados</span>
                    </div>
                    <div className="flex items-center gap-3 cursor-pointer hover:text-primary-300 transition-colors">
                        <Settings size={20} />
                        <span>Empresa</span>
                    </div>
                </nav>
            </aside>

            <main className="flex-1 p-8">
                <div className="max-w-6xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                            <Users className="text-primary-600" /> Gestión de Colaboradores
                        </h1>
                        <button
                            onClick={() => setView(view === 'list' ? 'add' : 'list')}
                            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-all shadow-md"
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

                    {view === 'add' ? (
                        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <EmployeeForm onSave={handleAddEmployee} />
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
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {employees.map((emp) => (
                                        <tr key={emp.id} className="hover:bg-slate-50 transition-colors cursor-pointer">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-slate-800">{emp.first_name} {emp.last_name}</div>
                                                <div className="text-xs text-slate-500">Ingreso: {emp.hiring_date}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600 font-mono italic">{emp.dpi}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{emp.position || 'N/A'}</td>
                                            <td className="px-6 py-4 font-mono font-semibold text-primary-700">Q {emp.base_salary.toFixed(2)}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="px-2 py-1 text-xs font-bold rounded-full bg-green-100 text-green-700">
                                                    {emp.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
