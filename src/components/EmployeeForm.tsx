"use client";

import { useState } from 'react';
import { Employee } from '@/lib/supabase';

interface EmployeeFormProps {
    onSave: (employee: Employee) => void;
    initialData?: Employee;
}

export default function EmployeeForm({ onSave, initialData }: EmployeeFormProps) {
    const [formData, setFormData] = useState<Employee>(initialData || {
        company_id: '',
        first_name: '',
        last_name: '',
        dpi: '',
        nit: '',
        igss_number: '',
        hiring_date: new Date().toISOString().split('T')[0],
        base_salary: 3500,
        department: '',
        position: '',
        contract_type: 'Indefinido',
        status: 'Activo',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-xl shadow-lg border border-slate-200">
            <div className="border-b pb-4">
                <h2 className="text-2xl font-bold text-slate-800">Registro de Empleado</h2>
                <p className="text-slate-500 text-sm">Ingrese los datos personales y laborales del colaborador.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personales */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-primary-700">Datos Personales</h3>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Nombres *</label>
                        <input
                            required
                            type="text"
                            value={formData.first_name}
                            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                            className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 p-2.5 border"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Apellidos *</label>
                        <input
                            required
                            type="text"
                            value={formData.last_name}
                            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                            className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 p-2.5 border"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">DPI *</label>
                            <input
                                required
                                type="text"
                                placeholder="0000 00000 0000"
                                value={formData.dpi}
                                onChange={(e) => setFormData({ ...formData, dpi: e.target.value })}
                                className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 p-2.5 border"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">NIT</label>
                            <input
                                type="text"
                                value={formData.nit}
                                onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
                                className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 p-2.5 border"
                            />
                        </div>
                    </div>
                </div>

                {/* Laborales */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-primary-700">Información Laboral</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Fecha Ingreso *</label>
                            <input
                                required
                                type="date"
                                value={formData.hiring_date}
                                onChange={(e) => setFormData({ ...formData, hiring_date: e.target.value })}
                                className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 p-2.5 border"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Salario Base *</label>
                            <div className="relative mt-1">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 font-mono">Q</span>
                                <input
                                    required
                                    type="number"
                                    step="0.01"
                                    value={formData.base_salary}
                                    onChange={(e) => setFormData({ ...formData, base_salary: parseFloat(e.target.value) || 0 })}
                                    className="pl-8 block w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 p-2.5 border"
                                />
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Departamento / Puesto</label>
                        <input
                            type="text"
                            placeholder="Ej. Contabilidad / Analista"
                            value={formData.position}
                            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                            className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 p-2.5 border"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Tipo de Contrato</label>
                        <select
                            value={formData.contract_type}
                            onChange={(e) => setFormData({ ...formData, contract_type: e.target.value })}
                            className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 p-2.5 border bg-white"
                        >
                            <option value="Indefinido">Indefinido</option>
                            <option value="Temporal">Temporal / Plazo Fijo</option>
                            <option value="Servicios">Servicios Profesionales</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-6 border-t gap-3">
                <button
                    type="button"
                    className="px-6 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    className="px-6 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 shadow-sm transition-colors"
                >
                    Guardar Empleado
                </button>
            </div>
        </form>
    );
}
