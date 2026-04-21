'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase, PayrollPeriod } from '@/lib/supabase';
import { Calendar, ChevronDown, Check, Plus, Loader2 } from 'lucide-react';

export default function PeriodSelector() {
    const { company, activePeriod, setActivePeriod } = useAuth();
    const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [newPeriodData, setNewPeriodData] = useState({
        name: '',
        startDate: '',
        endDate: ''
    });

    useEffect(() => {
        if (company) {
            fetchPeriods();
        }
    }, [company, activePeriod]); // Re-fetch if activePeriod changes (e.g. newly created)

    const fetchPeriods = async () => {
        if (!company) return;
        const { data } = await supabase
            .from('payroll_periods')
            .select('*')
            .eq('company_id', company.id)
            .order('start_date', { ascending: false });
        
        if (data) setPeriods(data);
    };

    const handleCreatePeriod = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!company) return;
        setLoading(true);
        try {
            const newPeriod = {
                id: crypto.randomUUID(),
                company_id: company.id,
                name: newPeriodData.name,
                start_date: newPeriodData.startDate,
                end_date: newPeriodData.endDate,
                status: 'open'
            };

            const { data, error } = await supabase
                .from('payroll_periods')
                .insert([newPeriod])
                .select()
                .single();

            if (!error && data) {
                setPeriods([data, ...periods]);
                setActivePeriod(data);
                setShowModal(false);
                setNewPeriodData({ name: '', startDate: '', endDate: '' });
            } else {
                alert('Error al crear período: ' + error?.message);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!company) return null;

    return (
        <div className="relative z-50">
            {/* The Dropdown Button */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border transition-all ${
                    activePeriod?.status === 'closed' 
                    ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100' 
                    : 'border-primary-200 bg-white text-slate-700 hover:border-primary-300 shadow-sm'
                }`}
            >
                <Calendar size={18} className={activePeriod?.status === 'closed' ? 'text-amber-600' : 'text-primary-600'} />
                <div className="text-left flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60 leading-none">
                        Período Activo
                    </span>
                    <span className="font-bold text-sm leading-tight mt-0.5">
                        {activePeriod ? activePeriod.name : 'Cargando...'}
                    </span>
                </div>
                <ChevronDown size={16} className="ml-2 opacity-50" />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full mt-2 w-72 bg-white rounded-3xl shadow-2xl border border-slate-100 p-2 overflow-hidden">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 p-3">Historial de Períodos</p>
                    <div className="max-h-60 overflow-y-auto space-y-1">
                        {periods.map(p => (
                            <button
                                key={p.id}
                                onClick={() => {
                                    setActivePeriod(p);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-4 py-3 rounded-2xl flex items-center justify-between transition-colors ${
                                    activePeriod?.id === p.id 
                                    ? 'bg-primary-50 text-primary-700 font-bold' 
                                    : 'hover:bg-slate-50 text-slate-600 font-medium'
                                }`}
                            >
                                <div className="flex flex-col">
                                    <span>{p.name}</span>
                                    <span className="text-[10px] tracking-wider opacity-60">
                                        {p.status === 'closed' ? '🔒 CERRADO' : '🟢 ABIERTO'}
                                    </span>
                                </div>
                                {activePeriod?.id === p.id && <Check size={16} />}
                            </button>
                        ))}
                    </div>
                    
                    <div className="p-2 mt-2 border-t border-slate-100">
                        <button 
                            onClick={() => {
                                setIsOpen(false);
                                setShowModal(true);
                            }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-slate-900 text-white font-bold text-sm hover:scale-[1.02] transition-transform"
                        >
                            <Plus size={16} /> Alta de Período Pasado
                        </button>
                    </div>
                </div>
            )}

            {/* Modal for New Period */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <h2 className="text-2xl font-black text-slate-900 mb-2">Crear Período</h2>
                        <p className="text-slate-500 text-sm mb-6">Abre un período retroactivo para registrar novedades antes de ejecutar el cierre histórico.</p>
                        
                        <form onSubmit={handleCreatePeriod} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Rótulo del Período</label>
                                <input 
                                    required
                                    placeholder="Ej. Quincena 1 Marzo 2026"
                                    className="w-full mt-1 bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 font-medium focus:outline-none focus:border-primary-500"
                                    value={newPeriodData.name}
                                    onChange={e => setNewPeriodData({...newPeriodData, name: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Fecha Inicio</label>
                                    <input 
                                        type="date"
                                        required
                                        className="w-full mt-1 bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 font-medium focus:outline-none focus:border-primary-500"
                                        value={newPeriodData.startDate}
                                        onChange={e => setNewPeriodData({...newPeriodData, startDate: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Fecha Fin</label>
                                    <input 
                                        type="date"
                                        required
                                        className="w-full mt-1 bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 font-medium focus:outline-none focus:border-primary-500"
                                        value={newPeriodData.endDate}
                                        onChange={e => setNewPeriodData({...newPeriodData, endDate: e.target.value})}
                                    />
                                </div>
                            </div>
                            
                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-4 py-4 rounded-2xl font-bold bg-primary-600 text-white shadow-xl shadow-primary-500/20 hover:scale-[1.02] flex items-center justify-center transition-transform disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : 'Abrir Período'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
