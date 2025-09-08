// Replace with your Supabase credentials
const SUPABASE_URL = 'https://xoohqmmszipymrivmtae.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhvb2hxbW1zemlweW1yaXZtdGFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxMzU2NjAsImV4cCI6MjA3MjcxMTY2MH0.P5Lz3k5SbHWXhYWXFjCSXkyfxjZrB7nsMPmkQhF9LvI';
const MONTHLY_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/get-monthly-report`;
const NATIONAL_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/get-national-reports`;

let monthlyChart = null;
let yearlyChart = null;

document.addEventListener('DOMContentLoaded', () => {
    const provinceSelector = document.getElementById('province-selector');
    const monthSelector = document.getElementById('month-selector');
    const yearSelector = document.getElementById('year-selector');

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
    fetchAndDisplayGraphs(provinceSelector.value, yearSelector.value);

    // Add event listeners
    provinceSelector.addEventListener('change', () => {
        fetchAndDisplayGraphs(provinceSelector.value, yearSelector.value);
    });

    yearSelector.addEventListener('change', () => {
        fetchAndDisplayGraphs(provinceSelector.value, yearSelector.value);
    });

    monthSelector.addEventListener('change', () => {
        const reports = window.reportsData;
        const selectedMonth = monthSelector.value;
        if (reports) {
            drawMonthlyGraph(reports, selectedMonth);
        }
    });
});

async function fetchAndDisplayGraphs(province, year) {
    // Fetch and display provincial data (monthly graph)
    await fetchAndDisplayMonthlyGraph(province, year);
    
    // Fetch and display national data (yearly graph)
    await fetchAndDisplayNationalGraph(year);
}

async function fetchAndDisplayMonthlyGraph(province, year) {
    const url = `${MONTHLY_FUNCTION_URL}?province=${province}&year=${year}`;
    const chartContainer = document.getElementById('chart-container-monthly');
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
            window.reportsData = reports; 
            const selectedMonth = document.getElementById('month-selector').value;
            if (reports && reports.length > 0) {
                drawMonthlyGraph(reports, selectedMonth);
            } else {
                chartContainer.innerHTML = '<canvas id="monthly-chart"></canvas>';
                const ctx = document.getElementById('monthly-chart').getContext('2d');
                ctx.font = '16px Hanuman';
                ctx.fillStyle = '#555';
                ctx.textAlign = 'center';
                ctx.fillText('មិនមានទិន្នន័យសម្រាប់ខែនេះទេ។', chartContainer.offsetWidth / 2, chartContainer.offsetHeight / 2);
            }
        } else {
            console.error('Error fetching data:', response.status, await response.text());
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

async function fetchAndDisplayNationalGraph(year) {
    const url = `${NATIONAL_FUNCTION_URL}?year=${year}`;
    const chartContainer = document.getElementById('chart-container-yearly');
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
            if (reports && reports.length > 0) {
                drawYearlyGraph(reports[0]);
            } else {
                chartContainer.innerHTML = '<canvas id="yearly-chart"></canvas>';
                const ctx = document.getElementById('yearly-chart').getContext('2d');
                ctx.font = '16px Hanuman';
                ctx.fillStyle = '#555';
                ctx.textAlign = 'center';
                ctx.fillText('មិនមានទិន្នន័យសម្រាប់ឆ្នាំនេះទេ។', chartContainer.offsetWidth / 2, chartContainer.offsetHeight / 2);
            }
        } else {
            console.error('Error fetching national data:', response.status, await response.text());
        }
    } catch (error) {
        console.error('Error fetching national data:', error);
    }
}


function drawMonthlyGraph(data, selectedMonth) {
    const canvas = document.getElementById('monthly-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (monthlyChart) {
        monthlyChart.destroy();
    }

    const monthlyReport = data.find(d => d.report_month === selectedMonth) || {};

    const chartData = {
        labels: ['ឱសថស្ថាន', 'ឱសថស្ថានរង «ក»', 'ឱសថស្ថានរង «ខ»', 'អគារលក់ឱសថបុរាណ'],
        datasets: [{
            label: 'ចំនួនសរុបប្រចាំខែ',
            data: [
                monthlyReport.pharmacy_total_end_of_month || 0,
                monthlyReport.sub_pharmacy_a_total_end_of_month || 0,
                monthlyReport.sub_pharmacy_b_total_end_of_month || 0,
                monthlyReport.herbal_total_end_of_month || 0
            ],
            backgroundColor: '#004a91',
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'ចំនួន',
                    font: {
                        family: 'Hanuman',
                        size: 16
                    }
                }
            },
            x: {
                title: {
                    display: true,
                    text: 'ប្រភេទ',
                    font: {
                        family: 'Hanuman',
                        size: 16
                    }
                }
            }
        },
        plugins: {
            legend: {
                display: false
            }
        }
    };

    monthlyChart = new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: chartOptions,
    });
}

function drawYearlyGraph(data) {
    const canvas = document.getElementById('yearly-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (yearlyChart) {
        yearlyChart.destroy();
    }

    const chartData = {
        labels: ['បើកថ្មី', 'បន្តសុពលភាព', 'ប្តូរទីតាំង', 'បិទសរុប', 'បិទដោយវិធានការ', 'ករណីពិន័យអន្តរការណ៍'],
        datasets: [{
            label: 'ចំនួនសរុបប្រចាំឆ្នាំ',
            data: [
                data.open || 0,
                data.renew_validity || 0,
                data.renew_changes || 0,
                data.closed || 0,
                data.closed_by_measure || 0,
                data.penaltied || 0,
            ],
            backgroundColor: '#1b64b1',
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'ចំនួន',
                    font: {
                        family: 'Hanuman',
                        size: 16
                    }
                }
            },
            x: {
                title: {
                    display: true,
                    text: 'ប្រភេទនៃសកម្មភាព',
                    font: {
                        family: 'Hanuman',
                        size: 16
                    }
                }
            }
        },
        plugins: {
            legend: {
                display: false
            }
        }
    };

    yearlyChart = new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: chartOptions,
    });
}
