// Replace with your Supabase credentials
const SUPABASE_URL = 'https://xoohqmmszipymrivmtae.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhvb2hxbW1zemlweW1yaXZtdGFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxMzU2NjAsImV4cCI6MjA3MjcxMTY2MH0.P5Lz3k5SbHWXhYWXFjCSXkyfxjZrB7nsMPmkQhF9LvI';

// A simple endpoint to check if the Supabase service is ready
// This URL will be different depending on your table name. Let's use 'health_reports_final'
const PING_URL = `${SUPABASE_URL}/rest/v1/health_reports_data?select=id&limit=1`;

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
    const loadingScreen = document.getElementById('loading-screen');
    const formContainer = document.getElementById('form-container');
    const form = document.getElementById('health-report-form');

    function calculateTotal(remaining, opened, closed) {
        const remainingVal = parseInt(remaining.value, 10) || 0;
        const openedVal = parseInt(opened.value, 10) || 0;
        const closedVal = parseInt(closed.value, 10) || 0;
        return (remainingVal + openedVal) - closedVal;
    }

    // Attach event listeners for real-time calculation
    const pharmacyInputs = document.querySelectorAll('#pharmacy_remaining_start, #pharmacy_open, #pharmacy_closed');
    const pharmacyOutput = document.getElementById('pharmacy_total_end_of_month');
    pharmacyInputs.forEach(input => {
        input.addEventListener('input', () => {
            const result = calculateTotal(
                document.getElementById('pharmacy_remaining_start'),
                document.getElementById('pharmacy_open'),
                document.getElementById('pharmacy_closed')
            );
            pharmacyOutput.value = result;
        });
    });

    const subPharmacyAInputs = document.querySelectorAll('#sub_pharmacy_a_remaining_start, #sub_pharmacy_a_open, #sub_pharmacy_a_closed');
    const subPharmacyAOutput = document.getElementById('sub_pharmacy_a_total_end_of_month');
    subPharmacyAInputs.forEach(input => {
        input.addEventListener('input', () => {
            const result = calculateTotal(
                document.getElementById('sub_pharmacy_a_remaining_start'),
                document.getElementById('sub_pharmacy_a_open'),
                document.getElementById('sub_pharmacy_a_closed')
            );
            subPharmacyAOutput.value = result;
        });
    });
    
    const subPharmacyBInputs = document.querySelectorAll('#sub_pharmacy_b_remaining_start, #sub_pharmacy_b_open, #sub_pharmacy_b_closed');
    const subPharmacyBOutput = document.getElementById('sub_pharmacy_b_total_end_of_month');
    subPharmacyBInputs.forEach(input => {
        input.addEventListener('input', () => {
            const result = calculateTotal(
                document.getElementById('sub_pharmacy_b_remaining_start'),
                document.getElementById('sub_pharmacy_b_open'),
                document.getElementById('sub_pharmacy_b_closed')
            );
            subPharmacyBOutput.value = result;
        });
    });

    const herbalInputs = document.querySelectorAll('#herbal_remaining_start, #herbal_open, #herbal_closed');
    const herbalOutput = document.getElementById('herbal_total_end_of_month');
    herbalInputs.forEach(input => {
        input.addEventListener('input', () => {
            const result = calculateTotal(
                document.getElementById('herbal_remaining_start'),
                document.getElementById('herbal_open'),
                document.getElementById('herbal_closed')
            );
            herbalOutput.value = result;
        });
    });

    async function checkServerStatus() {
        try {
            const response = await fetch(PING_URL, {
                method: 'GET',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            });

            // Simply check if the response status is okay (e.g., 200-299)
            if (response.ok) {
                console.log('Server is live.');
                loadingScreen.style.display = 'none';
                formContainer.style.display = 'block';
            } else {
                throw new Error('Server not ready');
            }
        } catch (error) {
            console.error('Server check failed. Retrying...', error);
            setTimeout(checkServerStatus, 5000);
        }
    }
    checkServerStatus();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        const monthNames = {
            '01': 'មករា', '02': 'កុម្ភៈ', '03': 'មីនា', '04': 'មេសា',
            '05': 'ឧសភា', '06': 'មិថុនា', '07': 'កក្កដា', '08': 'សីហា',
            '09': 'កញ្ញា', '10': 'តុលា', '11': 'វិច្ឆិកា', '12': 'ធ្នូ'
        };

        const payload = {
            province: data.province,
            report_month: monthNames[data.report_month],
            report_year: parseInt(data.report_year, 10),
            pharmacy_remaining_start: parseInt(data.pharmacy_remaining_start, 10),
            pharmacy_open: parseInt(data.pharmacy_open, 10),
            pharmacy_renew_validity: parseInt(data.pharmacy_renew_validity, 10),
            pharmacy_renew_changes: parseInt(data.pharmacy_renew_changes, 10),
            pharmacy_closed: parseInt(data.pharmacy_closed, 10),
            pharmacy_closed_by_measure: parseInt(data.pharmacy_closed_by_measure, 10),
            pharmacy_penaltied: parseInt(data.pharmacy_penaltied, 10),
            sub_pharmacy_a_remaining_start: parseInt(data.sub_pharmacy_a_remaining_start, 10),
            sub_pharmacy_a_open: parseInt(data.sub_pharmacy_a_open, 10),
            sub_pharmacy_a_renew_validity: parseInt(data.sub_pharmacy_a_renew_validity, 10),
            sub_pharmacy_a_renew_changes: parseInt(data.sub_pharmacy_a_renew_changes, 10),
            sub_pharmacy_a_closed: parseInt(data.sub_pharmacy_a_closed, 10),
            sub_pharmacy_a_closed_by_measure: parseInt(data.sub_pharmacy_a_closed_by_measure, 10),
            sub_pharmacy_a_penaltied: parseInt(data.sub_pharmacy_a_penaltied, 10),
            sub_pharmacy_b_remaining_start: parseInt(data.sub_pharmacy_b_remaining_start, 10),
            sub_pharmacy_b_renew: parseInt(data.sub_pharmacy_b_renew, 10),
            sub_pharmacy_b_closed: parseInt(data.sub_pharmacy_b_closed, 10),
            sub_pharmacy_b_closed_by_measure: parseInt(data.sub_pharmacy_b_closed_by_measure, 10),
            sub_pharmacy_b_penaltied: parseInt(data.sub_pharmacy_b_penaltied, 10),
            herbal_remaining_start: parseInt(data.herbal_remaining_start, 10),
            herbal_open: parseInt(data.herbal_open, 10),
            herbal_renew_validity: parseInt(data.herbal_renew_validity, 10),
            herbal_renew_changes: parseInt(data.herbal_renew_changes, 10),
            herbal_closed: parseInt(data.herbal_closed, 10),
            herbal_closed_by_measure: parseInt(data.herbal_closed_by_measure, 10),
            herbal_penaltied: parseInt(data.herbal_penaltied, 10),
        };
        
        const { data: insertedData, error } = await supabase
            .from('health_reports_data')
            .insert([payload]);

        if (error) {
            console.error('Error submitting form:', error);
            alert('An error occurred. Please try again.');
        } else {
            console.log('Form submitted successfully:', insertedData);
            alert('Form submitted successfully!');
            form.reset();
        }
    });
});



// Supabase client creation function (to be included in your script.js)
function createClient(supabaseUrl, supabaseKey) {
    return {
        from: (tableName) => ({
            insert: (records) => {
                const url = `${supabaseUrl}/rest/v1/${tableName}`;
                const headers = {
                    'Content-Type': 'application/json',
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`
                };

                return fetch(url, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(records)
                }).then(response => response.json().then(data => ({
                    data: response.ok ? data : null,
                    error: response.ok ? null : data
                })));
            }
        })
    };
}