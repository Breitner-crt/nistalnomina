/**
 * NistalNomina - Core Payroll Engine (Guatemala)
 * Logic for calculating salaries, deductions, and employer contributions.
 */

export interface PayrollInput {
    baseSalary: number;
    overtimeHours: number;
    commissions: number;
    bonuses: number;
    loans: number;
    advances: number;
    absences: number;
}

export interface PayrollResults {
    baseSalaryEarned: number;
    overtimePay: number;
    bonificacionIncentivo: number;
    commissions: number;
    otherBonuses: number;
    grossSalary: number;
    igssLaboral: number;
    isrRetencion: number;
    loans: number;
    advances: number;
    absenceDeduction: number;
    totalDeductions: number;
    netSalary: number;
    // Employer loads
    igssPatronal: number;
    irtra: number;
    intecap: number;
    totalEmployerCost: number;
}

export const GUATEMALA_CONSTANTS = {
    IGSS_LABORAL_RATE: 0.0483,
    IGSS_PATRONAL_RATE: 0.1067,
    IRTRA_RATE: 0.01,
    INTECAP_RATE: 0.01,
    BONIFICACION_INCENTIVO: 250.00,
    MAX_ISR_5_PERCENT: 300000,
};

/**
 * Calculates ISR Retención (Simplified for monthly projection)
 * Note: This is an approximation. Real ISR requires annual projection.
 */
export function calculateISR(monthlyTaxableIncome: number): number {
    const annualIncome = monthlyTaxableIncome * 12;
    const standardDeduction = 48000; // Gastos personales sin comprobantes
    const igssDeduction = annualIncome * GUATEMALA_CONSTANTS.IGSS_LABORAL_RATE;

    const taxableAnnual = annualIncome - standardDeduction - igssDeduction;

    if (taxableAnnual <= 0) return 0;

    let annualISR = 0;
    if (taxableAnnual <= 300000) {
        annualISR = taxableAnnual * 0.05;
    } else {
        annualISR = 15000 + (taxableAnnual - 300000) * 0.07;
    }

    return annualISR / 12;
}

export function calculatePayroll(input: PayrollInput): PayrollResults {
    const { baseSalary, overtimeHours, commissions, bonuses, loans, advances, absences } = input;

    // 1. Calculate Overtime (Base / 30 / 8 * 1.5 per hour)
    const dailyRate = baseSalary / 30;
    const hourlyRate = dailyRate / 8;
    const overtimePay = overtimeHours * hourlyRate * 1.5;

    // 2. Absence Deduction
    const absenceDeduction = dailyRate * absences;
    const baseSalaryEarned = baseSalary - absenceDeduction;

    // 3. Gross Salary (Sujeto a IGSS)
    // Bonificación Incentivo is NOT subject to IGSS or ISR usually, but let's calculate IGSS first
    const salarySubjectToIGSS = baseSalaryEarned + overtimePay + commissions + bonuses;

    const igssLaboral = salarySubjectToIGSS * GUATEMALA_CONSTANTS.IGSS_LABORAL_RATE;

    // 3. ISR (Taxable income = Gross - IGSS - Social Security)
    // Note: Bonificación Incentivo (Q250) is exempt from ISR
    const isrRetencion = calculateISR(salarySubjectToIGSS);

    const totalDeductions = igssLaboral + isrRetencion + loans + advances;

    const netSalary = (salarySubjectToIGSS + GUATEMALA_CONSTANTS.BONIFICACION_INCENTIVO) - totalDeductions;

    // 4. Employer Loads
    const igssPatronal = salarySubjectToIGSS * GUATEMALA_CONSTANTS.IGSS_PATRONAL_RATE;
    const irtra = salarySubjectToIGSS * GUATEMALA_CONSTANTS.IRTRA_RATE;
    const intecap = salarySubjectToIGSS * GUATEMALA_CONSTANTS.INTECAP_RATE;

    return {
        baseSalaryEarned,
        overtimePay,
        bonificacionIncentivo: GUATEMALA_CONSTANTS.BONIFICACION_INCENTIVO,
        commissions,
        otherBonuses: bonuses,
        grossSalary: salarySubjectToIGSS + GUATEMALA_CONSTANTS.BONIFICACION_INCENTIVO,
        igssLaboral,
        isrRetencion,
        loans,
        advances,
        absenceDeduction,
        totalDeductions,
        netSalary,
        igssPatronal,
        irtra,
        intecap,
        totalEmployerCost: igssPatronal + irtra + intecap
    };
}

/**
 * Severance calculations (Indemnización, Aguinaldo, Bono 14, Vacaciones)
 * Following Guatemalan labor laws.
 */
export function calculateSeverance(
    avgSalary6Months: number,
    hiringDate: Date,
    leavingDate: Date,
    includesIndemnizacion: boolean = true
) {
    const timeDiff = leavingDate.getTime() - hiringDate.getTime();
    const daysWorked = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const yearsWorked = daysWorked / 365.25;

    // 1. Indemnización (1 month per year + Aguinaldo/Bono14 factor)
    // Basis for Indemnización is (Salary * 14 / 12) 
    const indemnizacionBasis = (avgSalary6Months * 14) / 12;
    const indemnizacion = includesIndemnizacion ? indemnizacionBasis * yearsWorked : 0;

    // 2. Aguinaldo (Dec 1 to Dec 1)
    const currentYear = leavingDate.getFullYear();
    let aguinaldoStart = new Date(currentYear, 11, 1); // Dec 1
    if (leavingDate < aguinaldoStart) {
        aguinaldoStart = new Date(currentYear - 1, 11, 1);
    }
    const aguinaldoDays = Math.floor((leavingDate.getTime() - aguinaldoStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const aguinaldo = (avgSalary6Months / 365.25) * aguinaldoDays;

    // 3. Bono 14 (July 1 to June 30)
    let bono14Start = new Date(currentYear, 6, 1); // July 1
    if (leavingDate < bono14Start) {
        bono14Start = new Date(currentYear - 1, 6, 1);
    }
    const bono14Days = Math.floor((leavingDate.getTime() - bono14Start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const bono14 = (avgSalary6Months / 365.25) * bono14Days;

    // 4. Vacaciones (15 days per year)
    const lastAnniversary = new Date(hiringDate);
    lastAnniversary.setFullYear(currentYear);
    if (lastAnniversary > leavingDate) {
        lastAnniversary.setFullYear(currentYear - 1);
    }
    const vacyDays = Math.floor((leavingDate.getTime() - lastAnniversary.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const vacaciones = (avgSalary6Months / 30 * 15 / 365.25) * vacyDays;

    const totalLiquidacion = indemnizacion + aguinaldo + bono14 + vacaciones;

    return {
        daysWorked,
        yearsWorked: yearsWorked.toFixed(2),
        indemnizacion,
        aguinaldo,
        bono14,
        vacaciones,
        totalLiquidacion
    };
}
