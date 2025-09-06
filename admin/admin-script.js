// Replace with your Supabase credentials
const SUPABASE_URL = 'https://xoohqmmszipymrivmtae.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhvb2hxbW1zemlweW1yaXZtdGFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxMzU2NjAsImV4cCI6MjA3MjcxMTY2MH0.P5Lz3k5SbHWXhYWXFjCSXkyfxjZrB7nsMPmkQhF9LvI';
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/get-reports`;

const isLoggedIn = localStorage.getItem('isLoggedIn');
if (isLoggedIn !== 'true') {
    // If not logged in, redirect to the login page
    window.location.href = 'index.html';
}


// Supabase client creation function (to be included in your script.js)
function createClient(supabaseUrl, supabaseKey) {
    return {
        from: (tableName) => ({
            select: (columns) => {
                let url = `${supabaseUrl}/rest/v1/${tableName}?select=${columns}`;
                return {
                    eq: (column, value) => {
                        url += `&${column}=eq.${value}`;
                        return this;
                    },
                    order: (column, options) => {
                        url += `&order=${column}.${options.ascending ? 'asc' : 'desc'}`;
                        return this;
                    },
                    get data() {
                        const headers = {
                            'apikey': supabaseKey,
                            'Authorization': `Bearer ${supabaseKey}`
                        };
                        return fetch(url, { headers })
                            .then(response => response.json().then(data => ({
                                data: response.ok ? data : null,
                                error: response.ok ? null : data
                            })));
                    }
                };
            }
        })
    };
}

document.addEventListener('DOMContentLoaded', () => {
    const provinceSelector = document.getElementById('province-selector');
    const exportBtn = document.getElementById('export-btn');
    const printBtn = document.getElementById('print-btn');

    // Add a click event listener to the export button
    exportBtn.addEventListener('click', () => {
        exportAllTablesToCsv();
    });

    printBtn.addEventListener('click', () => {
        window.print();
    });

    const defaultProvince = 'Phnom Penh';
    provinceSelector.value = defaultProvince;
    fetchAndDisplayReports(defaultProvince);

    provinceSelector.addEventListener('change', () => {
        const selectedProvince = provinceSelector.value;
        if (selectedProvince) {
            fetchAndDisplayReports(selectedProvince);
        }
    });
});

function exportAllTablesToCsv() {
    const province = document.getElementById('province-selector').value;
    const filename = `របាយការណ៍_${province}_${new Date().getFullYear()}.csv`;

    let csvString = '';
    
    const tables = [
        { id: 'reports-table-1', title: 'របាយការណ៍ឱសថស្ថាន' },
        { id: 'reports-table-2', title: 'របាយការណ៍តាមដាន ចំនួនឱសថស្ថានរង «ក»' },
        { id: 'reports-table-3', title: 'របាយការណ៍តាមដាន ចំនួនឱសថស្ថានរង «ខ»' },
        { id: 'reports-table-4', title: 'របាយការណ៍តាមដាន ចំនួនអគារលក់ឱសថបុរាណ' }
    ];

    tables.forEach(tableInfo => {
        const table = document.getElementById(tableInfo.id);
        if (!table) return;

        // Add table title as a header row
        csvString += `\n"${tableInfo.title}"\n`;

        // Get table headers
        const headers = Array.from(table.querySelectorAll('thead th'))
            .map(th => `"${th.textContent.trim()}"`)
            .join(',');
        csvString += headers + '\n';

        // Get table data
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const rowData = Array.from(row.querySelectorAll('td'))
                .map(td => `"${td.textContent.trim()}"`)
                .join(',');
            csvString += rowData + '\n';
        });
    });

    // Create a Blob with UTF-8 encoding and the BOM
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


// Main function to fetch and display data
async function fetchAndDisplayReports(province) {
    const url = `${FUNCTION_URL}?province=${province}`;
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            }
        });

        if (response.ok) {
            const reports = await response.json();
            if (reports) {
                populateTables(reports);
            }
        } else {
            console.error('Error fetching data:', response.statusText);
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function populateTables(reports) {
    const months = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];

    // Helper function to create table rows
    function createRow(tableBody, index, description, values) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index}</td>
            <td style="text-align: left;">${description}</td>
            ${months.map(month => `<td>${values[month] || ''}</td>`).join('')}
            <td>${Object.values(values).reduce((a, b) => (a || 0) + (b || 0), 0) || ''}</td>
        `;
        tableBody.appendChild(row);
    }

    // Helper function to get monthly data for a specific field
    function getMonthlyData(reports, fieldName) {
        const data = {};
        months.forEach(month => {
            const report = reports.find(r => r.report_month === month);
            if (report) {
                data[month] = report[fieldName];
            }
        });
        return data;
    }

    // Clear all table bodies
    document.querySelectorAll('tbody').forEach(tbody => tbody.innerHTML = '');

    // Populate Pharmacy table
    const pharmacyBody = document.getElementById('reports-body-1');
    createRow(pharmacyBody, 1, 'ចំនួននៅសល់ដើមខែ', getMonthlyData(reports, 'pharmacy_remaining_start'));
    createRow(pharmacyBody, 2, 'ចំនួនបើកថ្មី', getMonthlyData(reports, 'pharmacy_open'));
    createRow(pharmacyBody, 3, 'ចំនួនបិទ សរុប', getMonthlyData(reports, 'pharmacy_closed'));
    createRow(pharmacyBody, 4, 'ចំនួនបិទ ដោយវិធានការ', getMonthlyData(reports, 'pharmacy_closed_by_measure'));
    createRow(pharmacyBody, 5, 'សរុបចំនួនចុងខែ', getMonthlyData(reports, 'pharmacy_total_end_of_month'));
    createRow(pharmacyBody, 6, 'ចំនួនបន្តសុពលភាព', getMonthlyData(reports, 'pharmacy_renew_validity'));
    createRow(pharmacyBody, 7, 'ចំនួនប្តូរឱសថការី ប្តូរម្ចាស់ទុន ប្តូរទីតាំង', getMonthlyData(reports, 'pharmacy_renew_changes'));
    createRow(pharmacyBody, 8, 'ចំនួនពិន័យអន្តរការណ៍', getMonthlyData(reports, 'pharmacy_penaltied'));

    // Populate Sub-Pharmacy A table
    const subPharmacyABody = document.getElementById('reports-body-2');
    createRow(subPharmacyABody, 1, 'ចំនួននៅសល់ដើមខែ', getMonthlyData(reports, 'sub_pharmacy_a_remaining_start'));
    createRow(subPharmacyABody, 2, 'ចំនួនបើកថ្មី', getMonthlyData(reports, 'sub_pharmacy_a_open'));
    createRow(subPharmacyABody, 3, 'ចំនួនបិទ សរុប', getMonthlyData(reports, 'sub_pharmacy_a_closed'));
    createRow(subPharmacyABody, 4, 'ចំនួនបិទ ដោយវិធានការ', getMonthlyData(reports, 'sub_pharmacy_a_closed_by_measure'));
    createRow(subPharmacyABody, 5, 'សរុបចំនួនចុងខែ', getMonthlyData(reports, 'sub_pharmacy_a_total_end_of_month'));
    createRow(subPharmacyABody, 6, 'ចំនួនបន្តសុពលភាព', getMonthlyData(reports, 'sub_pharmacy_a_renew_validity'));
    createRow(subPharmacyABody, 7, 'ចំនួនប្តូរឱសថការី ប្តូរម្ចាស់ទុន ប្តូរទីតាំង', getMonthlyData(reports, 'sub_pharmacy_a_renew_changes'));
    createRow(subPharmacyABody, 8, 'ចំនួនពិន័យអន្តរការណ៍', getMonthlyData(reports, 'sub_pharmacy_a_penaltied'));

    // Populate Sub-Pharmacy B table
    const subPharmacyBBody = document.getElementById('reports-body-3');
    createRow(subPharmacyBBody, 1, 'ចំនួននៅសល់ដើមខែ', getMonthlyData(reports, 'sub_pharmacy_b_remaining_start'));
    createRow(subPharmacyBBody, 2, 'ចំនួនបិទ សរុប', getMonthlyData(reports, 'sub_pharmacy_b_closed'));
    createRow(subPharmacyBBody, 3, 'ចំនួនបិទ ដោយវិធានការ', getMonthlyData(reports, 'sub_pharmacy_b_closed_by_measure'));
    createRow(subPharmacyBBody, 4, 'សរុបចំនួនចុងខែ', getMonthlyData(reports, 'sub_pharmacy_b_total_end_of_month'));
    createRow(subPharmacyBBody, 5, 'ចំនួនបន្តសុពលភាព', getMonthlyData(reports, 'sub_pharmacy_b_renew'));
    createRow(subPharmacyBBody, 6, 'ចំនួនពិន័យអន្តរការណ៍', getMonthlyData(reports, 'sub_pharmacy_b_penaltied'));
    
    // Populate Herbal table
    const herbalBody = document.getElementById('reports-body-4');
    createRow(herbalBody, 1, 'ចំនួននៅសល់ដើមខែ', getMonthlyData(reports, 'herbal_remaining_start'));
    createRow(herbalBody, 2, 'ចំនួនបើកថ្មី', getMonthlyData(reports, 'herbal_open'));
    createRow(herbalBody, 3, 'ចំនួនបិទ សរុប', getMonthlyData(reports, 'herbal_closed'));
    createRow(herbalBody, 4, 'ចំនួនបិទ ដោយវិធានការ', getMonthlyData(reports, 'herbal_closed_by_measure'));
    createRow(herbalBody, 5, 'សរុបចំនួនចុងខែ', getMonthlyData(reports, 'herbal_total_end_of_month'));
    createRow(herbalBody, 6, 'ចំនួនបន្តសុពលភាព', getMonthlyData(reports, 'herbal_renew_validity'));
    createRow(herbalBody, 7, 'ចំនួនប្តូរឱសថការី ប្តូរម្ចាស់ទុន ប្តូរទីតាំង', getMonthlyData(reports, 'herbal_renew_changes'));
    createRow(herbalBody, 8, 'ចំនួនពិន័យអន្តរការណ៍', getMonthlyData(reports, 'herbal_penaltied'));
}