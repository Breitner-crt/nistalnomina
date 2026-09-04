"use client";

import { Employee } from "@/lib/supabase";
import { AnnualBonusCalculation } from "@/lib/payroll-engine";
import { Award, Calendar } from "lucide-react";

interface AnnualBonusPayslipProps {
    employee: Employee;
    calc: AnnualBonusCalculation;
    companyName: string;
    companyNit?: string;
    companyAddress?: string;
}

export default function AnnualBonusPayslip({
    employee,
    calc,
    companyName,
    companyNit = "C/F",
    companyAddress = "Ciudad de Guatemala"
}: AnnualBonusPayslipProps) {
    const isAguinaldo = calc.bonusType === "aguinaldo";

    return (
        <div className="bg-white p-8 md:p-10 max-w-4xl mx-auto border border-slate-200 shadow-sm rounded-2xl print:shadow-none print:border-slate-400 print:rounded-none print:p-6 print:m-0 font-sans text-slate-900 break-inside-avoid">
            {/* Header Institucional */}
            <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-slate-900 pb-5 mb-6 gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="bg-slate-900 text-white w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm print:bg-slate-900">
                            N
                        </div>
                        <h1 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">
                            {companyName}
                        </h1>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                        NIT: {companyNit} | {companyAddress}
                    </p>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-700 mt-1">
                        <Award size={12} className={isAguinaldo ? "text-amber-600" : "text-emerald-600"} />
                        <span>BOLETA OFICIAL DE PAGO - {calc.bonusTitle}</span>
                    </div>
                </div>

                <div className="text-left sm:text-right w-full sm:w-auto">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 inline-block w-full sm:w-auto">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                            Base Legal
                        </span>
                        <span className="text-xs font-bold text-slate-800 block">
                            {calc.decreeText}
                        </span>
                        <span className="text-[11px] text-slate-500 font-semibold mt-1 block">
                            Modalidad: <strong className="text-slate-800">{calc.paymentModeLabel}</strong>
                        </span>
                    </div>
                </div>
            </div>

            {/* Ficha del Trabajador y Período */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs">
                <div className="space-y-1.5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        Datos del Colaborador
                    </p>
                    <p className="text-base font-black text-slate-900">
                        {employee.first_name} {employee.last_name}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-slate-600">
                        <div>
                            <span className="font-bold text-slate-500">DPI:</span> {employee.dpi}
                        </div>
                        <div>
                            <span className="font-bold text-slate-500">NIT:</span> {employee.nit || "C/F"}
                        </div>
                        <div>
                            <span className="font-bold text-slate-500">No. IGSS:</span> {employee.igss_number || "N/A"}
                        </div>
                        <div>
                            <span className="font-bold text-slate-500">Puesto:</span> {employee.position || "Colaborador"}
                        </div>
                    </div>
                </div>

                <div className="space-y-1.5 md:border-l md:border-slate-200 md:pl-5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        Cómputo Legal del Período
                    </p>
                    <div className="flex items-center gap-2 text-slate-800 font-bold">
                        <Calendar size={14} className="text-slate-400" />
                        <span>{calc.periodLabel}</span>
                    </div>
                    <div className="space-y-1 text-slate-600 mt-2">
                        <p>
                            <span className="font-bold text-slate-500">Fecha de Ingreso:</span> {employee.hiring_date}
                        </p>
                        <p>
                            <span className="font-bold text-slate-500">Días Computados:</span>{" "}
                            <strong className="text-slate-900">{calc.daysWorked} de {calc.daysInPeriod} días</strong>{" "}
                            {calc.isProportional ? (
                                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
                                    (Proporcional)
                                </span>
                            ) : (
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                                    (Año Completo)
                                </span>
                            )}
                        </p>
                        <p>
                            <span className="font-bold text-slate-500">Sueldo Base Mensual:</span>{" "}
                            <span className="font-mono font-bold text-slate-800">Q {calc.baseSalary.toFixed(2)}</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Desglose Económico */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Ingresos Devengados */}
                <div className="border border-slate-200 rounded-xl p-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                            Ingresos Devengados
                        </h3>
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded">
                            Exento de IGSS
                        </span>
                    </div>
                    <div className="space-y-2.5 text-xs">
                        <div className="flex justify-between items-center text-slate-700">
                            <span>{calc.bonusTitle} (Cálculo 100%)</span>
                            <span className="font-mono font-bold text-slate-800">
                                Q {calc.fullAnnualBonus.toFixed(2)}
                            </span>
                        </div>
                        {calc.paymentMode !== "100%" && (
                            <div className="flex justify-between items-center text-amber-700 font-medium">
                                <span>Porcentaje aplicable ({calc.paymentModeLabel})</span>
                                <span className="font-mono font-bold">50%</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center border-t border-slate-100 pt-2 text-slate-900 font-black">
                            <span>Subtotal Devengado</span>
                            <span className="font-mono text-sm text-emerald-700">
                                Q {calc.grossAmount.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Deducciones */}
                <div className="border border-slate-200 rounded-xl p-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                            Deducciones y Descuentos
                        </h3>
                        <span className="text-[10px] text-slate-400 font-semibold">
                            Autorizadas
                        </span>
                    </div>
                    <div className="space-y-2.5 text-xs">
                        <div className="flex justify-between items-center text-slate-700">
                            <span>Anticipos Concedidos</span>
                            <span className="font-mono font-bold text-rose-600">
                                {calc.advances > 0 ? `- Q ${calc.advances.toFixed(2)}` : "Q 0.00"}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-slate-700">
                            <span>Embargos / Retenciones Judiciales</span>
                            <span className="font-mono font-bold text-rose-600">
                                {calc.judicialRetentions > 0 ? `- Q ${calc.judicialRetentions.toFixed(2)}` : "Q 0.00"}
                            </span>
                        </div>
                        <div className="flex justify-between items-center border-t border-slate-100 pt-2 text-slate-900 font-black">
                            <span>Total Descuentos</span>
                            <span className="font-mono text-sm text-rose-700">
                                - Q {calc.totalDeductions.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Total Líquido */}
            <div className="bg-slate-900 text-white rounded-xl p-5 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                        Total Líquido a Recibir
                    </span>
                    <span className="text-xs text-slate-300 font-medium italic block mt-0.5">
                        SON: {calc.amountInWords}
                    </span>
                </div>
                <div className="text-right flex-shrink-0">
                    <span className="text-3xl font-black font-mono text-emerald-400 tracking-tight">
                        Q {calc.netAmount.toFixed(2)}
                    </span>
                </div>
            </div>

            {/* Finiquito Legal y Firmas */}
            <div className="border-t border-slate-200 pt-5 text-[10px] text-slate-500 leading-relaxed">
                <p className="text-center font-medium">
                    Hago constar que recibo de <strong className="text-slate-800">{companyName}</strong> la cantidad neta
                    arriba descrita a mi entera satisfacción y de conformidad con el {calc.decreeText}, correspondiente al período computado,
                    sin que a la fecha se me adeude cantidad alguna por este concepto.
                </p>

                <div className="flex justify-around items-end pt-12 pb-2 gap-8">
                    <div className="w-56 text-center">
                        <div className="border-t-2 border-slate-400 pt-2 font-black text-slate-800 text-[11px]">
                            FIRMA DEL COLABORADOR
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">DPI: {employee.dpi}</p>
                    </div>

                    <div className="w-56 text-center">
                        <div className="border-t-2 border-slate-400 pt-2 font-black text-slate-800 text-[11px]">
                            SELLO Y FIRMA PATRONAL
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{companyName}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
