// Replace with your Supabase credentials
const FUNCTION_URL = 'https://xoohqmmszipymrivmtae.supabase.co/functions/v1/hyper-action';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

document.addEventListener('DOMContentLoaded', () => {
    const loadingScreen = document.getElementById('loading-screen');
    const formContainer = document.getElementById('form-container');
    const form = document.getElementById('health-report-form');

    const monthNames = {
        '01': 'មករា', '02': 'កុម្ភៈ', '03': 'មីនា', '04': 'មេសា',
        '05': 'ឧសភា', '06': 'មិថុនា', '07': 'កក្កដា', '08': 'សីហា',
        '09': 'កញ្ញា', '10': 'តុលា', '11': 'វិច្ឆិកា', '12': 'ធ្នូ'
    };

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
            const response = await fetch(FUNCTION_URL, {
                method: 'OPTIONS',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'apikey': SUPABASE_ANON_KEY
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

    const provinceSelect = document.getElementById('province');
    const monthSelect = document.getElementById('report-month');
    const yearInput = document.getElementById('report-year');

    [provinceSelect, monthSelect, yearInput].forEach(input => {
        input.addEventListener('change', async () => {
            const province = provinceSelect.value;
            const month = monthSelect.value;
            const year = yearInput.value;

            if (province && month && year) {
                const url = `${FUNCTION_URL}?province=${province}&month=${month}&year=${year}`;
                try {
                    const response = await fetch(url, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                            'apikey': SUPABASE_ANON_KEY
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        if (data && data.length > 0) {
                            const prevMonthData = data[0];
                            document.getElementById('pharmacy_remaining_start').value = prevMonthData.pharmacy_total_end_of_month;
                            document.getElementById('sub_pharmacy_a_remaining_start').value = prevMonthData.sub_pharmacy_a_total_end_of_month;
                            document.getElementById('sub_pharmacy_b_remaining_start').value = prevMonthData.sub_pharmacy_b_total_end_of_month;
                            document.getElementById('herbal_remaining_start').value = prevMonthData.herbal_total_end_of_month;
                        } else {
                            // If no data is found, set the 'remaining start' fields to 0
                            document.getElementById('pharmacy_remaining_start').value = 0;
                            document.getElementById('sub_pharmacy_a_remaining_start').value = 0;
                            document.getElementById('sub_pharmacy_b_remaining_start').value = 0;
                            document.getElementById('herbal_remaining_start').value = 0;
                            console.log('No data found for the previous month. Setting start values to 0.');
                        }
                    }
                } catch (error) {
                    console.error('Error fetching previous month data:', error);
                }
            }
        });
    });


    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

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
            pharmacy_total_end_of_month: parseInt(data.pharmacy_total_end_of_month, 10),
            sub_pharmacy_a_remaining_start: parseInt(data.sub_pharmacy_a_remaining_start, 10),
            sub_pharmacy_a_open: parseInt(data.sub_pharmacy_a_open, 10),
            sub_pharmacy_a_renew_validity: parseInt(data.sub_pharmacy_a_renew_validity, 10),
            sub_pharmacy_a_renew_changes: parseInt(data.sub_pharmacy_a_renew_changes, 10),
            sub_pharmacy_a_closed: parseInt(data.sub_pharmacy_a_closed, 10),
            sub_pharmacy_a_closed_by_measure: parseInt(data.sub_pharmacy_a_closed_by_measure, 10),
            sub_pharmacy_a_penaltied: parseInt(data.sub_pharmacy_a_penaltied, 10),
            sub_pharmacy_a_total_end_of_month: parseInt(data.sub_pharmacy_a_total_end_of_month, 10),
            sub_pharmacy_b_remaining_start: parseInt(data.sub_pharmacy_b_remaining_start, 10),
            sub_pharmacy_b_renew: parseInt(data.sub_pharmacy_b_renew, 10),
            sub_pharmacy_b_closed: parseInt(data.sub_pharmacy_b_closed, 10),
            sub_pharmacy_b_closed_by_measure: parseInt(data.sub_pharmacy_b_closed_by_measure, 10),
            sub_pharmacy_b_penaltied: parseInt(data.sub_pharmacy_b_penaltied, 10),
            sub_pharmacy_b_total_end_of_month: parseInt(data.sub_pharmacy_b_total_end_of_month, 10),
            herbal_remaining_start: parseInt(data.herbal_remaining_start, 10),
            herbal_open: parseInt(data.herbal_open, 10),
            herbal_renew_validity: parseInt(data.herbal_renew_validity, 10),
            herbal_renew_changes: parseInt(data.herbal_renew_changes, 10),
            herbal_closed: parseInt(data.herbal_closed, 10),
            herbal_closed_by_measure: parseInt(data.herbal_closed_by_measure, 10),
            herbal_penaltied: parseInt(data.herbal_penaltied, 10),
            herbal_total_end_of_month: parseInt(data.herbal_total_end_of_month, 10)
        };
        
        try {
            const response = await fetch(FUNCTION_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'apikey': SUPABASE_ANON_KEY
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!response.ok) {
                console.error('Error submitting form:', result.error);
                alert('An error occurred. Please try again.');
            } else {
                console.log('Form submitted successfully:', result);
                alert('Form submitted successfully!');
                form.reset();
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('An error occurred. Please try again.');
        }
    });
});