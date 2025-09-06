// Replace with your Supabase credentials
const SUPABASE_URL = 'https://xoohqmmszipymrivmtae.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhvb2hxbW1zemlweW1yaXZtdGFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxMzU2NjAsImV4cCI6MjA3MjcxMTY2MH0.P5Lz3k5SbHWXhYWXFjCSXkyfxjZrB7nsMPmkQhF9LvI';

// A simple endpoint to check if the Supabase service is ready
const PING_URL = `${SUPABASE_URL}/rest/v1/health_reports_data?limit=1`;

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
    const loadingScreen = document.getElementById('loading-screen');
    const formContainer = document.getElementById('form-container');
    const form = document.getElementById('health-report-form');

    async function checkServerStatus() {
        try {
            const response = await fetch(PING_URL, {
                method: 'GET',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            });

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
        
        // Prepare the payload for Supabase
        const payload = {
            province: data.province,
            "report-month": `${data.report_month}-01`,
            "pharmacy-m-open": parseInt(data.pharmacy_open, 10),
            "pharmacy-m-renew": parseInt(data.pharmacy_renew, 10),
            "pharmacy-m-closed": parseInt(data.pharmacy_closed, 10),
            "pharmacy-m-total": parseInt(data.pharmacy_total, 10),
            "pharmacy-a-open": parseInt(data.sub_pharmacy_a_open, 10),
            "pharmacy-a-renew": parseInt(data.sub_pharmacy_a_renew, 10),
            "pharmacy-a-closed": parseInt(data.sub_pharmacy_a_closed, 10),
            "pharmacy-a-total": parseInt(data.sub_pharmacy_a_total, 10),
            "pharmacy-b-open": parseInt(data.sub_pharmacy_b_open, 10),
            "pharmacy-b-renew": parseInt(data.sub_pharmacy_b_renew, 10),
            "pharmacy-b-closed": parseInt(data.sub_pharmacy_b_closed, 10),
            "pharmacy-b-total": parseInt(data.sub_pharmacy_b_total, 10),
            "herbal-open": parseInt(data.herbal_open, 10),
            "herbal-renew": parseInt(data.herbal_renew, 10),
            "herbal-closed": parseInt(data.herbal_closed, 10),
            "herbal-total": parseInt(data.herbal_total, 10)
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