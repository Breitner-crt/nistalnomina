"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
    calculateAnnualBonus,
    AnnualBonusCalculation,
    numberToQuetzalesWords
} from "@/lib/payroll-engine";
import { supabase, Employee } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import AnnualBonusPayslip from "@/components/AnnualBonusPayslip";
import {
    Printer,
    ArrowLeft,
    Search,
    Award,
    Calendar,
    Users,
    CheckCircle2,
    Clock,
    DollarSign,
    Building2,
    Eye,
    Check,
    X,
    Filter,
    Download,
    RefreshCw,
    AlertCircle,
    Info,
    Sparkles
} from "lucide-react";

interface BonusRecordState {
    status: "Pagado" | "Pendiente";
    advances: number;
    judicialRetentions: number;
}

export default function BonusPayslipPage() {
    const { company, loading: authLoading } = useAuth();

    // Filtros principales
    const [bonusType, setBonusType] = useState<"aguinaldo" | "bono14">("aguinaldo");
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [paymentMode, setPaymentMode] = useState<"100%" | "50%_primera" | "50%_segunda">("100%");
    const [searchTerm, setSearchTerm] = useState("");
    const [departmentFilter, setDepartmentFilter] = useState("all");

    // Datos y estados
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loadingEmps, setLoadingEmps] = useState(true);
    const [customDeductions, setCustomDeductions] = useState<Record<string, BonusRecordState>>({});
    const [dbAvailable, setDbAvailable] = useState<boolean | null>(null);

    // Modal / Vista previa
    const [previewEmployee, setPreviewEmployee] = useState<Employee | null>(null);
    const [previewCalc, setPreviewCalc] = useState<AnnualBonusCalculation | null>(null);
    const [isBatchPrinting, setIsBatchPrinting] = useState(false);

    // 1. Cargar colaboradores de la empresa activa
    useEffect(() => {
        if (!authLoading && company) {
            fetchEmployeesAndStatuses();
        }
    }, [authLoading, company, bonusType, selectedYear, paymentMode]);

    const fetchEmployeesAndStatuses = async () => {
        if (!company) return;
        setLoadingEmps(true);

        try {
            // Empleados activos
            const { data: emps, error: empsError } = await supabase
                .from("employees")
                .select("*")
                .eq("company_id", company.id)
                .order("first_name", { ascending: true });

            if (!empsError && emps) {
                setEmployees(emps);
            }

            // Intentar consultar registros persistidos en annual_bonus_records si la tabla existe
            const { data: records, error: recError } = await supabase
                .from("annual_bonus_records")
                .select("*")
                .eq("company_id", company.id)
                .eq("bonus_type", bonusType)
                .eq("year", selectedYear)
                .eq("payment_mode", paymentMode);

            if (!recError && records) {
                setDbAvailable(true);
                const map: Record<string, BonusRecordState> = {};
                records.forEach((r: any) => {
                    map[r.employee_id] = {
                        status: r.status as "Pagado" | "Pendiente",
                        advances: Number(r.advances || 0),
                        judicialRetentions: Number(r.judicial_retentions || 0)
                    };
                });
                setCustomDeductions(prev => ({ ...prev, ...map }));
            } else {
                setDbAvailable(false);
            }
        } catch (e) {
            setDbAvailable(false);
        } finally {
            setLoadingEmps(false);
        }
    };

    // 2. Calcular los bonos de cada empleado dinámicamente
    const employeeCalculations = useMemo(() => {
        return employees.map(emp => {
            const empId = emp.id || "";
            const currentRecord = customDeductions[empId] || {
                status: "Pendiente",
                advances: 0,
                judicialRetentions: 0
            };

            const calc = calculateAnnualBonus({
                bonusType,
                baseSalary: emp.base_salary || 0,
                hiringDate: emp.hiring_date,
                year: selectedYear,
                paymentMode,
                advances: currentRecord.advances,
                judicialRetentions: currentRecord.judicialRetentions
            });

            return {
                emp,
                calc,
                status: currentRecord.status
            };
        });
    }, [employees, bonusType, selectedYear, paymentMode, customDeductions]);

    // 3. Filtrar colaboradores según búsqueda y departamento
    const filteredCalculations = useMemo(() => {
        return employeeCalculations.filter(({ emp }) => {
            const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
            const dpi = (emp.dpi || "").toLowerCase();
            const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || dpi.includes(searchTerm.toLowerCase());
            const matchesDept = departmentFilter === "all" || emp.department === departmentFilter;
            return matchesSearch && matchesDept;
        });
    }, [employeeCalculations, searchTerm, departmentFilter]);

    // Departamentos únicos para el filtro
    const departments = useMemo(() => {
        const set = new Set<string>();
        employees.forEach(e => {
            if (e.department) set.add(e.department);
        });
        return Array.from(set);
    }, [employees]);

    // 4. Métricas globales (KPIs)
    const stats = useMemo(() => {
        const totalEmployees = employeeCalculations.length;
        const totalPaid = employeeCalculations.filter(c => c.status === "Pagado").length;
        const totalPending = totalEmployees - totalPaid;
        const totalGross = employeeCalculations.reduce((acc, c) => acc + c.calc.grossAmount, 0);
        const totalDeductions = employeeCalculations.reduce((acc, c) => acc + c.calc.totalDeductions, 0);
        const totalNet = employeeCalculations.reduce((acc, c) => acc + c.calc.netAmount, 0);

        return {
            totalEmployees,
            totalPaid,
            totalPending,
            totalGross,
            totalDeductions,
            totalNet
        };
    }, [employeeCalculations]);

    // 5. Alternar estado Pagado / Pendiente y persistir si la tabla existe
    const togglePaymentStatus = async (emp: Employee, calc: AnnualBonusCalculation) => {
        const empId = emp.id || "";
        const currentRecord = customDeductions[empId] || {
            status: "Pendiente",
            advances: 0,
            judicialRetentions: 0
        };

        const newStatus = currentRecord.status === "Pagado" ? "Pendiente" : "Pagado";

        // Actualizar estado local inmediato
        setCustomDeductions(prev => ({
            ...prev,
            [empId]: {
                ...currentRecord,
                status: newStatus
            }
        }));

        // Intentar guardar en base de datos si está disponible
        if (company) {
            try {
                await supabase.from("annual_bonus_records").upsert(
                    {
                        company_id: company.id,
                        employee_id: empId,
                        bonus_type: bonusType,
                        year: selectedYear,
                        period_start: calc.periodStart,
                        period_end: calc.periodEnd,
                        days_worked: calc.daysWorked,
                        base_salary: calc.baseSalary,
                        gross_amount: calc.grossAmount,
                        advances: calc.advances,
                        judicial_retentions: calc.judicialRetentions,
                        net_amount: calc.netAmount,
                        status: newStatus,
                        payment_mode: paymentMode,
                        paid_at: newStatus === "Pagado" ? new Date().toISOString() : null
                    },
                    { onConflict: "company_id,employee_id,bonus_type,year,payment_mode" }
                );
            } catch (err) {
                console.warn("No se pudo persistir en annual_bonus_records (tabla aún no creada en Supabase):", err);
            }
        }
    };

    // Actualizar anticipos o retenciones de un colaborador
    const updateDeductions = (empId: string, field: "advances" | "judicialRetentions", value: number) => {
        setCustomDeductions(prev => {
            const curr = prev[empId] || { status: "Pendiente", advances: 0, judicialRetentions: 0 };
            return {
                ...prev,
                [empId]: {
                    ...curr,
                    [field]: Math.max(0, value)
                }
            };
        });
    };

    // 6. Vista previa de boleta individual
    const handleOpenPreview = (emp: Employee, calc: AnnualBonusCalculation) => {
        setPreviewEmployee(emp);
        setPreviewCalc(calc);
    };

    // 7. Acciones de Impresión
    const handlePrintCurrent = () => {
        window.print();
    };

    const handleBatchPrint = () => {
        setIsBatchPrinting(true);
        setTimeout(() => {
            window.print();
            setIsBatchPrinting(false);
        }, 300);
    };

    // 8. Exportar CSV
    const exportCSV = () => {
        const headers = ["Nombre", "DPI", "Departamento", "Puesto", "Fecha_Ingreso", "Dias_Computados", "Salario_Base", "Devengado", "Anticipos", "Embargos", "Total_Liquido", "Estado"];
        const rows = filteredCalculations.map(({ emp, calc, status }) => [
            `"${emp.first_name} ${emp.last_name}"`,
            `"${emp.dpi}"`,
            `"${emp.department || "N/A"}"`,
            `"${emp.position || "N/A"}"`,
            emp.hiring_date,
            calc.daysWorked,
            calc.baseSalary.toFixed(2),
            calc.grossAmount.toFixed(2),
            calc.advances.toFixed(2),
            calc.judicialRetentions.toFixed(2),
            calc.netAmount.toFixed(2),
            status
        ]);

        const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Boletas_${bonusType.toUpperCase()}_${selectedYear}.csv`;
        link.click();
    };

    return (
        <div className="bg-slate-100 min-h-screen font-sans text-slate-800">
            {/* Barra superior de navegación */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm print:hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-bold text-sm group"
                        >
                            <ArrowLeft size={18} className="translate-x-0 group-hover:-translate-x-1 transition-transform" />
                            <span>Dashboard</span>
                        </Link>
                        <div className="h-5 w-px bg-slate-200"></div>
                        <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
                            <Building2 size={16} className="text-slate-400" />
                            <span>{company?.name || "Mi Empresa"}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                        <button
                            onClick={exportCSV}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all shadow-sm"
                        >
                            <Download size={15} className="text-slate-500" />
                            <span>Exportar CSV</span>
                        </button>
                        <button
                            onClick={handleBatchPrint}
                            disabled={filteredCalculations.length === 0}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition-all shadow-md active:scale-95 disabled:opacity-50"
                        >
                            <Printer size={15} />
                            <span>Imprimir Todas ({filteredCalculations.length})</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Contenido principal */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 print:p-0 print:m-0 print:max-w-none">
                {/* Cabecera y Título del Módulo */}
                <div className="print:hidden space-y-4">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200/70 text-slate-700 text-xs font-bold mb-2">
                                <Sparkles size={13} className="text-amber-600" />
                                <span>Prestaciones Anuales de Ley</span>
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                                Módulo de Aguinaldo y Bono 14
                            </h1>
                            <p className="text-sm text-slate-500 font-medium mt-1">
                                Generación automática según Decretos 76-78 y 42-92, control de estado de pago e impresión oficial.
                            </p>
                        </div>

                        {/* Selector de Pestañas: Aguinaldo vs Bono 14 */}
                        <div className="bg-slate-200 p-1.5 rounded-2xl flex items-center gap-1 shadow-inner self-start md:self-auto">
                            <button
                                onClick={() => setBonusType("aguinaldo")}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
                                    bonusType === "aguinaldo"
                                        ? "bg-white text-slate-900 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                <Award size={16} className={bonusType === "aguinaldo" ? "text-amber-600" : "text-slate-400"} />
                                <span>Aguinaldo (Dec. 76-78)</span>
                            </button>
                            <button
                                onClick={() => setBonusType("bono14")}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
                                    bonusType === "bono14"
                                        ? "bg-white text-slate-900 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                <Award size={16} className={bonusType === "bono14" ? "text-emerald-600" : "text-slate-400"} />
                                <span>Bono 14 (Dec. 42-92)</span>
                            </button>
                        </div>
                    </div>

                    {/* Barra de Filtros y Configuración del Período */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
                        {/* Selector de Año */}
                        <div className="space-y-1">
                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                                Año Fiscal
                            </label>
                            <div className="relative">
                                <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <select
                                    value={selectedYear}
                                    onChange={e => setSelectedYear(Number(e.target.value))}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                                >
                                    {[2024, 2025, 2026, 2027].map(y => (
                                        <option key={y} value={y}>
                                            Año {y}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Modalidad de Pago (Solo para Aguinaldo) */}
                        <div className="space-y-1">
                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                                Modalidad de Pago
                            </label>
                            {bonusType === "aguinaldo" ? (
                                <select
                                    value={paymentMode}
                                    onChange={e => setPaymentMode(e.target.value as any)}
                                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                                >
                                    <option value="100%">100% Pago Total (Diciembre)</option>
                                    <option value="50%_primera">50% Primera Entrega (Dic.)</option>
                                    <option value="50%_segunda">50% Segunda Entrega (Enero)</option>
                                </select>
                            ) : (
                                <div className="px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-500">
                                    100% Pago Único (Julio)
                                </div>
                            )}
                        </div>

                        {/* Filtro de Departamento */}
                        <div className="space-y-1">
                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                                Departamento
                            </label>
                            <div className="relative">
                                <Filter size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <select
                                    value={departmentFilter}
                                    onChange={e => setDepartmentFilter(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                                >
                                    <option value="all">Todos los Departamentos</option>
                                    {departments.map(d => (
                                        <option key={d} value={d}>
                                            {d}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Búsqueda por Nombre / DPI */}
                        <div className="space-y-1">
                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                                Buscar Colaborador
                            </label>
                            <div className="relative">
                                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Nombre o DPI..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Notificación informativa sobre la base de datos */}
                    {dbAvailable === false && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-800">
                            <Info size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <strong className="font-black">Modo en memoria activo:</strong> Las boletas y cálculos
                                funcionan al 100% de inmediato. Para guardar de forma permanente el estado de &quot;Pagado&quot;
                                en tu base de datos Supabase, puedes ejecutar el archivo{" "}
                                <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">
                                    annual_bonus_records.sql
                                </code>{" "}
                                en el editor SQL cuando gustes.
                            </div>
                        </div>
                    )}
                </div>

                {/* Tarjetas KPI de Resumen */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                            <Users size={22} />
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                                Total Colaboradores
                            </span>
                            <span className="text-2xl font-black text-slate-900">{stats.totalEmployees}</span>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 size={22} />
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                                Pagados
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-black text-slate-900">{stats.totalPaid}</span>
                                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                    {stats.totalEmployees > 0
                                        ? `${Math.round((stats.totalPaid / stats.totalEmployees) * 100)}%`
                                        : "0%"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                            <Clock size={22} />
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                                Pendientes
                            </span>
                            <span className="text-2xl font-black text-slate-900">{stats.totalPending}</span>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
                            <DollarSign size={22} />
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                                Total a Desembolsar
                            </span>
                            <span className="text-xl font-black font-mono text-emerald-400">
                                Q {stats.totalNet.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Tabla de Control de Empleados */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:hidden">
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                        <div>
                            <h2 className="text-base font-black text-slate-900">
                                Nómina de {bonusType === "aguinaldo" ? "Aguinaldo" : "Bono 14"} - {selectedYear}
                            </h2>
                            <p className="text-xs text-slate-500 font-medium">
                                Período computable: {employeeCalculations[0]?.calc.periodLabel || "Calculando..."}
                            </p>
                        </div>
                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                            {filteredCalculations.length} colaboradores
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-700">
                            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-400">
                                <tr>
                                    <th className="py-3 px-4">Colaborador</th>
                                    <th className="py-3 px-4">Dpto / Puesto</th>
                                    <th className="py-3 px-4">Ingreso</th>
                                    <th className="py-3 px-4">Días</th>
                                    <th className="py-3 px-4 text-right">Sueldo Base</th>
                                    <th className="py-3 px-4 text-right">Devengado</th>
                                    <th className="py-3 px-4 text-right">Deducciones</th>
                                    <th className="py-3 px-4 text-right">Líquido</th>
                                    <th className="py-3 px-4 text-center">Estado</th>
                                    <th className="py-3 px-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                                {loadingEmps ? (
                                    <tr>
                                        <td colSpan={10} className="py-12 text-center text-slate-400">
                                            <div className="inline-flex items-center gap-2 font-bold">
                                                <RefreshCw size={18} className="animate-spin text-slate-500" />
                                                Cargando colaboradores y calculando prestaciones...
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredCalculations.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="py-12 text-center text-slate-400 font-bold">
                                            No se encontraron colaboradores con los filtros seleccionados.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCalculations.map(({ emp, calc, status }) => {
                                        const empId = emp.id || "";
                                        return (
                                            <tr key={empId} className="hover:bg-slate-50/80 transition-colors group">
                                                <td className="py-3.5 px-4 font-bold text-slate-900">
                                                    <p>{emp.first_name} {emp.last_name}</p>
                                                    <p className="text-[10px] text-slate-400 font-normal">DPI: {emp.dpi}</p>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <p className="text-slate-800">{emp.department || "General"}</p>
                                                    <p className="text-[10px] text-slate-400">{emp.position || "N/A"}</p>
                                                </td>
                                                <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                                                    {emp.hiring_date}
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-bold">{calc.daysWorked}</span>
                                                        {calc.isProportional ? (
                                                            <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-black">
                                                                Prop.
                                                            </span>
                                                        ) : (
                                                            <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                                                                365d
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                                                    Q {calc.baseSalary.toFixed(2)}
                                                </td>
                                                <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                                                    Q {calc.grossAmount.toFixed(2)}
                                                </td>
                                                <td className="py-3.5 px-4 text-right font-mono text-rose-600">
                                                    {calc.totalDeductions > 0 ? `- Q ${calc.totalDeductions.toFixed(2)}` : "Q 0.00"}
                                                </td>
                                                <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-700 text-sm">
                                                    Q {calc.netAmount.toFixed(2)}
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    <span
                                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                                            status === "Pagado"
                                                                ? "bg-emerald-100 text-emerald-800"
                                                                : "bg-amber-100 text-amber-800"
                                                        }`}
                                                    >
                                                        {status === "Pagado" ? (
                                                            <CheckCircle2 size={11} />
                                                        ) : (
                                                            <Clock size={11} />
                                                        )}
                                                        {status}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 text-right space-x-2">
                                                    <button
                                                        onClick={() => handleOpenPreview(emp, calc)}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all shadow-sm"
                                                        title="Ver e Imprimir Boleta"
                                                    >
                                                        <Printer size={13} className="text-slate-500" />
                                                        <span>Boleta</span>
                                                    </button>
                                                    <button
                                                        onClick={() => togglePaymentStatus(emp, calc)}
                                                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                                                            status === "Pagado"
                                                                ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                                                                : "bg-emerald-600 hover:bg-emerald-700 text-white"
                                                        }`}
                                                        title="Marcar / Desmarcar como Pagado"
                                                    >
                                                        {status === "Pagado" ? (
                                                            <>
                                                                <X size={13} />
                                                                <span>Desmarcar</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Check size={13} />
                                                                <span>Registrar Pago</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* MODAL DE VISTA PREVIA INDIVIDUAL */}
                {previewEmployee && previewCalc && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:p-0 print:bg-white print:static">
                        <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto print:max-h-none print:shadow-none print:rounded-none">
                            {/* Barra de control del modal */}
                            <div className="p-4 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur z-10 print:hidden">
                                <div className="flex items-center gap-2">
                                    <Award size={18} className="text-slate-900" />
                                    <span className="font-bold text-sm text-slate-900">
                                        Vista Previa de Boleta - {previewCalc.bonusTitle}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handlePrintCurrent}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white font-black text-xs hover:bg-slate-800 transition-all shadow"
                                    >
                                        <Printer size={15} />
                                        <span>Imprimir Boleta</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setPreviewEmployee(null);
                                            setPreviewCalc(null);
                                        }}
                                        className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Componente de la Boleta */}
                            <div className="p-6 md:p-8">
                                <AnnualBonusPayslip
                                    employee={previewEmployee}
                                    calc={previewCalc}
                                    companyName={company?.name || "Compañía Demostrativa"}
                                    companyNit={company?.nit || "C/F"}
                                    companyAddress={company?.address || "Ciudad de Guatemala"}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* CONTENEDOR DE IMPRESIÓN POR LOTE (BATCH PRINT) */}
                {isBatchPrinting && (
                    <div className="hidden print:block space-y-8">
                        {filteredCalculations.map(({ emp, calc }, idx) => (
                            <div key={emp.id || idx} className="print:break-after-page mb-8">
                                <AnnualBonusPayslip
                                    employee={emp}
                                    calc={calc}
                                    companyName={company?.name || "Compañía Demostrativa"}
                                    companyNit={company?.nit || "C/F"}
                                    companyAddress={company?.address || "Ciudad de Guatemala"}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
