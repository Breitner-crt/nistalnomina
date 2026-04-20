/**
 * Utility to export data to Excel (CSV format for maximum compatibility and no dependencies)
 * This format is easily opened by Excel and Google Sheets.
 */

export function exportToCSV(data: any[], filename: string) {
    if (data.length === 0) return;

    // Header
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','), // CSV header row
        ...data.map(row =>
            headers.map(header => {
                let cell = row[header] === null || row[header] === undefined ? '' : row[header];

                // Special handling for DPI or Afiliado to prevent scientific notation in Excel
                const isIdField = header.toUpperCase().includes('DPI') || header.toUpperCase().includes('AFILIADO');
                if (isIdField && cell !== '') {
                    return `="${cell}"`;
                }

                // Handle strings with commas
                if (typeof cell === 'string' && cell.includes(',')) {
                    cell = `"${cell}"`;
                }
                return cell;
            }).join(',')
        )
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

/**
 * Specifically format payroll data for the IGSS load file (Electronic Spreadsheet)
 * This is a highly requested feature for Guatemalan companies.
 */
export function exportToIGSS(employees: any[], period: string) {
    // IGSS expected format (Simplified example)
    const igssData = employees.map(emp => ({
        'Tipo Registro': '01',
        'DPI/Afiliado': emp.dpi || emp.igss_number,
        'Nombre Completo': `${emp.first_name} ${emp.last_name}`,
        'Sueldo Devengado': emp.grossSalary.toFixed(2),
        'Dias Laborados': 30,
        'Bonificacion Incentivo': 250.00.toFixed(2),
        'Estado': 'Activo'
    }));

    exportToCSV(igssData, `Carga_IGSS_${period.replace(' ', '_')}`);
}
