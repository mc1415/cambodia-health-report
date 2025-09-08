// Replace with your Supabase credentials
const SUPABASE_URL = 'https://xoohqmmszipymrivmtae.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhvb2hxbW1zemlweW1yaXZtdGFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxMzU2NjAsImV4cCI6MjA3MjcxMTY2MH0.P5Lz3k5SbHWXhYWXFjCSXkyfxjZrB7nsMPmkQhF9LvI';
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/get-monthly-report`;

document.addEventListener('DOMContentLoaded', () => {
    const provinceSelector = document.getElementById('province-selector');
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

    // Set initial province and month, then fetch data
    const defaultProvince = 'Phnom Penh';
    const defaultMonth = 'មករា';
    provinceSelector.value = defaultProvince;
    monthSelector.value = defaultMonth;

    // Fetch and display data on initial load
    fetchAndDisplayReports(provinceSelector.value, yearSelector.value);

    // Add event listeners
    provinceSelector.addEventListener('change', () => {
        fetchAndDisplayReports(provinceSelector.value, yearSelector.value);
    });

    yearSelector.addEventListener('change', () => {
        fetchAndDisplayReports(provinceSelector.value, yearSelector.value);
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

async function fetchAndDisplayReports(province, year) {
    const url = `${FUNCTION_URL}?province=${province}&year=${year}`;
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

const display = (val) => val ?? '';

function populateMonthlyTable(reports, selectedMonth) {
    const tableBody = document.getElementById('monthly-report-table').querySelector('tbody');
    tableBody.innerHTML = '';

    const monthlyReport = reports.find(r => r.report_month === selectedMonth) || {};
    const decemberReport = reports.find(r => r.report_month === 'ធ្នូ') || {};

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
        const p = type.prefix;
        
        const yearlyTotal = decemberReport[`${p}total_end_of_month`] ?? '';
        
        let openCell = display(monthlyReport[`${p}open`]);
        let renewValidityCell = display(monthlyReport[`${p}renew_validity`]);
        let renewChangesCell = display(monthlyReport[`${p}renew_changes`]);
        
        if (type.specialFields) {
            openCell = type.specialFields.open;
            renewValidityCell = display(monthlyReport[`${p}${type.specialFields.renew_validity}`]);
            renewChangesCell = type.specialFields.renew_changes;
        }

        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${type.desc}</td>
            <td>${display(monthlyReport[`${p}remaining_start`])}</td>
            <td>${openCell}</td>
            <td>${renewValidityCell}</td>
            <td>${renewChangesCell}</td>
            <td>${display(monthlyReport[`${p}closed`])}</td>
            <td>${display(monthlyReport[`${p}closed_by_measure`])}</td>
            <td>${display(monthlyReport[`${p}penaltied`])}</td>
            <td>${display(monthlyReport[`${p}total_end_of_month`])}</td>
            <td>${yearlyTotal}</td>
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
        const p = type.prefix;
        
        const yearlyTotals = reports.reduce((acc, report) => {
            acc.open = (acc.open || 0) + (report[`${p}open`] || 0);
            acc.renew_validity = (acc.renew_validity || 0) + (report[`${p}renew_validity`] || 0);
            acc.renew_special = (acc.renew_special || 0) + (report[`${p}renew`] || 0);
            acc.renew_changes = (acc.renew_changes || 0) + (report[`${p}renew_changes`] || 0);
            acc.closed = (acc.closed || 0) + (report[`${p}closed`] || 0);
            acc.closed_by_measure = (acc.closed_by_measure || 0) + (report[`${p}closed_by_measure`] || 0);
            acc.penaltied = (acc.penaltied || 0) + (report[`${p}penaltied`] || 0);
            return acc;
        }, {});
        
        let openCell = yearlyTotals.open ?? 0;
        let renewValidityCell = yearlyTotals.renew_validity ?? 0;
        let renewChangesCell = yearlyTotals.renew_changes ?? 0;

        if (type.specialFields) {
            openCell = type.specialFields.open;
            renewValidityCell = yearlyTotals.renew_special ?? 0;
            renewChangesCell = type.specialFields.renew_changes;
        }

        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${type.desc}</td>
            <td>${openCell}</td>
            <td>${renewValidityCell}</td>
            <td>${renewChangesCell}</td>
            <td>${yearlyTotals.closed ?? 0}</td>
            <td>${yearlyTotals.closed_by_measure ?? 0}</td>
            <td>${yearlyTotals.penaltied ?? 0}</td>
        `;
        tableBody.appendChild(row);
    });
}

function exportAllTablesToCsv() {
    const province = document.getElementById('province-selector').value;
    const year = document.getElementById('year-selector').value;
    const filename = `របាយការណ៍_${province}_${year}.csv`;

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