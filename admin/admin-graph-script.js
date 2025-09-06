// Replace with your Supabase credentials
const SUPABASE_URL = 'https://xoohqmmszipymrivmtae.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhvb2hxbW1zemlweW1yaXZtdGFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxMzU2NjAsImV4cCI6MjA3MjcxMTY2MH0.P5Lz3k5SbHWXhYWXFjCSXkyfxjZrB7nsMPmkQhF9LvI';
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/get-reports`;

document.addEventListener('DOMContentLoaded', () => {
    const provinceSelector = document.getElementById('province-selector');
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

    provinceSelector.addEventListener('change', () => {
        const selectedProvince = provinceSelector.value;
        const selectedYear = yearSelector.value;
        if (selectedProvince && selectedYear) {
            fetchAndDisplayGraph(selectedProvince, selectedYear);
        }
    });

    yearSelector.addEventListener('change', () => {
        const selectedProvince = provinceSelector.value;
        const selectedYear = yearSelector.value;
        if (selectedProvince && selectedYear) {
            fetchAndDisplayGraph(selectedProvince, selectedYear);
        }
    });

    // Fetch and display data on initial load
    fetchAndDisplayGraph(provinceSelector.value, yearSelector.value);
});

async function fetchAndDisplayGraph(province, year) {
    const url = `${FUNCTION_URL}?province=${province}&year=${year}`;
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
                drawGraph(reports);
            } else {
                // Clear the graph if no data is found
                d3.select("#bar-chart").selectAll("*").remove();
                d3.select("#bar-chart").append("text")
                    .attr("x", "50%")
                    .attr("y", "50%")
                    .attr("text-anchor", "middle")
                    .attr("font-size", "16px")
                    .attr("fill", "#555")
                    .text("មិនមានទិន្នន័យសម្រាប់ខែនេះទេ។");
            }
        } else {
            console.error('Error fetching data:', response.statusText);
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function drawGraph(data) {
    // Clean old graph
    d3.select("#bar-chart").selectAll("*").remove();

    const svg = d3.select("#bar-chart"),
        margin = {top: 20, right: 20, bottom: 30, left: 40},
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom;
    
    const x = d3.scaleBand().rangeRound([0, width]).padding(0.1),
        y = d3.scaleLinear().rangeRound([height, 0]);

    const g = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    const months = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
    
    // Convert data for the graph
    const transformedData = data.map(d => ({
        month: d.report_month,
        open: d.pharmacy_open + d.sub_pharmacy_a_open + d.herbal_open,
        closed: d.pharmacy_closed + d.sub_pharmacy_a_closed + d.herbal_closed,
        renewed: d.pharmacy_renew_validity + d.sub_pharmacy_a_renew_validity + d.herbal_renew_validity + d.sub_pharmacy_b_renew
    }));
    
    const categories = ['open', 'closed', 'renewed'];
    const colors = {
        open: "#28a745",
        closed: "#dc3545",
        renewed: "#ffc107"
    };

    x.domain(months);
    y.domain([0, d3.max(transformedData, d => d3.max(categories, c => d[c]))]);

    g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    g.append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft(y).ticks(10));
    
    const month = g.selectAll(".month")
      .data(transformedData)
      .enter().append("g")
        .attr("class", "g")
        .attr("transform", d => "translate(" + x(d.month) + ",0)");

    month.selectAll("rect")
      .data(d => categories.map(c => ({key: c, value: d[c]})))
      .enter().append("rect")
        .attr("x", (d, i) => i * x.bandwidth() / categories.length)
        .attr("y", d => y(d.value))
        .attr("width", x.bandwidth() / categories.length)
        .attr("height", d => height - y(d.value))
        .attr("fill", d => colors[d.key]);
}