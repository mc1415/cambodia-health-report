// Replace with your Supabase credentials
const SUPABASE_URL = 'https://xoohqmmszipymrivmtae.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhvb2hxbW1zemlweW1yaXZtdGFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxMzU2NjAsImV4cCI6MjA3MjcxMTY2MH0.P5Lz3k5SbHWXhYWXFjCSXkyfxjZrB7nsMPmkQhF9LvI';
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/get-national-reports`; // New function for national data

document.addEventListener('DOMContentLoaded', () => {
    const monthSelector = document.getElementById('month-selector');
    const yearSelector = document.getElementById('year-selector');
    const exportBtn = document.getElementById('export-btn');
    const printBtn = document.getElementById('print-btn');

    // Populate years dynamically
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= 2020; i--) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        yearSelector.appendChild(option);
    }
    yearSelector.value = currentYear;

    // Set initial month, then fetch data
    const defaultMonth = 'មករា';
    monthSelector.value = defaultMonth;

    // Fetch and display data on initial load
    fetchAndDisplayReports(yearSelector.value);

    // Add event listeners
    yearSelector.addEventListener('change', () => {
        const selectedYear = yearSelector.value;
        if (selectedYear) {
            fetchAndDisplayReports(selectedYear);
        }
    });

    monthSelector.addEventListener('change', () => {
        if (window.reportsData) {
            populateMonthlyTable(window.reportsData, monthSelector.value);
        }
    });

    exportBtn.addEventListener('click', () => {
        exportAllTablesToCsv();
    });

    printBtn.addEventListener('click', () => {
        window.print();
    });
});

async function fetchAndDisplayReports(year) {
    const url = `${FUNCTION_URL}?year=${year}`;
    const monthlyTableBody = document.getElementById('monthly-report-table').querySelector('tbody');
    const yearlyTableBody = document.getElementById('yearly-summary-table').querySelector('tbody');

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            }
        });
        
        monthlyTableBody.innerHTML = '';
        yearlyTableBody.innerHTML = '';

        if (response.ok) {
            const reports = await response.json();
            window.reportsData = reports; 
            if (reports && reports.length > 0) {
                populateMonthlyTable(reports, document.getElementById('month-selector').value);
                populateYearlySummaryTable(reports);
            }
        } else {
            console.error('Error fetching data:', response.status, await response.text());
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function populateMonthlyTable(reports, selectedMonth) {
    const tableBody = document.getElementById('monthly-report-table').querySelector('tbody');
    tableBody.innerHTML = '';

    const monthlyReport = reports.find(r => r.report_month === selectedMonth) || {};

    const reportTypes = [
        { desc: 'ឱសថស្ថាន', prefix: 'pharmacy_' },
        { desc: 'ឱសថស្ថានរង «ក»', prefix: 'sub_pharmacy_a_' },
        { 
            desc: 'ឱសថស្ថានរង «ខ»', 
            prefix: 'sub_pharmacy_b_',
            specialFields: {
                open: '-',
                renew_validity: 'renew',
                renew_changes: '-'
            }
        },
        { desc: 'អគារលក់ឱសថបុរាណ', prefix: 'herbal_' },
    ];
    
    reportTypes.forEach((type, index) => {
        const row = document.createElement('tr');
        const yearlyTotalEndOfMonth = reports.reduce((sum, report) => {
            const value = report[`${type.prefix}total_end_of_month`];
            return sum + (value !== null && value !== undefined ? value : 0);
        }, 0);
        
        let remainingStart = monthlyReport[`${type.prefix}remaining_start`] !== undefined ? monthlyReport[`${type.prefix}remaining_start`] : '';
        let open = monthlyReport[`${type.prefix}open`] !== undefined ? monthlyReport[`${type.prefix}open`] : '';
        let renewValidity = monthlyReport[`${type.prefix}renew_validity`] !== undefined ? monthlyReport[`${type.prefix}renew_validity`] : '';
        let renewChanges = monthlyReport[`${type.prefix}renew_changes`] !== undefined ? monthlyReport[`${type.prefix}renew_changes`] : '';
        let closed = monthlyReport[`${type.prefix}closed`] !== undefined ? monthlyReport[`${type.prefix}closed`] : '';
        let closedByMeasure = monthlyReport[`${type.prefix}closed_by_measure`] !== undefined ? monthlyReport[`${type.prefix}closed_by_measure`] : '';
        let penaltied = monthlyReport[`${type.prefix}penaltied`] !== undefined ? monthlyReport[`${type.prefix}penaltied`] : '';
        let totalEndOfMonth = monthlyReport[`${type.prefix}total_end_of_month`] !== undefined ? monthlyReport[`${type.prefix}total_end_of_month`] : '';

        if (type.specialFields) {
            open = type.specialFields.open;
            renewValidity = monthlyReport[`${type.prefix}${type.specialFields.renew_validity}`] !== undefined ? monthlyReport[`${type.prefix}${type.specialFields.renew_validity}`] : '';
            renewChanges = type.specialFields.renew_changes;
        }

        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${type.desc}</td>
            <td>${remainingStart}</td>
            <td>${open}</td>
            <td>${renewValidity}</td>
            <td>${renewChanges}</td>
            <td>${closed}</td>
            <td>${closedByMeasure}</td>
            <td>${penaltied}</td>
            <td>${totalEndOfMonth}</td>
            <td>${yearlyTotalEndOfMonth}</td>
        `;
        tableBody.appendChild(row);
    });
}

