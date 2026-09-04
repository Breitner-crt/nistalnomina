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

/**
 * Módulo de Prestaciones Anuales (Aguinaldo - Dec. 76-78 y Bono 14 - Dec. 42-92)
 */
export interface AnnualBonusInput {
    bonusType: 'aguinaldo' | 'bono14';
    baseSalary: number;
    hiringDate: string | Date;
    year: number; // Ej: 2025
    paymentMode?: '100%' | '50%_primera' | '50%_segunda';
    advances?: number;
    judicialRetentions?: number;
}

export interface AnnualBonusCalculation {
    bonusType: 'aguinaldo' | 'bono14';
    bonusTitle: string;
    decreeText: string;
    periodStart: string; // YYYY-MM-DD
    periodEnd: string;   // YYYY-MM-DD
    periodLabel: string; // "01/12/2024 al 30/11/2025"
    daysInPeriod: number;
    daysWorked: number;
    isProportional: boolean;
    baseSalary: number;
    fullAnnualBonus: number;
    grossAmount: number;
    advances: number;
    judicialRetentions: number;
    totalDeductions: number;
    netAmount: number;
    amountInWords: string;
    paymentMode: '100%' | '50%_primera' | '50%_segunda';
    paymentModeLabel: string;
}

/**
 * Convierte un valor numérico a texto en Quetzales (para boleta legal)
 */
export function numberToQuetzalesWords(amount: number): string {
    if (isNaN(amount) || amount < 0) return 'CERO QUETZALES CON 00/100';

    const units = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
    const teens = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
    const tens = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    const hundreds = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

    const intPart = Math.floor(amount);
    const decimalPart = Math.round((amount - intPart) * 100);
    const centsStr = decimalPart < 10 ? `0${decimalPart}` : `${decimalPart}`;

    function convertGroup(n: number): string {
        if (n === 0) return '';
        if (n === 100) return 'CIEN';

        let output = '';
        const h = Math.floor(n / 100);
        const t = Math.floor((n % 100) / 10);
        const u = n % 10;

        if (h > 0) output += hundreds[h] + ' ';

        if (t === 1) {
            output += teens[u] + ' ';
        } else if (t === 2) {
            if (u === 0) output += 'VEINTE ';
            else output += 'VEINTI' + units[u] + ' ';
        } else if (t > 2) {
            output += tens[t];
            if (u > 0) output += ' Y ' + units[u];
            output += ' ';
        } else if (u > 0) {
            output += units[u] + ' ';
        }

        return output.trim();
    }

    if (intPart === 0) {
        return `CERO QUETZALES CON ${centsStr}/100`;
    }

    let words = '';
    const millions = Math.floor(intPart / 1000000);
    const thousands = Math.floor((intPart % 1000000) / 1000);
    const remainder = intPart % 1000;

    if (millions > 0) {
        if (millions === 1) words += 'UN MILLON ';
        else words += convertGroup(millions) + ' MILLONES ';
    }

    if (thousands > 0) {
        if (thousands === 1) words += 'MIL ';
        else words += convertGroup(thousands) + ' MIL ';
    }

    if (remainder > 0) {
        words += convertGroup(remainder) + ' ';
    }

    return `${words.trim()} QUETZALES CON ${centsStr}/100`;
}

/**
 * Calcula Aguinaldo o Bono 14 conforme a las leyes laborales de Guatemala
 */
export function calculateAnnualBonus(input: AnnualBonusInput): AnnualBonusCalculation {
    const {
        bonusType,
        baseSalary,
        hiringDate,
        year,
        paymentMode = '100%',
        advances = 0,
        judicialRetentions = 0
    } = input;

    const hireDateObj = typeof hiringDate === 'string' ? new Date(hiringDate + 'T00:00:00') : new Date(hiringDate);

    let periodStartObj: Date;
    let periodEndObj: Date;
    let bonusTitle: string;
    let decreeText: string;

    if (bonusType === 'aguinaldo') {
        // Decreto 76-78: 1 de diciembre (año ant.) al 30 de noviembre (año act.)
        periodStartObj = new Date(year - 1, 11, 1); // 1 dic año ant.
        periodEndObj = new Date(year, 10, 30);      // 30 nov año act.
        bonusTitle = 'AGUINALDO';
        decreeText = 'Decreto 76-78 del Congreso de la República';
    } else {
        // Decreto 42-92: 1 de julio (año ant.) al 30 de junio (año act.)
        periodStartObj = new Date(year - 1, 6, 1);  // 1 jul año ant.
        periodEndObj = new Date(year, 5, 30);       // 30 jun año act.
        bonusTitle = 'BONO 14';
        decreeText = 'Decreto 42-92 del Congreso de la República';
    }

    // Días totales del período legal
    const msInDay = 1000 * 60 * 60 * 24;
    const daysInPeriod = Math.round((periodEndObj.getTime() - periodStartObj.getTime()) / msInDay) + 1;

    // Días laborados por el colaborador
    let daysWorked = 0;
    let isProportional = false;

    if (hireDateObj <= periodStartObj) {
        // Antigüedad mayor al período: período completo
        daysWorked = daysInPeriod;
        isProportional = false;
    } else if (hireDateObj > periodEndObj) {
        // Ingresó después del cierre del período
        daysWorked = 0;
        isProportional = true;
    } else {
        // Ingresó durante el período: cálculo proporcional
        daysWorked = Math.round((periodEndObj.getTime() - hireDateObj.getTime()) / msInDay) + 1;
        isProportional = true;
    }

    // Monto 100% de la prestación
    const fullAnnualBonus = daysWorked > 0 ? (baseSalary / daysInPeriod) * daysWorked : 0;

    // Modalidad de pago (100% o 50% de Aguinaldo)
    let grossAmount = fullAnnualBonus;
    let paymentModeLabel = 'Pago 100% (Total)';

    if (paymentMode === '50%_primera') {
        grossAmount = fullAnnualBonus * 0.5;
        paymentModeLabel = '50% Primera Entrega (Diciembre)';
    } else if (paymentMode === '50%_segunda') {
        grossAmount = fullAnnualBonus * 0.5;
        paymentModeLabel = '50% Segunda Entrega (Enero)';
    }

    const totalDeductions = advances + judicialRetentions;
    const netAmount = Math.max(0, grossAmount - totalDeductions);
    const amountInWords = numberToQuetzalesWords(netAmount);

    const pad = (n: number) => n < 10 ? `0${n}` : `${n}`;
    const formatDate = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    const formatISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    return {
        bonusType,
        bonusTitle,
        decreeText,
        periodStart: formatISO(periodStartObj),
        periodEnd: formatISO(periodEndObj),
        periodLabel: `${formatDate(periodStartObj)} al ${formatDate(periodEndObj)}`,
        daysInPeriod,
        daysWorked,
        isProportional,
        baseSalary,
        fullAnnualBonus: Number(fullAnnualBonus.toFixed(2)),
        grossAmount: Number(grossAmount.toFixed(2)),
        advances: Number(advances.toFixed(2)),
        judicialRetentions: Number(judicialRetentions.toFixed(2)),
        totalDeductions: Number(totalDeductions.toFixed(2)),
        netAmount: Number(netAmount.toFixed(2)),
        amountInWords,
        paymentMode,
        paymentModeLabel
    };
}