function populateYearlySummaryTable(reports) {
    const tableBody = document.getElementById('yearly-summary-table').querySelector('tbody');
    tableBody.innerHTML = '';

    const reportTypes = [
        { desc: 'ឱសថស្ថាន', prefix: 'pharmacy_' },
        { desc: 'ឱសថស្ថានរង «ក»', prefix: 'sub_pharmacy_a_' },
        { desc: 'ឱសថស្ថានរង «ខ»', prefix: 'sub_pharmacy_b_', specialFields: {open: '-', renew_validity: 'renew', renew_changes: '-'} },
        { desc: 'អគារលក់ឱសថបុរាណ', prefix: 'herbal_' },
    ];
    
    reportTypes.forEach((type, index) => {
        const row = document.createElement('tr');
        
        const yearlyTotals = reports.reduce((acc, report) => {
            acc.open = (acc.open || 0) + ((report[`${type.prefix}open`] !== null && report[`${type.prefix}open`] !== undefined) ? report[`${type.prefix}open`] : 0);
            acc.renew_validity = (acc.renew_validity || 0) + ((report[`${type.prefix}renew_validity`] !== null && report[`${type.prefix}renew_validity`] !== undefined) ? report[`${type.prefix}renew_validity`] : 0);
            acc.renew_changes = (acc.renew_changes || 0) + ((report[`${type.prefix}renew_changes`] !== null && report[`${type.prefix}renew_changes`] !== undefined) ? report[`${type.prefix}renew_changes`] : 0);
            acc.closed = (acc.closed || 0) + ((report[`${type.prefix}closed`] !== null && report[`${type.prefix}closed`] !== undefined) ? report[`${type.prefix}closed`] : 0);
            acc.closed_by_measure = (acc.closed_by_measure || 0) + ((report[`${type.prefix}closed_by_measure`] !== null && report[`${type.prefix}closed_by_measure`] !== undefined) ? report[`${type.prefix}closed_by_measure`] : 0);
            acc.penaltied = (acc.penaltied || 0) + ((report[`${type.prefix}penaltied`] !== null && report[`${type.prefix}penaltied`] !== undefined) ? report[`${type.prefix}penaltied`] : 0);

            if (type.specialFields) {
                acc.renew_validity = (acc.renew_validity || 0) + ((report[`${type.prefix}${type.specialFields.renew_validity}`] !== null && report[`${type.prefix}${type.specialFields.renew_validity}`] !== undefined) ? report[`${type.prefix}${type.specialFields.renew_validity}`] : 0);
            }
            return acc;
        }, {});
        
        let openCell = yearlyTotals.open;
        let renewValidityCell = yearlyTotals.renew_validity;
        let renewChangesCell = yearlyTotals.renew_changes;

        if (type.specialFields) {
            openCell = type.specialFields.open;
            renewChangesCell = type.specialFields.renew_changes;
        }

        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${type.desc}</td>
            <td>${openCell}</td>
            <td>${renewValidityCell}</td>
            <td>${renewChangesCell}</td>
            <td>${yearlyTotals.closed}</td>
            <td>${yearlyTotals.closed_by_measure}</td>
            <td>${yearlyTotals.penaltied}</td>
        `;
        tableBody.appendChild(row);
    });
}

function exportAllTablesToCsv() {
    const year = document.getElementById('year-selector').value;
    const filename = `របាយការណ៍_ថ្នាក់ជាតិ_${year}.csv`;

    let csvString = '';
    
    const monthlyTable = document.getElementById('monthly-report-table');
    csvString += `\n"របាយការណ៍ប្រចាំខែ"\n`;
    csvString += getTableCsv(monthlyTable) + '\n';

    const yearlySummaryTable = document.getElementById('yearly-summary-table');
    csvString += `\n"ចំនួនសរុបប្រចាំឆ្នាំតាមប្រភេទនៃសកម្មភាព"\n`;
    csvString += getTableCsv(yearlySummaryTable) + '\n';

    const bom = "\uFEFF";
    const blob = new Blob([bom + csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

function getTableCsv(table) {
    let csvString = '';
    
    const headers = Array.from(table.querySelectorAll('thead th'))
        .map(th => `"${th.textContent.trim()}"`)
        .join(',');
    csvString += headers + '\n';

    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
        const rowData = Array.from(row.querySelectorAll('td'))
            .map(td => `"${td.textContent.trim()}"`)
            .join(',');
        csvString += rowData + '\n';
    });

    return csvString;
}
